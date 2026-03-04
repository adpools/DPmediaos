
"use client";

import * as React from "react";
import {
  LayoutGrid,
  Film,
  Users,
  Briefcase,
  FileText,
  Receipt,
  Search,
  PieChart,
  UserCircle,
  Plus,
  ShieldCheck,
  LogOut,
  Loader2
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
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";

const workspaceItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutGrid, module: "dashboard", isCore: true },
  { title: "Projects", url: "/projects", icon: Film, module: "projects", isCore: true },
  { title: "Talent Network", url: "/talents", icon: Users, module: "talents" },
  { title: "Sales CRM", url: "/crm", icon: Briefcase, module: "crm" },
  { title: "Proposals", url: "/proposals", icon: FileText, module: "proposals" },
  { title: "Finance & Invoices", url: "/invoices", icon: Receipt, module: "invoices" },
  { title: "Market Intelligence", url: "/research", icon: Search, module: "research" },
  { title: "Analytics & Reports", url: "/reports", icon: PieChart, module: "reports" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { state } = useSidebar();
  const { profile, company, isLoading, isModuleEnabled, hasPermission } = useTenant();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged out", description: "Safe travels!" });
      router.push('/login');
    } catch (error) {
      toast({ variant: "destructive", title: "Logout failed" });
    }
  };

  if (isLoading) {
    return (
      <Sidebar collapsible="icon" className="border-none bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" className="border-none bg-white">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 ring-2 ring-accent/10">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback>{profile?.fullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {state !== "collapsed" && (
            <div className="flex flex-col">
              <span className="text-sm font-bold font-headline">{profile?.fullName}</span>
              <span className="text-[10px] text-muted-foreground font-medium">{company?.name}</span>
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
            {workspaceItems.map((item) => {
              // Core modules (Dashboard, Projects) are always shown to everyone in the company
              const enabled = item.isCore || isModuleEnabled(item.module);
              const allowed = item.isCore || hasPermission(item.module, 'view');
              
              if (!enabled || !allowed) return null;

              return (
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
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <div className="mb-4 px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Settings</span>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/settings'}
                tooltip="Account Center"
                className="rounded-xl h-10 px-3 hover:bg-accent/5 data-[active=true]:bg-primary/5 data-[active=true]:text-primary"
              >
                <Link href="/settings" className="flex items-center gap-3">
                  <UserCircle className="h-4 w-4" />
                  <span className="font-semibold text-xs flex-1">Account Center</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            {hasPermission('admin') && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/settings/rbac'}
                  tooltip="Access Control"
                  className="rounded-xl h-10 px-3 hover:bg-accent/5 data-[active=true]:bg-primary/5 data-[active=true]:text-primary"
                >
                  <Link href="/settings/rbac" className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="font-semibold text-xs flex-1">Access Control</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

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
      </SidebarFooter>
    </Sidebar>
  );
}
