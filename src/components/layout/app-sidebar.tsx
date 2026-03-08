
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
  Loader2,
  Building2,
  Wallet,
  Settings2,
  Archive
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
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

// Module registry for dynamic navigation
const workspaceItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutGrid, module: "dashboard", isCore: true },
  { title: "Projects", url: "/projects", icon: Film, module: "projects", isCore: true },
  { title: "Service Builder", url: "/service-builder", icon: Settings2, module: "services" },
  { title: "Clients", url: "/clients", icon: Building2, module: "clients" },
  { title: "Talent Network", url: "/talents", icon: Users, module: "talents" },
  { title: "Sales CRM", url: "/crm", icon: Briefcase, module: "crm" },
  { title: "Proposals", url: "/proposals", icon: FileText, module: "proposals" },
  { title: "Invoice and Quote", url: "/invoices", icon: Receipt, module: "invoices" },
  { title: "Accounts", url: "/accounts", icon: Wallet, module: "accounts" },
  { title: "Market Research", url: "/research", icon: Search, module: "research" },
  { title: "Analytics", url: "/reports", icon: PieChart, module: "reports" },
  { title: "Archives", url: "/archives", icon: Archive, module: "archives", isCore: true },
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

  const logoUrl = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl || "https://picsum.photos/seed/logo/200/200";

  return (
    <Sidebar collapsible="icon" className="border-none bg-white">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border bg-slate-50 flex items-center justify-center">
            <Image 
              src={logoUrl}
              width={40}
              height={40}
              alt="Marzelz Logo"
              className="object-contain"
              data-ai-hint="minimalist logo"
            />
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-primary uppercase">Marzelz</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Lifestyle</span>
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
              // Check if module is enabled in workspace and user has permission
              const isEnabled = item.isCore || isModuleEnabled(item.module);
              const isAllowed = item.isCore || hasPermission(item.module, 'view');
              
              if (!isEnabled || !isAllowed) return null;

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
                isActive={pathname?.startsWith('/settings') && !pathname?.includes('/rbac')}
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

      <SidebarFooter className="p-4 mt-auto border-t space-y-4">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer",
          state === "collapsed" ? "justify-center" : ""
        )}>
          <Avatar className="h-9 w-9 ring-2 ring-accent/10 shrink-0">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
              {profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {state !== "collapsed" && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold font-headline truncate">{profile?.full_name}</span>
              <span className="text-[9px] text-muted-foreground font-medium truncate">{company?.name || 'Workspace'}</span>
            </div>
          )}
        </div>
        <div className="flex justify-center w-full">
          <Button size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/30 shrink-0">
            <Plus className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
