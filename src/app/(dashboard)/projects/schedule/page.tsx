
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Video, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collectionGroup, query, where, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase";

export default function ProductionSchedulePage() {
  const { profile, companyId, isLoading: isTenantLoading } = useTenant();
  const db = useFirestore();

  // Fetch all production days across projects
  const scheduleQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collectionGroup(db, 'production_days'),
      where('company_id', '==', companyId),
      orderBy('date', 'asc')
    );
  }, [db, companyId]);

  const { data: shootDays, isLoading: isScheduleLoading } = useCollection(scheduleQuery);

  if (isTenantLoading || isScheduleLoading) {
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
          <h1 className="text-3xl font-bold text-primary">Call Sheets & Schedule</h1>
          <p className="text-muted-foreground">Master production calendar and daily call sheet distribution.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border rounded-xl overflow-hidden shadow-sm">
            <Button variant="ghost" size="icon" className="h-9 w-9 border-r rounded-none"><ChevronLeft className="h-4 w-4" /></Button>
            <div className="px-4 text-xs font-bold uppercase tracking-widest">Workspace Timeline</div>
            <Button variant="ghost" size="icon" className="h-9 w-9 border-l rounded-none"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
            <CalendarIcon className="h-4 w-4" /> Add Event
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {shootDays?.length === 0 ? (
          <Card className="border-2 border-dashed flex flex-col items-center justify-center p-20 text-muted-foreground bg-white rounded-3xl">
            <Video className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-medium text-sm">No scheduled production days found.</p>
            <Button variant="link" className="mt-2">Create your first call sheet</Button>
          </Card>
        ) : (
          shootDays?.map((shoot) => (
            <Card key={shoot.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden group rounded-2xl bg-white">
              <div className="flex flex-col md:flex-row">
                <div className="bg-primary/5 p-6 md:w-48 flex flex-col justify-center items-center text-center border-r">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
                    {shoot.date ? new Date(shoot.date).toLocaleDateString() : 'TBD'}
                  </span>
                  <h3 className="font-bold text-lg leading-tight">Shoot Day</h3>
                  <Badge variant="outline" className="mt-3 text-[9px] font-bold uppercase">{shoot.status || 'Confirmed'}</Badge>
                </div>
                <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center gap-8">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-primary">
                      <Video className="h-4 w-4" />
                      <h4 className="font-bold text-base">{shoot.location || 'Location Pending'}</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <MapPin className="h-3.5 w-3.5" />
                        {shoot.location}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        {shoot.schedule || '09:00 AM - 06:00 PM'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Users className="h-3.5 w-3.5" />
                        {shoot.crewTalentIds?.length || 0} Crew Members
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="secondary" size="sm" className="h-9 text-xs font-bold rounded-lg">View Call Sheet</Button>
                    <Button variant="ghost" size="sm" className="h-9 text-xs font-bold text-primary rounded-lg">Email Crew</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
