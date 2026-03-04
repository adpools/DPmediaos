
"use client";

import { use, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Briefcase, 
  Receipt, 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  DollarSign, 
  ExternalLink,
  CheckCircle2,
  Clock,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useTenant } from "@/hooks/use-tenant";
import { useDoc, useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  const totalBilled = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
  const totalPaid = invoices?.reduce((sum, inv) => inv.payment_status === 'paid' ? sum + (inv.total || 0) : sum, 0) || 0;
  const outstanding = totalBilled - totalPaid;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">{client.company_name}</h1>
          <p className="text-muted-foreground">Portfolio & Financial History</p>
        </div>
        <div className="ml-auto">
          <Badge variant="secondary" className="px-4 py-1 rounded-full bg-white font-bold text-primary uppercase text-[10px]">
            {client.industry || 'General Media'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Billed</p>
            <h4 className="text-2xl font-bold">${totalBilled.toLocaleString()}</h4>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Outstanding</p>
            <h4 className="text-2xl font-bold text-rose-500">${outstanding.toLocaleString()}</h4>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Active Projects</p>
            <h4 className="text-2xl font-bold">{projects?.filter(p => p.status !== 'completed').length || 0}</h4>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Lead Stage</p>
            <h4 className="text-2xl font-bold text-accent uppercase">{client.stage}</h4>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="bg-white/50 border p-1 rounded-2xl mb-6">
              <TabsTrigger value="projects" className="rounded-xl px-6 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Briefcase className="h-4 w-4" /> Production History
              </TabsTrigger>
              <TabsTrigger value="invoices" className="rounded-xl px-6 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Receipt className="h-4 w-4" /> Financial Ledger
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-4">
              {isProjectsLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : projects?.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed text-muted-foreground">
                  No projects recorded for this client.
                </div>
              ) : (
                projects?.map(project => (
                  <Card key={project.id} className="border-none shadow-sm overflow-hidden group">
                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{project.project_name}</h4>
                          <Badge variant="secondary" className="text-[9px] uppercase font-bold">{project.status}</Badge>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-1.5" />
                      </div>
                      <div className="flex items-center gap-8 md:border-l md:pl-8">
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Deadline</p>
                          <p className="text-sm font-bold">{project.deadline || 'TBD'}</p>
                        </div>
                        <Link href={`/projects`}>
                          <Button variant="ghost" size="icon" className="rounded-xl"><ExternalLink className="h-4 w-4" /></Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="invoices" className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-[11px] uppercase p-6">Invoice #</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase p-6">Amount</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase p-6">Due Date</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase p-6">Status</TableHead>
                    <TableHead className="text-right p-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isInvoicesLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : invoices?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No billing history found.</TableCell></TableRow>
                  ) : (
                    invoices?.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono font-bold p-6">{inv.invoice_number}</TableCell>
                        <TableCell className="font-bold p-6">${(inv.total || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground p-6">{inv.due_date}</TableCell>
                        <TableCell className="p-6">
                          <Badge variant={inv.payment_status === 'paid' ? 'default' : 'secondary'} className="text-[9px] uppercase font-bold">
                            {inv.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right p-6">
                          <Button variant="ghost" size="icon" className="rounded-xl"><Receipt className="h-4 w-4" /></Button>
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
          <Card className="border-none shadow-sm bg-white rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-lg">Primary Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-bold">
                  {client.contact_person?.[0]}
                </div>
                <div>
                  <p className="font-bold">{client.contact_person}</p>
                  <p className="text-xs text-muted-foreground">{client.email || 'No email provided'}</p>
                </div>
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Potential Deal Value: <span className="font-bold text-primary">${(client.deal_value || 0).toLocaleString()}</span></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Created: {client.created_at?.toDate ? client.created_at.toDate().toLocaleDateString() : 'Just now'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary text-white rounded-[2rem]">
            <CardContent className="p-8 space-y-4">
              <Sparkles className="h-8 w-8 text-accent" />
              <h4 className="text-xl font-bold">New Proposal?</h4>
              <p className="text-xs text-white/70">Generate an AI-powered production proposal tailored for this client's history.</p>
              <Link href="/proposals" className="block">
                <Button className="w-full bg-white text-primary hover:bg-white/90 font-bold rounded-xl">Launch Wizard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Sparkles } from "lucide-react";
