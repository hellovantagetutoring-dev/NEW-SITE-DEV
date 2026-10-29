"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/lib/types";

function NavLabel({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return <span data-pending={pending || undefined}>{children}</span>;
}

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const workspace = pathname.startsWith("/app/classes/");
  const active =
    pathname.startsWith("/app/calendar")
      ? "calendar"
      : pathname.startsWith("/app/admin")
        ? "admin"
        : "dashboard";

  return (
    <div className={`app-frame tech-stage${workspace ? " app-frame-workspace" : ""}`}>
      <div className={workspace ? "shell shell-wide" : "shell"}>
        <header className="topbar">
          <Link href="/app" className="brand" prefetch>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="logo" width={34} height={28} />
            <span>Vantage Tutoring</span>
          </Link>
          <nav className="nav-links">
            <Link href="/app" prefetch data-active={active === "dashboard"}>
              <NavLabel>{profile.role === "tutor" ? "My students" : "Classes"}</NavLabel>
            </Link>
            <Link href="/app/calendar" prefetch data-active={active === "calendar"}>
              <NavLabel>Calendar</NavLabel>
            </Link>
            {profile.role === "admin" && (
              <Link href="/app/admin" prefetch data-active={active === "admin"}>
                <NavLabel>Admin</NavLabel>
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

        <div className="app-main">{children}</div>

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
