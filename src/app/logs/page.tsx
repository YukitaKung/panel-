"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Download, Search, RefreshCw, Trash2, StopCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState("app");
  const [logs, setLogs] = useState<{ [key: string]: string }>({});
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const endOfLogsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const fetchLogs = async (type: string) => {
    try {
      const res = await fetch(`/api/logs?type=${type}`);
      const data = await res.json();
      if (res.ok) {
        setLogs(prev => ({ ...prev, [type]: data.logs }));
      } else {
        toast.error(`Error fetching ${type} logs: ${data.error}`);
      }
    } catch (error) {
      console.error("Fetch logs error:", error);
    }
  };

  useEffect(() => {
    // Only fetch immediately on tab change or if we are auto-scrolling
    if (isAutoScroll && !isPaused) {
      fetchLogs(activeTab);
    }
    
    // If paused manually or user scrolled up, stop polling entirely
    if (isPaused || !isAutoScroll) return;

    const interval = setInterval(() => {
      fetchLogs(activeTab);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTab, isPaused, isAutoScroll]);

  // Auto-scroll to bottom only if user hasn't manually scrolled up
  useEffect(() => {
    if (isAutoScroll && !isPaused) {
      endOfLogsRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, activeTab, isPaused, isAutoScroll]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // If user is within 50px of the bottom, enable auto-scroll, otherwise disable it
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAutoScroll(isAtBottom);
  };

  const handleClear = () => {
    setLogs(prev => ({ ...prev, [activeTab]: "" }));
  };

  const handleExport = () => {
    const logContent = logs[activeTab] || "";
    const blob = new Blob([logContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayedLogs = (logs[activeTab] || "").split("\n").filter(line => 
    line.toLowerCase().includes(searchQuery.toLowerCase())
  ).join("\n");

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
          <p className="text-muted-foreground mt-1">Real-time log viewer for system and applications.</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
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
                  <Input 
                    type="search" 
                    placeholder="Filter logs..." 
                    className="pl-8 h-9" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button 
                  variant={isPaused ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? <Play className="h-4 w-4 mr-2" /> : <StopCircle className="h-4 w-4 mr-2" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => fetchLogs(activeTab)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleClear}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden relative bg-[#1a1b26]">
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="h-full p-4 font-mono text-sm overflow-auto text-[#a9b1d6] whitespace-pre-wrap"
            >
              {displayedLogs || "No logs available."}
              {!isPaused && (
                <div className="flex items-center mt-2">
                  <span className="animate-pulse w-2 h-4 bg-white inline-block"></span>
                </div>
              )}
              <div ref={endOfLogsRef} />
            </div>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
