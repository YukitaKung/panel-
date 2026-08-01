"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AppWindow, Play, Square, RotateCw, GitBranch,
  Terminal, Settings, Trash2, Plus, Package
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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    repo: "",
    branch: "main",
    port: "3000"
  });

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        setFormData({ name: "", repo: "", branch: "main", port: "3000" });
        fetchApplications();
      }
    } catch (error) {
      console.error("Failed to create application:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    try {
      await fetch(`/api/applications/${id}`, { method: "DELETE" });
      fetchApplications();
    } catch (error) {
      console.error("Failed to delete application:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">แอพพลิเคชั่น (Applications)</h1>
          <p className="text-muted-foreground mt-1">จัดการ Node.js Applications ของคุณ</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              สร้างแอพพลิเคชั่น (Create Application)
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>สร้างแอพพลิเคชั่นใหม่</DialogTitle>
                <DialogDescription>เพิ่ม Node.js application ใหม่เข้าสู่ระบบ</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="app-name">ชื่อแอพพลิเคชั่น (Application Name)</Label>
                  <Input 
                    id="app-name" 
                    placeholder="e.g. api.company.com" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="app-repo">Git Repository</Label>
                  <Input 
                    id="app-repo" 
                    placeholder="https://github.com/user/repo.git" 
                    value={formData.repo}
                    onChange={(e) => setFormData({...formData, repo: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="app-branch">Branch</Label>
                    <Input 
                      id="app-branch" 
                      placeholder="main" 
                      value={formData.branch}
                      onChange={(e) => setFormData({...formData, branch: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="app-port">พอร์ต (Port)</Label>
                    <Input 
                      id="app-port" 
                      type="number" 
                      placeholder="3000" 
                      value={formData.port}
                      onChange={(e) => setFormData({...formData, port: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>ยกเลิก (Cancel)</Button>
                <Button type="submit">สร้างแอพพลิเคชั่น (Create)</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">กำลังโหลดข้อมูล...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <AppWindow className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">ยังไม่มีแอพพลิเคชั่น</h3>
          <p className="text-sm text-muted-foreground mb-4">เริ่มต้นด้วยการสร้างแอพพลิเคชั่นใหม่</p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" /> สร้างแอพพลิเคชั่นแรก
          </Button>
        </div>
      ) : (
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
                        <Badge variant={app.status === "running" ? "default" : app.status === "deploying" ? "secondary" : "destructive"} 
                          className={app.status === "running" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                          {app.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm">Deployed on Port {app.port}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {app.status === "running" ? (
                      <>
                        <Button variant="outline" size="sm" className="text-rose-500 border-rose-500/20 hover:bg-rose-500/10">
                          <Square className="h-4 w-4 mr-2" /> Stop
                        </Button>
                        <Button variant="outline" size="sm">
                          <RotateCw className="h-4 w-4 mr-2" /> Restart
                        </Button>
                      </>
                    ) : (
                      <Button variant="default" size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" disabled={app.status === "deploying"}>
                        <Play className="h-4 w-4 mr-2" /> Start
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                         <Settings className="h-4 w-4 mr-2" /> Manage
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem className="text-rose-500 focus:bg-rose-500/10 focus:text-rose-500" onClick={() => handleDelete(app.id)}>
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
                    <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                    <p className="text-sm capitalize">{app.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Working Directory</p>
                    <p className="text-sm font-mono bg-muted/50 p-1.5 rounded-md truncate">
                      /home/okkcom269gmailcom/apps/{app.id}
                    </p>
                  </div>
                  <div className="lg:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Git Repository</p>
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm truncate" title={app.repo}>{app.repo} ({app.branch})</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
