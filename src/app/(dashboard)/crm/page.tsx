"use client";

import { PIPELINE_STAGES, MOCK_LEADS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, DollarSign, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CRMPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Sales Pipeline</h1>
          <p className="text-muted-foreground">Track and manage your media production leads.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-250px)]">
        {PIPELINE_STAGES.map((stage) => {
          const leadsInStage = MOCK_LEADS.filter(l => l.stage === stage.id);
          const totalValue = leadsInStage.reduce((sum, l) => sum + l.value, 0);

          return (
            <div key={stage.id} className="flex flex-col gap-4 min-w-[300px] w-[300px]">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{stage.name}</h3>
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{leadsInStage.length}</Badge>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground tracking-tight">
                  ${(totalValue / 1000).toFixed(0)}k total
                </span>
              </div>

              <div className="flex flex-col gap-3 h-full">
                {leadsInStage.map((lead) => (
                  <Card key={lead.id} className="cursor-pointer hover:ring-1 hover:ring-accent/50 transition-all border-none shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-semibold leading-tight">{lead.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{lead.company}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1 text-primary font-bold text-xs">
                          <DollarSign className="h-3 w-3" />
                          <span>{lead.value.toLocaleString()}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] h-5 py-0">Hot</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button variant="ghost" className="w-full border-2 border-dashed border-muted h-24 hover:bg-muted/50 transition-colors">
                  <Plus className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-xs text-muted-foreground font-medium">Add to {stage.name}</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}