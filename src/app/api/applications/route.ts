import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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
    const { name, sourceType, repo, branch, path: appPath, startScript, port } = await req.json();

    if (!name || !port || !startScript) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (sourceType === "git" && !repo) {
      return NextResponse.json({ error: "Git repository URL is required for Git deployment" }, { status: 400 });
    }

    if (sourceType === "local" && !appPath) {
      return NextResponse.json({ error: "Application path is required for Local deployment" }, { status: 400 });
    }

    // 1. Create DB Record
    const app = await db.application.create({
      data: {
        name,
        sourceType,
        repo: sourceType === "git" ? repo : null,
        branch: sourceType === "git" ? (branch || "main") : null,
        path: sourceType === "local" ? appPath : null,
        startScript,
        port: parseInt(port),
        status: "deploying",
      },
    });

    // Asynchronous background deployment
    (async () => {
      try {
        let targetDir = "";

        if (sourceType === "git") {
          const appsDir = "/home/okkcom269gmailcom/apps";
          targetDir = path.join(appsDir, app.id);
          
          await fs.mkdir(appsDir, { recursive: true }).catch(() => {});
          
          // Clean directory if exists
          await execAsync(`sudo rm -rf ${targetDir}`).catch(() => {});
          
          // Clone repo
          await execAsync(`git clone -b ${app.branch} ${app.repo} ${targetDir}`);
          
          // Update DB with the cloned path so it acts like a local app now
          await db.application.update({
            where: { id: app.id },
            data: { path: targetDir }
          });
        } else {
          targetDir = appPath;
          // Check if path exists
          await fs.access(targetDir).catch(() => {
            throw new Error(`Directory ${targetDir} does not exist on the server.`);
          });
        }

        // Install dependencies if package.json exists and we cloned from git
        // (If it's local, we assume the user might have already installed them, or we could run npm install anyway)
        if (sourceType === "git" && await fs.stat(path.join(targetDir, "package.json")).catch(() => false)) {
          await execAsync(`cd ${targetDir} && npm install`);
          await execAsync(`cd ${targetDir} && npm run build`).catch(() => {}); // Optional build
        }

        // 4. Start with PM2 using the custom startScript
        // We run pm2 as root or the current user. Since we might need sudo for ports/paths:
        const pm2Cmd = `cd ${targetDir} && pm2 start "${startScript}" --name "app-${app.id}"`;
        await execAsync(pm2Cmd);
        await execAsync("pm2 save");

        // 5. Update Status
        await db.application.update({
          where: { id: app.id },
          data: { status: "running" },
        });
      } catch (error: any) {
        console.error("Deployment failed:", error);
        await db.application.update({
          where: { id: app.id },
          data: { status: "error" },
        });
      }
    })();

    return NextResponse.json(app, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create application" }, { status: 500 });
  }
}
