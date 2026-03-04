import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, UserPlus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RBACPage() {
  const roles = [
    { name: 'Admin', users: 1, permissions: 'Full Access' },
    { name: 'Producer', users: 5, permissions: 'Projects, CRM, Talent' },
    { name: 'Accountant', users: 2, permissions: 'Finance Only' },
    { name: 'Viewer', users: 12, permissions: 'Read-only Access' },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Access Control (RBAC)</h1>
          <p className="text-muted-foreground">Manage roles and permissions for your team members.</p>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" /> Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {roles.map((role) => (
          <Card key={role.name} className="border-none shadow-sm hover:bg-muted/30 transition-colors">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{role.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> {role.permissions}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-sm font-bold block">{role.users}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Assigned Users</span>
                </div>
                <Button variant="outline" size="sm">Edit Permissions</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
