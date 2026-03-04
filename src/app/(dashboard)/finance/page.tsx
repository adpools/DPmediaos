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
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function FinancePage() {
  const invoices = [
    { id: 'INV-2024-001', client: 'Nike', date: 'Mar 12, 2024', amount: '$45,000', status: 'Finalized', sync: true },
    { id: 'INV-2024-002', client: 'Zara', date: 'Mar 15, 2024', amount: '$30,000', status: 'Pending', sync: false },
    { id: 'INV-2024-003', client: 'Apple', date: 'Mar 18, 2024', amount: '$12,500', status: 'Overdue', sync: true },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Finance &amp; Invoices</h1>
          <p className="text-muted-foreground">Automated invoicing with Google Cloud synchronization.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Cloud className="h-4 w-4" /> Configure Integration
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-accent/10 border-l-4 border-l-accent">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-accent/20 rounded-xl text-accent">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Google Drive</p>
              <h4 className="text-lg font-bold">Connected</h4>
              <p className="text-[10px] text-muted-foreground">Folder: DP_Invoices_2024</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-primary/10 border-l-4 border-l-primary">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-xl text-primary">
              <TableIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Google Sheets</p>
              <h4 className="text-lg font-bold">Connected</h4>
              <p className="text-[10px] text-muted-foreground">Sheet: DP_Media_Finance_Sync</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-indigo-400">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Sync</p>
              <h4 className="text-lg font-bold">2 Hours Ago</h4>
              <p className="text-[10px] text-muted-foreground">14 Items synced successfully</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl font-headline">Recent Invoices</CardTitle>
            <CardDescription>Line item automated synchronization history</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoice #" className="pl-9 h-9" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-4 text-left font-semibold">Invoice #</th>
                  <th className="p-4 text-left font-semibold">Client</th>
                  <th className="p-4 text-left font-semibold">Date</th>
                  <th className="p-4 text-left font-semibold">Amount</th>
                  <th className="p-4 text-left font-semibold">Status</th>
                  <th className="p-4 text-left font-semibold">Google Sync</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary">{inv.id}</td>
                    <td className="p-4 font-medium">{inv.client}</td>
                    <td className="p-4 text-muted-foreground">{inv.date}</td>
                    <td className="p-4 font-bold">{inv.amount}</td>
                    <td className="p-4">
                      <Badge variant={inv.status === 'Finalized' ? 'default' : inv.status === 'Pending' ? 'secondary' : 'destructive'} className="text-[10px]">
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
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold">Waiting</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="h-8 gap-2">
                        <FileText className="h-4 w-4" /> PDF
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
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