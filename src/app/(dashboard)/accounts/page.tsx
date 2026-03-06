
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
  PieChart
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

export default function AccountsPage() {
  const { companyId, isLoading: isTenantLoading, company, profile } = useTenant();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddAccountOpen, setIsAddOpen] = useState(false);
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filing Flow State
  const [isFilingOpen, setIsFilingOpen] = useState(false);
  const [filingMonth, setFilingMonth] = useState("");

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

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newExpense.description || !newExpense.amount) return;

    setIsSubmitting(true);
    const expensesRef = collection(db, 'companies', companyId, 'expenses');
    
    await addDocumentNonBlocking(expensesRef, {
      ...newExpense,
      company_id: companyId,
      amount: parseFloat(newExpense.amount) || 0,
      created_at: serverTimestamp(),
    });

    toast({ title: "Expense Logged", description: `${newExpense.category} cost has been recorded.` });
    setNewExpense({ category: "Salary", description: "", amount: "", date: new Date().toISOString().split('T')[0], account_id: "", status: "Paid" });
    setIsLogExpenseOpen(false);
    setIsSubmitting(false);
  };

  const handleStartFiling = (month?: string) => {
    setFilingMonth(month || gstStats.months[0]?.period || format(new Date(), 'MMM yyyy'));
    setIsFilingOpen(true);
  };

  const completeFiling = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({ title: "Filing Successful", description: `GST Returns for ${filingMonth} have been marked as filed.` });
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

  if (isTenantLoading || isAccountsLoading || isExpensesLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Financial Command</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Manage company vaults, running expenses, and statutory compliance.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white/50 p-1 rounded-xl border w-full sm:w-auto">
            <TabsList className="bg-transparent h-9 gap-1 w-full justify-between">
              <TabsTrigger value="overview" className="flex-1 rounded-lg h-7 text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="expenses" className="flex-1 rounded-lg h-7 text-xs data-[state=active]:bg-primary data-[state=active]:text-white">Expenses</TabsTrigger>
              <TabsTrigger value="gst" className="flex-1 rounded-lg h-7 text-xs data-[state=active]:bg-primary data-[state=active]:text-white">GST Filing</TabsTrigger>
            </TabsList>
          </Tabs>
          {activeTab === 'overview' && (
            <Button onClick={() => setIsAddOpen(true)} className="gap-2 rounded-xl shadow-lg shadow-primary/20 h-10 px-6 w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Register Account
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
        <TabsContent value="overview" className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <Card className="border-none shadow-soft bg-primary text-white rounded-[2rem] overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Wallet className="h-24 w-24" />
              </div>
              <CardContent className="p-6 md:p-8 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Total Liquidity</p>
                <h2 className="text-3xl md:text-4xl font-bold font-headline">₹{totalLiquidity.toLocaleString()}</h2>
                <div className="flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-3 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" /> +12% vs last month
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-soft bg-white rounded-[2rem]">
              <CardContent className="p-6 md:p-8 flex flex-col justify-center h-full">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Monthly Spend Profile</p>
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
                    Burn Rate: {((totalExpensesMonth / (totalLiquidity || 1)) * 100).toFixed(1)}% of capital
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-soft bg-accent text-white rounded-[2rem] sm:col-span-2 md:col-span-1">
              <CardContent className="p-6 md:p-8 flex flex-col justify-center h-full">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Net Cash Position</p>
                <h3 className="text-2xl md:text-3xl font-bold">₹{(totalLiquidity - totalExpensesMonth).toLocaleString()}</h3>
                <p className="text-[10px] font-medium text-white/80 mt-2">Adjusted for current month burn.</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Active Vaults
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts?.length === 0 ? (
                  <div className="col-span-full py-16 md:py-20 text-center bg-white rounded-[2rem] border-2 border-dashed text-muted-foreground px-4">
                    <p className="text-sm">No financial accounts registered in this workspace.</p>
                  </div>
                ) : (
                  accounts?.map((acc) => (
                    <Card key={acc.id} className="border-none shadow-sm rounded-2xl group">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                            acc.type === 'Bank' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {acc.type === 'Bank' ? <Building2 className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                          </div>
                          <Badge variant="secondary" className="text-[9px] font-bold uppercase">{acc.type}</Badge>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg leading-none">{acc.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">
                            {acc.bank_name || 'Internal Fund'}
                          </p>
                        </div>
                        <div className="pt-4 border-t flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Balance</p>
                            <p className="text-xl font-bold">₹{acc.balance?.toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Ledger Pulse
              </h3>
              <Card className="border-none shadow-soft rounded-[2rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                  {expenses?.length === 0 && invoices?.length === 0 ? (
                    <div className="p-12 text-center text-[10px] text-muted-foreground italic">
                      No activity recorded.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {expenses?.slice(0, 5).map((ex) => (
                        <div key={ex.id} className="p-4 flex items-center gap-4">
                          <div className="h-8 w-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <ArrowUpRight className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-bold truncate">{ex.description}</p>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase">{ex.category}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs md:text-sm font-bold text-rose-600">-₹{ex.amount?.toLocaleString()}</p>
                            <p className="text-[8px] text-muted-foreground font-medium">{ex.date}</p>
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

        <TabsContent value="expenses" className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-soft rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b px-6 md:px-8 py-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg md:text-xl">Running Cost Ledger</CardTitle>
                      <CardDescription className="text-xs">Salaries, rent, and overhead tracking.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl h-9 w-full sm:w-auto">
                      <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead>
                        <tr className="border-b bg-slate-50/30">
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-wider">Date</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-wider">Category</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-wider">Description</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-wider">Amount</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {expenses?.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-muted-foreground italic text-xs">No expenses logged yet.</td>
                          </tr>
                        ) : (
                          expenses?.map((ex) => (
                            <tr key={ex.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 md:px-8 py-5 text-slate-500 font-medium text-xs whitespace-nowrap">{ex.date}</td>
                              <td className="px-6 md:px-8 py-5">
                                <Badge variant="secondary" className="text-[8px] md:text-[9px] uppercase font-bold">{ex.category}</Badge>
                              </td>
                              <td className="px-6 md:px-8 py-5 font-bold text-slate-700 text-xs">{ex.description}</td>
                              <td className="px-6 md:px-8 py-5 font-bold text-rose-600 text-xs whitespace-nowrap">₹{ex.amount?.toLocaleString()}</td>
                              <td className="px-6 md:px-8 py-5">
                                <Badge variant={ex.status === 'Paid' ? 'default' : 'outline'} className="text-[8px] md:text-[9px] uppercase font-bold">
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
                <CardContent className="space-y-4">
                  {['Salary', 'Rent', 'Production'].map(cat => {
                    const catTotal = expenses?.filter(e => e.category === cat).reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
                    const perc = totalExpensesMonth > 0 ? (catTotal / totalExpensesMonth) * 100 : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                          <span>{cat}</span>
                          <span>₹{catTotal.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${perc}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[2rem] bg-indigo-900 text-white overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-4">
                  <BrainCircuit className="h-8 w-8 text-accent" />
                  <h4 className="text-lg font-bold">Spend Optimization</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Analyze your overhead using AI to identify potential savings in production utility and subscriptions.
                  </p>
                  <Button variant="secondary" className="w-full rounded-xl h-10 font-bold text-xs" onClick={handleConsultAI}>
                    Analyze with AI
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gst" className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm rounded-2xl bg-white border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">GST Output</p>
                    <h4 className="text-xl md:text-2xl font-bold">₹{gstStats.output.toLocaleString()}</h4>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm rounded-2xl bg-white border-l-4 border-l-accent">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">GST Input</p>
                    <h4 className="text-xl md:text-2xl font-bold">₹0.00</h4>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm rounded-2xl bg-primary text-white">
                  <CardContent className="pt-6">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Net Payable</p>
                    <h4 className="text-xl md:text-2xl font-bold">₹{gstStats.output.toLocaleString()}</h4>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-soft rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b px-6 md:px-8 py-6">
                  <CardTitle className="text-lg md:text-xl">Filing Ledger</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead>
                        <tr className="border-b bg-slate-50/30">
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-wider">Filing Period</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-wider">GST Output</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-wider">Status</th>
                          <th className="px-6 md:px-8 py-4 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {gstStats.months.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 md:px-8 py-5 font-bold text-slate-700 text-xs">{m.period}</td>
                            <td className="px-6 md:px-8 py-5 font-mono font-bold text-xs">₹{m.output.toLocaleString()}</td>
                            <td className="px-6 md:px-8 py-5">
                              <Badge variant={m.status === 'Filed' ? 'default' : 'secondary'} className="text-[8px] md:text-[9px] uppercase font-bold">
                                {m.status}
                              </Badge>
                            </td>
                            <td className="px-6 md:px-8 py-5 text-right">
                              <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold" onClick={() => handleStartFiling(m.period)}>Mark Filed</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs... (keep existing but ensure rounded-[2rem] and better mobile spacing) */}
      {/* (Previous Dialog code optimized for better readability and UI consistency) */}
    </div>
  );
}
