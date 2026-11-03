"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { marketingEnrolUrl } from "@/lib/enrol-links";
import {
 externalNeededForTarget,
 getIaWeights,
 internalTotal,
} from "@/lib/qce-scoring";

type Tracker = {
 subject: string;
 ia1_score: number | null;
 ia1_max: number;
 ia2_score: number | null;
 ia2_max: number;
 ia3_score: number | null;
 ia3_max: number;
 target_raw: number;
};

const SUBJECTS = [
 { value: "methods", label: "Maths Methods" },
 { value: "specialist", label: "Specialist Maths" },
 { value: "general-maths", label: "General Maths" },
 { value: "physics", label: "Physics" },
 { value: "chemistry", label: "Chemistry" },
 { value: "biology", label: "Biology" },
 { value: "psychology", label: "Psychology" },
 { value: "english", label: "English" },
 { value: "literature", label: "Literature" },
 { value: "economics", label: "Economics" },
];

export function IaFiftyTracker() {
 const [subject, setSubject] = useState("methods");
 const [trackers, setTrackers] = useState<Tracker[]>([]);
 const [ia1, setIa1] = useState("");
 const [ia2, setIa2] = useState("");
 const [ia3, setIa3] = useState("");
 const [target, setTarget] = useState("90");
 const [msg, setMsg] = useState("");

 const weights = getIaWeights(subject);
 const internalMax = weights.ia1 + weights.ia2 + weights.ia3;

 const load = useCallback(async () => {
 const [iaRes, atarRes] = await Promise.all([
 fetch("/api/progress/ia-tracker"),
 fetch("/api/progress/atar"),
 ]);
 const iaData = await iaRes.json().catch(() => ({}));
 const atarData = await atarRes.json().catch(() => ({}));
 if (!iaRes.ok) {
 setMsg(iaData.error || "Tracker unavailable (run migration 010)");
 return;
 }
 const fromIa = (iaData.trackers || []) as Tracker[];
 const bySubject = new Map(fromIa.map((t) => [t.subject, { ...t }]));
 for (const s of atarData.subjects || []) {
 const subj = String(s.subject || "").toLowerCase();
 if (!subj) continue;
 const wts = getIaWeights(subj);
 const prev = bySubject.get(subj);
 bySubject.set(subj, {
 subject: subj,
 ia1_score: s.ia1 ?? prev?.ia1_score ?? null,
 ia1_max: wts.ia1,
 ia2_score: s.ia2 ?? prev?.ia2_score ?? null,
 ia2_max: wts.ia2,
 ia3_score: s.ia3 ?? prev?.ia3_score ?? null,
 ia3_max: wts.ia3,
 target_raw: prev?.target_raw ?? 90,
 });
 }
 setTrackers([...bySubject.values()]);
 }, []);

 useEffect(() => {
 void load();
 }, [load]);

 useEffect(() => {
 const row = trackers.find((t) => t.subject === subject);
 if (!row) {
 setIa1("");
 setIa2("");
 setIa3("");
 setTarget("90");
 return;
 }
 setIa1(row.ia1_score == null ? "" : String(row.ia1_score));
 setIa2(row.ia2_score == null ? "" : String(row.ia2_score));
 setIa3(row.ia3_score == null ? "" : String(row.ia3_score));
 setTarget(String(row.target_raw || 90));
 }, [subject, trackers]);

 const live = useMemo(() => {
 const n = (v: string) => (v === "" ? null : Number(v));
 const internal = internalTotal({
 subject,
 ia1: n(ia1),
 ia1Max: weights.ia1,
 ia2: n(ia2),
 ia2Max: weights.ia2,
 ia3: n(ia3),
 ia3Max: weights.ia3,
 });
 const targetRaw = Number(target) || 90;
 const need = externalNeededForTarget(internal.total, targetRaw, weights.external);
 return { internal, need, targetRaw };
 }, [subject, ia1, ia2, ia3, target, weights]);

 async function save() {
 const res = await fetch("/api/progress/ia-tracker", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 subject,
 ia1Score: ia1 === "" ? null : Number(ia1),
 ia1Max: weights.ia1,
 ia2Score: ia2 === "" ? null : Number(ia2),
 ia2Max: weights.ia2,
 ia3Score: ia3 === "" ? null : Number(ia3),
 ia3Max: weights.ia3,
 targetRaw: Number(target) || 90,
 }),
 });
 const data = await res.json().catch(() => ({}));
 setMsg(data.message || data.error || (res.ok ? "Saved" : "Save failed"));
 if (res.ok) void load();
 }

 const subjectLabel = SUBJECTS.find((s) => s.value === subject)?.label || subject;

 return (
 <div className="progress-card">
 <header className="progress-card-head">
 <div>
 <h3>QCE internal tracker</h3>
 <p className="muted">
 Enter ISMG marks (max = syllabus weighting). See banked internal /{internalMax} and what
 you need on the EA /{weights.external}. Full IA+EA grid is under ATAR.
 </p>
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
 <label className="field">
 Target raw
 <select value={target} onChange={(e) => setTarget(e.target.value)}>
 {[80, 85, 90, 95, 98].map((n) => (
 <option key={n} value={n}>
 {n}+
 </option>
 ))}
 </select>
 </label>
 </div>

 <p className="muted" style={{ fontSize: "0.82rem", marginTop: 0 }}>
 Weighting: {weights.ia1}/{weights.ia2}/{weights.ia3}/{weights.external} (internal{" "}
 {internalMax} + EA {weights.external})
 </p>

 <div className="ia-grid">
 <label className="field">
 {weights.ia1Label} (/{weights.ia1})
 <input
 type="number"
 min={0}
 max={weights.ia1}
 step={0.5}
 value={ia1}
 onChange={(e) => setIa1(e.target.value)}
 placeholder={`/${weights.ia1}`}
 />
 </label>
 <label className="field">
 {weights.ia2Label} (/{weights.ia2})
 <input
 type="number"
 min={0}
 max={weights.ia2}
 step={0.5}
 value={ia2}
 onChange={(e) => setIa2(e.target.value)}
 placeholder={`/${weights.ia2}`}
 />
 </label>
 <label className="field">
 {weights.ia3Label} (/{weights.ia3})
 <input
 type="number"
 min={0}
 max={weights.ia3}
 step={0.5}
 value={ia3}
 onChange={(e) => setIa3(e.target.value)}
 placeholder={`/${weights.ia3}`}
 />
 </label>
 </div>

 <div className="ia-result">
 <div>
 <p className="ia-result-label">Running internal</p>
 <p className="ia-result-value">
 {live.internal.total == null
 ? `- / ${internalMax}`
 : `${live.internal.total.toFixed(1)} / ${internalMax}`}
 </p>
 </div>
 <div>
 <p className="ia-result-label">
 EA needed for raw {live.targetRaw}+ (/{weights.external})
 </p>
 <p className="ia-result-value">
 {live.need
 ? `${live.need.neededOutOf50.toFixed(1)} / ${weights.external} (${live.need.neededPercent.toFixed(0)}%)`
 : "Enter IAs"}
 </p>
 </div>
 </div>

 {live.need && (
 <div className="ia-upsell">
 <p>
 <strong>
 Target: {live.need.neededOutOf50.toFixed(0)}/{weights.external} on the {subjectLabel}{" "}
 External Exam.
 </strong>{" "}
 Book the Term holiday External Exam Masterclass to lock it in.
 </p>
 <div className="ia-upsell-actions">
 <a
 className="btn btn-primary btn-compact"
 href={marketingEnrolUrl("masterclass")}
 target="_blank"
 rel="noopener noreferrer"
 >
 Enrol Masterclass
 </a>
 <a
 className="btn btn-ghost btn-compact"
 href={
 process.env.NEXT_PUBLIC_CONSULT_URL ||
 "https://calendly.com/hello-vantagetutoring/10min"
 }
 target="_blank"
 rel="noopener noreferrer"
 >
 Free consult
 </a>
 </div>
 </div>
 )}

 <button className="btn btn-primary btn-compact" type="button" onClick={() => void save()}>
 Save tracker
 </button>
 {msg && <p className="muted">{msg}</p>}
 </div>
 );
}
