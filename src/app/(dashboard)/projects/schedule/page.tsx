
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Video, ChevronRight, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProductionSchedulePage() {
  const shootDays = [
    {
      id: "d1",
      day: "Shoot Day 01",
      date: "Oct 12, 2024",
      scene: "Intro & Exterior",
      location: "Hyde Park, London",
      time: "06:00 AM - 04:00 PM",
      crew: 12,
      status: "Confirmed"
    },
    {
      id: "d2",
      day: "Shoot Day 02",
      date: "Oct 13, 2024",
      scene: "Interview Segments",
      location: "DP Studio A",
      time: "09:00 AM - 06:00 PM",
      crew: 8,
      status: "Confirmed"
    },
    {
      id: "d3",
      day: "Shoot Day 03",
      date: "Oct 14, 2024",
      scene: "Night Sequence",
      location: "Soho Alleyways",
      time: "08:00 PM - 04:00 AM",
      crew: 15,
      status: "Pending Gear"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Call Sheets & Schedule</h1>
          <p className="text-muted-foreground">Master production calendar and daily call sheet distribution.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border rounded-xl overflow-hidden shadow-sm">
            <Button variant="ghost" size="icon" className="h-9 w-9 border-r rounded-none"><ChevronLeft className="h-4 w-4" /></Button>
            <div className="px-4 text-xs font-bold uppercase tracking-widest">October 2024</div>
            <Button variant="ghost" size="icon" className="h-9 w-9 border-l rounded-none"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Button className="gap-2">
            <CalendarIcon className="h-4 w-4" /> Add Event
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {shootDays.map((shoot) => (
          <Card key={shoot.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="flex flex-col md:flex-row">
              <div className="bg-primary/5 p-6 md:w-48 flex flex-col justify-center items-center text-center border-r">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{shoot.date}</span>
                <h3 className="font-bold text-lg leading-tight">{shoot.day}</h3>
                <Badge variant="outline" className="mt-3 text-[9px] font-bold uppercase">{shoot.status}</Badge>
              </div>
              <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center gap-8">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 text-primary">
                    <Video className="h-4 w-4" />
                    <h4 className="font-bold text-base">{shoot.scene}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <MapPin className="h-3.5 w-3.5" />
                      {shoot.location}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      {shoot.time}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Users className="h-3.5 w-3.5" />
                      {shoot.crew} Crew Members
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" size="sm" className="h-9 text-xs font-bold">View Call Sheet</Button>
                  <Button variant="ghost" size="sm" className="h-9 text-xs font-bold text-primary">Email Crew</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
