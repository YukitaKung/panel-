import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Settings, Trash2, HardDrive, Download, Upload, RotateCcw, Database, AppWindow, Server } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";


const getTypeIcon = (type: string) => {
  switch (type) {
    case "Server":
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
  const [newBackupName, setNewBackupName] = useState("");
  const [newBackupType, setNewBackupType] = useState("Application");
  const [newBackupTarget, setNewBackupTarget] = useState("");
  
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

  useEffect(() => {
    fetchBackups();
    const interval = setInterval(fetchBackups, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      toast.loading("Starting backup process...");
      const res = await fetch("/api/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBackupName,
          type: newBackupType,
          targetPath: newBackupTarget
        })
      });
      if (res.ok) {
        toast.dismiss();
        toast.success("Backup started in background");
        setIsCreateOpen(false);
        setNewBackupName("");
        setNewBackupTarget("");
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
        // Just send a default targetPath (we extract to / root usually for full tar archives)
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
        description={`Are you sure you want to restore ${confirmRestore?.name}? This will overwrite existing files in its original path.`}
        onConfirm={() => confirmRestore && handleRestore(confirmRestore)}
      />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backups</h1>
          <p className="text-muted-foreground mt-1">Manage system, application, and database backups.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create Backup</DialogTitle>
                  <DialogDescription>
                    Run a new backup process in the background.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Backup Name (Optional)</Label>
                    <Input 
                      placeholder="e.g. my-app-v1" 
                      value={newBackupName} 
                      onChange={e => setNewBackupName(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Backup Type</Label>
                    <Select value={newBackupType} onValueChange={setNewBackupType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Application">Application Files</SelectItem>
                        <SelectItem value="Database">Database (SQLite)</SelectItem>
                        <SelectItem value="Server">Subdomain/Server Folder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Absolute Path</Label>
                    <Input 
                      placeholder="e.g. /var/www/apps/my-app" 
                      value={newBackupTarget} 
                      onChange={e => setNewBackupTarget(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <DialogFooter>
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
            List of all available backups on this server.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
