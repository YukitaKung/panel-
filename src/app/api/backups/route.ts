import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const backups = await db.backup.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(backups);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch backups" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, type, targetPath } = await request.json(); // type: "Application" | "Server" | "Database"
    
    // Ensure backup directory exists
    const backupDir = "/var/www/backups";
    await fs.mkdir(backupDir, { recursive: true }).catch(() => {});

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${type.toLowerCase()}-${name.replace(/[^a-zA-Z0-9]/g, "-")}-${timestamp}.tar.gz`;
    const fullPath = path.join(backupDir, filename);

    // Create DB entry (pending)
    const backup = await db.backup.create({
      data: {
        name: filename,
        type,
        size: "Pending...",
        status: "Processing",
        path: fullPath
      }
    });

    // Run backup in background
    Promise.resolve().then(async () => {
      try {
        if (type === "Database") {
          // If it's a database, we might need a different command.
          // For now, if they give a path, we compress that path or .db file
          await execAsync(`sudo tar -czf ${fullPath} ${targetPath}`);
        } else {
          // Application or Server (Subdomain)
          await execAsync(`sudo tar -czf ${fullPath} ${targetPath}`);
        }
        
        // Update size
        const stats = await fs.stat(fullPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2) + " MB";

        await db.backup.update({
          where: { id: backup.id },
          data: { status: "Completed", size: sizeMB }
        });

        // Notify
        await db.notification.create({
          data: {
            title: "Backup Completed",
            message: `Backup ${filename} created successfully.`,
            type: "success"
          }
        });

      } catch (err: any) {
        console.error("Backup process error:", err);
        await db.backup.update({
          where: { id: backup.id },
          data: { status: "Error" }
        });
        await db.notification.create({
          data: {
            title: "Backup Failed",
            message: `Failed to create backup ${filename}.`,
            type: "error"
          }
        });
      }
    });

    return NextResponse.json({ success: true, backup });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to start backup" }, { status: 500 });
  }
}
