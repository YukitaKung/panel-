import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exec, spawn } from "child_process";
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

    const parsedPort = parseInt(port, 10);
    if (isNaN(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
      return NextResponse.json({ error: "Invalid port number" }, { status: 400 });
    }

    const existingApp = await db.application.findFirst({
      where: { port: parsedPort }
    });

    if (existingApp) {
      return NextResponse.json({ error: `Port ${parsedPort} is already in use by application "${existingApp.name}"` }, { status: 400 });
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

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(text: string) {
          try {
            controller.enqueue(encoder.encode(text + "\\n"));
          } catch (e) {
            // Ignore if closed
          }
        }

        function streamCommand(command: string): Promise<void> {
          return new Promise((resolve, reject) => {
            send(`$ ${command}`);
            const child = spawn(command, { shell: true });
            child.stdout.on("data", (data) => send(data.toString().trimEnd()));
            child.stderr.on("data", (data) => send(data.toString().trimEnd()));
            child.on("close", (code) => {
              if (code === 0) resolve();
              else reject(new Error(`Command failed with code ${code}`));
            });
          });
        }

        try {
          send(`[INFO] Created application record: ${app.name} (${app.id})`);
          let targetDir = "";

          if (sourceType === "git") {
            const appsDir = "/var/www/apps";
            targetDir = path.join(appsDir, app.id);
            
            await execAsync(`sudo mkdir -p ${appsDir}`).catch(() => {});
            await execAsync(`sudo chown -R okkcom269gmailcom:www-data ${appsDir}`).catch(() => {});
            await execAsync(`sudo chmod -R 775 ${appsDir}`).catch(() => {});
            await execAsync(`sudo rm -rf ${targetDir}`).catch(() => {});
            
            send(`[INFO] Cloning repository ${app.repo}...`);
            await streamCommand(`git clone -b ${app.branch} ${app.repo} ${targetDir}`);
            
            await db.application.update({
              where: { id: app.id },
              data: { path: targetDir }
            });
          } else {
            targetDir = appPath;
            await fs.access(targetDir).catch(() => {
              throw new Error(`Directory ${targetDir} does not exist on the server.`);
            });
            send(`[INFO] Using local path ${targetDir}`);
          }

          if (sourceType === "git" && await fs.stat(path.join(targetDir, "package.json")).catch(() => false)) {
            send(`[INFO] Installing dependencies...`);
            await streamCommand(`cd ${targetDir} && npm install`);
            
            send(`[INFO] Building application...`);
            await streamCommand(`cd ${targetDir} && npm run build`).catch((err: any) => {
              send(`[WARN] Build script failed or not present: ${err.message}`);
            });
          }

          send(`[INFO] Starting PM2 process...`);
          const pm2Cmd = `cd ${targetDir} && PORT=${app.port} pm2 start "${startScript}" --name "app-${app.id}"`;
          await streamCommand(pm2Cmd);
          await execAsync("pm2 save");

          await db.application.update({
            where: { id: app.id },
            data: { status: "running" },
          });

          send(`\\n[SUCCESS] Deployment complete!`);
          controller.close();
        } catch (error: any) {
          send(`\\n[ERROR] Deployment failed: ${error.message}`);
          await db.application.update({
            where: { id: app.id },
            data: { status: "error" },
          });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create application" }, { status: 500 });
  }
}
