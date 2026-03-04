
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { useTenant } from "@/hooks/use-tenant";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const { user, isUserLoading } = useUser();
  const { companyId, isLoading: isTenantLoading, profile } = useTenant();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (!isUserLoading) {
      if (!user) {
        // User not signed in
        router.push("/login");
        return;
      }

      // If user is signed in, wait for tenant/profile loading to finish
      if (!isTenantLoading) {
        if (!profile || !companyId) {
          // User signed in but has no profile/company (needs onboarding)
          router.push("/onboarding");
        } else {
          // User signed in and has a company
          router.push("/dashboard");
        }
      }
    }
  }, [user, isUserLoading, companyId, isTenantLoading, profile, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#F0F1F4]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">DP</div>
        <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
      </div>
    </div>
  );
}
