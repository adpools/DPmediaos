
"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  User, 
  Lock, 
  Settings2, 
  Building2, 
  Puzzle, 
  Sparkles, 
  History, 
  RefreshCcw, 
  LogOut,
  Save,
  Moon,
  Sun,
  Palette,
  Check,
  Loader2,
  LayoutGrid,
  Film,
  Users,
  Briefcase,
  FileText,
  Receipt,
  Search,
  PieChart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTenant } from "@/hooks/use-tenant";
import { useFirestore } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Helper to convert hex to HSL components for CSS variables
function hexToHslComponents(hex: string): string {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function AccountCenterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  const { profile: tenantProfile, company, settings, companyId, isLoading: isTenantLoading } = useTenant();
  
  // Tab Management
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Profile State
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    bio: ""
  });

  // Sync local state when tenant profile loads
  useEffect(() => {
    if (tenantProfile) {
      setFormData({
        name: tenantProfile.full_name || "",
        role: tenantProfile.role_id || "Member",
        email: tenantProfile.email || "",
        bio: tenantProfile.bio || ""
      });
    }
  }, [tenantProfile]);

  // Preference State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [accentColor, setAccentColor] = useState("#FF4B82");

  const colorPresets = [
    { name: "Pink", hex: "#FF4B82" },
    { name: "Purple", hex: "#B199FF" },
    { name: "Blue", hex: "#3b82f6" },
    { name: "Emerald", hex: "#10b981" },
    { name: "Amber", hex: "#f59e0b" },
    { name: "Indigo", hex: "#6366f1" }
  ];

  const modulesList = [
    { id: "dashboard", name: "Dashboard", desc: "Workspace overview and task summary", icon: LayoutGrid, isCore: true },
    { id: "projects", name: "Project Management", desc: "Production workflows, budgets, and schedules", icon: Film, isCore: true },
    { id: "talents", name: "Talent Network", desc: "Global actor and influencer booking database", icon: Users },
    { id: "crm", name: "Sales CRM", desc: "Client relationship and pipeline tracking", icon: Briefcase },
    { id: "proposals", name: "Proposal Wizard", desc: "AI-assisted production proposal generation", icon: FileText },
    { id: "invoices", name: "Finance Hub", desc: "Automated invoicing and cloud sync", icon: Receipt },
    { id: "research", name: "Market Intelligence", desc: "AI market trends and pitch suggestions", icon: Search },
    { id: "reports", name: "Analytics", desc: "Revenue trends and performance reports", icon: PieChart },
  ];

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

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    if (!tenantProfile?.id || !db) return;

    const userRef = doc(db, 'users', tenantProfile.id);
    updateDocumentNonBlocking(userRef, {
      full_name: formData.name,
      bio: formData.bio
    });

    toast({
      title: "Profile Updated",
      description: `Changes for ${formData.name} have been saved successfully.`,
    });
  };

  const handleToggleModule = (moduleId: string, enabled: boolean) => {
    if (!companyId || !db || !settings) return;

    const currentModules = settings.enabled_modules || [];
    let updatedModules;

    if (enabled) {
      updatedModules = Array.from(new Set([...currentModules, moduleId]));
    } else {
      updatedModules = currentModules.filter((id: string) => id !== moduleId);
    }

    const settingsRef = doc(db, 'companies', companyId, 'company_settings', companyId);
    updateDocumentNonBlocking(settingsRef, {
      enabled_modules: updatedModules,
      updated_at: serverTimestamp()
    });

    toast({
      title: enabled ? "Module Enabled" : "Module Disabled",
      description: `${moduleId.charAt(0).toUpperCase() + moduleId.slice(1)} settings have been updated workspace-wide.`,
    });
  };

  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast({
      title: checked ? "Dark Mode Enabled" : "Light Mode Enabled",
      description: "Your visual preferences have been updated.",
    });
  };

  const updateAccentColor = useCallback((hex: string) => {
    setAccentColor(hex);
    const hsl = hexToHslComponents(hex);
    document.documentElement.style.setProperty('--accent', hsl);
    document.documentElement.style.setProperty('--sidebar-primary', hsl);
    document.documentElement.style.setProperty('--sidebar-accent-foreground', hsl);
    document.documentElement.style.setProperty('--sidebar-ring', hsl);
  }, []);

  const handleRestore = () => {
    toast({
      title: "System Restore Initiated",
      description: "Rolling back configuration to the last stable backup.",
    });
  };

  if (isTenantLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-primary">Account Center</h1>
          <p className="text-muted-foreground">Manage your personal presence and workspace configuration.</p>
        </div>
        <Button 
          variant="destructive" 
          className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-rose-500/20"
          onClick={() => toast({ title: "Session terminated", description: "You have been logged out." })}
        >
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-white/50 border p-1 h-auto flex-wrap gap-1 rounded-2xl">
          <TabsTrigger value="profile" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Settings2 className="h-4 w-4" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Lock className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="company" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Building2 className="h-4 w-4" /> Company
          </TabsTrigger>
          <TabsTrigger value="modules" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Puzzle className="h-4 w-4" /> Modules
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <History className="h-4 w-4" /> Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="animate-in fade-in-50 duration-300">
          <Card className="border-none shadow-soft rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-primary/5 pb-8">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 ring-4 ring-white shadow-xl">
                  <AvatarImage src={tenantProfile?.avatar} />
                  <AvatarFallback>{formData.name.substring(0,2).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold">{formData.name || "Unknown User"}</CardTitle>
                  <CardDescription className="text-base">{formData.role || "Member"}</CardDescription>
                  <Badge variant="secondary" className="bg-accent/10 text-accent border-none font-bold uppercase tracking-wider text-[10px]">Active</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={formData.name} 
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="rounded-xl h-12" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    value={formData.email} 
                    disabled
                    className="rounded-xl h-12 opacity-50 cursor-not-allowed" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleTitle">Professional Role</Label>
                  <Input 
                    id="roleTitle" 
                    value={formData.role} 
                    disabled
                    className="rounded-xl h-12 bg-muted" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Short Bio</Label>
                  <Input 
                    id="bio" 
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about your production background..." 
                    className="rounded-xl h-12" 
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveProfile} className="gap-2 rounded-xl h-11 px-8 shadow-lg shadow-primary/20">
                  <Save className="h-4 w-4" /> Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="animate-in fade-in-50 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-soft rounded-[2rem] p-8">
              <CardHeader className="px-0 pt-0">
                <div className="flex items-center gap-3 mb-2">
                  <Palette className="h-5 w-5 text-accent" />
                  <CardTitle className="text-2xl">Appearance</CardTitle>
                </div>
                <CardDescription>Customize the look and feel of your workspace.</CardDescription>
              </CardHeader>
              <CardContent className="px-0 space-y-8 pt-4">
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                  <div className="flex items-center gap-4">
                    {isDarkMode ? <Moon className="h-6 w-6 text-primary" /> : <Sun className="h-6 w-6 text-amber-500" />}
                    <div>
                      <h4 className="font-bold text-sm">Theme Mode</h4>
                      <p className="text-xs text-muted-foreground">Switch between light and dark themes.</p>
                    </div>
                  </div>
                  <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-bold">Highlight Color</Label>
                    <p className="text-xs text-muted-foreground">Choose your brand's primary highlight accent.</p>
                  </div>
                  
                  <div className="grid grid-cols-6 gap-3">
                    {colorPresets.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => updateAccentColor(color.hex)}
                        className={cn(
                          "h-10 w-full rounded-xl flex items-center justify-center transition-all hover:scale-110",
                          accentColor === color.hex ? "ring-2 ring-primary ring-offset-2" : "opacity-80 hover:opacity-100"
                        )}
                        style={{ backgroundColor: color.hex }}
                      >
                        {accentColor === color.hex && <Check className="h-4 w-4 text-white" />}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex-1 space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Custom Hex Code</Label>
                      <Input 
                        value={accentColor} 
                        onChange={(e) => updateAccentColor(e.target.value)}
                        className="font-mono text-xs h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Picker</Label>
                      <input 
                        type="color" 
                        value={accentColor} 
                        onChange={(e) => updateAccentColor(e.target.value)}
                        className="h-10 w-10 p-0 border-none bg-transparent cursor-pointer rounded-xl overflow-hidden"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-soft rounded-[2rem] bg-accent p-8 text-white relative overflow-hidden">
              <Sparkles className="absolute top-4 right-4 h-24 w-24 opacity-10 -rotate-12" />
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl">AI Assistant</CardTitle>
                <CardDescription className="text-accent-foreground/80">Intelligent automation setup</CardDescription>
              </CardHeader>
              <CardContent className="px-0 space-y-4">
                <p className="text-sm">Configure your GenAI endpoints and behavior models for market research and proposal writing.</p>
                <Button 
                  className="w-full bg-white text-accent hover:bg-white/90 rounded-xl h-11 font-bold"
                  onClick={() => toast({ title: "AI Setup Helper Launched", description: "Configuring LLM parameters..." })}
                >
                  Launch AI Setup Helper
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="animate-in fade-in-50 duration-300">
          <Card className="border-none shadow-soft rounded-[2rem] p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl">Password & Security</CardTitle>
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
              <div className="flex justify-end pt-4">
                <Button onClick={() => toast({ title: "Security Updated" })} className="gap-2 rounded-xl h-11 px-8">
                  <RefreshCcw className="h-4 w-4" /> Update Security
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="animate-in fade-in-50 duration-300">
          <Card className="border-none shadow-soft rounded-[2rem] p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl">Company Information</CardTitle>
              <CardDescription>Global workspace settings for {company?.name || "Your Company"}</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Studio Name</Label>
                  <Input defaultValue={company?.name} className="rounded-xl h-12" />
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
        </TabsContent>

        <TabsContent value="modules" className="animate-in fade-in-50 duration-300">
          <Card className="border-none shadow-soft rounded-[2rem] p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl">Module Customization</CardTitle>
              <CardDescription>Enable or disable workspace features. Core modules cannot be disabled.</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {modulesList.map(mod => {
                const isEnabled = settings?.enabled_modules?.includes(mod.id);
                return (
                  <div key={mod.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-muted-foreground/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <mod.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm">{mod.name}</h4>
                          {mod.isCore && <Badge className="text-[8px] h-4 py-0 px-1 bg-primary/10 text-primary border-none">CORE</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{mod.desc}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={isEnabled || mod.isCore} 
                      disabled={mod.isCore}
                      onCheckedChange={(checked) => handleToggleModule(mod.id, checked)}
                    />
                  </div>
                );
              })}
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
              <CardTitle className="text-2xl">Activity Log</CardTitle>
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
