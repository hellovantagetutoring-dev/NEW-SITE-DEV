"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TutorCreateSession({
  students,
}: {
  students: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!students.length) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/tutor/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: fd.get("studentId"),
        title: fd.get("title"),
        startsAt: fd.get("startsAt"),
        endsAt: fd.get("endsAt"),
        locationOrLink: fd.get("locationOrLink"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Could not create session");
      return;
    }
    setMsg("Session created");
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form className="card" style={{ display: "grid", gap: "0.75rem", maxWidth: 520 }} onSubmit={onSubmit}>
      <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Schedule a 1-on-1 session</h2>
      <label className="field">
        Student
        <select name="studentId" required defaultValue="">
          <option value="" disabled>
            Select…
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Title
        <input name="title" required placeholder="Methods IA2 review" />
      </label>
      <label className="field">
        Starts (Brisbane local)
        <input name="startsAt" type="datetime-local" required />
      </label>
      <label className="field">
        Ends
        <input name="endsAt" type="datetime-local" required />
      </label>
      <label className="field">
        Location or link
        <input name="locationOrLink" placeholder="Zoom / SLQ / Online" />
      </label>
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Add session"}
      </button>
      {msg && <p className="muted" style={{ margin: 0 }}>{msg}</p>}
    </form>
  );
}
