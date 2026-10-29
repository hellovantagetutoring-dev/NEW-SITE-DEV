"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PrivateHomeworkUpload({
  students,
}: {
  students: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!students.length) return null;

  return (
    <form
      className="card"
      style={{ display: "grid", gap: "0.65rem", marginTop: "1rem" }}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg("");
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/tutor/private-file", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        if (!res.ok) {
          setMsg(data.error || "Upload failed");
          return;
        }
        setMsg(data.message || "Uploaded");
        e.currentTarget.reset();
        router.refresh();
      }}
    >
      <h3 style={{ margin: 0, fontSize: "1rem" }}>Upload custom 1-on-1 homework</h3>
      <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
        Only this student (and you) can see it. Shared workbooks stay under Resources.
      </p>
      <label className="field">
        Student
        <select name="studentId" required>
          <option value="">Select…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Title
        <input name="title" placeholder="Week 4 custom set" />
      </label>
      <label className="field">
        PDF
        <input name="file" type="file" accept="application/pdf" required />
      </label>
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Uploading…" : "Upload"}
      </button>
      {msg && <p className="muted" style={{ margin: 0 }}>{msg}</p>}
    </form>
  );
}
