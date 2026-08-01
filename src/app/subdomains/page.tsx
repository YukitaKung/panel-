"use client";

import React, { useState, useEffect } from "react";
import { Globe, Plus, Trash2, Server, FolderCode, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Subdomain {
  domain: string;
  type: "php" | "node";
  port: string | null;
  createdAt: string;
}

export default function SubdomainsPage() {
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  const [newDomain, setNewDomain] = useState("");
  const [newType, setNewType] = useState<"php" | "node">("php");
  const [newPort, setNewPort] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchSubdomains = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subdomains");
      const data = await res.json();
      setSubdomains(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubdomains();
  }, []);

  const handleCreate = async () => {
    setError(null);
    if (!newDomain) {
      setError("Please enter a domain name.");
      return;
    }
    if (newType === "node" && !newPort) {
      setError("Please enter the target port for Node.js app.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/subdomains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain, type: newType, port: newPort }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to create subdomain");
      
      setIsDialogOpen(false);
      setNewDomain("");
      setNewPort("");
      setNewType("php");
      fetchSubdomains();
      toast.success(`Subdomain ${newDomain} created successfully!`);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (domain: string) => {
    try {
      const res = await fetch(`/api/subdomains?domain=${encodeURIComponent(domain)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      toast.success(`Deleted routing for ${domain}`);
      fetchSubdomains();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog 
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete Subdomain"
        description={`Are you sure you want to delete routing for ${confirmDelete}? The files in /var/www/${confirmDelete} will NOT be deleted.`}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subdomains & Routing</h1>
          <p className="text-muted-foreground mt-1">Manage Nginx reverse proxy and virtual hosts dynamically.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchSubdomains} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {/* @ts-ignore */}
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Subdomain
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] md:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Create Subdomain / Domain</DialogTitle>
                <DialogDescription>
                  Configure how Nginx should route traffic for this domain.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="domain">Domain or Subdomain Name</Label>
                  <Input 
                    id="domain" 
                    className="h-11 text-base"
                    placeholder="e.g. blog.mydomain.com" 
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Routing Type</Label>
                  <Select value={newType} onValueChange={(val: "php" | "node" | null) => val && setNewType(val)}>
                    <SelectTrigger className="h-11 text-base">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="php" className="py-3 text-base">
                        <div className="flex items-center">
                          <FolderCode className="w-5 h-5 mr-3 text-blue-500" />
                          Static / PHP (Folder)
                        </div>
                      </SelectItem>
                      <SelectItem value="node" className="py-3 text-base">
                        <div className="flex items-center">
                          <Server className="w-5 h-5 mr-3 text-green-500" />
                          Node.js (Reverse Proxy)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newType === "php" ? (
                  <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Info:</span> A new web root folder will automatically be created at <code className="bg-background px-1 rounded">/var/www/{newDomain || "domain"}</code>. You can upload your HTML/PHP files there.
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="port">Target Local Port</Label>
                    <Input 
                      id="port" 
                      type="number"
                      className="h-11 text-base"
                      placeholder="e.g. 3000" 
                      value={newPort}
                      onChange={(e) => setNewPort(e.target.value)}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Nginx will proxy all traffic from this domain to <code className="bg-muted px-1 rounded">http://127.0.0.1:{newPort || "PORT"}</code>.
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isCreating}>Cancel</Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create & Reload Nginx
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subdomains.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                    <Globe className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No subdomains configured yet.
                  </TableCell>
                </TableRow>
              )}
              {subdomains.map((sub, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <a href={`http://${sub.domain}`} target="_blank" rel="noreferrer" className="hover:underline hover:text-primary flex items-center">
                        {sub.domain}
                        <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    {sub.type === "php" ? (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Static / PHP</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Node.js Proxy</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">
                    {sub.type === "php" ? `/var/www/${sub.domain}` : `127.0.0.1:${sub.port}`}
                  </TableCell>
                  <TableCell className="text-right">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => setConfirmDelete(sub.domain)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
