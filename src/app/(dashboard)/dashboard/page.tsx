"use client";

import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Sparkles, 
  Loader2, 
  Plus, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Clock,
  IndianRupee,
  Briefcase,
  Users,
  Target,
  ArrowUpRight,
  TrendingUp
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, where, limit, orderBy, doc, serverTimestamp } from "firebase/firestore";
import { updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import Link from "next/link";
import { 
  BarChart, 
  Bar, 
  ResponsiveContainer, 
  XAxis, 
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, subMonths, startOfMonth, isSameMonth } from "date-fns";

export default function DashboardPage() {
  const { profile, company, user, isLoading: isTenantLoading, companyId, isSuperAdmin } = useTenant();
  const db = useFirestore();

  // Bootstrap Promotion Logic for Super Administrator
  useEffect(() => {
    if (user?.email === 'arundevv.com@gmail.com' && db) {
      if (profile && profile.role_id !== 'admin') {
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

  // --- DATA FETCHING ---

  // 1. Fetch recent projects
  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'projects'),
      orderBy('created_at', 'desc'),
      limit(5)
    );
  }, [db, companyId]);
  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  // 2. Fetch tasks
  const tasksQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'tasks'),
      where('status', '!=', 'done'),
      limit(10)
    );
  }, [db, companyId]);
  const { data: tasks, isLoading: isTasksLoading } = useCollection(tasksQuery);

  // 3. Fetch Invoices for Revenue Graph
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, 'companies', companyId, 'invoices');
  }, [db, companyId]);
  const { data: invoices } = useCollection(invoicesQuery);

  // 4. Fetch Leads for Pipeline Value
  const leadsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, 'companies', companyId, 'leads');
  }, [db, companyId]);
  const { data: leads } = useCollection(leadsQuery);

  // 5. Fetch Talent Count
  const talentsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, 'companies', companyId, 'talents');
  }, [db, companyId]);
  const { data: talents } = useCollection(talentsQuery);

  // --- ANALYTICS PROCESSING ---

  const stats = useMemo(() => {
    const revenue = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
    const pipeline = leads?.reduce((sum, l) => sum + (l.deal_value || 0), 0) || 0;
    const active = projects?.filter(p => p.status === 'in_progress').length || 0;
    const team = talents?.length || 0;
    return { revenue, pipeline, active, team };
  }, [invoices, leads, projects, talents]);

  const revenueChartData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(new Date(), i);
      return { month: format(d, 'MMM'), date: startOfMonth(d), revenue: 0 };
    }).reverse();

    invoices?.forEach(inv => {
      const invDate = inv.issue_date ? new Date(inv.issue_date) : null;
      if (invDate) {
        const monthMatch = months.find(m => isSameMonth(m.date, invDate));
        if (monthMatch) monthMatch.revenue += (inv.total || 0);
      }
    });
    return months;
  }, [invoices]);

  const projectBreakdown = useMemo(() => {
    const inProgress = projects?.filter(p => p.status === 'in_progress').length || 0;
    const completed = projects?.filter(p => p.status === 'completed').length || 0;
    return [
      { name: 'Active', value: inProgress, color: '#FF71A4' },
      { name: 'Done', value: completed, color: '#B199FF' }
    ];
  }, [projects]);

  const overallProgress = useMemo(() => {
    if (!projects || projects.length === 0) return 0;
    const total = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
    return Math.round(total / projects.length);
  }, [projects]);

  if (isTenantLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold tracking-tight text-primary">
              Hi {profile?.fullName?.split(' ')[0] || 'Producer'}!
            </h1>
            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent rounded-full text-[10px] font-bold uppercase tracking-wider border border-accent/20">
                  <Zap className="h-3 w-3 fill-current" /> Super Admin
                </div>
              )}
              {profile?.role_id === 'admin' && !isSuperAdmin && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3" /> Admin
                </div>
              )}
            </div>
          </div>
          <p className="text-muted-foreground">{company?.name || 'Your'} Workspace Overview</p>
        </div>
        <div className="flex flex-col items-end gap-2 mb-1">
          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Production Velocity</span>
            <Progress value={overallProgress} className="w-32 h-1.5 bg-white shadow-inner" />
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", val: `₹${(stats.revenue / 1000).toFixed(1)}k`, icon: IndianRupee, color: "text-emerald-500", desc: "Real-time ledger" },
          { label: "Pipeline Value", val: `₹${(stats.pipeline / 100000).toFixed(1)}L`, icon: Target, color: "text-accent", desc: "Projected deals" },
          { label: "Active Projs", val: stats.active, icon: Briefcase, color: "text-blue-500", desc: "Currently filming" },
          { label: "Talent Pool", val: stats.team, icon: Users, color: "text-purple-500", desc: "Verified network" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm group hover:shadow-md transition-all rounded-[1.5rem]">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl bg-slate-50 ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> Live
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold font-headline">{stat.val}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{stat.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2rem] bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Revenue Velocity</CardTitle>
              <CardDescription>Monthly billing trends</CardDescription>
            </div>
            <Link href="/reports">
              <Button variant="ghost" size="sm" className="text-primary font-bold text-xs">Full Audit</Button>
            </Link>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  formatter={(v: any) => `₹${v.toLocaleString()}`}
                />
                <Bar dataKey="revenue" fill="#B199FF" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white">
          <CardHeader>
            <CardTitle className="text-xl">Production Pulse</CardTitle>
            <CardDescription>Project distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            {stats.active === 0 && stats.revenue === 0 ? (
              <div className="text-center text-xs text-muted-foreground bg-slate-50 p-8 rounded-2xl border-2 border-dashed">
                Add projects to see pulse
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectBreakdown}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {projectBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects Horizon */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Projects</h2>
          <Link href="/projects">
            <Button variant="link" className="text-primary font-bold">View Pipeline</Button>
          </Link>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {isProjectsLoading ? (
            <div className="flex gap-4">
              {[1, 2].map(i => <div key={i} className="min-w-[320px] h-[180px] bg-slate-200 animate-pulse rounded-[2rem]" />)}
            </div>
          ) : projects?.length === 0 ? (
            <Link href="/projects">
              <Card className="min-w-[320px] h-[180px] border-2 border-dashed border-slate-300 bg-white rounded-[2rem] flex items-center justify-center text-muted-foreground cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-6 w-6" />
                  <span className="text-xs font-bold uppercase tracking-widest">Launch First Project</span>
                </div>
              </Card>
            </Link>
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
                      <h3 className="font-bold text-lg leading-tight w-2/3 line-clamp-2">{proj.project_name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {[1, 2].map(i => (
                            <Avatar key={i} className="h-6 w-6 border-2 border-white/20">
                              <AvatarImage src={`https://picsum.photos/seed/p${proj.id+i}/40/40`} />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{proj.progress}%</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
              <Link href="/projects">
                <Card className="min-w-[320px] h-[180px] border-2 border-dashed border-primary/20 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary cursor-pointer hover:bg-primary/10 transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center"><Plus className="h-4 w-4" /></div>
                    <span className="text-xs font-bold uppercase tracking-widest">New Production</span>
                  </div>
                </Card>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Workspace Feed</h2>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="bg-transparent h-auto p-0 gap-8 border-b border-slate-200 w-full justify-start rounded-none">
            <TabsTrigger value="active" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-bold px-0 pb-3">Active Tasks</TabsTrigger>
            <TabsTrigger value="done" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-bold px-0 pb-3 text-muted-foreground/60">Archive</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4 pt-4">
            {isTasksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-16 w-full bg-slate-100 animate-pulse rounded-2xl" />)}
              </div>
            ) : tasks?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-white/50 rounded-3xl border-2 border-dashed">
                <p className="text-sm">No pending tasks. Your production queue is clear.</p>
              </div>
            ) : (
              tasks?.map(task => (
                <div key={task.id} className="flex items-center justify-between group cursor-pointer p-4 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm overflow-hidden`}>
                       {task.status === 'in_progress' ? <Clock className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm leading-none">{task.name || task.title}</h4>
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" /> {task.priority || 'Medium'} priority
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      <Avatar className="h-6 w-6 border-2 border-white">
                        <AvatarImage src={`https://picsum.photos/seed/${task.id}/40/40`} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
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
