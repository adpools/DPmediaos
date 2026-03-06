
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  Calendar, 
  MoreVertical, 
  ExternalLink, 
  Loader2, 
  Sparkles,
  Search,
  Clock,
  CheckCircle2,
  X,
  Briefcase,
  Layers,
  ArrowRight,
  Database
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ViewMode = 'grid' | 'list' | 'timeline';

export default function ProjectsPage() {
  const { profile, isLoading: isTenantLoading, companyId } = useTenant();
  const db = useFirestore();
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [newProject, setNewProject] = useState({
    project_name: "",
    client_name: "",
    budget: "",
    deadline: ""
  });

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'projects'),
      orderBy('created_at', 'desc')
    );
  }, [db, companyId]);

  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  // Fetch leads for the client dropdown
  const leadsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'leads'),
      orderBy('company_name', 'asc')
    );
  }, [db, companyId]);

  const { data: leads } = useCollection(leadsQuery);

  // Filter Logic
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => {
      const matchesSearch = 
        p.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const handleLeadImport = (leadId: string) => {
    const lead = leads?.find(l => l.id === leadId);
    if (lead) {
      setNewProject({
        ...newProject,
        client_name: lead.company_name || "",
        budget: lead.deal_value ? lead.deal_value.toString() : "",
        project_name: `${lead.company_name} - ${new Date().getFullYear()} Production`,
      });
      toast({
        title: "CRM Data Imported",
        description: `Linked to ${lead.company_name} opportunity.`,
      });
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newProject.project_name || !newProject.client_name) {
      toast({
        variant: "destructive",
        title: "Information Missing",
        description: "Please provide a project name and select a client.",
      });
      return;
    }

    setIsSubmitting(true);
    const projectsRef = collection(db, 'companies', companyId, 'projects');
    
    const colors = ['card-pink', 'card-purple'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    addDocumentNonBlocking(projectsRef, {
      company_id: companyId,
      project_name: newProject.project_name,
      client_name: newProject.client_name,
      budget: parseFloat(newProject.budget) || 0,
      deadline: newProject.deadline,
      status: 'in_progress',
      progress: 0,
      color: randomColor,
      created_at: serverTimestamp(),
    });

    toast({
      title: "Project Created",
      description: `${newProject.project_name} has been added to your production queue.`,
    });

    setNewProject({ project_name: "", client_name: "", budget: "", deadline: "" });
    setIsCreateOpen(false);
    setIsSubmitting(false);
  };

  if (isTenantLoading || isProjectsLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Media Productions</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Manage your content lifecycle from pre to post.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search projects..." 
              className="pl-9 h-10 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20 shrink-0 h-10">
                <Plus className="h-4 w-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Start New Production
                </DialogTitle>
                <DialogDescription>
                  Define the core details for your upcoming media project.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4 py-4">
                {/* Lead Import Dropdown */}
                <div className="space-y-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <Label htmlFor="importLead" className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Database className="h-3 w-3" /> Smart Import from CRM
                  </Label>
                  <Select onValueChange={handleLeadImport}>
                    <SelectTrigger className="rounded-xl h-9 bg-white shadow-none text-xs">
                      <SelectValue placeholder="Select active lead to fetch data..." />
                    </SelectTrigger>
                    <SelectContent>
                      {leads?.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">No active leads found.</div>
                      ) : (
                        leads?.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id} className="text-xs">
                            {lead.company_name} (₹{lead.deal_value?.toLocaleString()})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Brand Film 2024" 
                    value={newProject.project_name}
                    onChange={(e) => setNewProject({...newProject, project_name: e.target.value})}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client Name</Label>
                  <Select 
                    value={newProject.client_name} 
                    onValueChange={(val) => setNewProject({...newProject, client_name: val})}
                    required
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select a client company" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads?.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          No clients found. Add them in the CRM first.
                        </div>
                      ) : (
                        leads?.map((lead) => (
                          <SelectItem key={lead.id} value={lead.company_name}>
                            {lead.company_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (INR)</Label>
                    <Input 
                      id="budget" 
                      type="number"
                      placeholder="50000" 
                      value={newProject.budget}
                      onChange={(e) => setNewProject({...newProject, budget: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input 
                      id="deadline" 
                      type="date"
                      value={newProject.deadline}
                      onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Workspace
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white p-2 rounded-xl border shadow-sm gap-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('grid')}
            className={cn("h-8 gap-2 rounded-lg shrink-0", viewMode === 'grid' && "bg-muted text-primary font-bold")}
          >
            <LayoutGrid className="h-4 w-4" /> Grid
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('list')}
            className={cn("h-8 gap-2 rounded-lg shrink-0", viewMode === 'list' && "bg-muted text-primary font-bold")}
          >
            <ListIcon className="h-4 w-4" /> List
          </Button>
          <div className="h-4 w-px bg-border mx-1 shrink-0" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('timeline')}
            className={cn("h-8 gap-2 rounded-lg shrink-0", viewMode === 'timeline' && "bg-muted text-primary font-bold")}
          >
            <Calendar className="h-4 w-4" /> Timeline
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1 h-8 rounded-lg pl-3 pr-1 bg-primary/10 text-primary border-none hidden sm:flex">
              Status: {statusFilter.replace('_', ' ')}
              <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-transparent" onClick={() => setStatusFilter('all')}>
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2 rounded-lg w-full sm:w-auto">
                <Filter className="h-4 w-4" /> Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl w-48">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-3 py-2">Filter by Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'all'} 
                onCheckedChange={() => setStatusFilter('all')}
                className="rounded-lg m-1"
              >
                All Statuses
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'in_progress'} 
                onCheckedChange={() => setStatusFilter('in_progress')}
                className="rounded-lg m-1"
              >
                In Progress
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'completed'} 
                onCheckedChange={() => setStatusFilter('completed')}
                className="rounded-lg m-1"
              >
                Completed
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={statusFilter === 'on_hold'} 
                onCheckedChange={() => setStatusFilter('on_hold')}
                className="rounded-lg m-1"
              >
                On Hold
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="min-h-[400px]">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed px-4">
            <p className="text-muted-foreground text-sm">No projects found matching your criteria.</p>
            {(searchQuery || statusFilter !== 'all') ? (
              <Button variant="link" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>Clear Filters</Button>
            ) : (
              <Button variant="link" className="mt-2" onClick={() => setIsCreateOpen(true)}>Create Your First Project</Button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
            viewMode === 'list' && "space-y-4",
            viewMode === 'timeline' && "relative space-y-8 before:absolute before:left-4 md:before:left-[50%] before:top-0 before:bottom-0 before:w-px before:bg-slate-200"
          )}>
            {filteredProjects.map((proj, idx) => (
              <ProjectCard 
                key={proj.id} 
                project={proj} 
                view={viewMode} 
                index={idx}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project, view, index }: { project: any, view: ViewMode, index: number }) {
  const isEven = index % 2 === 0;

  if (view === 'grid') {
    return (
      <Link href={`/projects/${project.id}`}>
        <Card className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden group rounded-3xl cursor-pointer">
          <div className={cn("h-32 p-6 flex flex-col justify-end", project.color || 'card-pink')}>
            <Badge variant="secondary" className="w-fit text-[9px] uppercase font-bold bg-white/20 text-white border-none backdrop-blur-md mb-2">
              {project.status?.replace('_', ' ')}
            </Badge>
            <h3 className="text-white font-bold text-lg leading-tight line-clamp-1">{project.project_name}</h3>
          </div>
          <CardContent className="p-6 space-y-4 bg-white">
            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <span className="truncate max-w-[70%]">Client: {project.client_name}</span>
              <span>{project.progress || 0}%</span>
            </div>
            <Progress value={project.progress || 0} className="h-1.5" />
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary">
                <Clock className="h-3 w-3" />
                {project.deadline || 'No Deadline'}
              </div>
              <div className="flex -space-x-2">
                {[1,2].map(i => (
                  <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-muted overflow-hidden">
                    <Image src={`https://picsum.photos/seed/${project.id+i}/40/40`} width={24} height={24} alt="team" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (view === 'timeline') {
    return (
      <div className={cn(
        "relative flex flex-col md:flex-row items-center gap-8 md:gap-0",
        isEven ? "md:flex-row-reverse" : "md:flex-row"
      )}>
        {/* Timeline Dot */}
        <div className="absolute left-4 md:left-[50%] -translate-x-[50%] z-10">
          <div className="h-10 w-10 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center shadow-sm">
            <div className={cn("h-3 w-3 rounded-full", project.progress === 100 ? "bg-emerald-500" : "bg-primary")} />
          </div>
        </div>

        {/* Content Card */}
        <div className="w-full md:w-[45%] ml-12 md:ml-0">
          <Link href={`/projects/${project.id}`}>
            <Card className="border-none shadow-soft rounded-[2rem] overflow-hidden group cursor-pointer">
              <CardContent className="p-6 space-y-4 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {project.deadline || 'Date Pending'}
                  </span>
                  {project.progress === 100 && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                </div>
                <div>
                  <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{project.project_name}</h4>
                  <p className="text-xs text-muted-foreground">Client: {project.client_name}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground">
                    <span>Current Phase</span>
                    <span>{project.progress}% Complete</span>
                  </div>
                  <Progress value={project.progress} className="h-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    );
  }

  // Refined List View
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden rounded-2xl bg-white border border-slate-50">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row md:items-center">
          {/* Main Title Area */}
          <Link 
            href={`/projects/${project.id}`} 
            className="p-5 md:p-6 md:w-[35%] flex flex-col gap-2 relative group-hover:bg-slate-50/50 transition-colors"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: project.color === 'card-pink' ? '#FF4B82' : '#B199FF' }} />
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-base md:text-lg leading-none text-slate-800 group-hover:text-primary transition-colors truncate">
                {project.project_name}
              </h3>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Badge variant="outline" className="text-[8px] md:text-[9px] uppercase font-bold tracking-widest py-0.5 px-2 bg-slate-50 border-slate-200 text-slate-500">
                {project.status?.replace('_', ' ')}
              </Badge>
              <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground font-medium">
                <Briefcase className="h-3 w-3" />
                {project.client_name}
              </div>
            </div>
          </Link>

          {/* Progress Area */}
          <div className="flex-1 px-5 md:px-6 py-4 md:py-0 border-y md:border-y-0 md:border-x border-slate-100">
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-primary/60" />
                  <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Production Health</span>
                </div>
                <span className="text-xs md:text-sm font-black text-primary">{project.progress || 0}%</span>
              </div>
              <Progress value={project.progress || 0} className="h-1.5 md:h-2 rounded-full bg-slate-100" />
            </div>
          </div>

          {/* Metadata & Actions Area */}
          <div className="p-5 md:p-6 md:w-[30%] flex items-center justify-between gap-4 md:gap-6 bg-slate-50/30">
            <div className="flex items-center gap-4 md:gap-8">
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[9px] uppercase font-black text-slate-400 tracking-[0.15em] mb-1">Deadline</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-rose-400" />
                  <span className="text-xs md:text-sm font-bold text-slate-700">{project.deadline || 'TBD'}</span>
                </div>
              </div>
              
              <div className="hidden lg:flex flex-col">
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-[0.15em] mb-1">Active Crew</span>
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-white flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-sm ring-1 ring-slate-100">
                      <Image src={`https://picsum.photos/seed/${project.id+i}/50/50`} width={28} height={28} alt="member" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/projects/${project.id}`}>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-primary hover:bg-white shadow-sm border border-transparent hover:border-slate-100 transition-all">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-600">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl w-52 shadow-2xl border-slate-100">
                  <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 px-3 py-2 tracking-widest">Management</DropdownMenuLabel>
                  <DropdownMenuItem asChild className="rounded-lg m-1 py-2 cursor-pointer">
                    <Link href={`/projects/${project.id}`} className="flex items-center gap-2">
                      <ExternalLink className="h-3.5 w-3.5" /> Workspace Overview
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg m-1 py-2 cursor-pointer">
                    <Link href={`/projects/budgets`} className="flex items-center gap-2">
                      <Plus className="h-3.5 w-3.5" /> Budget Tracking
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-50" />
                  <DropdownMenuItem className="rounded-lg m-1 py-2 cursor-pointer text-rose-500 focus:text-rose-600 focus:bg-rose-50">
                    Archive Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
