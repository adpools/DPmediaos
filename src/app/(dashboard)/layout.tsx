"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, LayoutGrid, MoreHorizontal, Phone, Smile, ArrowRight, Plus, ShieldCheck, Zap, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_SCHEDULE } from "@/lib/mock-data";
import { useTenant } from "@/hooks/use-tenant";
import { doc, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, user, companyId, isSuperAdmin, isLoading } = useTenant();
  const db = useFirestore();
  const router = useRouter();

  // 1. Protection & Redirection Logic
  useEffect(() => {
    if (!isLoading && !profile?.company_id && !(profile as any)?.companyId) {
      // If we're not loading and there's no company context, send to onboarding
      router.push("/onboarding");
    }
  }, [isLoading, profile, router]);

  // 2. Bootstrap Promotion Logic for Global Administrators
  useEffect(() => {
    if (user?.email === 'arundevv.com@gmail.com' && db) {
      // Promote to Workspace Admin if needed
      if (profile && profile.role_id !== 'admin' && (profile as any).roleId !== 'admin') {
        const userRef = doc(db, 'users', user.uid);
        updateDocumentNonBlocking(userRef, { role_id: 'admin' });
      }

      // Promote to Platform Super Admin
      const superAdminRef = doc(db, 'super_admins', user.uid);
      setDocumentNonBlocking(superAdminRef, {
        uid: user.uid,
        email: user.email,
        granted_at: serverTimestamp()
      }, { merge: true });
    }
  }, [user, profile, db]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F0F1F4]">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  // Only render if we have a company context (to avoid flicker before redirect)
  if (!companyId && !isSuperAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F0F1F4]">
        <AppSidebar />
        <SidebarInset className="flex flex-row bg-transparent">
          <main className="flex-1 p-8 overflow-auto">
            {children}
          </main>
          
          <aside className="w-[380px] p-8 hidden xl:flex flex-col gap-8 bg-white/40 border-l border-white/20">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-headline">Today's Schedule</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-white/80 shadow-sm"><LayoutGrid className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-white/80 shadow-sm"><Calendar className="h-4 w-4" /></Button>
                </div>
              </div>

              {MOCK_SCHEDULE.map(item => (
                <Card key={item.id} className="border-none shadow-soft rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 bg-white space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-wider">{item.time}</span>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-blue-500 font-bold px-2 hover:bg-blue-50">+ Invite</Button>
                      </div>
                      <h4 className="font-bold text-sm leading-tight">{item.title}</h4>
                    </div>
                    <div className="p-4 bg-emerald-400 flex items-center justify-between text-white">
                      <div className="flex -space-x-2">
                        {item.members.map(m => (
                          <Avatar key={m} className="h-7 w-7 border-2 border-emerald-400">
                            <AvatarImage src={`https://picsum.photos/seed/${m}/50/50`} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                        ))}
                        <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">+</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-code">{item.duration}</span>
                        <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center"><Phone className="h-4 w-4 fill-current" /></div>
                        <MoreHorizontal className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-headline">Design Project</h3>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                <Smile className="h-3 w-3 text-orange-400" /> In Progress
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground">Completed</span>
                  <p className="text-xl font-bold font-headline">114</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground">In Progress</span>
                  <div className="flex items-center gap-1">
                    <p className="text-xl font-bold font-headline">24</p>
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground">Team members</span>
                  <div className="flex -space-x-2">
                    <Avatar className="h-6 w-6 border-2 border-white"><AvatarImage src="https://picsum.photos/seed/m1/40/40" /></Avatar>
                    <div className="h-6 w-6 rounded-full bg-rose-500 flex items-center justify-center text-[8px] font-bold text-white">S</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-headline">New Task</h3>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="bg-white/80 rounded-2xl p-4 shadow-sm space-y-4 border border-white">
                <div className="space-y-1">
                   <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Task Title</span>
                   <p className="text-xs font-semibold text-muted-foreground/40">Create new...</p>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
                   {['🤠', '🎉', '👩', '🤔', '😂', '🔥', '😅', '🤣'].map(e => <span key={e} className="text-sm cursor-pointer hover:scale-125 transition-transform">{e}</span>)}
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Add Collaborators</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-purple-100 px-2 py-1 rounded-lg">
                      <Avatar className="h-5 w-5"><AvatarImage src="https://picsum.photos/seed/a1/40/40" /></Avatar>
                      <span className="text-[10px] font-bold text-purple-700">Angela</span>
                      <Plus className="h-2 w-2 rotate-45 text-purple-700" />
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-100 px-2 py-1 rounded-lg">
                      <Avatar className="h-5 w-5"><AvatarImage src="https://picsum.photos/seed/c1/40/40" /></Avatar>
                      <span className="text-[10px] font-bold text-emerald-700">Chris</span>
                      <Plus className="h-2 w-2 rotate-45 text-emerald-700" />
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg bg-slate-100"><Plus className="h-3 w-3" /></Button>
                    <Button size="icon" className="h-8 w-8 rounded-xl bg-accent ml-auto"><ArrowRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
