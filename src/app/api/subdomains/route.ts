import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { execAsync, isValidIdentifier } from "@/lib/db-utils";

const dataFile = path.join(process.cwd(), "data", "subdomains.json");

async function getSubdomains() {
  try {
    const data = await fs.readFile(dataFile, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveSubdomains(subdomains: any[]) {
  await fs.writeFile(dataFile, JSON.stringify(subdomains, null, 2));
}

// Ensure the domain is somewhat valid (alphanumeric, dashes, dots)
function isValidDomain(domain: string) {
  return /^[a-zA-Z0-9.-]+$/.test(domain);
}

export async function GET() {
  const subdomains = await getSubdomains();
  return NextResponse.json(subdomains);
}

export async function POST(request: Request) {
  try {
    const { domain, type, port } = await request.json();

    if (!domain || !isValidDomain(domain)) {
      return NextResponse.json({ error: "Invalid domain name" }, { status: 400 });
    }
    if (type !== "php" && type !== "node") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const subdomains = await getSubdomains();
    if (subdomains.find((s: any) => s.domain === domain)) {
      return NextResponse.json({ error: "Domain already exists" }, { status: 400 });
    }

    let nginxConfig = "";

    if (type === "php") {
      // Create web root
      await execAsync(`sudo mkdir -p /var/www/${domain}`);
      await execAsync(`sudo chown -R okkcom269gmailcom:www-data /var/www/${domain}`);
      await execAsync(`sudo chmod -R 775 /var/www/${domain}`);
      
      // We assume php8.3-fpm as installed in setup
      nginxConfig = `
server {
    listen 80;
    server_name ${domain};
    root /var/www/${domain};
    index index.php index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }
}
`;
    } else if (type === "node") {
      const targetPort = parseInt(port, 10);
      if (!targetPort || targetPort < 1 || targetPort > 65535) {
        return NextResponse.json({ error: "Invalid port" }, { status: 400 });
      }

      nginxConfig = `
server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://127.0.0.1:${targetPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
    }

    // Write Nginx config to a temp file, then sudo mv it to sites-available
    const tempFile = path.join(process.cwd(), "data", `${domain}.conf`);
    await fs.writeFile(tempFile, nginxConfig);
    
    await execAsync(`sudo mv ${tempFile} /etc/nginx/sites-available/${domain}`);
    await execAsync(`sudo ln -sf /etc/nginx/sites-available/${domain} /etc/nginx/sites-enabled/`);
    
    // Check Nginx syntax before reloading
    try {
      await execAsync(`sudo nginx -t`);
      await execAsync(`sudo systemctl reload nginx`);
    } catch (nginxError: any) {
      // Rollback if syntax error
      await execAsync(`sudo rm /etc/nginx/sites-enabled/${domain}`);
      await execAsync(`sudo systemctl reload nginx`);
      return NextResponse.json({ error: "Nginx Configuration Error: " + nginxError.message }, { status: 500 });
    }

    // Save to JSON
    const newEntry = {
      domain,
      type,
      port: type === "node" ? port : null,
      createdAt: new Date().toISOString()
    };
    subdomains.push(newEntry);
    await saveSubdomains(subdomains);

    return NextResponse.json({ success: true, subdomain: newEntry });

  } catch (error: any) {
    console.error("Subdomain creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain || !isValidDomain(domain)) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
    }

    let subdomains = await getSubdomains();
    subdomains = subdomains.filter((s: any) => s.domain !== domain);

    // Remove Nginx configs (leave /var/www/domain intact as requested)
    await execAsync(`sudo rm -f /etc/nginx/sites-enabled/${domain}`);
    await execAsync(`sudo rm -f /etc/nginx/sites-available/${domain}`);
    await execAsync(`sudo systemctl reload nginx`);

    await saveSubdomains(subdomains);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Subdomain deletion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
