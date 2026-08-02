import { NextResponse } from "next/server";
import si from "systeminformation";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [osInfo, versions, tzOutput] = await Promise.all([
      si.osInfo(),
      si.versions(),
      execAsync("cat /etc/timezone").catch(() => ({ stdout: Intl.DateTimeFormat().resolvedOptions().timeZone }))
    ]);

    const currentTimezone = tzOutput.stdout.trim();
    const availableTimezones = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [];

    return NextResponse.json({
      hostname: os.hostname(),
      os: `${osInfo.distro} ${osInfo.release} (${osInfo.arch})`,
      kernel: osInfo.kernel,
      node: versions.node || process.version,
      nginx: versions.nginx || "Installed",
      ip: await fetch("https://api.ipify.org").then(res => res.text()).catch(() => "Unknown"),
      timezone: currentTimezone,
      availableTimezones: availableTimezones
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { timezone } = await request.json();
    if (!timezone) {
      return NextResponse.json({ error: "Timezone is required" }, { status: 400 });
    }

    // Attempt to set system timezone
    await execAsync(`sudo timedatectl set-timezone ${timezone}`);
    
    // Also update PM2 processes to pick up the new timezone if possible, but actually a full restart is better.
    // For now just setting the system timezone is enough, Node apps usually need a restart to pick it up.

    return NextResponse.json({ success: true, timezone });
  } catch (error) {
    console.error("Failed to set timezone:", error);
    return NextResponse.json({ error: "Failed to set timezone" }, { status: 500 });
  }
}
