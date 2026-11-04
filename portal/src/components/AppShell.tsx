"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { PortalIcon } from "@/components/PortalIcon";
import type { Profile } from "@/lib/types";
import { StudentPreviewProvider } from "@/lib/student-preview";
import {
  StudentPreviewBanner,
  StudentPreviewControls,
} from "@/components/StudentPreviewControls";

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
  const canPreview = profile.role === "admin" || profile.role === "tutor";
  const active =
    pathname.startsWith("/app/calendar")
      ? "calendar"
      : pathname.startsWith("/app/admin")
        ? "admin"
        : "dashboard";

  return (
    <StudentPreviewProvider canPreview={canPreview}>
      <div className={`app-frame tech-stage${workspace ? " app-frame-workspace" : ""}`}>
        <div className={workspace ? "shell shell-wide" : "shell"}>
          <header className="topbar">
            <Link href="/app" className="brand" prefetch>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="logo" width={40} height={33} />
              <span>Vantage Tutoring</span>
            </Link>
            <nav className="nav-links" aria-label="Primary">
              <Link href="/app" prefetch data-active={active === "dashboard"}>
                <PortalIcon name="home" size={16} />
                <NavLabel>Home</NavLabel>
              </Link>
              {profile.role !== "unverified" && (
                <Link href="/app/calendar" prefetch data-active={active === "calendar"}>
                  <PortalIcon name="calendar" size={16} />
                  <NavLabel>Calendar</NavLabel>
                </Link>
              )}
              {profile.role === "admin" && (
                <Link href="/app/admin" prefetch data-active={active === "admin"}>
                  <PortalIcon name="admin" size={16} />
                  <NavLabel>Admin</NavLabel>
                </Link>
              )}
              {canPreview && <StudentPreviewControls />}
              <form action="/auth/signout" method="post">
                <button type="submit" className="btn btn-ghost btn-shell-action">
                  Sign out
                </button>
              </form>
            </nav>
          </header>

          <StudentPreviewBanner />

          {!workspace && (
            <p className="role-chip" style={{ marginBottom: "1.75rem" }}>
              {profile.full_name || profile.email}
              <span aria-hidden="true">·</span>
              <span style={{ textTransform: "capitalize" }}>{profile.role}</span>
            </p>
          )}

          <div className="app-main">{children}</div>

          {!workspace && (
            <footer className="shell-footer">
              <span>Learning Portal</span>
              <span className="shell-footer-links">
                <a
                  href="https://vantagetutoring.com.au/legal#privacy"
                  target="_blank"
                  rel="noreferrer"
                >
                  Privacy
                </a>
                <a
                  href="https://vantagetutoring.com.au/legal#terms"
                  target="_blank"
                  rel="noreferrer"
                >
                  Terms
                </a>
                <a href="https://vantagetutoring.com.au" target="_blank" rel="noreferrer">
                  vantagetutoring.com.au
                </a>
              </span>
            </footer>
          )}
        </div>
      </div>
    </StudentPreviewProvider>
  );
}
