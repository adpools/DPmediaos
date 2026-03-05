
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Receipt, 
  Plus, 
  Cloud, 
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  TrendingUp,
  Loader2,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import { useState, useMemo } from "react";

export default function FinancePage() {
  const { companyId, isLoading: isTenantLoading } = useTenant();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch real invoices
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'invoices'),
      orderBy('created_at', 'desc')
    );
  }, [db, companyId]);

  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  // Financial Calculations
  const stats = useMemo(() => {
    if (!invoices) return { outstanding: 0, pending: 0, overdue: 0, paid: 0 };
    
    return invoices.reduce((acc, inv) => {
      const total = inv.total || 0;
      if (inv.payment_status === 'paid') {
        acc.paid += total;
      } else {
        acc.outstanding += total;
        if (inv.payment_status === 'unpaid') acc.pending += 1;
        // Logic for overdue could be added here based on due_date
      }
      return acc;
    }, { outstanding: 0, pending: 0, overdue: 0, paid: 0 });
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(inv => 
      inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [invoices, searchQuery]);

  if (isTenantLoading || isInvoicesLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Finance & Invoices</h1>
          <p className="text-muted-foreground">Automated invoicing and real-time financial synchronization.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/invoices">
            <Button variant="outline" className="gap-2 rounded-xl">
              <Cloud className="h-4 w-4" /> Manage All
            </Button>
          </Link>
          <Link href="/invoices">
            <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-primary">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Outstanding</p>
            <h4 className="text-2xl font-bold font-headline">₹{stats.outstanding.toLocaleString()}</h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <TrendingUp className="h-3 w-3" /> Updated just now
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-accent">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Pending Approval</p>
            <h4 className="text-2xl font-bold font-headline">{stats.pending}</h4>
            <p className="mt-2 text-[10px] text-muted-foreground font-bold">Invoices waiting payment</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-rose-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Paid to Date</p>
            <h4 className="text-2xl font-bold font-headline">₹{stats.paid.toLocaleString()}</h4>
            <p className="mt-2 text-[10px] text-rose-500 font-bold">Cleared funds</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Sync Status</p>
            <h4 className="text-2xl font-bold font-headline">Healthy</h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <CheckCircle2 className="h-3 w-3" /> Cloud ledger active
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-4 border-b">
          <div>
            <CardTitle className="text-xl font-headline">Recent Billing Activity</CardTitle>
            <CardDescription>Real-time line item synchronization from Firestore</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search invoices..." 
                className="pl-9 h-10 rounded-xl" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 border-b">
                <tr>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Invoice #</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Client</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Issue Date</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Amount</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-right font-bold text-[11px] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      No billing records found.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 font-mono font-bold text-primary">{inv.invoice_number}</td>
                      <td className="p-4 font-bold">{inv.client_name}</td>
                      <td className="p-4 text-muted-foreground text-xs font-medium">{inv.issue_date}</td>
                      <td className="p-4 font-bold">₹{(inv.total || 0).toLocaleString()}</td>
                      <td className="p-4">
                        <Badge 
                          variant={inv.payment_status === 'paid' ? 'default' : 'secondary'} 
                          className="text-[9px] uppercase font-bold py-0.5"
                        >
                          {inv.payment_status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Link href={`/invoices/${inv.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
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
