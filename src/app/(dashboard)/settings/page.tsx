"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  User as UserIcon, 
  Lock, 
  Puzzle, 
  LogOut,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTenant } from "@/hooks/use-tenant";
import { useFirestore, useAuth } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";

function AccountCenterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const { profile: tenantProfile, settings, companyId, isLoading: isTenantLoading } = useTenant();
  
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    bio: ""
  });

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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`);
  };

  const handleSaveProfile = () => {
    if (!tenantProfile?.id || !db) return;
    const userRef = doc(db, 'users', tenantProfile.id);
    updateDocumentNonBlocking(userRef, {
      full_name: formData.name,
      bio: formData.bio
    });
    toast({ title: "Profile Updated" });
  };

  const handleToggleModule = (moduleId: string, enabled: boolean) => {
    if (!companyId || !db) return;
    const currentModules = settings?.enabled_modules || ['dashboard', 'projects'];
    let updatedModules;
    if (enabled) {
      updatedModules = Array.from(new Set([...currentModules, moduleId]));
    } else {
      updatedModules = currentModules.filter((id: string) => id !== moduleId);
    }
    const settingsRef = doc(db, 'companies', companyId, 'company_settings', companyId);
    setDocumentNonBlocking(settingsRef, {
      enabled_modules: updatedModules,
      updated_at: serverTimestamp(),
      company_id: companyId,
      id: companyId
    }, { merge: true });
    toast({ title: enabled ? "Module Enabled" : "Module Disabled" });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
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
        <Button variant="destructive" className="rounded-xl px-6" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-white/50 border p-1 h-auto flex-wrap gap-1 rounded-2xl">
          <TabsTrigger value="profile" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <UserIcon className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Lock className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="modules" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Puzzle className="h-4 w-4" /> Modules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-none shadow-soft rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-primary/5 pb-8">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 ring-4 ring-white shadow-xl">
                  <AvatarImage src={tenantProfile?.avatar} />
                  <AvatarFallback>{formData.name.substring(0,2).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl font-bold">{formData.name || "User"}</CardTitle>
                  <CardDescription>{formData.role}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Input value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="rounded-xl" />
                </div>
              </div>
              <Button onClick={handleSaveProfile} className="rounded-xl px-8">Save Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card className="border-none shadow-soft rounded-[2rem] p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl">Module Customization</CardTitle>
              <CardDescription>Enable features for your production workspace.</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {modulesList.map(mod => {
                const isEnabled = settings?.enabled_modules?.includes(mod.id);
                return (
                  <div key={mod.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg"><mod.icon className="h-5 w-5 text-primary" /></div>
                      <div>
                        <h4 className="font-bold text-sm">{mod.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{mod.desc}</p>
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
