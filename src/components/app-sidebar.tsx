"use client";

import { Activity, AppWindow, Database, FileCode2, Globe, HardDrive, Settings, SquareTerminal, Server, FolderCode, Clock, Network, Users, Terminal } from "lucide-react";
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
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    title: "เว็บไซต์ PHP (PHP Websites)",
    url: "/php",
    icon: FileCode2,
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
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-4">
        <div className="flex items-center gap-2 font-bold text-lg text-primary w-full">
          <Server className="h-6 w-6" />
          <span>HostPanel</span>
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
                    <SidebarMenuButton isActive={isActive} tooltip={item.title} render={<Link href={item.url} />}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
