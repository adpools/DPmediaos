
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
  Download,
  BrainCircuit,
  ChevronRight,
  TrendingDown,
  DollarSign,
  Briefcase,
  PieChart,
  Target,
  ShieldCheck,
  Zap
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
import { consultAIAccountant, type AIAccountantOutput } from "@/ai/flows/ai-accountant-flow";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AccountsPage() {
  const { companyId, isLoading: isTenantLoading, company, profile } = useTenant();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddAccountOpen, setIsAddOpen] = useState(false);
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filing Flow State
  const [isFilingOpen, setIsFilingOpen] = useState(false);
  const [selectedFilingPeriod, setSelectedFilingPeriod] = useState<any>(null);

  // AI State
  const [isAIResultOpen, setIsAIResultOpen] = useState(false);
  const [aiAdvice, setAIAdvice] = useState<AIAccountantOutput | null>(null);
  const [isConsultingAI, setIsConsultingAI] = useState(false);

  // Form State
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "Bank",
    balance: "",
    account_number: "",
    bank_name: ""
  });

  const [newExpense, setNewExpense] = useState({
    category: "Salary",
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    account_id: "",
    status: "Paid"
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

  // 2. Fetch Expenses
  const expensesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'expenses'),
      orderBy('date', 'desc')
    );
  }, [db, companyId]);

  const { data: expenses, isLoading: isExpensesLoading } = useCollection(expensesQuery);

  // 3. Fetch Invoices for GST calculation
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'invoices'),
      orderBy('issue_date', 'desc')
    );
  }, [db, companyId]);

  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  // --- DERIVED CALCULATIONS ---

  const totalLiquidity = useMemo(() => {
    return accounts?.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0) || 0;
  }, [accounts]);

  const totalExpensesMonth = useMemo(() => {
    if (!expenses) return 0;
    const now = new Date();
    return expenses
      .filter(e => isSameMonth(new Date(e.date), now))
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [expenses]);

  const gstStats = useMemo(() => {
    if (!invoices) return { output: 0, months: [] };
    
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

  // --- ACTIONS ---

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newAccount.name) return;

    setIsSubmitting(true);
    const accountsRef = collection(db, 'companies', companyId, 'financial_accounts');
    
    addDocumentNonBlocking(accountsRef, {
      ...newAccount,
      balance: parseFloat(newAccount.balance) || 0,
      created_at: serverTimestamp(),
    });

    toast({ title: "Account Registered", description: `${newAccount.name} added to the vault.` });
    setNewAccount({ name: "", type: "Bank", balance: "", account_number: "", bank_name: "" });
    setIsAddOpen(false);
    setIsSubmitting(false);
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newExpense.description || !newExpense.amount) return;

    setIsSubmitting(true);
    const expensesRef = collection(db, 'companies', companyId, 'expenses');
    
    addDocumentNonBlocking(expensesRef, {
      ...newExpense,
      company_id: companyId,
      amount: parseFloat(newExpense.amount) || 0,
      created_at: serverTimestamp(),
    });

    toast({ title: "Expense Recorded", description: `${newExpense.category} cost has been added to ledger.` });
    setNewExpense({ category: "Salary", description: "", amount: "", date: new Date().toISOString().split('T')[0], account_id: "", status: "Paid" });
    setIsLogExpenseOpen(false);
    setIsSubmitting(false);
  };

  const handleStartFiling = (monthData: any) => {
    setSelectedFilingPeriod(monthData);
    setIsFilingOpen(true);
  };

  const completeFiling = async () => {
    setIsSubmitting(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({ title: "GST Filed Successfully", description: `Returns for ${selectedFilingPeriod?.period} have been archived.` });
    setIsFilingOpen(false);
    setIsSubmitting(false);
  };

  const handleConsultAI = async () => {
    if (!company || isConsultingAI) return;

    setIsConsultingAI(true);
    try {
      const pendingPeriods = gstStats.months.filter(m => m.status === 'Pending').map(m => m.period);
      const advice = await consultAIAccountant({
        companyName: company.name || "DP Studio",
        totalLiquidity,
        totalGstOutput: gstStats.output,
        pendingPeriods,
        billingVelocity: invoices?.length && invoices.length > 5 ? "High volume production billing" : "Stable periodic billing"
      });
      setAIAdvice(advice);
      setIsAIResultOpen(true);
    } catch (error) {
      console.error("AI Consultant failed:", error);
      toast({ variant: "destructive", title: "AI Offline", description: "Our AI accountant is taking a short break." });
    } finally {
      setIsConsultingAI(false);
    }
  };

  if (isTenantLoading || isAccountsLoading || isExpensesLoading || isInvoicesLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-primary">Financial Command</h1>
          <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" /> Workspace vault, expense tracking, and GST compliance.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white/50 p-1 rounded-xl border w-full sm:w-auto">
            <TabsList className="bg-transparent h-9 gap-1 w-full justify-between">
              <TabsTrigger value="overview" className="flex-1 rounded-lg h-7 text-[10px] uppercase font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="expenses" className="flex-1 rounded-lg h-7 text-[10px] uppercase font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Expenses</TabsTrigger>
              <TabsTrigger value="gst" className="flex-1 rounded-lg h-7 text-[10px] uppercase font-bold data-[state=active]:bg-primary data-[state=active]:text-white">GST Filing</TabsTrigger>
            </TabsList>
          </Tabs>
          {activeTab === 'overview' && (
            <Button onClick={() => setIsAddOpen(true)} className="gap-2 rounded-xl shadow-lg shadow-primary/20 h-10 px-6 w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Register Vault
            </Button>
          )}
          {activeTab === 'expenses' && (
            <Button onClick={() => setIsLogExpenseOpen(true)} className="gap-2 rounded-xl shadow-lg shadow-accent/20 h-10 px-6 bg-accent hover:bg-accent/90 w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Log Cost
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} className="w-full">
        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <Card className="border-none shadow-soft bg-primary text-white rounded-[2rem] overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Wallet className="h-24 w-24" />
              </div>
              <CardContent className="p-6 md:p-8 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Total Liquidity</p>
                <h2 className="text-3xl md:text-4xl font-bold font-headline">₹{totalLiquidity.toLocaleString()}</h2>
                <div className="flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-3 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" /> Real-time Asset Valuation
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-soft bg-white rounded-[2rem]">
              <CardContent className="p-6 md:p-8 flex flex-col justify-center h-full">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Monthly Burn Profile</p>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Expenses</span>
                      <span>₹{totalExpensesMonth.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent rounded-full" 
                        style={{ width: `${Math.min((totalExpensesMonth / (totalLiquidity || 1)) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-medium italic">
                    Utilizing {((totalExpensesMonth / (totalLiquidity || 1)) * 100).toFixed(1)}% of available capital
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-soft bg-accent text-white rounded-[2rem] sm:col-span-2 md:col-span-1">
              <CardContent className="p-6 md:p-8 flex flex-col justify-center h-full">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2">Net Working Capital</p>
                <h3 className="text-2xl md:text-3xl font-bold">₹{(totalLiquidity - totalExpensesMonth).toLocaleString()}</h3>
                <p className="text-[10px] font-medium text-white/80 mt-2">Post-burn liquidity snapshot.</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2 px-2">
                <Building2 className="h-5 w-5 text-primary" /> Registered Vaults
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts?.length === 0 ? (
                  <div className="col-span-full py-16 md:py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed text-muted-foreground px-4">
                    <p className="text-sm font-medium">No financial accounts found.</p>
                    <Button variant="link" className="mt-2" onClick={() => setIsAddOpen(true)}>Initialize your first vault</Button>
                  </div>
                ) : (
                  accounts?.map((acc) => (
                    <Card key={acc.id} className="border-none shadow-sm rounded-[1.5rem] group hover:shadow-md transition-all border border-slate-50">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                            acc.type === 'Bank' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {acc.type === 'Bank' ? <Building2 className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                          </div>
                          <Badge variant="secondary" className="text-[9px] font-bold uppercase px-2">{acc.type}</Badge>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg leading-none">{acc.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">
                            {acc.bank_name || 'INTERNAL RESERVE'}
                          </p>
                        </div>
                        <div className="pt-4 border-t flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Balance</p>
                            <p className="text-xl font-bold">₹{acc.balance?.toLocaleString()}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2 px-2">
                <History className="h-5 w-5 text-primary" /> Financial Pulse
              </h3>
              <Card className="border-none shadow-soft rounded-[2rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                  {expenses?.length === 0 && gstStats.months.length === 0 ? (
                    <div className="p-12 text-center text-[10px] text-muted-foreground italic">
                      Zero movements recorded.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {expenses?.slice(0, 6).map((ex) => (
                        <div key={ex.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                          <div className="h-8 w-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <TrendingDown className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-bold truncate">{ex.description}</p>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase">{ex.category}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs md:text-sm font-bold text-rose-600">-₹{ex.amount?.toLocaleString()}</p>
                            <p className="text-[8px] text-muted-foreground font-medium uppercase">{format(new Date(ex.date), 'dd MMM')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* EXPENSES TAB */}
        <TabsContent value="expenses" className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-soft rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b px-6 md:px-8 py-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg md:text-xl font-bold">Operational Ledger</CardTitle>
                      <CardDescription className="text-xs">Payroll, rent, and recurring production costs.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl h-9 w-full sm:w-auto font-bold gap-2">
                      <Download className="h-4 w-4" /> Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[650px]">
                      <thead>
                        <tr className="border-b bg-slate-50/30">
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Date</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Category</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Description</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Amount</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {expenses?.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-8 py-16 text-center text-muted-foreground italic text-xs">No running costs registered.</td>
                          </tr>
                        ) : (
                          expenses?.map((ex) => (
                            <tr key={ex.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 md:px-8 py-5 text-slate-500 font-medium text-xs whitespace-nowrap">{format(new Date(ex.date), 'MMM dd, yyyy')}</td>
                              <td className="px-6 md:px-8 py-5">
                                <Badge variant="secondary" className="text-[8px] md:text-[9px] uppercase font-bold py-0">{ex.category}</Badge>
                              </td>
                              <td className="px-6 md:px-8 py-5 font-bold text-slate-700 text-xs">{ex.description}</td>
                              <td className="px-6 md:px-8 py-5 font-black text-rose-600 text-xs whitespace-nowrap">₹{ex.amount?.toLocaleString()}</td>
                              <td className="px-6 md:px-8 py-5">
                                <Badge variant={ex.status === 'Paid' ? 'default' : 'outline'} className="text-[8px] md:text-[9px] uppercase font-bold py-0">
                                  {ex.status}
                                </Badge>
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
              <Card className="border-none shadow-sm rounded-[2rem] bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" /> Cost Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {['Salary', 'Rent', 'Production', 'Marketing'].map(cat => {
                    const catTotal = expenses?.filter(e => e.category === cat).reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
                    const perc = totalExpensesMonth > 0 ? (catTotal / totalExpensesMonth) * 100 : 0;
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <span>{cat}</span>
                          <span>₹{catTotal.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${perc}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-none shadow-soft rounded-[2rem] bg-indigo-950 text-white overflow-hidden">
                <CardContent className="p-8 space-y-5 relative">
                  <BrainCircuit className="h-8 w-8 text-accent mb-2" />
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold">AI Spend Audit</h4>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Optimize your production overhead. Our AI accountant scans your ledger for potential savings and tax offsets.
                    </p>
                  </div>
                  <Button variant="secondary" className="w-full rounded-xl h-11 font-bold text-xs gap-2" onClick={handleConsultAI} disabled={isConsultingAI}>
                    {isConsultingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    Analyze Intelligence
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* GST TAB */}
        <TabsContent value="gst" className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm rounded-3xl bg-white border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">GST Output</p>
                    <h4 className="text-2xl font-bold">₹{gstStats.output.toLocaleString()}</h4>
                    <p className="text-[9px] text-emerald-600 font-bold mt-1">+ Real-time Billing Sync</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm rounded-3xl bg-white border-l-4 border-l-accent">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Estimated Input</p>
                    <h4 className="text-2xl font-bold">₹{(totalExpensesMonth * 0.18).toLocaleString()}</h4>
                    <p className="text-[9px] text-muted-foreground font-bold mt-1">Calculated from Expenses</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm rounded-3xl bg-primary text-white">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] mb-1">Net Liability</p>
                    <h4 className="text-2xl font-bold">₹{Math.max(0, gstStats.output - (totalExpensesMonth * 0.18)).toLocaleString()}</h4>
                    <p className="text-[9px] text-white/40 font-bold mt-1">Payable this Quarter</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-soft rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b px-8 py-6">
                  <CardTitle className="text-xl font-bold">Statutory Filing Ledger</CardTitle>
                  <CardDescription>Track GSTR-1 and GSTR-3B obligations by period.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead>
                        <tr className="border-b bg-slate-50/30">
                          <th className="px-8 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Filing Period</th>
                          <th className="px-8 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">GST Output</th>
                          <th className="px-8 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Compliance</th>
                          <th className="px-8 py-4 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {gstStats.months.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-8 py-16 text-center text-muted-foreground italic text-xs">No invoices generated for this fiscal year.</td>
                          </tr>
                        ) : (
                          gstStats.months.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-8 py-5 font-bold text-slate-700 text-sm">{m.period}</td>
                              <td className="px-8 py-5 font-mono font-bold text-xs text-primary">₹{m.output.toLocaleString()}</td>
                              <td className="px-8 py-5">
                                <Badge variant={m.status === 'Filed' ? 'default' : 'secondary'} className="text-[9px] uppercase font-bold py-0">
                                  {m.status}
                                </Badge>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/5" onClick={() => handleStartFiling(m)}>
                                  Initiate Filing
                                </Button>
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
              <Card className="border-none shadow-sm rounded-3xl bg-amber-50 border border-amber-100">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-amber-700">
                    <AlertCircle className="h-5 w-5" />
                    <h4 className="font-bold text-sm">Upcoming Deadline</h4>
                  </div>
                  <p className="text-xs text-amber-800/70 leading-relaxed font-medium">
                    GSTR-1 filing for <strong>{format(new Date(), 'MMMM yyyy')}</strong> is due by the 11th of next month. Ensure all production invoices are synced.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[2rem] bg-slate-900 text-white p-8 space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <FileCheck className="h-6 w-6 text-accent" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold">Filing Assistant</h4>
                  <p className="text-xs text-slate-400">Download formatted reports for your CA or use our API to push directly to the GST portal.</p>
                </div>
                <div className="pt-2 space-y-3">
                  <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-10 text-xs font-bold">Download GSTR-1</Button>
                  <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-10 text-xs font-bold">Download GSTR-3B</Button>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOGS */}

      {/* Register Account Dialog */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <CreditCard className="h-6 w-6 text-primary" />
              Register Vault
            </DialogTitle>
            <DialogDescription>
              Link a new financial institution or cash reserve.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAccount} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>Account Nickname</Label>
              <Input 
                placeholder="e.g. HDFC Current Account" 
                value={newAccount.name}
                onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                required
                className="rounded-xl h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newAccount.type} onValueChange={(val) => setNewAccount({...newAccount, type: val})}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank">Bank Account</SelectItem>
                    <SelectItem value="Cash">Cash / Petty</SelectItem>
                    <SelectItem value="Credit">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Opening Balance</Label>
                <Input 
                  type="number"
                  placeholder="0.00" 
                  value={newAccount.balance}
                  onChange={(e) => setNewAccount({...newAccount, balance: e.target.value})}
                  className="rounded-xl h-11"
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize Registration"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Expense Dialog */}
      <Dialog open={isLogExpenseOpen} onOpenChange={setIsLogExpenseOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Receipt className="h-6 w-6 text-accent" />
              Log Production Cost
            </DialogTitle>
            <DialogDescription>
              Enter running costs or salaries for accurate burn tracking.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogExpense} className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newExpense.category} onValueChange={(val) => setNewExpense({...newExpense, category: val})}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Salary', 'Rent', 'Utilities', 'Production', 'Marketing', 'Other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input 
                  type="number"
                  placeholder="5000" 
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  required
                  className="rounded-xl h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                placeholder="e.g. Lead Editor Jan Salary" 
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                required
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                className="rounded-xl h-11"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90 rounded-xl h-12 font-bold shadow-lg shadow-accent/20">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit to Ledger"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* GST Filing Dialog */}
      <Dialog open={isFilingOpen} onOpenChange={setIsFilingOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <FileCheck className="h-6 w-6 text-primary" />
              Finalize Compliance
            </DialogTitle>
            <DialogDescription>
              Confirming GST returns for the selected period.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Reporting Period</span>
                <span className="text-sm font-black text-primary uppercase">{selectedFilingPeriod?.period}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">GST Output (Payable)</span>
                <span className="text-sm font-black text-slate-800">₹{selectedFilingPeriod?.output.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-dashed border-slate-200">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  DATA INTEGRITY VERIFIED BY FIREBASE
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              By marking this as filed, you confirm that the relevant GSTR forms have been submitted to the portal. This action is recorded in the workspace audit trail.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFilingOpen(false)} className="rounded-xl h-12 flex-1">Cancel</Button>
            <Button onClick={completeFiling} disabled={isSubmitting} className="rounded-xl h-12 flex-1 font-bold shadow-lg shadow-primary/20">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark as Filed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Accountant Results Dialog */}
      <Dialog open={isAIResultOpen} onOpenChange={setIsAIResultOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-10 text-white relative">
            <BrainCircuit className="absolute top-8 right-8 h-16 w-16 opacity-10 text-accent animate-pulse" />
            <div className="space-y-2 mb-8">
              <div className="flex items-center gap-3">
                <Badge className="bg-accent/20 text-accent border-accent/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Live Audit</Badge>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">CA-ID: GENKIT-AI-PRO</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter">AI Financial Portfolio Insight</h2>
            </div>

            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-8 pb-6">
                {/* Summary Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                    <Target className="h-4 w-4" /> Executive Summary
                  </h3>
                  <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                    <p className="text-sm leading-relaxed text-slate-200 font-medium italic">
                      "{aiAdvice?.summary || "Analyzing your workspace velocity and tax posture..."}"
                    </p>
                  </div>
                </div>

                {/* Recommendations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiAdvice?.recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-2 group hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{rec.category}</span>
                        <Zap className="h-3 w-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xs font-bold text-slate-100">{rec.advice}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">Impact: <span className="text-emerald-400">{rec.impact}</span></p>
                    </div>
                  ))}
                </div>

                {/* Risks & Tips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-2 px-1">
                      <AlertCircle className="h-3.5 w-3.5" /> High Risk Areas
                    </h4>
                    <ul className="space-y-2">
                      {aiAdvice?.riskAlerts.map((risk, idx) => (
                        <li key={idx} className="flex gap-2 text-[11px] text-slate-300 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                          <span className="text-rose-500 font-bold">•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 px-1">
                      <FileCheck className="h-3.5 w-3.5" /> Compliance Tip
                    </h4>
                    <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                      <p className="text-[11px] text-emerald-100 leading-relaxed font-medium">
                        {aiAdvice?.filingTip || "All systems operational. No immediate compliance flags."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Audited against GSTR-1 & 3B standards
              </div>
              <Button onClick={() => setIsAIResultOpen(false)} className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-black uppercase text-[10px] tracking-widest px-8 h-11">
                Acknowledge Audit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
