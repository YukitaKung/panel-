"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Trash2, Edit2, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function DNSPage() {
  const records = [
    { id: 1, name: "example.com.", type: "A", value: "192.168.1.100", ttl: "3600" },
    { id: 2, name: "www.example.com.", type: "CNAME", value: "example.com.", ttl: "3600" },
    { id: 3, name: "example.com.", type: "MX", value: "10 mail.example.com.", ttl: "14400" },
    { id: 4, name: "example.com.", type: "TXT", value: '"v=spf1 a mx ~all"', ttl: "14400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการโดเมน (DNS Management)</h1>
          <p className="text-muted-foreground mt-1">Manage DNS zones and records for your domains.</p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" /> เพิ่มเรคคอร์ด (Add Record)
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>เพิ่ม DNS Record</DialogTitle>
              <DialogDescription>Create a new DNS record for your zone.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Record Type</Label>
                <Select defaultValue="A">
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="CNAME">CNAME</SelectItem>
                    <SelectItem value="MX">MX</SelectItem>
                    <SelectItem value="TXT">TXT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="e.g. www or @ for root" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value">Value</Label>
                <Input id="value" placeholder="e.g. 192.168.1.100" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ttl">TTL (Seconds)</Label>
                <Input id="ttl" type="number" defaultValue="3600" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button">ยกเลิก (Cancel)</Button>
              <Button type="submit">บันทึก (Save)</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-soft border-muted/40">
        <CardHeader className="bg-muted/10 border-b">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> example.com
              </CardTitle>
              <CardDescription>Current active zone records</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select defaultValue="example.com">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="example.com">example.com</SelectItem>
                  <SelectItem value="app.com">app.com</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search records..." className="pl-8" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>TTL</TableHead>
                <TableHead className="text-right w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-none bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-border">
                      {record.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{record.value}</TableCell>
                  <TableCell className="text-muted-foreground">{record.ttl}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" />}>
                          <Edit2 className="h-4 w-4" />
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                          <DialogHeader>
                            <DialogTitle>Edit DNS Record</DialogTitle>
                            <DialogDescription>Update the details of this DNS record.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor={`edit-type-${record.id}`}>Record Type</Label>
                              <Select defaultValue={record.type}>
                                <SelectTrigger id={`edit-type-${record.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="A">A</SelectItem>
                                  <SelectItem value="CNAME">CNAME</SelectItem>
                                  <SelectItem value="MX">MX</SelectItem>
                                  <SelectItem value="TXT">TXT</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`edit-name-${record.id}`}>Name</Label>
                              <Input id={`edit-name-${record.id}`} defaultValue={record.name} />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`edit-value-${record.id}`}>Value</Label>
                              <Input id={`edit-value-${record.id}`} defaultValue={record.value} />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`edit-ttl-${record.id}`}>TTL (Seconds)</Label>
                              <Input id={`edit-ttl-${record.id}`} type="number" defaultValue={record.ttl} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" type="button">ยกเลิก (Cancel)</Button>
                            <Button type="submit">บันทึก (Save)</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" />}>
                          <Trash2 className="h-4 w-4" />
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle className="text-destructive">Delete Record</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete the <strong>{record.type}</strong> record for <strong>{record.name}</strong>? This action cannot be undone.
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
