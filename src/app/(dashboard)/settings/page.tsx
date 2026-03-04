import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline text-primary">Workspace Settings</h1>
        <p className="text-muted-foreground">Manage your production environment and global preferences.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            General Profile
          </CardTitle>
          <CardDescription>Configure your workspace identity for internal tracking and project reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Studio Name</Label>
              <Input id="companyName" defaultValue="DP Studios Global" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Primary Focus</Label>
              <Input id="industry" defaultValue="Media Production" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input id="email" defaultValue="studio@dpstudios.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" placeholder="https://..." />
            </div>
          </div>
          <div className="pt-4 flex justify-end border-t">
            <Button className="gap-2">
              <Save className="h-4 w-4" /> Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
