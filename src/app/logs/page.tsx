"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Download, Search, RefreshCw, Trash2, StopCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

const logData = `[2024-10-25 10:15:32] INFO: Server started on port 3001
[2024-10-25 10:15:33] Database connection established successfully.
[2024-10-25 10:15:35] Incoming GET request to /api/users
[2024-10-25 10:15:35] Response 200 OK (15ms)
[2024-10-25 10:18:22] Incoming POST request to /api/login
[2024-10-25 10:18:22] Response 200 OK (42ms)
[2024-10-25 10:22:15] Incoming GET request to /api/metrics
[2024-10-25 10:22:15] Response 200 OK (12ms)
[2024-10-25 10:25:01] CRON: Running scheduled cleanup task...
[2024-10-25 10:25:02] CRON: Cleanup completed. Removed 42 temp files.
`;

export default function LogsPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
          <p className="text-muted-foreground mt-1">Real-time log viewer for system and applications.</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="app" className="flex-1 flex flex-col">
          <CardHeader className="py-3 px-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="app">Applications</TabsTrigger>
                <TabsTrigger value="nginx">Nginx</TabsTrigger>
                <TabsTrigger value="pm2">PM2</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Filter logs..." className="pl-8 h-9" />
                </div>
                <Button variant="outline" size="sm">
                  <StopCircle className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden relative bg-[#1a1b26]">
            <TabsContent value="app" className="h-full m-0 data-[state=active]:flex flex-col border-0">
              <div className="flex-1 p-4 font-mono text-sm overflow-auto text-[#a9b1d6] whitespace-pre-wrap">
                {logData}
                <div className="flex items-center mt-2">
                  <span className="animate-pulse w-2 h-4 bg-white inline-block"></span>
                </div>
              </div>
            </TabsContent>
            {/* Other tabs would have similar content */}
            <TabsContent value="nginx" className="h-full m-0 data-[state=active]:flex flex-col border-0">
              <div className="flex-1 p-4 font-mono text-sm overflow-auto text-[#a9b1d6] whitespace-pre-wrap">
                [25/Oct/2024:10:15:32 +0000] "GET / HTTP/1.1" 200 154 "-" "Mozilla/5.0"
              </div>
            </TabsContent>
            <TabsContent value="pm2" className="h-full m-0 data-[state=active]:flex flex-col border-0">
              <div className="flex-1 p-4 font-mono text-sm overflow-auto text-[#a9b1d6] whitespace-pre-wrap">
                [PM2] App [api] launched (1 instances)
              </div>
            </TabsContent>
            <TabsContent value="system" className="h-full m-0 data-[state=active]:flex flex-col border-0">
              <div className="flex-1 p-4 font-mono text-sm overflow-auto text-[#a9b1d6] whitespace-pre-wrap">
                Oct 25 10:15:32 server systemd[1]: Started Nginx Web Server.
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
