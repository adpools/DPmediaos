"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MoreHorizontal, Sparkles, Key, Loader2, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import Link from "next/link";

export default function DashboardPage() {
  const { profile, company, isLoading: isTenantLoading, companyId } = useTenant();
  const db = useFirestore();

  // Fetch recent projects for this company
  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'projects'),
      orderBy('created_at', 'desc'),
      limit(5)
    );
  }, [db, companyId]);

  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  // Fetch today's tasks
  const tasksQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'tasks'),
      where('status', '!=', 'done'),
      limit(10)
    );
  }, [db, companyId]);

  const { data: tasks, isLoading: isTasksLoading } = useCollection(tasksQuery);

  if (isTenantLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            Hi {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-2">{company?.name} Workspace Overview</p>
        </div>
        <div className="flex flex-col items-end gap-2 mb-1">
          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Project Completion</span>
            <Progress value={25} className="w-32 h-1.5 bg-white shadow-inner" />
          </div>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {isProjectsLoading ? (
          <div className="flex gap-4">
            {[1, 2].map(i => <div key={i} className="min-w-[320px] h-[180px] bg-slate-200 animate-pulse rounded-[2rem]" />)}
          </div>
        ) : (
          <>
            {projects?.map((proj) => (
              <Link key={proj.id} href={`/projects`}>
                <Card className={`min-w-[320px] h-[180px] border-none shadow-lg text-white rounded-[2rem] p-8 flex flex-col justify-between group cursor-pointer hover:scale-[1.02] transition-transform ${proj.color || 'card-pink'}`}>
                  <div className="flex justify-between items-start">
                    <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <MoreHorizontal className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg leading-tight w-2/3">{proj.project_name}</h3>
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <Avatar key={i} className="h-6 w-6 border-2 border-white/20">
                          <AvatarImage src={`https://picsum.photos/seed/p${proj.id+i}/40/40`} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
            <Link href="/projects">
              <Card className="min-w-[320px] h-[180px] border-2 border-dashed border-white/40 bg-white/5 rounded-[2rem] flex items-center justify-center text-muted-foreground cursor-pointer hover:bg-white/10 transition-colors">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full border-2 border-dashed flex items-center justify-center"><Plus className="h-4 w-4" /></div>
                  <span className="text-xs font-bold uppercase tracking-widest">New Project</span>
                </div>
              </Card>
            </Link>
          </>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Upcoming Tasks</h2>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="bg-transparent h-auto p-0 gap-8 border-b border-white/40 w-full justify-start rounded-none">
            <TabsTrigger value="active" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-bold px-0 pb-3">Active Tasks</TabsTrigger>
            <TabsTrigger value="done" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-bold px-0 pb-3 text-muted-foreground/60">Recently Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4 pt-4">
            {isTasksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 w-full bg-slate-100 animate-pulse rounded-2xl" />)}
              </div>
            ) : tasks?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No pending tasks. Ready for something new?</p>
              </div>
            ) : (
              tasks?.map(task => (
                <div key={task.id} className="flex items-center justify-between group cursor-pointer p-4 hover:bg-white rounded-2xl transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm overflow-hidden`}>
                       <Key className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm leading-none">{task.name}</h4>
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{task.priority} priority</p>
                    </div>
                  </div>
                  <div className="flex -space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Avatar className="h-6 w-6 border-2 border-[#F0F1F4]">
                      <AvatarImage src={`https://picsum.photos/seed/${task.id}/40/40`} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}