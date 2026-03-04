'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { useTenant } from "@/hooks/use-tenant";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const { user, isUserLoading } = useUser();
  const { companyId, isSuperAdmin, isLoading: isTenantLoading, profile } = useTenant();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push("/login");
        return;
      }

      if (!isTenantLoading) {
        // Redirection logic standardizing on Super Admin authority or company presence
        const cId = profile?.company_id || (profile as any)?.companyId;
        const isHardcodedAdmin = user.email === 'arundevv.com@gmail.com';
        
        if (isSuperAdmin || isHardcodedAdmin) {
          router.push("/dashboard");
        } else if (!cId) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }
    }
  }, [user, isUserLoading, isTenantLoading, profile, isSuperAdmin, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#F0F1F4]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">DP</div>
        <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
      </div>
    </div>
  );
}
