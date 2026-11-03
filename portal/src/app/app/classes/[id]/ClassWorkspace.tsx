"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PdfPreview } from "@/components/PdfPreview";
import {
 checkResourceAccess,
 type AccessReason,
 type ResourceCategory,
 type UpsellType,
} from "@/lib/permissions/resource-access";
import { previewTierLabel, useStudentPreview } from "@/lib/student-preview";
import { ReleaseSolutionsButton } from "./ReleaseSolutionsButton";

type ResourceSet = {
 id: string;
 code: string;
 title: string;
 section: string;
 release_at: string | null;
};

type ResourceFile = {
 id: string;
 set_id: string;
 kind: string;
 category: string;
 solutions_released_at: string | null;
 canAccess: boolean;
 accessReason: AccessReason;
 upsellType?: UpsellType;
 videoUrl?: string | null;
};

const SECTION_LABELS: Record<string, string> = {
 workbooks: "Workbooks",
 homework: "Homework",
 mocks: "Mock exams",
};

const KIND_LABELS: Record<string, string> = {
 workbook: "Workbook",
 homework: "Homework",
 mock: "Mock",
 solutions: "Worked solutions",
};

const CONSULT_URL =
 process.env.NEXT_PUBLIC_CONSULT_URL ||
 "https://calendly.com/hello-vantagetutoring/10min";

