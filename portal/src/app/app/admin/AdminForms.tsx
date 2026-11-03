"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccessTierToggles } from "@/components/AccessTierToggles";
import {
 accessPills,
 mergeTiers,
 tierFromToggles,
 togglesFromTier,
 type AccessToggles,
} from "@/lib/access-tier";
import {
 STUDENT_SUBJECTS,
 YEAR_LEVEL_PRESETS,
 formatSubjects,
 formatYearLevel,
 normalizeSubjectKey,
 parseSubjects,
 parseYearLevel,
} from "@/lib/student-fields";

type ClassOpt = {
 id: string;
 name: string;
 subject: string;
 unit_band: string;
 stream?: string | null;
};
type ProfileOpt = {
 id: string;
 email: string;
 full_name: string;
 role: string;
 year_level?: string | null;
 subjects?: string[] | null;
};
type EnrolOpt = {
 profile_id: string;
 class_id: string;
 tier: string;
 subject: string;
 stream: string;
 className: string;
};
type PairOpt = {
 tutor_id: string;
 student_id: string;
 subject: string;
 note: string;
 tutorLabel: string;
 studentLabel: string;
 tutorEmail: string;
 studentEmail: string;
};

type AdminTab = "people" | "access" | "resources" | "classes";

function StudentProfileFields({
 yearLevel = "",
 subjects = [],
}: {
 yearLevel?: string | null;
 subjects?: string[] | null;
}) {
 const parsedYear = parseYearLevel(yearLevel);
 const parsedSubjects = parseSubjects(subjects);
 const [yearPreset, setYearPreset] = useState(parsedYear.preset);
 const [otherSubjectOn, setOtherSubjectOn] = useState(!!parsedSubjects.other);

 return (
 <>
 <label className="field">
 Year level
 <select name="yearLevel" value={yearPreset} onChange={(e) => setYearPreset(e.target.value)}>
 <option value="">Select…</option>
 {YEAR_LEVEL_PRESETS.map((y) => (
 <option key={y} value={y}>
 {y}
 </option>
 ))}
 <option value="other">Other</option>
 </select>
 </label>
 {yearPreset === "other" && (
 <label className="field">
 Other year / program
 <input
 name="yearLevelOther"
 defaultValue={parsedYear.other}
 placeholder="e.g. Gap year, Uni Sem 1"
 required
 />
 </label>
 )}
 <fieldset className="admin-subjects-fieldset">
 <legend>Subjects</legend>
 <div className="admin-subjects-grid">
 {STUDENT_SUBJECTS.map((s) => (
 <label key={s.value} className="admin-subject-check">
 <input
 type="checkbox"
 name="subjects"
 value={s.value}
 defaultChecked={parsedSubjects.selected.includes(s.value)}
 />
 {s.label}
 </label>
 ))}
 <label className="admin-subject-check">
 <input
 type="checkbox"
 checked={otherSubjectOn}
 onChange={(e) => setOtherSubjectOn(e.target.checked)}
 />
 Other
 </label>
 </div>
 {otherSubjectOn && (
 <label className="field" style={{ marginTop: "0.55rem" }}>
 Other subject(s)
 <input
 name="subjectsOther"
 defaultValue={parsedSubjects.other}
 placeholder="Comma-separated if more than one"
 required
 />
 </label>
 )}
 </fieldset>
 </>
 );
}

function RoleAndStudentFields({
 label = "Membership type",
 defaultRole = "student",
 options,
 yearLevel,
 subjects,
}: {
 label?: string;
 defaultRole?: string;
 options: { value: string; label: string }[];
 yearLevel?: string | null;
 subjects?: string[] | null;
}) {
 const [role, setRole] = useState(defaultRole);
 return (
 <>
 <label className="field">
 {label}
 <select name="role" value={role} onChange={(e) => setRole(e.target.value)} required>
 {options.map((o) => (
 <option key={o.value} value={o.value}>
 {o.label}
 </option>
 ))}
 </select>
 </label>
 {role === "student" && <StudentProfileFields yearLevel={yearLevel} subjects={subjects} />}
 </>
 );
}

