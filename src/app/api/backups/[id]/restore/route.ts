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

        // Extract tar.gz to target directory
        // Note: tar by default extracts with the same directory structure. 
        // If we backed up /var/www/apps/my-app, extracting it to / might be needed,
        // or extracting with --strip-components.
        // Assuming we backed up the full absolute path, we can extract to / (root) 
        // to restore it exactly where it was.
        await execAsync(`sudo tar -xzf ${backup.path} -C /`);

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
