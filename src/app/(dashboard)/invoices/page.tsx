
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Cloud, Search, CheckCircle2, Download, Filter, TrendingUp, Loader2, IndianRupee, FileText, Sparkles, ExternalLink, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

export default function InvoicesPage() {
  const { profile, isLoading: isTenantLoading, companyId } = useTenant();
  const db = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invoice State
  const [newInvoice, setNewInvoice] = useState({
    client_name: "",
    client_id: "",
    project_id: "",
    project_name: "",
    project_ref: "",
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    total: "",
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // 1. Fetch Invoices
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'invoices'),
      orderBy('created_at', 'desc')
    );
  }, [db, companyId]);

  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  // 2. Fetch Leads (for Client Dropdown)
  const leadsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'leads'),
      orderBy('company_name', 'asc')
    );
  }, [db, companyId]);

  const { data: leads } = useCollection(leadsQuery);

  // 3. Fetch Projects (for Project Dropdown)
  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'projects'),
      orderBy('project_name', 'asc')
    );
  }, [db, companyId]);

  const { data: projects } = useCollection(projectsQuery);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newInvoice.client_name || !newInvoice.project_id) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select both a client and a project.",
      });
      return;
    }

    setIsSubmitting(true);
    const invoicesRef = collection(db, 'companies', companyId, 'invoices');
    
    const amount = parseFloat(newInvoice.total) || 0;
    const gst = amount * 0.18;
    const totalWithGst = amount + gst;

    addDocumentNonBlocking(invoicesRef, {
      company_id: companyId,
      ...newInvoice,
      subtotal: amount,
      gst_amount: gst,
      total: totalWithGst,
      payment_status: 'unpaid',
      line_items: [
        {
          description: `${newInvoice.project_name} Services`,
          unit_price: amount,
          quantity: 1,
          total: amount
        }
      ],
      currency: "INR",
      created_at: serverTimestamp(),
    });

    toast({
      title: "Invoice Generated",
      description: `Billing for ${newInvoice.client_name} has been created.`,
    });

    setNewInvoice({ 
      client_name: "", 
      client_id: "",
      project_id: "",
      project_name: "",
      project_ref: "",
      invoice_number: `INV-${Date.now().toString().slice(-6)}`, 
      total: "", 
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsAddOpen(false);
    setIsSubmitting(false);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (!db || !companyId || !invoiceId) return;
    const invoiceRef = doc(db, 'companies', companyId, 'invoices', invoiceId);
    deleteDocumentNonBlocking(invoiceRef);
    toast({ title: "Invoice Removed", description: "The billing record has been deleted." });
  };

  if (isTenantLoading || isInvoicesLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalOutstanding = invoices?.reduce((sum, inv) => inv.payment_status !== 'paid' ? sum + (inv.total || 0) : sum, 0) || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Finance & Invoices</h1>
          <p className="text-muted-foreground">Automated invoicing and real-time financial synchronization.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 rounded-xl">
            <Cloud className="h-4 w-4" /> Sync Settings
          </Button>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Issue New Invoice
                </DialogTitle>
                <DialogDescription>
                  Capture the billing details for your client production.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateInvoice} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client Name</Label>
                  <Select 
                    value={newInvoice.client_id} 
                    onValueChange={(val) => {
                      const lead = leads?.find(l => l.id === val);
                      setNewInvoice({ ...newInvoice, client_id: val, client_name: lead?.company_name || "" });
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads?.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">No clients found.</div>
                      ) : (
                        leads?.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.company_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Production Project</Label>
                  <Select 
                    value={newInvoice.project_id} 
                    onValueChange={(val) => {
                      const proj = projects?.find(p => p.id === val);
                      const lead = leads?.find(l => l.company_name === proj?.client_name);
                      setNewInvoice({ 
                        ...newInvoice, 
                        project_id: val,
                        project_name: proj?.project_name || "",
                        project_ref: proj?.project_ref || "",
                        client_name: proj?.client_name || newInvoice.client_name,
                        client_id: lead?.id || newInvoice.client_id,
                        total: proj?.budget ? proj.budget.toString() : ""
                      });
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Link to project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">No active projects found.</div>
                      ) : (
                        projects?.map((proj) => (
                          <SelectItem key={proj.id} value={proj.id}>
                            {proj.project_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invNum">Invoice #</Label>
                    <Input id="invNum" value={newInvoice.invoice_number} disabled className="rounded-xl bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tot">Base Amount (₹)</Label>
                    <Input 
                      id="tot" 
                      type="number"
                      placeholder="12000" 
                      value={newInvoice.total}
                      onChange={(e) => setNewInvoice({...newInvoice, total: e.target.value})}
                      required
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="iss">Issue Date</Label>
                    <Input 
                      id="iss" 
                      type="date"
                      value={newInvoice.issue_date}
                      onChange={(e) => setNewInvoice({...newInvoice, issue_date: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due">Due Date</Label>
                    <Input 
                      id="due" 
                      type="date"
                      value={newInvoice.due_date}
                      onChange={(e) => setNewInvoice({...newInvoice, due_date: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">GST @ 18% will be applied automatically.</p>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Finalize & Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-primary">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Outstanding</p>
            <h4 className="text-2xl font-bold font-headline">₹{totalOutstanding.toLocaleString()}</h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <TrendingUp className="h-3 w-3" /> Real-time tracking
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-accent">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Active Invoices</p>
            <h4 className="text-2xl font-bold font-headline">{invoices?.length || 0}</h4>
            <p className="mt-2 text-[10px] text-muted-foreground font-bold">In the billing queue</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Paid to Date</p>
            <h4 className="text-2xl font-bold font-headline">
              ₹{invoices?.reduce((sum, inv) => inv.payment_status === 'paid' ? sum + (inv.total || 0) : sum, 0).toLocaleString()}
            </h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <CheckCircle2 className="h-3 w-3" /> Fully reconciled
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Cloud Sync</p>
            <h4 className="text-2xl font-bold font-headline">Ready</h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
              <Cloud className="h-3 w-3" /> Drive/Sheets enabled
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-4 border-b bg-white">
          <div>
            <CardTitle className="text-xl font-headline">Recent Billing Activity</CardTitle>
            <CardDescription>Real-time line item synchronization across your production ledger.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoice #" className="pl-9 h-10 rounded-xl" />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 border-b">
                <tr>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Invoice #</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Client</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Project</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Due Date</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Amount</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-right font-bold text-[11px] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">No invoices generated yet.</td>
                  </tr>
                ) : (
                  invoices?.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 font-mono font-bold text-primary">{inv.invoice_number}</td>
                      <td className="p-4 font-bold">{inv.client_name}</td>
                      <td className="p-4 text-xs text-muted-foreground font-medium">{inv.project_name || 'General Production'}</td>
                      <td className="p-4 text-muted-foreground text-xs font-medium">{inv.due_date}</td>
                      <td className="p-4 font-bold">₹{(inv.total || 0).toLocaleString()}</td>
                      <td className="p-4">
                        <Badge variant={inv.payment_status === 'paid' ? 'default' : 'secondary'} className="text-[9px] uppercase font-bold py-0.5">
                          {inv.payment_status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[2rem]">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Invoice Record?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove invoice {inv.invoice_number}. This action cannot be reversed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteInvoice(inv.id)} className="bg-rose-500 hover:bg-rose-600 rounded-xl">
                                  Confirm Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><Download className="h-4 w-4" /></Button>
                          <Link href={`/invoices/${inv.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
