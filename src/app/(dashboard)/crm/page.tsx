
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  MoreHorizontal, 
  Building2, 
  Search, 
  Loader2, 
  IndianRupee, 
  Sparkles, 
  ExternalLink, 
  ArrowRight, 
  Database, 
  Zap, 
  Archive, 
  List,
  Target
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { PIPELINE_STAGES } from "@/lib/mock-data";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
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
import { CONTENT_VERTICALS } from "../clients/page";

export default function CRMPage() {
  const { profile, isLoading: isTenantLoading, companyId } = useTenant();
  const db = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadToArchive, setLeadToArchive] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Quick Add State
  const [newLead, setNewLead] = useState({
    company_name: "",
    service_vertical: "Advertising & Brand Films",
    industry: "",
    deal_value: "",
    stage: "lead"
  });

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'leads'),
      orderBy('created_at', 'desc')
    );
  }, [db, companyId]);

  const { data: leads, isLoading: isLeadsLoading } = useCollection(leadsQuery);

  // Derived: Unique existing clients for the dropdown
  const uniqueClients = useMemo(() => {
    if (!leads) return [];
    const names = new Set();
    const unique = [];
    for (const lead of leads) {
      if (!names.has(lead.company_name)) {
        names.add(lead.company_name);
        unique.push({
          id: lead.id,
          name: lead.company_name,
          industry: lead.industry
        });
      }
    }
    return unique.sort((a, b) => a.name.localeCompare(b.name));
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads.filter(l => 
      l.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.service_vertical?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leads, searchQuery]);

  const handleSelectExistingClient = (clientId: string) => {
    const client = uniqueClients.find(c => c.id === clientId);
    if (client) {
      setNewLead({
        ...newLead,
        company_name: client.name,
        industry: client.industry || "",
      });
      toast({
        title: "Client Linked",
        description: `Adding a new deal for ${client.name}.`,
      });
    }
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newLead.company_name) return;

    setIsSubmitting(true);
    const leadsRef = collection(db, 'companies', companyId, 'leads');
    
    addDocumentNonBlocking(leadsRef, {
      company_id: companyId,
      ...newLead,
      deal_value: parseFloat(newLead.deal_value) || 0,
      created_at: serverTimestamp(),
    });

    toast({
      title: "Lead Captured",
      description: `${newLead.company_name} has been added to your pipeline.`,
    });

    setNewLead({ company_name: "", service_vertical: "Advertising & Brand Films", industry: "", deal_value: "", stage: "lead" });
    setIsAddOpen(false);
    setIsSubmitting(false);
  };

  const handleConfirmArchive = () => {
    if (!db || !companyId || !leadToArchive) return;
    
    const archiveRef = collection(db, 'companies', companyId, 'archives');
    addDocumentNonBlocking(archiveRef, {
      ...leadToArchive,
      archive_type: 'lead',
      archived_at: new Date().toISOString()
    });

    const leadRef = doc(db, 'companies', companyId, 'leads', leadToArchive.id);
    deleteDocumentNonBlocking(leadRef);
    toast({ title: "Opportunity Archived", description: "The lead has been moved to archives." });
    setLeadToArchive(null);
  };

  if (isTenantLoading || isLeadsLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header Section - Sticky & Fixed */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 bg-background pb-4 border-b z-20">
        <div>
          <h1 className="text-3xl font-bold text-primary">Sales Pipeline</h1>
          <p className="text-muted-foreground text-sm">Track opportunities and manage client relations.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Find a lead..." 
              className="pl-9 h-10 rounded-xl bg-white shadow-sm border-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl shadow-xl shadow-primary/30 h-10 px-6 font-bold">
                <Plus className="h-4 w-4" /> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                  <Sparkles className="h-6 w-6 text-accent" />
                  Capture Opportunity
                </DialogTitle>
                <DialogDescription>
                  Enter details for a new deal. Link to an existing client or register a new one.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddLead} className="space-y-5 py-4">
                <div className="space-y-2 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <Label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2 mb-2">
                    <Database className="h-3 w-3" /> Link to Existing Partner
                  </Label>
                  <Select onValueChange={handleSelectExistingClient}>
                    <SelectTrigger className="rounded-xl h-9 bg-white shadow-none text-xs border-indigo-100">
                      <SelectValue placeholder="Select from your directory..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueClients.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">No existing clients found.</div>
                      ) : (
                        uniqueClients.map((client) => (
                          <SelectItem key={client.id} value={client.id} className="text-xs">
                            {client.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Client Company</Label>
                  <Input 
                    id="companyName" 
                    placeholder="e.g. RedBull Media" 
                    value={newLead.company_name}
                    onChange={(e) => setNewLead({...newLead, company_name: e.target.value})}
                    required
                    className="rounded-xl h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vertical">Service Vertical</Label>
                  <Select 
                    value={newLead.service_vertical} 
                    onValueChange={(val) => setNewLead({...newLead, service_vertical: val})}
                  >
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Select vertical" />
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
                    <Label htmlFor="value">Deal Value (₹)</Label>
                    <Input 
                      id="value" 
                      type="number"
                      placeholder="25000" 
                      value={newLead.deal_value}
                      onChange={(e) => setNewLead({...newLead, deal_value: e.target.value})}
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stage">Initial Stage</Label>
                    <Select onValueChange={(val) => setNewLead({...newLead, stage: val})} value={newLead.stage}>
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Register Opportunity
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board - Horizontal Scroll Optimized */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar pb-6">
          <div className="flex h-full gap-6 w-max min-w-full">
            {PIPELINE_STAGES.map((stage) => {
              const leadsInStage = filteredLeads.filter(l => l.stage === stage.id);
              const totalValue = leadsInStage.reduce((sum, l) => sum + (l.deal_value || 0), 0);

              return (
                <div 
                  key={stage.id} 
                  className="flex flex-col gap-4 w-[320px] shrink-0 h-full bg-slate-50/50 rounded-[2rem] p-3 border border-slate-200/50"
                >
                  {/* Stage Header */}
                  <div className="flex items-center justify-between px-3 shrink-0 py-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2.5 w-2.5 rounded-full", stage.color || 'bg-slate-200')} />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-slate-600">{stage.name}</h3>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-black bg-white border border-slate-100 shadow-sm">{leadsInStage.length}</Badge>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground bg-white px-2 py-0.5 rounded-full shadow-sm">
                      ₹{(totalValue / 100000).toFixed(1)}L
                    </span>
                  </div>

                  {/* Column Content - Vertical Scroll within Column */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 pb-4">
                    {leadsInStage.map((lead) => (
                      <Card key={lead.id} className="hover:ring-2 hover:ring-primary/10 transition-all border-none shadow-sm group bg-white rounded-2xl">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/crm/${lead.id}`} className="flex-1">
                              <span className="text-sm font-bold leading-tight group-hover:text-primary transition-colors block line-clamp-2">{lead.company_name}</span>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-lg hover:bg-slate-50">
                                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl w-52 shadow-2xl border-slate-100">
                                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 px-3 py-2 tracking-widest">Opportunity Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild className="rounded-lg m-1 py-2 cursor-pointer">
                                  <Link href={`/crm/${lead.id}`} className="flex items-center gap-2">
                                    <Target className="h-3.5 w-3.5" /> Open Pipeline
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="rounded-lg m-1 py-2 cursor-pointer">
                                  <Link href={`/clients/${lead.id}`} className="flex items-center gap-2 text-slate-500">
                                    <Building2 className="h-3.5 w-3.5" /> View Portfolio
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-50" />
                                <DropdownMenuItem className="rounded-lg m-1 py-2 cursor-pointer text-rose-500 focus:text-rose-600 focus:bg-rose-50" onClick={() => setLeadToArchive(lead)}>
                                  <Archive className="h-3.5 w-3.5" /> Archive Lead
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                              <Zap className="h-3.5 w-3.5 text-accent" />
                              <span className="truncate">{lead.service_vertical || 'General Production'}</span>
                            </div>
                            {lead.scope && lead.scope.length > 0 && (
                              <div className="flex items-center gap-2 text-[9px] text-primary/60 font-black uppercase tracking-widest">
                                <List className="h-3 w-3" />
                                <span>{lead.scope.length} Briefed</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-1 text-primary font-black text-xs bg-primary/5 px-2 py-1 rounded-lg">
                              <IndianRupee className="h-3 w-3" />
                              <span>{(lead.deal_value || 0).toLocaleString()}</span>
                            </div>
                            <Link href={`/crm/${lead.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 group/btn transition-colors">
                                <ArrowRight className="h-4 w-4 text-slate-300 group-hover/btn:text-primary" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Quick Add Placeholder */}
                    <Button 
                      variant="ghost" 
                      className="w-full border-2 border-dashed border-slate-200 h-24 hover:bg-white hover:border-primary/20 hover:shadow-sm transition-all rounded-2xl group shrink-0"
                      onClick={() => {
                        setNewLead({...newLead, stage: stage.id});
                        setIsAddOpen(true);
                      }}
                    >
                      <div className="flex flex-col items-center gap-1 text-slate-300 group-hover:text-primary">
                        <Plus className="h-5 w-5" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Quick Add Lead</span>
                      </div>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Archive Confirmation */}
      <AlertDialog open={!!leadToArchive} onOpenChange={(open) => !open && setLeadToArchive(null)}>
        <AlertDialogContent className="rounded-[2rem] p-8">
          <AlertDialogHeader>
            <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4">
              <Archive className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold">Archive Lead Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              This will move "{leadToArchive?.company_name}" to your archives. It will no longer appear in the active sales pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive} className="bg-rose-500 hover:bg-rose-600 rounded-xl h-11 font-bold px-8">
              Confirm Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
