
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Search, Filter, MoreHorizontal, Plus, Briefcase, Mail, Phone, Loader2, ExternalLink, Zap, Trash2, Archive, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, getDocs, where, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INDUSTRIES = [
  'Luxury & Lifestyle',
  'E-commerce & D2C',
  'Tech & SaaS',
  'Fintech & Banking',
  'Real Estate & Architecture',
  'Healthcare & Wellness',
  'Gaming & Esports',
  'Automotive',
  'Fashion & Apparel',
  'Hospitality & Tourism',
  'Other'
];

const VERTICALS = [
  'High-Premium Brand Film',
  'Social-First Ads (UGC)',
  'Product Cinematography',
  '3D Animation & VFX',
  'Virtual Production (XR)',
  'Explainer & Educational',
  'Corporate Identity',
  'Event Aftermovie',
  'Documentary Style'
];

export default function ClientsPage() {
  const { profile, isLoading: isTenantLoading, companyId } = useTenant();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  const [clientToArchive, setClientToArchive] = useState<any>(null);
  
  // Onboarding Form State
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newClient, setNewClient] = useState({
    company_name: "",
    industry: "Luxury & Lifestyle",
    service_vertical: "High-Premium Brand Film",
    email: "",
    deal_value: ""
  });

  // Fetch unique client entities from the leads collection
  const clientsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'leads'),
      orderBy('company_name', 'asc')
    );
  }, [db, companyId]);

  const { data: leads, isLoading: isLeadsLoading } = useCollection(clientsQuery);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads.filter(l => 
      l.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.service_vertical?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leads, searchQuery]);

  const handleOnboardClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !newClient.company_name) return;

    setIsSubmitting(true);
    const leadsRef = collection(db, 'companies', companyId, 'leads');
    
    addDocumentNonBlocking(leadsRef, {
      company_id: companyId,
      ...newClient,
      deal_value: parseFloat(newClient.deal_value) || 0,
      stage: 'lead', // Initial CRM stage
      created_at: serverTimestamp(),
    });

    toast({ 
      title: "Client Onboarded", 
      description: `${newClient.company_name} has been added to your directory and pipeline.` 
    });

    setNewClient({ company_name: "", industry: "Luxury & Lifestyle", service_vertical: "High-Premium Brand Film", email: "", deal_value: "" });
    setIsOnboardOpen(false);
    setIsSubmitting(false);
  };

  const handleConfirmArchive = async () => {
    if (!db || !companyId || !clientToArchive) return;

    const client = clientToArchive;
    const archiveRef = collection(db, 'companies', companyId, 'archives');
    
    // 1. Move Client to Archive
    addDocumentNonBlocking(archiveRef, {
      ...client,
      archive_type: 'client',
      archived_at: new Date().toISOString()
    });

    // 2. Cascade: Archive Projects
    try {
      const projectsRef = collection(db, 'companies', companyId, 'projects');
      const q = query(projectsRef, where('client_name', '==', client.company_name));
      const snapshot = await getDocs(q);
      
      snapshot.docs.forEach(projectDoc => {
        addDocumentNonBlocking(archiveRef, {
          ...projectDoc.data(),
          archive_type: 'project',
          archived_at: new Date().toISOString()
        });
        deleteDocumentNonBlocking(doc(db, 'companies', companyId, 'projects', projectDoc.id));
      });
    } catch (e) {
      console.error("Cascade archive failed", e);
    }

    // 3. Delete Original Client
    const clientRef = doc(db, 'companies', companyId, 'leads', client.id);
    deleteDocumentNonBlocking(clientRef);
    
    toast({ 
      title: "Client Archived", 
      description: `"${client.company_name}" and associated projects moved to archives.` 
    });
    setClientToArchive(null);
  };

  if (isTenantLoading || isLeadsLoading) {
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
          <h1 className="text-3xl font-bold text-primary">Client Directory</h1>
          <p className="text-muted-foreground">Manage your relationships and production partners.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter by company..." 
              className="pl-9 h-10 rounded-xl" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsOnboardOpen(true)} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Onboard Client
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No partners found matching your search.</p>
            {!searchQuery && (
              <>
                <p className="text-xs mb-4">Start by onboarding your first client.</p>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setIsOnboardOpen(true)}>Initialize Directory</Button>
              </>
            )}
          </div>
        ) : (
          filteredLeads.map((client) => (
            <Card key={client.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] overflow-hidden group">
              <CardHeader className="bg-primary/5 pb-4 px-6 pt-6">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="text-[9px] font-bold uppercase py-0 bg-white border-none">
                    {client.industry || 'General Media'}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold mt-4 group-hover:text-primary transition-colors">
                  {client.company_name}
                </CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 mt-1">
                  <Zap className="h-3 w-3" /> {client.service_vertical || 'Media Production'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4 bg-white">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{client.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>Pipeline Stage: <span className="font-bold text-primary uppercase text-[10px]">{client.stage}</span></span>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2].map(i => (
                      <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold overflow-hidden">
                        <Image src={`https://picsum.photos/seed/c${client.id+i}/40/40`} width={28} height={28} alt="avatar" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl w-48">
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase text-muted-foreground px-3">Management</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/clients/${client.id}`} className="cursor-pointer gap-2">
                            <ExternalLink className="h-3.5 w-3.5" /> Full Portfolio
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/crm/${client.id}`} className="cursor-pointer gap-2">
                            <Briefcase className="h-3.5 w-3.5" /> CRM Opportunity
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="gap-2 text-rose-500 focus:text-rose-600 focus:bg-rose-50 cursor-pointer" 
                          onClick={() => setClientToArchive(client)}
                        >
                          <Archive className="h-3.5 w-3.5" /> Archive Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Link href={`/clients/${client.id}`}>
                      <Button size="sm" variant="secondary" className="h-8 text-[10px] font-bold uppercase rounded-xl">View Portfolio</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ONBOARD CLIENT DIALOG */}
      <Dialog open={isOnboardOpen} onOpenChange={setIsOnboardOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Onboard New Client
            </DialogTitle>
            <DialogDescription>
              Register a new partner company into your production OS.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOnboardClient} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Client Company Name</Label>
              <Input 
                id="companyName" 
                placeholder="e.g. RedBull Media" 
                value={newClient.company_name}
                onChange={(e) => setNewClient({...newClient, company_name: e.target.value})}
                required
                className="rounded-xl h-11"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select onValueChange={(val) => setNewClient({...newClient, industry: val})} defaultValue="Luxury & Lifestyle">
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(i => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vertical">Vertical</Label>
                <Select onValueChange={(val) => setNewClient({...newClient, service_vertical: val})} defaultValue="High-Premium Brand Film">
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERTICALS.map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Point of Contact Email</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="poc@client.com" 
                value={newClient.email}
                onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Est. Commercial Value (₹)</Label>
              <Input 
                id="value" 
                type="number"
                placeholder="50000" 
                value={newClient.deal_value}
                onChange={(e) => setNewClient({...newClient, deal_value: e.target.value})}
                className="rounded-xl h-11"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Authorize Onboarding
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ARCHIVE DIALOG */}
      <AlertDialog open={!!clientToArchive} onOpenChange={(open) => !open && setClientToArchive(null)}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Client Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move "{clientToArchive?.company_name}" and ALL associated projects to the archives. They will no longer appear in active lists but remain accessible in the ledger.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmArchive}
              className="bg-rose-500 hover:bg-rose-600 rounded-xl"
            >
              Confirm Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
