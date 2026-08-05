"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Settings, Trash2, HardDrive, Download, Upload, RotateCcw, Database, AppWindow, Server, Check } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";


const getTypeIcon = (type: string) => {
  switch (type) {
    case "Server":
    case "Full System":
      return <Server className="h-4 w-4 text-muted-foreground" />;
    case "Database":
      return <Database className="h-4 w-4 text-muted-foreground" />;
    case "Application":
      return <AppWindow className="h-4 w-4 text-muted-foreground" />;
    default:
      return <HardDrive className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function BackupsPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Advanced Form State
  const [newBackupName, setNewBackupName] = useState("");
  const [targetType, setTargetType] = useState<"all" | "selected">("all");
  
  // Options State
  const [optWebsiteData, setOptWebsiteData] = useState(true);
  const [optDatabase, setOptDatabase] = useState(true);
  const [optPanelConfigs, setOptPanelConfigs] = useState(true);
  
  // Fetch lists for "Selected Domains"
  const [apps, setApps] = useState<any[]>([]);
  const [subdomains, setSubdomains] = useState<any[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<any | null>(null);

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/backups");
      if (res.ok) setBackups(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTargets = async () => {
    try {
      const [appRes, subRes] = await Promise.all([
        fetch("/api/applications"),
        fetch("/api/subdomains")
      ]);
      if (appRes.ok) setApps(await appRes.json());
      if (subRes.ok) setSubdomains(await subRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBackups();
    fetchTargets();
    const interval = setInterval(fetchBackups, 10000);
    return () => clearInterval(interval);
  }, []);

  const togglePathSelection = (path: string) => {
    setSelectedPaths(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (targetType === "selected" && selectedPaths.length === 0 && optWebsiteData) {
        throw new Error("Please select at least one application or subdomain, or uncheck Website Data.");
      }
      
      toast.loading("Starting backup process...");
      const res = await fetch("/api/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBackupName || "manual",
          type: "Advanced",
          options: {
            targets: {
              all: targetType === "all",
              selected: selectedPaths
            },
            opts: {
              websiteData: optWebsiteData,
              database: optDatabase,
              panelConfigs: optPanelConfigs
            }
          }
        })
      });
      if (res.ok) {
        toast.dismiss();
        toast.success("Backup started in background");
        setIsCreateOpen(false);
        setNewBackupName("");
        fetchBackups();
      } else {
        throw new Error("Failed to start backup");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      toast.loading("Deleting backup...");
      const res = await fetch(`/api/backups/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.dismiss();
        toast.success("Backup deleted");
        fetchBackups();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const handleRestore = async (backup: any) => {
    try {
      toast.loading(`Restoring ${backup.name}...`);
      const res = await fetch(`/api/backups/${backup.id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPath: "/" }) 
      });
      if (res.ok) {
        toast.dismiss();
        toast.success("Restore started in background");
      } else {
        throw new Error("Failed to start restore");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog 
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete Backup"
        description="Are you sure you want to delete this backup archive? This action cannot be undone."
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
      <ConfirmDialog 
        open={!!confirmRestore}
        onOpenChange={(open) => !open && setConfirmRestore(null)}
        title="Restore Backup"
        description={`Are you sure you want to restore ${confirmRestore?.name}? This will overwrite existing files across the system depending on what was backed up.`}
        onConfirm={() => confirmRestore && handleRestore(confirmRestore)}
      />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backups</h1>
          <p className="text-muted-foreground mt-1">Manage full system backups and restore points.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="h-4 w-4 mr-2" />
              Create Backup
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 overflow-hidden sm:max-h-[85vh]">
              <form onSubmit={handleCreate} className="flex flex-col h-[85vh] sm:h-[85vh] max-h-[800px]">
                <DialogHeader className="p-6 border-b shrink-0 bg-muted/20">
                  <DialogTitle className="text-xl">Create Advanced Backup</DialogTitle>
                  <DialogDescription>
                    Configure what data you want to include in this backup archive.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-8">
                    
                    {/* Backup Name */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Backup Name (Optional)</Label>
                      <Input 
                        placeholder="e.g. migration-backup" 
                        value={newBackupName} 
                        onChange={e => setNewBackupName(e.target.value)} 
                        className="max-w-md"
                      />
                    </div>

                    {/* Target Selection */}
                    <div className="space-y-4">
                      <h3 className="text-base font-semibold border-b pb-2">Target Selection</h3>
                      <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="radio" 
                            name="targetType" 
                            checked={targetType === "all"} 
                            onChange={() => setTargetType("all")}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="font-medium">All Applications & Domains</span>
                        </label>
                        
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="radio" 
                            name="targetType" 
                            checked={targetType === "selected"} 
                            onChange={() => setTargetType("selected")}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="font-medium">Selected Applications & Domains</span>
                        </label>

                        {targetType === "selected" && (
                          <div className="ml-7 border p-4 bg-muted/10 space-y-4 max-h-[250px] overflow-auto">
                            {apps.length === 0 && subdomains.length === 0 && (
                              <p className="text-sm text-muted-foreground">No applications or subdomains found.</p>
                            )}
                            
                            {apps.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Node.js Apps</Label>
                                {apps.map(app => {
                                  const path = `/var/www/apps/${app.id}`;
                                  return (
                                    <div key={app.id} className="flex items-center gap-2">
                                      <Checkbox 
                                        checked={selectedPaths.includes(path)}
                                        onCheckedChange={() => togglePathSelection(path)}
                                      />
                                      <span className="text-sm">{app.name}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {subdomains.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Subdomains / PHP</Label>
                                {subdomains.map(sub => {
                                  const path = sub.target.startsWith('/') ? sub.target : `/var/www/domains/${sub.domain}`;
                                  return (
                                    <div key={sub.id} className="flex items-center gap-2">
                                      <Checkbox 
                                        checked={selectedPaths.includes(path)}
                                        onCheckedChange={() => togglePathSelection(path)}
                                      />
                                      <span className="text-sm">{sub.domain}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                      <h3 className="text-base font-semibold border-b pb-2">Options</h3>
                      <p className="text-sm text-muted-foreground">Select data to backup</p>
                      
                      <div className="grid gap-4">
                        {/* Website Data */}
                        <label className="flex items-start gap-3 p-4 border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
                          <Checkbox checked={optWebsiteData} onCheckedChange={(c) => setOptWebsiteData(!!c)} className="mt-1" />
                          <div>
                            <p className="font-medium">Website Data</p>
                            <p className="text-sm text-muted-foreground">Backs up all user files for the selected domains and applications.</p>
                          </div>
                        </label>

                        {/* Database */}
                        <label className="flex items-start gap-3 p-4 border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
                          <Checkbox checked={optDatabase} onCheckedChange={(c) => setOptDatabase(!!c)} className="mt-1" />
                          <div>
                            <p className="font-medium">Panel Database</p>
                            <p className="text-sm text-muted-foreground">Includes all system settings, users, and application configurations (SQLite dev.db).</p>
                          </div>
                        </label>

                        {/* Panel Configs */}
                        <label className="flex items-start gap-3 p-4 border bg-card hover:bg-accent/50 cursor-pointer transition-colors">
                          <Checkbox checked={optPanelConfigs} onCheckedChange={(c) => setOptPanelConfigs(!!c)} className="mt-1" />
                          <div>
                            <p className="font-medium">Panel Configurations</p>
                            <p className="text-sm text-muted-foreground">Backs up Nginx vhost configurations and PM2 states.</p>
                          </div>
                        </label>
                      </div>
                    </div>

                  </div>
                </div>

                <DialogFooter className="p-6 border-t shrink-0 bg-muted/20">
                  <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit">Start Backup</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup Archives</CardTitle>
          <CardDescription>
            List of all available backups on this server. Files are stored in /var/www/backups.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Archive Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      {backup.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getTypeIcon(backup.type)}
                      {backup.type}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {backup.size}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(backup.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                        <span className="sr-only">Open menu</span>
                        <Settings className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setConfirmRestore(backup)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/api/files/download?path=${encodeURIComponent(backup.path)}`, '_blank')}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-rose-500 focus:bg-rose-500/10 focus:text-rose-500"
                          onClick={() => setConfirmDelete(backup.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {backups.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No backup archives found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
