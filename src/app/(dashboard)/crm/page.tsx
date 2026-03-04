
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, DollarSign, User, Building2, Calendar, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PIPELINE_STAGES, MOCK_LEADS } from "@/lib/mock-data";

export default function CRMPage() {
  const [leads, setLeads] = useState(MOCK_LEADS);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Sales Pipeline</h1>
          <p className="text-muted-foreground">Track opportunities and manage client relations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Find a lead..." className="pl-9 h-10 rounded-xl" />
          </div>
          <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Add Lead
          </Button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 min-h-[calc(100vh-250px)] scrollbar-hide">
        {PIPELINE_STAGES.map((stage) => {
          const leadsInStage = leads.filter(l => l.stage === stage.id);
          const totalValue = leadsInStage.reduce((sum, l) => sum + l.value, 0);

          return (
            <div key={stage.id} className="flex flex-col gap-4 min-w-[320px] w-[320px]">
              <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm uppercase tracking-wider">{stage.name}</h3>
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold bg-white">{leadsInStage.length}</Badge>
                </div>
                <span className="text-[11px] font-bold text-muted-foreground">
                  ${(totalValue / 1000).toFixed(1)}k
                </span>
              </div>

              <div className="flex flex-col gap-4 h-full">
                {leadsInStage.map((lead) => (
                  <Card key={lead.id} className="cursor-pointer hover:ring-2 hover:ring-primary/10 transition-all border-none shadow-sm group">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{lead.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{lead.company}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Last Activity: 2d ago</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-1 text-primary font-bold text-sm">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>{lead.value.toLocaleString()}</span>
                        </div>
                        <Badge variant="secondary" className="text-[9px] h-5 py-0 uppercase font-bold text-accent bg-accent/5 border-none">Hot</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button variant="ghost" className="w-full border-2 border-dashed border-slate-200 h-24 hover:bg-white hover:border-primary/20 transition-all rounded-2xl group">
                  <Plus className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
