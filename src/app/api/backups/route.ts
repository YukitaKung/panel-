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
    const payload = await request.json();
    const { name, type, targetPath, options } = payload; 
    
    const backupDir = "/var/www/backups";
    await fs.mkdir(backupDir, { recursive: true }).catch(() => {});

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeName = (name || "backup").replace(/[^a-zA-Z0-9]/g, "-");
    const filename = `backup-${type.toLowerCase()}-${safeName}-${timestamp}.tar.gz`;
    const fullPath = path.join(backupDir, filename);

    const backup = await db.backup.create({
      data: {
        name: filename,
        type: type === "Advanced" ? "Full System" : type,
        size: "Pending...",
        status: "Processing",
        path: fullPath
      }
    });

    Promise.resolve().then(async () => {
      try {
        let pathsToBackup: string[] = [];

        if (type === "Advanced") {
          // Parse advanced options
          const { targets, opts } = options;
          
          if (opts.websiteData) {
            if (targets.all) {
              pathsToBackup.push("/var/www/apps");
              pathsToBackup.push("/var/www/subdomains");
            } else if (targets.selected && targets.selected.length > 0) {
              pathsToBackup.push(...targets.selected);
            }
          }
          
          if (opts.database) {
            pathsToBackup.push(path.join(process.cwd(), "dev.db"));
          }
          
          if (opts.panelConfigs) {
            pathsToBackup.push("/etc/nginx/sites-available");
            pathsToBackup.push("/etc/nginx/sites-enabled");
            // Could also backup pm2 dump file if exists
            pathsToBackup.push(path.join(process.env.HOME || "/root", ".pm2/dump.pm2"));
          }

          // Filter out paths that don't exist to avoid tar errors
          const validPaths = [];
          for (const p of pathsToBackup) {
            try {
              await fs.access(p);
              validPaths.push(p);
            } catch {
              console.warn(`Path not found, skipping in backup: ${p}`);
            }
          }

          if (validPaths.length === 0) {
            throw new Error("No valid paths to backup based on the selected options.");
          }

          await execAsync(`sudo tar -czf ${fullPath} ${validPaths.join(" ")}`);
          
        } else {
          // Standard backup (legacy/simple dialog if we still support it, or default)
          if (targetPath) {
             await execAsync(`sudo tar -czf ${fullPath} ${targetPath}`);
          } else {
             throw new Error("No target path provided for standard backup");
          }
        }
        
        const stats = await fs.stat(fullPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2) + " MB";

        await db.backup.update({
          where: { id: backup.id },
          data: { status: "Completed", size: sizeMB }
        });

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
          data: { status: "Error", size: "Failed" }
        });
        await db.notification.create({
          data: {
            title: "Backup Failed",
            message: `Failed to create backup ${filename}: ${err.message}`,
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
