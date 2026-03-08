
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Building2, Calendar, Search, Loader2, IndianRupee, Sparkles, ExternalLink, ArrowRight, Database, Zap, Trash2, Archive, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { PIPELINE_STAGES } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
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
import { VERTICALS } from "../clients/page";

export default function CRMPage() {
  const { profile, isLoading: isTenantLoading, companyId } = useTenant();
  const db = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadToArchive, setLeadToArchive] = useState<any>(null);

  // Quick Add State
  const [newLead, setNewLead] = useState({
    company_name: "",
    service_vertical: "High-Premium Brand Film",
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

    setNewLead({ company_name: "", service_vertical: "High-Premium Brand Film", industry: "", deal_value: "", stage: "lead" });
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
    <div className="space-y-8 h-full flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">Sales Pipeline</h1>
          <p className="text-muted-foreground">Track opportunities and manage client relations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Find a lead..." className="pl-9 h-10 rounded-xl" />
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Capture Opportunity
                </DialogTitle>
                <DialogDescription>
                  Enter details for a new deal. You can link to an existing client or enter a new one.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddLead} className="space-y-4 py-4">
                <div className="space-y-2 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <Label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                    <Database className="h-3 w-3" /> Link to Existing Client
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
                    className="rounded-xl"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vertical">Service Vertical</Label>
                  <Select 
                    value={newLead.service_vertical} 
                    onValueChange={(val) => setNewLead({...newLead, service_vertical: val})}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select vertical" />
                    </SelectTrigger>
                    <SelectContent>
                      {VERTICALS.map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
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
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stage">Initial Stage</Label>
                    <Select onValueChange={(val) => setNewLead({...newLead, stage: val})} value={newLead.stage}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-11 font-bold">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Register Lead
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
        <div className="flex gap-6 overflow-x-auto pb-6 h-full w-full custom-scrollbar px-1">
          {PIPELINE_STAGES.map((stage) => {
            const leadsInStage = leads?.filter(l => l.stage === stage.id) || [];
            const totalValue = leadsInStage.reduce((sum, l) => sum + (l.deal_value || 0), 0);

            return (
              <div key={stage.id} className="flex flex-col gap-4 min-w-[320px] w-[320px] shrink-0 h-full">
                <div className="flex items-center justify-between px-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm uppercase tracking-wider">{stage.name}</h3>
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold bg-white">{leadsInStage.length}</Badge>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    ₹{(totalValue / 100000).toFixed(1)}L
                  </span>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto pr-2 pb-4 h-full">
                  {leadsInStage.map((lead) => (
                    <Card key={lead.id} className="cursor-pointer hover:ring-2 hover:ring-primary/10 transition-all border-none shadow-sm group shrink-0">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/crm/${lead.id}`} className="flex-1">
                            <span className="text-sm font-bold leading-tight group-hover:text-primary transition-colors block">{lead.company_name}</span>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem asChild>
                                <Link href={`/crm/${lead.id}`} className="flex items-center gap-2">
                                  <ExternalLink className="h-3.5 w-3.5" /> Open Detailed View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/clients/${lead.id}`} className="flex items-center gap-2 text-muted-foreground">
                                  <Building2 className="h-3.5 w-3.5" /> View Production History
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="flex items-center gap-2 text-rose-500 focus:text-rose-600 focus:bg-rose-50" onClick={() => setLeadToArchive(lead)}>
                                <Archive className="h-3.5 w-3.5" /> Archive Lead
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                            <Zap className="h-3.5 w-3.5 text-accent" />
                            <span>{lead.service_vertical || 'General Production'}</span>
                          </div>
                          {lead.scope && lead.scope.length > 0 && (
                            <div className="flex items-center gap-2 text-[10px] text-primary/60 font-bold">
                              <List className="h-3 w-3" />
                              <span>{lead.scope.length} Services Architected</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-1 text-primary font-bold text-sm">
                            <IndianRupee className="h-3 w-3" />
                            <span>{(lead.deal_value || 0).toLocaleString()}</span>
                          </div>
                          <Link href={`/crm/${lead.id}`}>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full group-hover:bg-primary/5">
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button 
                    variant="ghost" 
                    className="w-full border-2 border-dashed border-slate-200 h-24 hover:bg-white hover:border-primary/20 transition-all rounded-2xl group shrink-0"
                    onClick={() => {
                      setNewLead({...newLead, stage: stage.id});
                      setIsAddOpen(true);
                    }}
                  >
                    <Plus className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STABLE ARCHIVE DIALOG */}
      <AlertDialog open={!!leadToArchive} onOpenChange={(open) => !open && setLeadToArchive(null)}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Lead Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the lead "{leadToArchive?.company_name}" to the archives. It will no longer appear in the active sales pipeline but remains accessible in the ledger.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive} className="bg-rose-500 hover:bg-rose-600 rounded-xl">
              Confirm Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 10px;
          border: 3px solid #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}
