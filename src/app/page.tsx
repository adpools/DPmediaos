"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // In a real app, check if company is onboarded
    const onboarded = true; 
    if (onboarded) {
      router.push('/(dashboard)');
    } else {
      router.push('/onboarding');
    }
  }, [router]);

  return null;
}