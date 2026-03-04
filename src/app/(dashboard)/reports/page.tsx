
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, TrendingUp, DollarSign, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from "recharts";

const REVENUE_DATA = [
  { month: "Jan", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 },
  { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 55000 },
  { month: "Jun", revenue: 72000 },
];

const BUDGET_DATA = [
  { name: "Pre-Prod", value: 400, color: "#FF71A4" },
  { name: "Production", value: 1200, color: "#B199FF" },
  { name: "Post-Prod", value: 600, color: "#6366F1" },
  { name: "Marketing", value: 300, color: "#10B981" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Analytics & Intelligence</h1>
          <p className="text-muted-foreground">Deep insights into production efficiency and revenue growth.</p>
        </div>
        <Button className="gap-2 rounded-xl">
          <Download className="h-4 w-4" /> Export All Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", val: "$345,000", change: "+12.5%", icon: DollarSign, color: "text-emerald-500" },
          { label: "Active Projects", val: "24", change: "+4", icon: Briefcase, color: "text-blue-500" },
          { label: "Talent Bookings", val: "156", change: "+18%", icon: Users, color: "text-purple-500" },
          { label: "Market Reach", val: "4.2M", change: "+5.2%", icon: TrendingUp, color: "text-accent" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg bg-slate-50 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{stat.change}</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold font-headline">{stat.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Monthly Revenue Trends</CardTitle>
            <CardDescription>Consolidated earnings across all media modules</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="revenue" fill="#B199FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Budget Allocation</CardTitle>
            <CardDescription>Current spending distribution per production phase</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={BUDGET_DATA}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {BUDGET_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
             <div className="w-1/3 space-y-4">
               {BUDGET_DATA.map((item) => (
                 <div key={item.name} className="flex items-center gap-2">
                   <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                   <div className="flex-1">
                     <p className="text-[10px] font-bold">{item.name}</p>
                     <p className="text-xs text-muted-foreground font-mono">{item.value} units</p>
                   </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
