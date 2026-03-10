
"use client";

import { use, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Video, 
  FileText, 
  LayoutGrid,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Users,
  Camera,
  Scissors,
  Target,
  UserPlus,
  Rocket,
  Sparkles,
  Trash2,
  Package,
  Box,
  Monitor,
  Check,
  Receipt,
  ExternalLink,
  Download,
  PieChart as PieChartIcon,
  ArrowUpRight,
  TrendingDown,
  Info,
  ListTree,
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/hooks/use-tenant";
import { useDoc, useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, where, orderBy, doc, serverTimestamp } from "firebase/firestore";
import { updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { PRODUCTION_CATEGORIES_MAP } from "../../accounts/page";

export default function ProjectWorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { companyId, isLoading: isTenantLoading } = useTenant();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState("pre-prod");
  
  // Add Objective Dialog State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", assignedTo: "" });

  // Add Asset Dialog State
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: "", category: "Equipment", status: "available" });

  // Add Expense Dialog State
  const [isLogExpenseOpen, setIsLogExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: "Talent & Crew",
    sub_category: "Director",
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    status: "Paid"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [assetToDelete, setAssetToDelete] = useState<any>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);

  // 1. Project Details
  const projectRef = useMemoFirebase(() => {
    if (!db || !companyId || !projectId) return null;
    return doc(db, 'companies', companyId, 'projects', projectId);
  }, [db, companyId, projectId]);

  const { data: project, isLoading: isProjectLoading } = useDoc(projectRef);

  // 2. Tasks
  const tasksQuery = useMemoFirebase(() => {
    if (!db || !companyId || !projectId) return null;
    return query(
      collection(db, 'companies', companyId, 'projects', projectId, 'tasks'),
      orderBy('created_at', 'asc')
    );
  }, [db, companyId, projectId]);

  const { data: tasks, isLoading: isTasksLoading } = useCollection(tasksQuery);

  // 3. Assets
  const assetsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !projectId) return null;
    return query(
      collection(db, 'companies', companyId, 'projects', projectId, 'items'),
      orderBy('created_at', 'desc')
    );
  }, [db, companyId, projectId]);

  const { data: assets, isLoading: isAssetsLoading } = useCollection(assetsQuery);

  // 4. Production Days
  const shootDaysQuery = useMemoFirebase(() => {
    if (!db || !companyId || !projectId) return null;
    return query(
      collection(db, 'companies', companyId, 'projects', projectId, 'production_days'),
      orderBy('date', 'asc')
    );
  }, [db, companyId, projectId]);

  const { data: shootDays, isLoading: isShootDaysLoading } = useCollection(shootDaysQuery);

  // 5. Invoices
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !projectId) return null;
    return query(
      collection(db, 'companies', companyId, 'invoices'),
      where('project_id', '==', projectId),
      orderBy('created_at', 'desc')
    );
  }, [db, companyId, projectId]);

  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  // 6. Project Expenses
  const projectExpensesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !projectId) return null;
    return query(
      collection(db, 'companies', companyId, 'expenses'),
      where('project_id', '==', projectId),
      orderBy('date', 'desc')
    );
  }, [db, companyId, projectId]);

  const { data: projectExpenses, isLoading: isProjectExpensesLoading } = useCollection(projectExpensesQuery);

  // --- DERIVED CALCULATIONS ---

  const liveProgress = useMemo(() => {
    if (!tasks || tasks.length === 0) return project?.progress || 0;
    const corePhases = ['pre-prod', 'production', 'post-prod', 'release'];
    const productionTasks = tasks.filter(t => corePhases.includes(t.phase));
    if (productionTasks.length === 0) return 0;
    const completedCount = productionTasks.filter(t => t.status === 'done').length;
    return Math.round((completedCount / productionTasks.length) * 100);
  }, [tasks, project?.progress]);

  const totalBilled = useMemo(() => invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0, [invoices]);
  const totalRevenueBase = useMemo(() => invoices?.reduce((sum, inv) => sum + (inv.subtotal || 0), 0) || 0, [invoices]);
  const totalOutstanding = useMemo(() => invoices?.reduce((sum, inv) => inv.payment_status !== 'paid' ? sum + (inv.total || 0) : sum, 0) || 0, [invoices]);
  const totalExpenses = useMemo(() => projectExpenses?.reduce((sum, ex) => sum + (ex.amount || 0), 0) || 0, [projectExpenses]);
  const netProfit = totalRevenueBase - totalExpenses;
  const profitMargin = totalRevenueBase > 0 ? (netProfit / totalRevenueBase) * 100 : 0;

  // --- ACTIONS ---

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    if (!db || !companyId || !projectId) return;
    const taskRef = doc(db, 'companies', companyId, 'projects', projectId, 'tasks', taskId);
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    updateDocumentNonBlocking(taskRef, { status: newStatus, updatedAt: serverTimestamp() });
    if (projectRef) updateDocumentNonBlocking(projectRef, { progress: liveProgress });
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !companyId || !projectId || !newTask.title) return;
    setIsSubmitting(true);
    const tasksRef = collection(db, 'companies', companyId, 'projects', projectId, 'tasks');
    addDocumentNonBlocking(tasksRef, {
      company_id: companyId,
      project_id: projectId,
      title: newTask.title,
      phase: activeTab === 'assets' || activeTab === 'finances' ? 'production' : activeTab,
      assignedTo: newTask.assignedTo || "Producer",
      status: 'todo',
      priority: 'Medium',
      created_at: serverTimestamp()
    });
    setIsAddTaskOpen(false);
    setNewTask({ title: "", assignedTo: "" });
    setIsSubmitting(false);
  };

  const handleSeedPhase = (phase: string) => {
    if (!db || !companyId || !projectId) return;
    const defaults: Record<string, string[]> = {
      'pre-prod': ['Script Finalization', 'Location Scouting', 'Casting Call', 'Storyboard Review'],
      'production': ['Main Shoot Day 1', 'Main Shoot Day 2', 'B-Roll Capture', 'Audio Recording'],
      'post-prod': ['Initial Assembly', 'Color Correction', 'Sound Design', 'VFX Review'],
      'release': ['Master Export', 'Client Approval Sign-off', 'Social Media Teasers', 'Public Launch']
    };
    const tasksRef = collection(db, 'companies', companyId, 'projects', projectId, 'tasks');
    const objectives = defaults[phase] || [];
    objectives.forEach((title, idx) => {
      addDocumentNonBlocking(tasksRef, {
        company_id: companyId,
        project_id: projectId,
        title,
        phase,
        assignedTo: 'Producer',
        status: 'todo',
        priority: idx === 0 ? 'High' : 'Medium',
        created_at: serverTimestamp()
      });
    });
    toast({ title: "Roadmap Initialized", description: `Added objectives for ${phase.replace('-', ' ')}.` });
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !companyId || !projectId || !newAsset.name) return;
    setIsSubmitting(true);
    const assetsRef = collection(db, 'companies', companyId, 'projects', projectId, 'items');
    addDocumentNonBlocking(assetsRef, {
      ...newAsset,
      company_id: companyId,
      project_id: projectId,
      created_at: serverTimestamp(),
    });
    setIsAddAssetOpen(false);
    setNewAsset({ name: "", category: "Equipment", status: "available" });
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
      sub_category: newExpense.sub_category,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount) || 0,
      date: newExpense.date,
      status: newExpense.status,
      project_id: projectId,
      created_at: serverTimestamp(),
    });
    setNewExpense({ category: "Talent & Crew", sub_category: "Director", description: "", amount: "", date: new Date().toISOString().split('T')[0], status: "Paid" });
    setIsLogExpenseOpen(false);
    setIsSubmitting(false);
  };

  const handleConfirmDeleteTask = () => {
    if (!db || !companyId || !projectId || !taskToDelete) return;
    deleteDocumentNonBlocking(doc(db, 'companies', companyId, 'projects', projectId, 'tasks', taskToDelete.id));
    setTaskToDelete(null);
  };

  const handleConfirmDeleteAsset = () => {
    if (!db || !companyId || !projectId || !assetToDelete) return;
    deleteDocumentNonBlocking(doc(db, 'companies', companyId, 'projects', projectId, 'items', assetToDelete.id));
    setAssetToDelete(null);
  };

  const handleConfirmDeleteExpense = () => {
    if (!db || !companyId || !expenseToDelete) return;
    deleteDocumentNonBlocking(doc(db, 'companies', companyId, 'expenses', expenseToDelete.id));
    setExpenseToDelete(null);
  };

  const handleUpdateAssetStatus = (assetId: string, newStatus: string) => {
    if (!db || !companyId || !projectId) return;
    updateDocumentNonBlocking(doc(db, 'companies', companyId, 'projects', projectId, 'items', assetId), { status: newStatus, updatedAt: serverTimestamp() });
  };

  if (isTenantLoading || isProjectLoading || isTasksLoading || isAssetsLoading || isShootDaysLoading || isInvoicesLoading || isProjectExpensesLoading) {
    return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Workspace not found</h2>
        <Link href="/projects"><Button variant="link">Back to Pipeline</Button></Link>
      </div>
    );
  }

  const phaseTasks = (phase: string) => tasks?.filter(t => t.phase === phase) || [];
  const completedPhaseTasks = (phase: string) => phaseTasks(phase).filter(t => t.status === 'done').length;
  const phaseProgress = (phase: string) => {
    const pt = phaseTasks(phase);
    return pt.length > 0 ? Math.round((completedPhaseTasks(phase) / pt.length) * 100) : 0;
  };

  const getPhaseIcon = (phase: string) => {
    switch(phase) {
      case 'pre-prod': return <FileText className="h-4 w-4" />;
      case 'production': return <Camera className="h-4 w-4" />;
      case 'post-prod': return <Scissors className="h-4 w-4" />;
      case 'release': return <Rocket className="h-4 w-4" />;
      case 'assets': return <Package className="h-4 w-4" />;
      case 'finances': return <Receipt className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon" className="rounded-xl bg-white shadow-sm border border-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-primary">{project.project_name}</h1>
              <Badge variant="secondary" className="rounded-full bg-white font-bold text-[10px] uppercase">{project.status}</Badge>
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              Client: <span className="font-bold text-slate-700">{project.client_name}</span>
              <span className="opacity-20">•</span>
              Reference: <span className="font-mono text-[10px] uppercase bg-slate-100 px-1.5 rounded">{projectId.slice(0,8)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase text-primary/60 tracking-[0.2em] mb-1.5">Total Production Velocity</p>
            <div className="flex items-center gap-3">
              <Progress value={liveProgress} className="w-40 h-2 bg-primary/10" />
              <span className="text-sm font-black text-primary">{liveProgress}%</span>
            </div>
          </div>
          <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20 h-11" onClick={() => activeTab === 'assets' ? setIsAddAssetOpen(true) : (activeTab === 'finances' ? setIsLogExpenseOpen(true) : setIsAddTaskOpen(true))}>
            <Plus className="h-4 w-4" /> {activeTab === 'assets' ? 'Register Item' : (activeTab === 'finances' ? 'Log Project Cost' : 'Add Objective')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Project Budget</span>
            </div>
            <h4 className="text-2xl font-bold">₹{project.budget?.toLocaleString() || '0'}</h4>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl border-l-4 border-l-rose-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-rose-500 mb-2">
              <TrendingDown className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Current Burn</span>
            </div>
            <h4 className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</h4>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Final Deadline</span>
            </div>
            <h4 className="text-xl font-bold">{project.deadline || 'TBD'}</h4>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Objectives Met</span>
            </div>
            <h4 className="text-2xl font-bold">{tasks?.filter(t => t.status === 'done').length || 0}/{tasks?.length || 0}</h4>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/50 border p-1 rounded-2xl h-auto flex-wrap mb-8">
          {["pre-prod", "production", "post-prod", "release", "assets", "finances"].map(tab => (
            <TabsTrigger key={tab} value={tab} className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest capitalize">
              {getPhaseIcon(tab)} {tab.replace('-', ' ')}
            </TabsTrigger>
          ))}
        </TabsList>

        {["pre-prod", "production", "post-prod", "release"].map((phase) => (
          <TabsContent key={phase} value={phase} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                  <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between border-b px-8 py-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">{getPhaseIcon(phase)}</div>
                        <CardTitle className="text-xl capitalize">{phase.replace('-', ' ')} Objectives</CardTitle>
                      </div>
                      <CardDescription>Assign and track key deliverables for this phase.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setIsAddTaskOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Add Objective
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {phaseTasks(phase).length === 0 ? (
                      <div className="text-center py-24 text-muted-foreground space-y-4">
                        <Target className="h-12 w-12 mx-auto opacity-10" />
                        <p className="text-sm font-medium">No objectives registered for this production phase.</p>
                        <Button variant="link" size="sm" onClick={() => handleSeedPhase(phase)}>Setup {phase.replace('-', ' ')} roadmap</Button>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {phaseTasks(phase).map((task) => (
                          <div key={task.id} className="flex items-center gap-4 px-8 py-5 hover:bg-slate-50 transition-colors group">
                            <Checkbox 
                              checked={task.status === 'done'} 
                              onCheckedChange={() => handleToggleTask(task.id, task.status)}
                              className="h-5 w-5 rounded-md border-2 border-primary data-[state=checked]:bg-primary"
                            />
                            <div className="flex-1">
                              <p className={`font-bold text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-slate-800'}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <Badge variant="outline" className="text-[8px] uppercase font-bold text-muted-foreground border-slate-200">{task.priority || 'Medium'}</Badge>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Users className="h-3 w-3" /> <span className="font-bold text-primary/80 ml-0.5">{task.assignedTo || 'Unassigned'}</span>
                                </span>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl w-48">
                                <DropdownMenuItem className="cursor-pointer gap-2 py-2" onClick={() => handleToggleTask(task.id, task.status)}>
                                  {task.status === 'done' ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />} Mark as {task.status === 'done' ? 'Pending' : 'Completed'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer gap-2 py-2 text-rose-500" onClick={() => setTaskToDelete(task)}>
                                  <Trash2 className="h-4 w-4" /> Delete Objective
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card className="border-none shadow-sm bg-primary text-white rounded-[2rem]">
                  <CardContent className="p-8 space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md"><LayoutGrid className="h-6 w-6" /></div>
                    <h4 className="text-xl font-bold">Phase Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-white/60">
                        <span>Checklist Completion</span>
                        <span>{phaseProgress(phase)}%</span>
                      </div>
                      <Progress value={phaseProgress(phase)} className="h-1 bg-white/10" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}

        <TabsContent value="assets" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between border-b px-8 py-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Package className="h-4 w-4" /></div>
                      <CardTitle className="text-xl">Project Items & Inventory</CardTitle>
                    </div>
                    <CardDescription>Track equipment, props, and media storage devices.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setIsAddAssetOpen(true)}><Plus className="h-4 w-4 mr-2" /> Register Item</Button>
                </CardHeader>
                <CardContent className="p-0">
                  {assets?.length === 0 ? (
                    <div className="text-center py-24 text-muted-foreground"><Box className="h-12 w-12 mx-auto opacity-10" /><p className="text-sm font-medium mt-4">No items registered.</p></div>
                  ) : (
                    <div className="divide-y">
                      {assets?.map((asset) => (
                        <div key={asset.id} className="flex items-center gap-4 px-8 py-5 hover:bg-slate-50 transition-colors group">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${asset.status === 'available' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {asset.category === 'Equipment' ? <Camera className="h-5 w-5" /> : asset.category === 'Digital' ? <Monitor className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-slate-800">{asset.name}</p>
                            <Badge variant="outline" className="text-[8px] uppercase font-bold mt-1">{asset.category}</Badge>
                          </div>
                          <Badge className={`uppercase text-[9px] font-bold ${asset.status === 'available' ? 'bg-emerald-500' : 'bg-rose-500'}`}>{asset.status.replace('_', ' ')}</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem onClick={() => handleUpdateAssetStatus(asset.id, 'available')}>Available</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateAssetStatus(asset.id, 'checked_out')}>Checked Out</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-rose-500" onClick={() => setAssetToDelete(asset)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="finances" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-soft bg-white rounded-[2rem] border-l-4 border-l-primary">
              <CardContent className="p-8">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Gross Revenue</p>
                <h3 className="text-3xl font-black">₹{totalRevenueBase.toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className="border-none shadow-soft bg-white rounded-[2rem] border-l-4 border-l-rose-500">
              <CardContent className="p-8">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Production Burn</p>
                <h3 className="text-3xl font-black">₹{totalExpenses.toLocaleString()}</h3>
              </CardContent>
            </Card>
            <Card className={cn("border-none shadow-soft rounded-[2rem] text-white border-l-4", netProfit >= 0 ? "bg-emerald-600 border-l-emerald-400" : "bg-rose-600 border-l-rose-400")}>
              <CardContent className="p-8">
                <p className="text-[10px] font-bold uppercase text-white/60 tracking-widest mb-1">Net Performance</p>
                <h3 className="text-3xl font-black">₹{netProfit.toLocaleString()}</h3>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="rounded-[2rem]">
          <DialogHeader><DialogTitle>New Objective</DialogTitle></DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required className="rounded-xl" /></div>
            <div className="space-y-2"><Label>Assign To</Label><Input value={newTask.assignedTo} onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })} className="rounded-xl" /></div>
            <DialogFooter><Button type="submit" disabled={isSubmitting} className="w-full rounded-xl">Register Objective</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
        <DialogContent className="rounded-[2rem]">
          <DialogHeader><DialogTitle>Register Item</DialogTitle></DialogHeader>
          <form onSubmit={handleAddAsset} className="space-y-4 py-4">
            <div className="space-y-2"><Label>Name</Label><Input value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} required className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-4">
              <Select onValueChange={(v) => setNewAsset({...newAsset, category: v})} defaultValue="Equipment"><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Equipment">Equipment</SelectItem><SelectItem value="Digital">Digital</SelectItem></SelectContent></Select>
              <Select onValueChange={(v) => setNewAsset({...newAsset, status: v})} defaultValue="available"><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="checked_out">Checked Out</SelectItem></SelectContent></Select>
            </div>
            <DialogFooter><Button type="submit" disabled={isSubmitting} className="w-full rounded-xl">Add to Project</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isLogExpenseOpen} onOpenChange={setIsLogExpenseOpen}>
        <DialogContent className="rounded-[2.5rem]">
          <DialogHeader><DialogTitle>Log Project Cost</DialogTitle></DialogHeader>
          <form onSubmit={handleLogExpense} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Select value={newExpense.category} onValueChange={(v) => setNewExpense({...newExpense, category: v})}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(PRODUCTION_CATEGORIES_MAP).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              <Input type="number" placeholder="Amount" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} required className="rounded-xl" />
            </div>
            <Input placeholder="Description" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} required className="rounded-xl" />
            <Input type="date" value={newExpense.date} onChange={(e) => setNewExpense({...newExpense, date: e.target.value})} className="rounded-xl" />
            <DialogFooter><Button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-accent">Commit to Ledger</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem]"><AlertDialogHeader><AlertDialogTitle>Delete task?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDeleteTask} className="bg-rose-500 rounded-xl">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
