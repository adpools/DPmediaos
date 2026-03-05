
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
  Scissors
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/hooks/use-tenant";
import { useDoc, useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, where, orderBy, doc, updateDoc, serverTimestamp, addDoc } from "firebase/firestore";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ProjectWorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { companyId, isLoading: isTenantLoading } = useTenant();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState("pre-prod");

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

  // 3. Fetch Production Days (Call Sheets)
  const shootDaysQuery = useMemoFirebase(() => {
    if (!db || !companyId || !projectId) return null;
    return query(
      collection(db, 'companies', companyId, 'projects', projectId, 'production_days'),
      orderBy('date', 'asc')
    );
  }, [db, companyId, projectId]);

  const { data: shootDays } = useCollection(shootDaysQuery);

  // 4. Fetch Budget Items
  const budgetsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !projectId) return null;
    return collection(db, 'companies', companyId, 'projects', projectId, 'budgets');
  }, [db, companyId, projectId]);

  const { data: budgetItems } = useCollection(budgetsQuery);

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    if (!db || !companyId || !projectId) return;
    const taskRef = doc(db, 'companies', companyId, 'projects', projectId, 'tasks', taskId);
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    
    updateDoc(taskRef, { status: newStatus });

    // Update Project Progress (Heuristic)
    if (project && tasks) {
      const completed = tasks.filter(t => t.id === taskId ? newStatus === 'done' : t.status === 'done').length;
      const total = tasks.length;
      const newProgress = Math.round((completed / total) * 100);
      updateDoc(projectRef!, { progress: newProgress });
    }
  };

  const handleAddTask = (phase: string) => {
    if (!db || !companyId || !projectId) return;
    const title = window.prompt("Task name?");
    if (!title) return;

    const tasksRef = collection(db, 'companies', companyId, 'projects', projectId, 'tasks');
    addDoc(tasksRef, {
      title,
      phase,
      status: 'todo',
      priority: 'Medium',
      created_at: serverTimestamp()
    });
    
    toast({ title: "Task added to " + phase });
  };

  if (isTenantLoading || isProjectLoading) {
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
              Reference: <span className="font-mono text-[10px] uppercase bg-slate-100 px-1.5 rounded">{project.id.slice(0,8)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Production Progress</p>
            <div className="flex items-center gap-3">
              <Progress value={project.progress} className="w-32 h-1.5" />
              <span className="text-sm font-bold text-primary">{project.progress}%</span>
            </div>
          </div>
          <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> New Call Sheet
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Project Budget</span>
            </div>
            <h4 className="text-2xl font-bold">₹{project.budget?.toLocaleString() || '0'}</h4>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Final Deadline</span>
            </div>
            <h4 className="text-xl font-bold">{project.deadline || 'TBD'}</h4>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Tasks Completed</span>
            </div>
            <h4 className="text-2xl font-bold">{tasks?.filter(t => t.status === 'done').length || 0}/{tasks?.length || 0}</h4>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Crew Members</span>
            </div>
            <h4 className="text-2xl font-bold">12</h4>
          </CardContent>
        </Card>
      </div>

      {/* Workspace Tabs */}
      <Tabs defaultValue="pre-prod" className="w-full">
        <TabsList className="bg-white/50 border p-1 rounded-2xl h-auto flex-wrap mb-8">
          <TabsTrigger value="pre-prod" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
            <FileText className="h-4 w-4" /> Pre-Production
          </TabsTrigger>
          <TabsTrigger value="production" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
            <Camera className="h-4 w-4" /> Production
          </TabsTrigger>
          <TabsTrigger value="post-prod" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
            <Scissors className="h-4 w-4" /> Post-Production
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">
            <TrendingUp className="h-4 w-4" /> Financials
          </TabsTrigger>
        </TabsList>

        {/* Phase Contents */}
        {["pre-prod", "production", "post-prod"].map((phase) => (
          <TabsContent key={phase} value={phase} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
                  <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between border-b px-8 py-6">
                    <div>
                      <CardTitle className="text-xl capitalize">{phase.replace('-', ' ')} Checklist</CardTitle>
                      <CardDescription>Track key deliverables for this phase.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleAddTask(phase)}>
                      <Plus className="h-4 w-4 mr-2" /> Add Task
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 bg-white">
                    {isTasksLoading ? (
                      <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : phaseTasks(phase).length === 0 ? (
                      <div className="text-center py-20 text-muted-foreground">
                        No tasks registered for this phase.
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
                                {task.due_date && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {task.due_date}</span>}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {phase === 'production' && (
                  <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
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
                          <span>Completion</span>
                          <span>{phaseTasks(phase).length > 0 ? Math.round((phaseTasks(phase).filter(t => t.status === 'done').length / phaseTasks(phase).length) * 100) : 0}%</span>
                        </div>
                        <Progress value={phaseTasks(phase).length > 0 ? (phaseTasks(phase).filter(t => t.status === 'done').length / phaseTasks(phase).length) * 100 : 0} className="h-1 bg-white/10" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-[2rem] bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">Phase Collaborators</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold border">
                            {i === 1 ? 'PM' : i === 2 ? 'DP' : 'AD'}
                          </div>
                          <div>
                            <p className="text-xs font-bold">{i === 1 ? 'Project Manager' : i === 2 ? 'Cinematographer' : 'Assistant Director'}</p>
                            <p className="text-[9px] text-muted-foreground">Active now</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[8px] font-bold uppercase">Online</Badge>
                      </div>
                    ))}
                    <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5">
                      Invite Crew +
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}

        <TabsContent value="finance">
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white border-b px-8 py-6">
              <CardTitle className="text-xl">Production Budget</CardTitle>
              <CardDescription>Real-time financial tracking for this project workspace.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-[11px] uppercase p-6">Category</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase p-6 text-right">Allocated</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase p-6 text-right">Actual Spent</TableHead>
                    <TableHead className="font-bold text-[11px] uppercase p-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetItems?.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No financial records found.</TableCell></TableRow>
                  ) : (
                    budgetItems?.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-bold p-6">{item.category}</TableCell>
                        <TableCell className="font-mono text-right p-6">₹{item.amount?.toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-right p-6">₹{item.actual?.toLocaleString() || '0'}</TableCell>
                        <TableCell className="p-6">
                          <Badge variant="secondary" className="text-[9px] font-bold uppercase">On Track</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
