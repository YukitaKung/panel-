import { NextResponse } from "next/server";
import si from "systeminformation";
import os from "os";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [osInfo, versions] = await Promise.all([
      si.osInfo(),
      si.versions(),
    ]);

    return NextResponse.json({
      hostname: os.hostname(),
      os: `${osInfo.distro} ${osInfo.release} (${osInfo.arch})`,
      kernel: osInfo.kernel,
      node: versions.node || process.version,
      nginx: versions.nginx || "Installed",
      ip: await fetch("https://api.ipify.org").then(res => res.text()).catch(() => "Unknown"),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
