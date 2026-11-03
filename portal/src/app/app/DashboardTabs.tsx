"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { useMemo, useState } from "react";
import { marketingEnrolUrl } from "@/lib/enrol-links";
import { SUBJECT_ACCENT } from "@/lib/types";
import { useStudentPreview } from "@/lib/student-preview";
import { PrivatePairsPanel } from "./PrivatePairsPanel";
import { ProgramGate } from "./ProgramGate";
import { AssessmentDropbox } from "./progress/AssessmentDropbox";
import { ProgressTools } from "./progress/ProgressTools";

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

export type ProgramAccess = {
 private: boolean;
 masterclass: boolean;
 ucat: boolean;
};

type TabId = "private" | "masterclass" | "ucat" | "progress";

const CONSULT_URL =
 process.env.NEXT_PUBLIC_CONSULT_URL ||
 "https://calendly.com/hello-vantagetutoring/10min";

function ResourceLibrary({
 classes,
 enrolled,
 staff,
 emptyLabel,
}: {
 classes: ClassCard[];
 enrolled: Set<string>;
 staff: boolean;
 emptyLabel: string;
}) {
 const sorted = useMemo(
 () =>
 [...classes].sort((a, b) => {
 const ae = staff || enrolled.has(a.subject.toLowerCase()) ? 0 : 1;
 const be = staff || enrolled.has(b.subject.toLowerCase()) ? 0 : 1;
 if (ae !== be) return ae - be;
 return a.name.localeCompare(b.name);
 }),
 [classes, staff, enrolled]
 );

 if (!sorted.length) return <p className="muted">{emptyLabel}</p>;

 return (
 <div className="resource-card-grid">
 {sorted.map((c) => {
 const accent = SUBJECT_ACCENT[c.subject.toLowerCase()] || "var(--gold)";
 const locked = !staff && !enrolled.has(c.subject.toLowerCase());
 const meta = [c.subject, c.unit_band, c.year_label].filter(Boolean).join(" · ");
 if (locked) {
 const program = c.subject.toLowerCase() === "ucat" ? "ucat" : "masterclass";
 return (
 <a
 key={c.id}
 href={marketingEnrolUrl(program)}
 target="_blank"
 rel="noopener noreferrer"
 className="resource-card resource-card-locked"
 style={{ borderTop: `3px solid ${accent}` }}
 >
 <span className="pill pill-locked">Locked</span>
 <h3>{c.name}</h3>
 <p className="muted" style={{ margin: 0, fontSize: "0.86rem" }}>
 {meta}
 </p>
 <span className="resource-card-cta">Enrol today</span>
 </a>
 );
 }
 return (
 <Link
 key={c.id}
 href={`/app/classes/${c.id}`}
 className="resource-card"
 prefetch
 style={{ borderTop: `3px solid ${accent}` }}
 >
 <PendingCardLabel>
 <span className="pill">Library</span>
 <h3>{c.name}</h3>
 <p className="muted" style={{ margin: 0, fontSize: "0.86rem" }}>
 {meta}
 </p>
 </PendingCardLabel>
 </Link>
 );
 })}
 </div>
 );
}

function SessionBlock({
 sessions,
 emptyLabel,
}: {
 sessions: MasterSession[];
 emptyLabel: string;
}) {
 return (
 <div className="dash-section">
 <div className="dash-section-head">
 <h2>Upcoming sessions</h2>
 <Link href="/app/calendar" className="btn btn-ghost btn-compact">
 Calendar
 </Link>
 </div>
 <div className="session-list">
 {sessions.map((s) => (
 <div key={s.id} className="session-row">
 <div>
 <h3>{s.title}</h3>
 <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
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
 </div>
 </div>
 ))}
 {!sessions.length && <p className="muted">{emptyLabel}</p>}
 </div>
 </div>
 );
}

