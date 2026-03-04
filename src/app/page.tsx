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
    if (!isUserLoading) {
      if (!user) {
        router.push("/login");
        return;
      }

      if (!isTenantLoading) {
        // Redirection based on standardized snake_case company_id
        if (!profile || !profile.company_id) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }
    }
  }, [user, isUserLoading, isTenantLoading, profile, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#F0F1F4]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">DP</div>
        <Loader2 className="h-6 w-6 animate-spin text-primary opacity-50" />
      </div>
    </div>
  );
}
