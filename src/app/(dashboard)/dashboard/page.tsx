
"use client";

import { useEffect, useMemo, useState } from "react";
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
  TrendingUp,
  Layers
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, where, limit, orderBy, doc, serverTimestamp } from "firebase/firestore";
import { updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import Link from "next/link";
import { 
  AreaChart, 
  Area, 
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
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Bootstrap Promotion Logic for Super Administrator
  useEffect(() => {
    if (user?.email === 'arundevv.com@gmail.com' && db && profile) {
      if (profile.role_id !== 'admin') {
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

  // 1. Fetch recent projects for the carousel
  const recentProjectsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'projects'),
      orderBy('created_at', 'desc'),
      limit(5)
    );
  }, [db, companyId]);
  const { data: recentProjects, isLoading: isProjectsLoading } = useCollection(recentProjectsQuery);

  // 2. Fetch all projects for accurate stats
  const allProjectsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, 'companies', companyId, 'projects'));
  }, [db, companyId]);
  const { data: allProjects } = useCollection(allProjectsQuery);

  // 3. Fetch tasks
  const tasksQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'tasks'),
      where('status', '!=', 'done'),
      limit(10)
    );
  }, [db, companyId]);
  const { data: tasks, isLoading: isTasksLoading } = useCollection(tasksQuery);

  // 4. Fetch Invoices for Revenue Graph
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, 'companies', companyId, 'invoices');
  }, [db, companyId]);
  const { data: invoices } = useCollection(invoicesQuery);

  // 5. Fetch Leads for Pipeline Value
  const leadsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, 'companies', companyId, 'leads');
  }, [db, companyId]);
  const { data: leads } = useCollection(leadsQuery);

  // 6. Fetch Talent Count
  const talentsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, 'companies', companyId, 'talents');
  }, [db, companyId]);
  const { data: talents } = useCollection(talentsQuery);

  // --- ANALYTICS PROCESSING ---

  const stats = useMemo(() => {
    const revenue = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
    const pipeline = leads?.reduce((sum, l) => l.stage !== 'client' ? sum + (l.deal_value || 0) : sum, 0) || 0;
    const projectValue = allProjects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
    const active = allProjects?.filter(p => p.status === 'in_progress').length || 0;
    const team = talents?.length || 0;
    return { revenue, pipeline, projectValue, active, team };
  }, [invoices, leads, allProjects, talents]);

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
    const inProgress = allProjects?.filter(p => p.status === 'in_progress').length || 0;
    const completed = allProjects?.filter(p => p.status === 'completed').length || 0;
    return [
      { name: 'Active', value: inProgress, color: 'hsl(var(--primary))' },
      { name: 'Done', value: completed, color: 'hsl(var(--accent))' }
    ];
  }, [allProjects]);

  const overallProgress = useMemo(() => {
    if (!allProjects || allProjects.length === 0) return 0;
    const total = allProjects.reduce((sum, p) => sum + (p.progress || 0), 0);
    return Math.round(total / allProjects.length);
  }, [allProjects]);

  if (isTenantLoading || !hasMounted) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-primary">
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
          <p className="text-xs md:text-sm text-muted-foreground">{company?.name || 'Your'} Workspace Overview</p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-2 mb-1">
          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Production Velocity</span>
            <Progress value={overallProgress} className="w-32 h-1.5 bg-white shadow-inner" />
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {[
          { label: "Gross Revenue", val: `₹${(stats.revenue / 1000).toFixed(1)}k`, icon: IndianRupee, color: "text-emerald-500", desc: "Real-time ledger" },
          { label: "Project Value", val: `₹${(stats.projectValue / 100000).toFixed(1)}L`, icon: Layers, color: "text-primary", desc: "Active workspace" },
          { label: "Pipeline Value", val: `₹${(stats.pipeline / 100000).toFixed(1)}L`, icon: Target, color: "text-accent", desc: "Projected deals" },
          { label: "Active Projs", val: stats.active, icon: Briefcase, color: "text-blue-500", desc: "Currently filming" },
          { label: "Talent Pool", val: stats.team, icon: Users, color: "text-purple-500", desc: "Verified network" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm group hover:shadow-md transition-all rounded-[1.5rem]">
            <CardContent className="p-5 md:p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-xl bg-slate-50 ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> Live
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl md:text-2xl font-bold font-headline">{stat.val}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{stat.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg md:text-xl font-bold">Revenue Velocity</CardTitle>
              <CardDescription className="text-xs">Real-time monthly billing trends</CardDescription>
            </div>
            <Link href="/reports">
              <Button variant="ghost" size="sm" className="text-primary font-bold text-xs gap-2">
                Audit Intelligence <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="h-[200px] md:h-[250px] pt-4 pr-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  style={{ fontSize: '10px', fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }} 
                  dy={10}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '12px'
                  }}
                  formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={1500}
                  activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl font-bold">Production Pulse</CardTitle>
            <CardDescription className="text-xs">Active workspace distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] md:h-[250px] flex items-center justify-center">
            {stats.active === 0 && stats.revenue === 0 ? (
              <div className="text-center text-[10px] text-muted-foreground bg-slate-50 p-6 rounded-2xl border-2 border-dashed">
                Launch projects to track pulse
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectBreakdown}
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {projectBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects Horizon */}
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold">Recent Projects</h2>
          <Link href="/projects">
            <Button variant="link" className="text-primary font-bold text-sm">View All</Button>
          </Link>
        </div>
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {isProjectsLoading ? (
            <div className="flex gap-4">
              {[1, 2].map(i => <div key={i} className="min-w-[280px] md:min-w-[320px] h-[160px] md:h-[180px] bg-slate-200 animate-pulse rounded-[2rem]" />)}
            </div>
          ) : recentProjects?.length === 0 ? (
            <Link href="/projects" className="w-full">
              <Card className="w-full h-[160px] md:h-[180px] border-2 border-dashed border-slate-300 bg-white rounded-[2rem] flex items-center justify-center text-muted-foreground cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Launch First Project</span>
                </div>
              </Card>
            </Link>
          ) : (
            <>
              {recentProjects?.map((proj) => (
                <Link key={proj.id} href={`/projects/${proj.id}`}>
                  <Card className={`min-w-[280px] md:min-w-[320px] h-[160px] md:h-[180px] border-none shadow-lg text-white rounded-[2rem] p-6 md:p-8 flex flex-col justify-between group cursor-pointer hover:scale-[1.02] transition-transform ${proj.color || 'card-pink'}`}>
                    <div className="flex justify-between items-start">
                      <div className="h-8 md:h-10 w-8 md:w-10 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <Sparkles className="h-4 md:h-5 w-4 md:w-5" />
                      </div>
                      <MoreHorizontal className="h-4 md:h-5 w-4 md:w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-3 md:space-y-4">
                      <h3 className="font-bold text-base md:text-lg leading-tight w-2/3 line-clamp-2">{proj.project_name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {[1, 2].map(i => (
                            <Avatar key={i} className="h-5 md:h-6 w-5 md:w-6 border-2 border-white/20">
                              <AvatarImage src={`https://picsum.photos/seed/p${proj.id+i}/40/40`} />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">{proj.progress}%</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
              <Link href="/projects">
                <Card className="min-w-[200px] md:min-w-[320px] h-[160px] md:h-[180px] border-2 border-dashed border-primary/20 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary cursor-pointer hover:bg-primary/10 transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 md:h-10 w-8 md:w-10 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center"><Plus className="h-4 w-4" /></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">New Production</span>
                  </div>
                </Card>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold">Workspace Feed</h2>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="bg-transparent h-auto p-0 gap-6 md:gap-8 border-b border-slate-200 w-full justify-start rounded-none">
            <TabsTrigger value="active" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-bold px-0 pb-3">Active Tasks</TabsTrigger>
            <TabsTrigger value="done" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-bold px-0 pb-3 text-muted-foreground/60">Archive</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-3 md:space-y-4 pt-4">
            {isTasksLoading ? (
              <div className="space-y-3 md:space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-14 md:h-16 w-full bg-slate-100 animate-pulse rounded-2xl" />)}
              </div>
            ) : tasks?.length === 0 ? (
              <div className="text-center py-10 md:py-12 text-muted-foreground bg-white/50 rounded-3xl border-2 border-dashed">
                <p className="text-xs md:text-sm">No pending tasks. Your queue is clear.</p>
              </div>
            ) : (
              tasks?.map(task => (
                <div key={task.id} className="flex items-center justify-between group cursor-pointer p-3 md:p-4 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`h-9 md:h-10 w-9 md:w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm overflow-hidden`}>
                       {task.status === 'in_progress' ? <Clock className="h-4 md:h-5 w-4 md:w-5" /> : <CheckCircle2 className="h-4 md:h-5 w-4 md:w-5" />}
                    </div>
                    <div className="space-y-0.5 md:space-y-1">
                      <h4 className="font-bold text-xs md:text-sm leading-none">{task.name || task.title}</h4>
                      <p className="text-[9px] md:text-[11px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5 md:gap-2">
                        <TrendingUp className="h-2.5 md:h-3 w-2.5 md:w-3" /> {task.priority || 'Medium'} priority
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex -space-x-1.5 md:-space-x-2">
                      <Avatar className="h-5 md:h-6 w-5 md:w-6 border-2 border-white">
                        <AvatarImage src={`https://picsum.photos/seed/${task.id}/40/40`} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 md:h-9 w-8 md:w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
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
