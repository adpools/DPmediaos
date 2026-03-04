import { StatCard } from "@/components/dashboard/stat-card";
import { 
  Film, 
  DollarSign, 
  Users, 
  Briefcase, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_PROJECTS, MOCK_LEADS } from "@/lib/mock-data";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-headline text-primary">Overview</h1>
        <p className="text-muted-foreground">Welcome back, Alex. Here's what's happening with DP Studios today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Projects" 
          value={12} 
          description="4 starting this week" 
          icon={Film} 
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard 
          title="Monthly Revenue" 
          value="$84,200" 
          description="Vs $76,100 last month" 
          icon={DollarSign} 
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          title="Talent Bookings" 
          value={24} 
          description="8 pending approval" 
          icon={Users} 
          trend={{ value: 2, isPositive: false }}
        />
        <StatCard 
          title="Sales Pipeline" 
          value="$280k" 
          description="Total potential value" 
          icon={Briefcase} 
          trend={{ value: 18, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-headline">Recent Projects</CardTitle>
              <CardDescription>Status and progress tracking</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/projects">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {MOCK_PROJECTS.map((proj) => (
                <div key={proj.id} className="flex items-center justify-between group">
                  <div className="flex flex-col gap-1 min-w-[200px]">
                    <span className="font-semibold">{proj.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Due {proj.dueDate}
                    </span>
                  </div>
                  <div className="flex-1 max-w-[200px] px-8">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span>Progress</span>
                      <span>{proj.progress}%</span>
                    </div>
                    <Progress value={proj.progress} className="h-1.5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary font-medium">
                      {proj.status}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Pipeline Value</CardTitle>
            <CardDescription>Projected revenue by stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-4">
                {[
                  { stage: 'Won', value: 120000, color: 'bg-emerald-500' },
                  { stage: 'Proposal Sent', value: 85000, color: 'bg-indigo-500' },
                  { stage: 'Meeting', value: 45000, color: 'bg-cyan-500' },
                  { stage: 'Lead', value: 30000, color: 'bg-slate-500' },
                ].map((item) => (
                  <div key={item.stage} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{item.stage}</span>
                      <span>${(item.value / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color}`} 
                        style={{ width: `${(item.value / 120000) * 100}%` }} 
                      />
                    </div>
                  </div>
                ))}
             </div>
             <div className="pt-4 mt-4 border-t flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>3 Deals closed this week</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                  <span>2 High-value leads cooling down</span>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}