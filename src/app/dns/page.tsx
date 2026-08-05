"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Trash2, Edit2, Globe, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface DnsRecord {
  id: string;
  domain: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
}

export default function DNSPage() {
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DnsRecord | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    domain: "",
    type: "A",
    name: "",
    content: "",
    ttl: 3600
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const url = selectedDomain !== "all" ? `/api/dns?domain=${selectedDomain}` : "/api/dns";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setRecords(data.records);
      } else {
        toast.error(data.error || "Failed to load DNS records");
      }
    } catch (error) {
      toast.error("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedDomain]);

  // Extract unique domains for the filter
  const uniqueDomains = Array.from(new Set(records.map(r => r.domain)));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.domain || !formData.name || !formData.content) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    try {
      const res = await fetch("/api/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("DNS record added successfully");
        setIsAddOpen(false);
        setFormData({ domain: "", type: "A", name: "", content: "", ttl: 3600 });
        fetchRecords();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add record");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecord) return;
    
    try {
      const res = await fetch(`/api/dns/${currentRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentRecord)
      });
      if (res.ok) {
        toast.success("DNS record updated successfully");
        setIsEditOpen(false);
        setCurrentRecord(null);
        fetchRecords();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update record");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async () => {
    if (!currentRecord) return;
    
    try {
      const res = await fetch(`/api/dns/${currentRecord.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("DNS record deleted");
        setIsDeleteOpen(false);
        setCurrentRecord(null);
        fetchRecords();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete record");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const filteredRecords = records.filter(record => 
    record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการโดเมน (DNS Management)</h1>
          <p className="text-muted-foreground mt-1">Manage DNS zones and records for your domains.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" /> เพิ่มเรคคอร์ด (Add Record)
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>เพิ่ม DNS Record</DialogTitle>
                <DialogDescription>Create a new DNS record for your zone.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input id="domain" placeholder="e.g. example.com" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Record Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v as string})}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="AAAA">AAAA</SelectItem>
                      <SelectItem value="CNAME">CNAME</SelectItem>
                      <SelectItem value="MX">MX</SelectItem>
                      <SelectItem value="TXT">TXT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="e.g. www or @ for root" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content / Value</Label>
                  <Input id="content" placeholder="e.g. 192.168.1.100" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ttl">TTL (Seconds)</Label>
                  <Input id="ttl" type="number" value={formData.ttl} onChange={e => setFormData({...formData, ttl: parseInt(e.target.value) || 3600})} required />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddOpen(false)}>ยกเลิก (Cancel)</Button>
                <Button type="submit">บันทึก (Save)</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-soft border-muted/40">
        <CardHeader className="bg-muted/10 border-b">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> {selectedDomain === "all" ? "All Domains" : selectedDomain}
              </CardTitle>
              <CardDescription>Current active zone records</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={selectedDomain} onValueChange={(v) => setSelectedDomain(v as string)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {uniqueDomains.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search records..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Domain</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>TTL</TableHead>
                  <TableHead className="text-right w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No DNS records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.domain}</TableCell>
                      <TableCell className="font-medium">{record.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-none bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-border">
                          {record.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm max-w-[200px] truncate" title={record.content}>
                        {record.content}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{record.ttl}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setCurrentRecord(record); setIsEditOpen(true); }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setCurrentRecord(record); setIsDeleteOpen(true); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-xl">
          {currentRecord && (
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit DNS Record</DialogTitle>
                <DialogDescription>Update the details of this DNS record.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-domain">Domain</Label>
                  <Input id="edit-domain" value={currentRecord.domain} onChange={e => setCurrentRecord({...currentRecord, domain: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-type">Record Type</Label>
                  <Select value={currentRecord.type} onValueChange={(v) => setCurrentRecord({...currentRecord, type: v as string})}>
                    <SelectTrigger id="edit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="AAAA">AAAA</SelectItem>
                      <SelectItem value="CNAME">CNAME</SelectItem>
                      <SelectItem value="MX">MX</SelectItem>
                      <SelectItem value="TXT">TXT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input id="edit-name" value={currentRecord.name} onChange={e => setCurrentRecord({...currentRecord, name: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-content">Content / Value</Label>
                  <Input id="edit-content" value={currentRecord.content} onChange={e => setCurrentRecord({...currentRecord, content: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-ttl">TTL (Seconds)</Label>
                  <Input id="edit-ttl" type="number" value={currentRecord.ttl} onChange={e => setCurrentRecord({...currentRecord, ttl: parseInt(e.target.value) || 3600})} required />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>ยกเลิก (Cancel)</Button>
                <Button type="submit">บันทึก (Save)</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the <strong>{currentRecord?.type}</strong> record for <strong>{currentRecord?.name}</strong> in {currentRecord?.domain}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" type="button" onClick={() => setIsDeleteOpen(false)}>ยกเลิก (Cancel)</Button>
            <Button variant="destructive" type="button" onClick={handleDelete}>ลบ (Delete)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
