import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteApp, stopApp } from "@/lib/system/pm2";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const app = await db.application.findUnique({ where: { id } });

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // 1. Stop and Delete PM2 process
    await stopApp(app.name);
    await deleteApp(app.name);

    // 2. Remove files
    const appDir = path.join("/home/okkcom269gmailcom/apps", app.id);
    await execAsync(`rm -rf ${appDir}`).catch(() => {});

    // 3. Delete DB Record
    await db.application.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
