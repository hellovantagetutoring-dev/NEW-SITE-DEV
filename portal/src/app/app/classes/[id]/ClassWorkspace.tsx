"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PdfPreview } from "@/components/PdfPreview";
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
  solutions_released_at: string | null;
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
  solutions: "Solutions",
};

export function ClassWorkspace({
  classId,
  className,
  subject,
  unitBand,
  yearLabel,
  sets,
  files,
  newestId,
  canRelease,
}: {
  classId: string;
  className: string;
  subject: string;
  unitBand: string;
  yearLabel: string;
  sets: ResourceSet[];
  files: ResourceFile[];
  newestId?: string;
  canRelease: boolean;
}) {
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

  const activeSet = sets.find((s) => s.id === activeSetId) || sets[0];
  const setFiles = files.filter((f) => f.set_id === activeSet?.id);
  const visibleKinds = setFiles.filter((f) => {
    if (f.kind !== "solutions") return true;
    return !!f.solutions_released_at || canRelease;
  });
  const [activeKind, setActiveKind] = useState(visibleKinds[0]?.kind || "workbook");

  const activeFile =
    setFiles.find((f) => f.kind === activeKind) || visibleKinds[0] || null;

  const canOpenFile =
    !!activeFile &&
    !(activeFile.kind === "solutions" && !activeFile.solutions_released_at && !canRelease);

  const sectionLabel = activeSet ? SECTION_LABELS[activeSet.section] || activeSet.section : "";

  function selectSet(setId: string, sectionKey: string) {
    setActiveSetId(setId);
    setOpenSections((prev) => ({ ...prev, [sectionKey]: true }));
    const kinds = files.filter((f) => f.set_id === setId);
    const first = kinds.find(
      (f) => f.kind !== "solutions" || f.solutions_released_at || canRelease
    );
    if (first) setActiveKind(first.kind);
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
          <span className="pill">Class</span>
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
                  </button>
                ))}
                {!visibleKinds.length && (
                  <span className="muted" style={{ fontSize: "0.88rem" }}>
                    No files in this set yet
                  </span>
                )}
              </div>

              <div className="workspace-toolbar-actions">
                {canOpenFile && (
                  <a
                    className="btn btn-primary"
                    href={`/api/download/${activeFile!.id}`}
                    style={{ padding: "0.5rem 1rem", fontSize: "0.88rem" }}
                  >
                    Download {KIND_LABELS[activeFile!.kind] || activeFile!.kind}
                  </a>
                )}
                {canRelease &&
                  setFiles
                    .filter((f) => f.kind === "solutions" && !f.solutions_released_at)
                    .map((f) => <ReleaseSolutionsButton key={`rel-${f.id}`} fileId={f.id} />)}
              </div>
            </div>

            <div className="workspace-viewer">
              {canOpenFile ? (
                <PdfPreview
                  fileId={activeFile!.id}
                  label={KIND_LABELS[activeFile!.kind] || activeFile!.kind}
                />
              ) : (
                <div className="workspace-viewer-card">
                  <p className="section-kicker">{sectionLabel}</p>
                  <h2 className="workspace-viewer-title">
                    {activeSet.code} · {activeSet.title}
                  </h2>
                  {activeFile?.kind === "solutions" && !activeFile.solutions_released_at ? (
                    <p className="auth-status" style={{ textAlign: "left" }}>
                      Solutions locked until your teacher releases them.
                    </p>
                  ) : (
                    <p className="muted">Pick a set with files to preview the workbook here.</p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="workspace-viewer">
            <div className="workspace-viewer-card">
              <h2 className="workspace-viewer-title">No resources yet</h2>
              <p className="muted">
                Admins can upload workbooks and homework for this class from Admin.
              </p>
              {canRelease && (
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
      <span hidden>{classId}</span>
    </div>
  );
}
