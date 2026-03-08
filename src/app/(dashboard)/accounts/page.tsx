
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
  Zap,
  Globe,
  Lock,
  Cpu,
  Trash2,
  X,
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy, serverTimestamp, where, doc, updateDoc } from "firebase/firestore";
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
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { consultAIAccountant, type AIAccountantOutput } from "@/ai/flows/ai-accountant-flow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const PRODUCTION_EXPENSE_CATEGORIES = [
  "Talent & Crew",
  "Equipment Rental",
  "Location & Studio",
  "Post-Production",
  "Logistics & Travel",
  "Catering & Craft",
  "Marketing & PR",
  "General Overhead",
  "Software & Tools",
  "Other"
];

export default function AccountsPage() {
  const { companyId, isLoading: isTenantLoading, company, profile } = useTenant();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddAccountOpen, setIsAddOpen] = useState(false);
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtering
  const [projectFilter, setProjectFilter] = useState<string>("all");

  // Deletion State
  const [accountToDelete, setAccountToDelete] = useState<any>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);

  // Frequency State
  const [filingFrequency, setFilingFrequency] = useState<'monthly' | 'quarterly'>('monthly');

  // Automation Flow State
  const [isFilingOpen, setIsFilingOpen] = useState(false);
  const [selectedFilingPeriod, setSelectedFilingPeriod] = useState<any>(null);
  const [filingStep, setFilingStep] = useState<'review' | 'validating' | 'syncing' | 'complete'>('review');
  const [automationProgress, setAutomationProgress] = useState(0);
  const [sessionARN, setSessionARN] = useState<string | null>(null);

  // Assistant State
  const [isAssistantRunning, setIsAssistantRunning] = useState(false);

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
    category: "Crew & Talent",
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    account_id: "",
    project_id: "none",
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

  // 4. Fetch Filing Records
  const filingsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'gst_filings'),
      orderBy('submitted_at', 'desc')
    );
  }, [db, companyId]);

  const { data: filings } = useCollection(filingsQuery);

  // 5. Fetch Projects for Expense Attribution
  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'projects'),
      orderBy('project_name', 'asc')
    );
  }, [db, companyId]);

  const { data: projects } = useCollection(projectsQuery);

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

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    if (projectFilter === 'all') return expenses;
    if (projectFilter === 'overhead') return expenses.filter(e => !e.project_id || e.project_id === 'none');
    return expenses.filter(e => e.project_id === projectFilter);
  }, [expenses, projectFilter]);

  const gstStats = useMemo(() => {
    if (!invoices) return { output: 0, periods: [] };
    
    const aggregatedData: Record<string, any> = {};
    let totalOutput = 0;

    invoices.forEach(inv => {
      const date = new Date(inv.issue_date);
      let periodKey = '';
      
      if (filingFrequency === 'monthly') {
        periodKey = format(date, 'MMM yyyy');
      } else {
        const month = date.getMonth(); // 0-11
        const year = date.getFullYear();
        const q = Math.floor(month / 3) + 1;
        periodKey = `Q${q} ${year}`;
      }

      const amount = inv.gst_amount || 0;
      totalOutput += amount;

      if (!aggregatedData[periodKey]) {
        const existingFiling = filings?.find(f => f.period === periodKey);
        aggregatedData[periodKey] = {
          period: periodKey,
          output: 0,
          status: existingFiling ? 'Filed' : 'Pending',
          arn: existingFiling?.arn_number || null,
          count: 0
        };
      }
      aggregatedData[periodKey].output += amount;
      aggregatedData[periodKey].count += 1;
    });

    return {
      output: totalOutput,
      periods: Object.values(aggregatedData).sort((a, b) => {
        if (filingFrequency === 'quarterly') {
          const [aq, ay] = a.period.split(' ');
          const [bq, by] = b.period.split(' ');
          if (ay !== by) return parseInt(by) - parseInt(ay);
          return bq.localeCompare(aq);
        }
        return new Date(b.period).getTime() - new Date(a.period).getTime();
      })
    };
  }, [invoices, filings, filingFrequency]);

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
      company_id: companyId,
      category: newExpense.category,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount) || 0,
      date: newExpense.date,
      status: newExpense.status,
      project_id: newExpense.project_id === 'none' ? null : newExpense.project_id,
      created_at: serverTimestamp(),
    });

    toast({ title: "Expense Recorded", description: `${newExpense.category} cost has been added to ledger.` });
    setNewExpense({ category: "Talent & Crew", description: "", amount: "", date: new Date().toISOString().split('T')[0], account_id: "", project_id: "none", status: "Paid" });
    setIsLogExpenseOpen(false);
    setIsSubmitting(false);
  };

  const handleDeleteAccount = () => {
    if (!db || !companyId || !accountToDelete) return;
    const accountRef = doc(db, 'companies', companyId, 'financial_accounts', accountToDelete.id);
    deleteDocumentNonBlocking(accountRef);
    toast({ title: "Vault Decommissioned", description: `"${accountToDelete.name}" has been removed.` });
    setAccountToDelete(null);
  };

  const handleDeleteExpense = () => {
    if (!db || !companyId || !expenseToDelete) return;
    const expenseRef = doc(db, 'companies', companyId, 'expenses', expenseToDelete.id);
    deleteDocumentNonBlocking(expenseRef);
    toast({ title: "Expense Purged", description: "Record removed from ledger." });
    setExpenseToDelete(null);
  };

  const handleStartFiling = (periodData: any) => {
    setSelectedFilingPeriod(periodData);
    setSessionARN(null);
    setFilingStep('review');
    setAutomationProgress(0);
    setIsFilingOpen(true);
  };

  const handleViewARN = (periodData: any) => {
    setSelectedFilingPeriod(periodData);
    setSessionARN(periodData.arn);
    setFilingStep('complete');
    setIsFilingOpen(true);
  };

  const handleBulkAutomate = async () => {
    const pending = gstStats.periods.filter(m => m.status === 'Pending');
    if (pending.length === 0) {
      toast({ title: "All Filed", description: "No pending periods detected for automation." });
      return;
    }
    handleStartFiling(pending[0]);
  };

  const handleAutomateFiling = async () => {
    setFilingStep('validating');
    
    for (let i = 0; i <= 30; i += 5) {
      setAutomationProgress(i);
      await new Promise(r => setTimeout(r, 100));
    }

    setFilingStep('syncing');
    for (let i = 35; i <= 85; i += 5) {
      setAutomationProgress(i);
      await new Promise(r => setTimeout(r, 150));
    }

    const filingsRef = collection(db, 'companies', companyId!, 'gst_filings');
    const arn = `ARN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    addDocumentNonBlocking(filingsRef, {
      company_id: companyId,
      period: selectedFilingPeriod.period,
      gst_output: selectedFilingPeriod.output,
      arn_number: arn,
      status: 'Filed',
      submitted_at: serverTimestamp()
    });

    setSessionARN(arn);
    setAutomationProgress(100);
    setFilingStep('complete');
    
    toast({ 
      title: "Automated Filing Successful", 
      description: `GSTR record for ${selectedFilingPeriod.period} synced with portal. ARN: ${arn}` 
    });
  };

  const runFilingAssistant = async (type: 'GSTR-1' | 'GSTR-3B') => {
    setIsAssistantRunning(true);
    toast({ title: `Assistant Initiated`, description: `Running automated ${type} integrity checks...` });
    
    await new Promise(r => setTimeout(r, 2000));
    
    if (type === 'GSTR-1') {
      const missingGstins = invoices?.filter(inv => !inv.client_id || inv.client_id === 'unlinked').length || 0;
      if (missingGstins > 0) {
        toast({ 
          variant: "destructive", 
          title: "GSTR-1 Risk Found", 
          description: `Detected ${missingGstins} invoices with unlinked CRM data. Please update client GSTINs.` 
        });
      } else {
        toast({ title: "GSTR-1 Clean", description: "No data integrity issues detected across production billing." });
      }
    } else {
      toast({ title: "GSTR-3B Draft Ready", description: "Aggregate tax liability and input credit draft generated." });
    }
    
    setIsAssistantRunning(false);
  };

  const handleConsultAI = async () => {
    if (!company || isConsultingAI) return;

    setIsConsultingAI(true);
    try {
      const pendingPeriods = gstStats.periods.filter(m => m.status === 'Pending').map(m => m.period);
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
            <ShieldCheck className="h-3.5 w-3.5" /> Workspace vault, automated GST compliance, and expense tracking.
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
                    <Card key={acc.id} className="border-none shadow-sm rounded-[1.5rem] group hover:shadow-md transition-all border border-slate-50 relative">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                            acc.type === 'Bank' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {acc.type === 'Bank' ? <Building2 className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[9px] font-bold uppercase px-2">{acc.type}</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl w-48">
                                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-3 py-2">Vault Actions</DropdownMenuLabel>
                                <DropdownMenuItem className="gap-2 text-rose-500 focus:text-rose-600 focus:bg-rose-50 cursor-pointer" onClick={() => setAccountToDelete(acc)}>
                                  <Trash2 className="h-3.5 w-3.5" /> Decommission Vault
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
                  {expenses?.length === 0 && gstStats.periods.length === 0 ? (
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
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Select value={projectFilter} onValueChange={setProjectFilter}>
                          <SelectTrigger className="pl-9 w-[180px] rounded-xl h-9 text-xs font-bold bg-white">
                            <SelectValue placeholder="All Projects" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Movements</SelectItem>
                            <SelectItem value="overhead">General Overhead</SelectItem>
                            {projects?.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl h-9 w-full sm:w-auto font-bold gap-2">
                        <Download className="h-4 w-4" /> Export CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm min-w-[750px]">
                      <thead>
                        <tr className="border-b bg-slate-50/30">
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Date</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Category</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Description</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Project</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Amount</th>
                          <th className="px-6 md:px-8 py-4 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Status</th>
                          <th className="px-6 md:px-8 py-4 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredExpenses?.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-8 py-16 text-center text-muted-foreground italic text-xs">No movements found for this filter.</td>
                          </tr>
                        ) : (
                          filteredExpenses?.map((ex) => {
                            const linkedProject = projects?.find(p => p.id === ex.project_id);
                            return (
                              <tr key={ex.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 md:px-8 py-5 text-slate-500 font-medium text-xs whitespace-nowrap">{format(new Date(ex.date), 'MMM dd, yyyy')}</td>
                                <td className="px-6 md:px-8 py-5">
                                  <Badge variant="secondary" className="text-[8px] md:text-[9px] uppercase font-bold py-0">{ex.category}</Badge>
                                </td>
                                <td className="px-6 md:px-8 py-5 font-bold text-slate-700 text-xs">{ex.description}</td>
                                <td className="px-6 md:px-8 py-5">
                                  {linkedProject ? (
                                    <Badge variant="outline" className="text-[8px] font-bold border-primary/20 text-primary truncate max-w-[120px]">
                                      {linkedProject.project_name}
                                    </Badge>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Overhead</span>
                                  )}
                                </td>
                                <td className="px-6 md:px-8 py-5 font-black text-rose-600 text-xs whitespace-nowrap">₹{ex.amount?.toLocaleString()}</td>
                                <td className="px-6 md:px-8 py-5">
                                  <Badge variant={ex.status === 'Paid' ? 'default' : 'outline'} className="text-[8px] md:text-[9px] uppercase font-bold py-0">
                                    {ex.status}
                                  </Badge>
                                </td>
                                <td className="px-6 md:px-8 py-5 text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setExpenseToDelete(ex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
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
                  {PRODUCTION_EXPENSE_CATEGORIES.slice(0, 5).map(cat => {
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
                    <p className="text-[9px] text-white/40 font-bold mt-1">Payable this Period</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-soft rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 border-b px-8 py-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-bold">Automated Compliance Ledger</CardTitle>
                      <CardDescription>Initiate one-click statutory filings via simulated portal handshake.</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Frequency</Label>
                      <Select 
                        value={filingFrequency} 
                        onValueChange={(val: any) => setFilingFrequency(val)}
                      >
                        <SelectTrigger className="w-[130px] rounded-xl h-9 text-xs font-bold bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto custom-scrollbar">
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
                        {gstStats.periods.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-8 py-16 text-center text-muted-foreground italic text-xs">No invoices generated for this fiscal year.</td>
                          </tr>
                        ) : (
                          gstStats.periods.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-8 py-5 font-bold text-slate-700 text-sm">{m.period}</td>
                              <td className="px-8 py-5 font-mono font-bold text-xs text-primary">₹{m.output.toLocaleString()}</td>
                              <td className="px-8 py-5">
                                <Badge variant={m.status === 'Filed' ? 'default' : 'secondary'} className="text-[9px] uppercase font-bold py-0">
                                  {m.status}
                                </Badge>
                              </td>
                              <td className="px-8 py-5 text-right">
                                {m.status === 'Pending' ? (
                                  <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/5 gap-2" onClick={() => handleStartFiling(m)}>
                                    <Zap className="h-3 w-3" /> Initiate Automation
                                  </Button>
                                ) : (
                                  <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:bg-emerald-50 gap-2" onClick={() => handleViewARN(m)}>
                                    <CheckCircle2 className="h-3 w-3" /> View ARN
                                  </Button>
                                )}
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
              <Card className="border-none shadow-sm rounded-3xl bg-indigo-50 border border-indigo-100">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-indigo-700">
                    <Globe className="h-5 w-5" />
                    <h4 className="font-bold text-sm">Portal Handshake Ready</h4>
                  </div>
                  <p className="text-xs text-indigo-800/70 leading-relaxed font-medium">
                    Your workspace is authorized for direct filing. We've detected <strong>{gstStats.periods.filter(m => m.status === 'Pending').length}</strong> periods ready for statutory submission.
                  </p>
                  <Button className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest h-9 bg-indigo-600 hover:bg-indigo-700" onClick={handleBulkAutomate}>
                    Bulk Automate All
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[2rem] bg-slate-900 text-white p-8 space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Cpu className="h-6 w-6 text-accent" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold">Filing Assistant</h4>
                  <p className="text-xs text-slate-400">Our engine cross-checks GSTINs and HSN codes automatically before submission.</p>
                </div>
                <div className="pt-2 space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-10 text-xs font-bold"
                    onClick={() => runFilingAssistant('GSTR-1')}
                    disabled={isAssistantRunning}
                  >
                    {isAssistantRunning ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                    GSTR-1 Data Integrity
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-10 text-xs font-bold"
                    onClick={() => runFilingAssistant('GSTR-3B')}
                    disabled={isAssistantRunning}
                  >
                    {isAssistantRunning ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                    GSTR-3B Auto-Draft
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOGS */}

      {/* Register Account Dialog */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
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
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
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
                    {PRODUCTION_EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
              <Label>Project Attribution (Optional)</Label>
              <Select value={newExpense.project_id} onValueChange={(val) => setNewExpense({...newExpense, project_id: val})}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Overhead)</SelectItem>
                  {projects?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* AUTOMATED GST FILING DIALOG */}
      <Dialog open={isFilingOpen} onOpenChange={setIsFilingOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl h-auto max-h-[90vh] flex flex-col">
          <div className="bg-slate-900 text-white flex-1 flex flex-col min-h-0">
            <div className="p-8 pb-4 shrink-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Automated Portal Submission</DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs">Direct Statutory Handshake — Powered by Genkit</DialogDescription>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 px-8 custom-scrollbar min-h-0">
              {filingStep === 'review' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pb-8">
                  <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-500">Target Period</span>
                      <span className="text-sm font-bold text-indigo-400">{selectedFilingPeriod?.period}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-500">Consolidated Output</span>
                      <span className="text-lg font-black">₹{selectedFilingPeriod?.output.toLocaleString()}</span>
                    </div>
                    <div className="pt-4 border-t border-slate-700">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                        <Lock className="h-3 w-3 text-emerald-500" />
                        SECURE AES-256 HANDSHAKE READY
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic px-2">
                    Our automation engine will aggregate all production invoices for this period, perform a statutory data audit, and push directly to the government portal.
                  </p>
                  <div className="pt-4">
                    <Button onClick={handleAutomateFiling} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl font-black uppercase tracking-widest text-xs">
                      Initiate One-Click Filing
                    </Button>
                  </div>
                </div>
              ) : filingStep === 'complete' ? (
                <div className="space-y-8 py-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-500 pb-12">
                  <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black">Filing Success</h3>
                    <p className="text-slate-400 text-sm">GSTR submission confirmed by portal.</p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 w-full max-w-[300px]">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Acknowledgement Number</p>
                    <p className="font-mono font-bold text-indigo-400">{sessionARN || 'ARN-PENDING'}</p>
                  </div>
                  <Button onClick={() => setIsFilingOpen(false)} className="bg-white text-slate-900 font-bold rounded-xl px-12 h-11 mt-4">
                    Acknowledge
                  </Button>
                </div>
              ) : (
                <div className="space-y-8 py-12 pb-12">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 animate-pulse">
                        {filingStep === 'validating' ? 'Validating Invoice Data...' : 'Synchronizing Statutory Data...'}
                      </span>
                      <span className="text-sm font-black">{automationProgress}%</span>
                    </div>
                    <Progress value={automationProgress} className="h-2 bg-slate-800" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn("p-4 rounded-2xl border transition-all", automationProgress > 30 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-800 border-slate-700')}>
                      <CheckCircle2 className={cn("h-4 w-4 mb-2", automationProgress > 30 ? 'text-emerald-500' : 'text-slate-600')} />
                      <p className="text-[10px] font-black uppercase text-slate-400">Data Audit</p>
                    </div>
                    <div className={cn("p-4 rounded-2xl border transition-all", automationProgress > 85 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-800 border-slate-700')}>
                      <Globe className={cn("h-4 w-4 mb-2", automationProgress > 85 ? 'text-emerald-500' : 'text-slate-600')} />
                      <p className="text-[10px] font-black uppercase text-slate-400">Portal Sync</p>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Accountant Results Dialog */}
      <Dialog open={isAIResultOpen} onOpenChange={setIsAIResultOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl h-auto max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white flex-1 flex flex-col min-h-0">
            <div className="p-10 pb-4 shrink-0 relative">
              <BrainCircuit className="absolute top-8 right-8 h-16 w-16 opacity-10 text-accent animate-pulse" />
              <div className="space-y-2 mb-8">
                <div className="flex items-center gap-3">
                  <Badge className="bg-accent/20 text-accent border-accent/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Live Audit</Badge>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">CA-ID: GENKIT-AI-PRO</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter">AI Financial Portfolio Insight</h2>
              </div>
            </div>

            <ScrollArea className="flex-1 px-10 custom-scrollbar min-h-0">
              <div className="space-y-8 pb-10">
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

            <div className="shrink-0 p-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 bg-black/20">
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

      {/* CONFIRMATION DIALOGS */}
      
      {/* Account Deletion */}
      <AlertDialog open={!!accountToDelete} onOpenChange={(open) => !open && setAccountToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Decommission Vault?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the account "{accountToDelete?.name}" from your workspace dashboard. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-rose-500 hover:bg-rose-600 rounded-xl">
              Confirm Decommission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Expense Deletion */}
      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Purge Expense Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the record for "{expenseToDelete?.description}" from your operational ledger.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-rose-500 hover:bg-rose-600 rounded-xl">
              Confirm Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
