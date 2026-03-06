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
  Database
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore";
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
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";
import { generateProposalContent } from "@/ai/flows/generate-proposal-content";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function ProposalsContent() {
  const { profile, isLoading: isTenantLoading, companyId } = useTenant();
  const searchParams = useSearchParams();
  const db = useFirestore();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'input' | 'preview'>('input');

  // Proposal State
  const [newProposal, setNewProposal] = useState({
    title: "",
    client_name: "",
    proposal_number: `PROP-${Date.now().toString().slice(-6)}`,
    content: ""
  });

  const [aiInputs, setAIInputs] = useState({
    servicesRequired: "",
    additionalDetails: ""
  });

  // Listen for research source
  useEffect(() => {
    const source = searchParams.get('source');
    if (source === 'research') {
      const projectName = searchParams.get('projectName') || '';
      const industry = searchParams.get('industry') || '';
      const services = searchParams.get('services') || '';
      const context = searchParams.get('context') || '';

      setNewProposal(prev => ({
        ...prev,
        title: `${projectName} for ${industry}`,
        client_name: industry // Placeholder, can be edited
      }));

      setAIInputs({
        servicesRequired: services,
        additionalDetails: `Strategic Research Context: ${context}`
      });

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
    if (!newProposal.title || !newProposal.client_name || !aiInputs.servicesRequired) {
      toast({ variant: "destructive", title: "Missing Context", description: "Please ensure Project, Client, and Services are defined." });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateProposalContent({
        projectName: newProposal.title,
        clientName: newProposal.client_name,
        servicesRequired: aiInputs.servicesRequired,
        additionalDetails: aiInputs.additionalDetails
      });
      
      setNewProposal(prev => ({ ...prev, content: result.content }));
      setGenerationStep('preview');
      toast({ title: "Draft Synthesized", description: "Your AI-powered proposal is ready for review." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "AI Generation Failed" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newProposal.title) return;

    setIsSubmitting(true);
    const proposalsRef = collection(db, 'companies', companyId, 'proposals');
    
    addDocumentNonBlocking(proposalsRef, {
      company_id: companyId,
      ...newProposal,
      status: 'draft',
      created_at: serverTimestamp(),
    });

    toast({
      title: "Proposal Generated",
      description: `${newProposal.title} has been added to your drafts.`,
    });

    setNewProposal({ 
      title: "", 
      client_name: "", 
      proposal_number: `PROP-${Date.now().toString().slice(-6)}`, 
      content: "" 
    });
    setAIInputs({ servicesRequired: "", additionalDetails: "" });
    setGenerationStep('input');
    setIsAddOpen(false);
    setIsSubmitting(false);
  };

  if (isTenantLoading || isProposalsLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Sales Proposals</h1>
          <p className="text-muted-foreground">Generate, manage, and track client project proposals.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Find a proposal..." className="pl-9 h-10 rounded-xl" />
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> New Proposal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-slate-900 text-white p-8 md:p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-12 w-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black">Proposal Wizard</DialogTitle>
                    <DialogDescription className="text-slate-400 text-xs">AI-Assisted Production Drafting</DialogDescription>
                  </div>
                </div>

                {generationStep === 'input' ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {/* Smart Link Section */}
                    <div className="space-y-2 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                      <Label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                        <Database className="h-3 w-3" /> Smart Link from CRM
                      </Label>
                      <Select onValueChange={(val) => {
                        const lead = leads?.find(l => l.id === val);
                        if (lead) {
                          setNewProposal(prev => ({
                            ...prev,
                            client_name: lead.company_name,
                            title: `${lead.company_name} - ${new Date().getFullYear()} Project`
                          }));
                          // Preload services from service vertical
                          setAIInputs(prev => ({
                            ...prev,
                            servicesRequired: lead.service_vertical ? `${lead.service_vertical} Production Services` : ""
                          }));
                          toast({ title: "Lead Connected", description: `Drafting for ${lead.company_name} (${lead.service_vertical || 'General Production'}).` });
                        }
                      }}>
                        <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-10 text-xs text-slate-300">
                          <SelectValue placeholder="Select active lead to fetch data..." />
                        </SelectTrigger>
                        <SelectContent>
                          {leads?.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">No active leads found.</div>
                          ) : (
                            leads?.map((lead) => (
                              <SelectItem key={lead.id} value={lead.id} className="text-xs">
                                {lead.company_name} (Vertical: {lead.service_vertical || 'N/A'})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Project Title</Label>
                        <Input 
                          placeholder="e.g. Summer Brand Film" 
                          value={newProposal.title}
                          onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                          className="bg-white/5 border-white/10 rounded-xl h-11 text-white focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Target Client</Label>
                        <Input 
                          placeholder="e.g. Nike Global" 
                          value={newProposal.client_name}
                          onChange={(e) => setNewProposal({...newProposal, client_name: e.target.value})}
                          className="bg-white/5 border-white/10 rounded-xl h-11 text-white focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Services Required</Label>
                      <Textarea 
                        placeholder="Detail the scope of production..." 
                        value={aiInputs.servicesRequired}
                        onChange={(e) => setAIInputs({...aiInputs, servicesRequired: e.target.value})}
                        className="bg-white/5 border-white/10 rounded-xl min-h-[100px] text-white focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Additional Context (Optional)</Label>
                      <Textarea 
                        placeholder="Strategic trends, client pain points..." 
                        value={aiInputs.additionalDetails}
                        onChange={(e) => setAIInputs({...aiInputs, additionalDetails: e.target.value})}
                        className="bg-white/5 border-white/10 rounded-xl min-h-[80px] text-white focus:ring-indigo-500"
                      />
                    </div>

                    <div className="pt-4 flex gap-3">
                      <Button 
                        onClick={handleGenerateAI} 
                        disabled={isGenerating}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2"
                      >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        Generate with AI
                      </Button>
                      <Button 
                        onClick={() => setIsAddOpen(false)}
                        variant="outline"
                        className="bg-transparent border-white/10 text-white hover:bg-white/5 rounded-2xl h-12"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 relative overflow-hidden">
                      <BrainCircuit className="absolute -top-4 -right-4 h-24 w-24 opacity-5 text-indigo-400" />
                      <h3 className="text-xs font-black uppercase text-indigo-400 mb-4 flex items-center gap-2">
                        <Sparkles className="h-3 w-3" /> AI Draft Preview
                      </h3>
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="text-xs leading-relaxed text-slate-300 whitespace-pre-line font-medium italic">
                          {newProposal.content}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={handleCreateProposal} 
                        disabled={isSubmitting}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                        Commit to Ledger
                      </Button>
                      <Button 
                        onClick={() => setGenerationStep('input')}
                        variant="outline"
                        className="bg-transparent border-white/10 text-white hover:bg-white/5 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest"
                      >
                        Edit Inputs
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {proposals?.length === 0 ? (
          <Card className="border-2 border-dashed flex flex-col items-center justify-center p-12 text-muted-foreground bg-white/50 rounded-3xl">
            <FileText className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-medium text-sm">No proposals generated yet.</p>
            <Button variant="link" className="mt-2" onClick={() => setIsAddOpen(true)}>Launch Proposal Wizard</Button>
          </Card>
        ) : (
          proposals?.map((prop) => (
            <Card key={prop.id} className="hover:shadow-md transition-all border-none shadow-sm group rounded-[2rem] overflow-hidden bg-white">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{prop.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Ref: {prop.proposal_number} • Client: {prop.client_name || 'Private'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Status</span>
                    <Badge variant={prop.status === 'accepted' ? 'default' : prop.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[9px] uppercase font-bold">
                      {prop.status}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Date</span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {prop.created_at?.toDate ? prop.created_at.toDate().toLocaleDateString() : 'Just now'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button className="rounded-xl text-xs h-9 px-6 font-bold shadow-lg shadow-primary/10">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
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
