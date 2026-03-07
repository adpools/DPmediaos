
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
  Image as ImageIcon,
  Trash2
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
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

function ProposalsContent() {
  const { profile, isLoading: isTenantLoading, companyId, company } = useTenant();
  const searchParams = useSearchParams();
  const db = useFirestore();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'input' | 'preview'>('input');

  // View Proposal State
  const [viewingProposal, setViewingProposal] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);

  // Proposal Form State
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

  // Listen for research source
  useEffect(() => {
    const source = searchParams.get('source');
    if (source === 'research') {
      const projectName = searchParams.get('projectName') || '';
      const industry = searchParams.get('industry') || '';
      const services = searchParams.get('services') || '';
      const context = searchParams.get('context') || '';

      setAIInputs(prev => ({
        ...prev,
        service_vertical: services || projectName,
        client_type: industry,
        project_description: context || `A dedicated campaign focused on ${industry} market expansion.`
      }));

      setIsAddOpen(true);
    }
  }, [searchParams]);

  // 1. Fetch Existing Proposals
  const proposalsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'proposals'),
      orderBy('created_at', 'desc')
    );
  }, [db, companyId]);

  const { data: proposals, isLoading: isProposalsLoading } = useCollection(proposalsQuery);

  // 2. Fetch CRM Leads for Smart Import
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
      toast({ title: "Draft Synthesized", description: "Your 18-section premium proposal is ready." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "AI Architect Offline", description: "Failed to generate proposal." });
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

    toast({
      title: "Proposal Generated",
      description: `${generatedDraft.proposal_title} has been added to your drafts.`,
    });

    setGeneratedDraft(null);
    setAIInputs({
      service_vertical: "",
      client_type: "",
      location: "",
      project_description: "",
      project_duration: "6 Months",
      target_market: "",
      budget: ""
    });
    setGenerationStep('input');
    setIsAddOpen(false);
    setIsSubmitting(false);
  };

  const handleDeleteProposal = (proposalId: string) => {
    if (!db || !companyId || !proposalId) return;
    const proposalRef = doc(db, 'companies', companyId, 'proposals', proposalId);
    deleteDocumentNonBlocking(proposalRef);
    toast({ title: "Proposal Removed", description: "Strategy has been deleted from your workspace." });
  };

  const handleViewProposal = (proposal: any) => {
    try {
      const parsed = JSON.parse(proposal.content);
      setViewingProposal({ ...proposal, parsedContent: parsed });
      setActiveSectionIdx(0);
      setIsViewOpen(true);
    } catch (e) {
      setViewingProposal({ 
        ...proposal, 
        parsedContent: { 
          proposal_title: proposal.title, 
          client: proposal.client_name, 
          sections: [{ title: 'Overview', content: proposal.content }] 
        } 
      });
      setIsViewOpen(true);
    }
  };

  const handleDownloadPDF = (proposal: any) => {
    handleViewProposal(proposal);
    // Give time for state to sync and dialog to render before print
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  const renderSectionVisuals = (section: any) => {
    if (!section || !section.title) return null;
    
    const title = section.title.toLowerCase();
    
    if (title.includes('kpi') || title.includes('targets')) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 no-print">
          {[
            { label: 'Engagement', icon: Target, val: '+45%' },
            { label: 'Leads', icon: TrendingUp, val: '2.4x' },
            { label: 'Traffic', icon: Globe, val: '50k+' },
            { label: 'ROI', icon: Zap, val: '185%' }
          ].map((kpi, i) => (
            <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-2">
              <kpi.icon className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-black uppercase text-slate-400">{kpi.label}</span>
              <span className="text-xl font-black text-primary">{kpi.val}</span>
            </div>
          ))}
        </div>
      );
    }

    if (title.includes('roadmap') || title.includes('timeline')) {
      return (
        <div className="space-y-4 mt-8 no-print">
          {[1, 2, 3, 4].map((phase) => (
            <div key={phase} className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm">
                Q{phase}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase text-primary">Strategic Milestone {phase}</p>
                <div className="h-1.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${phase * 25}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (title.includes('audit') || title.includes('research')) {
      return (
        <div className="mt-8 relative rounded-3xl overflow-hidden aspect-video no-print">
          <Image 
            src={marketImage?.imageUrl || "https://picsum.photos/seed/market/800/600"} 
            fill 
            className="object-cover opacity-80" 
            alt="market"
            data-ai-hint="data analysis"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent flex flex-col justify-end p-8">
            <Badge className="w-fit mb-2 bg-accent text-white">Live Market Analysis</Badge>
            <p className="text-white font-bold text-lg">Cross-channel data synchronization complete.</p>
          </div>
        </div>
      );
    }

    return null;
  };

  if (isTenantLoading || isProposalsLoading) {
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
          <h1 className="text-3xl font-bold text-primary">AI Proposal Architect</h1>
          <p className="text-muted-foreground">Automated generation of premium, data-backed production pitches.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64 hidden lg:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Find a proposal..." className="pl-9 h-10 rounded-xl" />
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> New Intelligence Proposal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-slate-900 text-white flex flex-col h-[90vh] md:h-[80vh]">
                <div className="p-8 pb-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <BrainCircuit className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-black">AI Architect Wizard</DialogTitle>
                      <DialogDescription className="text-slate-400 text-xs">Premium Proposal Synthesis Engine</DialogDescription>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 px-8 md:px-10 pb-8">
                  {generationStep === 'input' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                      <div className="space-y-2 p-5 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
                        <Label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2 mb-2">
                          <Database className="h-3 w-3" /> Smart Import from CRM
                        </Label>
                        <Select onValueChange={(val) => {
                          const lead = leads?.find(l => l.id === val);
                          if (lead) {
                            setAIInputs(prev => ({
                              ...prev,
                              service_vertical: lead.service_vertical || "",
                              client_type: lead.industry || "",
                              location: lead.billing_address || "",
                              budget: lead.deal_value ? `₹${lead.deal_value.toLocaleString()}` : ""
                            }));
                            toast({ title: "Lead Imported", description: `Data fetched for ${lead.company_name}.` });
                          }
                        }}>
                          <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-10 text-xs text-slate-300">
                            <SelectValue placeholder="Select active lead to fetch data..." />
                          </SelectTrigger>
                          <SelectContent>
                            {leads?.map((lead) => (
                              <SelectItem key={lead.id} value={lead.id} className="text-xs">
                                {lead.company_name} ({lead.service_vertical || 'General'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Service Vertical</Label>
                          <Input 
                            placeholder="e.g. Luxury Brand Film" 
                            value={aiInputs.service_vertical}
                            onChange={(e) => setAIInputs({...aiInputs, service_vertical: e.target.value})}
                            className="bg-white/5 border-white/10 rounded-xl h-11 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Client Industry</Label>
                          <Input 
                            placeholder="e.g. Real Estate Development" 
                            value={aiInputs.client_type}
                            onChange={(e) => setAIInputs({...aiInputs, client_type: e.target.value})}
                            className="bg-white/5 border-white/10 rounded-xl h-11 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Geographical Focus</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <Input 
                              placeholder="e.g. Mumbai, India" 
                              value={aiInputs.location}
                              onChange={(e) => setAIInputs({...aiInputs, location: e.target.value})}
                              className="bg-white/5 border-white/10 rounded-xl h-11 pl-10 text-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Project Duration</Label>
                          <Select value={aiInputs.project_duration} onValueChange={(val) => setAIInputs({...aiInputs, project_duration: val})}>
                            <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["3 Months", "6 Months", "12 Months", "Ongoing"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Project Description & Objectives</Label>
                        <Textarea 
                          placeholder="Describe the client's core problem and your proposed solution vision..." 
                          value={aiInputs.project_description}
                          onChange={(e) => setAIInputs({...aiInputs, project_description: e.target.value})}
                          className="bg-white/5 border-white/10 rounded-xl min-h-[120px] text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Target Market</Label>
                          <Input 
                            placeholder="e.g. Gen-Z Tech Enthusiasts" 
                            value={aiInputs.target_market}
                            onChange={(e) => setAIInputs({...aiInputs, target_market: e.target.value})}
                            className="bg-white/5 border-white/10 rounded-xl h-11 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Estimated Budget (Optional)</Label>
                          <Input 
                            placeholder="e.g. ₹5,00,000 - ₹8,00,000" 
                            value={aiInputs.budget}
                            onChange={(e) => setAIInputs({...aiInputs, budget: e.target.value})}
                            className="bg-white/5 border-white/10 rounded-xl h-11 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in zoom-in-95 duration-300">
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="w-full md:w-64 space-y-4">
                          <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-4">Proposal Contents</h3>
                          <div className="space-y-1">
                            {generatedDraft?.sections.map((section, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActiveSectionIdx(idx)}
                                className={cn(
                                  "w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all border border-transparent",
                                  activeSectionIdx === idx 
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                )}
                              >
                                {idx + 1}. {section.title}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex-1 space-y-6">
                          <div className="bg-white/5 rounded-[2.5rem] border border-white/10 p-8 md:p-10 relative overflow-hidden min-h-[400px]">
                            <BrainCircuit className="absolute -top-4 -right-4 h-24 w-24 opacity-5 text-indigo-400" />
                            <h2 className="text-2xl font-black text-white mb-6">
                              {generatedDraft?.sections[activeSectionIdx]?.title}
                            </h2>
                            <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-line font-medium prose prose-invert max-w-none">
                              {generatedDraft?.sections[activeSectionIdx]?.content}
                            </div>
                            {renderSectionVisuals(generatedDraft?.sections[activeSectionIdx])}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </ScrollArea>

                <div className="p-8 border-t border-white/10 bg-slate-900/50 backdrop-blur-xl">
                  {generationStep === 'input' ? (
                    <Button 
                      onClick={handleGenerateAI} 
                      disabled={isGenerating}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-indigo-600/20"
                    >
                      {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                      Launch AI Architect
                    </Button>
                  ) : (
                    <div className="flex gap-4">
                      <Button 
                        onClick={() => setGenerationStep('input')}
                        variant="outline"
                        className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest"
                      >
                        Adjust Parameters
                      </Button>
                      <Button 
                        onClick={handleCreateProposal} 
                        disabled={isSubmitting}
                        className="flex-[2] bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-indigo-600/20"
                      >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileCheck className="h-5 w-5" />}
                        Commit Strategy to Ledger
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {proposals?.length === 0 ? (
          <Card className="border-2 border-dashed flex flex-col items-center justify-center p-24 text-muted-foreground bg-white/50 rounded-[3rem]">
            <BrainCircuit className="h-16 w-16 mb-6 opacity-10" />
            <p className="font-black uppercase tracking-widest text-xs">No active strategies found.</p>
            <Button variant="link" className="mt-4 font-bold" onClick={() => setIsAddOpen(true)}>Launch AI Architect Wizard</Button>
          </Card>
        ) : (
          proposals?.map((prop) => (
            <Card key={prop.id} className="hover:shadow-md transition-all border-none shadow-sm group rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-stretch">
                  <div className="p-8 flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        <FileText className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors">{prop.title}</h3>
                        <p className="text-xs text-muted-foreground font-medium mt-1">Ref: {prop.proposal_number} • Client: {prop.client_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-slate-600">
                          {prop.created_at?.toDate ? prop.created_at.toDate().toLocaleDateString('en-GB') : 'Just now'}
                        </span>
                      </div>
                      <Badge variant={prop.status === 'accepted' ? 'default' : prop.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[9px] uppercase font-black tracking-widest px-3 py-0.5">
                        {prop.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-8 md:w-80 bg-slate-50/50 border-l border-slate-100 flex flex-col justify-center gap-3">
                    <Button className="w-full rounded-xl h-11 font-bold shadow-lg shadow-primary/10 gap-2" onClick={() => handleViewProposal(prop)}>
                      <ExternalLink className="h-4 w-4" /> View Full Blueprint
                    </Button>
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="flex-1 rounded-xl h-11 gap-2">
                            <Share2 className="h-4 w-4" /> Share
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl w-52">
                          <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 px-3 py-2">Deliver Strategy</DropdownMenuLabel>
                          <DropdownMenuItem className="gap-3 cursor-pointer py-3" onClick={() => {
                            const text = encodeURIComponent(`Hi, here is our AI-powered production blueprint for ${prop.title}.`);
                            window.open(`https://wa.me/?text=${text}`, '_blank');
                          }}>
                            <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><MessageSquare className="h-4 w-4" /></div>
                            <div className="flex flex-col"><span className="text-xs font-bold">WhatsApp</span><span className="text-[10px] text-muted-foreground">Mobile Delivery</span></div>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 cursor-pointer py-3" onClick={() => {
                            window.location.href = `mailto:?subject=Proposal: ${prop.title}`;
                          }}>
                            <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Mail className="h-4 w-4" /></div>
                            <div className="flex flex-col"><span className="text-xs font-bold">Direct Email</span><span className="text-[10px] text-muted-foreground">Professional Handshake</span></div>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="gap-3 cursor-pointer py-3 text-rose-500 focus:text-rose-600 focus:bg-rose-50" onSelect={(e) => e.preventDefault()}>
                                <div className="h-8 w-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center"><Trash2 className="h-4 w-4" /></div>
                                <div className="flex flex-col"><span className="text-xs font-bold">Delete</span><span className="text-[10px] text-muted-foreground">Remove permanently</span></div>
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[2rem]">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove this production blueprint from your workspace. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProposal(prop.id)} className="bg-rose-500 hover:bg-rose-600 rounded-xl">
                                  Confirm Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={() => handleDownloadPDF(prop)}>
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[1000px] rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl h-[90vh]">
          <div className="bg-white flex flex-col h-full">
            <div className="p-10 pb-6 border-b flex items-center justify-between no-print">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shadow-inner">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tighter text-slate-900">{viewingProposal?.title}</h2>
                  <p className="text-sm text-muted-foreground uppercase font-black tracking-widest mt-1">
                    Strategy No: {viewingProposal?.proposal_number} • For {viewingProposal?.client_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-emerald-50 text-emerald-600 border-none uppercase text-[10px] font-black tracking-widest px-5 h-8">
                  Blueprint: Live
                </Badge>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-slate-100" onClick={() => setIsViewOpen(false)}>
                  <Plus className="h-6 w-6 rotate-45" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-72 border-r bg-slate-50/50 p-8 space-y-6 hidden md:block no-print">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-2">Table of Contents</h3>
                <ScrollArea className="h-[calc(100%-40px)]">
                  <div className="space-y-1 pr-4">
                    {viewingProposal?.parsedContent?.sections.map((sec: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSectionIdx(idx)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-2xl text-xs transition-all duration-300 group",
                          activeSectionIdx === idx 
                            ? "bg-white text-primary shadow-md font-black border border-primary/10" 
                            : "text-slate-500 hover:bg-white hover:text-slate-800 font-bold"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn("text-[9px] font-black opacity-40", activeSectionIdx === idx && "text-primary opacity-100")}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="truncate">{sec.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <ScrollArea className="flex-1 p-12 bg-white print:p-0 print:overflow-visible">
                <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Print Cover Page (only visible in print) */}
                  <div className="hidden print:block space-y-12 py-20 text-center">
                    <div className="h-24 w-24 bg-primary mx-auto rounded-3xl flex items-center justify-center text-white text-4xl font-black">
                      {company?.name?.substring(0, 2).toUpperCase() || 'DP'}
                    </div>
                    <div className="space-y-4">
                      <h1 className="text-6xl font-black tracking-tighter">{viewingProposal?.title}</h1>
                      <p className="text-2xl text-muted-foreground font-bold uppercase tracking-widest">Business Strategy Blueprint</p>
                    </div>
                    <div className="pt-20 space-y-2">
                      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Prepared For</p>
                      <p className="text-3xl font-black">{viewingProposal?.client_name}</p>
                    </div>
                    <div className="pt-10">
                      <p className="font-bold text-slate-400 text-sm">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  {/* Print Sections (all visible in print) */}
                  <div className="print:block hidden">
                    {viewingProposal?.parsedContent?.sections.map((section: any, idx: number) => (
                      <div key={idx} className="space-y-6 pt-16 break-before-page">
                        <div className="space-y-4">
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary">
                            Phase {idx + 1}
                          </Badge>
                          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                            {section.title}
                          </h2>
                        </div>
                        <div className="prose prose-slate prose-lg max-w-none">
                          <div className="text-lg leading-relaxed text-slate-600 font-medium whitespace-pre-line border-l-4 border-primary/10 pl-8 py-2">
                            {section.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Interactive View (visible only on screen) */}
                  <div className="no-print space-y-10">
                    <div className="space-y-4">
                      <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary">
                        Phase {activeSectionIdx + 1}
                      </Badge>
                      <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                        {viewingProposal?.parsedContent?.sections[activeSectionIdx]?.title}
                      </h1>
                    </div>
                    
                    <div className="prose prose-slate prose-lg max-w-none">
                      <div className="text-lg leading-relaxed text-slate-600 font-medium whitespace-pre-line border-l-4 border-primary/10 pl-8 py-2">
                        {viewingProposal?.parsedContent?.sections[activeSectionIdx]?.content}
                      </div>
                    </div>

                    {renderSectionVisuals(viewingProposal?.parsedContent?.sections[activeSectionIdx])}

                    {/* NAV CONTROLS */}
                    <div className="pt-12 border-t flex justify-between items-center">
                      <Button 
                        variant="ghost" 
                        disabled={activeSectionIdx === 0}
                        onClick={() => setActiveSectionIdx(prev => prev - 1)}
                        className="rounded-xl font-black uppercase text-[10px] tracking-widest"
                      >
                        Previous Section
                      </Button>
                      <Button 
                        disabled={activeSectionIdx === (viewingProposal?.parsedContent?.sections?.length || 0) - 1}
                        onClick={() => setActiveSectionIdx(prev => prev + 1)}
                        className="rounded-xl font-black uppercase text-[10px] tracking-widest px-10 h-11 shadow-lg shadow-primary/20"
                      >
                        Next: {viewingProposal?.parsedContent?.sections[activeSectionIdx + 1]?.title || 'Finish'}
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>

            <div className="p-8 border-t bg-slate-50 flex items-center justify-between no-print">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Generated via {company?.name || 'DP'} Intelligence Engine • {new Date().getFullYear()}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-xl font-bold h-11 px-6 gap-2" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Download as PDF
                </Button>
                <Button className="rounded-xl font-bold h-11 px-8 shadow-lg shadow-primary/20" onClick={() => setIsViewOpen(false)}>Close Strategy</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .max-w-7xl { max-width: 100% !important; margin: 0 !important; }
          .bg-white { box-shadow: none !important; border: none !important; padding: 0 !important; }
          .h-\[90vh\] { height: auto !important; overflow: visible !important; }
          .overflow-hidden { overflow: visible !important; }
          .print\:overflow-visible { overflow: visible !important; }
          .break-before-page { break-before: page; }
          [role="dialog"] { position: relative !important; overflow: visible !important; }
        }
      `}</style>
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
