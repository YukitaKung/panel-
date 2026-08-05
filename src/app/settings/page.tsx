"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, Monitor, Info, HardDrive, Cpu, MemoryStick, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/system/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleTimezoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTz = e.target.value;
    if (!newTz) return;
    
    try {
      toast.loading("Updating timezone...");
      const res = await fetch("/api/system/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: newTz })
      });
      
      if (res.ok) {
        toast.dismiss();
        toast.success("Timezone updated successfully!");
        setSettings({ ...settings, timezone: newTz });
      } else {
        throw new Error("Failed to update");
      }
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to update timezone");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">View server information and configuration.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">กำลังโหลดข้อมูลการตั้งค่า...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Operating System
              </CardTitle>
              <CardDescription>Details about the host operating system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b">
                <span className="text-muted-foreground">Hostname</span>
                <span className="font-medium break-all sm:text-right">{settings?.hostname || "-"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b">
                <span className="text-muted-foreground">OS Name</span>
                <span className="font-medium break-words sm:text-right">{settings?.os || "-"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b">
                <span className="text-muted-foreground">Kernel Version</span>
                <span className="font-medium break-all sm:text-right">{settings?.kernel || "-"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b">
                <span className="text-muted-foreground">Public IP</span>
                <span className="font-medium break-all sm:text-right">{settings?.ip || "-"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4"/> Timezone</span>
                <select 
                  className="bg-muted text-foreground border border-border rounded-none px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-[200px]"
                  value={settings?.timezone || ""}
                  onChange={handleTimezoneChange}
                >
                  <option value="" disabled>Select Timezone</option>
                  {settings?.availableTimezones?.map((tz: string) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Software Versions
              </CardTitle>
              <CardDescription>Installed software and runtime versions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Node.js</span>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{settings?.node || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Nginx</span>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{settings?.nginx || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Database</span>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">SQLite</span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                System Information
              </CardTitle>
              <CardDescription>Server resources are actively monitored in the Dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                สำหรับข้อมูลการใช้ CPU, RAM และ Network แบบละเอียด รวมถึงบริการ (Services) ที่กำลังทำงานอยู่ สามารถตรวจสอบแบบ Real-time ได้ที่หน้า <b>ภาพรวม (Dashboard)</b>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
