import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const app = await db.application.findUnique({ where: { id } });

    if (!app || app.sourceType !== "git") {
      return NextResponse.json({ error: "Not a git application" }, { status: 400 });
    }

    const appDir = app.path || path.join("/var/www/apps", app.id);

    try {
      // Run git fetch to update remote tracking branches
      await execAsync(`git fetch origin ${app.branch || 'main'}`, { cwd: appDir });
      
      // Get local commit
      const { stdout: localStdout } = await execAsync(`git rev-parse HEAD`, { cwd: appDir });
      const localCommit = localStdout.trim();

      // Get remote commit
      const { stdout: remoteStdout } = await execAsync(`git rev-parse origin/${app.branch || 'main'}`, { cwd: appDir });
      const remoteCommit = remoteStdout.trim();

      const hasUpdates = localCommit !== remoteCommit;

      return NextResponse.json({ 
        hasUpdates, 
        currentCommit: localCommit.substring(0, 7), 
        latestCommit: remoteCommit.substring(0, 7) 
      });
    } catch (gitError: any) {
      console.error(`Git error for app ${id}:`, gitError.message);
      return NextResponse.json({ error: "Failed to check git status", details: gitError.message }, { status: 500 });
    }

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
