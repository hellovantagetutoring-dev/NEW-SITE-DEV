import { redirect } from "next/navigation";
import { marketingEnrolUrl } from "@/lib/enrol-links";

/**
 * Legacy path under /app. App layout requires a profile, so bounce via public /enrol.
 * Prefer linking to /enrol or the marketing site directly.
 */
export default async function AppEnrolPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const { program } = await searchParams;
  const q = program ? `?program=${encodeURIComponent(program)}` : "";
  // Absolute marketing URL avoids the authenticated /app layout dead-end when logged out.
  redirect(marketingEnrolUrl(program) || `/enrol${q}`);
}
