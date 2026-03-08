
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Archive, 
  RotateCcw, 
  Trash2, 
  Loader2, 
  Building2, 
  Film, 
  Search,
  AlertTriangle,
  History,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/hooks/use-tenant";
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { 
  addDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from "@/firebase/non-blocking-updates";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function ArchivesPage() {
  const { companyId, isLoading: isTenantLoading } = useTenant();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [itemToRestore, setItemToRestore] = useState<any>(null);

  // Fetch Archives
  const archivesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, 'companies', companyId, 'archives'),
      orderBy('archived_at', 'desc')
    );
  }, [db, companyId]);

  const { data: archives, isLoading: isArchivesLoading } = useCollection(archivesQuery);

  const filteredArchives = useMemo(() => {
    if (!archives) return [];
    return archives.filter(item => 
      (item.company_name || item.project_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [archives, searchQuery]);

  const clients = useMemo(() => filteredArchives.filter(i => i.archive_type === 'client' || i.archive_type === 'lead'), [filteredArchives]);
  const projects = useMemo(() => filteredArchives.filter(i => i.archive_type === 'project'), [filteredArchives]);

  const handlePermanentDelete = () => {
    if (!db || !companyId || !itemToDelete) return;
    const archiveRef = doc(db, 'companies', companyId, 'archives', itemToDelete.id);
    deleteDocumentNonBlocking(archiveRef);
    toast({ 
      variant: "destructive",
      title: "Permanent Purge Complete", 
      description: "Data has been scrubbed from the workspace vault." 
    });
    setItemToDelete(null);
  };

  const handleRestore = () => {
    if (!db || !companyId || !itemToRestore) return;

    const item = itemToRestore;
    const targetCollection = item.archive_type === 'project' ? 'projects' : 'leads';
    const targetRef = collection(db, 'companies', companyId, targetCollection);
    
    // Remove archive-specific fields
    const { id, archive_type, archived_at, ...originalData } = item;

    addDocumentNonBlocking(targetRef, {
      ...originalData,
      restored_at: new Date().toISOString()
    });

    const archiveRef = doc(db, 'companies', companyId, 'archives', id);
    deleteDocumentNonBlocking(archiveRef);

    toast({ 
      title: "Record Restored", 
      description: `"${item.company_name || item.project_name}" is back in the active workspace.` 
    });
    setItemToRestore(null);
  };

  if (isTenantLoading || isArchivesLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tighter">Workspace Vault</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Archive className="h-3.5 w-3.5" /> Decommissioned clients and projects for audit or recovery.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search vault..." 
            className="pl-10 h-11 rounded-2xl bg-white shadow-sm border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-soft bg-indigo-50 border border-indigo-100 rounded-[2rem]">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
            <Info className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-indigo-900 text-sm">Vault Retention Policy</h4>
            <p className="text-xs text-indigo-800/70 leading-relaxed">
              Archived items are retained indefinitely until you choose to <strong>Permanently Delete</strong> them. 
              Restoring an item will move it back to its original production or CRM stage.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="bg-white/50 border p-1 rounded-2xl mb-8 h-auto flex-wrap">
          <TabsTrigger value="clients" className="rounded-xl px-8 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-xs uppercase tracking-widest">
            <Building2 className="h-4 w-4" /> Archived Clients ({clients.length})
          </TabsTrigger>
          <TabsTrigger value="projects" className="rounded-xl px-8 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-xs uppercase tracking-widest">
            <Film className="h-4 w-4" /> Archived Projects ({projects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.length === 0 ? (
              <EmptyState icon={Building2} label="No archived clients found." />
            ) : (
              clients.map(item => (
                <ArchiveCard 
                  key={item.id} 
                  item={item} 
                  onRestore={setItemToRestore} 
                  onDelete={setItemToDelete} 
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length === 0 ? (
              <EmptyState icon={Film} label="No archived projects found." />
            ) : (
              projects.map(item => (
                <ArchiveCard 
                  key={item.id} 
                  item={item} 
                  onRestore={setItemToRestore} 
                  onDelete={setItemToDelete} 
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* CONFIRMATION DIALOGS */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter">Confirm Permanent Purge?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium text-base">
              You are about to permanently delete <strong>{itemToDelete?.company_name || itemToDelete?.project_name}</strong>. 
              This action is irreversible and will scrub all associated metadata from your cloud records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl h-12 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-rose-500 hover:bg-rose-600 rounded-xl h-12 font-black uppercase text-xs tracking-widest px-8">
              Scrub Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!itemToRestore} onOpenChange={(open) => !open && setItemToRestore(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
              <RotateCcw className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter">Restore to Active?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              This will move <strong>{itemToRestore?.company_name || itemToRestore?.project_name}</strong> back into your main workspace operations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-6">
            <AlertDialogCancel className="rounded-xl h-12 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12 font-black uppercase text-xs tracking-widest px-8">
              Confirm Restoration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ArchiveCard({ item, onRestore, onDelete }: { item: any, onRestore: (i: any) => void, onDelete: (i: any) => void }) {
  return (
    <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden group bg-white hover:shadow-md transition-all">
      <CardHeader className="bg-slate-50/50 pb-4 px-6 pt-6">
        <div className="flex justify-between items-start">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
            {item.archive_type === 'project' ? <Film className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
          </div>
          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-200 text-slate-400">
            Archived
          </Badge>
        </div>
        <CardTitle className="text-lg font-bold mt-4 truncate">
          {item.company_name || item.project_name}
        </CardTitle>
        <CardDescription className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mt-1">
          <History className="h-3 w-3" /> Moved to vault on {new Date(item.archived_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-white border-t border-slate-50 flex items-center gap-2">
        <Button 
          variant="outline" 
          className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest gap-2"
          onClick={() => onRestore(item)}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Restore
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-xl h-10 w-10 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed text-muted-foreground">
      <Icon className="h-12 w-12 mx-auto mb-4 opacity-10" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
