import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
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

    const reservedPorts = [22, 80, 443, 3000, 3306, 5432, 27017, 6379, 11211, 27017, 8080];
    if (reservedPorts.includes(parsedPort)) {
      return NextResponse.json({ error: `Port ${parsedPort} is reserved by the system and cannot be used.` }, { status: 400 });
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
            const safeName = app.name.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase().replace(/-+/g, "-");
            const shortId = app.id.split("-")[0];
            const folderName = safeName && safeName !== "-" ? `${safeName}-${shortId}` : `app-${shortId}`;
            targetDir = path.join(appsDir, folderName);
            
            await db.application.update({ where: { id: app.id }, data: { path: targetDir } });
            
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
            send(`[INFO] Checking environment variables...`);
            await streamCommand(`cd ${targetDir} && if [ -f .env.example ] && [ ! -f .env ]; then cp .env.example .env && echo "[INFO] Auto-created .env from .env.example"; fi`).catch(() => {});
            
            send(`[INFO] Installing dependencies...`);
            await streamCommand(`cd ${targetDir} && npm pkg delete scripts.prepare`).catch(() => {});
            await streamCommand(`cd ${targetDir} && HUSKY=0 npm install --legacy-peer-deps`);
            
            send(`[INFO] Building application...`);
            await streamCommand(`cd ${targetDir} && npm run build`).catch((err: any) => {
              throw new Error(`Build failed: ${err.message}`);
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
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create application" }, { status: 500 });
  }
}
