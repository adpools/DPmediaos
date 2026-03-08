
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Megaphone, 
  Package, 
  Smartphone, 
  Building2, 
  Home, 
  Ticket, 
  Rocket, 
  Film, 
  Mic, 
  BookOpen, 
  Play, 
  Scissors, 
  Sparkles,
  CheckCircle2,
  FileText,
  Plus,
  ArrowRight,
  ChevronRight,
  Zap,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const CONTENT_VERTICALS = [
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

export default function ServiceBuilderPage() {
  const { toast } = useToast();
  const [selectedVerticalId, setSelectedVerticalId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Record<string, string[]>>({});

  const activeVertical = useMemo(() => 
    CONTENT_VERTICALS.find(v => v.id === selectedVerticalId), 
  [selectedVerticalId]);

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

  const totalSelectedCount = useMemo(() => 
    Object.values(selectedServices).flat().length, 
  [selectedServices]);

  const handleLaunchProject = () => {
    if (totalSelectedCount === 0) {
      toast({ variant: "destructive", title: "Scope Empty", description: "Please select at least one service to continue." });
      return;
    }
    toast({ title: "Brief Architecture Complete", description: "Sending your production requirements to the workspace." });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">Service Builder</h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" /> Architect your production scope and generate a professional project brief.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Vertical & Service Selection */}
        <div className="lg:col-span-8 space-y-8">
          {/* Vertical Selector */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">01. Select Content Vertical</h3>
              {selectedVerticalId && (
                <Button variant="ghost" size="sm" className="h-6 text-[9px] uppercase font-bold" onClick={() => setSelectedVerticalId(null)}>
                  Reset Vertical
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {CONTENT_VERTICALS.map((vertical) => (
                <Card 
                  key={vertical.id}
                  className={cn(
                    "cursor-pointer transition-all duration-300 border-2 rounded-2xl group relative overflow-hidden",
                    selectedVerticalId === vertical.id 
                      ? "border-primary shadow-lg ring-4 ring-primary/5" 
                      : "border-transparent hover:border-slate-200 hover:shadow-md bg-white"
                  )}
                  onClick={() => setSelectedVerticalId(vertical.id)}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-110",
                      vertical.color
                    )}>
                      <vertical.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black leading-tight uppercase tracking-tight">{vertical.name}</span>
                    {selectedServices[vertical.id]?.length > 0 && (
                      <Badge className="absolute top-2 right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-[10px] font-bold">
                        {selectedServices[vertical.id].length}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Service Checklist */}
          {activeVertical ? (
            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">02. Configure Services for {activeVertical.name}</h3>
              </div>
              <Card className="border-none shadow-soft rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeVertical.services.map((service) => {
                      const isSelected = selectedServices[activeVertical.id]?.includes(service);
                      return (
                        <div 
                          key={service}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                            isSelected 
                              ? "bg-primary/5 border-primary/20 shadow-sm" 
                              : "border-slate-50 hover:border-slate-200 hover:bg-slate-50/50"
                          )}
                          onClick={() => toggleService(activeVertical.id, service)}
                        >
                          <Checkbox 
                            checked={isSelected}
                            className="h-5 w-5 rounded-md"
                          />
                          <div className="flex-1">
                            <p className={cn(
                              "text-xs font-bold transition-colors",
                              isSelected ? "text-primary" : "text-slate-600 group-hover:text-slate-900"
                            )}>
                              {service}
                            </p>
                          </div>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] text-muted-foreground bg-white/50">
              <div className="h-16 w-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
                <Info className="h-8 w-8 opacity-20" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest opacity-40">Awaiting Vertical Selection</p>
            </div>
          )}
        </div>

        {/* Right Column: Brief Summary */}
        <aside className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
            <CardHeader className="bg-white/5 p-8 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Project Brief Summary</CardTitle>
                  <CardDescription className="text-slate-400 text-xs uppercase font-black tracking-widest">Scope Synthesis</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[450px]">
                <div className="p-8 space-y-8">
                  {totalSelectedCount === 0 ? (
                    <div className="text-center py-12 space-y-4 opacity-40">
                      <Plus className="h-8 w-8 mx-auto" />
                      <p className="text-xs font-bold uppercase tracking-widest">No services selected</p>
                    </div>
                  ) : (
                    Object.entries(selectedServices).map(([verticalId, services]) => {
                      const vertical = CONTENT_VERTICALS.find(v => v.id === verticalId);
                      return (
                        <div key={verticalId} className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-6 w-1 rounded-full", vertical?.color)} />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{vertical?.name}</h4>
                          </div>
                          <div className="space-y-2">
                            {services.map(s => (
                              <div key={s} className="flex items-center justify-between group">
                                <span className="text-xs font-bold text-slate-200">{s}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 rounded-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => toggleService(verticalId, s)}
                                >
                                  <Plus className="h-3 w-3 rotate-45" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              <div className="p-8 border-t border-white/10 bg-white/5 backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Deliverables Count</span>
                  <span className="text-xl font-black text-accent">{totalSelectedCount}</span>
                </div>
                <Button 
                  className="w-full h-14 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black uppercase text-xs tracking-widest gap-3 shadow-xl"
                  onClick={handleLaunchProject}
                >
                  Confirm Brief & Launch <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft rounded-[2.5rem] bg-indigo-50 border border-indigo-100 p-8">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center gap-3 text-indigo-700">
                <Sparkles className="h-5 w-5" />
                <h4 className="font-bold text-sm">Smart Proposal Sync</h4>
              </div>
              <p className="text-xs text-indigo-800/70 leading-relaxed font-medium">
                Confirming this brief will automatically draft an AI-powered proposal with these services pre-configured.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
