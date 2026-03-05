
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
  CheckCircle2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
    return projects.filter(p => 
      p.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

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
          <h1 className="text-3xl font-bold text-primary">Media Productions</h1>
          <p className="text-muted-foreground">Manage your content lifecycle from pre to post.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
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
              <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20 shrink-0">
                <Plus className="h-4 w-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
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

      <div className="flex items-center justify-between bg-white p-2 rounded-xl border shadow-sm">
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('grid')}
            className={cn("h-8 gap-2 rounded-lg", viewMode === 'grid' && "bg-muted text-primary font-bold")}
          >
            <LayoutGrid className="h-4 w-4" /> Grid
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('list')}
            className={cn("h-8 gap-2 rounded-lg", viewMode === 'list' && "bg-muted text-primary font-bold")}
          >
            <ListIcon className="h-4 w-4" /> List
          </Button>
          <div className="h-4 w-px bg-border mx-2" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('timeline')}
            className={cn("h-8 gap-2 rounded-lg", viewMode === 'timeline' && "bg-muted text-primary font-bold")}
          >
            <Calendar className="h-4 w-4" /> Timeline
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-2 rounded-lg">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
      </div>

      <div className="min-h-[400px]">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed">
            <p className="text-muted-foreground">No projects found matching your criteria.</p>
            {searchQuery ? (
              <Button variant="link" onClick={() => setSearchQuery("")}>Clear Search</Button>
            ) : (
              <Button variant="link" className="mt-2" onClick={() => setIsCreateOpen(true)}>Create Your First Project</Button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
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
      <Card className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden group rounded-3xl">
        <div className={cn("h-32 p-6 flex flex-col justify-end", project.color || 'card-pink')}>
          <Badge variant="secondary" className="w-fit text-[9px] uppercase font-bold bg-white/20 text-white border-none backdrop-blur-md mb-2">
            {project.status?.replace('_', ' ')}
          </Badge>
          <h3 className="text-white font-bold text-lg leading-tight line-clamp-1">{project.project_name}</h3>
        </div>
        <CardContent className="p-6 space-y-4 bg-white">
          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>Client: {project.client_name}</span>
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
          <Card className="border-none shadow-soft rounded-[2rem] overflow-hidden group">
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
        </div>
      </div>
    );
  }

  // Default List View
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden rounded-2xl bg-white">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="p-6 md:w-1/3 flex flex-col gap-1.5 border-l-4 border-l-primary" style={{ borderLeftColor: project.color === 'card-pink' ? '#FF4B82' : '#B199FF' }}>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg leading-none group-hover:text-primary transition-colors">{project.project_name}</h3>
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider py-0 px-2">
                {project.status?.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-muted-foreground">Client: {project.client_name}</span>
            </div>
          </div>

          <div className="flex-1 p-6 flex flex-col justify-center gap-2">
            <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <span>Production Progress</span>
              <span>{project.progress || 0}%</span>
            </div>
            <Progress value={project.progress || 0} className="h-1.5" />
          </div>

          <div className="p-6 md:w-1/4 flex items-center justify-end gap-6 bg-slate-50/50">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Deadline</span>
              <span className="text-sm font-bold text-primary">{project.deadline || 'TBD'}</span>
            </div>
            
            <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-muted flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-sm">
                  <Image src={`https://picsum.photos/seed/${project.id+i}/50/50`} width={32} height={32} alt="member" />
                </div>
              ))}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem asChild>
                  <Link href={`/projects/budgets`}>Budget Tracking</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/projects/schedule`}>Daily Call Sheets</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Edit Project</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
