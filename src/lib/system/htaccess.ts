import { promises as fs } from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const DOMAINS_ROOT = "/var/www/domains";
const NGINX_SITES = "/etc/nginx/sites-available";
const NGINX_SNIPPETS = "/etc/nginx/snippets";

function validDomain(domain: string) {
  return /^[a-zA-Z0-9.-]+$/.test(domain);
}

function assertSafeValue(value: string) {
  if (!value || /[;{}"`#]/.test(value)) {
    throw new Error("Unsupported unsafe .htaccess value");
  }
}

function nginxPattern(pattern: string, caseInsensitive: boolean) {
  assertSafeValue(pattern);
  let result = pattern;
  if (result.startsWith("^/")) {
    // Already an nginx URI pattern.
  } else if (result.startsWith("^")) {
    result = `^/${result.slice(1)}`;
  } else {
    result = `^/${result.replace(/^\/+/, "")}`;
  }
  return caseInsensitive ? `(?i)${result}` : result;
}

function nginxReplacement(replacement: string) {
  assertSafeValue(replacement);
  if (replacement === "-") return replacement;
  if (/^https?:\/\//i.test(replacement) || replacement.startsWith("/")) {
    return replacement;
  }
  return `/${replacement}`;
}

function parseFlags(rawFlags: string) {
  const flags = rawFlags
    .split(",")
    .map((flag) => flag.trim().toUpperCase())
    .filter(Boolean);
  let rewriteFlag = "last";
  let caseInsensitive = false;

  for (const flag of flags) {
    if (flag === "L" || flag === "END") rewriteFlag = "last";
    else if (flag === "NC") caseInsensitive = true;
    else if (flag === "QSA" || flag === "NE") continue;
    else if (flag === "R=301") rewriteFlag = "permanent";
    else if (flag === "R=302" || flag === "R") rewriteFlag = "redirect";
    else throw new Error(`Unsupported RewriteRule flag: ${flag}`);
  }

  return { rewriteFlag, caseInsensitive };
}

export function convertHtaccessToNginx(content: string) {
  const output: string[] = [];
  const pendingConditions: string[] = [];
  const unsupported: string[] = [];
  let ignoredBlock: "files" | "headers" | null = null;
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    if (/^<\/(?:Files|FilesMatch)>$/i.test(line)) {
      ignoredBlock = null;
      continue;
    }
    if (/^<\/IfModule>$/i.test(line)) {
      ignoredBlock = null;
      continue;
    }
    if (/^<(?:Files|FilesMatch)\b/i.test(line)) {
      ignoredBlock = "files";
      continue;
    }
    if (/^<IfModule\s+mod_headers\.c>$/i.test(line)) {
      ignoredBlock = "headers";
      continue;
    }
    if (ignoredBlock === "files") continue;
    if (ignoredBlock === "headers") {
      const header = line.match(/^Header\s+set\s+([A-Za-z0-9-]+)\s+"([^"]+)"$/i);
      if (header && !/[;{}#`]/.test(header[2])) {
        output.push(`add_header ${header[1]} "${header[2]}" always;`);
      } else {
        unsupported.push(line);
      }
      continue;
    }

    let match = line.match(/^RewriteEngine\s+(On|Off)$/i);
    if (match) continue;

    match = line.match(/^RewriteBase\s+\S+$/i);
    if (match) continue;

    match = line.match(/^Options\s+([+-])Indexes$/i);
    if (match) {
      output.push(`autoindex ${match[1] === "+" ? "on" : "off"};`);
      continue;
    }

    match = line.match(/^DirectoryIndex\s+(.+)$/i);
    if (match) {
      const indexes = match[1].trim().split(/\s+/);
      indexes.forEach(assertSafeValue);
      output.push(`index ${indexes.join(" ")};`);
      continue;
    }

    if (/^Deny\s+from\s+all$/i.test(line)) {
      output.push("deny all;");
      continue;
    }
    if (/^Allow\s+from\s+all$/i.test(line)) {
      output.push("allow all;");
      continue;
    }

    match = line.match(/^Redirect\s+(301|302)\s+(\/\S*)\s+(\S+)$/i);
    if (match) {
      const target = nginxReplacement(match[3]);
      output.push(`rewrite ^${match[2]}$ ${target} ${match[1] === "301" ? "permanent" : "redirect"};`);
      continue;
    }

    match = line.match(/^RewriteCond\s+%\{REQUEST_FILENAME\}\s+(!?-?[fd])$/i);
    if (match) {
      pendingConditions.push(match[1].toLowerCase());
      continue;
    }

    if (/^RewriteCond\s+%\{REQUEST_FILENAME\}\.php\s+-f$/i.test(line)) {
      pendingConditions.push("php-file");
      continue;
    }

    match = line.match(/^RewriteRule\s+(\S+)\s+(\S+)(?:\s+\[([^\]]+)\])?$/i);
    if (match) {
      const { rewriteFlag, caseInsensitive } = parseFlags(match[3] || "L");
      const pattern = nginxPattern(match[1], caseInsensitive);
      const replacement = nginxReplacement(match[2]);
      const isFrontController =
        pendingConditions.length === 2 &&
        pendingConditions.includes("!-f") &&
        pendingConditions.includes("!-d") &&
        (match[1] === "." || match[1] === "^.*$");
      const isPhpCleanUrl =
        pendingConditions.length === 2 &&
        pendingConditions.includes("!-d") &&
        pendingConditions.includes("php-file") &&
        /\$1\.php$/i.test(match[2]);

      if (isFrontController && rewriteFlag === "last") {
        output.push(`try_files $uri $uri/ ${replacement}?$query_string;`);
      } else if (isPhpCleanUrl && rewriteFlag === "last") {
        output.push("try_files $uri $uri/ $uri.php?$query_string;");
      } else if (pendingConditions.length > 0) {
        unsupported.push(`RewriteRule with unsupported conditions: ${line}`);
      } else {
        output.push(`rewrite ${pattern} ${replacement} ${rewriteFlag};`);
      }
      pendingConditions.length = 0;
      continue;
    }

    unsupported.push(line);
  }

  if (pendingConditions.length > 0) unsupported.push("RewriteCond without RewriteRule");
  if (unsupported.length > 0) {
    throw new Error(`Unsupported .htaccess directive: ${unsupported[0]}`);
  }

  return output.length > 0 ? `${output.join("\n")}\n` : "# No supported .htaccess directives\n";
}

