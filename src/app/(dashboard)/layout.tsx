
"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, LayoutGrid, MoreHorizontal, Phone, Smile, ArrowRight, Plus, Loader2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTenant } from "@/hooks/use-tenant";
import { doc, serverTimestamp, collection, query } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, user, companyId, isSuperAdmin, isLoading } = useTenant();
  const db = useFirestore();
  const router = useRouter();

  // 1. Fetch Real Data for Sidebar Stats
  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, 'companies', companyId, 'projects'));
  }, [db, companyId]);

  const { data: projects } = useCollection(projectsQuery);

  const completedCount = projects?.filter(p => p.status === 'completed').length || 0;
  const inProgressCount = projects?.filter(p => p.status === 'in_progress').length || 0;

  // 2. Protection & Redirection Logic
  useEffect(() => {
    if (!isLoading) {
      const cId = profile?.company_id || (profile as any)?.companyId;
      const isHardcodedAdmin = user?.email === 'arundevv.com@gmail.com';
      
      if (!cId && !isSuperAdmin && !isHardcodedAdmin) {
        router.push("/onboarding");
      }
    }
  }, [isLoading, profile, isSuperAdmin, router, user]);

  // 3. Bootstrap Promotion Logic
  useEffect(() => {
    if (user?.email === 'arundevv.com@gmail.com' && db) {
      const currentRoleId = profile?.role_id || (profile as any)?.roleId;
      if (profile && currentRoleId !== 'admin') {
        const userRef = doc(db, 'users', user.uid);
        updateDocumentNonBlocking(userRef, { role_id: 'admin' });
      }
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

  const isHardcodedAdmin = user?.email === 'arundevv.com@gmail.com';
  const hasAccess = !!companyId || isSuperAdmin || isHardcodedAdmin;
  if (!hasAccess) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F0F1F4]">
        <AppSidebar />
        <SidebarInset className="flex flex-row bg-transparent">
          <main className="flex-1 p-8 overflow-auto">
            {children}
          </main>
          
          <aside className="w-[380px] p-8 hidden xl:flex flex-col gap-10 bg-transparent">
            {/* Header: Today's Schedule */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold font-headline text-[#1A1D2C]">Today's Schedule</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white shadow-sm border border-white hover:bg-slate-50"><LayoutGrid className="h-5 w-5 text-slate-600" /></Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white shadow-sm border border-white hover:bg-slate-50"><Calendar className="h-5 w-5 text-slate-600" /></Button>
                </div>
              </div>

              {/* Schedule Card */}
              <Card className="border-none shadow-soft rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-8 bg-white space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-widest">30 minute call with Client</span>
                      <button className="text-[11px] text-[#4F46E5] font-bold hover:underline">+ Invite</button>
                    </div>
                    <h4 className="font-bold text-xl text-[#1A1D2C]">Project Discovery Call</h4>
                  </div>
                  <div className="px-8 py-6 bg-[#34D399] flex items-center justify-between text-white">
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(m => (
                          <Avatar key={m} className="h-10 w-10 border-2 border-[#34D399]">
                            <AvatarImage src={`https://picsum.photos/seed/${m + 50}/100/100`} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                        ))}
                        <div className="h-10 w-10 rounded-full bg-white/20 border-2 border-[#34D399] flex items-center justify-center text-xs font-bold">+</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold font-code opacity-90">28:35</span>
                      <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                        <Phone className="h-5 w-5 fill-current" />
                      </div>
                      <MoreHorizontal className="h-5 w-5 opacity-60" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Design Project Stats */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold font-headline text-[#1A1D2C]">Production Stats</h3>
                <MoreHorizontal className="h-5 w-5 text-slate-400" />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                <Smile className="h-4 w-4 text-orange-400" /> In Progress
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Completed</span>
                  <p className="text-3xl font-bold font-headline text-[#1A1D2C]">{completedCount}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">In Progress</span>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-bold font-headline text-[#1A1D2C]">{inProgressCount}</p>
                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Team members</span>
                  <div className="flex -space-x-2 pt-1">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarImage src="https://picsum.photos/seed/member1/100/100" />
                    </Avatar>
                    <div className="h-10 w-10 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">S</div>
                  </div>
                </div>
              </div>
            </div>

            {/* New Task Section */}
            <div className="mt-auto space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold font-headline text-[#1A1D2C]">New Task</h3>
                <MoreHorizontal className="h-5 w-5 text-slate-400" />
              </div>
              <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-white/50 space-y-8">
                <div className="space-y-2">
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Task Title</span>
                   <p className="text-sm font-semibold text-slate-300">Create new...</p>
                </div>
                
                {/* Emoji Row */}
                <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                   {['🤠', '🎉', '👩', '🤔', '😂', '🔥', '😅', '🤣'].map(e => (
                     <span key={e} className="text-xl cursor-pointer hover:scale-125 transition-transform grayscale hover:grayscale-0 opacity-60 hover:opacity-100">{e}</span>
                   ))}
                </div>

                <div className="h-px bg-slate-100 w-full" />

                <div className="space-y-4">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Add Collaborators</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-700 border-none px-3 py-1.5 rounded-full flex items-center gap-2">
                      <Avatar className="h-5 w-5"><AvatarImage src="https://picsum.photos/seed/angela/40/40" /></Avatar>
                      <span className="text-[11px] font-bold">Angela</span>
                      <X className="h-3 w-3 cursor-pointer opacity-60" />
                    </Badge>
                    <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-none px-3 py-1.5 rounded-full flex items-center gap-2">
                      <Avatar className="h-5 w-5"><AvatarImage src="https://picsum.photos/seed/chris/40/40" /></Avatar>
                      <span className="text-[11px] font-bold">Chris</span>
                      <X className="h-3 w-3 cursor-pointer opacity-60" />
                    </Badge>
                    
                    <div className="flex items-center gap-3 ml-auto">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100"><Plus className="h-5 w-5" /></Button>
                      <Button size="icon" className="h-12 w-12 rounded-[1.25rem] bg-accent hover:bg-accent/90 shadow-lg shadow-accent/30"><ArrowRight className="h-6 w-6 text-white" /></Button>
                    </div>
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
