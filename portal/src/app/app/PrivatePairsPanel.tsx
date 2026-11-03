"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type PrivateCard = {
  subject: string | null;
  note: string | null;
  partnerLabel: string;
  studentId?: string;
  tutorId?: string;
};

type PrivateFile = {
  id: string;
  title: string;
  created_at: string;
  student_id: string;
  tutor_id: string;
  studentLabel?: string;
};

export function PrivatePairsPanel({
  role,
  pairs,
  files,
}: {
  role: string;
  pairs: PrivateCard[];
  files: PrivateFile[];
}) {
  const router = useRouter();
  const staff = role === "tutor" || role === "admin";
  const [query, setQuery] = useState("");
  const [expandedUpload, setExpandedUpload] = useState<string | null>(null);
  const [busyUpload, setBusyUpload] = useState<string | null>(null);
  const [busyDelete, setBusyDelete] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const filesByPair = useMemo(() => {
    const map = new Map<string, PrivateFile[]>();
    for (const f of files) {
      const key = `${f.tutor_id}:${f.student_id}`;
      map.set(key, [...(map.get(key) || []), f]);
    }
    return map;
  }, [files]);

  const orphanFiles = useMemo(() => {
    const pairKeys = new Set(
      pairs
        .filter((p) => p.tutorId && p.studentId)
        .map((p) => `${p.tutorId}:${p.studentId}`)
    );
    return files.filter((f) => !pairKeys.has(`${f.tutor_id}:${f.student_id}`));
  }, [files, pairs]);

  const filteredPairs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pairs;
    return pairs.filter((p) => {
      const hay = [p.partnerLabel, p.subject, p.note].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [pairs, query]);

  async function upload(pairKey: string, studentId: string, tutorId: string | undefined, form: HTMLFormElement) {
    setBusyUpload(pairKey);
    setMsg("");
    const fd = new FormData(form);
    fd.set("studentId", studentId);
    if (role === "admin" && tutorId) fd.set("tutorId", tutorId);
    const res = await fetch("/api/tutor/private-file", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusyUpload(null);
    if (!res.ok) {
      setMsg(data.error || "Upload failed");
      return;
    }
    setMsg(data.message || "Uploaded");
    form.reset();
    setExpandedUpload(null);
    router.refresh();
  }

  async function removeFile(id: string) {
    if (!confirm("Remove this custom file? This cannot be undone.")) return;
    setBusyDelete(id);
    setMsg("");
    const res = await fetch("/api/tutor/private-file", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyDelete(null);
    if (!res.ok) {
      setMsg(data.error || "Could not remove file");
      return;
    }
    setMsg("File removed");
    router.refresh();
  }

  if (!pairs.length && !files.length) {
    return <p className="muted">No private 1-on-1 assignments yet.</p>;
  }

  return (
    <div className="private-pairs">
      {(pairs.length > 4 || role === "admin") && (
        <label className="field private-pairs-search">
          <span className="sr-only">Filter pairs</span>
          <input
            type="search"
            placeholder="Filter pairs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      )}

      {msg && (
        <p className="admin-toast" style={{ marginBottom: "0.75rem" }} role="status">
          {msg}
        </p>
      )}

      <div className="private-pair-list">
        {filteredPairs.map((p, i) => {
          const tutorId = p.tutorId || "";
          const studentId = p.studentId || "";
          const pairKey = `${tutorId}:${studentId}` || `idx-${i}`;
          const pairFiles =
            tutorId && studentId
              ? filesByPair.get(pairKey) || []
              : files.filter((f) => f.student_id === studentId);
          const uploading = busyUpload === pairKey;

          return (
            <article key={pairKey} className="private-pair-card">
              <header className="private-pair-head">
                <div>
                  <span className="pill">Private</span>
                  <h3>{p.subject || "1-on-1 tutoring"}</h3>
                  <p className="muted">
                    {p.partnerLabel}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <div className="private-pair-actions">
                  <span className="private-file-count">
                    {pairFiles.length} file{pairFiles.length === 1 ? "" : "s"}
                  </span>
                  <Link href="/app/calendar" className="btn btn-ghost btn-compact">
                    Sessions
                  </Link>
                  {staff && studentId && (
                    <button
                      type="button"
                      className="btn btn-primary btn-compact"
                      onClick={() =>
                        setExpandedUpload((cur) => (cur === pairKey ? null : pairKey))
                      }
                    >
                      {expandedUpload === pairKey ? "Cancel" : "Add file"}
                    </button>
                  )}
                </div>
              </header>

              {staff && expandedUpload === pairKey && studentId && (
                <form
                  className="private-pair-upload"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void upload(pairKey, studentId, tutorId || undefined, e.currentTarget);
                  }}
                >
                  <label className="field">
                    Title
                    <input name="title" placeholder="Week 4 custom set" />
                  </label>
                  <label className="field">
                    PDF
                    <input name="file" type="file" accept="application/pdf" required />
                  </label>
                  <button className="btn btn-primary btn-compact" type="submit" disabled={uploading}>
                    {uploading ? "Uploading…" : "Upload"}
                  </button>
                </form>
              )}

              {pairFiles.length > 0 ? (
                <ul className="private-pair-files">
                  {pairFiles.map((f) => (
                    <li key={f.id}>
                      <div>
                        <strong>{f.title}</strong>
                        <p className="muted">
                          {new Date(f.created_at).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="private-pair-file-actions">
                        <a className="btn btn-ghost btn-compact" href={`/api/download/private/${f.id}`}>
                          Download
                        </a>
                        {staff && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-compact"
                            disabled={busyDelete === f.id}
                            onClick={() => void removeFile(f.id)}
                          >
                            {busyDelete === f.id ? "…" : "Remove"}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted private-pair-empty">No custom files for this pair yet.</p>
              )}
            </article>
          );
        })}
      </div>

      {!filteredPairs.length && pairs.length > 0 && (
        <p className="muted">No pairs match that filter.</p>
      )}

      {orphanFiles.length > 0 && (
        <div className="private-orphan-files">
          <h3>Other custom files</h3>
          <ul className="private-pair-files">
            {orphanFiles.map((f) => (
              <li key={f.id}>
                <div>
                  <strong>{f.title}</strong>
                  <p className="muted">
                    {f.studentLabel ? `${f.studentLabel} · ` : ""}
                    {new Date(f.created_at).toLocaleDateString("en-AU")}
                  </p>
                </div>
                <div className="private-pair-file-actions">
                  <a className="btn btn-ghost btn-compact" href={`/api/download/private/${f.id}`}>
                    Download
                  </a>
                  {staff && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-compact"
                      disabled={busyDelete === f.id}
                      onClick={() => void removeFile(f.id)}
                    >
                      {busyDelete === f.id ? "…" : "Remove"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
