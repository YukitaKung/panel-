import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { spawn } from "child_process";
import path from "path";
import { stopApp, restartApp } from "@/lib/system/pm2";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const action = body.action; // "redeploy", "npm_install", "npm_build"

    const app = await db.application.findUnique({ where: { id } });
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const appDir = app.path || path.join("/var/www/apps", app.id);
    const pm2Name = `app-${app.id}`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(text: string) {
          try {
            controller.enqueue(encoder.encode(text + "\n"));
          } catch (e) {
            // Ignore if closed
          }
        }

        function streamCommand(command: string, cwd: string): Promise<void> {
          return new Promise((resolve, reject) => {
            send(`$ ${command}`);
            const child = spawn(command, { shell: true, cwd });
            child.stdout.on("data", (data) => send(data.toString().trimEnd()));
            child.stderr.on("data", (data) => send(data.toString().trimEnd()));
            child.on("close", (code) => {
              if (code === 0) resolve();
              else reject(new Error(`Command failed with code ${code}`));
            });
          });
        }

        try {
          // 1. Stop PM2 process
          send(`[INFO] Stopping application ${app.name}...`);
          try {
            await streamCommand(`pm2 stop "${pm2Name}"`, appDir);
            send(`[SUCCESS] Stopped ${app.name}`);
          } catch (e) {
            send(`[WARN] Could not stop app, it might not be running or already stopped.`);
          }

          // 2. Execute Action
          if (action === "redeploy" && app.sourceType === "git") {
            send(`[INFO] Pulling latest changes from git...`);
            await streamCommand(`git pull origin ${app.branch || 'main'}`, appDir);
            
            send(`[INFO] Running npm install...`);
            await streamCommand(`npm install`, appDir);

            // Try to build if there's a build script
            send(`[INFO] Checking for build script...`);
            try {
              const packageJsonPath = path.join(appDir, "package.json");
              const fs = require("fs").promises;
              const pkgData = await fs.readFile(packageJsonPath, "utf8");
              const pkg = JSON.parse(pkgData);
              if (pkg.scripts && pkg.scripts.build) {
                send(`[INFO] Running npm run build...`);
                await streamCommand(`npm run build`, appDir);
              }
            } catch (e) {
              send(`[INFO] No build script found or failed to parse package.json. Skipping build.`);
            }

          } else if (action === "npm_install") {
            send(`[INFO] Running npm install...`);
            await streamCommand(`npm install`, appDir);
          } else if (action === "npm_build") {
            send(`[INFO] Running npm run build...`);
            await streamCommand(`npm run build`, appDir);
          } else {
            throw new Error(`Invalid action or unsupported sourceType: ${action}`);
          }

          // 3. Restart PM2 process
          send(`[INFO] Starting application ${app.name}...`);
          try {
            await streamCommand(`pm2 restart "${pm2Name}"`, appDir);
          } catch (e) {
            // Fallback to start if restart fails because it doesn't exist in PM2 list
            await streamCommand(`pm2 start "${pm2Name}"`, appDir);
          }

          // Update status in DB
          await db.application.update({
            where: { id: app.id },
            data: { status: "running" },
          });
          
          send(`[SUCCESS] Action completed successfully!`);
          controller.close();
        } catch (error: any) {
          send(`[ERROR] ${error.message}`);
          
          // Try to emergency restart
          send(`[INFO] Attempting emergency restart...`);
          try {
             await streamCommand(`pm2 start "${pm2Name}"`, appDir);
             send(`[SUCCESS] Emergency restart successful.`);
          } catch (e) {}

          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Deploy API Error:", error);
    return NextResponse.json({ error: "Failed to process deployment action" }, { status: 500 });
  }
}