export function DashboardTabs({
 role,
 programAccess,
 masterclassClasses,
 ucatClasses,
 enrolledSubjectSlugs = [],
 masterclassSessions,
 ucatSessions,
 privateAssignments,
 privateFiles,
 tutorStudents = [],
}: {
 role: string;
 programAccess: ProgramAccess;
 masterclassClasses: ClassCard[];
 ucatClasses: ClassCard[];
 enrolledSubjectSlugs?: string[];
 masterclassSessions: MasterSession[];
 ucatSessions: MasterSession[];
 privateAssignments: PrivateCard[];
 privateFiles: PrivateFile[];
 tutorStudents?: { id: string; label: string }[];
}) {
 const preview = useStudentPreview();
 const staff = (role === "tutor" || role === "admin") && !preview.enabled;

 const access = useMemo((): ProgramAccess => {
 if (staff) return { private: true, masterclass: true, ucat: true };
 if (preview.enabled) {
 const tier = preview.tier;
 const subjectsOn = preview.subjectScope === "all";
 return {
 private: subjectsOn && (tier === "private_1on1" || tier === "both"),
 masterclass: subjectsOn && (tier === "masterclass" || tier === "both"),
 ucat: false,
 };
 }
 return programAccess;
 }, [staff, preview.enabled, preview.tier, preview.subjectScope, programAccess]);

 const defaultTab: TabId = access.private
 ? "private"
 : access.masterclass
 ? "masterclass"
 : access.ucat
 ? "ucat"
 : "progress";
 const [tab, setTab] = useState<TabId>(defaultTab);

 const enrolled = useMemo(() => {
 if (preview.enabled) {
 if (preview.subjectScope === "all") {
 return new Set(
 [...masterclassClasses, ...ucatClasses].map((c) => c.subject.toLowerCase())
 );
 }
 return new Set<string>();
 }
 if (staff) {
 return new Set(
 [...masterclassClasses, ...ucatClasses].map((c) => c.subject.toLowerCase())
 );
 }
 return new Set(enrolledSubjectSlugs.map((s) => s.toLowerCase()));
 }, [
 preview.enabled,
 preview.subjectScope,
 staff,
 masterclassClasses,
 ucatClasses,
 enrolledSubjectSlugs,
 ]);

 const pairTutors = useMemo(() => {
 const map = new Map<string, string>();
 for (const p of privateAssignments) {
 if (p.tutorId) {
 map.set(
 p.tutorId,
 p.partnerLabel.replace(/^Tutor:\s*/, "").replace(/\s*↔.*$/, "") || "Tutor"
 );
 }
 }
 return [...map.entries()].map(([id, label]) => ({ id, label }));
 }, [privateAssignments]);

 const tabs: { id: TabId; label: string; locked: boolean }[] = [
 { id: "private", label: "Private", locked: !access.private },
 { id: "masterclass", label: "Masterclass", locked: !access.masterclass },
 { id: "ucat", label: "UCAT", locked: !access.ucat },
 { id: "progress", label: "Progress", locked: false },
 ];

 return (
 <>
 <div className="segmented dash-tabs" role="tablist" aria-label="Programs">
 {tabs.map((t) => (
 <button
 key={t.id}
 type="button"
 role="tab"
 className="segmented-item"
 data-active={tab === t.id}
 data-locked={t.locked || undefined}
 aria-selected={tab === t.id}
 onClick={() => setTab(t.id)}
 >
 {t.label}
 {t.locked ? <span className="tab-lock" aria-hidden="true" /> : null}
 </button>
 ))}
 </div>

 {tab === "private" && (
 <div className="dash-panel">
 {!access.private ? (
 <ProgramGate
 program="private"
 title="Private 1-1 is locked"
 body="Enrol in Private 1-1 for a matched tutor, custom homework, and flexible sessions. You can still browse Masterclass if you’re enrolled there."
 />
 ) : (
 <>
 <p className="muted dash-lead">
 Your tutoring pairs, custom files, and assessment dropbox. Shared subject libraries
 live under Masterclass.
 </p>
 {preview.enabled ? (
 <p className="muted">Exit student view to manage private pair files.</p>
 ) : (
 <PrivatePairsPanel
 role={role}
 pairs={privateAssignments}
 files={privateFiles}
 />
 )}
 <div className="dash-section" style={{ marginTop: "1.5rem" }}>
 <div className="dash-section-head">
 <h2>Assessment dropbox</h2>
 </div>
 <AssessmentDropbox
 role={role}
 tutors={pairTutors}
 students={tutorStudents}
 />
 </div>
 </>
 )}
 </div>
 )}

 {tab === "masterclass" && (
 <div className="dash-panel">
 {!access.masterclass ? (
 <>
 <ProgramGate
 program="masterclass"
 title="Masterclass is restricted"
 body="You’re on Private 1-1 only. Enrol in Masterclass for weekly sessions, worked solutions, and recordings. Subject libraries you’ve been paired for may still open with Private access."
 />
 {enrolled.size > 0 && (
 <div className="dash-section" style={{ marginTop: "1.25rem" }}>
 <div className="dash-section-head">
 <h2>Subject libraries</h2>
 </div>
 <ResourceLibrary
 classes={masterclassClasses}
 enrolled={enrolled}
 staff={false}
 emptyLabel="No masterclass libraries yet."
 />
 </div>
 )}
 </>
 ) : (
 <>
 <p className="muted dash-lead">
                Subject libraries, upcoming sessions, and a free consult anytime, not only for
                enrolment questions.
 </p>

 <div className="dash-consult">
 <div className="dash-consult-main">
 <span className="pill">Free consult</span>
 <h3>Talk through more than just content</h3>
 <p className="muted">
 Book a short call for study strategies, subject and pathway guidance, exam
 planning, or how to get the most from Masterclass and your portal resources.
                    No obligation. Use it whenever you need a clear next step.
 </p>
 <ul className="dash-consult-list">
 <li>Study systems and revision plans</li>
 <li>Subject selection and ATAR / pathway advice</li>
 <li>SAC and exam strategy</li>
 <li>Getting more from classes, recordings, and workbooks</li>
 </ul>
 </div>
 <a
 className="btn btn-primary"
 href={CONSULT_URL}
 target="_blank"
 rel="noopener noreferrer"
 >
 Book free consult
 </a>
 </div>

 <div className="dash-section">
 <div className="dash-section-head">
 <h2>Subject libraries</h2>
 </div>
 <ResourceLibrary
 classes={masterclassClasses}
 enrolled={enrolled}
 staff={staff}
 emptyLabel="No masterclass libraries published yet."
 />
 </div>

 <SessionBlock
 sessions={masterclassSessions}
 emptyLabel="No upcoming masterclass sessions yet."
 />
 </>
 )}
 </div>
 )}

 {tab === "ucat" && (
 <div className="dash-panel">
 {!access.ucat ? (
 <ProgramGate
 program="ucat"
 title="UCAT is restricted"
 body="UCAT resources and sessions unlock when you’re enrolled in the UCAT program."
 />
 ) : (
 <>
 <p className="muted dash-lead">UCAT libraries and upcoming sessions.</p>
 <div className="dash-section">
 <div className="dash-section-head">
 <h2>UCAT libraries</h2>
 </div>
 <ResourceLibrary
 classes={ucatClasses}
 enrolled={enrolled}
 staff={staff}
 emptyLabel="No UCAT libraries published yet."
 />
 </div>
 <SessionBlock
 sessions={ucatSessions}
 emptyLabel="No upcoming UCAT sessions yet."
 />
 </>
 )}
 </div>
 )}

 {tab === "progress" && (
 <div className="dash-panel">
 <p className="muted dash-lead">
 Sylly-Map syllabus checklist and ATAR calculator with subject marks.
 </p>
 <ProgressTools role={role} students={tutorStudents} />
 </div>
 )}
 </>
 );
}
