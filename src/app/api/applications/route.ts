import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startApp } from "@/lib/system/pm2";
import { createNginxProxy } from "@/lib/system/nginx";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const apps = await db.application.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(apps);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, repo, branch, port } = await req.json();

    if (!name || !repo || !port) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create DB Record
    const app = await db.application.create({
      data: {
        name,
        repo,
        branch: branch || "main",
        port: parseInt(port),
        status: "deploying",
      },
    });

    // 2. Clone Repository
    const appsDir = "/home/okkcom269gmailcom/apps";
    const appDir = path.join(appsDir, app.id);
    
    // Asynchronous background deployment
    (async () => {
      try {
        await fs.mkdir(appsDir, { recursive: true });
        await execAsync(`git clone -b ${app.branch} ${repo} ${appDir}`);
        
        // 3. Install and Build
        if (await fs.stat(path.join(appDir, "package.json")).catch(() => false)) {
          await execAsync(`cd ${appDir} && npm install`);
          await execAsync(`cd ${appDir} && npm run build`).catch(() => {}); // Optional build
        }

        // 4. Start with PM2
        await execAsync(`cd ${appDir} && pm2 start npm --name "${app.name}" -- start`);
        await execAsync("pm2 save");

        // 5. Update Status
        await db.application.update({
          where: { id: app.id },
          data: { status: "running" },
        });
      } catch (error) {
        console.error("Deployment failed:", error);
        await db.application.update({
          where: { id: app.id },
          data: { status: "error" },
        });
      }
    })();

    return NextResponse.json(app, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}
