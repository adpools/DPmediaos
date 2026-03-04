"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/firebase";
import { initiatePasswordReset } from "@/firebase/non-blocking-login";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    initiatePasswordReset(auth, email)
      .then(() => {
        setLoading(false);
        toast({
          title: "Reset Email Sent",
          description: "Check your inbox for instructions to reset your password.",
        });
        router.push("/login");
      })
      .catch((error: any) => {
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Request Failed",
          description: error.message || "We couldn't find an account with that email.",
        });
      });
  };

  return (
    <div className="min-h-screen bg-[#F0F1F4] flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-4 pt-10 pb-6 text-center bg-slate-800 text-white relative">
          <KeyRound className="absolute top-6 right-6 h-6 w-6 text-accent opacity-50" />
          <div className="mx-auto h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <span className="font-bold text-xl">DP</span>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-headline font-bold">Account Recovery</CardTitle>
            <CardDescription className="text-white/70">Enter your email to receive a reset link.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-10">
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="alex@company.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <Button disabled={loading} className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-slate-800/20 bg-slate-800 hover:bg-slate-700">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="p-8 pt-0 text-center flex flex-col gap-4">
          <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-bold hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
