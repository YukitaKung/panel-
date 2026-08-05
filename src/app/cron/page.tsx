"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Plus, Trash2, Edit2, PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function CronPage() {
  const [crons, setCrons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState<{open: boolean, id: string | null}>({open: false, id: null});
  
  // Forms state
  const defaultCron = { minute: "*", hour: "*", day: "*", month: "*", weekday: "*", command: "", description: "" };
  const [formData, setFormData] = useState(defaultCron);

  const fetchCrons = async () => {
    try {
      const res = await fetch("/api/cron");
      if (res.ok) {
        const data = await res.json();
        setCrons(data.jobs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrons();
  }, []);

  const handleSave = async (e: React.FormEvent, isEdit: boolean = false) => {
    e.preventDefault();
    try {
      toast.loading("Saving cron job...");
      const payload = isEdit ? { ...formData, id: isEditOpen.id } : formData;
      const res = await fetch("/api/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.dismiss();
        toast.success("Saved successfully!");
        setFormData(defaultCron);
        if (isEdit) setIsEditOpen({open: false, id: null});
        else setIsAddOpen(false);
        fetchCrons();
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cron job?")) return;
    try {
      toast.loading("Deleting...");
      const res = await fetch(`/api/cron?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        toast.dismiss();
        toast.success("Deleted successfully!");
        fetchCrons();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const handleRunNow = async (command: string) => {
    try {
      toast.loading("Sending command...");
      const res = await fetch("/api/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run", command })
      });
      if (res.ok) {
        toast.dismiss();
        toast.success("Command started in background!");
      } else {
        throw new Error("Failed to run");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  const openEdit = (cron: any) => {
    setFormData({
      minute: cron.minute,
      hour: cron.hour,
      day: cron.day,
      month: cron.month,
      weekday: cron.weekday,
      command: cron.command,
      description: cron.description || ""
    });
    setIsEditOpen({open: true, id: cron.id});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการตั้งเวลา (Cron Jobs)</h1>
          <p className="text-muted-foreground mt-1">Schedule automated tasks to run on the server.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) setFormData(defaultCron); }}>
          <DialogTrigger render={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> เพิ่ม Cron Job (Add Cron)
            </Button>
          } />
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={(e) => handleSave(e, false)}>
              <DialogHeader>
                <DialogTitle>เพิ่ม Cron Job</DialogTitle>
                <DialogDescription>Define the schedule and command for the new automated task.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                  <div className="grid gap-1">
                    <Label htmlFor="minute" className="text-xs text-center">Minute</Label>
                    <Input id="minute" value={formData.minute} onChange={e=>setFormData({...formData, minute: e.target.value})} className="text-center font-mono" required />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="hour" className="text-xs text-center">Hour</Label>
                    <Input id="hour" value={formData.hour} onChange={e=>setFormData({...formData, hour: e.target.value})} className="text-center font-mono" required />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="day" className="text-xs text-center">Day</Label>
                    <Input id="day" value={formData.day} onChange={e=>setFormData({...formData, day: e.target.value})} className="text-center font-mono" required />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="month" className="text-xs text-center">Month</Label>
                    <Input id="month" value={formData.month} onChange={e=>setFormData({...formData, month: e.target.value})} className="text-center font-mono" required />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="weekday" className="text-xs text-center">Weekday</Label>
                    <Input id="weekday" value={formData.weekday} onChange={e=>setFormData({...formData, weekday: e.target.value})} className="text-center font-mono" required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="command">Command to run</Label>
                  <Input id="command" value={formData.command} onChange={e=>setFormData({...formData, command: e.target.value})} placeholder="e.g. /usr/bin/php /var/www/html/script.php" className="font-mono text-sm" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input id="description" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} placeholder="What does this task do?" />
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
          <CardTitle>Scheduled Tasks</CardTitle>
          <CardDescription>All active cron jobs running on your server.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[200px]">Schedule (m h d m w)</TableHead>
                <TableHead>Command</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crons.map((cron) => (
                <TableRow key={cron.id}>
                  <TableCell>
                    <div className="flex items-center gap-1 sm:gap-2 font-mono text-xs">
                      <span className="w-6 text-center bg-muted/50 rounded-none py-0.5">{cron.minute}</span>
                      <span className="w-6 text-center bg-muted/50 rounded-none py-0.5">{cron.hour}</span>
                      <span className="w-6 text-center bg-muted/50 rounded-none py-0.5">{cron.day}</span>
                      <span className="w-6 text-center bg-muted/50 rounded-none py-0.5">{cron.month}</span>
                      <span className="w-6 text-center bg-muted/50 rounded-none py-0.5">{cron.weekday}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm max-w-[300px] truncate" title={cron.command}>
                    {cron.command}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{cron.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" title="Run Now" onClick={() => handleRunNow(cron.command)}>
                        <PlayCircle className="h-4 w-4" />
                      </Button>
                      
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(cron)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(cron.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {crons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No cron jobs configured yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Edit Dialog - Kept separate to avoid rendering issues within map loop */}
      <Dialog open={isEditOpen.open} onOpenChange={(open) => setIsEditOpen({...isEditOpen, open})}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={(e) => handleSave(e, true)}>
            <DialogHeader>
              <DialogTitle>Edit Cron Job</DialogTitle>
              <DialogDescription>Update the schedule and command for this task.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-5 gap-1 sm:gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="edit-minute" className="text-xs text-center">Minute</Label>
                  <Input id="edit-minute" value={formData.minute} onChange={e=>setFormData({...formData, minute: e.target.value})} className="text-center font-mono" required />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="edit-hour" className="text-xs text-center">Hour</Label>
                  <Input id="edit-hour" value={formData.hour} onChange={e=>setFormData({...formData, hour: e.target.value})} className="text-center font-mono" required />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="edit-day" className="text-xs text-center">Day</Label>
                  <Input id="edit-day" value={formData.day} onChange={e=>setFormData({...formData, day: e.target.value})} className="text-center font-mono" required />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="edit-month" className="text-xs text-center">Month</Label>
                  <Input id="edit-month" value={formData.month} onChange={e=>setFormData({...formData, month: e.target.value})} className="text-center font-mono" required />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="edit-weekday" className="text-xs text-center">Weekday</Label>
                  <Input id="edit-weekday" value={formData.weekday} onChange={e=>setFormData({...formData, weekday: e.target.value})} className="text-center font-mono" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-command">Command to run</Label>
                <Input id="edit-command" value={formData.command} onChange={e=>setFormData({...formData, command: e.target.value})} className="font-mono text-sm" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Input id="edit-description" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsEditOpen({open: false, id: null})}>ยกเลิก (Cancel)</Button>
              <Button type="submit">บันทึก (Save)</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
