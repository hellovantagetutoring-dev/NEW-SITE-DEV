"use client";

import { useCallback, useEffect, useState } from "react";

type Topic = {
 id: string;
 unit: string;
 topic_code: string;
 title: string;
 status: "need_help" | "okay" | "mastered";
};

const SUBJECTS = [
 { value: "methods", label: "Maths Methods" },
 { value: "specialist", label: "Specialist Maths" },
 { value: "physics", label: "Physics" },
 { value: "chemistry", label: "Chemistry" },
];

const STATUS_META = {
 need_help: { label: "Need help", emoji: "🔴", className: "sylly-need" },
 okay: { label: "Okay", emoji: "🟡", className: "sylly-okay" },
 mastered: { label: "Mastered", emoji: "🟢", className: "sylly-mastered" },
} as const;

export function SyllyMap({
 studentId,
 canEdit = true,
 tutorMode = false,
}: {
 studentId?: string;
 canEdit?: boolean;
 tutorMode?: boolean;
}) {
 const [subject, setSubject] = useState("methods");
 const [filter, setFilter] = useState<"all" | "need_help">("all");
 const [topics, setTopics] = useState<Topic[]>([]);
 const [counts, setCounts] = useState({ need_help: 0, okay: 0, mastered: 0 });
 const [busy, setBusy] = useState<string | null>(null);
 const [msg, setMsg] = useState("");

 const load = useCallback(async () => {
 const params = new URLSearchParams({ subject });
 if (studentId) params.set("studentId", studentId);
 if (filter === "need_help") params.set("status", "need_help");
 const res = await fetch(`/api/progress/syllabus?${params}`);
 const data = await res.json().catch(() => ({}));
 if (!res.ok) {
 setMsg(data.error || "Could not load Sylly-Map (run migration 010)");
 setTopics([]);
 return;
 }
 setMsg("");
 setTopics(data.topics || []);
 setCounts(data.counts || { need_help: 0, okay: 0, mastered: 0 });
 }, [subject, studentId, filter]);

 useEffect(() => {
 void load();
 }, [load]);

 async function setStatus(topicId: string, status: Topic["status"]) {
 if (!canEdit) return;
 setBusy(topicId);
 await fetch("/api/progress/syllabus", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ topicId, status, studentId }),
 });
 setBusy(null);
 void load();
 }

 const unit3 = topics.filter((t) => t.unit === "unit_3");
 const unit4 = topics.filter((t) => t.unit === "unit_4");

 return (
 <div className="progress-card">
 <header className="progress-card-head">
 <div>
 <h3>Sylly-Map</h3>
 <p className="muted">
 QCAA Unit 3 &amp; 4 checklist
            {tutorMode
              ? ". Filter Need help before the lesson."
              : ". Mark each point before your next session."}
 </p>
 </div>
 <div className="sylly-counts">
 <span>🔴 {counts.need_help}</span>
 <span>🟡 {counts.okay}</span>
 <span>🟢 {counts.mastered}</span>
 </div>
 </header>

 <div className="progress-toolbar">
 <label className="field">
 Subject
 <select value={subject} onChange={(e) => setSubject(e.target.value)}>
 {SUBJECTS.map((s) => (
 <option key={s.value} value={s.value}>
 {s.label}
 </option>
 ))}
 </select>
 </label>
 {tutorMode && (
 <label className="field">
 Filter
 <select
 value={filter}
 onChange={(e) => setFilter(e.target.value as "all" | "need_help")}
 >
 <option value="all">All topics</option>
 <option value="need_help">Need help only</option>
 </select>
 </label>
 )}
 </div>

 {msg && <p className="muted">{msg}</p>}

 {(["Unit 3", "Unit 4"] as const).map((label, idx) => {
 const list = idx === 0 ? unit3 : unit4;
 if (!list.length) return null;
 return (
 <div key={label} className="sylly-unit">
 <h4>{label}</h4>
 <ul className="sylly-list">
 {list.map((t) => (
 <li key={t.id} className={STATUS_META[t.status].className}>
 <div className="sylly-topic">
 <span className="sylly-code">{t.topic_code}</span>
 <span>{t.title}</span>
 </div>
 <div className="sylly-status-btns" role="group" aria-label={t.title}>
 {(Object.keys(STATUS_META) as Topic["status"][]).map((s) => (
 <button
 key={s}
 type="button"
 className="sylly-dot"
 data-active={t.status === s}
 disabled={!canEdit || busy === t.id}
 title={STATUS_META[s].label}
 onClick={() => void setStatus(t.id, s)}
 >
 {STATUS_META[s].emoji}
 </button>
 ))}
 </div>
 </li>
 ))}
 </ul>
 </div>
 );
 })}
 {!topics.length && !msg && <p className="muted">No topics for this filter.</p>}
 </div>
 );
}
