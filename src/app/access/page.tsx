"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Trash2, Key, TerminalSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { useState, useEffect } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

export default function AccessPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    path: "/var/www/apps",
    protocols: ["FTP", "SSH"]
  });

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/access");
      if (res.ok) setAccounts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      toast.loading("Creating system user...");
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.dismiss();
        toast.success("User created successfully!");
        setIsDialogOpen(false);
        fetchAccounts();
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    try {
      toast.loading(`Deleting ${username}...`);
      const res = await fetch(`/api/access/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.dismiss();
        toast.success("User deleted successfully!");
        fetchAccounts();
      } else {
        throw new Error("Failed to delete user");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">บัญชีผู้ใช้ (Access Management)</h1>
          <p className="text-muted-foreground mt-1">Manage FTP and SSH accounts for server access.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> สร้างบัญชีใหม่ (Create Account)
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] md:max-w-[700px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>สร้างบัญชี (Create Account)</DialogTitle>
                <DialogDescription>Add a new system user for SSH or FTP access.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="e.g. webuser1" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter secure password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="path">Home Directory (Path)</Label>
                  <Input id="path" value={formData.path} onChange={e => setFormData({...formData, path: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label>Access Protocols</Label>
                  <div className="flex flex-col gap-2 mt-2">
                    <Label className="flex items-center gap-2 font-normal cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" checked={formData.protocols.includes("FTP")} onChange={(e) => {
                        const newProtocols = e.target.checked ? [...formData.protocols, "FTP"] : formData.protocols.filter(p => p !== "FTP");
                        setFormData({...formData, protocols: newProtocols});
                      }} />
                      FTP Access
                    </Label>
                    <Label className="flex items-center gap-2 font-normal cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" checked={formData.protocols.includes("SSH")} onChange={(e) => {
                        const newProtocols = e.target.checked ? [...formData.protocols, "SSH"] : formData.protocols.filter(p => p !== "SSH");
                        setFormData({...formData, protocols: newProtocols});
                      }} />
                      SSH Access (Standard User)
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>ยกเลิก (Cancel)</Button>
                <Button type="submit">สร้างบัญชี (Create)</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-soft border-muted/40">
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle>System Accounts</CardTitle>
          <CardDescription>Users with direct file or shell access to the server.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Protocols</TableHead>
                <TableHead>Home Directory</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc) => {
                const protocols = JSON.parse(acc.access || '[]');
                return (
                  <TableRow key={acc.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold uppercase">
                        {acc.username.substring(0, 2)}
                      </div>
                      {acc.username}
                    </TableCell>
                    <TableCell>System User</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {protocols.map((proto: string) => (
                          <Badge key={proto} variant="secondary" className="font-mono text-xs">
                            {proto === "SSH" ? <TerminalSquare className="w-3 h-3 mr-1 inline" /> : null}
                            {proto}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {acc.path}
                    </TableCell>
                    <TableCell>
                      <Badge variant={acc.status === "active" ? "default" : "outline"} className={acc.status === "active" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}>
                        {acc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Change Password">
                          <Key className="h-4 w-4" />
                        </Button>
                        <ConfirmDialog
                          title="Delete User"
                          description={`Are you sure you want to delete ${acc.username}? This will remove their OS access.`}
                          onConfirm={() => handleDelete(acc.id, acc.username)}
                        >
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </TableCell>
                </TableRow>
                )
              })}
              {accounts.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    ไม่มีบัญชีผู้ใช้
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
