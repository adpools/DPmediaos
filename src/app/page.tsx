import { redirect } from "next/navigation";

export default function RootPage() {
  // In a real application, logic to check if a user is authenticated or onboarded would go here.
  // For now, we redirect to the dashboard.
  const onboarded = true;

  if (!onboarded) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