export function ClassWorkspace({
 classId,
 className,
 subject,
 unitBand,
 yearLabel,
 subjectTier,
 sets,
 files,
 newestId,
 canRelease,
 canUnlock,
 unlockStudents,
 unlockedForStudents,
 viewerRole,
}: {
 classId: string;
 className: string;
 subject: string;
 unitBand: string;
 yearLabel: string;
 subjectTier: string | null;
 sets: ResourceSet[];
 files: ResourceFile[];
 newestId?: string;
 canRelease: boolean;
 canUnlock: boolean;
 unlockStudents: { id: string; label: string }[];
 unlockedForStudents: Record<string, string[]>;
 viewerRole: string;
}) {
 const router = useRouter();
 const [pending, startTransition] = useTransition();
 const [upsell, setUpsell] = useState<UpsellType | null>(null);
 const [unlockBusy, setUnlockBusy] = useState<string | null>(null);
 const preview = useStudentPreview();
 const previewing = preview.enabled;

 const sections = useMemo(() => {
 const keys = ["workbooks", "homework", "mocks"];
 return keys
 .map((key) => ({
 key,
 label: SECTION_LABELS[key] || key,
 sets: sets.filter((s) => s.section === key),
 }))
 .filter((s) => s.sets.length);
 }, [sets]);

 const initialSetId = newestId || sets[0]?.id || "";
 const [activeSetId, setActiveSetId] = useState(initialSetId);
 const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
 const start: Record<string, boolean> = {};
 for (const section of sections) {
 start[section.key] =
 section.sets.some((s) => s.id === initialSetId) || section.key === sections[0]?.key;
 }
 return start;
 });

 const displayFiles = useMemo(() => {
 if (!previewing) return files;
 const tier = preview.subjectScope === "all" ? preview.tier : null;
 return files.map((f) => {
 const access = checkResourceAccess({
 user: { id: "preview", role: "student" },
 resource: {
 id: f.id,
 category: f.category as ResourceCategory,
 subjectSlug: subject,
 // Ignore live release flags so preview tier locks stay demoable
 solutionsReleased: false,
 },
 subjectTier: tier,
 teachesSubject: false,
 hasManualUnlock: preview.solutionsUnlocked,
 });
 return {
 ...f,
 canAccess: access.canAccess,
 accessReason: access.reason,
 upsellType: access.upsellType,
 videoUrl: access.canAccess ? f.videoUrl : null,
 };
 });
 }, [
 files,
 previewing,
 preview.subjectScope,
 preview.tier,
 preview.solutionsUnlocked,
 subject,
 ]);

 const displayTier = previewing
 ? preview.subjectScope === "all"
 ? preview.tier
 : null
 : subjectTier;

 const activeSet = sets.find((s) => s.id === activeSetId) || sets[0];
 const setFiles = displayFiles.filter((f) => f.set_id === activeSet?.id);
 // Show locked solutions too (with lock state): don't hide them from students
 const visibleKinds = setFiles;
 const [activeKind, setActiveKind] = useState(visibleKinds[0]?.kind || "workbook");

 const activeFile =
 setFiles.find((f) => f.kind === activeKind) || visibleKinds[0] || null;

 const canOpenFile = !!activeFile?.canAccess;
 const showStaffTools = !previewing;
 const sectionLabel = activeSet ? SECTION_LABELS[activeSet.section] || activeSet.section : "";

 function selectSet(setId: string, sectionKey: string) {
 setActiveSetId(setId);
 setOpenSections((prev) => ({ ...prev, [sectionKey]: true }));
 const kinds = displayFiles.filter((f) => f.set_id === setId);
 if (kinds[0]) setActiveKind(kinds[0].kind);
 }

 async function toggleUnlock(studentId: string, resourceId: string, unlock: boolean) {
 const key = `${studentId}:${resourceId}`;
 setUnlockBusy(key);
 const res = await fetch("/api/tutor/unlock-resource", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ studentId, resourceId, unlock }),
 });
 setUnlockBusy(null);
 if (res.ok) startTransition(() => router.refresh());
 }

 return (
 <div className="workspace">
 <aside className="workspace-side">
 <Link href="/app" className="workspace-back">
 ← Back to Dashboard
 </Link>

 <div className="workspace-course">
 <h1 className="workspace-course-title">{className}</h1>
 <p className="workspace-course-sub">
 {[subject, unitBand, yearLabel].filter(Boolean).join(" · ")}
 </p>
 {displayTier ? (
 <span className="pill">
 {previewTierLabel(
 displayTier === "private_1on1" ||
 displayTier === "both" ||
 displayTier === "masterclass"
 ? displayTier
 : "masterclass"
 )}
 {previewing ? " · preview" : ""}
 </span>
 ) : (
 <span className="pill pill-locked">
 Not enrolled in subject{previewing ? " · preview" : ""}
 </span>
 )}
 </div>

 <div className="workspace-nav">
 <p className="workspace-nav-label">Areas of study</p>
 {sections.map((section) => {
 const open = openSections[section.key] !== false;
 return (
 <div key={section.key} className="workspace-accordion">
 <button
 type="button"
 className="workspace-accordion-btn"
 data-open={open}
 onClick={() =>
 setOpenSections((prev) => ({ ...prev, [section.key]: !open }))
 }
 >
 <span>{section.label}</span>
 <span className="workspace-count">{section.sets.length}</span>
 </button>
 {open && (
 <ul className="workspace-set-list">
 {section.sets.map((set) => {
 const active = set.id === activeSet?.id;
 const pinned = set.id === newestId;
 return (
 <li key={set.id}>
 <button
 type="button"
 className="workspace-set-btn"
 data-active={active}
 onClick={() => selectSet(set.id, section.key)}
 >
 <span className="workspace-set-code">{set.code}</span>
 <span className="workspace-set-title">{set.title}</span>
 {pinned && <span className="workspace-set-flag">This week</span>}
 </button>
 </li>
 );
 })}
 </ul>
 )}
 </div>
 );
 })}
 {!sections.length && (
 <p className="muted" style={{ fontSize: "0.88rem", margin: "0.5rem 0 0" }}>
 No sets released yet.
 </p>
 )}
 </div>
 </aside>

 <section className="workspace-main">
 <nav className="crumbs" aria-label="Breadcrumb">
 <Link href="/app" className="crumb">
 Back
 </Link>
 <span className="crumb-sep" aria-hidden="true">
 ›
 </span>
 <span className="crumb">{sectionLabel || "Resources"}</span>
 {activeSet && (
 <>
 <span className="crumb-sep" aria-hidden="true">
 ›
 </span>
 <span className="crumb crumb-current">
 {activeSet.code} {activeSet.title}
 </span>
 </>
 )}
 </nav>

 {activeSet ? (
 <>
 <div className="workspace-toolbar">
 <div className="tabs" role="tablist" aria-label="Resource type">
 {visibleKinds.map((file) => (
 <button
 key={file.id}
 type="button"
 role="tab"
 className="tab"
 data-active={activeKind === file.kind}
 aria-selected={activeKind === file.kind}
 onClick={() => setActiveKind(file.kind)}
 >
 {KIND_LABELS[file.kind] || file.kind}
 {!file.canAccess && " 🔒"}
 </button>
 ))}
 {!visibleKinds.length && (
 <span className="muted" style={{ fontSize: "0.88rem" }}>
 No files in this set yet
 </span>
 )}
 </div>

 <div className="workspace-toolbar-actions">
 {canOpenFile && activeFile && (
 <a
 className="btn btn-primary"
 href={`/api/download/${activeFile.id}`}
 style={{ padding: "0.5rem 1rem", fontSize: "0.88rem" }}
 >
 Download {KIND_LABELS[activeFile.kind] || activeFile.kind}
 </a>
 )}
 {showStaffTools &&
 canRelease &&
 setFiles
 .filter((f) => f.kind === "solutions")
 .map((f) => (
 <ReleaseSolutionsButton
 key={`rel-${f.id}`}
 fileId={f.id}
 released={!!f.solutions_released_at}
 />
 ))}
 </div>
 </div>

 <div className="workspace-viewer">
 {canOpenFile && activeFile ? (
 activeFile.videoUrl ? (
 <div className="workspace-viewer-card">
 <h2 className="workspace-viewer-title">Recording</h2>
 <a className="btn btn-primary" href={activeFile.videoUrl} target="_blank" rel="noreferrer">
 Open recording
 </a>
 </div>
 ) : (
 <PdfPreview
 fileId={activeFile.id}
 label={KIND_LABELS[activeFile.kind] || activeFile.kind}
 />
 )
 ) : (
 <div className="workspace-viewer-card">
 <p className="section-kicker">{sectionLabel}</p>
 <h2 className="workspace-viewer-title">
 {activeSet.code} · {activeSet.title}
 </h2>
 {activeFile && !activeFile.canAccess && (
 <div className="resource-lock-banner">
 <span className="resource-lock-badge">Locked</span>
 {activeFile.upsellType === "ask_tutor" && (
 <p>
                          Worked solutions are unlocked by your tutor after completing this booklet, or
 included instantly with Masterclass access.
 </p>
 )}
 {activeFile.upsellType === "upgrade_masterclass" && (
 <>
 <p>Masterclass replay is included with Masterclass enrolment.</p>
 <button
 type="button"
 className="btn btn-primary"
 onClick={() => setUpsell("upgrade_masterclass")}
 >
 Unlock Masterclass Replay
 </button>
 </>
 )}
 {activeFile.upsellType === "add_subject" && (
 <>
 <p>You’re not enrolled in this subject yet.</p>
 <button
 type="button"
 className="btn btn-primary"
 onClick={() => setUpsell("add_subject")}
 >
 Request subject / Enquire
 </button>
 </>
 )}
 {!activeFile.upsellType && (
 <p className="muted">This file isn’t available for your enrolment yet.</p>
 )}
 </div>
 )}
 {!activeFile && (
 <p className="muted">Pick a set with files to preview the workbook here.</p>
 )}
 </div>
 )}
 </div>

 {showStaffTools &&
 canUnlock &&
 unlockStudents.length > 0 &&
 activeFile &&
 (activeFile.kind === "solutions" || activeFile.category === "mc_solution") && (
 <div className="resource-unlock-panel">
 <div className="resource-unlock-head">
 <h3>Release solutions</h3>
 <p className="muted">
 For Private 1-1 students after the lesson.
 {pending ? " Updating…" : ""}
 </p>
 </div>
 <ul className="resource-unlock-list">
 {unlockStudents.map((s) => {
 const unlocked = (unlockedForStudents[s.id] || []).includes(activeFile.id);
 const busy = unlockBusy === `${s.id}:${activeFile.id}`;
 return (
 <li key={s.id}>
 <span>{s.label}</span>
 <button
 type="button"
 className={`btn btn-compact ${unlocked ? "btn-ghost" : "btn-primary"}`}
 disabled={busy}
 onClick={() => toggleUnlock(s.id, activeFile.id, !unlocked)}
 >
 {busy ? "…" : unlocked ? "Revoke" : "Release"}
 </button>
 </li>
 );
 })}
 </ul>
 </div>
 )}
 </>
 ) : (
 <div className="workspace-viewer">
 <div className="workspace-viewer-card">
 <h2 className="workspace-viewer-title">No resources yet</h2>
 <p className="muted">
 Admins can upload workbooks and homework for this class from Admin.
 </p>
 {showStaffTools && canRelease && (
 <p style={{ marginTop: "1rem" }}>
 <Link href="/app/admin" className="btn btn-ghost">
 Open Admin
 </Link>
 </p>
 )}
 </div>
 </div>
 )}
 </section>
 <span hidden>{classId}{viewerRole}</span>

 {upsell && (
 <div className="resource-upsell-backdrop" role="dialog" aria-modal="true">
 <div className="resource-upsell-modal card">
 <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>
 {upsell === "upgrade_masterclass"
 ? "Upgrade to Masterclass"
 : "Request this subject"}
 </h2>
 <p className="muted">
 {upsell === "upgrade_masterclass"
 ? "Masterclass includes worked solutions and session recordings for this subject."
 : "Tell us which subject you’d like added and we’ll enrol you."}
 </p>
 <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
 <a
 className="btn btn-primary"
 href={CONSULT_URL}
 target="_blank"
 rel="noopener noreferrer"
 >
 Book free consult
 </a>
 <a className="btn btn-ghost" href="mailto:hello@vantagetutoring.com.au">
 Email us
 </a>
 <button type="button" className="btn btn-ghost" onClick={() => setUpsell(null)}>
 Close
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
