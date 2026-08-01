import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, Monitor, Info, HardDrive, Cpu, MemoryStick } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">View server information and configuration.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Operating System
            </CardTitle>
            <CardDescription>Details about the host operating system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">OS Name</span>
              <span className="font-medium">Ubuntu 24.04 LTS</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Kernel Version</span>
              <span className="font-medium">6.8.0-31-generic</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Architecture</span>
              <span className="font-medium">x86_64</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-medium">42 days, 15 hours</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Software Versions
            </CardTitle>
            <CardDescription>Installed software and runtime versions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Node.js</span>
              <span className="font-mono text-sm bg-muted px-2 py-1 rounded">v20.11.0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">PHP</span>
              <div className="flex gap-2">
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">8.1</span>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">8.2</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Nginx</span>
              <span className="font-mono text-sm bg-muted px-2 py-1 rounded">1.24.0</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">MariaDB</span>
              <span className="font-mono text-sm bg-muted px-2 py-1 rounded">10.11.7</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Hardware Summary
            </CardTitle>
            <CardDescription>Physical resources allocated to this server.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col gap-2 p-4 border rounded-xl bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Cpu className="h-4 w-4" />
                  <span className="font-medium">Processor</span>
                </div>
                <div className="text-2xl font-bold">4 Cores</div>
                <div className="text-sm text-muted-foreground">Intel(R) Xeon(R) CPU E5-2676 v3 @ 2.40GHz</div>
              </div>
              <div className="flex flex-col gap-2 p-4 border rounded-xl bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MemoryStick className="h-4 w-4" />
                  <span className="font-medium">Memory (RAM)</span>
                </div>
                <div className="text-2xl font-bold">8 GB</div>
                <div className="text-sm text-muted-foreground">DDR4 ECC</div>
              </div>
              <div className="flex flex-col gap-2 p-4 border rounded-xl bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="font-medium">Storage</span>
                </div>
                <div className="text-2xl font-bold">160 GB</div>
                <div className="text-sm text-muted-foreground">NVMe SSD (45 GB Used)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
