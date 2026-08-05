"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { 
  Folder, File, FileText, FileCode2, FileImage, 
  Trash2, ChevronRight, Home, RefreshCw, FilePlus, FolderPlus, Upload, FileArchive, ArchiveRestore
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { FileEditor } from "@/components/file-editor";

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: string;
}

export default function FilesPage() {
  const [currentPath, setCurrentPath] = useState("/");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor State
  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);

  // Dialogs State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<"file" | "folder">("file");
  const [newName, setNewName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch files");
      }
      const data = await res.json();
      setFiles(data);
      setCurrentPath(path);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(currentPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNavigate = (path: string) => {
    fetchFiles(path);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basePath: currentPath,
          name: newName,
          isDirectory: createType === "folder",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }
      setIsCreateDialogOpen(false);
      setNewName("");
      toast.success(`${createType === "folder" ? "Folder" : "File"} created successfully`);
      fetchFiles(currentPath); // Refresh
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (path: string) => {
    try {
      const res = await fetch("/api/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPath: path }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      toast.success("Deleted successfully");
      fetchFiles(currentPath);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("basePath", currentPath);

    try {
      setIsLoading(true);
      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      toast.success(data.htaccessSynced ? "File uploaded and Nginx rules applied" : "File uploaded successfully");
      fetchFiles(currentPath);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExtract = async (archivePath: string) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/files/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: archivePath }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      toast.success(`Extracted ${data.files} file(s)`);
      await fetchFiles(currentPath);
    } catch (err: any) {
      toast.error(err.message || "Failed to extract archive");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFile = async (file: FileItem) => {
    if (file.isDirectory) return;
    try {
      const res = await fetch(`/api/files/content?path=${encodeURIComponent(file.path)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to read file");
      }
      const data = await res.json();
      setEditingFile({ path: file.path, content: data.content });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveFile = async (path: string, content: string) => {
    const res = await fetch("/api/files/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save file");
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (["js", "ts", "jsx", "tsx", "json", "html", "css", "php", "py", "sh"].includes(ext || "")) return <FileCode2 className="w-5 h-5 text-blue-500" />;
    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || "")) return <FileImage className="w-5 h-5 text-purple-500" />;
    if (["txt", "md", "csv", "log"].includes(ext || "")) return <FileText className="w-5 h-5 text-green-500" />;
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  // Breadcrumbs logic
  const breadcrumbs = useMemo(() => {
    if (currentPath === "/") return [{ name: "/", path: "/" }];
    
    const parts = currentPath.split("/").filter(Boolean);
    const crumbs = [{ name: "root", path: "/" }];
    
    let builtPath = "";
    parts.forEach(part => {
      builtPath += `/${part}`;
      crumbs.push({ name: part, path: builtPath });
    });
    return crumbs;
  }, [currentPath]);

  return (
    <div className="space-y-6">
      <ConfirmDialog 
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete File / Folder"
        description={`Are you sure you want to delete ${confirmDelete}? This action cannot be undone.`}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">File Manager</h1>
          <p className="text-muted-foreground">Manage and edit your server files directly.</p>
        </div>
        <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => fetchFiles(currentPath)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            onChange={handleFileUpload} 
          />
          <input
            type="file"
            ref={zipInputRef}
            className="hidden"
            accept=".zip,application/zip"
            onChange={handleFileUpload}
          />
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => zipInputRef.current?.click()}>
            <FileArchive className="w-4 h-4 mr-2" />
            Upload ZIP
          </Button>
          <Button className="w-full sm:w-auto"
            variant="outline" 
            onClick={() => { setCreateType("folder"); setIsCreateDialogOpen(true); }}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>
          <Button className="w-full sm:w-auto"
            onClick={() => { setCreateType("file"); setIsCreateDialogOpen(true); }}
          >
            <FilePlus className="w-4 h-4 mr-2" />
            New File
          </Button>
        </div>
      </div>

      <Card className="flex flex-col">
        {/* Toolbar / Breadcrumbs */}
        <div className="flex items-center space-x-1 p-3 border-b bg-muted/20 overflow-x-auto">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleNavigate("/")}>
            <Home className="w-4 h-4" />
          </Button>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
              <Button 
                variant="ghost" 
                size="sm"
                className={`h-8 px-2 shrink-0 ${idx === breadcrumbs.length - 1 ? "font-bold" : ""}`}
                onClick={() => handleNavigate(crumb.path)}
              >
                {crumb.name}
              </Button>
            </React.Fragment>
          ))}
        </div>

        {/* File Table */}
        <div className="relative min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-sm">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          
          {error && (
            <div className="p-8 text-center text-destructive">
              <p className="text-lg font-semibold">Error Loading Directory</p>
              <p className="text-sm mt-2">{error}</p>
              <Button className="mt-4" variant="outline" onClick={() => fetchFiles(currentPath)}>Retry</Button>
            </div>
          )}

          {!error && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[400px]">Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {/* Up Directory Button */}
                {currentPath !== "/" && (
                  <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => {
                    const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
                    handleNavigate(parent);
                  }}>
                    <TableCell className="font-medium flex items-center space-x-3">
                      <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                      <span>..</span>
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}

                {files.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      This folder is empty.
                    </TableCell>
                  </TableRow>
                )}

                {files.map((file) => (
                  <TableRow 
                    key={file.path}
                    className="cursor-pointer hover:bg-muted/50 group"
                    onClick={() => file.isDirectory ? handleNavigate(file.path) : handleOpenFile(file)}
                  >
                    <TableCell className="font-medium flex items-center space-x-3">
                      {file.isDirectory ? (
                        <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                      ) : (
                        getFileIcon(file.name)
                      )}
                      <span className="truncate max-w-[300px]">{file.name}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {file.isDirectory ? "-" : formatBytes(file.size)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(file.lastModified), "MMM d, yyyy HH:mm")}
                    </TableCell>
                     <TableCell className="text-right">
                       {!file.isDirectory && file.name.toLowerCase().endsWith(".zip") && (
                         <Button
                           variant="ghost"
                           size="icon"
                           title="Extract ZIP"
                           onClick={(e) => { e.stopPropagation(); handleExtract(file.path); }}
                         >
                           <ArchiveRestore className="w-4 h-4" />
                         </Button>
                       )}
                       <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); setConfirmDelete(file.path); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>

      {/* Code Editor Modal */}
      {editingFile && (
        <FileEditor 
          filePath={editingFile.path}
          initialContent={editingFile.content}
          onClose={() => setEditingFile(null)}
          onSave={handleSaveFile}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {createType === "folder" ? "Folder" : "File"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Creating in: <span className="font-mono text-foreground">{currentPath}</span>
            </p>
            <Input
              autoFocus
              placeholder={`Enter ${createType} name...`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
