"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { useMemo, useState } from "react";
import { IconWell, PortalIcon, type PortalIconName } from "@/components/PortalIcon";
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
 library: boolean;
 ucat: boolean;
};

type TabId = "private" | "masterclass" | "library" | "ucat" | "progress";

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
 const isLibrary = (c.stream || "") === "library";
 const iconName: PortalIconName = isLibrary ? "pack" : "book";
 if (locked) {
 const program =
 c.subject.toLowerCase() === "ucat"
 ? "ucat"
 : isLibrary
 ? "private"
 : "masterclass";
 return (
 <a
 key={c.id}
 href={marketingEnrolUrl(program)}
 target="_blank"
 rel="noopener noreferrer"
 className="resource-card resource-card-locked"
 style={{ borderTop: `3px solid ${accent}` }}
 >
 <span className="resource-card-icon" style={{ background: accent, color: "#fff" }}>
 <PortalIcon name="lock" size={18} />
 </span>
 <span className="pill pill-locked">Locked</span>
 <h3>{c.name}</h3>
 <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
 {meta}
 </p>
 <span className="resource-card-cta">Enrol today</span>
 </a>
 );
 }
 const pill = isLibrary ? "Pack" : "Library";
 return (
 <Link
 key={c.id}
 href={`/app/classes/${c.id}`}
 className="resource-card"
 prefetch
 style={{ borderTop: `3px solid ${accent}` }}
 >
 <PendingCardLabel>
 <span className="resource-card-icon" style={{ background: accent, color: "#fff" }}>
 <PortalIcon name={iconName} size={18} />
 </span>
 <span className="pill">{pill}</span>
 <h3>{c.name}</h3>
 <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
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
 <h2>
 <IconWell name="session" tone="sky" size="sm" />
 Upcoming sessions
 </h2>
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
 libraryClasses = [],
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
 libraryClasses?: ClassCard[];
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
 if (staff) return { private: true, masterclass: true, library: true, ucat: true };
 if (preview.enabled) {
 const tier = preview.tier;
 const subjectsOn = preview.subjectScope === "all";
 const privateOn = subjectsOn && (tier === "private_1on1" || tier === "both");
 const masterOn = subjectsOn && (tier === "masterclass" || tier === "both");
 return {
 private: privateOn,
 masterclass: masterOn,
 library: privateOn || masterOn,
 ucat: false,
 };
 }
 return programAccess;
 }, [staff, preview.enabled, preview.tier, preview.subjectScope, programAccess]);

 const defaultTab: TabId = access.private
 ? "private"
 : access.masterclass
 ? "masterclass"
 : access.library
 ? "library"
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

 // Resource Library unlocks as a whole once any Private or Masterclass enrolment exists.
 const libraryEnrolled = useMemo(() => {
 if (staff || (preview.enabled && preview.subjectScope === "all" && access.library)) {
 return new Set(libraryClasses.map((c) => c.subject.toLowerCase()));
 }
 if (access.library) {
 return new Set(libraryClasses.map((c) => c.subject.toLowerCase()));
 }
 return new Set<string>();
 }, [staff, preview.enabled, preview.subjectScope, access.library, libraryClasses]);

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

 const tabs: { id: TabId; label: string; locked: boolean; icon: PortalIconName }[] = [
 { id: "private", label: "Private", locked: !access.private, icon: "private" },
 { id: "masterclass", label: "Masterclass", locked: !access.masterclass, icon: "masterclass" },
 { id: "library", label: "Resource Library", locked: !access.library, icon: "library" },
 { id: "ucat", label: "UCAT", locked: !access.ucat, icon: "ucat" },
 { id: "progress", label: "Progress", locked: false, icon: "progress" },
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
 data-program={t.id}
 aria-selected={tab === t.id}
 onClick={() => setTab(t.id)}
 >
 <PortalIcon name={t.icon} size={16} />
 <span>{t.label}</span>
 {t.locked ? <span className="tab-lock" aria-hidden="true" /> : null}
 </button>
 ))}
 </div>

 {tab === "private" && (
 <div className="dash-panel dash-panel-private">
 {!access.private ? (
 <ProgramGate
 program="private"
 title="Private 1-1 is locked"
 body="Enrol in Private 1-1 for a matched tutor, custom homework, and flexible sessions. Masterclass libraries stay separate; Resource Library unlocks with either program."
 />
 ) : (
 <>
 <p className="muted dash-lead">
 Your tutoring pairs, custom files, and assessment dropbox. Mocks and retrieval packs
 live under Resource Library. Subject Masterclass libraries need Masterclass enrolment.
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
 <h2>
 <IconWell name="dropbox" tone="mint" size="sm" />
 Assessment dropbox
 </h2>
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
 <div className="dash-panel dash-panel-masterclass">
 {!access.masterclass ? (
 <ProgramGate
 program="masterclass"
 title="Masterclass is restricted"
 body="Masterclass subject libraries, solutions, and recordings need Masterclass enrolment. Private students still get the Resource Library for mocks and retrieval practice."
 />
 ) : (
 <>
 <p className="muted dash-lead">
 Subject libraries, upcoming sessions, and a free consult anytime — not only for
 enrolment questions.
 </p>

 <div className="dash-consult">
 <div className="dash-consult-main">
 <span className="pill">
 <PortalIcon name="consult" size={14} />
 Free consult
 </span>
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
 <h2>
 <IconWell name="book" tone="gold" size="sm" />
 Subject libraries
 </h2>
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

 {tab === "library" && (
 <div className="dash-panel dash-panel-library">
 {!access.library ? (
 <ProgramGate
 program="private"
 title="Resource Library is locked"
 body="Enrol in Private 1-1 or Masterclass to unlock the Vantage Resource Library — mock tests, retrieval practice, and shared packs."
 />
 ) : (
 <>
 <p className="muted dash-lead">
 Vantage Resource Library: mock tests, retrieval practice, and shared study packs.
 Included with Private or Masterclass enrolment.
 </p>
 <div className="dash-section">
 <div className="dash-section-head">
 <h2>
 <IconWell name="library" tone="violet" size="sm" />
 Library shelves
 </h2>
 </div>
 <ResourceLibrary
 classes={libraryClasses}
 enrolled={libraryEnrolled}
 staff={staff}
 emptyLabel="Library packs are being published. Check back soon, or ask your tutor."
 />
 </div>
 </>
 )}
 </div>
 )}

 {tab === "ucat" && (
 <div className="dash-panel dash-panel-ucat">
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
 <h2>
 <IconWell name="ucat" tone="violet" size="sm" />
 UCAT libraries
 </h2>
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
 <div className="dash-panel dash-panel-progress">
 <p className="muted dash-lead">
 Sylly-Map syllabus checklist and ATAR calculator with subject marks.
 </p>
 <ProgressTools role={role} students={tutorStudents} />
 </div>
 )}
 </>
 );
}
