"use client";

import { useState } from "react";
import { analyzeMarketAndSuggestPitch, type AnalyzeMarketAndSuggestPitchOutput } from "@/ai/flows/analyze-market-and-suggest-pitch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Search, 
  TrendingUp, 
  Target, 
  Sparkles, 
  MapPin, 
  Briefcase, 
  History, 
  ChevronRight, 
  FileText,
  Package,
  Zap,
  Lightbulb,
  Cpu,
  CheckCircle2,
  Info,
  ArrowRight,
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/use-tenant";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Slider } from "@/components/ui/slider";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

const LOCATION_SUGGESTIONS = [
  "Mumbai, India",
  "Delhi, India",
  "Bangalore, India",
  "Dubai, UAE",
  "London, UK",
  "New York, USA"
];

export default function MarketResearchPage() {
  const { profile, companyId } = useTenant();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState([25]); 
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeMarketAndSuggestPitchOutput | null>(null);

  // Detail Dialog State
  const [selectedDetail, setSelectedDetail] = useState<{ type: 'package' | 'automation', data: any } | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch recent research history
  const historyQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'market_research_sessions'),
      orderBy('requestedAt', 'desc'),
      limit(10)
    );
  }, [db, companyId]);

  const { data: history, isLoading: isHistoryLoading } = useCollection(historyQuery);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry || !location || !companyId || !profile) return;

    setLoading(true);
    try {
      const data = await analyzeMarketAndSuggestPitch({ 
        industry, 
        location,
        radius: radius[0]
      });
      setResult(data);

      // Save to Firestore history
      const sessionsRef = collection(db, 'companies', companyId, 'market_research_sessions');
      addDocumentNonBlocking(sessionsRef, {
        companyId: companyId,
        requestedByUserId: profile.id,
        industry,
        location,
        radius: radius[0],
        status: 'complete',
        opportunityScore: data.opportunityScore,
        marketTrends: data.marketTrends,
        suggestedPitchAngles: data.suggestedPitchAngles,
        contentOpportunities: data.contentOpportunities || [],
        suggestedServicePackages: data.suggestedServicePackages || [],
        aiAutomationSuggestions: data.aiAutomationSuggestions || [],
        requestedAt: serverTimestamp(),
      });

    } catch (error) {
      console.error("Research failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (session: any) => {
    setResult({
      opportunityScore: session.opportunityScore,
      marketTrends: session.marketTrends,
      suggestedPitchAngles: session.suggestedPitchAngles,
      contentOpportunities: session.contentOpportunities || [],
      suggestedServicePackages: session.suggestedServicePackages || [],
      aiAutomationSuggestions: session.aiAutomationSuggestions || []
    });
    setIndustry(session.industry);
    setLocation(session.location);
    if (session.radius) setRadius([session.radius]);
  };

  const openDetail = (type: 'package' | 'automation', data: any) => {
    setSelectedDetail({ type, data });
    setIsDetailOpen(true);
  };

  const handleInitializeWorkflow = async () => {
    setIsActionLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsActionLoading(false);
    setIsDetailOpen(false);
    toast({
      title: "Workflow Initialized",
      description: "AI automation pipeline has been successfully deployed to your workspace.",
    });
  };

  const handleDraftProposal = () => {
    if (!selectedDetail || !industry) return;
    
    const pkg = selectedDetail.data;
    const params = new URLSearchParams({
      source: 'research',
      projectName: pkg.name,
      industry: industry,
      services: pkg.deliverables?.join(', ') || pkg.description,
      context: pkg.strategicValue || ''
    });
    
    router.push(`/proposals?${params.toString()}`);
  };

  const handleAddToCatalog = async () => {
    setIsActionLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsActionLoading(false);
    setIsDetailOpen(false);
    toast({
      title: "Catalog Updated",
      description: `${selectedDetail?.data.name} has been added to your production service offerings.`,
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">Market Intelligence</h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" /> AI-powered research for media production opportunities and trends.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <Card className="border-none shadow-soft overflow-hidden rounded-[2.5rem]">
            <div className="bg-primary p-8 md:p-10 text-primary-foreground relative">
              <Sparkles className="absolute top-10 right-10 h-20 w-20 text-white/5" />
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Search className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl font-bold">New Intelligence Campaign</h2>
              </div>
              <form onSubmit={handleSearch} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-primary-foreground/80 text-[10px] font-black uppercase tracking-[0.2em]">Target Industry</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-3.5 h-4 w-4 text-primary/40" />
                      <Input 
                        id="industry" 
                        placeholder="e.g. Sustainable Fashion" 
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-11 h-12 rounded-2xl focus:ring-accent"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-primary-foreground/80 text-[10px] font-black uppercase tracking-[0.2em]">Geographical Focus</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-primary/40" />
                      <Input 
                        id="location" 
                        placeholder="e.g. London, UK" 
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-11 h-12 rounded-2xl focus:ring-accent"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {LOCATION_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setLocation(suggestion)}
                          className="text-[9px] font-bold uppercase py-1 px-3 rounded-full bg-white/5 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
                        >
                          {suggestion.split(',')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end pt-6 border-t border-white/10">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-primary-foreground/80 text-[10px] font-black uppercase tracking-[0.2em]">Discovery Radius</Label>
                      <Badge className="bg-accent text-white border-none font-black text-[10px]">{radius[0]} KM</Badge>
                    </div>
                    <Slider 
                      value={radius} 
                      onValueChange={setRadius} 
                      max={100} 
                      min={5} 
                      step={5}
                      className="cursor-pointer"
                    />
                  </div>
                  <Button disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-white border-none h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-black/20">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Zap className="h-5 w-5 mr-3" />}
                    Initiate Market Scan
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          {result ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Core Analytics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                    <Target className="h-20 w-20" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      Opportunity Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                    <div className="relative h-40 w-40 flex items-center justify-center">
                      <svg className="h-full w-full -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-slate-50"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="12"
                          strokeDasharray={440}
                          strokeDashoffset={440 - (440 * result.opportunityScore) / 100}
                          className="text-primary transition-all duration-1000 ease-out"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-5xl font-black tracking-tighter text-primary">{result.opportunityScore}</span>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Ready</p>
                      </div>
                    </div>
                    <p className="text-center text-[11px] text-muted-foreground leading-relaxed font-medium italic">
                      "Market saturation is low. Ideal window for specialized production in {industry}."
                    </p>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 border-none shadow-sm rounded-[2rem] bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Strategic Narrative</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-primary tracking-widest">Winning Pitch Angles</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.suggestedPitchAngles.map((angle, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] font-bold leading-relaxed flex gap-3">
                            <span className="text-accent">0{idx+1}</span>
                            {angle}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-primary tracking-widest">Market Trends</p>
                      <div className="flex flex-wrap gap-2">
                        {result.marketTrends.map((trend, idx) => (
                          <Badge key={idx} variant="secondary" className="px-4 py-1.5 text-[9px] font-black uppercase tracking-wider bg-primary/5 text-primary border-none">
                            {trend}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Advanced Insights Row */}
              <Tabs defaultValue="packages" className="w-full">
                <TabsList className="bg-white/50 border p-1 rounded-2xl h-12 gap-1 mb-6">
                  <TabsTrigger value="packages" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest">
                    <Package className="h-3.5 w-3.5" /> Service Packages
                  </TabsTrigger>
                  <TabsTrigger value="content" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest">
                    <Lightbulb className="h-3.5 w-3.5" /> Content Ideas
                  </TabsTrigger>
                  <TabsTrigger value="automation" className="rounded-xl px-6 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest">
                    <Cpu className="h-3.5 w-3.5" /> AI Automation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="packages" className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {result.suggestedServicePackages?.map((pkg, idx) => (
                      <Card 
                        key={idx} 
                        className="border-none shadow-sm rounded-[2rem] bg-white group hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-primary/10"
                        onClick={() => openDetail('package', pkg)}
                      >
                        <CardContent className="p-8 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                              <Package className="h-5 w-5" />
                            </div>
                            <span className="font-mono font-black text-xs text-primary">{pkg.priceEstimate}</span>
                          </div>
                          <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{pkg.name}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{pkg.description}</p>
                          <div className="pt-2 flex items-center gap-2 text-[10px] font-black uppercase text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            View Blueprint <ChevronRight className="h-3 w-3" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="content" className="animate-in fade-in slide-in-from-bottom-2">
                  <Card className="border-none shadow-sm rounded-[2rem] bg-white">
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {result.contentOpportunities?.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-white hover:border-primary/20 transition-colors">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <Lightbulb className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-bold text-slate-700 leading-tight pt-1">{item}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="automation" className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {result.aiAutomationSuggestions?.map((auto, idx) => (
                      <Card 
                        key={idx} 
                        className="border-none shadow-soft bg-slate-900 text-white rounded-[2rem] cursor-pointer group hover:ring-2 hover:ring-accent/50 transition-all"
                        onClick={() => openDetail('automation', auto)}
                      >
                        <CardContent className="p-8 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                                <Cpu className="h-5 w-5 text-accent" />
                              </div>
                              <h4 className="font-bold text-lg">{auto.workflow}</h4>
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[9px] uppercase">ROI: {auto.roi || 'High'}</Badge>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{auto.benefit}</p>
                          <div className="pt-2 flex items-center gap-2 text-[10px] font-black uppercase text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                            View Implementation <ArrowRight className="h-3 w-3" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed rounded-[3rem] bg-white/50 text-muted-foreground border-slate-200">
              <div className="h-20 w-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                <Search className="h-10 w-10 opacity-20" />
              </div>
              <p className="font-black uppercase text-xs tracking-widest text-slate-400">Analysis Engine Idle</p>
              <p className="text-[11px] font-medium mt-2 max-w-[250px] text-center">Define an industry and location to unlock specialized production intelligence.</p>
            </div>
          )}
        </div>

        {/* Sidebar History */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="pb-4 bg-slate-50/50 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isHistoryLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : history?.length === 0 ? (
                <div className="text-center py-12 text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic opacity-40">No records found.</div>
              ) : (
                <div className="space-y-2">
                  {history?.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => loadFromHistory(session)}
                      className="w-full text-left p-4 rounded-2xl hover:bg-primary hover:text-white transition-all group flex flex-col gap-1 border border-transparent hover:border-primary"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-black text-[11px] truncate uppercase tracking-tight">{session.industry}</span>
                        <Badge variant="outline" className="text-[8px] h-4 font-black border-slate-200 group-hover:border-white/20 group-hover:text-white">{session.opportunityScore}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground group-hover:text-white/60 flex items-center gap-1 font-medium">
                          <MapPin className="h-2.5 w-2.5" /> {session.location}
                        </span>
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft rounded-[2.5rem] bg-gradient-to-br from-slate-800 to-indigo-950 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Cpu className="h-20 w-20" />
            </div>
            <CardContent className="p-8 space-y-5">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <h4 className="text-lg font-bold leading-tight">Intelligence Credits</h4>
              <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                Your workspace currently has <strong>Unlimited</strong> research runs enabled during the Early Access phase.
              </p>
              <div className="pt-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2 text-white/40">
                  <span>Workspace Utilization</span>
                  <span>100% Active</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-accent rounded-full animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DETAIL DIALOG - Robust scrolling fix */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl h-auto max-h-[90vh] flex flex-col">
          <div className={cn("flex-1 flex flex-col min-h-0", selectedDetail?.type === 'automation' ? "bg-slate-900 text-white" : "bg-white text-slate-900")}>
            <div className="p-10 pb-0 shrink-0">
              <div className="flex items-center gap-4 mb-8">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg ${selectedDetail?.type === 'automation' ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'}`}>
                  {selectedDetail?.type === 'automation' ? <Cpu className="h-6 w-6" /> : <Package className="h-6 w-6" />}
                </div>
                <div>
                  <Badge variant="outline" className={`uppercase text-[9px] font-black tracking-widest mb-1 ${selectedDetail?.type === 'automation' ? 'text-accent border-accent/20' : 'text-primary border-primary/20'}`}>
                    {selectedDetail?.type === 'automation' ? 'Operational Efficiency' : 'Production Package'}
                  </Badge>
                  <DialogTitle className="text-3xl font-black tracking-tighter">
                    {selectedDetail?.data.name || selectedDetail?.data.workflow}
                  </DialogTitle>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 px-10 custom-scrollbar min-h-0">
              <div className="space-y-10 pb-10">
                {/* Summary */}
                <div className="space-y-3">
                  <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${selectedDetail?.type === 'automation' ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Info className="h-3.5 w-3.5" /> Overview
                  </h3>
                  <p className={`text-base leading-relaxed font-medium ${selectedDetail?.type === 'automation' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {selectedDetail?.data.description || selectedDetail?.data.benefit}
                  </p>
                </div>

                {/* Strategic Context */}
                {selectedDetail?.type === 'package' && (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Key Deliverables
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedDetail?.data.deliverables?.map((item: string, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-700">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Strategic Value</h3>
                      <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
                        <p className="text-sm font-medium italic text-primary leading-relaxed">
                          "{selectedDetail?.data.strategicValue || "Optimized for the identified market gap and trend velocity."}"
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Implementation Steps */}
                {selectedDetail?.type === 'automation' && (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-accent" /> Implementation Blueprint
                      </h3>
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {selectedDetail?.data.implementation || "Contact engineering to initialize this AI pipeline."}
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Est. ROI</span>
                            <span className="text-xl font-black text-emerald-400">{selectedDetail?.data.roi || '35%'} Efficiency</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>

            <div className={`shrink-0 p-8 border-t flex flex-col md:flex-row items-center justify-between gap-6 ${selectedDetail?.type === 'automation' ? 'border-white/10' : 'border-slate-100'}`}>
              {selectedDetail?.type === 'package' ? (
                <>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Value</span>
                    <span className="text-2xl font-black text-primary">{selectedDetail?.data.priceEstimate}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary"
                      onClick={handleDraftProposal}
                      className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                      <FileText className="h-4 w-4" /> Draft AI Proposal
                    </Button>
                    <Button 
                      onClick={handleAddToCatalog}
                      disabled={isActionLoading}
                      className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                      {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Add to Catalog
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <Zap className="h-3.5 w-3.5 text-accent" /> Ready for Deployment
                  </div>
                  <Button 
                    onClick={handleInitializeWorkflow}
                    disabled={isActionLoading}
                    className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl h-12 px-10 font-black uppercase text-xs tracking-widest gap-2"
                  >
                    {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Initialize Workflow <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}