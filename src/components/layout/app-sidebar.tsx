"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Inbox,
  Film,
  Zap,
  Calendar,
  Settings,
  Plus,
  Circle
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { MOCK_COMPANY } from "@/lib/mock-data";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "My Tasks", url: "/dashboard", icon: LayoutDashboard },
  { title: "Inbox", url: "/inbox", icon: Inbox, badge: 0 },
  { title: "Projects", url: "/projects", icon: Film },
  { title: "Standups", url: "/standups", icon: Zap },
  { title: "Meetings", url: "/meetings", badge: 5, icon: Calendar },
  { title: "Settings", url: "/settings", icon: Settings },
];

const favorites = [
  { title: "Redwhale Design", color: "text-blue-500" },
  { title: "Mobile App Mock...", color: "text-rose-500" },
  { title: "UI Design Revisi...", color: "text-emerald-500" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-none bg-white">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 ring-2 ring-accent/10">
            <AvatarImage src={MOCK_COMPANY.admin.avatar} />
            <AvatarFallback>AS</AvatarFallback>
          </Avatar>
          {state !== "collapsed" && (
            <div className="flex flex-col">
              <span className="text-sm font-bold font-headline">{MOCK_COMPANY.admin.name}</span>
              <span className="text-[10px] text-muted-foreground font-medium">{MOCK_COMPANY.admin.role}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <div className="mb-4 px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Menu</span>
          </div>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className="rounded-xl h-10 px-3 hover:bg-accent/5"
                >
                  <Link href={item.url} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span className="font-semibold text-xs flex-1">{item.title}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-accent text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <div className="mb-4 px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Favorites</span>
          </div>
          <SidebarMenu>
            {favorites.map((fav) => (
              <SidebarMenuItem key={fav.title}>
                <SidebarMenuButton className="rounded-xl h-10 px-3 hover:bg-accent/5">
                  <div className="flex items-center gap-3">
                    <Circle className={`h-2.5 w-2.5 fill-current ${fav.color}`} />
                    <span className="font-semibold text-xs">{fav.title}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6">
        <Button size="icon" className="h-12 w-12 rounded-2xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/30">
          <Plus className="h-6 w-6" />
        </Button>
        {state !== "collapsed" && (
          <p className="mt-4 text-[10px] text-muted-foreground font-medium px-2">2021 AR Shakir License</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
