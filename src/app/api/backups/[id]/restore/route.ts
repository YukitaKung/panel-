import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backup = await db.backup.findUnique({ where: { id } });

    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    const { targetPath } = await request.json();

    if (!targetPath) {
      return NextResponse.json({ error: "Target path required for restore" }, { status: 400 });
    }

    // Check if backup file exists
    try {
      await fs.access(backup.path);
    } catch {
      return NextResponse.json({ error: "Backup file not found on disk" }, { status: 404 });
    }

    // Run restore in background
    Promise.resolve().then(async () => {
      try {
        // Create target directory if it doesn't exist
        await fs.mkdir(targetPath, { recursive: true }).catch(() => {});

        // Extract tar.gz to root directory (tar naturally strips leading '/' during creation)
        await execAsync(`sudo tar -xzf ${backup.path} -C /`);

        // If it's a full system backup or contains config, restart services
        if (backup.type === "Full System" || backup.type === "Advanced") {
          try {
            await execAsync("sudo systemctl reload nginx");
            
            // Because we excluded node_modules and .next, we need to rebuild the apps
            const apps = await db.application.findMany();
            for (const app of apps) {
              try {
                const appDir = `/var/www/apps/${app.id}`;
                // Check if directory exists
                await fs.access(appDir);
                await execAsync(`cd ${appDir} && npm install && npm run build`);
                // Ensure the app is running in pm2
                try {
                  await execAsync(`pm2 restart app-${app.id}`);
                } catch {
                  await execAsync(`cd ${appDir} && pm2 start npm --name "app-${app.id}" -- start`);
                }
              } catch (e) {
                console.error(`Failed to rebuild/restart app ${app.name} after restore:`, e);
              }
            }
            
            await execAsync("pm2 save");
          } catch (e) {
            console.error("Failed to restart services after restore:", e);
          }
        }

        await db.notification.create({
          data: {
            title: "Restore Completed",
            message: `Backup ${backup.name} successfully restored to original location.`,
            type: "success"
          }
        });
      } catch (err: any) {
        console.error("Restore process error:", err);
        await db.notification.create({
          data: {
            title: "Restore Failed",
            message: `Failed to restore backup ${backup.name}.`,
            type: "error"
          }
        });
      }
    });

    return NextResponse.json({ success: true, message: "Restore started" });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to start restore" }, { status: 500 });
  }
}
