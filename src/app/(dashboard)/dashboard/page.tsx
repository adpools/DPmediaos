"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_TASKS, MOCK_PROJECTS, MOCK_COMPANY } from "@/lib/mock-data";
import { Progress } from "@/components/ui/progress";
import { Search, MoreHorizontal, LayoutGrid, Sparkles, Key } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold font-headline">Hi {MOCK_COMPANY.admin.name}</h1>
        </div>
        <div className="flex flex-col items-end gap-2 mb-1">
          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>15% task completed</span>
            <Progress value={15} className="w-32 h-1.5 bg-white shadow-inner" />
          </div>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {MOCK_PROJECTS.map((proj) => (
          <Card key={proj.id} className={`min-w-[320px] h-[180px] border-none shadow-lg text-white rounded-[2rem] p-8 flex flex-col justify-between group cursor-pointer hover:scale-[1.02] transition-transform ${proj.color}`}>
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                {proj.id === 'proj_1' ? <Sparkles className="h-5 w-5" /> : <Key className="h-5 w-5" />}
              </div>
              <MoreHorizontal className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg leading-tight w-2/3">{proj.name}</h3>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <Avatar key={i} className="h-6 w-6 border-2 border-white/20">
                    <AvatarImage src={`https://picsum.photos/seed/p${i}/40/40`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
            {proj.id === 'proj_2' && (
              <div className="absolute right-4 bottom-4 w-24 h-24 opacity-20 group-hover:opacity-40 transition-opacity">
                 <Image src="https://picsum.photos/seed/hand/200/200" width={100} height={100} alt="decor" className="object-contain" />
              </div>
            )}
          </Card>
        ))}
        <Card className="min-w-[320px] h-[180px] border-2 border-dashed border-white/40 bg-white/5 rounded-[2rem] flex items-center justify-center text-muted-foreground cursor-pointer hover:bg-white/10 transition-colors">
          <div className="flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-full border-2 border-dashed flex items-center justify-center">+</div>
            <span className="text-xs font-bold uppercase tracking-widest">Add Project</span>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-headline">Monthly Tasks</h2>
          <div className="flex gap-3">
             <Button variant="secondary" size="sm" className="bg-white/80 rounded-xl px-4 text-xs font-bold h-9">Archive</Button>
             <Button variant="default" size="sm" className="bg-primary rounded-xl px-4 text-xs font-bold h-9 shadow-lg shadow-primary/20">+ New</Button>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-white/40 pb-1">
          <Tabs defaultValue="active" className="w-auto">
            <TabsList className="bg-transparent h-auto p-0 gap-8">
              <TabsTrigger value="active" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-bold px-0 pb-3">Active Tasks</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-bold px-0 pb-3 text-muted-foreground/60">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2 text-muted-foreground">
             <Search className="h-4 w-4" />
             <span className="text-xs font-bold tracking-tight">Search</span>
          </div>
        </div>

        <div className="space-y-8 pt-4">
          {['Today', 'Tomorrow'].map(group => (
            <div key={group} className="space-y-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">{group}</span>
              <div className="space-y-4">
                {MOCK_TASKS.filter(t => t.group === group).map(task => (
                  <div key={task.id} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl ${task.color} flex items-center justify-center text-white shadow-lg overflow-hidden`}>
                        <Image src={task.icon} width={48} height={48} alt={task.title} className="object-cover" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm leading-none">{task.title}</h4>
                        <p className="text-[11px] text-muted-foreground font-medium">{task.desc}</p>
                      </div>
                    </div>
                    <div className="flex -space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {task.members.map(m => (
                        <Avatar key={m} className="h-6 w-6 border-2 border-[#F0F1F4]">
                          <AvatarImage src={`https://picsum.photos/seed/${m}/40/40`} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
