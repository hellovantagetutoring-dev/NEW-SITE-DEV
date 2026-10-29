"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ClassOpt = { id: string; name: string; subject: string; unit_band: string };
type ProfileOpt = { id: string; email: string; full_name: string; role: string };
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

export function AdminForms({
  isAdmin,
  classes,
  profiles,
  pairs,
}: {
  isAdmin: boolean;
  classes: ClassOpt[];
  profiles: ProfileOpt[];
  pairs: PairOpt[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [editingPerson, setEditingPerson] = useState<string | null>(null);
  const [editingPair, setEditingPair] = useState<string | null>(null);

  const tutors = profiles.filter((p) => p.role === "tutor" || p.role === "admin");
  const students = profiles.filter((p) => p.role === "student" || p.role === "admin");

  async function post(url: string, body: FormData | object) {
    setMsg("");
    const res = await fetch(url, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error || "Something went wrong");
      return;
    }
    setMsg(data.message || "Saved");
    setEditingPerson(null);
    setEditingPair(null);
    router.refresh();
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      {msg && (
        <p
          className="card"
          style={{
            margin: 0,
            background: "color-mix(in srgb, var(--gold-btn) 28%, white)",
            color: "var(--bg-navy)",
            fontWeight: 600,
          }}
        >
          {msg}
        </p>
      )}

      {isAdmin && (
        <div className="card" style={{ display: "grid", gap: "0.85rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Tutoring pairs</h2>
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
            Each pair is a tutor ↔ student for private 1-on-1. Schedule them on Calendar (including
            generate term).
          </p>

          {pairs.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tutor</th>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Note</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pairs.map((p) => {
                    const key = `${p.tutor_id}:${p.student_id}`;
                    if (editingPair === key) {
                      return (
                        <tr key={key}>
                          <td colSpan={5}>
                            <form
                              className="cal-form"
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
                                <input name="subject" defaultValue={p.subject} />
                              </label>
                              <label className="field">
                                Note
                                <input name="note" defaultValue={p.note} />
                              </label>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button className="btn btn-primary" type="submit">
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  onClick={() => setEditingPair(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={key}>
                        <td>
                          <strong>{p.tutorLabel}</strong>
                          <div className="muted" style={{ fontSize: "0.78rem" }}>
                            {p.tutorEmail}
                          </div>
                        </td>
                        <td>
                          <strong>{p.studentLabel}</strong>
                          <div className="muted" style={{ fontSize: "0.78rem" }}>
                            {p.studentEmail}
                          </div>
                        </td>
                        <td>{p.subject || "—"}</td>
                        <td>{p.note || "—"}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: "0.35rem 0.65rem" }}
                            onClick={() => setEditingPair(key)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: "0.35rem 0.65rem" }}
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!pairs.length && <p className="muted">No pairs yet.</p>}

          <form
            style={{ display: "grid", gap: "0.65rem" }}
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
            <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Add pair</h3>
            <label className="field">
              Tutor
              <select name="tutorId" required>
                <option value="">Select…</option>
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || t.email} ({t.role})
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Student
              <select name="studentId" required>
                <option value="">Select…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || s.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Subject
              <input name="subject" placeholder="Methods" />
            </label>
            <label className="field">
              Note
              <input name="note" placeholder="Weekly Thursday" />
            </label>
            <button className="btn btn-primary" type="submit">
              Link pair
            </button>
          </form>
        </div>
      )}

      {isAdmin && (
        <form
          className="card"
          style={{ display: "grid", gap: "0.75rem" }}
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
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Create class</h2>
          <label className="field">
            Stream
            <select name="stream" required defaultValue="masterclass">
              <option value="masterclass">Masterclass</option>
              <option value="private">Private (shared resources, optional)</option>
            </select>
          </label>
          <label className="field">
            Name
            <input name="name" required placeholder="Methods Unit 3&4, Thu" />
          </label>
          <label className="field">
            Subject
            <select name="subject" required defaultValue="methods">
              <option value="methods">Methods</option>
              <option value="specialist">Specialist</option>
              <option value="chemistry">Chemistry</option>
              <option value="physics">Physics</option>
              <option value="literature">Literature</option>
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
      )}

      {isAdmin && (
        <form
          className="card"
          style={{ display: "grid", gap: "0.75rem" }}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            post("/api/admin/enrol", {
              email: fd.get("email"),
              fullName: fd.get("fullName"),
              classId: fd.get("classId"),
              role: fd.get("role"),
            });
            e.currentTarget.reset();
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Add student / tutor by email</h2>
          <label className="field">
            Email
            <input name="email" type="email" required placeholder="student@school.edu.au" />
          </label>
          <label className="field">
            Full name
            <input name="fullName" required placeholder="Alex Student" />
          </label>
          <label className="field">
            Class
            <select name="classId" required>
              <option value="">Select…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Role
            <select name="role" defaultValue="student">
              <option value="student">Student</option>
              <option value="tutor">Tutor</option>
            </select>
          </label>
          <button className="btn btn-primary" type="submit">
            Add to class
          </button>
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
            They sign in later with this email. Until then a placeholder profile is stored.
          </p>
        </form>
      )}

      <form
        className="card"
        style={{ display: "grid", gap: "0.75rem" }}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          post("/api/admin/upload-set", fd);
          e.currentTarget.reset();
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Upload set (PDF only)</h2>
        <label className="field">
          Class
          <select name="classId" required>
            <option value="">Select…</option>
            {classes.map((c) => (
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

      {isAdmin && (
        <div className="card">
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem" }}>People</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) =>
                  editingPerson === p.id ? (
                    <tr key={p.id}>
                      <td colSpan={4}>
                        <form
                          className="cal-form"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            post("/api/admin/update-person", {
                              id: p.id,
                              fullName: fd.get("fullName"),
                              role: fd.get("role"),
                            });
                          }}
                        >
                          <label className="field">
                            Full name
                            <input name="fullName" defaultValue={p.full_name} required />
                          </label>
                          <label className="field">
                            Role
                            <select name="role" defaultValue={p.role}>
                              <option value="student">Student</option>
                              <option value="tutor">Tutor</option>
                              <option value="admin">Admin</option>
                            </select>
                          </label>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button className="btn btn-primary" type="submit">
                              Save
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
                      </td>
                    </tr>
                  ) : (
                    <tr key={p.id}>
                      <td>{p.full_name || "—"}</td>
                      <td>{p.email}</td>
                      <td style={{ textTransform: "capitalize" }}>{p.role}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: "0.35rem 0.65rem" }}
                          onClick={() => setEditingPerson(p.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: "0.35rem 0.65rem" }}
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
                  )
                )}
              </tbody>
            </table>
          </div>
          {!profiles.length && <p className="muted">No people yet.</p>}
        </div>
      )}
    </div>
  );
}
