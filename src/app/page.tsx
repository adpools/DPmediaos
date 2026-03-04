import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirect to the dashboard sub-route to avoid route collision with (dashboard)/page.tsx
  redirect("/dashboard");
}
