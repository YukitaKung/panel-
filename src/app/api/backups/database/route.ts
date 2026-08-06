import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { isValidIdentifier } from "@/lib/db-utils";
import { escapeShellArg } from "@/lib/utils";

const execAsync = promisify(exec);
const BACKUP_DIR = "/var/www/backups";

export async function POST(request: Request) {
  try {
    const { engine, database } = await request.json();
    if (!isValidIdentifier(database) || !["mysql", "postgres"].includes(engine)) {
      return NextResponse.json({ error: "Invalid database engine or name" }, { status: 400 });
    }

    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const filename = `db-${engine}-${database}-${Date.now()}.sql.gz`;
    const fullPath = path.join(BACKUP_DIR, filename);
    const quotedDatabase = escapeShellArg(database);
    const quotedPath = escapeShellArg(fullPath);
    const command = engine === "mysql"
      ? `sudo mysqldump --single-transaction --routines --events --triggers ${quotedDatabase} | gzip > ${quotedPath}`
      : `sudo -u postgres pg_dump --format=plain --no-owner --no-privileges ${quotedDatabase} | gzip > ${quotedPath}`;

    await execAsync(command, { timeout: 30 * 60 * 1000 });
    const stats = await fs.stat(fullPath);
    const backup = await db.backup.create({
      data: {
        name: filename,
        type: engine === "mysql" ? "MySQL" : "PostgreSQL",
        size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
        status: "Completed",
        path: fullPath,
      },
    });

    return NextResponse.json({ success: true, backup });
  } catch (error: any) {
    console.error("Database backup error:", error);
    return NextResponse.json({ error: error.message || "Failed to create database backup" }, { status: 500 });
  }
}
