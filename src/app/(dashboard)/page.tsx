import { redirect } from "next/navigation";

export default function DashboardIndexRedirect() {
  // Redundant redirect to ensure any hits to the layout root are handled
  redirect("/dashboard");
}
