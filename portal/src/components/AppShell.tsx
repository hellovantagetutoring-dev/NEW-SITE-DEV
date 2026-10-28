import Link from "next/link";
import type { Profile } from "@/lib/types";

export function AppShell({
  profile,
  active,
  mode = "default",
  children,
}: {
  profile: Profile;
  active?: "dashboard" | "calendar" | "admin";
  mode?: "default" | "workspace";
  children: React.ReactNode;
}) {
  const workspace = mode === "workspace";

  return (
    <div className={`app-frame tech-stage${workspace ? " app-frame-workspace" : ""}`}>
      <div className={workspace ? "shell shell-wide" : "shell"}>
        <header className="topbar">
          <Link href="/app" className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="logo" width={34} height={28} />
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
              <button type="submit" className="btn btn-ghost btn-shell-action">
                Sign out
              </button>
            </form>
          </nav>
        </header>

        {!workspace && (
          <p className="role-chip" style={{ marginBottom: "1.35rem" }}>
            {profile.full_name || profile.email}
            <span aria-hidden="true">·</span>
            <span style={{ textTransform: "capitalize" }}>{profile.role}</span>
          </p>
        )}

        {children}

        {!workspace && (
          <footer className="shell-footer">
            <span>Student Portal</span>
            <a href="https://vantagetutoring.com.au" target="_blank" rel="noreferrer">
              vantagetutoring.com.au
            </a>
          </footer>
        )}
      </div>
    </div>
  );
}
