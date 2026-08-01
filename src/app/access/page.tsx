"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Trash2, Key, TerminalSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AccessPage() {
  const accounts = [
    { id: 1, username: "admin", type: "System Admin", access: ["SSH", "FTP", "Panel"], path: "/", status: "Active" },
    { id: 2, username: "deployer", type: "Limited", access: ["SSH", "FTP"], path: "/var/www/html", status: "Active" },
    { id: 3, username: "backup_user", type: "Limited", access: ["FTP"], path: "/backups", status: "Inactive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">บัญชีผู้ใช้ (Access Management)</h1>
          <p className="text-muted-foreground mt-1">Manage FTP and SSH accounts for server access.</p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" /> สร้างบัญชีใหม่ (Create Account)
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] md:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>สร้างบัญชี (Create Account)</DialogTitle>
              <DialogDescription>Add a new system user for SSH or FTP access.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="e.g. webuser1" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter secure password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="path">Home Directory (Path)</Label>
                <Input id="path" defaultValue="/var/www/html" />
              </div>
              <div className="grid gap-2">
                <Label>Access Protocols</Label>
                <div className="flex flex-col gap-2 mt-2">
                  <Label className="flex items-center gap-2 font-normal cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                    FTP Access
                  </Label>
                  <Label className="flex items-center gap-2 font-normal cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                    SSH Access (Jailed Environment)
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button">ยกเลิก (Cancel)</Button>
              <Button type="submit">สร้างบัญชี (Create)</Button>
            </DialogFooter>
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
                <TableHead className="text-right w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold uppercase">
                      {acc.username.substring(0, 2)}
                    </div>
                    {acc.username}
                  </TableCell>
                  <TableCell>{acc.type}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {acc.access.map((proto) => (
                        <Badge key={proto} variant="secondary" className="font-mono text-xs">
                          {proto}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{acc.path}</TableCell>
                  <TableCell>
                    <Badge variant={acc.status === "Active" ? "default" : "outline"} className={acc.status === "Active" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-0" : ""}>
                      {acc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Change Password" />}>
                          <Key className="h-4 w-4" />
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                              Update the password for <strong>{acc.username}</strong>.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor={`new-pwd-${acc.id}`}>New Password</Label>
                              <Input id={`new-pwd-${acc.id}`} type="password" placeholder="Enter new password" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" type="button">ยกเลิก (Cancel)</Button>
                            <Button type="submit">บันทึก (Save)</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete Account" />}>
                          <Trash2 className="h-4 w-4" />
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle className="text-destructive">Delete Account</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete the user <strong>{acc.username}</strong>? They will lose all access to the server.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="mt-4">
                            <Button variant="outline" type="button">ยกเลิก (Cancel)</Button>
                            <Button variant="destructive" type="button">ลบ (Delete)</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
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
