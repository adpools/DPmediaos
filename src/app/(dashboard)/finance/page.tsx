
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Receipt, 
  Plus, 
  FileText, 
  Cloud, 
  Table as TableIcon, 
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function FinancePage() {
  const invoices = [
    { id: 'INV-2024-001', client: 'Nike', date: 'Mar 12, 2024', amount: '$45,000', status: 'Finalized', sync: true },
    { id: 'INV-2024-002', client: 'Zara', date: 'Mar 15, 2024', amount: '$30,000', status: 'Pending', sync: false },
    { id: 'INV-2024-003', client: 'Apple', date: 'Mar 18, 2024', amount: '$12,500', status: 'Overdue', sync: true },
    { id: 'INV-2024-004', client: 'Netflix', date: 'Mar 20, 2024', amount: '$85,000', status: 'Draft', sync: false },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Finance & Invoices</h1>
          <p className="text-muted-foreground">Automated invoicing and real-time financial synchronization.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 rounded-xl">
            <Cloud className="h-4 w-4" /> Sync Settings
          </Button>
          <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-primary">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Outstanding</p>
            <h4 className="text-2xl font-bold font-headline">$142,500</h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <TrendingUp className="h-3 w-3" /> +15% from last month
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-accent">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Pending Approval</p>
            <h4 className="text-2xl font-bold font-headline">$30,000</h4>
            <p className="mt-2 text-[10px] text-muted-foreground font-bold">2 Invoices waiting</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-rose-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Overdue Payments</p>
            <h4 className="text-2xl font-bold font-headline">$12,500</h4>
            <p className="mt-2 text-[10px] text-rose-500 font-bold">Action required</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Sync Status</p>
            <h4 className="text-2xl font-bold font-headline">Healthy</h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <CheckCircle2 className="h-3 w-3" /> All systems operational
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-4 border-b">
          <div>
            <CardTitle className="text-xl font-headline">Recent Billing Activity</CardTitle>
            <CardDescription>Line item synchronization across Google Cloud Workspaces</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoice #" className="pl-9 h-10 rounded-xl" />
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
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Created</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Amount</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Sync</th>
                  <th className="p-4 text-right font-bold text-[11px] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-mono font-bold text-primary">{inv.id}</td>
                    <td className="p-4 font-bold">{inv.client}</td>
                    <td className="p-4 text-muted-foreground text-xs font-medium">{inv.date}</td>
                    <td className="p-4 font-bold">{inv.amount}</td>
                    <td className="p-4">
                      <Badge 
                        variant={inv.status === 'Finalized' ? 'default' : inv.status === 'Pending' ? 'secondary' : inv.status === 'Overdue' ? 'destructive' : 'outline'} 
                        className="text-[9px] uppercase font-bold py-0.5"
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {inv.sync ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold">Synced</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground opacity-50">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold">Waiting</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { TrendingUp } from "lucide-react";
