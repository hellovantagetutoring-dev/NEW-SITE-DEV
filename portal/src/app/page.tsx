import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthAsideFloats } from "@/components/AuthAsideFloats";
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
    <main className="auth-page tech-stage">
      <div className="auth-decor" aria-hidden="true">
        <span className="auth-blob auth-blob-gold" />
        <span className="auth-blob auth-blob-navy" />
        <span className="auth-blob auth-blob-sky" />
      </div>

      <div className="auth-card">
        <aside className="auth-aside">
          <AuthAsideFloats />
          <div className="auth-aside-inner">
            <p className="auth-aside-kicker">Student Portal</p>
            <h2 className="auth-aside-title">Welcome</h2>
            <p className="auth-aside-copy">
              Your classes, workbooks, and schedule live here, ready for enrolled students and
              tutors.
            </p>
          </div>
        </aside>

        <div className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-brand auth-brand-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Vantage Tutoring" className="logo" width={44} height={37} />
            </div>
            <h1 className="auth-title auth-title-center">Vantage Tutoring</h1>
            <p className="auth-lead auth-lead-center">
              Sign in with Google or email to access Masterclass and 1-on-1 resources.
            </p>
            {configured ? (
              <Link href="/login" className="btn btn-primary btn-block">
                Sign in
                <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <div className="card" style={{ textAlign: "left" }}>
                <p style={{ margin: 0, fontWeight: 700, color: "var(--bg-navy)" }}>Setup needed</p>
                <p className="muted" style={{ margin: "0.5rem 0 0", lineHeight: 1.45 }}>
                  Create a free Supabase project and copy keys into <code>portal/.env.local</code>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
