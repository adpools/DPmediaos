
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Search, Filter, MoreHorizontal, Plus, Briefcase, Mail, Phone, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import Link from "next/link";
import Image from "next/image";

export default function ClientsPage() {
  const { profile, isLoading: isTenantLoading, companyId } = useTenant();
  const db = useFirestore();

  // Fetch unique client entities from the leads collection
  const clientsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'leads'),
      orderBy('company_name', 'asc')
    );
  }, [db, companyId]);

  const { data: leads, isLoading: isLeadsLoading } = useCollection(clientsQuery);

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
          <h1 className="text-3xl font-bold text-primary">Client Directory</h1>
          <p className="text-muted-foreground">Manage your relationships and production partners.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Filter by company..." className="pl-9 h-10 rounded-xl" />
          </div>
          <Link href="/crm">
            <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Register Client
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads?.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No clients registered in your workspace.</p>
            <p className="text-xs mb-4">Start by adding a lead in the CRM.</p>
            <Link href="/crm">
              <Button variant="outline" size="sm" className="rounded-xl">Go to CRM</Button>
            </Link>
          </div>
        ) : (
          leads?.map((client) => (
            <Card key={client.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] overflow-hidden group">
              <CardHeader className="bg-primary/5 pb-4 px-6 pt-6">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="text-[9px] font-bold uppercase py-0 bg-white border-none">
                    {client.industry || 'General Media'}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold mt-4 group-hover:text-primary transition-colors">
                  {client.company_name}
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  {client.contact_person}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4 bg-white">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{client.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>Lead Status: <span className="font-bold text-primary uppercase text-[10px]">{client.stage}</span></span>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2].map(i => (
                      <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold overflow-hidden">
                        <Image src={`https://picsum.photos/seed/c${client.id+i}/40/40`} width={28} height={28} alt="avatar" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button>
                    <Link href={`/clients/${client.id}`}>
                      <Button size="sm" variant="secondary" className="h-8 text-[10px] font-bold uppercase rounded-xl">View Portfolio</Button>
                    </Link>
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
