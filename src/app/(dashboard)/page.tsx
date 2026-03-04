import { redirect } from "next/navigation";

export default function DashboardRoot() {
  // Redirect to avoid collision at the root path within the route group
  redirect("/dashboard");
}
