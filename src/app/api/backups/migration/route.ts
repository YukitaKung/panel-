import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { isValidIdentifier } from "@/lib/db-utils";
import { escapeShellArg, escapeShellArg as shellArg } from "@/lib/utils";

const execAsync = promisify(exec);
const BACKUP_DIR = "/var/www/backups";
const STAGING_DIR = "/home/hostpanel/migration-staging";

export async function POST() {
  try {
    await fs.rm(STAGING_DIR, { recursive: true, force: true });
    await fs.mkdir(path.join(STAGING_DIR, "mysql"), { recursive: true });
    await fs.mkdir(path.join(STAGING_DIR, "postgres"), { recursive: true });
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const [mysqlResult, postgresResult] = await Promise.all([
      execAsync("sudo mysql -NBe 'SHOW DATABASES;'").catch(() => ({ stdout: "" })),
      execAsync("sudo -u postgres psql -Atc \"SELECT datname FROM pg_database WHERE datallowconn AND NOT datistemplate;\"").catch(() => ({ stdout: "" })),
    ]);
    const mysqlSystem = new Set(["information_schema", "mysql", "performance_schema", "sys"]);
    const mysqlDatabases = mysqlResult.stdout.split(/\r?\n/).map((x) => x.trim()).filter((x) => isValidIdentifier(x) && !mysqlSystem.has(x));
    const postgresDatabases = postgresResult.stdout.split(/\r?\n/).map((x) => x.trim()).filter((x) => isValidIdentifier(x) && x !== "postgres");
    const manifest = { mysql: [], postgres: [], createdAt: new Date().toISOString() } as { mysql: { database: string; path: string }[]; postgres: { database: string; path: string }[]; createdAt: string };

    for (const database of mysqlDatabases) {
      const output = path.join(STAGING_DIR, "mysql", `${database}.sql`);
      await execAsync(`sudo mysqldump --single-transaction --routines --events --triggers ${shellArg(database)} > ${shellArg(output)}`, { timeout: 30 * 60 * 1000 });
      manifest.mysql.push({ database, path: `home/hostpanel/migration-staging/mysql/${database}.sql` });
    }
    for (const database of postgresDatabases) {
      const output = path.join(STAGING_DIR, "postgres", `${database}.sql`);
      await execAsync(`sudo -u postgres pg_dump --format=plain --no-owner --no-privileges ${shellArg(database)} > ${shellArg(output)}`, { timeout: 30 * 60 * 1000 });
      manifest.postgres.push({ database, path: `home/hostpanel/migration-staging/postgres/${database}.sql` });
    }
    await fs.writeFile(path.join(STAGING_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), { mode: 0o600 });

    const filename = `migration-${Date.now()}.tar.gz`;
    const fullPath = path.join(BACKUP_DIR, filename);
    const paths = [
      "/var/www/apps", "/var/www/domains", "/etc/nginx/sites-available", "/etc/nginx/sites-enabled", "/etc/nginx/nginx.conf",
      path.join(process.cwd(), "dev.db"), path.join(process.cwd(), ".env"), path.join(process.cwd(), "data", "subdomains.json"), STAGING_DIR,
    ];
    const existing = [];
    for (const item of paths) { if (await fs.access(item).then(() => true).catch(() => false)) existing.push(item); }
    const command = ["sudo", "tar", "--exclude=node_modules", "--exclude=.next", "--exclude=.cache", "-czf", fullPath, ...existing].map(escapeShellArg).join(" ");
    await execAsync(command, { timeout: 60 * 60 * 1000 });
    const stats = await fs.stat(fullPath);
    const backup = await db.backup.create({ data: { name: filename, type: "Migration", size: `${(stats.size / 1048576).toFixed(2)} MB`, status: "Completed", path: fullPath } });
    return NextResponse.json({ success: true, backup, mysql: manifest.mysql.length, postgres: manifest.postgres.length });
  } catch (error: any) {
    console.error("Migration backup error:", error);
    return NextResponse.json({ error: error.message || "Migration backup failed" }, { status: 500 });
  } finally {
    await fs.rm(STAGING_DIR, { recursive: true, force: true }).catch(() => {});
  }
}
