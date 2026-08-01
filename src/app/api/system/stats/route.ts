import { NextResponse } from "next/server";
import si from "systeminformation";
import os from "os";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [cpu, mem, load] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.networkStats(),
    ]);

    const uptime = os.uptime();
    const days = Math.floor(uptime / (3600 * 24));
    const hours = Math.floor((uptime % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const uptimeStr = `${days}d ${hours}h ${minutes}m`;

    return NextResponse.json({
      cpuUsage: cpu.currentLoad,
      memoryTotal: mem.total,
      memoryUsed: mem.active,
      memoryFree: mem.free,
      uptime: uptimeStr,
      networkRx: load[0]?.rx_sec || 0,
      networkTx: load[0]?.tx_sec || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
