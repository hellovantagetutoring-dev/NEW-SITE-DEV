"use client";

import { useState } from "react";

export function RescheduleForm({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false);
  const [preferred, setPreferred] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    const res = await fetch("/api/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, preferredSlots: preferred, note }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus(data.error || "Could not send request");
      return;
    }
    setStatus("Request sent");
    setOpen(false);
    setPreferred("");
    setNote("");
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost" style={{ padding: "0.45rem 0.85rem" }} onClick={() => setOpen(true)}>
        Request reschedule
      </button>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: "0.55rem", minWidth: "240px", flex: 1 }}>
      <label className="field">
        Preferred times
        <textarea required rows={2} value={preferred} onChange={(e) => setPreferred(e.target.value)} placeholder="e.g. Tue after 5pm, Thu 4–6" />
      </label>
      <label className="field">
        Note
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
      </label>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Sending…" : "Send"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {status && <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>{status}</p>}
    </form>
  );
}
