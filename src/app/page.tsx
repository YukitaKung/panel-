import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Cpu, HardDrive, Network, MemoryStick, AppWindow, Globe, Play, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">ภาพรวม (Dashboard)</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรช (Refresh)
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            สร้างแอพใหม่ (New App)
          </Button>
        </div>
      </div>

      {/* System Resources */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12%</div>
            <p className="text-xs text-muted-foreground">4 Cores, 2.4 GHz</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RAM Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 GB / 8 GB</div>
            <p className="text-xs text-muted-foreground">52% Utilized</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Space</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45 GB / 160 GB</div>
            <p className="text-xs text-muted-foreground">NVMe Storage</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">↑ 12 Mbps</div>
            <p className="text-xs text-muted-foreground">↓ 8 Mbps</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Active Entities */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>บริการที่กำลังทำงาน (Running Services)</CardTitle>
            <CardDescription>Overview of your active applications and websites.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-md mr-4">
                  <AppWindow className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">api.company.com</p>
                  <p className="text-sm text-muted-foreground">Node.js (PM2) • Port 3001</p>
                </div>
                <div className="flex items-center text-sm font-medium text-emerald-500">
                  <Play className="h-4 w-4 mr-1" />
                  Running
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-md mr-4">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">company.com</p>
                  <p className="text-sm text-muted-foreground">PHP 8.2 • Nginx</p>
                </div>
                <div className="flex items-center text-sm font-medium text-emerald-500">
                  <Play className="h-4 w-4 mr-1" />
                  Running
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest events on your server.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-muted-foreground mr-3 mt-0.5 self-start" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Restarted api.company.com</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-muted-foreground mr-3 mt-0.5 self-start" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Automated Backup Completed</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-muted-foreground mr-3 mt-0.5 self-start" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Installed PHP 8.2</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
