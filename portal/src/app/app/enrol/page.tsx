import { redirect } from "next/navigation";
import { marketingEnrolUrl } from "@/lib/enrol-links";

/** Public redirect to marketing Enrol today (no login gate). */
export default async function EnrolPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const { program } = await searchParams;
  redirect(marketingEnrolUrl(program));
}
