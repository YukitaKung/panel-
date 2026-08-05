"use client";

import { Activity, AppWindow, Database, FileCode2, Globe, HardDrive, Settings, SquareTerminal, Server, FolderCode, Clock, Network, Users, Terminal, LogOut, Key, BookOpen, ShieldCheck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  {
    title: "ภาพรวม (Dashboard)",
    url: "/",
    icon: Activity,
  },
  {
    title: "แอพพลิเคชั่น (Applications)",
    url: "/applications",
    icon: AppWindow,
  },
  {
    title: "ซับโดเมน (Subdomains)",
    url: "/subdomains",
    icon: Globe,
  },

  {
    title: "จัดการโดเมน (DNS)",
    url: "/dns",
    icon: Network,
  },
  {
    title: "ฐานข้อมูล (Databases)",
    url: "/databases",
    icon: Database,
  },
  {
    title: "ความปลอดภัย (SSL/TLS)",
    url: "/ssl",
    icon: ShieldCheck,
  },
  {
    title: "บัญชีผู้ใช้ (FTP / SSH)",
    url: "/access",
    icon: Users,
  },
  {
    title: "ตั้งเวลา (Cron Jobs)",
    url: "/cron",
    icon: Clock,
  },
  {
    title: "สำรองข้อมูล (Backups)",
    url: "/backups",
    icon: HardDrive,
  },
  {
    title: "จัดการไฟล์ (File Manager)",
    url: "/files",
    icon: FolderCode,
  },
  {
    title: "เทอร์มินัล (Terminal)",
    url: "/terminal",
    icon: SquareTerminal,
  },
  {
    title: "ล็อก (Logs)",
    url: "/logs",
    icon: Terminal,
  },
  {
    title: "ตั้งค่า (Settings)",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "คีย์ API (API Keys)",
    url: "/api-keys",
    icon: Key,
  },
  {
    title: "คู่มือ API (API Docs)",
    url: "/api-docs",
    icon: BookOpen,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const [user, setUser] = useState<{ username: string; avatarUrl: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-4">
        <div className="flex items-center gap-2 font-bold text-lg text-primary w-full">
          <img src="/logo.png" alt="OX PANEL Logo" className="h-6 w-6 object-contain rounded" />
          <span>OX PANEL</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={() => isMobile && setOpenMobile(false)}
                      render={<Link href={item.url} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto border-t border-border/50">
          <SidebarGroupContent className="pt-2">
            <SidebarMenu>
              {user && (
                <SidebarMenuItem>
                  <div className="flex items-center gap-3 px-2 py-2 mb-2 bg-muted/50 rounded-md border border-border/50">
                    <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full border border-border bg-background" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold leading-tight text-foreground">{user.username}</span>
                      <span className="text-xs text-muted-foreground leading-tight">Admin</span>
                    </div>
                  </div>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => window.location.href = "/api/auth/logout"} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" />
                  <span>ออกจากระบบ (Logout)</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
