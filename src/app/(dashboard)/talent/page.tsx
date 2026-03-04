"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Heart, MapPin, Instagram, Users, Plus, Calendar, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useFirestore } from "@/firebase";

export default function TalentPage() {
  const { profile, isLoading: isTenantLoading } = useTenant();
  const db = useFirestore();

  const talentsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return query(
      collection(db, 'companies', profile.companyId, 'talents'),
      orderBy('createdAt', 'desc')
    );
  }, [db, profile?.companyId]);

  const { data: talents, isLoading: isTalentsLoading } = useCollection(talentsQuery);

  if (isTenantLoading || isTalentsLoading) {
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
          <h1 className="text-3xl font-bold text-primary">Talent Marketplace</h1>
          <p className="text-muted-foreground">Find and book professional talent for your next production.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Heart className="h-4 w-4" /> Favorites
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> List Your Talent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Name or keyword..." className="pl-9 text-xs" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</Label>
                <div className="flex flex-wrap gap-2">
                  {['Actor', 'Actress', 'Influencer', 'Model', 'VO'].map(cat => (
                    <Badge key={cat} variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Social Range</Label>
                <div className="space-y-3">
                   <div className="flex items-center justify-between text-[10px] font-medium">
                     <span>0</span>
                     <span>1M+ Followers</span>
                   </div>
                   <Slider defaultValue={[20]} max={100} step={1} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</Label>
                <Select>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="london">London</SelectItem>
                    <SelectItem value="ny">New York</SelectItem>
                    <SelectItem value="la">Los Angeles</SelectItem>
                    <SelectItem value="paris">Paris</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="secondary" className="w-full text-xs h-9">Reset Filters</Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-accent/5 border-l-4 border-l-accent">
            <CardContent className="p-4 space-y-2">
              <h4 className="font-semibold text-sm">Need custom casting?</h4>
              <p className="text-xs text-muted-foreground">Our agency partners can handle your specific requirements.</p>
              <Button variant="link" className="p-0 text-accent text-xs h-auto">Contact Casting Dept</Button>
            </CardContent>
          </Card>
        </aside>

        <main className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {talents?.map((talent) => (
            <Card key={talent.id} className="overflow-hidden group border-none shadow-sm hover:shadow-md transition-all">
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                <Image 
                  src={talent.portfolioUrls?.[0] || `https://picsum.photos/seed/${talent.id}/400/600`} 
                  alt={talent.fullName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute bottom-3 left-3 flex gap-1">
                  <Badge className="bg-white/90 text-primary border-none text-[10px]">{talent.category}</Badge>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base leading-none">{talent.fullName}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {talent.location}
                    </p>
                  </div>
                  <span className="font-bold text-accent text-sm">{talent.rates?.[0] || 'Contact'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[10px] font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Instagram className="h-3 w-3" />
                    <span>{talent.followers?.toLocaleString() || '0'} followers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3" />
                    <span>Eng. {talent.engagementRate ? (talent.engagementRate * 100).toFixed(1) : '0'}%</span>
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <Button className="flex-1 text-xs h-9">Book Talent</Button>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </main>
      </div>
    </div>
  );
}
