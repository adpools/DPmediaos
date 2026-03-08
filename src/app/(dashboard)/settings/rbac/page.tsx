"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  UserPlus, 
  Lock, 
  Loader2, 
  MoreHorizontal,
  CheckCircle2, 
  UserCog,
  UserMinus,
  Sparkles,
  X
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
import { ScrollArea } from "@/components/ui/scroll-area";

const MODULES = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'projects', name: 'Project Management' },
  { id: 'services', name: 'Service Builder' },
  { id: 'talents', name: 'Talent Network' },
  { id: 'clients', name: 'Clients' },
  { id: 'crm', name: 'Sales CRM' },
  { id: 'proposals', name: 'Proposal Wizard' },
  { id: 'invoices', name: 'Invoice and Quote' },
  { id: 'accounts', name: 'Accounts' },
  { id: 'research', name: 'Market Intelligence' },
  { id: 'reports', name: 'Analytics' },
];

const PERMISSIONS = ['view', 'create', 'edit', 'delete'] as const;

export default function RBACPage() {
  const { companyId, isLoading: isTenantLoading, profile } = useTenant();
  const db = useFirestore();
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);

  const [inviteData, setInviteData] = useState({
    email: "",
    role_id: "member"
  });

  const rolesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, 'companies', companyId, 'roles');
  }, [db, companyId]);

  const { data: roles, isLoading: isRolesLoading } = useCollection(rolesQuery);

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
    toast({ title: "Permissions Updated", description: `${moduleId.toUpperCase()} ${action} access modified.` });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !inviteData.email || !db) return;

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
      title: "Invitation Sent", 
      description: `A link has been sent to ${inviteData.email}.` 
    });
    
    setInviteData({ email: "", role_id: "member" });
    setIsInviteOpen(false);
    setIsInviting(false);
  };

  const handleUpdateMemberRole = (memberId: string, newRoleId: string) => {
    if (!db || !memberId) return;
    const userRef = doc(db, 'users', memberId);
    updateDocumentNonBlocking(userRef, { role_id: newRoleId });
    toast({ title: "Role Updated" });
    setIsChangeRoleOpen(false);
    setEditingMember(null);
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
          <p className="text-muted-foreground">Manage crew access and workspace permissions.</p>
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
                <Label htmlFor="role">Initial Role</Label>
                <Select onValueChange={(val) => setInviteData({...inviteData, role_id: val})} defaultValue="member">
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    <SelectItem value="member">Standard Member</SelectItem>
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
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                                {(member.fullName || member.full_name)?.substring(0,2).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{member.fullName || member.full_name}</span>
                              <span className="text-[10px] text-muted-foreground">{member.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className="text-[9px] font-bold uppercase">
                            {member.role_id || member.roleId}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-[10px] font-bold uppercase">Active</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-xl">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl w-48">
                              <DropdownMenuItem 
                                className="gap-2 cursor-pointer py-2"
                                onClick={() => {
                                  setEditingMember(member);
                                  setIsChangeRoleOpen(true);
                                }}
                              >
                                <UserCog className="h-4 w-4" /> Change Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 text-destructive">
                                <UserMinus className="h-4 w-4" /> Remove
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
            <Card key={role.id} className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/5 pb-4 px-6 pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold">{role.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 bg-white">
                <div className="flex flex-wrap gap-1.5">
                  {MODULES.map(m => role.permissions?.[m.id]?.view && (
                    <Badge key={m.id} variant="secondary" className="bg-primary/5 text-primary text-[9px] border-none font-bold">
                      {m.name}
                    </Badge>
                  ))}
                </div>
                <div className="pt-4 flex justify-end border-t border-slate-50">
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

      {/* Permission Management Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2rem] p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Configure {selectedRole?.name} Permissions</DialogTitle>
                <DialogDescription>Define module-level access granularly for this role profile.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] p-8 pt-6">
            <div className="space-y-6">
              <table className="w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b">
                    <th className="text-left py-3 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Module</th>
                    {PERMISSIONS.map(p => (
                      <th key={p} className="text-center py-3 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {MODULES.map((module) => (
                    <tr key={module.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-bold text-sm text-slate-700">{module.name}</td>
                      {PERMISSIONS.map((action) => {
                        const isEnabled = selectedRole?.permissions?.[module.id]?.[action] || false;
                        return (
                          <td key={action} className="py-4 text-center">
                            <Switch 
                              checked={isEnabled} 
                              onCheckedChange={(checked) => handleUpdatePermission(module.id, action, checked)}
                              className="mx-auto scale-75"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 bg-slate-50 border-t">
            <Button onClick={() => setIsEditRoleOpen(false)} className="rounded-xl font-bold w-full md:w-auto px-8 h-11">
              Close & Finalize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isChangeRoleOpen} onOpenChange={setIsChangeRoleOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>Update Team Role</DialogTitle>
            <DialogDescription>
              Reassign {editingMember?.fullName || editingMember?.full_name} to a different access profile.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Select 
              key={editingMember?.id}
              defaultValue={editingMember?.role_id || editingMember?.roleId}
              onValueChange={(val) => handleUpdateMemberRole(editingMember?.id, val)}
            >
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                <SelectItem value="member">Standard Member</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}