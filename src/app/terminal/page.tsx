"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2, Settings, Terminal as TerminalIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface HistoryItem {
  id: string;
  type: "input" | "output" | "error";
  text: string;
  cwd?: string;
}

export default function TerminalPage() {
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: "init",
      type: "output",
      text: "Welcome to Web Shell (Stateless)\n\n* This terminal is a stateless shell.\n* Basic commands like 'ls', 'pwd', 'pm2', 'npm' will work.\n* Interactive commands like 'nano' or 'top' are not supported.\n"
    }
  ]);
  const [cwd, setCwd] = useState("/var/www");
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const endOfTerminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stripAnsi = (str: string) => {
    // Regular expression to match ANSI escape sequences
    return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  };

  const scrollToBottom = () => {
    endOfTerminalRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isExecuting) return;

    const cmd = input.trim();
    
    // Add to UI history
    setHistory(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      type: "input",
      text: cmd,
      cwd: cwd
    }]);

    // Add to command navigation history
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setInput("");
    setIsExecuting(true);

    try {
      const res = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd, cwd })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Execution failed");
      
      if (data.newCwd) {
        setCwd(data.newCwd);
      }
      
      if (data.stdout) {
        setHistory(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          type: "output",
          text: stripAnsi(data.stdout)
        }]);
      }
      if (data.stderr) {
        setHistory(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          type: "error",
          text: stripAnsi(data.stderr)
        }]);
      }
    } catch (error: any) {
      setHistory(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        type: "error",
        text: error.message
      }]);
    } finally {
      setIsExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Terminal</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="bash">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Shell" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bash">bash</SelectItem>
              <SelectItem value="zsh">zsh</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 bg-[#1a1b26] border-[#1a1b26] rounded-xl overflow-hidden shadow-xl flex flex-col cursor-text" onClick={() => inputRef.current?.focus()}>
        <div className="h-10 bg-[#16161e] border-b border-[#292e42] flex items-center px-4 shrink-0">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f7768e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#e0af68]"></div>
            <div className="w-3 h-3 rounded-full bg-[#9ece6a]"></div>
          </div>
          <div className="flex-1 text-center text-xs text-[#a9b1d6] font-medium flex items-center justify-center gap-2">
            <TerminalIcon className="h-3 w-3" />
            root@server:{cwd}
          </div>
        </div>
        
        <div className="flex-1 p-4 font-mono text-sm overflow-y-auto text-[#a9b1d6]">
          {history.map((item) => (
            <div key={item.id} className="mb-2 whitespace-pre-wrap break-words">
              {item.type === "input" && (
                <div className="flex items-start">
                  <span className="text-[#9ece6a] font-bold">root@server</span>
                  <span className="text-white">:</span>
                  <span className="text-[#7aa2f7] font-bold">{item.cwd}</span>
                  <span className="text-white mr-2">#</span>
                  <span className="text-white">{item.text}</span>
                </div>
              )}
              {item.type === "output" && (
                <div className="text-[#a9b1d6]">{item.text}</div>
              )}
              {item.type === "error" && (
                <div className="text-[#f7768e]">{item.text}</div>
              )}
            </div>
          ))}
          
          <form onSubmit={handleExecute} className="flex items-center">
            <span className="text-[#9ece6a] font-bold">root@server</span>
            <span className="text-white">:</span>
            <span className="text-[#7aa2f7] font-bold">{cwd}</span>
            <span className="text-white mr-2">#</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isExecuting}
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-white focus:ring-0 p-0 m-0"
              autoComplete="off"
              spellCheck="false"
            />
          </form>
          <div ref={endOfTerminalRef} />
        </div>
      </Card>
    </div>
  );
}
