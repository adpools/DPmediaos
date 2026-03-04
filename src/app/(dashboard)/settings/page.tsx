"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  User, 
  Lock, 
  Settings2, 
  Building2, 
  ShieldCheck, 
  Puzzle, 
  Sparkles, 
  History, 
  RefreshCcw, 
  LogOut,
  Save,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_COMPANY } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";

function AccountCenterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAdmin] = useState(true);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`);
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your account preferences have been updated successfully.",
    });
  };

  const handleRestore = () => {
    toast({
      title: "System Restore Initiated",
      description: "Rolling back configuration to the last stable backup.",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline text-primary">Account Center</h1>
          <p className="text-muted-foreground">Manage your personal presence and workspace configuration.</p>
        </div>
        <Button 
          variant="destructive" 
          className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-rose-500/20"
          onClick={() => toast({ title: "Session terminated" })}
        >
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-white/50 border p-1 h-auto flex-wrap gap-1 rounded-2xl">
          <TabsTrigger value="profile" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Lock className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="personal" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Settings2 className="h-4 w-4" /> Preferences
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="company" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Building2 className="h-4 w-4" /> Company
              </TabsTrigger>
              <TabsTrigger value="modules" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Puzzle className="h-4 w-4" /> Modules
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="activity" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <History className="h-4 w-4" /> Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="animate-in fade-in-50 duration-300">
          <Card className="border-none shadow-soft rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-primary/5 pb-8">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 ring-4 ring-white shadow-xl">
                  <AvatarImage src={MOCK_COMPANY.admin.avatar} />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-headline">{MOCK_COMPANY.admin.name}</CardTitle>
                  <CardDescription className="text-base">{MOCK_COMPANY.admin.role}</CardDescription>
                  <Badge variant="secondary" className="bg-accent/10 text-accent border-none font-bold uppercase tracking-wider text-[10px]">Active</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" defaultValue={MOCK_COMPANY.admin.name} className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" defaultValue="shakir@dpstudios.com" className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleTitle">Professional Role</Label>
                  <Input id="roleTitle" defaultValue={MOCK_COMPANY.admin.role} className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Short Bio</Label>
                  <Input id="bio" placeholder="Tell us about yourself..." className="rounded-xl h-12" />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} className="gap-2 rounded-xl h-11 px-8 shadow-lg shadow-primary/20">
                  <Save className="h-4 w-4" /> Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="animate-in fade-in-50 duration-300">
          <Card className="border-none shadow-soft rounded-[2rem] p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="font-headline text-2xl">Password & Security</CardTitle>
              <CardDescription>Update your credentials to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPass">Current Password</Label>
                  <Input id="currentPass" type="password" placeholder="••••••••" className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPass">New Password</Label>
                  <Input id="newPass" type="password" placeholder="••••••••" className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPass">Confirm New Password</Label>
                  <Input id="confirmPass" type="password" placeholder="••••••••" className="rounded-xl h-12" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-200 rounded-lg text-amber-700">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Two-Factor Authentication</h4>
                    <p className="text-xs text-amber-600">Add an extra layer of security to your account.</p>
                  </div>
                </div>
                <Switch />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} className="gap-2 rounded-xl h-11 px-8">
                  <RefreshCcw className="h-4 w-4" /> Update Security
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="animate-in fade-in-50 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-soft rounded-[2rem] p-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="font-headline text-2xl">Company Information</CardTitle>
                <CardDescription>Global workspace settings for {MOCK_COMPANY.name}</CardDescription>
              </CardHeader>
              <CardContent className="px-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Studio Name</Label>
                    <Input defaultValue={MOCK_COMPANY.name} className="rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry Focus</Label>
                    <Input defaultValue="Media Production" className="rounded-xl h-12" />
                  </div>
                </div>
                <div className="flex justify-between items-center p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold">Studio Branding</h4>
                      <p className="text-sm text-muted-foreground">Logo and colors used for invoices and reports.</p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl">Upload New</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-soft rounded-[2rem] bg-accent p-8 text-white relative overflow-hidden">
              <Sparkles className="absolute top-4 right-4 h-24 w-24 opacity-10 -rotate-12" />
              <CardHeader className="px-0 pt-0">
                <CardTitle className="font-headline text-2xl">AI Assistant</CardTitle>
                <CardDescription className="text-accent-foreground/80">Intelligent automation setup</CardDescription>
              </CardHeader>
              <CardContent className="px-0 space-y-4">
                <p className="text-sm">Configure your GenAI endpoints and behavior models for market research and proposal writing.</p>
                <Button 
                  className="w-full bg-white text-accent hover:bg-white/90 rounded-xl h-11 font-bold"
                  onClick={() => toast({ title: "AI Setup Helper Launched" })}
                >
                  Launch AI Setup Helper
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="animate-in fade-in-50 duration-300">
          <Card className="border-none shadow-soft rounded-[2rem] p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="font-headline text-2xl">Module Customization</CardTitle>
              <CardDescription>Toggle specific features to streamline your workspace.</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {[
                { name: "Market Intelligence", desc: "AI-powered market trends and pitch suggestions", icon: Sparkles },
                { name: "Finance Hub", desc: "Invoicing and Google Sheets integration", icon: Building2 },
                { name: "Talent Marketplace", desc: "Global actor and influencer booking database", icon: User },
                { name: "Sales CRM", desc: "Pipeline tracking and proposal automation", icon: RefreshCcw },
              ].map(mod => (
                <div key={mod.name} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-muted-foreground/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <mod.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{mod.name}</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{mod.desc}</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t flex items-center justify-between">
              <div className="flex items-center gap-3 text-muted-foreground">
                <RefreshCcw className="h-5 w-5" />
                <span className="text-sm font-medium">Backup and Data Recovery</span>
              </div>
              <Button 
                variant="outline" 
                className="rounded-xl gap-2 h-11 px-6"
                onClick={handleRestore}
              >
                <RefreshCcw className="h-4 w-4" /> Restore Configuration
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="animate-in fade-in-50 duration-300">
          <Card className="border-none shadow-soft rounded-[2rem] p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="font-headline text-2xl">Activity Log</CardTitle>
              <CardDescription>Recent changes and security events in your account.</CardDescription>
            </CardHeader>
            <div className="mt-6 space-y-4">
              {[
                { action: "Login detected", time: "2 hours ago", location: "London, UK (Chrome)", icon: Lock, color: "text-blue-500" },
                { action: "Workspace settings updated", time: "5 hours ago", location: "Dashboard", icon: Settings2, color: "text-purple-500" },
                { action: "New module enabled: Finance Hub", time: "1 day ago", location: "Admin Panel", icon: Building2, color: "text-emerald-500" },
                { action: "Password changed", time: "3 days ago", location: "Account Settings", icon: RefreshCcw, color: "text-amber-500" },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full bg-white shadow-sm ${log.color}`}>
                      <log.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.location}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{log.time}</span>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-muted-foreground text-xs mt-2">View All Logs</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AccountCenterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountCenterContent />
    </Suspense>
  );
}
