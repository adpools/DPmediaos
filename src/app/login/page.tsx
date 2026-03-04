"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/firebase";
import { initiateEmailSignIn } from "@/firebase/non-blocking-login";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    initiateEmailSignIn(auth, email, password)
      .catch((error: any) => {
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: error.message || "Invalid email or password. Please try again.",
        });
      });
    // Successful redirection is handled by the root page/layout listeners
  };

  return (
    <div className="min-h-screen bg-[#F0F1F4] flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-4 pt-10 pb-6 text-center bg-primary text-white relative">
          <Sparkles className="absolute top-6 right-6 h-6 w-6 text-accent opacity-50" />
          <div className="mx-auto h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <span className="font-bold text-xl">DP</span>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-headline font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-white/70">Sign in to your production workspace.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" title="Recover account" className="text-xs text-primary font-bold hover:underline">Forgot password?</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <Button disabled={loading} className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In to OS"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="p-8 pt-0 text-center flex flex-col gap-4">
          <p className="text-sm text-muted-foreground font-medium">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline">Start free trial</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