function sameToggles(a: AccessToggles | undefined, b: AccessToggles | undefined) {
 return !!a && !!b && a.masterclass === b.masterclass && a.private11 === b.private11;
}

function SubjectAccessMatrix({
 profileId,
 subjects,
 enrolments,
 onSaved,
 onSettled,
}: {
 profileId: string;
 subjects: string[];
 enrolments: EnrolOpt[];
 onSaved: (msg: string, ok: boolean) => void;
 /** Fired once after in-flight / debounced saves drain (for a single refresh). */
 onSettled?: () => void;
}) {
 const [saving, setSaving] = useState<Record<string, boolean>>({});
 // Confirmed local writes win until the refreshed server payload matches.
 const confirmedRef = useRef<Record<string, AccessToggles>>({});
 const localRef = useRef<Record<string, AccessToggles>>({});
 const baselineRef = useRef<Record<string, AccessToggles>>({});
 const timersRef = useRef<Record<string, number>>({});
 const inflightRef = useRef(0);
 const settleTimerRef = useRef<number | null>(null);

 const fromServer = useMemo(() => {
 const map: Record<string, AccessToggles> = {};
 const tiersBySubject = new Map<string, string[]>();
 for (const e of enrolments.filter((x) => x.profile_id === profileId)) {
 const sub = normalizeSubjectKey(e.subject || "");
 if (!sub) continue;
 tiersBySubject.set(sub, [...(tiersBySubject.get(sub) || []), e.tier]);
 }
 const keys = new Set(subjects.map((s) => normalizeSubjectKey(s)).filter(Boolean));
 for (const s of tiersBySubject.keys()) keys.add(s);
 for (const subject of keys) {
 map[subject] = togglesFromTier(mergeTiers(tiersBySubject.get(subject) || []));
 }
 return map;
 }, [enrolments, profileId, subjects]);

 const [local, setLocal] = useState(fromServer);
 localRef.current = local;

 useEffect(() => {
 const next = { ...fromServer };
 for (const [subject, confirmed] of Object.entries(confirmedRef.current)) {
 if (sameToggles(fromServer[subject], confirmed)) {
 delete confirmedRef.current[subject];
 } else {
 next[subject] = confirmed;
 }
 }
 setLocal(next);
 }, [fromServer]);

 useEffect(() => {
 return () => {
 for (const t of Object.values(timersRef.current)) window.clearTimeout(t);
 if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
 };
 }, []);

 const rows = Object.keys(local).sort();

 function queueSettle() {
 if (!onSettled) return;
 if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
 settleTimerRef.current = window.setTimeout(() => {
 if (inflightRef.current === 0 && !Object.keys(timersRef.current).length) {
 onSettled();
 }
 }, 450);
 }

 async function flush(subject: string) {
 delete timersRef.current[subject];
 const next = localRef.current[subject] || togglesFromTier(null);
 const baseline = baselineRef.current[subject] || togglesFromTier(null);
 if (sameToggles(next, baseline)) return;

 confirmedRef.current[subject] = next;
 setSaving((s) => ({ ...s, [subject]: true }));
 inflightRef.current += 1;
 try {
 const res = await fetch("/api/admin/set-subject-access", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 profileId,
 subject,
 masterclass: next.masterclass,
 private11: next.private11,
 }),
 });
 const data = await res.json().catch(() => ({}));
 if (!res.ok) {
 delete confirmedRef.current[subject];
 setLocal((p) => ({ ...p, [subject]: baseline }));
 localRef.current = { ...localRef.current, [subject]: baseline };
 onSaved(data.error || data.message || "Failed to save access", false);
 return;
 }
 baselineRef.current[subject] = next;
 confirmedRef.current[subject] = next;
 onSaved(data.message || "Saved", true);
 } finally {
 inflightRef.current = Math.max(0, inflightRef.current - 1);
 setSaving((s) => {
 const copy = { ...s };
 delete copy[subject];
 return copy;
 });
 queueSettle();
 }
 }

 function scheduleSave(subject: string) {
 if (!baselineRef.current[subject]) {
 baselineRef.current[subject] =
 fromServer[subject] || localRef.current[subject] || togglesFromTier(null);
 }
 if (timersRef.current[subject]) window.clearTimeout(timersRef.current[subject]);
 timersRef.current[subject] = window.setTimeout(() => {
 void flush(subject);
 }, 280);
 }

 function applyPatch(subject: string, patch: Partial<AccessToggles>) {
 const prev = localRef.current[subject] || togglesFromTier(null);
 const next = { ...prev, ...patch };
 if (!baselineRef.current[subject]) {
 baselineRef.current[subject] = fromServer[subject] || prev;
 }
 confirmedRef.current[subject] = next;
 localRef.current = { ...localRef.current, [subject]: next };
 setLocal((p) => ({ ...p, [subject]: next }));
 scheduleSave(subject);
 }

 if (!rows.length) {
 return (
 <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
 Tick subjects above, save profile, then reopen Edit to set Masterclass / Private 1-1.
 </p>
 );
 }

 return (
 <div className="subject-access-matrix">
 <p className="subject-access-matrix-label">Subject gated access</p>
 <ul>
 {rows.map((subject) => {
 const label = STUDENT_SUBJECTS.find((s) => s.value === subject)?.label || subject;
 return (
 <li key={subject}>
 <span className="subject-access-name">{label}</span>
 <AccessTierToggles
 compact
 legend=""
 name=""
 value={local[subject] || togglesFromTier(null)}
 onChange={(patch) => applyPatch(subject, patch)}
 />
 {saving[subject] && <span className="muted">Saving…</span>}
 </li>
 );
 })}
 </ul>
 </div>
 );
}