function domainFromHtaccessPath(filePath: string) {
  const relative = path.relative(DOMAINS_ROOT, filePath);
  const parts = relative.split(path.sep);
  if (parts.length !== 2 || parts[1].toLowerCase() !== ".htaccess" || !validDomain(parts[0])) {
    return null;
  }
  return parts[0];
}

async function readHtaccess(domain: string) {
  const filePath = path.join(DOMAINS_ROOT, domain, ".htaccess");
  return fs.readFile(filePath, "utf8").catch((error: any) => {
    if (error?.code === "ENOENT") return "";
    throw error;
  });
}

export async function syncHtaccessForPath(filePath: string) {
  const domain = domainFromHtaccessPath(filePath);
  if (!domain) return false;

  const sitePath = path.join(NGINX_SITES, domain);
  const snippetPath = path.join(NGINX_SNIPPETS, `htaccess-${domain}.conf`);
  const siteConfig = await fs.readFile(sitePath, "utf8");
  if (!siteConfig.includes("fastcgi_pass")) return false;

  const snippet = convertHtaccessToNginx(await readHtaccess(domain));
  const includeLine = `    include snippets/htaccess-${domain}.conf;`;
  const configWithInclude = siteConfig.includes(includeLine)
    ? siteConfig
    : siteConfig.replace(/(location\s+\/\s*\{)/, `$1\n${includeLine}`);
  const updatedConfig = snippet.includes("try_files")
    ? configWithInclude.replace(/^\s*try_files \$uri \$uri\/ =404;\s*$/m, "")
    : configWithInclude;

  const previousSnippet = await fs.readFile(snippetPath, "utf8").catch(() => null);
  await fs.writeFile(snippetPath, snippet, { mode: 0o640 });
  await fs.writeFile(sitePath, updatedConfig, "utf8");

  try {
    await execFileAsync("sudo", ["nginx", "-t"]);
    await execFileAsync("sudo", ["systemctl", "reload", "nginx"]);
  } catch (error) {
    if (previousSnippet === null) await fs.unlink(snippetPath).catch(() => {});
    else await fs.writeFile(snippetPath, previousSnippet, "utf8");
    await fs.writeFile(sitePath, siteConfig, "utf8");
    throw error;
  }

  return true;
}
