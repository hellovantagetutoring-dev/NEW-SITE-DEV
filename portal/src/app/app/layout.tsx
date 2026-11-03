import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getProfile } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  // Unverified sign-ups still get Progress tools; program tabs stay gated.

  return <AppShell profile={profile}>{children}</AppShell>;
}
