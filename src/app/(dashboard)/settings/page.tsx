
"use client";

import { useState, useEffect, Suspense, useRef } from "react";
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
  PieChart,
  Building2,
  Globe,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Camera,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTenant } from "@/hooks/use-tenant";
import { useFirestore, useAuth, useStorage } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function AccountCenterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const storage = useStorage();
  const { profile: tenantProfile, user, settings, company, companyId, isLoading: isTenantLoading } = useTenant();
  
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile State
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    bio: "",
    avatar: ""
  });

  // Company State
  const [companyData, setCompanyData] = useState({
    name: "",
    website: "",
    contact_email: "",
    contact_phone: "",
    cin: "",
    gstin: "",
    address: "",
    bank_name: "",
    account_no: "",
    ifsc: "",
    branch: "",
    pan: ""
  });

  useEffect(() => {
    if (tenantProfile) {
      setProfileData({
        name: tenantProfile.fullName || tenantProfile.full_name || "",
        email: tenantProfile.email || "",
        bio: tenantProfile.bio || "",
        avatar: tenantProfile.avatar || ""
      });
    }
    if (company) {
      setCompanyData({
        name: company.name || "",
        website: company.website || "",
        contact_email: company.contact_email || "",
        contact_phone: company.contact_phone || "",
        cin: company.cin || "",
        gstin: company.gstin || "",
        address: company.address || "",
        bank_name: company.bank_details?.bank_name || "",
        account_no: company.bank_details?.account_no || "",
        ifsc: company.bank_details?.ifsc || "",
        branch: company.bank_details?.branch || "",
        pan: company.bank_details?.pan || ""
      });
    }
  }, [tenantProfile, company]);

  const modulesList = [
    { id: "dashboard", name: "Dashboard", desc: "Workspace overview and task summary", icon: LayoutGrid, isCore: true },
    { id: "projects", name: "Project Management", desc: "Production workflows, budgets, and schedules", icon: Film, isCore: true },
    { id: "talents", name: "Talent Network", desc: "Global actor and influencer booking database", icon: Users },
    { id: "crm", name: "Sales CRM", desc: "Client relationship and pipeline tracking", icon: Briefcase },
    { id: "proposals", name: "Proposal Wizard", desc: "AI-assisted production proposal generation", icon: FileText },
    { id: "invoices", name: "Finance Hub", desc: "Automated invoicing and cloud sync", icon: Receipt },
    { id: "research", name: "Market Intelligence", icon: Search },
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
      fullName: profileData.name,
      full_name: profileData.name,
      bio: profileData.bio,
      avatar: profileData.avatar,
      updatedAt: serverTimestamp()
    });
    toast({ title: "Profile Updated", description: "Your changes have been saved." });
  };

  const handleSaveCompany = () => {
    if (!companyId || !db) return;
    const compRef = doc(db, 'companies', companyId);
    updateDocumentNonBlocking(compRef, {
      name: companyData.name,
      website: companyData.website,
      contact_email: companyData.contact_email,
      contact_phone: companyData.contact_phone,
      cin: companyData.cin,
      gstin: companyData.gstin,
      address: companyData.address,
      bank_details: {
        bank_name: companyData.bank_name,
        account_no: companyData.account_no,
        ifsc: companyData.ifsc,
        branch: companyData.branch,
        pan: companyData.pan
      },
      updatedAt: serverTimestamp()
    });
    toast({ title: "Company Profile Saved", description: "Workspace details updated successfully." });
  };

  const handleToggleModule = (moduleId: string, enabled: boolean) => {
    if (!companyId || !db) return;
    const currentModules = settings?.enabledModules || ['dashboard', 'projects'];
    let updatedModules;
    if (enabled) {
      updatedModules = Array.from(new Set([...currentModules, moduleId]));
    } else {
      updatedModules = currentModules.filter((id: string) => id !== moduleId);
    }
    const settingsRef = doc(db, 'companies', companyId, 'company_settings', companyId);
    setDocumentNonBlocking(settingsRef, {
      enabledModules: updatedModules,
      updatedAt: serverTimestamp(),
      company_id: companyId,
      id: companyId
    }, { merge: true });
    toast({ title: enabled ? "Module Enabled" : "Module Disabled" });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const uid = user?.uid || tenantProfile?.id;

    if (!file || !uid || !storage || !db) {
      console.warn("Upload aborted: missing required context", { file: !!file, uid, storage: !!storage, db: !!db });
      return;
    }

    // 1. Client-side Validation
    if (!file.type.startsWith('image/')) {
      toast({ variant: "destructive", title: "Invalid File", description: "Please upload an image file." });
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB Limit
      toast({ variant: "destructive", title: "File Too Large", description: "Image must be less than 2MB." });
      return;
    }

    setIsUploading(true);
    try {
      // 2. Upload to Firebase Storage
      // Using user.uid for path reliability
      const storageRef = ref(storage, `users/${uid}/avatar`);
      console.log("Initiating upload to:", storageRef.fullPath);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // 3. Update local state
      setProfileData(prev => ({ ...prev, avatar: downloadURL }));
      
      // 4. Persist to Firestore
      const userRef = doc(db, 'users', uid);
      updateDocumentNonBlocking(userRef, {
        avatar: downloadURL,
        updatedAt: serverTimestamp()
      });
      
      toast({ title: "Profile Image Updated", description: "Your avatar has been synced successfully." });
    } catch (error: any) {
      console.error("Storage upload error details:", error);
      
      let errorMsg = "Could not upload image. Please try again.";
      if (error.code === 'storage/unauthorized') {
        errorMsg = "Unauthorized. Please ensure Firebase Storage is enabled in the console.";
      } else if (error.code === 'storage/retry-limit-exceeded') {
        errorMsg = "Network timeout. Please check your connection.";
      } else if (error.code === 'storage/no-default-bucket') {
        errorMsg = "Configuration error: No default storage bucket found.";
      }

      toast({ 
        variant: "destructive", 
        title: "Upload Failed", 
        description: errorMsg 
      });
    } finally {
      setIsUploading(false);
      // Reset input value so same file can be re-uploaded if fixed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isTenantLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
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
        <Button variant="ghost" className="rounded-xl px-6 text-rose-500 hover:bg-rose-50" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-white/50 border p-1 h-auto flex-wrap gap-1 rounded-2xl">
          <TabsTrigger value="profile" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <UserIcon className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="company" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Building2 className="h-4 w-4" /> Company
          </TabsTrigger>
          <TabsTrigger value="modules" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Puzzle className="h-4 w-4" /> Modules
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-4 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Lock className="h-4 w-4" /> Security
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-none shadow-soft rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-primary/5 pb-8">
              <div className="flex items-center gap-6">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <Avatar className={cn(
                    "h-24 w-24 ring-4 ring-white shadow-xl transition-all",
                    isUploading && "opacity-50"
                  )}>
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback className="text-2xl font-bold bg-white text-primary">
                      {profileData.name.substring(0,2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute inset-0 bg-black/40 rounded-full flex items-center justify-center transition-opacity",
                    isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}>
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">{profileData.name || "User"}</CardTitle>
                  <CardDescription className="uppercase text-[10px] font-bold tracking-widest mt-1">
                    {tenantProfile?.role_id?.toUpperCase() || 'MEMBER'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <Alert className="bg-blue-50 border-blue-100 rounded-2xl">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 font-bold">Upload Troubleshooting</AlertTitle>
                <AlertDescription className="text-blue-700 text-xs">
                  If upload fails, ensure <strong>Firebase Storage</strong> is activated in your project console and rules are deployed. Use the camera icon or click the avatar to select a file.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={profileData.name} 
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                    className="rounded-xl" 
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profile Picture URL (Optional)</Label>
                  <Input 
                    value={profileData.avatar} 
                    onChange={(e) => setProfileData({...profileData, avatar: e.target.value})} 
                    className="rounded-xl" 
                    placeholder="https://..."
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Bio</Label>
                  <Input 
                    value={profileData.bio} 
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})} 
                    className="rounded-xl" 
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} className="rounded-xl px-8 font-bold">Save Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPANY TAB */}
        <TabsContent value="company" className="space-y-6">
          <Card className="border-none shadow-soft rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-primary/5 pb-8">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                  <Building2 className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Company Workspace</CardTitle>
                  <CardDescription>Legal and operational details for your media production entity.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Core Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Registered Name</Label>
                    <Input 
                      value={companyData.name} 
                      onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Official Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={companyData.website} 
                        onChange={(e) => setCompanyData({...companyData, website: e.target.value})}
                        className="pl-9 rounded-xl"
                        placeholder="www.yourcompany.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={companyData.contact_email} 
                        onChange={(e) => setCompanyData({...companyData, contact_email: e.target.value})}
                        className="pl-9 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={companyData.contact_phone} 
                        onChange={(e) => setCompanyData({...companyData, contact_phone: e.target.value})}
                        className="pl-9 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Legal & Tax */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Legal & Tax Identifiers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>CIN (Corporate Identification Number)</Label>
                    <Input 
                      value={companyData.cin} 
                      onChange={(e) => setCompanyData({...companyData, cin: e.target.value})}
                      className="rounded-xl font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GSTIN</Label>
                    <Input 
                      value={companyData.gstin} 
                      onChange={(e) => setCompanyData({...companyData, gstin: e.target.value})}
                      className="rounded-xl font-mono uppercase"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Official Business Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={companyData.address} 
                        onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
                        className="pl-9 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Bank Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Receipt className="h-4 w-4" /> Bank Registry (For Invoices)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input 
                      value={companyData.bank_name} 
                      onChange={(e) => setCompanyData({...companyData, bank_name: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input 
                      value={companyData.account_no} 
                      onChange={(e) => setCompanyData({...companyData, account_no: e.target.value})}
                      className="rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input 
                      value={companyData.ifsc} 
                      onChange={(e) => setCompanyData({...companyData, ifsc: e.target.value})}
                      className="rounded-xl font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Input 
                      value={companyData.branch} 
                      onChange={(e) => setCompanyData({...companyData, branch: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PAN (Company)</Label>
                    <Input 
                      value={companyData.pan} 
                      onChange={(e) => setCompanyData({...companyData, pan: e.target.value})}
                      className="rounded-xl font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveCompany} className="rounded-xl px-12 h-12 font-bold shadow-lg shadow-primary/20">
                  Save Workspace Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MODULES TAB */}
        <TabsContent value="modules">
          <Card className="border-none shadow-soft rounded-[2rem] p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl">Module Customization</CardTitle>
              <CardDescription>Enable features for your production workspace.</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {modulesList.map(mod => {
                const isEnabled = settings?.enabledModules?.includes(mod.id);
                return (
                  <div key={mod.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg"><mod.icon className="h-5 w-5 text-primary" /></div>
                      <div>
                        <h4 className="font-bold text-sm">{mod.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{mod.desc || 'Modular media utility'}</p>
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
