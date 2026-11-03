"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QTAC_SUBJECTS, qtacBySlug } from "@/lib/qtac-subjects";
import {
  calculateAtar,
  getIaWeights,
  instrumentMax,
  resolveRaw,
  scaleSubjectRaw,
  type SubjectMarkRow,
} from "@/lib/qce-scoring";

type Row = SubjectMarkRow & { key: string; rawDraft?: string };

type Estimate = {
  atar?: number;
  atarLow: number;
  atarHigh: number;
  used?: { subject: string; raw: number; scaled: number }[];
  qtacYears?: { year: number; atar: number }[];
  resolved?: { subject: string; code: string; raw: number }[];
  warnings?: string[];
  disclaimer?: string;
  error?: string;
  source?: string;
};

const SUBJECT_OPTIONS = QTAC_SUBJECTS.filter(
  (s) => !s.slug.includes("extension") || s.slug === "english-extension"
);

function blankRow(subject = "methods"): Row {
  const meta = qtacBySlug(subject);
  return {
    key: Math.random().toString(36).slice(2),
    subject,
    qtacCode: meta?.code,
    ia1: null,
    ia2: null,
    ia3: null,
    ea: null,
    rawOverride: null,
  };
}

function toNum(v: string): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function cell(v: number | null | undefined): string {
  return v == null ? "" : String(v);
}

function payloadFromRows(rows: Row[]) {
  return rows.map(({ subject, qtacCode, ia1, ia2, ia3, ea, rawOverride }) => ({
    subject,
    qtacCode,
    ia1,
    ia2,
    ia3,
    ea,
    rawOverride,
  }));
}

function localEstimateFromRows(rows: Row[]): Estimate | null {
  const inputs = rows
    .map((r) => {
      const raw = resolveRaw(r);
      if (raw == null) return null;
      return { subject: r.subject, raw };
    })
    .filter((x): x is { subject: string; raw: number } => x != null);

  if (inputs.length < 5) return null;
  const local = calculateAtar(inputs);
  return {
    source: "local",
    atar: local.atar,
    atarLow: local.atar,
    atarHigh: local.atar,
    used: local.used,
    warnings: local.warnings,
    disclaimer: "Live local estimate. Refining with QTAC…",
  };
}

const DEFAULT_ROWS: Row[] = [
  { ...blankRow("english"), key: "1" },
  { ...blankRow("methods"), key: "2" },
  { ...blankRow("specialist"), key: "3" },
  { ...blankRow("chemistry"), key: "4" },
  { ...blankRow("physics"), key: "5" },
];