function AccessPairsTab({
 pairs,
 tutors,
 students,
 editingPair,
 setEditingPair,
 post,
}: {
 pairs: PairOpt[];
 tutors: ProfileOpt[];
 students: ProfileOpt[];
 editingPair: string | null;
 setEditingPair: (key: string | null) => void;
 post: (url: string, body: FormData | object) => Promise<boolean>;
}) {
 const [filter, setFilter] = useState("");
 const q = filter.trim().toLowerCase();
 const visible = q
 ? pairs.filter((p) =>
 [p.tutorLabel, p.tutorEmail, p.studentLabel, p.studentEmail, p.subject, p.note]
 .join(" ")
 .toLowerCase()
 .includes(q)
 )
 : pairs;

 return (
 <section className="admin-panel">
 <header className="admin-panel-head">
 <div>
 <h2>Private 1-1 pairs</h2>
 <p className="muted">
 Link tutor ↔ student. Custom PDFs live on Home → Private 1-1 under each pair. Turn on
 Private 1-1 gated access under People → Edit.
 </p>
 </div>
 </header>

 <form
 className="admin-form-grid pair-create-form"
 onSubmit={(e) => {
 e.preventDefault();
 const fd = new FormData(e.currentTarget);
 post("/api/admin/assign-private", {
 tutorId: fd.get("tutorId"),
 studentId: fd.get("studentId"),
 subject: fd.get("subject"),
 note: fd.get("note"),
 });
 e.currentTarget.reset();
 }}
 >
 <h3 className="admin-subhead">New pair</h3>
 <label className="field">
 Tutor
 <select name="tutorId" required>
 <option value="">Select tutor…</option>
 {tutors.map((t) => (
 <option key={t.id} value={t.id}>
 {t.full_name || t.email}
 </option>
 ))}
 </select>
 </label>
 <label className="field">
 Student
 <select name="studentId" required>
 <option value="">Select student…</option>
 {students.map((s) => (
 <option key={s.id} value={s.id}>
 {s.full_name || s.email}
 </option>
 ))}
 </select>
 </label>
 <label className="field">
 Subject
 <select name="subject" defaultValue="methods">
 {STUDENT_SUBJECTS.map((s) => (
 <option key={s.value} value={s.value}>
 {s.label}
 </option>
 ))}
 </select>
 </label>
 <label className="field">
 Note
 <input name="note" placeholder="Weekly Thursday" />
 </label>
 <button className="btn btn-primary" type="submit">
 Link pair
 </button>
 </form>

 {pairs.length > 3 && (
 <label className="field">
 Filter pairs
 <input
 type="search"
 value={filter}
 onChange={(e) => setFilter(e.target.value)}
 placeholder="Name, email, subject…"
 />
 </label>
 )}

 {visible.length > 0 ? (
 <div className="pair-card-grid">
 {visible.map((p) => {
 const key = `${p.tutor_id}:${p.student_id}`;
 if (editingPair === key) {
 return (
 <form
 key={key}
 className="pair-card pair-card-edit"
 onSubmit={(e) => {
 e.preventDefault();
 const fd = new FormData(e.currentTarget);
 post("/api/admin/update-private", {
 tutorId: p.tutor_id,
 studentId: p.student_id,
 newTutorId: fd.get("tutorId"),
 newStudentId: fd.get("studentId"),
 subject: fd.get("subject"),
 note: fd.get("note"),
 });
 }}
 >
 <label className="field">
 Tutor
 <select name="tutorId" defaultValue={p.tutor_id} required>
 {tutors.map((t) => (
 <option key={t.id} value={t.id}>
 {t.full_name || t.email}
 </option>
 ))}
 </select>
 </label>
 <label className="field">
 Student
 <select name="studentId" defaultValue={p.student_id} required>
 {students.map((s) => (
 <option key={s.id} value={s.id}>
 {s.full_name || s.email}
 </option>
 ))}
 </select>
 </label>
 <label className="field">
 Subject
 <select name="subject" defaultValue={p.subject || "methods"}>
 {STUDENT_SUBJECTS.map((s) => (
 <option key={s.value} value={s.value}>
 {s.label}
 </option>
 ))}
 </select>
 </label>
 <label className="field">
 Note
 <input name="note" defaultValue={p.note} />
 </label>
 <div className="admin-edit-actions">
 <button className="btn btn-primary btn-compact" type="submit">
 Save
 </button>
 <button
 type="button"
 className="btn btn-ghost btn-compact"
 onClick={() => setEditingPair(null)}
 >
 Cancel
 </button>
 </div>
 </form>
 );
 }
 return (
 <article key={key} className="pair-card">
 <div className="pair-card-main">
 <p className="pair-card-names">
 <strong>{p.tutorLabel}</strong>
 <span aria-hidden="true"> ↔ </span>
 <strong>{p.studentLabel}</strong>
 </p>
 <p className="muted pair-card-meta">
 {[p.subject, p.note].filter(Boolean).join(" · ") || "No subject set"}
 </p>
 <p className="muted" style={{ fontSize: "0.78rem", margin: 0 }}>
 {p.tutorEmail} · {p.studentEmail}
 </p>
 </div>
 <div className="pair-card-actions">
 <button
 type="button"
 className="btn btn-ghost btn-compact"
 onClick={() => setEditingPair(key)}
 >
 Edit
 </button>
 <button
 type="button"
 className="btn btn-ghost btn-compact"
 onClick={() => {
 if (confirm(`Unlink ${p.studentLabel} ↔ ${p.tutorLabel}?`)) {
 post("/api/admin/delete-private", {
 tutorId: p.tutor_id,
 studentId: p.student_id,
 });
 }
 }}
 >
 Unlink
 </button>
 </div>
 </article>
 );
 })}
 </div>
 ) : (
 <p className="muted">{pairs.length ? "No pairs match that filter." : "No pairs yet."}</p>
 )}
 </section>
 );
}

