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
import { KeyRound, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    
    initiatePasswordReset(auth, email)
      .then(() => {
        setLoading(false);
        setIsSent(true);
        toast({
          title: "Reset Link Dispatched",
          description: `A secure authentication link has been sent to ${email}.`,
        });
      })
      .catch((error: any) => {
        setLoading(false);
        console.error("Password reset error:", error);
        toast({
          variant: "destructive",
          title: "Dispatch Failed",
          description: error.message || "We couldn't process this request. Ensure the account exists and the email provider is active.",
        });
      });
  };

  if (isSent) {
    return (
      <div className="min-h-screen bg-[#F0F1F4] flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden text-center p-10 space-y-6">
          <div className="mx-auto h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Verification Sent</CardTitle>
            <CardDescription className="text-base px-4">
              We've sent a password recovery link to <strong>{email}</strong>. 
              Please follow the instructions in the email to regain access.
            </CardDescription>
          </div>
          <Button onClick={() => router.push('/login')} className="w-full h-12 rounded-xl font-bold">
            Return to Login
          </Button>
          <p className="text-xs text-muted-foreground">
            Didn't receive it? Check your spam folder or <button onClick={() => setIsSent(false)} className="text-primary font-bold hover:underline">try a different email</button>.
          </p>
        </Card>
      </div>
    );
  }

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
            <CardDescription className="text-white/70">Enter your email to receive a secure reset link.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-10">
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="arundevv.com@gmail.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <Button disabled={loading} className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-slate-800/20 bg-slate-800 hover:bg-slate-700">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Request Reset Link"}
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
