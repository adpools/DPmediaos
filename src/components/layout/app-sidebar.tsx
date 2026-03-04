"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Film,
  Users,
  Briefcase,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Building2,
  PieChart
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_COMPANY, MOCK_USER } from "@/lib/mock-data";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    module: "core",
  },
  {
    title: "Projects",
    url: "/projects",
    icon: Film,
    module: "projects",
    items: [
      { title: "Active Projects", url: "/projects" },
      { title: "Production Schedule", url: "/projects/schedule" },
      { title: "Budgets", url: "/projects/budgets" },
    ],
  },
  {
    title: "Talent Marketplace",
    url: "/talent",
    icon: Users,
    module: "talent",
  },
  {
    title: "Sales CRM",
    url: "/crm",
    icon: Briefcase,
    module: "crm",
  },
  {
    title: "Finance & Invoices",
    url: "/finance",
    icon: Receipt,
    module: "finance",
  },
  {
    title: "Market Intelligence",
    url: "/research",
    icon: Search,
    module: "research",
  },
  {
    title: "Reports",
    url: "/reports",
    icon: PieChart,
    module: "core",
  },
];

const adminItems = [
  {
    title: "Company Settings",
    url: "/settings",
    icon: Building2,
  },
  {
    title: "Access Control",
    url: "/settings/rbac",
    icon: ShieldCheck,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  const isModuleEnabled = (module: string) => {
    if (module === "core") return true;
    return MOCK_COMPANY.enabled_modules.includes(module);
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="h-16 flex items-center px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-headline font-bold">
            DP
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">{MOCK_COMPANY.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{MOCK_COMPANY.subscription_plan} Plan</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.filter(i => isModuleEnabled(i.module)).map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url))}
                  tooltip={item.title}
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items && pathname.startsWith(item.url) && state !== "collapsed" && (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                          <Link href={subItem.url}>{subItem.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System Admin</SidebarGroupLabel>
          <SidebarMenu>
            {adminItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className={`flex items-center gap-3 ${state === 'collapsed' ? 'justify-center' : ''}`}>
              <Avatar className="h-8 w-8 border">
                <AvatarImage src={MOCK_USER.avatar} />
                <AvatarFallback>AP</AvatarFallback>
              </Avatar>
              {state !== "collapsed" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-medium truncate">{MOCK_USER.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{MOCK_USER.role}</span>
                </div>
              )}
              {state !== "collapsed" && (
                <SidebarMenuButton size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <LogOut className="h-4 w-4" />
                </SidebarMenuButton>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
