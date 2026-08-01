import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AppWindow, Play, Square, RotateCw, GitBranch, Download, Upload, 
  Terminal, FolderOpen, FileText, Settings, Trash2, Plus, TerminalSquare, Package
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const applications = [
  {
    id: 1,
    name: "api.company.com",
    description: "Main backend API service",
    rootPath: "/var/www/api.company.com",
    workingDir: "/var/www/api.company.com/current",
    startupFile: "dist/index.js",
    port: 3001,
    runtime: "Node.js 20.x",
    status: "Running",
    gitRepo: "git@github.com:company/api.git",
  },
  {
    id: 2,
    name: "dashboard.company.com",
    description: "Admin dashboard frontend",
    rootPath: "/var/www/dashboard.company.com",
    workingDir: "/var/www/dashboard.company.com",
    startupFile: "npm start",
    port: 3002,
    runtime: "Node.js 18.x",
    status: "Stopped",
    gitRepo: "git@github.com:company/dashboard.git",
  }
];

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">แอพพลิเคชั่น (Applications)</h1>
          <p className="text-muted-foreground mt-1">จัดการ Node.js Applications ของคุณ</p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            สร้างแอพพลิเคชั่น (Create Application)
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>สร้างแอพพลิเคชั่นใหม่</DialogTitle>
              <DialogDescription>เพิ่ม Node.js application ใหม่เข้าสู่ระบบ</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="app-name">ชื่อแอพพลิเคชั่น (Application Name)</Label>
                <Input id="app-name" placeholder="e.g. api.company.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="app-root">โฟลเดอร์หลัก (Root Path)</Label>
                <Input id="app-root" placeholder="/var/www/app" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="app-repo">Git Repository (ถ้ามี)</Label>
                <Input id="app-repo" placeholder="git@github.com:user/repo.git" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="app-runtime">เวอร์ชัน (Runtime)</Label>
                  <Select defaultValue="node20">
                    <SelectTrigger id="app-runtime">
                      <SelectValue placeholder="เลือกเวอร์ชัน" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="node20">Node.js 20.x</SelectItem>
                      <SelectItem value="node18">Node.js 18.x</SelectItem>
                      <SelectItem value="node16">Node.js 16.x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="app-port">พอร์ต (Port)</Label>
                  <Input id="app-port" type="number" placeholder="3000" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button">ยกเลิก (Cancel)</Button>
              <Button type="submit">สร้างแอพพลิเคชั่น (Create)</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {applications.map((app) => (
          <Card key={app.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-background p-3 rounded-md shadow-sm border">
                    <AppWindow className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl flex flex-wrap items-center gap-3">
                      {app.name}
                      <Badge variant={app.status === "Running" ? "default" : "secondary"} className={app.status === "Running" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                        {app.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm">{app.description}</CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {app.status === "Running" ? (
                    <>
                      <Button variant="outline" size="sm" className="text-rose-500 border-rose-500/20 hover:bg-rose-500/10">
                        <Square className="h-4 w-4 mr-2" /> Stop
                      </Button>
                      <Button variant="outline" size="sm">
                        <RotateCw className="h-4 w-4 mr-2" /> Restart
                      </Button>
                    </>
                  ) : (
                    <Button variant="default" size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                      <Play className="h-4 w-4 mr-2" /> Start
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                      <Settings className="h-4 w-4 mr-2" /> Manage
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Application</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" /> Edit Configuration
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Terminal className="h-4 w-4 mr-2" /> Open Terminal
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>NPM</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Package className="h-4 w-4 mr-2" /> npm install
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Package className="h-4 w-4 mr-2" /> npm update
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Package className="h-4 w-4 mr-2" /> npm run build
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-rose-500 focus:bg-rose-500/10 focus:text-rose-500">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Application
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Root Path</p>
                  <p className="text-sm font-mono bg-muted/50 p-1.5 rounded-md truncate" title={app.rootPath}>
                    {app.rootPath}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Working Directory</p>
                  <p className="text-sm font-mono bg-muted/50 p-1.5 rounded-md truncate" title={app.workingDir}>
                    {app.workingDir}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Git Repository</p>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm truncate" title={app.gitRepo}>{app.gitRepo}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Configuration</p>
                  <div className="space-y-1" suppressHydrationWarning>
                    <p className="text-sm flex items-center justify-between">
                      <span className="text-muted-foreground">Port:</span>
                      <span className="font-mono">{app.port}</span>
                    </p>
                    <p className="text-sm flex items-center justify-between">
                      <span className="text-muted-foreground">Runtime:</span>
                      <span>{app.runtime}</span>
                    </p>
                    <p className="text-sm flex items-center justify-between">
                      <span className="text-muted-foreground">Startup File:</span>
                      <span className="font-mono truncate max-w-[120px]" title={app.startupFile}>{app.startupFile}</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
