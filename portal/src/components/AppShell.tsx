import Link from "next/link";
import type { Profile } from "@/lib/types";

export function AppShell({
  profile,
  active,
  children,
}: {
  profile: Profile;
  active?: "dashboard" | "calendar" | "admin";
  // dashboard = classes for students/admin, or 1-1 students for tutors
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/app" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={28} height={28} />
          <span>Vantage Tutoring</span>
        </Link>
        <nav className="nav-links">
          <Link href="/app" data-active={active === "dashboard"}>
            {profile.role === "tutor" ? "My students" : "Classes"}
          </Link>
          <Link href="/app/calendar" data-active={active === "calendar"}>
            Calendar
          </Link>
          {profile.role === "admin" && (
            <Link href="/app/admin" data-active={active === "admin"}>
              Admin
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn btn-ghost" style={{ padding: "0.35rem 0.8rem" }}>
              Sign out
            </button>
          </form>
        </nav>
      </header>
      <p className="muted" style={{ marginTop: "-0.4rem", marginBottom: "1.25rem", fontSize: "0.9rem" }}>
        Signed in as {profile.full_name || profile.email} · {profile.role}
      </p>
      {children}
      <footer className="muted" style={{ marginTop: "2.5rem", fontSize: "0.82rem" }}>
        vantagetutoring.com.au · Student Portal
      </footer>
    </div>
  );
}
