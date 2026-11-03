"use client";

import { useCallback, useEffect, useState } from "react";
import { ISMG_CRITERIA } from "@/lib/qce-scoring";

type Item = {
 id: string;
 title: string;
 subject: string;
 assessment_type: string;
 status: string;
 tutor_note: string;
 criteria: Record<string, string>;
 draft_path: string | null;
 feedback_path: string | null;
 updated_at: string;
};

export function AssessmentDropbox({
 role,
 tutors = [],
 students = [],
}: {
 role: string;
 tutors?: { id: string; label: string }[];
 students?: { id: string; label: string }[];
}) {
 const staff = role === "tutor" || role === "admin";
 const [items, setItems] = useState<Item[]>([]);
 const [msg, setMsg] = useState("");
 const [busy, setBusy] = useState(false);

 const load = useCallback(async () => {
 const res = await fetch("/api/progress/dropbox");
 const data = await res.json().catch(() => ({}));
 if (!res.ok) {
 setMsg(data.error || "Dropbox unavailable (run migration 010)");
 return;
 }
 setItems(data.items || []);
 setMsg("");
 }, []);

 useEffect(() => {
 void load();
 }, [load]);

 async function submitDraft(form: HTMLFormElement) {
 setBusy(true);
 setMsg("");
 const fd = new FormData(form);
 const res = await fetch("/api/progress/dropbox", { method: "POST", body: fd });
 const data = await res.json().catch(() => ({}));
 setBusy(false);
 if (!res.ok) {
 setMsg(data.error || "Submit failed");
 return;
 }
 setMsg(data.message || "Submitted");
 form.reset();
 void load();
 }

 async function returnFeedback(id: string, form: HTMLFormElement) {
 setBusy(true);
 const fd = new FormData(form);
 fd.set("id", id);
 const criteria: Record<string, string> = {};
 form.querySelectorAll<HTMLSelectElement>("[data-criterion]").forEach((el) => {
 criteria[el.dataset.criterion || ""] = el.value;
 });
 fd.set("criteria", JSON.stringify(criteria));
 const res = await fetch("/api/progress/dropbox", { method: "PATCH", body: fd });
 const data = await res.json().catch(() => ({}));
 setBusy(false);
 if (!res.ok) {
 setMsg(data.error || "Could not return feedback");
 return;
 }
 setMsg(data.message || "Feedback sent");
 void load();
 }

 return (
 <div className="progress-card">
 <header className="progress-card-head">
 <div>
 <h3>Assessment Dropbox</h3>
 <p className="muted">
 PSMT / Student Experiment / RI drafts with task sheet + ISMG. Tutor returns annotated
 feedback against QCAA criteria.
 </p>
 </div>
 </header>

 {msg && <p className="admin-toast">{msg}</p>}

 {!staff && (
 <form
 className="dropbox-form"
 onSubmit={(e) => {
 e.preventDefault();
 void submitDraft(e.currentTarget);
 }}
 >
 <label className="field">
 Title
 <input name="title" placeholder="Methods PSMT draft 2" required />
 </label>
 <label className="field">
 Subject
 <select name="subject" defaultValue="methods">
 <option value="methods">Maths Methods</option>
 <option value="specialist">Specialist Maths</option>
 <option value="physics">Physics</option>
 <option value="chemistry">Chemistry</option>
 </select>
 </label>
 <label className="field">
 Type
 <select name="assessmentType" defaultValue="psmt">
 <option value="psmt">PSMT (Maths)</option>
 <option value="student_experiment">Student experiment</option>
 <option value="research_investigation">Research investigation</option>
 </select>
 </label>
 <label className="field">
 Tutor
 <select name="tutorId" required>
 <option value="">Select…</option>
 {tutors.map((t) => (
 <option key={t.id} value={t.id}>
 {t.label}
 </option>
 ))}
 </select>
 </label>
 <label className="field">
 Draft (PDF/DOCX)
 <input name="draft" type="file" accept=".pdf,.doc,.docx,application/pdf" required />
 </label>
 <label className="field">
 Task sheet (optional)
 <input name="taskSheet" type="file" accept=".pdf,.doc,.docx,application/pdf" />
 </label>
 <label className="field">
 ISMG (optional)
 <input name="ismg" type="file" accept=".pdf,.doc,.docx,application/pdf" />
 </label>
 <button className="btn btn-primary" type="submit" disabled={busy}>
 {busy ? "Uploading…" : "Submit to tutor"}
 </button>
 </form>
 )}

 <ul className="dropbox-list">
 {items.map((item) => {
 const keys =
 ISMG_CRITERIA[item.assessment_type] ||
 Object.keys(item.criteria || {}) ||
 ISMG_CRITERIA.psmt;
 return (
 <li key={item.id} className="dropbox-item">
 <div className="dropbox-item-main">
 <strong>{item.title}</strong>
 <p className="muted">
 {item.subject || "-"} · {item.assessment_type.replace(/_/g, " ")} ·{" "}
 {item.status.replace(/_/g, " ")}
 </p>
 <div className="dropbox-links">
 <a
 className="btn btn-ghost btn-compact"
 href={`/api/progress/dropbox/download?id=${item.id}&kind=draft`}
 >
 Draft
 </a>
 {item.feedback_path && (
 <a
 className="btn btn-ghost btn-compact"
 href={`/api/progress/dropbox/download?id=${item.id}&kind=feedback`}
 >
 Feedback file
 </a>
 )}
 </div>
 {item.tutor_note && (
 <p className="dropbox-note">
 <strong>Tutor note:</strong> {item.tutor_note}
 </p>
 )}
 <ul className="ismg-checklist">
 {keys.map((k) => (
 <li key={k}>
 <span>{k}</span>
 <span className={`ismg-tag ismg-${item.criteria?.[k] || "pending"}`}>
 {(item.criteria?.[k] || "pending").replace(/_/g, " ")}
 </span>
 </li>
 ))}
 </ul>
 </div>

 {staff && item.status !== "feedback_ready" && (
 <form
 className="dropbox-feedback-form"
 onSubmit={(e) => {
 e.preventDefault();
 void returnFeedback(item.id, e.currentTarget);
 }}
 >
 <label className="field">
 Annotated file
 <input name="feedback" type="file" accept=".pdf,.doc,.docx,application/pdf" />
 </label>
 <label className="field">
 Note
 <textarea name="tutorNote" rows={2} placeholder="Key fixes for next draft…" />
 </label>
 <div className="ismg-edit">
 {keys.map((k) => (
 <label key={k} className="field">
 {k}
 <select data-criterion={k} defaultValue={item.criteria?.[k] || "pending"}>
 <option value="pending">Pending</option>
 <option value="developing">Developing</option>
 <option value="satisfactory">Satisfactory</option>
 <option value="effective">Effective</option>
 <option value="discerning">Discerning</option>
 </select>
 </label>
 ))}
 </div>
 <button className="btn btn-primary btn-compact" type="submit" disabled={busy}>
 Return feedback
 </button>
 </form>
 )}
 </li>
 );
 })}
 </ul>
 {!items.length && <p className="muted">No assessment drafts yet.</p>}
 {staff && students.length > 0 && (
 <p className="muted" style={{ fontSize: "0.82rem" }}>
 Showing submissions for your pairs ({students.length} student
 {students.length === 1 ? "" : "s"}).
 </p>
 )}
 </div>
 );
}
