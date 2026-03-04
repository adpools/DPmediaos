import { redirect } from "next/navigation";

export default function RootPage() {
  // Central redirect to handle the entry point of the application
  redirect("/dashboard");
}
