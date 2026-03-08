
"use client";

import { use, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  Receipt, 
  ArrowLeft, 
  Loader2, 
  ExternalLink,
  Clock,
  TrendingUp,
  Sparkles,
  Zap,
  Mail,
  Building2,
  TrendingDown,
  DollarSign,
  PieChart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useTenant } from "@/hooks/use-tenant";
import { useDoc, useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function ClientPortfolioPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const { companyId, isLoading: isTenantLoading } = useTenant();
  const db = useFirestore();

  // 1. Fetch Client/Lead Details
  const clientRef = useMemoFirebase(() => {
    if (!db || !companyId || !clientId) return null;
    return doc(db, 'companies', companyId, 'leads', clientId);
  }, [db, companyId, clientId]);

  const { data: client, isLoading: isClientLoading } = useDoc(clientRef);

  // 2. Fetch Client Projects
  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !client?.company_name) return null;
    return query(
      collection(db, 'companies', companyId, 'projects'),
      where('client_name', '==', client.company_name),
      orderBy('created_at', 'desc')
    );
  }, [db, companyId, client?.company_name]);

  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  // 3. Fetch Client Invoices
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !client?.company_name) return null;
    return query(
      collection(db, 'companies', companyId, 'invoices'),
      where('client_name', '==', client.company_name),
      orderBy('created_at', 'desc')
    );
  }, [db, companyId, client?.company_name]);

  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  // 4. Fetch All Expenses to calculate P&L per project
  const expensesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'expenses'),
      orderBy('date', 'desc')
    );
  }, [db, companyId]);

  const { data: allExpenses } = useCollection(expensesQuery);

  // --- GLOBAL STATS ---
  const totalBilled = useMemo(() => invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0, [invoices]);
  const totalPaid = useMemo(() => invoices?.reduce((sum, inv) => inv.payment_status === 'paid' ? sum + (inv.total || 0) : sum, 0) || 0, [invoices]);
  const outstanding = totalBilled - totalPaid;

  if (isTenantLoading || isClientLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Client not found</h2>
        <Link href="/clients">
          <Button variant="link">Back to Directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon" className="rounded-xl bg-white shadow-sm border border-slate-100">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tighter">{client.company_name}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" /> Corporate Portfolio & Financial History
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-white shadow-sm font-black text-primary uppercase text-[10px] tracking-widest border border-slate-100">
            {client.industry || 'General Media'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-soft bg-white border-l-4 border-l-primary rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Relationship Value</p>
            <h4 className="text-2xl font-black">₹{totalBilled.toLocaleString()}</h4>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft bg-white border-l-4 border-l-rose-500 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Outstanding Balance</p>
            <h4 className="text-2xl font-black text-rose-500">₹{outstanding.toLocaleString()}</h4>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft bg-white border-l-4 border-l-emerald-500 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Revenue Realized</p>
            <h4 className="text-2xl font-black text-emerald-600">₹{totalPaid.toLocaleString()}</h4>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft bg-white border-l-4 border-l-accent rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active Projects</p>
            <h4 className="text-2xl font-black text-accent">{projects?.filter(p => p.status !== 'completed').length || 0}</h4>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="bg-white/50 border p-1 rounded-2xl mb-6 shadow-sm">
              <TabsTrigger value="projects" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
                <Briefcase className="h-4 w-4" /> Production History
              </TabsTrigger>
              <TabsTrigger value="invoices" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
                <Receipt className="h-4 w-4" /> Financial Ledger
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-6 animate-in fade-in duration-500">
              {isProjectsLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : projects?.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-10" />
                  <p className="text-sm font-medium">No projects recorded for this client.</p>
                </div>
              ) : (
                projects?.map(project => {
                  // Calculate Project Specific P&L
                  const projectInvoices = invoices?.filter(inv => inv.project_id === project.id) || [];
                  const projectRevenue = projectInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
                  const projectBilledTotal = projectInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
                  
                  const projectExpenses = allExpenses?.filter(ex => ex.project_id === project.id) || [];
                  const projectBurn = projectExpenses.reduce((sum, ex) => sum + (ex.amount || 0), 0);
                  
                  const projectProfit = projectRevenue - projectBurn;
                  const isProfitable = projectProfit >= 0;

                  return (
                    <Card key={project.id} className="border-none shadow-soft overflow-hidden group rounded-[2rem] bg-white border border-slate-50">
                      <CardContent className="p-0 flex flex-col md:flex-row">
                        <div className="flex-1 p-8 space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-black text-xl group-hover:text-primary transition-colors leading-tight">{project.project_name}</h4>
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Ref: {project.project_ref || project.id.slice(0,8).toUpperCase()}</p>
                            </div>
                            <Badge className={cn(
                              "text-[9px] uppercase font-black tracking-tighter px-3 py-1 rounded-full",
                              project.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-primary/5 text-primary"
                            )}>
                              {project.status?.replace('_', ' ')}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                              <span>Production Velocity</span>
                              <span>{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-1.5" />
                          </div>

                          {/* Project-Specific P&L Summary */}
                          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase text-slate-400">Total Billed</p>
                              <p className="text-sm font-black text-slate-700">₹{projectBilledTotal.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase text-slate-400">Production Burn</p>
                              <p className="text-sm font-black text-rose-500">₹{projectBurn.toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase text-slate-400">Net Profit</p>
                              <p className={cn("text-sm font-black", isProfitable ? "text-emerald-600" : "text-rose-600")}>
                                ₹{projectProfit.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="md:w-64 bg-slate-50/50 p-8 flex flex-col justify-between border-l border-slate-100">
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Deadline</p>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-primary/60" />
                                <p className="text-sm font-bold text-slate-700">{project.deadline || 'TBD'}</p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Profit Margin</p>
                              <p className={cn("text-xs font-black", isProfitable ? "text-emerald-600" : "text-rose-600")}>
                                {projectRevenue > 0 ? ((projectProfit / projectRevenue) * 100).toFixed(1) : '0.0'}%
                              </p>
                            </div>
                          </div>
                          <Link href={`/projects/${project.id}`} className="mt-6">
                            <Button variant="outline" className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest h-10 gap-2 border-slate-200 hover:bg-white hover:border-primary hover:text-primary transition-all">
                              Manage Workspace <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="invoices" className="bg-white rounded-[2.5rem] shadow-soft overflow-hidden border border-slate-50 animate-in fade-in duration-500">
              <Table>
                <TableHeader className="bg-slate-50/50 border-b">
                  <TableRow>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest p-6 text-slate-400">Invoice #</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest p-6 text-slate-400">Base Amount</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest p-6 text-slate-400">Due Date</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest p-6 text-slate-400">Compliance</TableHead>
                    <TableHead className="text-right p-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isInvoicesLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : invoices?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic text-xs font-medium">No billing history found.</TableCell></TableRow>
                  ) : (
                    invoices?.map(inv => (
                      <TableRow key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                        <TableCell className="font-mono font-black text-primary p-6">{inv.invoice_number}</TableCell>
                        <TableCell className="font-black p-6 text-slate-700">₹{(inv.total || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-bold text-slate-500 p-6">{inv.due_date}</TableCell>
                        <TableCell className="p-6">
                          <Badge variant={inv.payment_status === 'paid' ? 'default' : 'secondary'} className="text-[9px] uppercase font-black tracking-tighter px-2.5 py-0.5">
                            {inv.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right p-6">
                          <Link href={`/invoices/${inv.id}`}>
                            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                              <Receipt className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-soft bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-primary/5 pb-6">
              <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter">Classification</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-accent/5 flex items-center justify-center text-accent shadow-sm border border-accent/10">
                  <Zap className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-black text-lg leading-tight text-slate-800">{client.service_vertical || 'General Production'}</p>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mt-1">Service Vertical</p>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-50 space-y-4">
                <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                  <Building2 className="h-4 w-4 text-primary/40" />
                  <span>Industry: {client.industry || 'Media'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                  <Mail className="h-4 w-4 text-primary/40" />
                  <span className="truncate">{client.email || 'No contact email'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                  <DollarSign className="h-4 w-4 text-emerald-500/60" />
                  <span>CRM Pipeline: <span className="text-primary">₹{(client.deal_value || 0).toLocaleString()}</span></span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                  <Clock className="h-4 w-4 text-primary/40" />
                  <span>Onboarded: {client.created_at?.toDate ? client.created_at.toDate().toLocaleDateString() : 'New Account'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft bg-primary text-white rounded-[2rem] overflow-hidden relative group">
            <Sparkles className="absolute top-0 right-0 p-8 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform" />
            <CardContent className="p-10 space-y-5">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <PieChart className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h4 className="text-xl font-black tracking-tight">AI Proposal Wizard</h4>
                <p className="text-xs text-white/60 leading-relaxed mt-2 font-medium">
                  Launch the AI architect to generate a professional production blueprint based on this client's history.
                </p>
              </div>
              <Link href={`/proposals?source=crm&leadId=${clientId}&companyName=${encodeURIComponent(client.company_name)}&vertical=${encodeURIComponent(client.service_vertical || '')}&industry=${encodeURIComponent(client.industry || '')}`} className="block pt-2">
                <Button className="w-full bg-white text-primary hover:bg-slate-100 font-black uppercase text-[10px] tracking-widest rounded-xl h-11 shadow-xl shadow-black/20">
                  Initialize Architect
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
