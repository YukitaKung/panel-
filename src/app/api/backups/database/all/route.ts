import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { isValidIdentifier } from "@/lib/db-utils";
import { escapeShellArg as shellArg } from "@/lib/utils";

const execAsync = promisify(exec);
const BACKUP_DIR = "/var/www/backups";

async function dumpDatabase(engine: "mysql" | "postgres", database: string) {
  const filename = `db-${engine}-${database}-${Date.now()}.sql.gz`;
  const fullPath = path.join(BACKUP_DIR, filename);
  const quotedDatabase = shellArg(database);
  const command = engine === "mysql"
    ? `sudo mysqldump --single-transaction --routines --events --triggers ${quotedDatabase} | gzip > ${shellArg(fullPath)}`
    : `sudo -u postgres pg_dump --format=plain --no-owner --no-privileges ${quotedDatabase} | gzip > ${shellArg(fullPath)}`;

  await execAsync(command, { timeout: 30 * 60 * 1000 });
  const stats = await fs.stat(fullPath);
  return db.backup.create({
    data: {
      name: filename,
      type: engine === "mysql" ? "MySQL" : "PostgreSQL",
      size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
      status: "Completed",
      path: fullPath,
    },
  });
}

export async function POST() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const [mysqlResult, postgresResult] = await Promise.all([
      execAsync("sudo mysql -NBe 'SHOW DATABASES;'").catch(() => ({ stdout: "" })),
      execAsync("sudo -u postgres psql -Atc \"SELECT datname FROM pg_database WHERE datallowconn AND NOT datistemplate;\"").catch(() => ({ stdout: "" })),
    ]);

    const mysqlSystem = new Set(["information_schema", "mysql", "performance_schema", "sys"]);
    const mysqlDatabases = mysqlResult.stdout.split(/\r?\n/).map((name) => name.trim()).filter((name) => isValidIdentifier(name) && !mysqlSystem.has(name));
    const postgresDatabases = postgresResult.stdout.split(/\r?\n/).map((name) => name.trim()).filter((name) => isValidIdentifier(name) && !["postgres"].includes(name));
    const created = [];
    const errors: string[] = [];

    for (const database of mysqlDatabases) {
      try { created.push(await dumpDatabase("mysql", database)); } catch (error: any) { errors.push(`MySQL ${database}: ${error.message}`); }
    }
    for (const database of postgresDatabases) {
      try { created.push(await dumpDatabase("postgres", database)); } catch (error: any) { errors.push(`PostgreSQL ${database}: ${error.message}`); }
    }

    return NextResponse.json({ success: errors.length === 0, count: created.length, errors });
  } catch (error: any) {
    console.error("All database backup error:", error);
    return NextResponse.json({ error: error.message || "Failed to backup databases" }, { status: 500 });
  }
}
