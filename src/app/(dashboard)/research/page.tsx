"use client";

import { useState } from "react";
import { analyzeMarketAndSuggestPitch, type AnalyzeMarketAndSuggestPitchOutput } from "@/ai/flows/analyze-market-and-suggest-pitch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, TrendingUp, Target, Sparkles, MapPin, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function MarketResearchPage() {
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeMarketAndSuggestPitchOutput | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry || !location) return;

    setLoading(true);
    try {
      const data = await analyzeMarketAndSuggestPitch({ industry, location });
      setResult(data);
    } catch (error) {
      console.error("Research failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-headline text-primary">Market Intelligence</h1>
        <p className="text-muted-foreground">AI-powered research for media production opportunities and trends.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="bg-primary p-6 text-primary-foreground">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-6 w-6 text-accent" />
            <h2 className="text-xl font-headline font-semibold">New Research Campaign</h2>
          </div>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="industry" className="text-primary-foreground/80 text-xs">Target Industry</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-primary/40" />
                <Input 
                  id="industry" 
                  placeholder="e.g. Sustainable Fashion" 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-9"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="location" className="text-primary-foreground/80 text-xs">Geographical Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-primary/40" />
                <Input 
                  id="location" 
                  placeholder="e.g. London, UK" 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pl-9"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-white border-none h-10">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Analyze Market
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {result ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                Opportunity Score
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="relative h-32 w-32 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={364}
                    strokeDashoffset={364 - (364 * result.opportunityScore) / 100}
                    className="text-primary transition-all duration-1000"
                  />
                </svg>
                <span className="absolute text-3xl font-bold font-headline">{result.opportunityScore}</span>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Market readiness and entry potential based on current media saturation.
              </p>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Key Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {result.marketTrends.map((trend, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1 text-xs">
                    {trend}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Suggested Pitch Angles
                </CardTitle>
                <CardDescription>Winning narratives for your sales proposals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.suggestedPitchAngles.map((angle, idx) => (
                  <Alert key={idx} className="bg-muted/30 border-none">
                    <AlertTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Strategy {idx + 1}</AlertTitle>
                    <AlertDescription className="text-sm font-medium">
                      {angle}
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="md:col-span-3 border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-headline">Content Opportunities</CardTitle>
              <CardDescription>Specific campaigns you could propose to clients</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.contentOpportunities.map((opp, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-accent/5">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    <span className="text-sm">{opp}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl bg-white/50 text-muted-foreground">
          <Search className="h-10 w-10 mb-4 opacity-20" />
          <p className="text-sm font-medium">No active analysis. Start by entering an industry and location above.</p>
        </div>
      )}
    </div>
  );
}