import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

/** Legacy route: Progress is open on signup; send people into the portal. */
export default async function NotEnrolledPage() {
 const profile = await getProfile();
 if (profile) redirect("/app");
 redirect("/login");
}
