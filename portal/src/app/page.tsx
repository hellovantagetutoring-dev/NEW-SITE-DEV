import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

export default async function HomePage() {
  const configured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (configured) {
    const profile = await getProfile();
    if (profile) redirect("/app");
  }

  return (
    <div className="shell" style={{ paddingTop: "3rem" }}>
      <div className="brand" style={{ marginBottom: "1.5rem" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" width={36} height={36} />
        <span style={{ fontSize: "1.25rem" }}>Vantage Student Portal</span>
      </div>
      <h1 className="section-title">Your classes. Your workbooks. Your schedule.</h1>
      <p className="muted" style={{ maxWidth: "36rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
        Sign in with Google or email to access Masterclass and 1-on-1 resources stamped for you.
      </p>
      {configured ? (
        <Link href="/login" className="btn btn-primary">
          Log in
        </Link>
      ) : (
        <div className="card" style={{ maxWidth: "40rem" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Setup needed</p>
          <p className="muted" style={{ margin: "0.5rem 0 0", lineHeight: 1.45 }}>
            Create a free Supabase project and copy keys into <code>portal/.env.local</code>. Full
            steps are in <code>portal/SETUP.md</code>.
          </p>
        </div>
      )}
    </div>
  );
}
