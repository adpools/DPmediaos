"use client";

import Image from "next/image";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, LayoutGrid, List as ListIcon, Calendar, MoreVertical, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Media Projects</h1>
          <p className="text-muted-foreground">Manage your production lifecycle from pre to post.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="flex items-center justify-between bg-white p-2 rounded-xl border shadow-sm">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 gap-2">
            <LayoutGrid className="h-4 w-4" /> Grid
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-2 bg-muted">
            <ListIcon className="h-4 w-4" /> List
          </Button>
          <div className="h-4 w-px bg-border mx-2" />
          <Button variant="ghost" size="sm" className="h-8 gap-2">
            <Calendar className="h-4 w-4" /> Timeline
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {MOCK_PROJECTS.map((proj) => (
          <Card key={proj.id} className="border-none shadow-sm hover:shadow-md transition-shadow group">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="p-6 md:w-1/3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg leading-none group-hover:text-primary transition-colors">{proj.name}</h3>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider py-0 px-2">
                      {proj.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">ID: {proj.id}</span>
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col justify-center gap-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Overall Progress</span>
                    <span>{proj.progress}%</span>
                  </div>
                  <Progress value={proj.progress} className="h-2" />
                </div>

                <div className="p-6 md:w-1/4 flex items-center justify-end gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Deadline</span>
                    <span className="text-sm font-semibold">{proj.dueDate}</span>
                  </div>
                  
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-muted flex items-center justify-center text-[10px] font-bold overflow-hidden">
                        <Image src={`https://picsum.photos/seed/${proj.id+i}/50/50`} width={32} height={32} alt="member" />
                      </div>
                    ))}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Project</DropdownMenuItem>
                      <DropdownMenuItem>Budget Tracking</DropdownMenuItem>
                      <DropdownMenuItem>Daily Call Sheets</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
