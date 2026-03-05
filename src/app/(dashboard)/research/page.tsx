
"use client";

import { useState } from "react";
import { analyzeMarketAndSuggestPitch, type AnalyzeMarketAndSuggestPitchOutput } from "@/ai/flows/analyze-market-and-suggest-pitch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, TrendingUp, Target, Sparkles, MapPin, Briefcase, History, ChevronRight, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTenant } from "@/hooks/use-tenant";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import Link from "next/link";

export default function MarketResearchPage() {
  const { profile, companyId } = useTenant();
  const db = useFirestore();
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeMarketAndSuggestPitchOutput | null>(null);

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
      const data = await analyzeMarketAndSuggestPitch({ industry, location });
      setResult(data);

      // Save to Firestore history
      const sessionsRef = collection(db, 'companies', companyId, 'market_research_sessions');
      addDocumentNonBlocking(sessionsRef, {
        companyId: companyId,
        requestedByUserId: profile.id,
        industry,
        location,
        status: 'complete',
        opportunityScore: data.opportunityScore,
        marketTrends: data.marketTrends,
        suggestedPitchAngles: data.suggestedPitchAngles,
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
      contentOpportunities: [] // Not stored in old sessions but required by type
    });
    setIndustry(session.industry);
    setLocation(session.location);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-primary">Market Intelligence</h1>
        <p className="text-muted-foreground">AI-powered research for media production opportunities and trends.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <Card className="border-none shadow-sm overflow-hidden rounded-[2rem]">
            <div className="bg-primary p-8 text-primary-foreground">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-6 w-6 text-accent" />
                <h2 className="text-xl font-bold">New Research Campaign</h2>
              </div>
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="industry" className="text-primary-foreground/80 text-[10px] font-bold uppercase tracking-wider">Target Industry</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-primary/40" />
                    <Input 
                      id="industry" 
                      placeholder="e.g. Sustainable Fashion" 
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-9 h-11 rounded-xl"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="location" className="text-primary-foreground/80 text-[10px] font-bold uppercase tracking-wider">Geographical Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-primary/40" />
                    <Input 
                      id="location" 
                      placeholder="e.g. London, UK" 
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-9 h-11 rounded-xl"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-white border-none h-11 rounded-xl font-bold shadow-lg shadow-black/20">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    Analyze
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          {result ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="md:col-span-1 border-none shadow-sm rounded-[2rem] bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-accent" />
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
                        strokeWidth="10"
                        className="text-slate-100"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeDasharray={440}
                        strokeDashoffset={440 - (440 * result.opportunityScore) / 100}
                        className="text-primary transition-all duration-1000"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-4xl font-bold text-primary">{result.opportunityScore}</span>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Score</p>
                    </div>
                  </div>
                  <p className="text-center text-xs text-muted-foreground leading-relaxed">
                    Market readiness and entry potential based on current media saturation in {industry}.
                  </p>
                </CardContent>
              </Card>

              <div className="md:col-span-2 space-y-6">
                <Card className="border-none shadow-sm rounded-[2rem] bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Key Market Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 pt-2">
                    {result.marketTrends.map((trend, idx) => (
                      <Badge key={idx} variant="secondary" className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-primary border-none">
                        {trend}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-[2rem] bg-white">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-accent" />
                        Suggested Pitch Angles
                      </CardTitle>
                      <CardDescription>Winning narratives for your sales proposals</CardDescription>
                    </div>
                    <Link href="/proposals">
                      <Button variant="outline" size="sm" className="rounded-xl h-9 gap-2 text-xs font-bold">
                        <FileText className="h-3.5 w-3.5" /> Use in Proposal
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.suggestedPitchAngles.map((angle, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-muted/30 border-l-4 border-l-accent">
                        <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest block mb-1">Strategy {idx + 1}</span>
                        <p className="text-sm font-medium leading-relaxed">
                          {angle}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-[2rem] bg-white/50 text-muted-foreground border-slate-200">
              <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Search className="h-8 w-8 opacity-20" />
              </div>
              <p className="font-bold text-slate-400">No active analysis</p>
              <p className="text-xs">Start by entering an industry and location above.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Recent Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              {isHistoryLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : history?.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">No previous research sessions found.</div>
              ) : (
                <div className="space-y-1">
                  {history?.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => loadFromHistory(session)}
                      className="w-full text-left p-4 rounded-2xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm truncate block flex-1">{session.industry}</span>
                        <Badge variant="outline" className="text-[8px] h-4 font-bold">{session.opportunityScore}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
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

          <Card className="border-none shadow-sm rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden">
            <CardContent className="p-8 space-y-4">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <h4 className="text-lg font-bold leading-tight">Intelligence Credits</h4>
              <p className="text-xs text-white/60">Your workspace has unlimited analysis runs during the early access phase.</p>
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                  <span>Workspace Usage</span>
                  <span>Unlimited</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-accent rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
