"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { useState } from "react";
import { SUBJECT_ACCENT } from "@/lib/types";

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
  tutorLabel: string;
};

export function DashboardTabs({
  masterclass,
  privateClasses,
  privateAssignments,
}: {
  masterclass: ClassCard[];
  privateClasses: ClassCard[];
  privateAssignments: PrivateCard[];
}) {
  const hasPrivate = privateClasses.length > 0 || privateAssignments.length > 0;
  const hasMaster = masterclass.length > 0;
  const [tab, setTab] = useState<"masterclass" | "private">(
    hasMaster || !hasPrivate ? "masterclass" : "private"
  );

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Program stream" style={{ marginBottom: "1.15rem" }}>
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

      {tab === "masterclass" && (
        <>
          <div className="grid-cards" style={{ marginBottom: "0.5rem" }}>
            {masterclass.map((c) => {
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
                    <span className="pill">Masterclass</span>
                    <h3 style={{ margin: "0.65rem 0 0.25rem", fontSize: "1.05rem" }}>{c.name}</h3>
                    <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                      {[c.subject, c.unit_band, c.year_label].filter(Boolean).join(" · ")}
                    </p>
                  </PendingCardLabel>
                </Link>
              );
            })}
          </div>
          {!masterclass.length && <p className="muted">No masterclass enrolments.</p>}
        </>
      )}

      {tab === "private" && (
        <>
          <div className="grid-cards">
            {privateClasses.map((c) => {
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
                    <span className="pill">Private</span>
                    <h3 style={{ margin: "0.65rem 0 0.25rem", fontSize: "1.05rem" }}>{c.name}</h3>
                    <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                      {[c.subject, c.unit_band].filter(Boolean).join(" · ")}
                    </p>
                  </PendingCardLabel>
                </Link>
              );
            })}
            {privateAssignments.map((p, i) => (
              <div key={`pa-${i}`} className="card" style={{ borderTop: "4px solid var(--gold)" }}>
                <span className="pill">Private</span>
                <h3 style={{ margin: "0.65rem 0 0.25rem", fontSize: "1.05rem" }}>
                  {p.subject || "1-on-1 tutoring"}
                </h3>
                <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
                  Tutor: {p.tutorLabel}
                </p>
                <p style={{ marginTop: "0.75rem" }}>
                  <Link
                    href="/app/calendar"
                    className="btn btn-ghost"
                    style={{ padding: "0.4rem 0.8rem" }}
                  >
                    View sessions
                  </Link>
                </p>
              </div>
            ))}
          </div>
          {!privateClasses.length && !privateAssignments.length && (
            <p className="muted">No private 1-on-1 assignments.</p>
          )}
        </>
      )}
    </>
  );
}