function AccessBadge({ profileId, enrolments }: { profileId: string; enrolments: EnrolOpt[] }) {
 const tiers = enrolments.filter((e) => e.profile_id === profileId).map((e) => e.tier);
 const merged = mergeTiers(tiers);
 const pills = accessPills(merged);
 if (!pills.length) return <span className="muted">-</span>;
 return (
 <span className="access-pill-row">
 {pills.map((p) => (
 <span key={p} className="access-pill">
 {p}
 </span>
 ))}
 </span>
 );
}

export function AdminForms({
 isAdmin,
 classes,
 profiles,
 pairs,
 enrolments,
}: {
 isAdmin: boolean;
 classes: ClassOpt[];
 profiles: ProfileOpt[];
 pairs: PairOpt[];
 enrolments: EnrolOpt[];
}) {
 const router = useRouter();
 const [tab, setTab] = useState<AdminTab>("people");
 const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
 const [editingPerson, setEditingPerson] = useState<string | null>(null);
 const [editingPair, setEditingPair] = useState<string | null>(null);
 const [enrollingId, setEnrollingId] = useState<string | null>(null);
 const [addAccess, setAddAccess] = useState<AccessToggles>({
 masterclass: true,
 private11: false,
 });
 const [authAccess, setAuthAccess] = useState<AccessToggles>({
 masterclass: true,
 private11: false,
 });

 const tutors = profiles.filter((p) => p.role === "tutor" || p.role === "admin");
 const students = profiles.filter((p) => p.role === "student" || p.role === "admin");
 const pendingCount = profiles.filter((p) => p.role === "unverified").length;
 const masterClasses = classes.filter((c) => (c.stream || "masterclass") === "masterclass");

 function roleLabel(role: string) {
 if (role === "unverified") return "Unauthorised";
 return role;
 }

 async function post(url: string, body: FormData | object) {
 setMsg(null);
 const res = await fetch(url, {
 method: "POST",
 body: body instanceof FormData ? body : JSON.stringify(body),
 headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
 });
 const data = await res.json().catch(() => ({}));
 if (!res.ok) {
 setMsg({ text: data.error || "Something went wrong", ok: false });
 return false;
 }
 setMsg({ text: data.message || "Saved", ok: true });
 setEditingPerson(null);
 setEditingPair(null);
 setEnrollingId(null);
 void router.refresh();
 return true;
 }

 const tabs: { id: AdminTab; label: string; hint?: string }[] = [
 { id: "people", label: "People", hint: pendingCount ? `${pendingCount} pending` : undefined },
 { id: "access", label: "Access" },
 { id: "resources", label: "Resources" },
 { id: "classes", label: "Classes" },
 ];

 return (
 <div className="admin-console">
 {msg && (
 <p className={`admin-toast${msg.ok ? "" : " admin-toast-error"}`} role="status">
 {msg.text}
 </p>
 )}

 <div className="segmented admin-tabs" role="tablist" aria-label="Admin sections">
 {tabs.map((t) => (
 <button
 key={t.id}
 type="button"
 role="tab"
 className="segmented-item"
 data-active={tab === t.id}
 aria-selected={tab === t.id}
 onClick={() => setTab(t.id)}
 >
 {t.label}
 {t.hint ? <span className="segmented-badge">{t.hint}</span> : null}
 </button>
 ))}
 </div>

 {tab === "people" && isAdmin && (
 <div className="admin-panel-stack">
 <section className="admin-panel">
 <header className="admin-panel-head">
 <div>
 <h2>Add by email</h2>
 <p className="muted">
 Creates an authorised profile for that email. Class library is optional — leave empty for
 Progress-only until you assign Masterclass or Private.
 </p>
 </div>
 </header>
 <form
 className="admin-form-grid"
 onSubmit={(e) => {
 e.preventDefault();
 const fd = new FormData(e.currentTarget);
 post("/api/admin/enrol", {
 email: fd.get("email"),
 fullName: fd.get("fullName"),
 classId: fd.get("classId"),
 role: fd.get("role"),
 tier: tierFromToggles(addAccess) || "masterclass",
 yearLevel: fd.get("yearLevel"),
 yearLevelOther: fd.get("yearLevelOther"),
 subjects: fd.getAll("subjects"),
 subjectsOther: fd.get("subjectsOther"),
 });
 e.currentTarget.reset();
 setAddAccess({ masterclass: true, private11: false });
 }}
 >
 <label className="field">
 Email
 <input name="email" type="email" required placeholder="student@school.edu.au" />
 </label>
 <label className="field">
 Full name
 <input name="fullName" required placeholder="Alex Student" />
 </label>
 <label className="field">
 Class library <span className="muted">(optional)</span>
 <select name="classId" defaultValue="">
 <option value="">None yet — Progress only</option>
 {masterClasses.map((c) => (
 <option key={c.id} value={c.id}>
 {c.name}
 </option>
 ))}
 </select>
 </label>
 <RoleAndStudentFields
 label="Role"
 defaultRole="student"
 options={[
 { value: "student", label: "Student" },
 { value: "tutor", label: "Tutor" },
 ]}
 />
 <AccessTierToggles
 value={addAccess}
 onChange={(patch) => setAddAccess((v) => ({ ...v, ...patch }))}
 />
 <button className="btn btn-primary" type="submit">
 Authorise email
 </button>
 </form>
 </section>

 <section className="admin-panel">
 <header className="admin-panel-head">
 <div>
 <h2>Directory</h2>
 <p className="muted">
 Unauthorised sign-ups stay red until you Enrol. Pick a class library when you Enrol so
 gated resources unlock; otherwise they get Progress tools only.
 </p>
 </div>
 {pendingCount > 0 && (
 <span className="admin-unauth-count">{pendingCount} unauthorised</span>
 )}
 </header>

 <div className="admin-table-wrap">
 <table className="admin-table">
 <thead>
 <tr>
 <th>Name</th>
 <th>Email</th>
 <th>Role</th>
 <th>Year</th>
 <th>Subjects</th>
 <th>Access</th>
 <th />
 </tr>
 </thead>
 <tbody>
 {profiles.map((p) => {
 const unauth = p.role === "unverified";
 const isStudent = p.role === "student";

 if (editingPerson === p.id && !unauth) {
 return (
 <tr key={p.id}>
 <td colSpan={7}>
 <form
 className="admin-edit-panel"
 onSubmit={(e) => {
 e.preventDefault();
 const fd = new FormData(e.currentTarget);
 post("/api/admin/update-person", {
 id: p.id,
 fullName: fd.get("fullName"),
 role: fd.get("role"),
 yearLevel: fd.get("yearLevel"),
 yearLevelOther: fd.get("yearLevelOther"),
 subjects: fd.getAll("subjects"),
 subjectsOther: fd.get("subjectsOther"),
 });
 }}
 >
 <label className="field">
 Full name
 <input name="fullName" defaultValue={p.full_name} required />
 </label>
 <RoleAndStudentFields
 defaultRole={p.role}
 yearLevel={p.year_level}
 subjects={p.subjects}
 options={[
 { value: "student", label: "Student" },
 { value: "tutor", label: "Tutor" },
 { value: "admin", label: "Admin" },
 ]}
 />
 <div className="admin-edit-actions">
 <button className="btn btn-primary" type="submit">
 Save profile
 </button>
 <button
 type="button"
 className="btn btn-ghost"
 onClick={() => setEditingPerson(null)}
 >
 Cancel
 </button>
 </div>
 </form>
 {isStudent && (
 <div className="admin-edit-panel" style={{ marginTop: "0.75rem" }}>
 <SubjectAccessMatrix
 key={p.id}
 profileId={p.id}
 subjects={p.subjects || []}
 enrolments={enrolments}
 onSaved={(text, ok) => setMsg({ text, ok })}
 onSettled={() => void router.refresh()}
 />
 </div>
 )}
 </td>
 </tr>
 );
 }

 if (unauth) {
 return (
 <tr key={p.id} className="admin-person-unauth">
 <td colSpan={7}>
 <div className="admin-unauth-block">
 <div>
 <strong>{p.full_name || "-"}</strong>
 <div className="muted" style={{ fontSize: "0.85rem" }}>
 {p.email}
 </div>
 <span className="admin-unauth-label">Unauthorised</span>
 </div>
 <form
 className="admin-unauth-enrol"
 onSubmit={async (e) => {
 e.preventDefault();
 const fd = new FormData(e.currentTarget);
 setEnrollingId(p.id);
 const ok = await post("/api/admin/authorize", {
 id: p.id,
 role: fd.get("role"),
 fullName: p.full_name,
 classId: fd.get("classId"),
 tier: tierFromToggles(authAccess) || "masterclass",
 yearLevel: fd.get("yearLevel"),
 yearLevelOther: fd.get("yearLevelOther"),
 subjects: fd.getAll("subjects"),
 subjectsOther: fd.get("subjectsOther"),
 });
 if (ok) setAuthAccess({ masterclass: true, private11: false });
 if (!ok) setEnrollingId(null);
 }}
 >
 <RoleAndStudentFields
 defaultRole="student"
 options={[
 { value: "student", label: "Student" },
 { value: "tutor", label: "Tutor" },
 { value: "admin", label: "Admin" },
 ]}
 />
 <label className="field">
 Class library <span className="muted">(optional)</span>
 <select name="classId" defaultValue="">
 <option value="">None yet — Progress only</option>
 {masterClasses.map((c) => (
 <option key={c.id} value={c.id}>
 {c.name}
 </option>
 ))}
 </select>
 </label>
 <AccessTierToggles
 value={authAccess}
 onChange={(patch) => setAuthAccess((v) => ({ ...v, ...patch }))}
 legend="Gated access (if class selected)"
 compact
 />
 <div className="admin-enrol-row">
 <button
 className="btn btn-primary"
 type="submit"
 disabled={enrollingId === p.id}
 >
 {enrollingId === p.id ? "Enrolling…" : "Enrol"}
 </button>
 <button
 type="button"
 className="btn btn-ghost"
 disabled={enrollingId === p.id}
 onClick={() => {
 if (
 confirm(
 `Reject and delete ${p.full_name || p.email}? They can sign up again later.`
 )
 ) {
 post("/api/admin/delete-person", { id: p.id });
 }
 }}
 >
 Delete
 </button>
 </div>
 </form>
 </div>
 </td>
 </tr>
 );
 }

 return (
 <tr key={p.id}>
 <td>{p.full_name || "-"}</td>
 <td>{p.email}</td>
 <td style={{ textTransform: "capitalize" }}>{roleLabel(p.role)}</td>
 <td>{isStudent ? formatYearLevel(p.year_level) : "-"}</td>
 <td>{isStudent ? formatSubjects(p.subjects) : "-"}</td>
 <td>
 {isStudent ? (
 <AccessBadge profileId={p.id} enrolments={enrolments} />
 ) : (
 "-"
 )}
 </td>
 <td style={{ whiteSpace: "nowrap" }}>
 <button
 type="button"
 className="btn btn-ghost btn-compact"
 onClick={() => setEditingPerson(p.id)}
 >
 Edit
 </button>
 <button
 type="button"
 className="btn btn-ghost btn-compact"
 onClick={() => {
 if (
 confirm(
 `Delete ${p.full_name || p.email}? This removes their login and enrolments.`
 )
 ) {
 post("/api/admin/delete-person", { id: p.id });
 }
 }}
 >
 Delete
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 {!profiles.length && <p className="muted">No people yet.</p>}
 </section>
 </div>
 )}

 {tab === "access" && isAdmin && (
 <AccessPairsTab
 pairs={pairs}
 tutors={tutors}
 students={students}
 editingPair={editingPair}
 setEditingPair={setEditingPair}
 post={post}
 />
 )}

 {tab === "resources" && (
 <section className="admin-panel">
 <header className="admin-panel-head">
 <div>
 <h2>Upload resource set</h2>
 <p className="muted">
 PDFs for a masterclass library. Workbooks are core; solutions stay gated for Private
 1-1 until a tutor releases them.
 </p>
 </div>
 </header>
 <form
 className="admin-form-grid"
 onSubmit={(e) => {
 e.preventDefault();
 const fd = new FormData(e.currentTarget);
 post("/api/admin/upload-set", fd);
 e.currentTarget.reset();
 }}
 >
 <label className="field">
 Class
 <select name="classId" required>
 <option value="">Select…</option>
 {masterClasses.map((c) => (
 <option key={c.id} value={c.id}>
 {c.name}
 </option>
 ))}
 </select>
 </label>
 <label className="field">
 Code
 <input name="code" required placeholder="1.1" />
 </label>
 <label className="field">
 Title
 <input name="title" required placeholder="Discovering e" />
 </label>
 <label className="field">
 Section
 <select name="section" defaultValue="workbooks">
 <option value="workbooks">Workbooks</option>
 <option value="homework">Homework</option>
 <option value="mocks">Mock exams</option>
 </select>
 </label>
 <label className="field">
 Workbook PDF
 <input name="workbook" type="file" accept="application/pdf" required />
 </label>
 <label className="field">
 Solutions PDF (optional)
 <input name="solutions" type="file" accept="application/pdf" />
 </label>
 <label className="field">
 Homework PDF (optional)
 <input name="homework" type="file" accept="application/pdf" />
 </label>
 <button className="btn btn-primary" type="submit">
 Upload &amp; publish
 </button>
 </form>
 </section>
 )}

 {tab === "classes" && isAdmin && (
 <section className="admin-panel">
 <header className="admin-panel-head">
 <div>
 <h2>Create class</h2>
 <p className="muted">
 Masterclass classes power the shared Resources library. Private homework stays on the
 Private tab for tutors.
 </p>
 </div>
 </header>
 <form
 className="admin-form-grid"
 onSubmit={(e) => {
 e.preventDefault();
 const fd = new FormData(e.currentTarget);
 post("/api/admin/create-class", {
 name: fd.get("name"),
 subject: fd.get("subject"),
 unitBand: fd.get("unitBand"),
 yearLabel: fd.get("yearLabel"),
 stream: fd.get("stream"),
 });
 e.currentTarget.reset();
 }}
 >
 <label className="field">
 Stream
 <select name="stream" required defaultValue="masterclass">
 <option value="masterclass">Masterclass / shared Resources</option>
 <option value="private">Private (legacy class shell)</option>
 </select>
 </label>
 <label className="field">
 Name
 <input name="name" required placeholder="Methods Unit 3&4, Thu" />
 </label>
 <label className="field">
 Subject
 <select name="subject" required defaultValue="methods">
 {STUDENT_SUBJECTS.map((s) => (
 <option key={s.value} value={s.value}>
 {s.label}
 </option>
 ))}
 </select>
 </label>
 <label className="field">
 Unit band
 <input name="unitBand" placeholder="Unit 3&4" />
 </label>
 <label className="field">
 Year label
 <input name="yearLabel" placeholder="Term 1 2027" />
 </label>
 <button className="btn btn-primary" type="submit">
 Create class
 </button>
 </form>

 {classes.length > 0 && (
 <div className="admin-class-list">
 <h3 className="admin-subhead">Existing classes</h3>
 <ul>
 {classes.map((c) => (
 <li key={c.id}>
 <strong>{c.name}</strong>
 <span className="muted">
 {" "}
 · {c.subject}
 {c.unit_band ? ` · ${c.unit_band}` : ""}
 {c.stream ? ` · ${c.stream}` : ""}
 </span>
 </li>
 ))}
 </ul>
 </div>
 )}
 </section>
 )}
 </div>
 );
}
