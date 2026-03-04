import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, BarChart2, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Analytics & Reports</h1>
          <p className="text-muted-foreground">Detailed insights into production costs and performance.</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" /> Export Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <PieChart className="h-5 w-5 text-accent" />
              Budget Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center border-t">
            <p className="text-sm text-muted-foreground">Chart: Expense distribution by module</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center border-t">
            <p className="text-sm text-muted-foreground">Chart: Monthly growth visualization</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Talent Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center border-t">
            <p className="text-sm text-muted-foreground">Chart: Booking frequency analysis</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
