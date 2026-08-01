"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AppWindow, Play, Square, RotateCw, GitBranch,
  Terminal, Settings, Trash2, Plus, Package, FolderCode, FileCode2
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<"git" | "local">("git");
  
  const [formData, setFormData] = useState({
    name: "",
    repo: "",
    branch: "main",
    path: "",
    startScript: "npm start",
    port: "3000"
  });

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : []);
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
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, sourceType }),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        setFormData({ name: "", repo: "", branch: "main", path: "", startScript: "npm start", port: "3000" });
        toast.success("Application created successfully");
        fetchApplications();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create application");
      }
    } catch (error) {
      console.error("Failed to create application:", error);
      toast.error("Failed to create application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/applications/${id}`, { method: "DELETE" });
      toast.success("Application deleted");
      fetchApplications();
    } catch (error) {
      console.error("Failed to delete application:", error);
      toast.error("Failed to delete application");
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog 
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete Application"
        description="Are you sure you want to delete this application? The PM2 process will be stopped."
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">แอพพลิเคชั่น (Applications)</h1>
          <p className="text-muted-foreground mt-1">จัดการ Node.js Applications ของคุณ</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          {/* @ts-ignore */}
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              สร้างแอพพลิเคชั่น (Create Application)
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] md:max-w-[700px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>สร้างแอพพลิเคชั่นใหม่</DialogTitle>
                <DialogDescription>
                  เลือกวิธีติดตั้งแอพพลิเคชั่น Node.js ของคุณ
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">ชื่อแอพ (App Name)</Label>
                  <Input 
                    id="name" 
                    className="h-11 text-base"
                    placeholder="e.g. my-awesome-api"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <Tabs value={sourceType} onValueChange={(val: any) => setSourceType(val)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="git">
                      <GitBranch className="w-4 h-4 mr-2" />
                      Git Repository
                    </TabsTrigger>
                    <TabsTrigger value="local">
                      <FolderCode className="w-4 h-4 mr-2" />
                      Local Path
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="git" className="space-y-4 mt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="repo">Git Repository URL</Label>
                      <Input 
                        id="repo" 
                        className="h-11 text-base"
                        placeholder="https://github.com/user/repo.git"
                        value={formData.repo}
                        onChange={(e) => setFormData({...formData, repo: e.target.value})}
                        required={sourceType === "git"}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="branch">Branch (Optional)</Label>
                      <Input 
                        id="branch" 
                        className="h-11 text-base"
                        placeholder="main"
                        value={formData.branch}
                        onChange={(e) => setFormData({...formData, branch: e.target.value})}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="local" className="space-y-4 mt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="path">Directory Path</Label>
                      <Input 
                        id="path" 
                        className="h-11 text-base"
                        placeholder="/var/www/my-node-app"
                        value={formData.path}
                        onChange={(e) => setFormData({...formData, path: e.target.value})}
                        required={sourceType === "local"}
                      />
                      <p className="text-xs text-muted-foreground">Absolute path to your Node.js application directory on the VPS.</p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startScript">Start Command</Label>
                    <Input 
                      id="startScript" 
                      className="h-11 text-base font-mono"
                      placeholder="npm start"
                      value={formData.startScript}
                      onChange={(e) => setFormData({...formData, startScript: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="port">Port</Label>
                    <Input 
                      id="port" 
                      type="number"
                      className="h-11 text-base"
                      placeholder="3000"
                      value={formData.port}
                      onChange={(e) => setFormData({...formData, port: e.target.value})}
                      required
                    />
                  </div>
                </div>

              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Deploying..." : "Create & Deploy"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {applications.length === 0 && !isLoading && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <AppWindow className="mx-auto h-12 w-12 opacity-20 mb-4" />
            <p>No applications found.</p>
            <p className="text-sm">Click "Create Application" to deploy your first app.</p>
          </div>
        )}
        {applications.map((app) => (
          <Card key={app.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center">
                  <Package className="w-5 h-5 mr-2 text-primary" />
                  {app.name}
                </CardTitle>
                <CardDescription className="font-mono text-xs">
                  {app.sourceType === "git" ? (
                    <span className="flex items-center text-muted-foreground"><GitBranch className="w-3 h-3 mr-1"/> {app.repo}</span>
                  ) : (
                    <span className="flex items-center text-muted-foreground"><FolderCode className="w-3 h-3 mr-1"/> {app.path}</span>
                  )}
                </CardDescription>
              </div>
              <DropdownMenu>
                {/* @ts-ignore */}
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <Play className="mr-2 h-4 w-4 text-emerald-500" />
                      Start
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Square className="mr-2 h-4 w-4 text-rose-500" />
                      Stop
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <RotateCw className="mr-2 h-4 w-4 text-amber-500" />
                      Restart
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setConfirmDelete(app.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Application
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={
                    app.status === "running" ? "bg-emerald-500/10 text-emerald-500" :
                    app.status === "deploying" ? "bg-blue-500/10 text-blue-500" :
                    app.status === "error" ? "bg-rose-500/10 text-rose-500" :
                    "bg-gray-500/10 text-gray-500"
                  }>
                    {app.status === "running" && <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500"></span>}
                    {app.status === "deploying" && <RotateCw className="mr-1.5 h-3 w-3 animate-spin" />}
                    {app.status}
                  </Badge>
                  <Badge variant="secondary">Port {app.port}</Badge>
                </div>
                <div className="text-muted-foreground">
                  <span className="flex items-center"><FileCode2 className="w-3 h-3 mr-1"/> {app.startScript}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
