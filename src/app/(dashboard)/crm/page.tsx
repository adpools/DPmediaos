"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, DollarSign, Building2, Calendar, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { PIPELINE_STAGES } from "@/lib/mock-data";

export default function CRMPage() {
  const { profile, isLoading: isTenantLoading } = useTenant();
  const db = useFirestore();

  // Fetch leads for this company
  const leadsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return query(
      collection(db, 'companies', profile.companyId, 'leads'),
      orderBy('createdAt', 'desc')
    );
  }, [db, profile?.companyId]);

  const { data: leads, isLoading: isLeadsLoading } = useCollection(leadsQuery);

  if (isTenantLoading || isLeadsLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Sales Pipeline</h1>
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
          const leadsInStage = leads?.filter(l => l.stage === stage.id) || [];
          const totalValue = leadsInStage.reduce((sum, l) => sum + (l.dealValue || 0), 0);

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
                        <span className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{lead.companyName}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{lead.contactPerson}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Industry: {lead.industry}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-1 text-primary font-bold text-sm">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>{(lead.dealValue || 0).toLocaleString()}</span>
                        </div>
                        <Badge variant="secondary" className="text-[9px] h-5 py-0 uppercase font-bold text-accent bg-accent/5 border-none">Active</Badge>
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
