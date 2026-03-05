
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { IndianRupee, Download, Plus, PieChart, Loader2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collectionGroup, query, where } from "firebase/firestore";
import { useFirestore } from "@/firebase";

export default function BudgetsPage() {
  const { profile, isLoading: isTenantLoading, companyId } = useTenant();
  const db = useFirestore();

  // Fetch all budgets across projects for this company
  const budgetsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collectionGroup(db, 'budgets'),
      where('companyId', '==', companyId)
    );
  }, [db, companyId]);

  const { data: budgetItems, isLoading: isBudgetsLoading } = useCollection(budgetsQuery);

  if (isTenantLoading || isBudgetsLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalAllocated = budgetItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
  const totalSpent = budgetItems?.reduce((sum, item) => sum + (item.actual || 0), 0) || 0;
  const variance = totalAllocated - totalSpent;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Financial Tracking</h1>
          <p className="text-muted-foreground">Manage production costs and budget allocation across all phases.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <Download className="h-4 w-4" /> Export Report
          </Button>
          <Button size="sm" className="gap-2 rounded-xl shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> New Line Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-emerald-600 mb-2 font-bold uppercase text-[10px]">
              <IndianRupee className="h-3 w-3" /> Total Budget
            </div>
            <div className="text-2xl font-bold font-headline">₹{totalAllocated.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-600 mb-2 font-bold uppercase text-[10px]">
              <PieChart className="h-3 w-3" /> Spent to Date
            </div>
            <div className="text-2xl font-bold font-headline">₹{totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-rose-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-rose-600 mb-2 font-bold uppercase text-[10px]">
              <Filter className="h-3 w-3" /> Remaining
            </div>
            <div className="text-2xl font-bold font-headline">₹{variance.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="bg-white border-b py-4">
          <CardTitle className="text-lg font-headline">Budget Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold text-[11px] uppercase">Category</TableHead>
                <TableHead className="font-bold text-[11px] uppercase">Allocated</TableHead>
                <TableHead className="font-bold text-[11px] uppercase">Actual</TableHead>
                <TableHead className="font-bold text-[11px] uppercase">Utilization</TableHead>
                <TableHead className="font-bold text-[11px] uppercase">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetItems?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No budget data available for this workspace.</TableCell>
                </TableRow>
              ) : (
                budgetItems?.map((item) => {
                  const utilization = item.amount > 0 ? (item.actual / item.amount) * 100 : 0;
                  const isOver = utilization > 100;
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold">{item.category}</TableCell>
                      <TableCell className="font-mono text-xs">₹{item.amount?.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">₹{item.actual?.toLocaleString() || 0}</TableCell>
                      <TableCell className="min-w-[150px]">
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={Math.min(utilization, 100)} 
                            className={`h-1.5 ${isOver ? 'bg-rose-100' : 'bg-muted'}`}
                          />
                          <span className="text-[10px] font-bold">
                            {Math.round(utilization)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={isOver ? 'destructive' : 'secondary'}
                          className="text-[9px] uppercase font-bold"
                        >
                          {isOver ? 'Over' : 'On Track'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
