"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HardDrive, Download, RotateCcw, Server, Trash2, Upload } from "lucide-react";

interface BackupRecord {
  id: string;
  name: string;
  type: string;
  size: string;
  status: string;
  path: string;
  createdAt: string;
}

function typeLabel(type: string) {
  if (type === "MySQL" || type === "PostgreSQL") return `Database · ${type}`;
  if (type === "Full System") return "Full System";
  return type || "Backup";
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<BackupRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/backups");
      if (!res.ok) throw new Error("Failed to load backups");
      setBackups(await res.json());
    } catch (error: any) {
      toast.error(error.message || "Failed to load backups");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
    const interval = setInterval(fetchBackups, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleBackupEverything = async () => {
    setIsWorking(true);
    toast.loading("Starting complete backup...");
    try {
      const [filesResponse, databasesResponse] = await Promise.all([
        fetch("/api/backups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "full-system",
            type: "Advanced",
            options: {
              targets: { all: true, selected: [] },
              opts: { websiteData: true, database: true, panelConfigs: true },
            },
          }),
        }),
        fetch("/api/backups/database/all", { method: "POST" }),
      ]);

      const filesData = await filesResponse.json().catch(() => ({}));
      const databasesData = await databasesResponse.json().catch(() => ({}));
      if (!filesResponse.ok) throw new Error(filesData.error || "Failed to start file backup");
      if (!databasesResponse.ok) throw new Error(databasesData.error || "Failed to start database backup");

      toast.dismiss();
      toast.success("Complete backup started");
      fetchBackups();
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Backup failed");
    } finally {
      setIsWorking(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsWorking(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/backups/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast.success("Backup uploaded");
      fetchBackups();
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setIsWorking(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRestore = async (backup: BackupRecord) => {
    setIsWorking(true);
    try {
      const res = await fetch(`/api/backups/${backup.id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPath: "/" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Restore failed");
      toast.success("Restore started in background");
    } catch (error: any) {
      toast.error(error.message || "Restore failed");
    } finally {
      setIsWorking(false);
      setConfirmRestore(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/backups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Backup deleted");
      fetchBackups();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete Backup"
        description="This archive will be permanently deleted."
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
      <ConfirmDialog
        open={!!confirmRestore}
        onOpenChange={(open) => !open && setConfirmRestore(null)}
        title="Restore Backup"
        description={`Restore ${confirmRestore?.name}? Existing data may be overwritten.`}
        onConfirm={() => confirmRestore && handleRestore(confirmRestore)}
      />

      <div className="flex flex-col gap-4 rounded-none border bg-card p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backups</h1>
          <p className="mt-1 text-muted-foreground">One-click backup for websites, Panel data, configs, and databases.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="w-full sm:w-auto" onClick={handleBackupEverything} disabled={isWorking}>
            <Server className="mr-2 h-4 w-4" />
            {isWorking ? "Working..." : "Backup Everything"}
          </Button>
          <input ref={fileInputRef} type="file" accept=".tar.gz,.tgz,application/gzip" className="hidden" onChange={handleUpload} />
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isWorking}>
            <Upload className="mr-2 h-4 w-4" /> Upload Backup
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backup Archives</CardTitle>
          <CardDescription>File archives and database dumps stored in /var/www/backups.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Archive</TableHead>
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
                    <div className="flex items-center gap-2"><HardDrive className="h-4 w-4 text-muted-foreground" />{backup.name}</div>
                  </TableCell>
                  <TableCell>{typeLabel(backup.type)}</TableCell>
                  <TableCell>{backup.size}</TableCell>
                  <TableCell>{new Date(backup.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Restore" onClick={() => setConfirmRestore(backup)} disabled={backup.status !== "Completed"}><RotateCcw className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Download" onClick={() => window.open(`/api/files/download?path=${encodeURIComponent(backup.path)}`, "_blank")}><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" title="Delete" onClick={() => setConfirmDelete(backup.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {backups.length === 0 && !isLoading && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No backup archives found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
