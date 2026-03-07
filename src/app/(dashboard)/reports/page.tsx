
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, TrendingUp, IndianRupee, Users, Briefcase, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from "recharts";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, where, collectionGroup } from "firebase/firestore";
import { format, subMonths, startOfMonth, isSameMonth } from "date-fns";

export default function ReportsPage() {
  const { companyId, isLoading: isTenantLoading } = useTenant();
  const db = useFirestore();

  // 1. Fetch Invoices for Revenue Stats
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, 'companies', companyId, 'invoices'));
  }, [db, companyId]);
  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  // 2. Fetch Projects for Active Count
  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, 'companies', companyId, 'projects'));
  }, [db, companyId]);
  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  // 3. Fetch Talent for Network Stats
  const talentsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, 'companies', companyId, 'talents'));
  }, [db, companyId]);
  const { data: talents, isLoading: isTalentsLoading } = useCollection(talentsQuery);

  // 4. Fetch CRM Leads for Pipeline Value
  const leadsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, 'companies', companyId, 'leads'));
  }, [db, companyId]);
  const { data: leads, isLoading: isLeadsLoading } = useCollection(leadsQuery);

  // 5. Fetch Budgets for Allocation Chart (Standardized to company_id)
  const budgetsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collectionGroup(db, 'budgets'), where('company_id', '==', companyId));
  }, [db, companyId]);
  const { data: budgets, isLoading: isBudgetsLoading } = useCollection(budgetsQuery);

  // --- DATA PROCESSING ---

  // A. Process Monthly Revenue (Last 6 Months)
  const revenueChartData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(new Date(), i);
      return {
        month: format(d, 'MMM'),
        date: startOfMonth(d),
        revenue: 0
      };
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

  // B. Process Budget Allocation
  const budgetChartData = useMemo(() => {
    const COLORS = ["#FF71A4", "#B199FF", "#6366F1", "#10B981", "#F59E0B", "#3B82F6"];
    const cats: Record<string, number> = {};
    
    budgets?.forEach(b => {
      const name = b.category || 'General';
      cats[name] = (cats[name] || 0) + (b.amount || 0);
    });

    return Object.entries(cats).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length]
    }));
  }, [budgets]);

  // C. Calculate High-Level Stats
  const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
  const activeProjectsCount = projects?.filter(p => p.status !== 'completed').length || 0;
  const talentCount = talents?.length || 0;
  const pipelineValue = leads?.reduce((sum, l) => sum + (l.deal_value || 0), 0) || 0;

  if (isTenantLoading || isInvoicesLoading || isProjectsLoading || isTalentsLoading || isLeadsLoading || isBudgetsLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Analytics & Intelligence</h1>
          <p className="text-muted-foreground">Deep insights into production efficiency and revenue growth.</p>
        </div>
        <Button className="gap-2 rounded-xl">
          <Download className="h-4 w-4" /> Export All Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", val: `₹${totalRevenue.toLocaleString()}`, change: "Real-time", icon: IndianRupee, color: "text-emerald-500" },
          { label: "Active Projects", val: activeProjectsCount.toString(), change: "Live", icon: Briefcase, color: "text-blue-500" },
          { label: "Talent Pool", val: talentCount.toString(), change: "Verified", icon: Users, color: "text-purple-500" },
          { label: "Pipeline Value", val: `₹${pipelineValue.toLocaleString()}`, change: "Projected", icon: Target, color: "text-accent" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg bg-slate-50 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full uppercase">{stat.change}</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold font-headline">{stat.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Monthly Revenue Trends</CardTitle>
            <CardDescription>Consolidated earnings from generated invoices</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {revenueChartData.every(d => d.revenue === 0) ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-medium bg-slate-50/50 rounded-2xl border-2 border-dashed">
                No billing history found for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(value: any) => `₹${value.toLocaleString()}`}
                  />
                  <Bar dataKey="revenue" fill="#B199FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Budget Allocation</CardTitle>
            <CardDescription>Distribution of allocated funds by category</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
             {budgetChartData.length === 0 ? (
               <div className="flex items-center justify-center w-full h-full text-muted-foreground text-xs font-medium bg-slate-50/50 rounded-2xl border-2 border-dashed">
                 No project budget items found.
               </div>
             ) : (
               <div className="flex flex-col md:flex-row items-center justify-center w-full h-full gap-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetChartData}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {budgetChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="w-full md:w-1/3 space-y-2">
                  {budgetChartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">₹{item.value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
