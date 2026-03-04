"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/firebase";
import { initiateEmailSignUp } from "@/firebase/non-blocking-login";
import Link from "next/link";
import { Sparkles, Loader2, ShieldCheck } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    initiateEmailSignUp(auth, email, password);
  };

  return (
    <div className="min-h-screen bg-[#F0F1F4] flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-4 pt-10 pb-6 text-center bg-accent text-white relative">
          <Sparkles className="absolute top-6 right-6 h-6 w-6 text-white opacity-50" />
          <div className="mx-auto h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <span className="font-bold text-xl">DP</span>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-headline font-bold">Get Started</CardTitle>
            <CardDescription className="text-white/70">Create your secure multi-tenant account.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-10">
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="alex@dpstudios.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="At least 8 characters" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="bg-muted/30 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> Security Guarantee
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your data is isolated at the tenant level. We enforce strict cross-company data access blocks by default.
              </p>
            </div>
            <Button disabled={loading} className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-accent/20 bg-accent hover:bg-accent/90">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Workspace"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="p-8 pt-0 text-center flex flex-col gap-4">
          <p className="text-sm text-muted-foreground font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-accent font-bold hover:underline">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
