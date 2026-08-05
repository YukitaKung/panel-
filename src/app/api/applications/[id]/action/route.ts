import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { restartApp } from "@/lib/system/pm2";
import { escapeShellArg } from "@/lib/utils";

const execAsync = promisify(exec);
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    if (!action || !["redeploy", "npm_install", "npm_build"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const app = await db.application.findUnique({ where: { id } });
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const targetDir = app.path || "";
    if (!targetDir) {
      return NextResponse.json({ error: "Application path not set" }, { status: 400 });
    }

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
          // Verify directory exists
          await fs.access(targetDir).catch(() => {
            throw new Error(`Directory ${targetDir} does not exist on the server.`);
          });

          if (action === "redeploy") {
            send(`[INFO] Starting redeployment for ${app.name} (${app.id})...`);
            await db.application.update({ where: { id: app.id }, data: { status: "deploying" } });

            if (app.sourceType === "git" && app.repo) {
              send(`[INFO] Pulling latest code from ${app.branch || "main"}...`);
              await streamCommand(`cd ${escapeShellArg(targetDir)} && git stash && git fetch && git reset --hard origin/${escapeShellArg(app.branch || "main")}`);
            }

            if (await fs.stat(path.join(targetDir, "package.json")).catch(() => false)) {
              send(`[INFO] Installing dependencies...`);
              await streamCommand(`cd ${escapeShellArg(targetDir)} && HUSKY=0 npm install --legacy-peer-deps`);
              
              send(`[INFO] Building application...`);
              await streamCommand(`cd ${escapeShellArg(targetDir)} && npm run build`);
            }

            send(`[INFO] Restarting PM2 process...`);
            const pm2Name = `app-${app.id}`;
            const success = await restartApp(pm2Name);
            if (!success) {
              // Try starting it if it was stopped
              await streamCommand(`cd ${escapeShellArg(targetDir)} && PORT=${app.port} pm2 start ${escapeShellArg(app.startScript)} --name ${escapeShellArg(pm2Name)}`);
              await execAsync("pm2 save");
            }

            await db.application.update({ where: { id: app.id }, data: { status: "running" } });
            send(`\n[SUCCESS] Redeployment complete!`);
          } else if (action === "npm_install") {
            send(`[INFO] Running npm install in ${targetDir}...`);
            await streamCommand(`cd ${escapeShellArg(targetDir)} && HUSKY=0 npm install --legacy-peer-deps`);
            send(`\n[SUCCESS] npm install complete!`);
          } else if (action === "npm_build") {
            send(`[INFO] Running npm run build in ${targetDir}...`);
            await streamCommand(`cd ${escapeShellArg(targetDir)} && npm run build`);
            send(`\n[SUCCESS] npm run build complete!`);
          }

          controller.close();
        } catch (error: any) {
          send(`\n[ERROR] Action failed: ${error.message}`);
          if (action === "redeploy") {
            await db.application.update({ where: { id: app.id }, data: { status: "error" } });
          }
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
    return NextResponse.json({ error: error.message || "Failed to execute action" }, { status: 500 });
  }
}
