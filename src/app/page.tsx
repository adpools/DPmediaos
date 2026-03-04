import { redirect } from "next/navigation";

export default function RootPage() {
  // Clear redirect to handle the entry point of the application
  // The (dashboard) layout handles the root path at /
  redirect("/");
}
