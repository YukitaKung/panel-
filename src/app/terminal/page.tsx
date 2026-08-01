"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2, Settings, Terminal as TerminalIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TerminalPage() {
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
              <SelectItem value="screen">screen</SelectItem>
              <SelectItem value="tmux">tmux</SelectItem>
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

      <Card className="flex-1 bg-[#1a1b26] border-[#1a1b26] rounded-xl overflow-hidden shadow-xl flex flex-col">
        <div className="h-10 bg-[#16161e] border-b border-[#292e42] flex items-center px-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f7768e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#e0af68]"></div>
            <div className="w-3 h-3 rounded-full bg-[#9ece6a]"></div>
          </div>
          <div className="flex-1 text-center text-xs text-[#a9b1d6] font-medium flex items-center justify-center gap-2">
            <TerminalIcon className="h-3 w-3" />
            root@server:~
          </div>
        </div>
        <div className="flex-1 p-4 font-mono text-sm overflow-auto text-[#a9b1d6]">
          <div className="mb-4 text-[#7aa2f7]">
            Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-31-generic x86_64)<br />
            <br />
            * Documentation:  https://help.ubuntu.com<br />
            * Management:     https://landscape.canonical.com<br />
            * Support:        https://ubuntu.com/pro<br />
          </div>
          <div className="flex items-center">
            <span className="text-[#9ece6a] font-bold">root@server</span>
            <span className="text-white">:</span>
            <span className="text-[#7aa2f7] font-bold">~</span>
            <span className="text-white mr-2">#</span>
            <span className="animate-pulse w-2 h-4 bg-white inline-block"></span>
          </div>
        </div>
      </Card>
    </div>
  );
}
