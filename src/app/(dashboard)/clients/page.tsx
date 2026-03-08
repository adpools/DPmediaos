
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Plus, 
  Briefcase, 
  Mail, 
  Phone, 
  Loader2, 
  ExternalLink, 
  Zap, 
  Trash2, 
  Archive, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Package,
  Megaphone,
  Smartphone,
  Home,
  Ticket,
  Rocket,
  Film,
  Mic,
  BookOpen,
  Play,
  Scissors
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export const INDUSTRIES = [
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

export const CONTENT_VERTICALS = [
  { id: 'advertising', name: 'Advertising & Brand Films', icon: Megaphone, color: 'bg-rose-500', 
    services: ['TV Commercials', 'Digital Ads', 'Brand Story Films', 'Product Launch Ads', 'Festival Campaign Ads', 'Luxury Brand Commercials'] 
  },
  { id: 'ecommerce', name: 'Product & E-commerce', icon: Package, color: 'bg-blue-500', 
    services: ['Product Commercial Videos', 'Amazon Product Videos', 'Flipkart Listing Videos', 'Product Demo Videos', 'Unboxing Videos', 'Product Photography'] 
  },
  { id: 'social', name: 'Social Media Content', icon: Smartphone, color: 'bg-purple-500', 
    services: ['Instagram Reels', 'YouTube Shorts', 'Influencer Content', 'Social Media Ad Creatives', 'Monthly Content Packages'] 
  },
  { id: 'corporate', name: 'Corporate Videos', icon: Building2, color: 'bg-slate-700', 
    services: ['Company Profile Video', 'Corporate Brand Film', 'Recruitment Video', 'Training Video', 'Investor Presentation Video', 'CEO Interview Video'] 
  },
  { id: 'realestate', name: 'Real Estate Videos', icon: Home, color: 'bg-emerald-600', 
    services: ['Property Walkthrough Video', 'Luxury Property Ads', 'Drone Property Tour', 'Architecture Showcase', 'Construction Progress Video'] 
  },
  { id: 'events', name: 'Event Videos', icon: Ticket, color: 'bg-amber-500', 
    services: ['Event Coverage', 'Conference Highlight Video', 'Event Aftermovie', 'Product Launch Event Video', 'Brand Activation Coverage'] 
  },
  { id: 'startups', name: 'Startup & App Videos', icon: Rocket, color: 'bg-cyan-500', 
    services: ['App Explainer Video', 'SaaS Product Demo', 'Startup Pitch Video', 'UI Demo Video', 'Animated Explainer Video'] 
  },
  { id: 'entertainment', name: 'Entertainment Production', icon: Film, color: 'bg-indigo-600', 
    services: ['Music Video', 'Short Film', 'Fashion Film', 'Web Series', 'Creative Campaign Video'] 
  },
  { id: 'podcasts', name: 'Podcast & Interviews', icon: Mic, color: 'bg-orange-500', 
    services: ['Video Podcast Production', 'Interview Video', 'Customer Testimonial Video', 'Founder Story Video'] 
  },
  { id: 'educational', name: 'Educational Content', icon: BookOpen, color: 'bg-lime-600', 
    services: ['Online Course Video', 'Training Modules', 'Educational Explainer Video', 'Coaching Center Promo'] 
  },
  { id: 'animation', name: 'Animation & Motion', icon: Play, color: 'bg-red-500', 
    services: ['Motion Graphics Video', '2D Animation', '3D Animation', 'Infographic Animation'] 
  },
  { id: 'post', name: 'Post Production', icon: Scissors, color: 'bg-slate-500', 
    services: ['Video Editing', 'Color Grading', 'Sound Design', 'Visual Effects (VFX)', 'Subtitles'] 
  },
  { id: 'ai', name: 'AI Generated Content', icon: Sparkles, color: 'bg-fuchsia-500', 
    services: ['AI Commercials', 'AI Product Ads', 'AI Fashion Campaigns', 'AI Cinematic Videos', 'AI Social Media Ads'] 
  },
];

export default function ClientsPage() {
  const { profile, isLoading: isTenantLoading, companyId } = useTenant();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  const [clientToArchive, setClientToArchive] = useState<any>(null);
  
  // Onboarding Form State
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [onboardStep, setOnboardStep] = useState<'info' | 'services'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newClient, setNewClient] = useState({
    company_name: "",
    industry: "Luxury & Lifestyle",
    email: "",
    deal_value: ""
  });

  const [selectedVerticalId, setSelectedVerticalId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Record<string, string[]>>({});

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

  const activeVertical = useMemo(() => 
    CONTENT_VERTICALS.find(v => v.id === selectedVerticalId), 
  [selectedVerticalId]);

  const totalServicesCount = useMemo(() => 
    Object.values(selectedServices).flat().length, 
  [selectedServices]);

  const toggleService = (verticalId: string, service: string) => {
    setSelectedServices(prev => {
      const current = prev[verticalId] || [];
      const updated = current.includes(service)
        ? current.filter(s => s !== service)
        : [...current, service];
      
      const newMap = { ...prev };
      if (updated.length === 0) {
        delete newMap[verticalId];
      } else {
        newMap[verticalId] = updated;
      }
      return newMap;
    });
  };

  const handleOnboardClient = async () => {
    if (!companyId || !newClient.company_name) return;

    setIsSubmitting(true);
    const leadsRef = collection(db, 'companies', companyId, 'leads');
    
    // Aggregate all selected services
    const primaryVertical = activeVertical?.name || "General Production";
    const allServices = Object.values(selectedServices).flat();

    try {
      await addDocumentNonBlocking(leadsRef, {
        company_id: companyId,
        ...newClient,
        service_vertical: primaryVertical,
        scope: allServices,
        deal_value: parseFloat(newClient.deal_value) || 0,
        stage: 'lead',
        created_at: serverTimestamp(),
      });

      toast({ 
        title: "Client Onboarded", 
        description: `${newClient.company_name} has been added with ${allServices.length} planned services.` 
      });

      resetOnboarding();
    } catch (error) {
      console.error("Onboarding failed:", error);
      toast({ variant: "destructive", title: "Registration Error", description: "Failed to save client profile." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOnboarding = () => {
    setNewClient({ company_name: "", industry: "Luxury & Lifestyle", email: "", deal_value: "" });
    setSelectedVerticalId(null);
    setSelectedServices({});
    setOnboardStep('info');
    setIsOnboardOpen(false);
  };

  const handleConfirmArchive = async () => {
    if (!db || !companyId || !clientToArchive) return;

    const client = clientToArchive;
    const archiveRef = collection(db, 'companies', companyId, 'archives');
    
    addDocumentNonBlocking(archiveRef, {
      ...client,
      archive_type: 'client',
      archived_at: new Date().toISOString()
    });

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

    const clientRef = doc(db, 'companies', companyId, 'leads', client.id);
    deleteDocumentNonBlocking(clientRef);
    
    toast({ 
      title: "Client Archived", 
      description: `"${client.company_name}" moved to archives.` 
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
              <Button variant="outline" size="sm" className="rounded-xl mt-4" onClick={() => setIsOnboardOpen(true)}>Initialize Directory</Button>
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
                    <span>Stage: <span className="font-bold text-primary uppercase text-[10px]">{client.stage}</span></span>
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
                        <DropdownMenuItem asChild>
                          <Link href={`/clients/${client.id}`} className="cursor-pointer gap-2">
                            <ExternalLink className="h-3.5 w-3.5" /> Portfolio
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/crm/${client.id}`} className="cursor-pointer gap-2">
                            <Briefcase className="h-3.5 w-3.5" /> CRM Opportunity
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-rose-500" onClick={() => setClientToArchive(client)}>
                          <Archive className="h-3.5 w-3.5" /> Archive Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Link href={`/clients/${client.id}`}>
                      <Button size="sm" variant="secondary" className="h-8 text-[10px] font-bold uppercase rounded-xl">Portfolio</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ONBOARD CLIENT DIALOG - INTEGRATED SERVICE BUILDER */}
      <Dialog open={isOnboardOpen} onOpenChange={(open) => !open && resetOnboarding()}>
        <DialogContent className="sm:max-w-[1000px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl h-[90vh] max-h-[900px]">
          <div className="flex flex-col h-full bg-white">
            <div className="p-8 border-b bg-primary/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black">Strategic Client Onboarding</DialogTitle>
                  <DialogDescription>Register partner and architect initial production scope.</DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", onboardStep === 'info' ? "bg-primary" : "bg-slate-200")} />
                <div className={cn("h-2 w-2 rounded-full", onboardStep === 'services' ? "bg-primary" : "bg-slate-200")} />
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {onboardStep === 'info' ? (
                <div className="flex-1 p-10 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Company Identity</Label>
                      <Input 
                        id="companyName" 
                        placeholder="e.g. RedBull Media House" 
                        value={newClient.company_name}
                        onChange={(e) => setNewClient({...newClient, company_name: e.target.value})}
                        required
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Market Industry</Label>
                      <Select onValueChange={(val) => setNewClient({...newClient, industry: val})} value={newClient.industry}>
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Primary Contact Email</Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="poc@client.com" 
                        value={newClient.email}
                        onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="value" className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Est. Account Value (₹)</Label>
                      <Input 
                        id="value" 
                        type="number"
                        placeholder="50000" 
                        value={newClient.deal_value}
                        onChange={(e) => setNewClient({...newClient, deal_value: e.target.value})}
                        className="rounded-xl h-12"
                      />
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      All new clients are automatically added to your <strong>Sales Pipeline</strong> at the "Lead" stage for tracking.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex-1 flex flex-col p-8 bg-slate-50/50 overflow-hidden">
                    <div className="mb-6 shrink-0">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Select Content Vertical</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {CONTENT_VERTICALS.map((vertical) => (
                          <Card 
                            key={vertical.id}
                            className={cn(
                              "cursor-pointer transition-all duration-300 border-2 rounded-2xl group",
                              selectedVerticalId === vertical.id 
                                ? "border-primary shadow-lg ring-4 ring-primary/5 bg-white" 
                                : "border-transparent hover:border-slate-200 bg-white"
                            )}
                            onClick={() => setSelectedVerticalId(vertical.id)}
                          >
                            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white", vertical.color)}>
                                <vertical.icon className="h-4 w-4" />
                              </div>
                              <span className="text-[9px] font-black leading-tight uppercase tracking-tight">{vertical.name}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Configure Production Services</h3>
                      {activeVertical ? (
                        <ScrollArea className="flex-1 pr-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                            {activeVertical.services.map((service) => {
                              const isSelected = selectedServices[activeVertical.id]?.includes(service);
                              return (
                                <div 
                                  key={service}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                                    isSelected 
                                      ? "bg-primary/5 border-primary/20" 
                                      : "bg-white border-slate-100 hover:border-slate-200"
                                  )}
                                  onClick={() => toggleService(activeVertical.id, service)}
                                >
                                  <Checkbox checked={isSelected} className="h-4 w-4 rounded" />
                                  <p className={cn("text-[11px] font-bold", isSelected ? "text-primary" : "text-slate-600")}>{service}</p>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl text-muted-foreground opacity-40">
                          <Zap className="h-10 w-10 mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Select a vertical above</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <aside className="w-80 border-l bg-white flex flex-col shrink-0">
                    <div className="p-6 border-b bg-slate-50/50 shrink-0">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Scope Synthesis</h4>
                      <p className="text-xs font-bold text-slate-700">Project Brief Summary</p>
                    </div>
                    <ScrollArea className="flex-1 p-6">
                      <div className="space-y-6">
                        {totalServicesCount === 0 ? (
                          <div className="text-center py-12 text-[10px] font-bold text-slate-300 uppercase tracking-widest">No services selected</div>
                        ) : (
                          Object.entries(selectedServices).map(([vId, services]) => {
                            const v = CONTENT_VERTICALS.find(x => x.id === vId);
                            return (
                              <div key={vId} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className={cn("h-4 w-1 rounded-full", v?.color)} />
                                  <h5 className="text-[9px] font-black uppercase text-slate-400">{v?.name}</h5>
                                </div>
                                <div className="space-y-1 pl-3">
                                  {services.map(s => (
                                    <div key={s} className="flex items-center justify-between text-[10px] font-bold text-slate-600 group">
                                      <span>• {s}</span>
                                      <button onClick={() => toggleService(vId, s)} className="opacity-0 group-hover:opacity-100 text-rose-400">
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                    <div className="p-6 border-t bg-slate-50/50 shrink-0">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[9px] font-black uppercase text-slate-400">Total Selection</span>
                        <Badge className="bg-primary text-white font-black h-5 text-[10px] px-2">{totalServicesCount}</Badge>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </div>

            <div className="p-8 border-t bg-white flex items-center justify-between shrink-0">
              {onboardStep === 'info' ? (
                <>
                  <Button variant="ghost" onClick={() => setIsOnboardOpen(false)} className="rounded-xl font-bold text-slate-400">Cancel</Button>
                  <Button 
                    onClick={() => setOnboardStep('services')} 
                    disabled={!newClient.company_name}
                    className="rounded-2xl h-12 px-10 font-black uppercase text-xs tracking-widest gap-2 shadow-xl shadow-primary/20"
                  >
                    Architect Scope <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setOnboardStep('info')} className="rounded-xl font-bold gap-2">
                    <ChevronLeft className="h-4 w-4" /> Back to Details
                  </Button>
                  <Button 
                    onClick={handleOnboardClient} 
                    disabled={isSubmitting}
                    className="rounded-2xl h-12 px-10 font-black uppercase text-xs tracking-widest gap-2 shadow-xl shadow-primary/20"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Finalize Onboarding
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!clientToArchive} onOpenChange={(open) => !open && setClientToArchive(null)}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Client Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move "{clientToArchive?.company_name}" and associated projects to archives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmArchive} className="bg-rose-500 hover:bg-rose-600 rounded-xl">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
