
"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, user, companyId, isSuperAdmin, isLoading } = useTenant();
  const router = useRouter();

  // Protection & Redirection Logic
  useEffect(() => {
    if (!isLoading) {
      const cId = profile?.company_id || (profile as any)?.companyId;
      const isHardcodedAdmin = user?.email === 'arundevv.com@gmail.com';
      
      if (!cId && !isSuperAdmin && !isHardcodedAdmin) {
        router.push("/onboarding");
      }
    }
  }, [isLoading, profile, isSuperAdmin, router, user]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F0F1F4]">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  const isHardcodedAdmin = user?.email === 'arundevv.com@gmail.com';
  const hasAccess = !!companyId || isSuperAdmin || isHardcodedAdmin;
  if (!hasAccess) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F0F1F4] overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col bg-transparent relative">
          {/* Mobile Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 md:hidden sticky top-0 z-20">
            <SidebarTrigger />
            <div className="flex items-center gap-2 ml-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">DP</div>
              <span className="font-bold text-sm tracking-tight text-primary">DP Media OS</span>
            </div>
          </header>

          <div className="flex flex-row flex-1 overflow-hidden relative">
            <main className="flex-1 p-4 md:p-8 overflow-auto">
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
