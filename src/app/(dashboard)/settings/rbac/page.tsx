"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  UserPlus, 
  Lock, 
  Loader2, 
  MoreVertical, 
  MoreHorizontal,
  CheckCircle2, 
  UserCog,
  UserMinus,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, where, doc, serverTimestamp } from "firebase/firestore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";

const MODULES = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'projects', name: 'Project Management' },
  { id: 'talents', name: 'Talent Network' },
  { id: 'clients', name: 'Clients' },
  { id: 'crm', name: 'Sales CRM' },
  { id: 'proposals', name: 'Proposal Wizard' },
  { id: 'invoices', name: 'Finance Hub' },
  { id: 'research', name: 'Market Intelligence' },
  { id: 'reports', name: 'Analytics' },
];

export default function RBACPage() {
  const { companyId, isLoading: isTenantLoading, profile } = useTenant();
  const db = useFirestore();
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Invite State
  const [inviteData, setInviteData] = useState({
    email: "",
    role_id: "member"
  });

  // Fetch Roles
  const rolesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, 'companies', companyId, 'roles');
  }, [db, companyId]);

  const { data: roles, isLoading: isRolesLoading } = useCollection(rolesQuery);

  // Fetch Users
  const usersQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, 'users'), where('company_id', '==', companyId));
  }, [db, companyId]);

  const { data: members, isLoading: isUsersLoading } = useCollection(usersQuery);

  const handleUpdatePermission = (moduleId: string, action: string, enabled: boolean) => {
    if (!selectedRole || !companyId || !db) return;

    const roleRef = doc(db, 'companies', companyId, 'roles', selectedRole.id);
    const updatedPermissions = { ...selectedRole.permissions };
    
    if (!updatedPermissions[moduleId]) {
      updatedPermissions[moduleId] = { view: false, create: false, edit: false, delete: false };
    }
    
    updatedPermissions[moduleId][action] = enabled;

    updateDocumentNonBlocking(roleRef, {
      permissions: updatedPermissions
    });

    setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
    toast({ title: "Permissions Updated" });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !inviteData.email || !db) {
      toast({ 
        variant: "destructive", 
        title: "Configuration Error", 
        description: "Your workspace context is still initializing. Please wait a moment." 
      });
      return;
    }

    setIsInviting(true);
    const inviteRef = collection(db, 'companies', companyId, 'invitations');
    
    addDocumentNonBlocking(inviteRef, {
      email: inviteData.email,
      role_id: inviteData.role_id,
      invited_by: profile?.id || 'system',
      company_id: companyId,
      status: 'pending',
      created_at: serverTimestamp()
    });

    toast({ 
      title: "Invitation Dispatched", 
      description: `A workspace access link has been sent to ${inviteData.email}.` 
    });
    
    setInviteData({ email: "", role_id: "member" });
    setIsInviteOpen(false);
    setIsInviting(false);
  };

  const handleRemoveMember = (memberId: string, name: string) => {
    if (memberId === profile?.id) {
      toast({ variant: "destructive", title: "Action blocked", description: "You cannot remove yourself." });
      return;
    }
    if (!db) return;
    const userRef = doc(db, 'users', memberId);
    updateDocumentNonBlocking(userRef, { company_id: null, role_id: null });
    toast({ title: "Member Removed", description: `${name} no longer has access to this workspace.` });
  };

  if (isTenantLoading || isRolesLoading || isUsersLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Team & Access Control</h1>
          <p className="text-muted-foreground">Manage your production crew and their workspace permissions.</p>
        </div>
        
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
              <UserPlus className="h-4 w-4" /> Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Invite to Workspace
              </DialogTitle>
              <DialogDescription>
                Grant access to your secure production environment.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  required 
                  value={inviteData.email}
                  onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Assign Initial Role</Label>
                <Select onValueChange={(val) => setInviteData({...inviteData, role_id: val})} defaultValue="member">
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    {!roles?.some(r => r.id === 'admin') && <SelectItem value="admin">Administrator</SelectItem>}
                    {!roles?.some(r => r.id === 'member') && <SelectItem value="member">Standard Member</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isInviting} className="w-full rounded-xl h-11 font-bold">
                  {isInviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="bg-white/50 border p-1 h-auto rounded-2xl">
          <TabsTrigger value="members" className="rounded-xl px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">Team Members</TabsTrigger>
          <TabsTrigger value="roles" className="rounded-xl px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">Role Definitions</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white border-b px-8 py-6">
              <CardTitle className="text-xl">Active Workspace Members</CardTitle>
              <CardDescription>Users currently affiliated with this company.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/50 border-b">
                    <tr>
                      <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">User</th>
                      <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Role</th>
                      <th className="p-4 text-left font-bold text-[11px] uppercase tracking-wider">Status</th>
                      <th className="p-4 text-right font-bold text-[11px] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {members?.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 ring-2 ring-primary/5">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                                {(member.fullName || member.full_name)?.substring(0,2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{member.fullName || member.full_name || 'New Member'}</span>
                              <span className="text-[10px] text-muted-foreground font-medium">{member.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className="text-[9px] font-bold uppercase py-0 bg-primary/5 text-primary border-none">
                            {member.role_id || member.roleId}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Active</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-white rounded-xl">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl w-48">
                              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2">Manage User</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 cursor-pointer py-2">
                                <UserCog className="h-4 w-4" /> Change Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="gap-2 text-destructive cursor-pointer py-2"
                                onClick={() => handleRemoveMember(member.id, member.fullName || member.full_name)}
                              >
                                <UserMinus className="h-4 w-4" /> Remove from Team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles?.map((role) => (
            <Card key={role.id} className="border-none shadow-sm rounded-3xl overflow-hidden hover:ring-2 hover:ring-primary/5 transition-all">
              <CardHeader className="bg-primary/5 pb-4 px-6 pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="text-[9px] uppercase font-bold">Workspace Role</Badge>
                </div>
                <CardTitle className="text-xl font-bold">{role.name}</CardTitle>
                <CardDescription className="text-xs">Managed capabilities for this profile.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4 bg-white">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Active Permissions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {MODULES.map(m => {
                      const canView = role.permissions?.[m.id]?.view;
                      return canView ? (
                        <Badge key={m.id} variant="secondary" className="bg-primary/5 text-primary text-[9px] border-none font-bold">
                          {m.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
                
                <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <Lock className="h-3 w-3" /> System Verified
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl font-bold text-xs h-9"
                    onClick={() => {
                      setSelectedRole(role);
                      setIsEditRoleOpen(true);
                    }}
                  >
                    Edit Permissions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2rem] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Configure {selectedRole?.name}
            </DialogTitle>
            <DialogDescription>
              Define module-level access rights for this workspace role.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            {MODULES.map((module) => (
              <div key={module.id} className="p-4 bg-muted/30 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-primary">{module.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Enable Module</span>
                    <Switch 
                      checked={selectedRole?.permissions?.[module.id]?.view || false}
                      onCheckedChange={(checked) => handleUpdatePermission(module.id, 'view', checked)}
                    />
                  </div>
                </div>
                
                {selectedRole?.permissions?.[module.id]?.view && (
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-200/50">
                    {['create', 'edit', 'delete'].map(action => (
                      <div key={action} className="flex flex-col gap-1.5">
                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">{action}</Label>
                        <Switch 
                          checked={selectedRole?.permissions?.[module.id]?.[action] || false}
                          onCheckedChange={(checked) => handleUpdatePermission(module.id, action, checked)}
                          className="scale-75 origin-left"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-[2rem]">
            <Button onClick={() => setIsEditRoleOpen(false)} className="w-full rounded-xl h-11 font-bold shadow-lg shadow-primary/10">
              Finalize Role Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
