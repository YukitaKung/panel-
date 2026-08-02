import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { command, cwd } = await request.json();

    if (!command) {
      return NextResponse.json({ error: "No command provided" }, { status: 400 });
    }

    const targetCwd = cwd || (process.platform === "win32" ? "C:\\var\\www" : "/var/www");

    // Handle 'cd' commands natively in the backend since stateless exec doesn't keep directory context
    if (command.startsWith("cd ")) {
      const cdTarget = command.substring(3).trim();
      let newCwd = path.resolve(targetCwd, cdTarget);
      
      try {
        const stat = await fs.stat(newCwd);
        if (!stat.isDirectory()) {
          return NextResponse.json({ stdout: "", stderr: `cd: ${cdTarget}: Not a directory`, newCwd: targetCwd });
        }
        return NextResponse.json({ stdout: "", stderr: "", newCwd });
      } catch (error: any) {
        return NextResponse.json({ stdout: "", stderr: `cd: ${cdTarget}: No such file or directory`, newCwd: targetCwd });
      }
    }

    // Handle other commands
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: targetCwd, timeout: 10000 });
      return NextResponse.json({ stdout, stderr, newCwd: targetCwd });
    } catch (error: any) {
      return NextResponse.json({ stdout: error.stdout || "", stderr: error.stderr || error.message, newCwd: targetCwd });
    }
  } catch (error: any) {
    console.error("Terminal API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
