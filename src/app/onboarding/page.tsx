"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Sparkles,
  Loader2,
  Film,
  Users,
  Briefcase,
  Receipt,
  Search
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { useFirestore, useUser } from "@/firebase";
import { setupNewCompany } from "./actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const INDUSTRIES = [
  { id: 'luxury', label: 'Luxury & Lifestyle' },
  { id: 'ecommerce', label: 'E-commerce & D2C' },
  { id: 'tech', label: 'Tech & SaaS' },
  { id: 'fintech', label: 'Fintech & Banking' },
  { id: 'realestate', label: 'Real Estate & Architecture' },
  { id: 'healthcare', label: 'Healthcare & Wellness' },
  { id: 'gaming', label: 'Gaming & Esports' },
  { id: 'fashion', label: 'Fashion & Apparel' },
  { id: 'hospitality', label: 'Hospitality & Tourism' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const nextStep = () => setStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleComplete = async () => {
    if (!user || !companyName) return;
    setLoading(true);
    try {
      await setupNewCompany(db, user.uid, user.email!, companyName, industry);
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    { id: 'projects', name: 'Project Management', icon: Film, desc: 'Workflows, schedules & budgets' },
    { id: 'talents', name: 'Talent Marketplace', icon: Users, desc: 'Find & book actors or models' },
    { id: 'crm', name: 'Sales CRM', icon: Briefcase, desc: 'Manage leads & proposals' },
    { id: 'invoices', name: 'Invoice and Quote', icon: Receipt, desc: 'Automated billing & quotations' },
    { id: 'research', name: 'Market Intelligence', icon: Search, desc: 'AI research & trends' },
  ];

  return (
    <div className="min-h-screen bg-[#F0F1F4] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="md:col-span-1 space-y-6 hidden md:block">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white font-headline font-bold">DP</div>
            <span className="font-headline font-bold text-xl tracking-tight">DP Media OS</span>
          </div>
          
          <nav className="space-y-4">
            {[
              { n: 1, label: 'Company Profile' },
              { n: 2, label: 'Branding' },
              { n: 3, label: 'Feature Selection' },
              { n: 4, label: 'Team Members' },
              { n: 5, label: 'Integrations' },
              { n: 6, label: 'Summary' },
            ].map((s) => (
              <div key={s.n} className={`flex items-center gap-3 transition-all ${step === s.n ? 'text-primary scale-105 font-semibold' : 'text-muted-foreground'}`}>
                <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs ${step === s.n ? 'border-primary bg-primary text-white' : 'border-muted'}`}>
                  {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                </div>
                <span className="text-sm">{s.label}</span>
              </div>
            ))}
          </nav>

          <div className="pt-12">
             <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative">
               <CardContent className="p-6">
                 <Sparkles className="h-10 w-10 text-accent mb-4 opacity-50" />
                 <h4 className="font-headline font-semibold text-lg mb-2">Security First</h4>
                 <p className="text-sm text-primary-foreground/70">Setting up your secure workspace with data isolation and RBAC enabled by default.</p>
               </CardContent>
             </Card>
          </div>
        </div>

        <div className="md:col-span-2">
          <Card className="border-none shadow-xl min-h-[500px] flex flex-col rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b bg-white/50 p-8">
              <CardTitle className="font-headline text-2xl">
                {step === 1 && "Basic Company Info"}
                {step === 2 && "Setup Your Branding"}
                {step === 3 && "Select Your Modules"}
                {step === 4 && "Invite Your Team"}
                {step === 5 && "Cloud Integrations"}
                {step === 6 && "Ready to Launch"}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Let's get your company identity set up in the system."}
                {step === 2 && "This will appear on your invoices and client portal."}
                {step === 3 && "Enable the tools you need. You can change this anytime."}
                {step === 4 && "Assign roles and permissions to your colleagues."}
                {step === 5 && "Connect Google Drive and Sheets for automation."}
                {step === 6 && "Review your configuration and start producing."}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 flex-1">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input 
                      id="companyName" 
                      placeholder="e.g. DP Global Productions" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="rounded-xl h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Primary Industry</Label>
                    <Select onValueChange={setIndustry} value={industry}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map(i => (
                          <SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Official Address</Label>
                    <Textarea id="address" placeholder="Business street address..." className="rounded-xl" />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {modules.map((mod) => (
                    <div key={mod.id} className="flex items-start gap-4 p-4 rounded-xl border border-muted hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group">
                      <Checkbox id={mod.id} defaultChecked className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={mod.id} className="font-bold text-sm cursor-pointer">{mod.name}</Label>
                        <p className="text-xs text-muted-foreground">{mod.desc}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors text-primary">
                        <mod.icon className="h-5 w-5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === 6 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in zoom-in duration-500">
                   <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                     <CheckCircle2 className="h-10 w-10" />
                   </div>
                   <div className="space-y-2">
                     <h3 className="text-2xl font-bold font-headline">Setup Complete!</h3>
                     <p className="text-muted-foreground max-w-sm">Your multi-tenant workspace is provisioned and ready for your team.</p>
                   </div>
                   <div className="w-full bg-muted/50 p-6 rounded-[1.5rem] text-left space-y-3">
                     <div className="flex justify-between text-xs">
                       <span className="text-muted-foreground font-bold uppercase tracking-wider">Workspace</span>
                       <span className="font-semibold">{companyName || "DP Studio"}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                       <span className="text-muted-foreground font-bold uppercase tracking-wider">Modules</span>
                       <span className="font-semibold">5 Active</span>
                     </div>
                     <div className="flex justify-between text-xs">
                       <span className="text-muted-foreground font-bold uppercase tracking-wider">Admin</span>
                       <span className="font-semibold">{user?.email}</span>
                     </div>
                   </div>
                </div>
              )}

              {[2,4,5].includes(step) && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin opacity-20" />
                  <p className="text-sm font-medium">Provisioning step {step}...</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t bg-muted/30 p-6 flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={prevStep} 
                disabled={step === 1 || loading}
                className="gap-2 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              {step === 6 ? (
                <Button 
                  onClick={handleComplete} 
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 gap-2 rounded-xl px-8 h-12 shadow-lg shadow-primary/20"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Launch DP Media OS"} <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={nextStep} 
                  disabled={step === 1 && !companyName}
                  className="bg-primary hover:bg-primary/90 gap-2 rounded-xl px-8 h-12 shadow-lg shadow-primary/20"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}