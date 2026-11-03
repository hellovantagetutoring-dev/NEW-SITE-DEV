"use client";

import {
  previewTierLabel,
  useStudentPreview,
  type SubjectScope,
} from "@/lib/student-preview";
import type { EnrollmentTier } from "@/lib/permissions/resource-access";

export function StudentPreviewControls() {
  const preview = useStudentPreview();
  if (!preview.available) return null;

  return (
    <label className="student-preview-toggle">
      <input
        type="checkbox"
        checked={preview.enabled}
        onChange={(e) => preview.setEnabled(e.target.checked)}
      />
      <span>What students see</span>
    </label>
  );
}

export function StudentPreviewBanner() {
  const preview = useStudentPreview();
  if (!preview.available || !preview.enabled) return null;

  return (
    <div className="student-preview-banner" role="status">
      <div className="student-preview-banner-main">
        <strong>Student view</strong>
        <span className="muted">
          {previewTierLabel(preview.tier)}
          {" · "}
          {preview.subjectScope === "all" ? "all subjects enrolled" : "no subjects enrolled"}
          {preview.solutionsUnlocked ? " · solutions released" : ""}
        </span>
      </div>
      <div className="student-preview-options">
        <label>
          Tier
          <select
            value={preview.tier}
            onChange={(e) => preview.setTier(e.target.value as EnrollmentTier)}
          >
            <option value="private_1on1">Private 1-on-1</option>
            <option value="masterclass">Masterclass</option>
            <option value="both">Both</option>
          </select>
        </label>
        <label>
          Subjects
          <select
            value={preview.subjectScope}
            onChange={(e) => preview.setSubjectScope(e.target.value as SubjectScope)}
          >
            <option value="all">All enrolled</option>
            <option value="none">None enrolled</option>
          </select>
        </label>
        <label className="student-preview-check">
          <input
            type="checkbox"
            checked={preview.solutionsUnlocked}
            onChange={(e) => preview.setSolutionsUnlocked(e.target.checked)}
          />
          Solutions unlocked
        </label>
        <button type="button" className="btn btn-ghost" onClick={() => preview.setEnabled(false)}>
          Exit
        </button>
      </div>
    </div>
  );
}
