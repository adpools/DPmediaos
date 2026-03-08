"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Plus, 
  Search, 
  Loader2, 
  Clock, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  BrainCircuit,
  ArrowRight,
  Target,
  FileCheck,
  Database,
  Share2,
  Mail,
  MessageSquare,
  Globe,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  List,
  Printer,
  FileDown,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  ImageIcon,
  Trash2,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
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
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";
import { generateProposalContent, type GenerateProposalContentOutput } from "@/ai/flows/generate-proposal-content";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
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

function ProposalsContent() {
  const { profile, isLoading: isTenantLoading, companyId, company } = useTenant();
  const searchParams = useSearchParams();
  const db = useFirestore();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'input' | 'preview'>('input');

  const [viewingProposal, setViewingProposal] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [proposalToDelete, setProposalToDelete] = useState<any>(null);

  const [aiInputs, setAIInputs] = useState({
    service_vertical: "",
    client_type: "",
    location: "",
    project_description: "",
    project_duration: "6 Months",
    target_market: "",
    budget: ""
  });

  const [generatedDraft, setGeneratedDraft] = useState<GenerateProposalContentOutput | null>(null);
  const marketImage = PlaceHolderImages.find(img => img.id === 'market-analysis');

  useEffect(() => {
    const source = searchParams.get('source');
    if (source === 'research' || source === 'crm') {
      const projectName = searchParams.get('projectName') || searchParams.get('companyName') || '';
      const industry = searchParams.get('industry') || '';
      const services = searchParams.get('services') || searchParams.get('vertical') || '';
      const context = searchParams.get('context') || '';
      const location = searchParams.get('location') || '';

      setAIInputs(prev => ({
        ...prev,
        service_vertical: services,
        client_type: industry,
        location: location,
        project_description: context || (source === 'crm' ? `Strategic production blueprint for ${projectName}'s ${services} project in the ${industry} industry.` : `A dedicated campaign focused on ${industry} market expansion.`)
      }));

      setIsAddOpen(true);
    }
  }, [searchParams]);

  const proposalsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'proposals'),
      orderBy('created_at', 'desc')
    );
  }, [db, companyId]);

  const { data: proposals, isLoading: isProposalsLoading } = useCollection(proposalsQuery);

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'leads'),
      orderBy('company_name', 'asc')
    );
  }, [db, companyId]);

  const { data: leads } = useCollection(leadsQuery);

  const handleGenerateAI = async () => {
    if (!aiInputs.service_vertical || !aiInputs.client_type || !aiInputs.project_description) {
      toast({ variant: "destructive", title: "Missing Context", description: "Please fill in all core project details." });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateProposalContent(aiInputs);
      setGeneratedDraft(result);
      setGenerationStep('preview');
      setActiveSectionIdx(0);
      toast({ title: "Draft Synthesized", description: "Your premium proposal is ready." });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Architect Offline" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !generatedDraft) return;

    setIsSubmitting(true);
    const proposalsRef = collection(db, 'companies', companyId, 'proposals');
    
    addDocumentNonBlocking(proposalsRef, {
      company_id: companyId,
      title: generatedDraft.proposal_title,
      client_name: generatedDraft.client,
      proposal_number: `PROP-${Date.now().toString().slice(-6)}`,
      content: JSON.stringify(generatedDraft), 
      status: 'draft',
      created_at: serverTimestamp(),
    });

    setGeneratedDraft(null);
    setGenerationStep('input');
    setIsAddOpen(false);
    setIsSubmitting(false);
  };

  const handleConfirmDelete = () => {
    if (!db || !companyId || !proposalToDelete) return;
    const proposalRef = doc(db, 'companies', companyId, 'proposals', proposalToDelete.id);
    deleteDocumentNonBlocking(proposalRef);
    setProposalToDelete(null);
  };

  const handleViewProposal = (proposal: any) => {
    try {
      const parsed = JSON.parse(proposal.content);
      setViewingProposal({ ...proposal, parsedContent: parsed });
      setActiveSectionIdx(0);
      setIsViewOpen(true);
    } catch (e) {
      setViewingProposal({ ...proposal, parsedContent: { proposal_title: proposal.title, client: proposal.client_name, sections: [] } });
      setIsViewOpen(true);
    }
  };

  const renderSectionVisuals = (section: any) => {
    if (!section || !section.title) return null;
    const title = section.title.toLowerCase();
    if (title.includes('kpi') || title.includes('targets')) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 no-print">
          {[{ label: 'Engagement', icon: Target, val: '+45%' }, { label: 'Leads', icon: TrendingUp, val: '2.4x' }, { label: 'Traffic', icon: Globe, val: '50k+' }, { label: 'ROI', icon: Zap, val: '185%' }].map((kpi, i) => (
            <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-2">
              <kpi.icon className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-black uppercase text-slate-400">{kpi.label}</span>
              <span className="text-xl font-black text-primary">{kpi.val}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isTenantLoading || isProposalsLoading) {
    return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">AI Proposal Architect</h1>
          <p className="text-muted-foreground text-sm">Automated synthesis of premium production blueprints.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> New Intelligence Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white flex flex-col flex-1 min-h-0">
              <div className="p-8 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <BrainCircuit className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black text-white">AI Architect Wizard</DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs">Dynamic Production Strategy Engine</DialogDescription>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar min-h-0">
                {generationStep === 'input' ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 flex flex-col">
                    <div className="space-y-2 p-5 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 shrink-0">
                      <Label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2 mb-2">
                        <Database className="h-3 w-3" /> Smart Import from CRM
                      </Label>
                      <Select onValueChange={(val) => {
                        const lead = leads?.find(l => l.id === val);
                        if (lead) setAIInputs(prev => ({ ...prev, service_vertical: lead.service_vertical || "", client_type: lead.industry || "", location: lead.billing_address || "", budget: lead.deal_value ? `₹${lead.deal_value.toLocaleString()}` : "" }));
                      }}>
                        <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-10 text-xs text-slate-300">
                          <SelectValue placeholder="Select active lead to fetch data..." />
                        </SelectTrigger>
                        <SelectContent>
                          {leads?.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id} className="text-xs">{lead.company_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Service Vertical</Label>
                        <Input placeholder="e.g. Luxury Brand Film" value={aiInputs.service_vertical} onChange={(e) => setAIInputs({...aiInputs, service_vertical: e.target.value})} className="bg-white/5 border-white/10 rounded-xl h-11 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Client Industry</Label>
                        <Input placeholder="e.g. Real Estate" value={aiInputs.client_type} onChange={(e) => setAIInputs({...aiInputs, client_type: e.target.value})} className="bg-white/5 border-white/10 rounded-xl h-11 text-white" />
                      </div>
                    </div>

                    <div className="space-y-2 shrink-0">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Project Description</Label>
                      <Textarea placeholder="Vision and core objectives..." value={aiInputs.project_description} onChange={(e) => setAIInputs({...aiInputs, project_description: e.target.value})} className="bg-white/5 border-white/10 rounded-xl min-h-[120px] text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[400px] gap-8 animate-in zoom-in-95">
                    <aside className="w-64 space-y-4 shrink-0 overflow-y-auto pr-4 custom-scrollbar">
                      <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-4">Contents</h3>
                      {generatedDraft?.sections.map((sec, idx) => (
                        <button key={idx} onClick={() => setActiveSectionIdx(idx)} className={cn("w-full text-left px-4 py-3 rounded-xl text-[11px] font-bold border border-transparent transition-all", activeSectionIdx === idx ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:bg-white/5")}>
                          {idx + 1}. {sec.title}
                        </button>
                      ))}
                    </aside>
                    <main className="flex-1 bg-white/5 rounded-[2.5rem] border border-white/10 p-10 overflow-y-auto custom-scrollbar">
                      <h2 className="text-2xl font-black text-white mb-6">{generatedDraft?.sections[activeSectionIdx]?.title}</h2>
                      <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-line font-medium">{generatedDraft?.sections[activeSectionIdx]?.content}</div>
                    </main>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-white/10 bg-slate-900 shrink-0">
                {generationStep === 'input' ? (
                  <Button onClick={handleGenerateAI} disabled={isGenerating} className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black uppercase text-xs tracking-widest gap-3 shadow-xl">
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                    Launch AI Architect
                  </Button>
                ) : (
                  <div className="flex gap-4">
                    <Button onClick={() => setGenerationStep('input')} variant="outline" className="flex-1 bg-transparent border-white/10 text-white rounded-2xl h-14 font-black uppercase text-[10px]">Adjust</Button>
                    <Button onClick={handleCreateProposal} disabled={isSubmitting} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black uppercase text-xs tracking-widest gap-3 shadow-xl">
                      {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileCheck className="h-5 w-5" />}
                      Commit to Ledger
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {proposals?.length === 0 ? (
          <Card className="border-2 border-dashed p-24 text-center rounded-[3rem] bg-white/50">
            <BrainCircuit className="h-16 w-16 mx-auto mb-6 opacity-10" />
            <p className="font-black uppercase tracking-widest text-xs text-muted-foreground">No active blueprints.</p>
            <Button variant="link" className="mt-4 font-bold" onClick={() => setIsAddOpen(true)}>Launch Wizard</Button>
          </Card>
        ) : (
          proposals?.map((prop) => (
            <Card key={prop.id} className="hover:shadow-md transition-all border-none shadow-sm group rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-0 flex flex-col md:flex-row md:items-center">
                <div className="p-8 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <FileText className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl group-hover:text-primary transition-colors">{prop.title}</h3>
                      <p className="text-xs text-muted-foreground font-medium mt-1">{prop.proposal_number} • Client: {prop.client_name}</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 md:w-80 bg-slate-50/50 border-l flex flex-col gap-3">
                  <Button className="w-full rounded-xl h-11 font-bold gap-2" onClick={() => handleViewProposal(prop)}><ExternalLink className="h-4 w-4" /> View Blueprint</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-xl h-11 gap-2"><Share2 className="h-4 w-4" /> Share</Button>
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl text-rose-500 hover:bg-rose-50" onClick={() => setProposalToDelete(prop)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!proposalToDelete} onOpenChange={(open) => !open && setProposalToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>Permanently remove blueprint "{proposalToDelete?.title}"? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-rose-500 hover:bg-rose-600 rounded-xl">Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[1000px] rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl h-[90vh] flex flex-col">
          <div className="bg-white flex flex-col flex-1 min-h-0">
            <div className="p-10 border-b flex items-center justify-between no-print shrink-0">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary"><FileText className="h-8 w-8" /></div>
                <div>
                  <h2 className="text-3xl font-black tracking-tighter text-slate-900">{viewingProposal?.title}</h2>
                  <p className="text-sm text-muted-foreground font-black uppercase tracking-widest mt-1">Strategy: {viewingProposal?.proposal_number}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsViewOpen(false)}><X className="h-6 w-6" /></Button>
            </div>

            <div className="flex-1 flex min-h-0 overflow-hidden">
              <aside className="w-72 border-r bg-slate-50/50 p-8 space-y-6 hidden md:block no-print overflow-y-auto custom-scrollbar">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Contents</h3>
                <div className="space-y-1">
                  {viewingProposal?.parsedContent?.sections.map((sec: any, idx: number) => (
                    <button key={idx} onClick={() => setActiveSectionIdx(idx)} className={cn("w-full text-left px-4 py-3 rounded-2xl text-xs transition-all", activeSectionIdx === idx ? "bg-white text-primary shadow-md font-black border border-primary/10" : "text-slate-500 hover:bg-white")}>
                      {String(idx + 1).padStart(2, '0')}. {sec.title}
                    </button>
                  ))}
                </div>
              </aside>
              <main className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-white">
                <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-4">
                    <Badge variant="outline" className="text-[10px] font-black uppercase text-primary">Phase {activeSectionIdx + 1}</Badge>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{viewingProposal?.parsedContent?.sections[activeSectionIdx]?.title}</h1>
                  </div>
                  <div className="prose prose-slate prose-lg max-w-none text-lg leading-relaxed text-slate-600 font-medium whitespace-pre-line border-l-4 border-primary/10 pl-8">{viewingProposal?.parsedContent?.sections[activeSectionIdx]?.content}</div>
                  {renderSectionVisuals(viewingProposal?.parsedContent?.sections[activeSectionIdx])}
                </div>
              </main>
            </div>

            <div className="p-8 border-t bg-slate-50 flex items-center justify-between no-print shrink-0">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">AI Strategy Engine • {new Date().getFullYear()}</p>
              <Button className="rounded-xl font-bold h-11 px-8 shadow-lg shadow-primary/20" onClick={() => setIsViewOpen(false)}>Close Blueprint</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProposalsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>}>
      <ProposalsContent />
    </Suspense>
  );
}
