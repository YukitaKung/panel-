import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "app";
    let logs = "";

    switch (type) {
      case "app":
        // Fetch PM2 logs for hostpanel
        try {
          const { stdout, stderr } = await execAsync(`pm2 logs hostpanel --nostream --lines 200`);
          logs = stdout + "\n" + stderr;
        } catch (e: any) {
          logs = e.stdout + "\n" + e.stderr;
        }
        break;

      case "nginx":
        // Fetch Nginx access and error logs
        try {
          const { stdout } = await execAsync(`sudo tail -n 200 /var/log/nginx/access.log`);
          logs = stdout;
        } catch (e: any) {
          logs = "Could not fetch Nginx logs. " + e.message;
        }
        break;

      case "pm2":
        // Fetch global PM2 logs
        try {
          const { stdout, stderr } = await execAsync(`pm2 logs --nostream --lines 200`);
          logs = stdout + "\n" + stderr;
        } catch (e: any) {
          logs = e.stdout + "\n" + e.stderr;
        }
        break;

      case "system":
        // Fetch Ubuntu syslog
        try {
          const { stdout } = await execAsync(`sudo tail -n 200 /var/log/syslog`);
          logs = stdout;
        } catch (e: any) {
          logs = "Could not fetch system logs. " + e.message;
        }
        break;

      default:
        return NextResponse.json({ error: "Invalid log type" }, { status: 400 });
    }

    // Strip ANSI color codes from logs
    logs = logs.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("API Logs Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
