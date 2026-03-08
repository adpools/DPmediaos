
"use client";

import { use, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  ArrowLeft, 
  Loader2, 
  IndianRupee, 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  Mail, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  MapPin, 
  Zap, 
  Edit3, 
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/use-tenant";
import { useDoc, useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { doc, serverTimestamp, query, collection, where, orderBy } from "firebase/firestore";
import { updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PIPELINE_STAGES } from "@/lib/mock-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CONTENT_VERTICALS } from "../../clients/page";

export default function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = use(params);
  const { companyId, isLoading: isTenantLoading } = useTenant();
  const db = useFirestore();
  const router = useRouter();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    company_name: "",
    service_vertical: "",
    industry: "",
    deal_value: ""
  });

  // 1. Fetch Lead Details
  const leadRef = useMemoFirebase(() => {
    if (!db || !companyId || !leadId) return null;
    return doc(db, 'companies', companyId, 'leads', leadId);
  }, [db, companyId, leadId]);

  const { data: lead, isLoading: isLeadLoading } = useDoc(leadRef);

  // 2. Fetch Proposals linked to this lead
  const proposalsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !leadId) return null;
    return query(
      collection(db, 'companies', companyId, 'proposals'),
      where('lead_id', '==', leadId),
      orderBy('created_at', 'desc')
    );
  }, [db, companyId, leadId]);

  const { data: proposals, isLoading: isProposalsLoading } = useCollection(proposalsQuery);

  // Sync edit form with lead data when opened
  useEffect(() => {
    if (lead && isEditOpen) {
      setEditForm({
        company_name: lead.company_name || "",
        service_vertical: lead.service_vertical || "Advertising & Brand Films",
        industry: lead.industry || "",
        deal_value: lead.deal_value?.toString() || ""
      });
    }
  }, [lead, isEditOpen]);

  const handleUpdateStage = (newStage: string) => {
    if (!leadRef || !lead) return;
    
    updateDocumentNonBlocking(leadRef, { 
      stage: newStage,
      updatedAt: serverTimestamp() 
    });

    // Conversion Logic: If Won, create a Project
    if (newStage === 'won') {
      const projectsRef = collection(db, 'companies', companyId!, 'projects');
      const projectRefCode = `PROJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      addDocumentNonBlocking(projectsRef, {
        company_id: companyId,
        project_name: lead.company_name,
        client_name: lead.company_name,
        project_ref: projectRefCode,
        budget: lead.deal_value || 0,
        status: 'in_progress',
        progress: 0,
        color: 'card-pink',
        created_at: serverTimestamp(),
      });

      toast({ 
        title: "Deal Closed & Project Initialized", 
        description: `"${lead.company_name}" has been converted into an active production workspace.` 
      });
    } else {
      toast({ title: "Deal Progressed", description: `Lead moved to ${newStage.toUpperCase()}` });
    }
  };

  const handleUpdateAddress = (e: React.FormEvent<HTMLDivElement>) => {
    // Note: React.FormEvent<HTMLFormElement> is correct, but the type in the component was used on a form
    // Fixing to proper submission handler
  };

  const handleUpdateAddressSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!leadRef || !lead) return;
    const formData = new FormData(e.currentTarget);
    const address = formData.get('billing_address') as string;
    const gstin = formData.get('gstin') as string;

    updateDocumentNonBlocking(leadRef, { 
      billing_address: address,
      gstin: gstin,
      updatedAt: serverTimestamp() 
    });
    
    toast({ title: "Client Data Saved", description: "Billing address and GST updated." });
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadRef || !lead) return;

    updateDocumentNonBlocking(leadRef, {
      company_name: editForm.company_name,
      service_vertical: editForm.service_vertical,
      industry: editForm.industry,
      deal_value: parseFloat(editForm.deal_value) || 0,
      updatedAt: serverTimestamp()
    });
    
    toast({ title: "Details Updated", description: "Opportunity record has been synced." });
    setIsEditOpen(false);
  };

  if (isTenantLoading || isLeadLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Opportunity not found</h2>
        <Button variant="link" onClick={() => router.push("/crm")}>Back to Pipeline</Button>
      </div>
    );
  }

  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === lead.stage);
  const progressValue = ((currentStageIndex + 1) / PIPELINE_STAGES.length) * 100;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.push("/crm")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">{lead.company_name}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Opportunity ID: <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded uppercase">{leadId.slice(0,8)}</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link href={`/clients/${leadId}`} className="hidden sm:block">
            <Button variant="outline" className="rounded-xl text-xs h-9 gap-2">
              <Building2 className="h-3.5 w-3.5" /> Full Portfolio
            </Button>
          </Link>
          <Button 
            className="rounded-xl text-xs h-9 shadow-lg shadow-primary/20 gap-2"
            onClick={() => setIsEditOpen(true)}
          >
            <Edit3 className="h-3.5 w-3.5" /> Edit Details
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Status Tracker */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Deal Progression</CardTitle>
                  <CardDescription>Current stage in the sales lifecycle</CardDescription>
                </div>
                <Select onValueChange={handleUpdateStage} defaultValue={lead.stage}>
                  <SelectTrigger className="w-[180px] rounded-xl h-10">
                    <SelectValue placeholder="Move Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Pipeline Velocity</span>
                  <span className="text-xl font-bold">{Math.round(progressValue)}%</span>
                </div>
                <Progress value={progressValue} className="h-2 rounded-full" />
              </div>
              
              <div className="flex flex-col gap-6 relative px-2">
                {PIPELINE_STAGES.map((s, idx) => {
                  const isCompleted = idx <= currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  const isLast = idx === PIPELINE_STAGES.length - 1;
                  
                  return (
                    <div key={s.id} className="flex gap-6 relative group">
                      {!isLast && (
                        <div className={cn(
                          "absolute left-[15px] top-8 w-0.5 h-[calc(100%+8px)] z-0",
                          idx < currentStageIndex ? "bg-primary" : "bg-slate-100"
                        )} />
                      )}
                      
                      <div className={cn(
                        "relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500",
                        isCompleted 
                          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                          : "bg-slate-100 text-slate-300"
                      )}>
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      
                      <div className="flex flex-col gap-1 pt-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-[11px] font-black uppercase tracking-widest transition-colors",
                            isCompleted ? "text-primary" : "text-slate-400"
                          )}>
                            {s.name}
                          </span>
                          {isCurrent && (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[8px] h-4">ACTIVE</Badge>
                          )}
                        </div>
                        {isCompleted && (
                          <div className="space-y-3">
                            <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed">
                              Stage reached successfully.
                            </p>
                            {s.id === 'meeting' && (
                              <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                                <Link href={`/proposals?source=crm&leadId=${leadId}&companyName=${encodeURIComponent(lead.company_name)}&vertical=${encodeURIComponent(lead.service_vertical || '')}&industry=${encodeURIComponent(lead.industry || '')}`}>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 text-[9px] font-black uppercase tracking-widest gap-2 rounded-xl border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all shadow-sm"
                                  >
                                    <Sparkles className="h-3 w-3 text-accent" /> 
                                    Create Proposal
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Drafted Proposals Section */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="bg-indigo-50/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Drafted Proposals
              </CardTitle>
              <CardDescription>AI-generated proposals linked to this opportunity.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isProposalsLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : proposals?.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground italic text-xs">
                  No proposals generated yet. Reach the "Meeting" stage to launch the AI Architect.
                </div>
              ) : (
                <div className="divide-y">
                  {proposals?.map(prop => (
                    <div key={prop.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{prop.title}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase">{prop.proposal_number} • {prop.status}</p>
                        </div>
                      </div>
                      <Link href={`/proposals`}>
                        <Button variant="ghost" size="sm" className="rounded-xl h-8 text-[10px] font-bold uppercase tracking-wider gap-2">
                          Manage <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Context */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Billing Context
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateAddressSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gstin" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">GSTIN (Optional)</Label>
                  <Input id="gstin" name="gstin" placeholder="e.g. 32AAQCM8450P1ZQ" defaultValue={lead.gstin} className="rounded-xl font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_address" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detailed Billing Address</Label>
                  <Textarea id="billing_address" name="billing_address" placeholder="Address..." defaultValue={lead.billing_address} className="rounded-xl min-h-[100px] text-sm" />
                </div>
                <Button type="submit" className="rounded-xl font-bold px-8">Save Context</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Commercials Card */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white">
            <CardHeader>
              <CardTitle className="text-base uppercase tracking-widest text-muted-foreground font-bold">Commercials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Est. Deal Value</p>
                  <h4 className="text-3xl font-bold flex items-center gap-1">
                    <IndianRupee className="h-5 w-5 text-primary" />
                    {(lead.deal_value || 0).toLocaleString()}
                  </h4>
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 uppercase text-[9px] font-bold">Active Deal</Badge>
              </div>
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Probability</span>
                  <span className="font-bold">{lead.stage === 'won' ? '100%' : lead.stage === 'negotiation' ? '85%' : '45%'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Expected Close</span>
                  <span className="font-bold">Mar 30, 2024</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deal Context */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Deal Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-accent/5 flex items-center justify-center text-accent">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-base leading-none">{lead.service_vertical || 'General Production'}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase font-bold tracking-tighter">Service Vertical</p>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3 text-xs">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Industry: {lead.industry || 'Media Production'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Lead Source: Referral</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Created: {lead.created_at?.toDate ? lead.created_at.toDate().toLocaleDateString() : 'Just now'}</span>
                </div>
              </div>
              <Button 
                variant="secondary" 
                className="w-full rounded-xl h-10 text-xs font-bold uppercase tracking-wider"
                onClick={() => setIsEditOpen(true)}
              >
                Update Context
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Edit Opportunity
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveDetails} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={editForm.company_name} onChange={(e) => setEditForm({...editForm, company_name: e.target.value})} required className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Service Vertical</Label>
              <Select value={editForm.service_vertical} onValueChange={(val) => setEditForm({...editForm, service_vertical: val})}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_VERTICALS.map(v => (
                    <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={editForm.industry} onChange={(e) => setEditForm({...editForm, industry: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Deal Value (₹)</Label>
                <Input type="number" value={editForm.deal_value} onChange={(e) => setEditForm({...editForm, deal_value: e.target.value})} className="rounded-xl" />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full rounded-xl h-11 font-bold">Save Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
