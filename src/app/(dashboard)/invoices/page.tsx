"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Cloud, Search, CheckCircle2, Download, Filter, TrendingUp, Loader2, Receipt, FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";

export default function InvoicesPage() {
  const { profile, isLoading: isTenantLoading } = useTenant();
  const db = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invoice State
  const [newInvoice, setNewInvoice] = useState({
    clientName: "",
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    total: "",
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return query(
      collection(db, 'companies', profile.companyId, 'invoices'),
      orderBy('createdAt', 'desc')
    );
  }, [db, profile?.companyId]);

  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId || !newInvoice.clientName) return;

    setIsSubmitting(true);
    const invoicesRef = collection(db, 'companies', profile.companyId, 'invoices');
    
    addDocumentNonBlocking(invoicesRef, {
      companyId: profile.companyId,
      ...newInvoice,
      total: parseFloat(newInvoice.total) || 0,
      paymentStatus: 'unpaid',
      lineItems: ["Production Services"],
      subtotal: parseFloat(newInvoice.total) || 0,
      taxAmount: 0,
      currency: "USD",
      createdAt: serverTimestamp(),
    });

    toast({
      title: "Invoice Generated",
      description: `Billing for ${newInvoice.clientName} has been created.`,
    });

    setNewInvoice({ 
      clientName: "", 
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`, 
      total: "", 
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsAddOpen(false);
    setIsSubmitting(false);
  };

  if (isTenantLoading || isInvoicesLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalOutstanding = invoices?.reduce((sum, inv) => inv.paymentStatus !== 'paid' ? sum + (inv.total || 0) : sum, 0) || 0;

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
                  <Input 
                    id="client" 
                    placeholder="e.g. Apple Vision Pro Campaign" 
                    value={newInvoice.clientName}
                    onChange={(e) => setNewInvoice({...newInvoice, clientName: e.target.value})}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invNum">Invoice #</Label>
                    <Input id="invNum" value={newInvoice.invoiceNumber} disabled className="rounded-xl bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tot">Total Amount ($)</Label>
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
                      value={newInvoice.issueDate}
                      onChange={(e) => setNewInvoice({...newInvoice, issueDate: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due">Due Date</Label>
                    <Input 
                      id="due" 
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                </div>
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
            <h4 className="text-2xl font-bold font-headline">${totalOutstanding.toLocaleString()}</h4>
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
              ${invoices?.reduce((sum, inv) => inv.paymentStatus === 'paid' ? sum + (inv.total || 0) : sum, 0).toLocaleString()}
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
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Due Date</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Amount</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-right font-bold text-[11px] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">No invoices generated yet.</td>
                  </tr>
                ) : (
                  invoices?.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 font-mono font-bold text-primary">{inv.invoiceNumber}</td>
                      <td className="p-4 font-bold">{inv.clientName}</td>
                      <td className="p-4 text-muted-foreground text-xs font-medium">{inv.dueDate}</td>
                      <td className="p-4 font-bold">${(inv.total || 0).toLocaleString()}</td>
                      <td className="p-4">
                        <Badge variant={inv.paymentStatus === 'paid' ? 'default' : 'secondary'} className="text-[9px] uppercase font-bold py-0.5">
                          {inv.paymentStatus}
                        </Badge>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><FileText className="h-4 w-4" /></Button>
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