export function AtarCalculator() {
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);
  const [status, setStatus] = useState("Marks autosave. ATAR updates as you type.");
  const [busy, setBusy] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [ready, setReady] = useState(false);
  const dirtyRef = useRef(false);
  const syncGen = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const derived = useMemo(
    () =>
      rows.map((r) => {
        const raw = resolveRaw(r);
        const scaled =
          raw == null ? null : Math.round(scaleSubjectRaw(r.subject, raw) * 10) / 10;
        return { key: r.key, subject: r.subject, raw, scaled };
      }),
    [rows]
  );

  const bestFiveKeys = useMemo(() => {
    const ranked = derived
      .filter((d) => d.scaled != null)
      .sort((a, b) => (b.scaled ?? 0) - (a.scaled ?? 0))
      .slice(0, 5);
    return new Set(ranked.map((d) => d.key));
  }, [derived]);

  const qtacChart = useMemo(() => {
    const pts = estimate?.qtacYears ?? [];
    if (pts.length < 2) return null;
    const values = pts.map((p) => p.atar);
    const min = Math.min(...values) - 0.15;
    const max = Math.max(...values) + 0.15;
    const span = Math.max(0.3, max - min);
    const w = 220;
    const h = 72;
    const padX = 14;
    const padY = 12;
    const coords = pts.map((p, i) => {
      const x = padX + (i / (pts.length - 1)) * (w - padX * 2);
      const y = padY + (1 - (p.atar - min) / span) * (h - padY * 2);
      return { ...p, x, y };
    });
    const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
    return { w, h, coords, line, min, max };
  }, [estimate?.qtacYears]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/progress/atar");
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.subjects) && data.subjects.length) {
        setRows(
          data.subjects.map((s: SubjectMarkRow, i: number) => ({
            key: String(i),
            subject: s.subject,
            qtacCode: s.qtacCode || qtacBySlug(s.subject)?.code,
            ia1: s.ia1 ?? null,
            ia2: s.ia2 ?? null,
            ia3: s.ia3 ?? null,
            ea: s.ea ?? null,
            rawOverride: s.rawOverride ?? null,
          }))
        );
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Instant local ATAR + debounced autosave/QTAC refine (estimate never blocked by save)
  useEffect(() => {
    if (!ready) return;

    const gen = ++syncGen.current;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    // Sweep while refining: hide the previous figure so it does not look like a random ATAR
    setBusy(true);

    const timer = window.setTimeout(async () => {
      const body = { subjects: payloadFromRows(rows) };
      let saveOk = !dirtyRef.current;
      let saveErr = "";

      try {
        if (dirtyRef.current) {
          setStatus("Saving…");
          try {
            const saveRes = await fetch("/api/progress/atar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
              signal: ac.signal,
            });
            if (gen !== syncGen.current) return;
            if (!saveRes.ok) {
              const data = await saveRes.json().catch(() => ({}));
              saveOk = false;
              saveErr = data.error || "Save failed";
            } else {
              saveOk = true;
            }
          } catch (err) {
            if (ac.signal.aborted || gen !== syncGen.current) return;
            saveOk = false;
            saveErr = err instanceof Error ? err.message : "Save failed";
          }
        }

        if (gen !== syncGen.current) return;
        setStatus("Updating ATAR…");

        const estRes = await fetch("/api/progress/atar/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ac.signal,
        });
        if (gen !== syncGen.current) return;

        const data = await estRes.json().catch(() => ({}));
        if (!estRes.ok) {
          const local = localEstimateFromRows(rows);
          if (local) {
            setEstimate({
              ...local,
              disclaimer: "Local estimate only. Add marks for 5 subjects for QTAC refine.",
            });
            setStatus(
              saveOk
                ? data.error || "Local ATAR shown · need 5 subjects with marks"
                : `${saveErr || "Save issue"} · local ATAR shown`
            );
          } else {
            setEstimate(null);
            setStatus(
              data.error || "Need marks in at least 5 subjects for an estimate"
            );
          }
          return;
        }

        setEstimate(data as Estimate);
        if (saveOk) {
          setStatus("Autosaved · ATAR updated");
        } else {
          setStatus(`ATAR updated · ${saveErr || "could not autosave"}`);
        }
      } catch (err) {
        if (ac.signal.aborted || gen !== syncGen.current) return;
        const local = localEstimateFromRows(rows);
        if (local) setEstimate(local);
        setStatus(
          err instanceof Error ? err.message : "Could not reach estimate service"
        );
      } finally {
        if (gen === syncGen.current) setBusy(false);
      }
    }, dirtyRef.current ? 400 : 60);

    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [rows, ready]);

  function markDirty() {
    dirtyRef.current = true;
  }

  function update(idx: number, patch: Partial<Row>) {
    markDirty();
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  const atarDisplay = (() => {
    if (busy) return "";
    if (!estimate || estimate.atarLow == null) return "-";
    const low = estimate.atar ?? estimate.atarLow;
    const high = estimate.atarHigh;
    if (high == null || Math.abs(high - low) < 0.05) return low.toFixed(2);
    return `${low.toFixed(2)} - ${high.toFixed(2)}`;
  })();

  return (
    <div className="progress-card">
      <header className="progress-card-head">
        <div>
          <h3>ATAR &amp; subject marks</h3>
          <p className="muted">
            Enter ISMG marks for IA1-3 and EA (max = syllabus weighting). Raw = IA1+IA2+IA3+EA.
            Changes autosave, and the ATAR estimate updates as you edit. No Save or Estimate
            button needed.
          </p>
        </div>
        <div className={`atar-hero${busy ? " is-updating" : ""}`} aria-busy={busy}>
          <span className="atar-hero-label">Est. ATAR</span>
          <strong className="atar-hero-value" aria-label={busy ? "Updating ATAR estimate" : undefined}>
            {busy ? (
              <span className="atar-hero-sweep" aria-hidden="true" />
            ) : (
              <span className="atar-hero-value-text">{atarDisplay}</span>
            )}
          </strong>
          <span className="muted" style={{ fontSize: "0.72rem", maxWidth: "11rem" }}>
            {busy
              ? "Updating…"
              : estimate
                ? estimate.source === "local"
                  ? "live preview"
                  : "vs last QTAC year"
                : "Enter marks for 5 subjects"}
          </span>
        </div>
      </header>

      <div className="atar-marks-wrap">
        <table className="atar-marks-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>IA1</th>
              <th>IA2</th>
              <th>IA3</th>
              <th>EA</th>
              <th>Raw</th>
              <th>Scaled</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const raw = derived[idx]?.raw;
              const scaled = derived[idx]?.scaled;
              const inBestFive = bestFiveKeys.has(row.key) && scaled != null;
              const wts = getIaWeights(row.subject);
              const split = `${wts.ia1 + wts.ia2 + wts.ia3}/${wts.external}`;
              return (
                <tr key={row.key} className={inBestFive ? "is-best-five" : undefined}>
                  <td>
                    <select
                      value={row.subject}
                      onChange={(e) => {
                        const subject = e.target.value;
                        update(idx, {
                          subject,
                          qtacCode: qtacBySlug(subject)?.code,
                        });
                      }}
                    >
                      {SUBJECT_OPTIONS.map((s) => (
                        <option key={s.slug} value={s.slug}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <span
                      className="atar-weight-chip"
                      title={`${wts.ia1Label} ${wts.ia1} · ${wts.ia2Label} ${wts.ia2} · ${wts.ia3Label} ${wts.ia3} · ${wts.eaLabel || "EA"} ${wts.external}`}
                    >
                      {wts.ia1}/{wts.ia2}/{wts.ia3}/{wts.external} · {split}
                    </span>
                  </td>
                  {(["ia1", "ia2", "ia3", "ea"] as const).map((field) => {
                    const max = instrumentMax(row.subject, field);
                    const label =
                      field === "ea"
                        ? wts.eaLabel || "EA"
                        : field === "ia1"
                          ? wts.ia1Label
                          : field === "ia2"
                            ? wts.ia2Label
                            : wts.ia3Label;
                    return (
                      <td key={field}>
                        <input
                          type="number"
                          min={0}
                          max={max}
                          step={0.5}
                          inputMode="decimal"
                          aria-label={`${label} for ${row.subject}`}
                          title={`${label} /${max}`}
                          value={cell(row[field])}
                          placeholder={`/${max}`}
                          onChange={(e) =>
                            update(idx, {
                              [field]: toNum(e.target.value),
                              rawOverride: null,
                              rawDraft: undefined,
                            })
                          }
                        />
                      </td>
                    );
                  })}
                  <td className="atar-raw-cell">
                    {row.ia1 != null &&
                    row.ia2 != null &&
                    row.ia3 != null &&
                    row.ea != null &&
                    row.rawOverride == null &&
                    row.rawDraft == null ? (
                      <span title="IA1 + IA2 + IA3 + EA">{(raw ?? 0).toFixed(0)}</span>
                    ) : (
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label={`Raw /100 for ${row.subject}`}
                        value={
                          row.rawDraft != null ? row.rawDraft : cell(row.rawOverride)
                        }
                        placeholder="/100"
                        title="Enter subject result /100 (or fill IA1-EA to auto-sum)"
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v !== "" && !/^\d{0,3}(\.\d{0,2})?$/.test(v)) return;
                          const n = v === "" ? null : Number(v);
                          update(idx, {
                            rawDraft: v,
                            rawOverride:
                              v === "" || n == null || !Number.isFinite(n) ? null : n,
                          });
                        }}
                        onBlur={() => {
                          if (row.rawDraft != null) {
                            update(idx, { rawDraft: undefined });
                          }
                        }}
                      />
                    )}
                  </td>
                  <td className={`atar-scaled-cell${inBestFive ? " is-top" : ""}`}>
                    {scaled != null ? (
                      <span title={inBestFive ? "Counts in best five" : "Not in best five"}>
                        {scaled.toFixed(1)}
                        {inBestFive ? <em>top</em> : null}
                      </span>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-compact"
                      onClick={() => {
                        markDirty();
                        setRows((prev) => prev.filter((_, i) => i !== idx));
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="atar-actions">
        <button
          type="button"
          className="btn btn-ghost btn-compact"
          onClick={() => {
            markDirty();
            setRows((p) => [...p, blankRow()]);
          }}
        >
          Add subject
        </button>
        <span className="muted" style={{ fontSize: "0.82rem" }} aria-live="polite">
          {busy ? "Updating…" : status}
        </span>
      </div>

      {qtacChart && (
        <div className="atar-qtac-chart" aria-label="QTAC historical ATAR by year">
          <div className="atar-qtac-chart-head">
            <strong>QTAC past years</strong>
            <span className="muted">Same raws under recent scaling</span>
          </div>
          <svg
            className="atar-qtac-svg"
            viewBox={`0 0 ${qtacChart.w} ${qtacChart.h}`}
            role="img"
            aria-label={estimate?.qtacYears
              ?.map((y) => `${y.year}: ${y.atar.toFixed(2)}`)
              .join(", ")}
          >
            <defs>
              <linearGradient id="atarQtacFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(212,168,75,0.35)" />
                <stop offset="100%" stopColor="rgba(212,168,75,0)" />
              </linearGradient>
            </defs>
            <path
              d={`${qtacChart.line} L${qtacChart.coords[qtacChart.coords.length - 1].x.toFixed(1)} ${(qtacChart.h - 8).toFixed(1)} L${qtacChart.coords[0].x.toFixed(1)} ${(qtacChart.h - 8).toFixed(1)} Z`}
              fill="url(#atarQtacFill)"
            />
            <path d={qtacChart.line} fill="none" stroke="#c99a3a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            {qtacChart.coords.map((c) => (
              <g key={c.year}>
                <circle cx={c.x} cy={c.y} r="3.5" fill="#12264a" />
                <text x={c.x} y={qtacChart.h - 2} textAnchor="middle" className="atar-qtac-year">
                  {c.year}
                </text>
                <text x={c.x} y={Math.max(10, c.y - 8)} textAnchor="middle" className="atar-qtac-val">
                  {c.atar.toFixed(2)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {estimate?.warnings?.map((w) => (
        <p key={w} className="muted" style={{ fontSize: "0.82rem" }}>
          {w}
        </p>
      ))}
      {estimate?.disclaimer && (
        <p className="muted" style={{ fontSize: "0.78rem" }}>
          {estimate.disclaimer}
        </p>
      )}
    </div>
  );
}
