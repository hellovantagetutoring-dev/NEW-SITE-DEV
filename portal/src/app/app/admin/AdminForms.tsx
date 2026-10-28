"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ClassOpt = { id: string; name: string; subject: string; unit_band: string };
type ProfileOpt = { id: string; email: string; full_name: string; role: string };

export function AdminForms({
  isAdmin,
  classes,
  profiles,
}: {
  isAdmin: boolean;
  classes: ClassOpt[];
  profiles: ProfileOpt[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

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
    router.refresh();
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      {msg && (
        <p className="card" style={{ margin: 0, background: "color-mix(in srgb, var(--gold) 12%, white)" }}>
          {msg}
        </p>
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
            <input name="name" required placeholder="Methods Unit 3&4 — Thu" />
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
            post("/api/admin/assign-private", {
              tutorEmail: fd.get("tutorEmail"),
              studentEmail: fd.get("studentEmail"),
              subject: fd.get("subject"),
              note: fd.get("note"),
            });
            e.currentTarget.reset();
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Link private 1-on-1 (tutor ↔ student)</h2>
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
            Tutors only organise sessions for these students — they cannot upload or release PDFs.
          </p>
          <label className="field">
            Tutor email
            <input name="tutorEmail" type="email" required placeholder="tutor@…" />
          </label>
          <label className="field">
            Student email
            <input name="studentEmail" type="email" required placeholder="student@…" />
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
            Link assignment
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

      {isAdmin && profiles.length > 0 && (
        <div className="card">
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem" }}>People</h2>
          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {profiles.map((p) => (
              <li key={p.id} style={{ marginBottom: "0.35rem" }}>
                {p.full_name} · {p.email} · {p.role}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
