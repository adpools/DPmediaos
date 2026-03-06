
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Building2, 
  CreditCard, 
  Banknote,
  Search,
  MoreVertical,
  Loader2,
  TrendingUp,
  History,
  Sparkles,
  Receipt,
  FileCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy, serverTimestamp, where } from "firebase/firestore";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth, endOfMonth, isSameMonth } from "date-fns";

export default function AccountsPage() {
  const { companyId, isLoading: isTenantLoading, company } = useTenant();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddAccountOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "Bank",
    balance: "",
    account_number: "",
    bank_name: ""
  });

  // 1. Fetch Company Accounts
  const accountsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'financial_accounts'),
      orderBy('created_at', 'desc')
    );
  }, [db, companyId]);

  const { data: accounts, isLoading: isAccountsLoading } = useCollection(accountsQuery);

  // 2. Fetch Recent Transactions
  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'transactions'),
      orderBy('date', 'desc')
    );
  }, [db, companyId]);

  const { data: transactions, isLoading: isTransactionsLoading } = useCollection(transactionsQuery);

  // 3. Fetch Invoices for GST calculation
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'invoices'),
      orderBy('issue_date', 'desc')
    );
  }, [db, companyId]);

  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  const totalLiquidity = useMemo(() => {
    return accounts?.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0) || 0;
  }, [accounts]);

  // GST Calculations
  const gstStats = useMemo(() => {
    if (!invoices) return { output: 0, pending: 0, months: [] };
    
    const monthlyData: Record<string, any> = {};
    let totalOutput = 0;

    invoices.forEach(inv => {
      const date = new Date(inv.issue_date);
      const monthKey = format(date, 'MMM yyyy');
      const amount = inv.gst_amount || 0;
      totalOutput += amount;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          period: monthKey,
          output: 0,
          status: 'Pending',
          count: 0
        };
      }
      monthlyData[monthKey].output += amount;
      monthlyData[monthKey].count += 1;
    });

    return {
      output: totalOutput,
      months: Object.values(monthlyData).sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime())
    };
  }, [invoices]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newAccount.name) return;

    setIsSubmitting(true);
    const accountsRef = collection(db, 'companies', companyId, 'financial_accounts');
    
    await addDocumentNonBlocking(accountsRef, {
      ...newAccount,
      balance: parseFloat(newAccount.balance) || 0,
      created_at: serverTimestamp(),
    });

    toast({ title: "Account Registered", description: `${newAccount.name} has been added to your vault.` });
    setNewAccount({ name: "", type: "Bank", balance: "", account_number: "", bank_name: "" });
    setIsAddOpen(false);
    setIsSubmitting(false);
  };

  if (isTenantLoading || isAccountsLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Financial Command</h1>
          <p className="text-muted-foreground">Manage company vaults and statutory tax compliance.</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white/50 p-1 rounded-xl border">
            <TabsList className="bg-transparent h-9 gap-1">
              <TabsTrigger value="overview" className="rounded-lg h-7 data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="gst" className="rounded-lg h-7 data-[state=active]:bg-primary data-[state=active]:text-white">GST Filing</TabsTrigger>
            </TabsList>
          </Tabs>
          {activeTab === 'overview' && (
            <Dialog open={isAddAccountOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20 h-11 px-6">
                  <Plus className="h-4 w-4" /> Register Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    New Financial Account
                  </DialogTitle>
                  <DialogDescription>Add a bank account or cash fund to your workspace ledger.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddAccount} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="accName">Account Label</Label>
                    <Input 
                      id="accName" 
                      placeholder="e.g. Primary Operations" 
                      value={newAccount.name}
                      onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Account Type</Label>
                      <Select onValueChange={(val) => setNewAccount({...newAccount, type: val})} defaultValue="Bank">
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Bank', 'Cash', 'Credit Card', 'Wallet'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bal">Initial Balance (₹)</Label>
                      <Input 
                        id="bal" 
                        type="number" 
                        placeholder="0.00" 
                        value={newAccount.balance}
                        onChange={(e) => setNewAccount({...newAccount, balance: e.target.value})}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank">Institution Name</Label>
                    <Input 
                      id="bank" 
                      placeholder="e.g. HDFC Bank" 
                      value={newAccount.bank_name}
                      onChange={(e) => setNewAccount({...newAccount, bank_name: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Authorize Account
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
          {/* Liquidity Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-soft bg-primary text-white rounded-[2rem] overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Wallet className="h-24 w-24" />
              </div>
              <CardContent className="p-8 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Total Liquidity</p>
                <h2 className="text-4xl font-bold font-headline">₹{totalLiquidity.toLocaleString()}</h2>
                <div className="flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-3 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" /> +12% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-soft bg-white rounded-[2rem]">
              <CardContent className="p-8 flex flex-col justify-center h-full">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Account Distribution</p>
                <div className="space-y-4">
                  {['Bank', 'Cash', 'Credit Card'].map((type) => {
                    const typeTotal = accounts?.filter(a => a.type === type).reduce((sum, a) => sum + (a.balance || 0), 0) || 0;
                    const percentage = totalLiquidity > 0 ? (typeTotal / totalLiquidity) * 100 : 0;
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{type}</span>
                          <span>₹{typeTotal.toLocaleString()}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-soft bg-accent text-white rounded-[2rem]">
              <CardContent className="p-8 flex flex-col justify-center h-full">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Pending Clearances</p>
                <h3 className="text-3xl font-bold">₹0.00</h3>
                <p className="text-[10px] font-medium text-white/80 mt-2">All checks and transfers reconciled.</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Accounts List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> Active Vaults
                </h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search accounts..." className="pl-9 h-9 rounded-xl text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts?.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed text-muted-foreground">
                    No accounts registered yet.
                  </div>
                ) : (
                  accounts?.map((acc) => (
                    <Card key={acc.id} className="border-none shadow-sm rounded-2xl hover:shadow-md transition-all group">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                            acc.type === 'Bank' ? 'bg-blue-50 text-blue-600' : 
                            acc.type === 'Cash' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {acc.type === 'Bank' ? <Building2 className="h-5 w-5" /> : 
                             acc.type === 'Cash' ? <Banknote className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                          </div>
                          <Badge variant="secondary" className="text-[9px] font-bold uppercase">{acc.type}</Badge>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg leading-none">{acc.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 tracking-wider">
                            {acc.bank_name || 'Internal Fund'}
                          </p>
                        </div>
                        <div className="pt-4 border-t flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Current Balance</p>
                            <p className="text-xl font-bold">₹{acc.balance?.toLocaleString()}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Recent Ledger Activity */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Ledger Activity
              </h3>
              <Card className="border-none shadow-soft rounded-[2rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                  {transactions?.length === 0 ? (
                    <div className="p-12 text-center text-xs text-muted-foreground">
                      No recent activity recorded.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {transactions?.map((tx) => (
                        <div key={tx.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {tx.type === 'income' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold truncate">{tx.description || 'Transaction'}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">{tx.category || 'General'}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {tx.type === 'income' ? '+' : '-'}₹{tx.amount?.toLocaleString()}
                            </p>
                            <p className="text-[9px] text-muted-foreground font-medium">{tx.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-4 bg-slate-50">
                    <Button variant="ghost" className="w-full text-xs font-bold text-primary">View Full Ledger</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gst" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* GST Filing Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm rounded-2xl bg-white border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">GST Output (Payable)</p>
                    <h4 className="text-2xl font-bold">₹{gstStats.output.toLocaleString()}</h4>
                    <p className="text-[10px] text-primary font-bold mt-2">From client billing</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm rounded-2xl bg-white border-l-4 border-l-accent">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">GST Input (Credit)</p>
                    <h4 className="text-2xl font-bold">₹0.00</h4>
                    <p className="text-[10px] text-rose-500 font-bold mt-2">Pending expense logs</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm rounded-2xl bg-primary text-white">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Net GST Payable</p>
                    <h4 className="text-2xl font-bold">₹{gstStats.output.toLocaleString()}</h4>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-[10px] font-bold">Est. current cycle</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Filing Ledger */}
              <Card className="border-none shadow-soft rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Filing Ledger</CardTitle>
                      <CardDescription>Track monthly GSTR-1 and GSTR-3B obligations.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl h-9">
                      <Download className="h-4 w-4 mr-2" /> Export Report
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50/30">
                          <th className="px-8 py-4 text-left font-bold text-[10px] uppercase tracking-wider">Filing Period</th>
                          <th className="px-8 py-4 text-left font-bold text-[10px] uppercase tracking-wider">GST Output</th>
                          <th className="px-8 py-4 text-left font-bold text-[10px] uppercase tracking-wider">Invoices</th>
                          <th className="px-8 py-4 text-left font-bold text-[10px] uppercase tracking-wider">Status</th>
                          <th className="px-8 py-4 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {gstStats.months.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-muted-foreground italic">No GST history available yet.</td>
                          </tr>
                        ) : (
                          gstStats.months.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-8 py-5 font-bold text-slate-700">{m.period}</td>
                              <td className="px-8 py-5 font-mono font-bold">₹{m.output.toLocaleString()}</td>
                              <td className="px-8 py-5 font-medium text-slate-500">{m.count} Invoices</td>
                              <td className="px-8 py-5">
                                <Badge variant={m.status === 'Filed' ? 'default' : 'secondary'} className="text-[9px] uppercase font-bold px-2 py-0.5">
                                  {m.status}
                                </Badge>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <Button variant="ghost" size="sm" className="rounded-xl text-[10px] font-bold uppercase text-primary">Mark Filed</Button>
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

            <div className="space-y-6">
              {/* Statutory Info Card */}
              <Card className="border-none shadow-sm rounded-[2rem] bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-primary" /> Tax Registration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-2xl space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Entity GSTIN</p>
                      <p className="font-mono font-bold text-primary">{company?.gstin || 'Pending Registration'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">State Jurisdiction</p>
                      <p className="font-bold text-slate-700">{company?.address?.split(',').slice(-2, -1)[0] || 'Not Set'}</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" className="w-full rounded-xl h-10 text-xs font-bold uppercase tracking-wider" onClick={() => setActiveTab('overview')}>
                      Update Business Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Alert Card */}
              <Card className="border-none shadow-sm rounded-[2rem] bg-amber-50 border-2 border-amber-100">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                    <h4 className="font-bold text-sm">Filing Reminder</h4>
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    Your GSTR-1 filing for the previous month is due in <span className="font-bold">4 days</span>. Ensure all invoices are finalized.
                  </p>
                  <div className="pt-2">
                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-10 text-xs font-bold uppercase">
                      Start Filing Flow
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* AI Guidance */}
              <Card className="border-none shadow-sm rounded-[2rem] bg-primary text-white overflow-hidden">
                <CardContent className="p-8 space-y-4">
                  <Sparkles className="h-8 w-8 text-accent" />
                  <h4 className="text-lg font-bold">Tax Intelligence</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Based on your production velocity, we recommend switching to quarterly filing to optimize cash flow management.
                  </p>
                  <Button className="w-full bg-white text-primary font-bold rounded-xl h-10 text-xs uppercase hover:bg-white/90">
                    Consult AI Accountant
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
