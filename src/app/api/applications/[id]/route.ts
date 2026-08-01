import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteApp, stopApp } from "@/lib/system/pm2";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const app = await db.application.findUnique({ where: { id } });

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // 1. Stop and Delete PM2 process
    await stopApp(app.name);
    await deleteApp(app.name);

    // 2. Remove files
    const appDir = path.join("/var/www/apps", app.id);
    await execAsync(`sudo rm -rf ${appDir}`).catch(() => {});

    // 3. Delete DB Record
    await db.application.delete({ where: { id } });

    // 4. Auto-cleanup subdomains connected to this app
    try {
      const dataFile = path.join(process.cwd(), "data", "subdomains.json");
      const data = await require("fs/promises").readFile(dataFile, "utf8");
      let subdomains = JSON.parse(data);
      
      const targetStr = `http://127.0.0.1:${app.port}`;
      const toDelete = subdomains.filter((s: any) => s.target === targetStr);
      
      if (toDelete.length > 0) {
        subdomains = subdomains.filter((s: any) => s.target !== targetStr);
        await require("fs/promises").writeFile(dataFile, JSON.stringify(subdomains, null, 2));
        
        // Remove nginx configs
        for (const sub of toDelete) {
          await execAsync(`sudo rm -f /etc/nginx/sites-enabled/${sub.domain}`).catch(() => {});
          await execAsync(`sudo rm -f /etc/nginx/sites-available/${sub.domain}`).catch(() => {});
        }
        await execAsync(`sudo systemctl reload nginx`).catch(() => {});
      }
    } catch (e) {
      console.error("Failed to cleanup subdomains:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
