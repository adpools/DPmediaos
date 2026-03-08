
"use client";

import { use, useState } from "react";
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
  Download
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [assetToDelete, setAssetToDelete] = useState<any>(null);

  // 1. Fetch Project Details
  const projectRef = useMemoFirebase(() => {
    if (!db || !companyId || !projectId) return null;
    return doc(db, 'companies', companyId, 'projects', projectId);
  }, [db, companyId, projectId]);

  const { data: project, isLoading: isProjectLoading } = useDoc(projectRef);

  // 2. Fetch Tasks for this project
  const tasksQuery = useMemoFirebase(() => {
    if (!db || !companyId || !projectId) return null;
    return query(
      collection(db, 'companies', companyId, 'projects', projectId, 'tasks'),
      orderBy('created_at', 'asc')
    );
  }, [db, companyId, projectId]);

  const { data: tasks, isLoading: isTasksLoading } = useCollection(tasksQuery);

  // 3. Fetch Items/Assets for this project
  const assetsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !projectId) return null;
    return query(
      collection(db, 'companies', companyId, 'projects', projectId, 'items'),
      orderBy('created_at', 'desc')
    );
  }, [db, companyId, projectId]);

  const { data: assets, isLoading: isAssetsLoading } = useCollection(assetsQuery);

  // 4. Fetch Production Schedule / Shoot Days
  const shootDaysQuery = useMemoFirebase(() => {
    if (!db || !companyId || !projectId) return null;
    return query(
      collection(db, 'companies', companyId, 'projects', projectId, 'production_days'),
      orderBy('date', 'asc')
    );
  }, [db, companyId, projectId]);

  const { data: shootDays, isLoading: isShootDaysLoading } = useCollection(shootDaysQuery);

  // 5. Fetch Invoices related to this project
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !projectId) return null;
    return query(
      collection(db, 'companies', companyId, 'invoices'),
      where('project_id', '==', projectId),
      orderBy('created_at', 'desc')
    );
  }, [db, companyId, projectId]);

  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    if (!db || !companyId || !projectId) return;
    const taskRef = doc(db, 'companies', companyId, 'projects', projectId, 'tasks', taskId);
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    
    updateDocumentNonBlocking(taskRef, { 
      status: newStatus,
      updatedAt: serverTimestamp() 
    });

    if (project && tasks && projectRef) {
      const completed = tasks.filter(t => t.id === taskId ? newStatus === 'done' : t.status === 'done').length;
      const total = tasks.length;
      const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
      updateDocumentNonBlocking(projectRef, { progress: newProgress });
    }
  };

  const handleUpdateAssetStatus = (assetId: string, newStatus: string) => {
    if (!db || !companyId || !projectId) return;
    const assetRef = doc(db, 'companies', companyId, 'projects', projectId, 'items', assetId);
    updateDocumentNonBlocking(assetRef, { status: newStatus, updatedAt: serverTimestamp() });
    toast({ title: "Asset Updated", description: `Item status changed to ${newStatus}.` });
  };

  const handleConfirmDeleteTask = () => {
    if (!db || !companyId || !projectId || !taskToDelete) return;
    const taskRef = doc(db, 'companies', companyId, 'projects', projectId, 'tasks', taskToDelete.id);
    deleteDocumentNonBlocking(taskRef);
    toast({ title: "Objective Removed", description: "The task has been deleted from the roadmap." });
    setTaskToDelete(null);
  };

  const handleConfirmDeleteAsset = () => {
    if (!db || !companyId || !projectId || !assetToDelete) return;
    const assetRef = doc(db, 'companies', companyId, 'projects', projectId, 'items', assetToDelete.id);
    deleteDocumentNonBlocking(assetRef);
    toast({ title: "Asset Removed", description: "Item has been removed from tracking." });
    setAssetToDelete(null);
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
        title,
        phase,
        assignedTo: 'Producer',
        status: 'todo',
        priority: idx === 0 ? 'High' : 'Medium',
        created_at: serverTimestamp()
      });
    });
    toast({ title: "Roadmap Initialized", description: `Added ${objectives.length} objectives for ${phase.replace('-', ' ')}.` });
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !companyId || !projectId || !newTask.title) return;
    setIsSubmitting(true);
    try {
      const tasksRef = collection(db, 'companies', companyId, 'projects', projectId, 'tasks');
      addDocumentNonBlocking(tasksRef, {
        title: newTask.title,
        phase: activeTab === 'assets' ? 'production' : (activeTab === 'finances' ? 'production' : activeTab),
        assignedTo: newTask.assignedTo || "Producer",
        status: 'todo',
        priority: 'Medium',
        created_at: serverTimestamp()
      });
      setIsAddTaskOpen(false);
      setNewTask({ title: "", assignedTo: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !companyId || !projectId || !newAsset.name) return;
    setIsSubmitting(true);
    try {
      const assetsRef = collection(db, 'companies', companyId, 'projects', projectId, 'items');
      addDocumentNonBlocking(assetsRef, {
        ...newAsset,
        created_at: serverTimestamp(),
      });
      setIsAddAssetOpen(false);
      setNewAsset({ name: "", category: "Equipment", status: "available" });
      toast({ title: "Asset Registered", description: `${newAsset.name} added to inventory.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTenantLoading || isProjectLoading || isTasksLoading || isAssetsLoading || isShootDaysLoading || isInvoicesLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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

  const totalBilled = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
  const totalOutstanding = invoices?.reduce((sum, inv) => inv.payment_status !== 'paid' ? sum + (inv.total || 0) : sum, 0) || 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
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
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Production Velocity</p>
            <div className="flex items-center gap-3">
              <Progress value={project.progress} className="w-32 h-1.5" />
              <span className="text-sm font-bold text-primary">{project.progress}%</span>
            </div>
          </div>
          <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20" onClick={() => activeTab === 'assets' ? setIsAddAssetOpen(true) : setIsAddTaskOpen(true)}>
            <Plus className="h-4 w-4" /> {activeTab === 'assets' ? 'Register Item' : 'Add Objective'}
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
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
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <Package className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Assets Tracked</span>
            </div>
            <h4 className="text-2xl font-bold">{assets?.length || 0}</h4>
          </CardContent>
        </Card>
      </div>

      {/* Workspace Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/50 border p-1 rounded-2xl h-auto flex-wrap mb-8">
          <TabsTrigger value="pre-prod" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
            <FileText className="h-4 w-4" /> Pre-Prod
          </TabsTrigger>
          <TabsTrigger value="production" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
            <Camera className="h-4 w-4" /> Production
          </TabsTrigger>
          <TabsTrigger value="post-prod" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
            <Scissors className="h-4 w-4" /> Post-Prod
          </TabsTrigger>
          <TabsTrigger value="release" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
            <Rocket className="h-4 w-4" /> Release
          </TabsTrigger>
          <TabsTrigger value="assets" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
            <Package className="h-4 w-4" /> Assets
          </TabsTrigger>
          <TabsTrigger value="finances" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
            <Receipt className="h-4 w-4" /> Finance
          </TabsTrigger>
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
                    {isTasksLoading ? (
                      <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : phaseTasks(phase).length === 0 ? (
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
                                <Badge variant="outline" className="text-[8px] uppercase font-bold text-muted-foreground border-slate-200">
                                  {task.priority || 'Medium'}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Users className="h-3 w-3" /> Assigned: <span className="font-bold text-primary/80 ml-0.5">{task.assignedTo || 'Unassigned'}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl w-48">
                                  <DropdownMenuItem className="cursor-pointer gap-2 py-2" onClick={() => handleToggleTask(task.id, task.status)}>
                                    {task.status === 'done' ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Mark as {task.status === 'done' ? 'Pending' : 'Completed'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="cursor-pointer gap-2 py-2 text-rose-500 focus:text-rose-600 focus:bg-rose-50" onClick={() => setTaskToDelete(task)}>
                                    <Trash2 className="h-4 w-4" /> Delete Objective
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {phase === 'production' && (
                  <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                    <CardHeader className="px-8 pt-8">
                      <CardTitle className="text-xl">Shoot Schedule</CardTitle>
                      <CardDescription>Daily call sheets and location logistics.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                      {shootDays?.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed">
                          <p className="text-sm text-muted-foreground">No call sheets generated yet.</p>
                        </div>
                      ) : (
                        shootDays?.map(day => (
                          <div key={day.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-white">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Video className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="font-bold text-sm">{day.location || 'Studio Set'}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Shoot Day: {day.date}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="rounded-xl text-xs font-bold gap-2">
                              View Sheet <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card className="border-none shadow-sm bg-primary text-white rounded-[2rem]">
                  <CardContent className="p-8 space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                      <LayoutGrid className="h-6 w-6" />
                    </div>
                    <h4 className="text-xl font-bold">Phase Metrics</h4>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-white/60">
                          <span>Checklist Completion</span>
                          <span>{phaseProgress(phase)}%</span>
                        </div>
                        <Progress value={phaseProgress(phase)} className="h-1 bg-white/10" />
                      </div>
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
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setIsAddAssetOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Register Item
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {isAssetsLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : assets?.length === 0 ? (
                    <div className="text-center py-24 text-muted-foreground space-y-4">
                      <Box className="h-12 w-12 mx-auto opacity-10" />
                      <p className="text-sm font-medium">No items registered for tracking.</p>
                      <Button variant="link" size="sm" onClick={() => setIsAddAssetOpen(true)}>Start tracking equipment</Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {assets?.map((asset) => (
                        <div key={asset.id} className="flex items-center gap-4 px-8 py-5 hover:bg-slate-50 transition-colors group">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${asset.status === 'available' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {asset.category === 'Equipment' ? <Camera className="h-5 w-5" /> : asset.category === 'Digital' ? <Monitor className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-slate-800">{asset.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge variant="outline" className="text-[8px] uppercase font-bold text-muted-foreground border-slate-200">
                                {asset.category}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" /> Holder: <span className="font-bold text-primary/80 ml-0.5">{asset.holder || 'Studio Storage'}</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={`uppercase text-[9px] font-bold ${asset.status === 'available' ? 'bg-emerald-500' : asset.status === 'checked_out' ? 'bg-amber-500' : 'bg-rose-500'}`}>
                              {asset.status.replace('_', ' ')}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl w-48">
                                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">Set Status</DropdownMenuLabel>
                                <DropdownMenuItem className="cursor-pointer gap-2 py-2" onClick={() => handleUpdateAssetStatus(asset.id, 'available')}>
                                  <Check className="h-4 w-4 text-emerald-500" /> Available
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer gap-2 py-2" onClick={() => handleUpdateAssetStatus(asset.id, 'checked_out')}>
                                  <Clock className="h-4 w-4 text-amber-500" /> Checked Out
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer gap-2 py-2" onClick={() => handleUpdateAssetStatus(asset.id, 'maintenance')}>
                                  <Target className="h-4 w-4 text-rose-500" /> Maintenance
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer gap-2 py-2 text-rose-500 focus:text-rose-600 focus:bg-rose-50" onClick={() => setAssetToDelete(asset)}>
                                  <Trash2 className="h-4 w-4" /> Remove Tracking
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-sm bg-accent text-white rounded-[2rem]">
                <CardContent className="p-8 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <Package className="h-6 w-6" />
                  </div>
                  <h4 className="text-xl font-bold">Inventory Health</h4>
                  <p className="text-xs text-white/70">Ensure all high-value items are returned before production wrap-up.</p>
                  <div className="pt-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-white/60 mb-2">
                      <span>Return Status</span>
                      <span>{assets?.length ? Math.round((assets.filter(a => a.status === 'available').length / assets.length) * 100) : 0}%</span>
                    </div>
                    <Progress value={assets?.length ? (assets.filter(a => a.status === 'available').length / assets.length) * 100 : 0} className="h-1 bg-white/10" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="finances" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between border-b px-8 py-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Receipt className="h-4 w-4" /></div>
                      <CardTitle className="text-xl">Project Billing Ledger</CardTitle>
                    </div>
                    <CardDescription>Consolidated invoices and payment history for this workspace.</CardDescription>
                  </div>
                  <Link href="/invoices">
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Plus className="h-4 w-4 mr-2" /> New Invoice
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  {isInvoicesLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : invoices?.length === 0 ? (
                    <div className="text-center py-24 text-muted-foreground space-y-4">
                      <Receipt className="h-12 w-12 mx-auto opacity-10" />
                      <p className="text-sm font-medium">No billing records found for this project.</p>
                      <Link href="/invoices">
                        <Button variant="link" size="sm">Generate first invoice</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50/30 border-b">
                          <tr>
                            <th className="px-8 py-4 text-left font-bold text-[10px] uppercase text-muted-foreground">Invoice #</th>
                            <th className="px-8 py-4 text-left font-bold text-[10px] uppercase text-muted-foreground">Amount</th>
                            <th className="px-8 py-4 text-left font-bold text-[10px] uppercase text-muted-foreground">Status</th>
                            <th className="px-8 py-4 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {invoices?.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-8 py-5 font-mono font-bold text-primary">{inv.invoice_number}</td>
                              <td className="px-8 py-5 font-bold">₹{inv.total?.toLocaleString()}</td>
                              <td className="px-8 py-5">
                                <Badge variant={inv.payment_status === 'paid' ? 'default' : 'secondary'} className="text-[9px] uppercase font-bold">
                                  {inv.payment_status}
                                </Badge>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><Download className="h-4 w-4" /></Button>
                                  <Link href={`/invoices/${inv.id}`}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-sm bg-primary text-white rounded-[2rem]">
                <CardHeader>
                  <CardTitle className="text-lg">Commercial Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/60 uppercase">Total Billed</p>
                    <h4 className="text-2xl font-bold">₹{totalBilled.toLocaleString()}</h4>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/60 uppercase">Outstanding</p>
                    <h4 className="text-2xl font-bold text-rose-300">₹{totalOutstanding.toLocaleString()}</h4>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-white/60 mb-2">
                      <span>Collection Rate</span>
                      <span>{totalBilled > 0 ? Math.round(((totalBilled - totalOutstanding) / totalBilled) * 100) : 0}%</span>
                    </div>
                    <Progress value={totalBilled > 0 ? ((totalBilled - totalOutstanding) / totalBilled) * 100 : 0} className="h-1 bg-white/10" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* STABLE DIALOGS */}
      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Objective?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{taskToDelete?.title}" from this production phase. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteTask} className="bg-rose-500 hover:bg-rose-600 rounded-xl">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{assetToDelete?.name}" from your project inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteAsset} className="bg-rose-500 hover:bg-rose-600 rounded-xl">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODALS */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              New Objective
            </DialogTitle>
            <DialogDescription>
              Define a specific deliverable for the current production phase.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Objective Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. Color Grade Final" 
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee">Assign to Role</Label>
              <Input 
                id="assignee" 
                placeholder="e.g. Lead Editor" 
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Register Objective
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              Register Production Item
            </DialogTitle>
            <DialogDescription>
              Add an equipment or prop item to the project inventory.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAsset} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assetName">Item Name</Label>
              <Input 
                id="assetName" 
                placeholder="e.g. Sony FX6 Kit #1" 
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                required
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assetCat">Category</Label>
                <Select onValueChange={(val) => setNewAsset({...newAsset, category: val})} defaultValue="Equipment">
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Equipment', 'Props', 'Wardrobe', 'Digital'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetStatus">Initial Status</Label>
                <Select onValueChange={(val) => setNewAsset({...newAsset, status: val})} defaultValue="available">
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add to Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
