"use client";

import * as React from "react";
import {
  LayoutGrid,
  Film,
  Users,
  Briefcase,
  Receipt,
  Search,
  PieChart,
  UserCircle,
  Plus,
  ShieldCheck,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
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
import { toast } from "@/hooks/use-toast";

const workspaceItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutGrid },
  { title: "Projects", url: "/projects", icon: Film },
  { title: "Talent Marketplace", url: "/talent", icon: Users },
  { title: "Sales CRM", url: "/crm", icon: Briefcase },
  { title: "Finance & Invoices", url: "/finance", icon: Receipt },
  { title: "Market Intelligence", url: "/research", icon: Search },
  { title: "Reports", url: "/reports", icon: PieChart },
];

const configurationItems = [
  { title: "Account Center", url: "/settings", icon: UserCircle },
  { title: "Access Control", url: "/settings/rbac", icon: ShieldCheck },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  const handleLogout = () => {
    toast({
      title: "Logging out...",
      description: "You are being safely signed out of DP Media OS.",
    });
  };

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
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Workspace</span>
          </div>
          <SidebarMenu>
            {workspaceItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className="rounded-xl h-10 px-3 hover:bg-accent/5 data-[active=true]:bg-primary/5 data-[active=true]:text-primary"
                >
                  <Link href={item.url} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span className="font-semibold text-xs flex-1">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <div className="mb-4 px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Configuration</span>
          </div>
          <SidebarMenu>
            {configurationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className="rounded-xl h-10 px-3 hover:bg-accent/5 data-[active=true]:bg-primary/5 data-[active=true]:text-primary"
                >
                  <Link href={item.url} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span className="font-semibold text-xs flex-1">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip="Logout"
                className="rounded-xl h-10 px-3 hover:bg-rose-50 text-rose-500"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="h-4 w-4" />
                  <span className="font-semibold text-xs flex-1">Logout</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6">
        <Button size="icon" className="h-12 w-12 rounded-2xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/30">
          <Plus className="h-6 w-6" />
        </Button>
        {state !== "collapsed" && (
          <p className="mt-4 text-[10px] text-muted-foreground font-medium px-2">© 2024 DP Media OS</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
