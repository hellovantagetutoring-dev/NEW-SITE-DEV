"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { useState } from "react";
import { SUBJECT_ACCENT } from "@/lib/types";
import { PrivateHomeworkUpload } from "./PrivateHomeworkUpload";

function PendingCardLabel({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return <span data-pending={pending || undefined}>{children}</span>;
}

type ClassCard = {
  id: string;
  name: string;
  subject: string;
  unit_band: string | null;
  year_label: string | null;
  stream?: string | null;
};

type PrivateCard = {
  subject: string | null;
  note: string | null;
  partnerLabel: string;
  studentId?: string;
  tutorId?: string;
};

type MasterSession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location_or_link: string;
  className?: string;
};

type PrivateFile = {
  id: string;
  title: string;
  created_at: string;
  student_id: string;
  tutor_id: string;
  studentLabel?: string;
};

const CONSULT_URL =
  process.env.NEXT_PUBLIC_CONSULT_URL ||
  "https://calendly.com/hello-vantagetutoring/10min";

export function DashboardTabs({
  role,
  resourceClasses,
  masterclassSessions,
  privateAssignments,
  privateFiles,
  tutorStudents,
}: {
  role: string;
  resourceClasses: ClassCard[];
  masterclassSessions: MasterSession[];
  privateAssignments: PrivateCard[];
  privateFiles: PrivateFile[];
  tutorStudents: { id: string; label: string }[];
}) {
  const [tab, setTab] = useState<"resources" | "masterclass" | "private">("resources");

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Portal sections" style={{ marginBottom: "1.15rem" }}>
        <button
          type="button"
          role="tab"
          className="tab"
          data-active={tab === "resources"}
          aria-selected={tab === "resources"}
          onClick={() => setTab("resources")}
        >
          Resources
        </button>
        <button
          type="button"
          role="tab"
          className="tab"
          data-active={tab === "masterclass"}
          aria-selected={tab === "masterclass"}
          onClick={() => setTab("masterclass")}
        >
          Masterclass
        </button>
        <button
          type="button"
          role="tab"
          className="tab"
          data-active={tab === "private"}
          aria-selected={tab === "private"}
          onClick={() => setTab("private")}
        >
          Private 1-on-1
        </button>
      </div>

      {tab === "resources" && (
        <>
          <p className="muted" style={{ marginBottom: "1rem" }}>
            Shared workbooks, homework, and mocks for everyone on the portal.
          </p>
          <div className="grid-cards" style={{ marginBottom: "0.5rem" }}>
            {resourceClasses.map((c) => {
              const accent = SUBJECT_ACCENT[c.subject.toLowerCase()] || "var(--gold)";
              return (
                <Link
                  key={c.id}
                  href={`/app/classes/${c.id}`}
                  className="card card-nav"
                  prefetch
                  style={{ borderTop: `4px solid ${accent}` }}
                >
                  <PendingCardLabel>
                    <span className="pill">Resources</span>
                    <h3 style={{ margin: "0.65rem 0 0.25rem", fontSize: "1.05rem" }}>{c.name}</h3>
                    <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                      {[c.subject, c.unit_band, c.year_label].filter(Boolean).join(" · ")}
                    </p>
                  </PendingCardLabel>
                </Link>
              );
            })}
          </div>
          {!resourceClasses.length && (
            <p className="muted">No shared resources published yet.</p>
          )}
        </>
      )}

      {tab === "masterclass" && (
        <>
          <p className="muted" style={{ marginBottom: "1rem" }}>
            Your masterclass session times. Materials live under Resources. Book a free consult anytime.
          </p>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem" }}>Book a free consultation</h2>
            <p className="muted" style={{ margin: "0 0 0.85rem", fontSize: "0.9rem" }}>
              10-minute intro call — available anytime, even if you are already enrolled.
            </p>
            <a
              className="btn btn-primary"
              href={CONSULT_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book free consult
              <span aria-hidden="true">→</span>
            </a>
          </div>

          <h2 style={{ fontSize: "1.05rem", marginBottom: "0.65rem" }}>Upcoming masterclass times</h2>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {masterclassSessions.map((s) => (
              <div key={s.id} className="card" style={{ padding: "0.9rem 1rem" }}>
                <span className="pill">Masterclass</span>
                <h3 style={{ margin: "0.45rem 0 0.2rem", fontSize: "1rem" }}>{s.title}</h3>
                <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                  {new Date(s.starts_at).toLocaleString("en-AU", {
                    timeZone: "Australia/Brisbane",
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {s.className ? ` · ${s.className}` : ""}
                  {s.location_or_link ? ` · ${s.location_or_link}` : ""}
                </p>
                <p style={{ marginTop: "0.65rem" }}>
                  <Link href="/app/calendar" className="btn btn-ghost" style={{ padding: "0.4rem 0.8rem" }}>
                    Open calendar
                  </Link>
                </p>
              </div>
            ))}
            {!masterclassSessions.length && (
              <p className="muted">No upcoming masterclass sessions scheduled yet.</p>
            )}
          </div>
        </>
      )}

      {tab === "private" && (
        <>
          <p className="muted" style={{ marginBottom: "1rem" }}>
            Your 1-on-1 pairs, sessions, and custom homework from your tutor.
          </p>
          <div className="grid-cards" style={{ marginBottom: "1rem" }}>
            {privateAssignments.map((p, i) => (
              <div key={`pa-${i}`} className="card" style={{ borderTop: "4px solid var(--gold)" }}>
                <span className="pill">Private</span>
                <h3 style={{ margin: "0.65rem 0 0.25rem", fontSize: "1.05rem" }}>
                  {p.subject || "1-on-1 tutoring"}
                </h3>
                <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                  {p.partnerLabel}
                  {p.note ? ` · ${p.note}` : ""}
                </p>
                <p style={{ marginTop: "0.75rem" }}>
                  <Link
                    href="/app/calendar"
                    className="btn btn-ghost"
                    style={{ padding: "0.4rem 0.8rem" }}
                  >
                    Sessions / request reschedule
                  </Link>
                </p>
              </div>
            ))}
          </div>
          {!privateAssignments.length && (
            <p className="muted" style={{ marginBottom: "1rem" }}>
              No private 1-on-1 assignments yet.
            </p>
          )}

          {(role === "tutor" || role === "admin") && (
            <PrivateHomeworkUpload students={tutorStudents} />
          )}

          {privateFiles.length > 0 && (
            <div style={{ marginTop: "1.25rem" }}>
              <h2 style={{ fontSize: "1.05rem", marginBottom: "0.65rem" }}>Custom 1-on-1 files</h2>
              <div style={{ display: "grid", gap: "0.55rem" }}>
                {privateFiles.map((f) => (
                  <div
                    key={f.id}
                    className="card"
                    style={{
                      padding: "0.75rem 1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong>{f.title}</strong>
                      <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.82rem" }}>
                        {f.studentLabel ? `${f.studentLabel} · ` : ""}
                        {new Date(f.created_at).toLocaleDateString("en-AU")}
                      </p>
                    </div>
                    <a className="btn btn-ghost" href={`/api/download/private/${f.id}`}>
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
