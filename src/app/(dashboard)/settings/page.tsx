import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline text-primary">Company Settings</h1>
        <p className="text-muted-foreground">Manage your workspace identity and global preferences.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Workspace Profile
          </CardTitle>
          <CardDescription>This information is visible to all members of your organization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" defaultValue="DP Studios Global" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Primary Industry</Label>
              <Input id="industry" defaultValue="Media Production" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input id="email" defaultValue="alex@dpstudios.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" placeholder="https://..." />
            </div>
          </div>
          <div className="pt-4 flex justify-end border-t">
            <Button className="gap-2">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
