"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Plus, Trash2, Edit2, PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function CronPage() {
  const crons = [
    { id: 1, minute: "0", hour: "0", day: "*", month: "*", weekday: "*", command: "/usr/bin/php /var/www/html/artisan schedule:run", description: "Daily Laravel Schedule" },
    { id: 2, minute: "*/5", hour: "*", day: "*", month: "*", weekday: "*", command: "node /app/scripts/check-status.js", description: "Check API Status" },
    { id: 3, minute: "30", hour: "3", day: "1", month: "*", weekday: "*", command: "/root/backup-db.sh", description: "Monthly Database Backup" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการตั้งเวลา (Cron Jobs)</h1>
          <p className="text-muted-foreground mt-1">Schedule automated tasks to run on the server.</p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" /> เพิ่ม Cron Job (Add Cron)
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>เพิ่ม Cron Job</DialogTitle>
              <DialogDescription>Define the schedule and command for the new automated task.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-5 gap-1 sm:gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="minute" className="text-xs text-center">Minute</Label>
                  <Input id="minute" defaultValue="*" className="text-center font-mono" />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="hour" className="text-xs text-center">Hour</Label>
                  <Input id="hour" defaultValue="*" className="text-center font-mono" />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="day" className="text-xs text-center">Day</Label>
                  <Input id="day" defaultValue="*" className="text-center font-mono" />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="month" className="text-xs text-center">Month</Label>
                  <Input id="month" defaultValue="*" className="text-center font-mono" />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="weekday" className="text-xs text-center">Weekday</Label>
                  <Input id="weekday" defaultValue="*" className="text-center font-mono" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="command">Command to run</Label>
                <Input id="command" placeholder="e.g. /usr/bin/php /var/www/html/script.php" className="font-mono text-sm" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input id="description" placeholder="What does this task do?" />
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
                      <span className="w-6 text-center bg-muted/50 rounded-md py-0.5">{cron.minute}</span>
                      <span className="w-6 text-center bg-muted/50 rounded-md py-0.5">{cron.hour}</span>
                      <span className="w-6 text-center bg-muted/50 rounded-md py-0.5">{cron.day}</span>
                      <span className="w-6 text-center bg-muted/50 rounded-md py-0.5">{cron.month}</span>
                      <span className="w-6 text-center bg-muted/50 rounded-md py-0.5">{cron.weekday}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm max-w-[300px] truncate" title={cron.command}>
                    {cron.command}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{cron.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" title="Run Now" />}>
                          <PlayCircle className="h-4 w-4" />
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Run Cron Job</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to run this task immediately?
                              <div className="mt-4 p-3 bg-muted/50 rounded-md font-mono text-xs text-foreground overflow-x-auto whitespace-nowrap">
                                {cron.command}
                              </div>
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="mt-4">
                            <Button variant="outline" type="button">ยกเลิก (Cancel)</Button>
                            <Button variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white" type="button">รันทันที (Run Now)</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" />}>
                          <Edit2 className="h-4 w-4" />
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Edit Cron Job</DialogTitle>
                            <DialogDescription>Update the schedule and command for this task.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-5 gap-2">
                              <div className="grid gap-1">
                                <Label htmlFor={`edit-min-${cron.id}`} className="text-xs text-center">Minute</Label>
                                <Input id={`edit-min-${cron.id}`} defaultValue={cron.minute} className="text-center font-mono" />
                              </div>
                              <div className="grid gap-1">
                                <Label htmlFor={`edit-hour-${cron.id}`} className="text-xs text-center">Hour</Label>
                                <Input id={`edit-hour-${cron.id}`} defaultValue={cron.hour} className="text-center font-mono" />
                              </div>
                              <div className="grid gap-1">
                                <Label htmlFor={`edit-day-${cron.id}`} className="text-xs text-center">Day</Label>
                                <Input id={`edit-day-${cron.id}`} defaultValue={cron.day} className="text-center font-mono" />
                              </div>
                              <div className="grid gap-1">
                                <Label htmlFor={`edit-month-${cron.id}`} className="text-xs text-center">Month</Label>
                                <Input id={`edit-month-${cron.id}`} defaultValue={cron.month} className="text-center font-mono" />
                              </div>
                              <div className="grid gap-1">
                                <Label htmlFor={`edit-week-${cron.id}`} className="text-xs text-center">Weekday</Label>
                                <Input id={`edit-week-${cron.id}`} defaultValue={cron.weekday} className="text-center font-mono" />
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`edit-cmd-${cron.id}`}>Command to run</Label>
                              <Input id={`edit-cmd-${cron.id}`} defaultValue={cron.command} className="font-mono text-sm" />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`edit-desc-${cron.id}`}>Description (Optional)</Label>
                              <Input id={`edit-desc-${cron.id}`} defaultValue={cron.description} />
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
                            <DialogTitle className="text-destructive">Delete Cron Job</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this automated task? It will no longer run on the schedule.
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
