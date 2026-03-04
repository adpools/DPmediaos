
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ExternalLink,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase";

export default function ProposalsPage() {
  const { profile, isLoading: isTenantLoading } = useTenant();
  const db = useFirestore();

  const proposalsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return query(
      collection(db, 'companies', profile.companyId, 'proposals'),
      orderBy('createdAt', 'desc')
    );
  }, [db, profile?.companyId]);

  const { data: proposals, isLoading: isProposalsLoading } = useCollection(proposalsQuery);

  if (isTenantLoading || isProposalsLoading) {
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
          <h1 className="text-3xl font-bold text-primary">Sales Proposals</h1>
          <p className="text-muted-foreground">Generate, manage, and track client project proposals.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Find a proposal..." className="pl-9 h-10 rounded-xl" />
          </div>
          <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> New Proposal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {proposals?.length === 0 ? (
          <Card className="border-2 border-dashed flex flex-col items-center justify-center p-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-medium text-sm">No proposals generated yet.</p>
            <Button variant="link" className="mt-2">Launch Proposal Wizard</Button>
          </Card>
        ) : (
          proposals?.map((prop) => (
            <Card key={prop.id} className="hover:shadow-md transition-all border-none shadow-sm group">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{prop.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Ref: {prop.proposalNumber} • Client: {prop.clientName || 'Private'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Status</span>
                    <Badge variant={prop.status === 'accepted' ? 'default' : prop.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[9px] uppercase font-bold">
                      {prop.status}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Sent At</span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {prop.sentAt ? new Date(prop.sentAt).toLocaleDateString() : 'Draft'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button className="rounded-xl text-xs h-9 px-4 font-bold">Edit</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
