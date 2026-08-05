"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Cpu, HardDrive, Network, MemoryStick, AppWindow, Globe, Play, Plus, RefreshCw, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/system/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch system stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">ภาพรวม (Dashboard)</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            รีเฟรช (Refresh)
          </Button>
        </div>
      </div>

      {/* System Resources */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${stats.cpuUsage.toFixed(1)}%` : "..."}
            </div>
            <p className="text-xs text-muted-foreground">Current Load</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RAM Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${formatBytes(stats.memoryUsed)}` : "..."}
            </div>
            <p className="text-xs text-muted-foreground">
              / {stats ? formatBytes(stats.memoryTotal) : "..."} Total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${formatBytes(stats.diskTotal - stats.diskUsed)}` : "..."}
            </div>
            <p className="text-xs text-muted-foreground">
              Free of {stats ? formatBytes(stats.diskTotal) : "..."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.uptime : "..."}
            </div>
            <p className="text-xs text-muted-foreground">Server Uptime</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network (Rx / Tx)</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `↓ ${formatBytes(stats.networkRx)}/s` : "..."}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats ? `↑ ${formatBytes(stats.networkTx)}/s` : "..."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>บริการที่กำลังทำงาน (Running Services)</CardTitle>
            <CardDescription>Overview of your active applications and websites.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center text-sm text-muted-foreground border border-dashed rounded-none p-6 justify-center">
                <AppWindow className="h-5 w-5 mr-2" /> 
                <p>โปรดไปที่หน้า "แอพพลิเคชั่น" เพื่อดูข้อมูลแบบละเอียด</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>กิจกรรมล่าสุด (Recent Activity)</CardTitle>
            <CardDescription>System logs and recent events.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-none bg-emerald-500 mt-1.5 mr-3 self-start"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">System Panel Started</p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
