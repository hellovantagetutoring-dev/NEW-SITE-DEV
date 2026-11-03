"use client";

import { useState } from "react";
import { AtarCalculator } from "./AtarCalculator";
import { SyllyMap } from "./SyllyMap";

type SubTab = "sylly" | "atar";

export function ProgressTools({
  role,
  students = [],
  defaultStudentId,
}: {
  role: string;
  students?: { id: string; label: string }[];
  defaultStudentId?: string;
}) {
  const staff = role === "tutor" || role === "admin";
  const [sub, setSub] = useState<SubTab>("sylly");
  const [viewStudentId, setViewStudentId] = useState(defaultStudentId || students[0]?.id || "");

  const tabs: { id: SubTab; label: string }[] = [
    { id: "sylly", label: "Sylly-Map" },
    { id: "atar", label: "ATAR" },
  ];

  return (
    <div className="progress-tools">
      <div className="segmented progress-subtabs" role="tablist" aria-label="Progress tools">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className="segmented-item"
            data-active={sub === t.id}
            aria-selected={sub === t.id}
            onClick={() => setSub(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {staff && sub === "sylly" && students.length > 0 && (
        <label className="field" style={{ maxWidth: "20rem" }}>
          Student
          <select value={viewStudentId} onChange={(e) => setViewStudentId(e.target.value)}>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {sub === "sylly" && (
        <SyllyMap
          studentId={staff ? viewStudentId || undefined : undefined}
          canEdit={!staff || !!viewStudentId}
          tutorMode={staff}
        />
      )}
      {sub === "atar" && <AtarCalculator />}
    </div>
  );
}
