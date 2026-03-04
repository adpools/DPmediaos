
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Download, Filter, Plus, PieChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BudgetsPage() {
  const budgetItems = [
    { id: "b1", category: "Pre-Production", item: "Location Scouting", budget: 5000, actual: 4200, status: "Under" },
    { id: "b2", category: "Production", item: "Camera Rental", budget: 12000, actual: 12500, status: "Over" },
    { id: "b3", category: "Production", item: "Crew Catering", budget: 2500, actual: 1800, status: "Under" },
    { id: "b4", category: "Post-Production", item: "Color Grading", budget: 8000, actual: 0, status: "Pending" },
    { id: "b5", category: "Talent", item: "Principal Cast", budget: 25000, actual: 25000, status: "On-Track" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Financial Tracking</h1>
          <p className="text-muted-foreground">Manage production costs and budget allocation across all phases.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> New Line Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-emerald-50 border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-emerald-600 mb-2 font-bold uppercase text-[10px]">
              <DollarSign className="h-3 w-3" /> Total Budget
            </div>
            <div className="text-2xl font-bold font-headline">$52,500</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50 border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-600 mb-2 font-bold uppercase text-[10px]">
              <PieChart className="h-3 w-3" /> Spent to Date
            </div>
            <div className="text-2xl font-bold font-headline">$43,500</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-rose-50 border-l-4 border-l-rose-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-rose-600 mb-2 font-bold uppercase text-[10px]">
              <Filter className="h-3 w-3" /> variance
            </div>
            <div className="text-2xl font-bold font-headline">-$9,000</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b py-4">
          <CardTitle className="text-lg font-headline">Budget Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Item</TableHead>
                <TableHead className="font-bold">Allocated</TableHead>
                <TableHead className="font-bold">Actual</TableHead>
                <TableHead className="font-bold">Utilization</TableHead>
                <TableHead className="font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-xs">{item.category}</TableCell>
                  <TableCell className="font-semibold">{item.item}</TableCell>
                  <TableCell className="font-mono">${item.budget.toLocaleString()}</TableCell>
                  <TableCell className="font-mono">${item.actual.toLocaleString()}</TableCell>
                  <TableCell className="min-w-[150px]">
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={(item.actual / item.budget) * 100} 
                        className={`h-1.5 ${item.status === 'Over' ? 'bg-rose-100' : 'bg-muted'}`}
                      />
                      <span className="text-[10px] font-bold">
                        {Math.round((item.actual / item.budget) * 100)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={item.status === 'Over' ? 'destructive' : 'secondary'}
                      className="text-[9px] uppercase font-bold"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
