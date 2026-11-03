import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { normalizeSubjects } from "@/lib/atar-marks";
import { calculateAtar, resolveRaw } from "@/lib/qce-scoring";
import { qtacBySlug } from "@/lib/qtac-subjects";

const QTAC_API = "https://atar-navigator-api.qtac.edu.au/estimateatar";

type QtacSubjectPayload = {
 subject_code: string;
 score_low?: number;
 score_high?: number;
};

type QtacPrediction = { year: number; atar_low: number; atar_high: number };

function round2(n: number) {
 return Math.round(n * 100) / 100;
}

/**
 * Project from last completed QTAC year using recent ATAR/TEA trajectory.
 * Haircut is at most 0.05-0.10 below last year: ignore wide forecast bands.
 */
function blendEstimates(
 predictions: QtacPrediction[],
 localAtar: number
): { atarLow: number; atarHigh: number; atar: number; detail: string; haircut: number } {
 const completed = predictions
 .filter((p) => p.year <= 2025 && Math.abs(p.atar_low - p.atar_high) < 0.05)
 .sort((a, b) => a.year - b.year);

 if (!completed.length) {
 const atar = round2(localAtar);
 return {
 atar,
 atarLow: atar,
 atarHigh: atar,
 haircut: 0,
 detail: "local-only",
 };
 }

 const recent = completed.slice(-3);
 const last = recent[recent.length - 1];
 const lastAtar = last.atar_low;

 // Year-on-year deltas (proxy for TEA→ATAR trajectory for the same raws)
 const deltas: number[] = [];
 for (let i = 1; i < recent.length; i++) {
 deltas.push(recent[i].atar_low - recent[i - 1].atar_low);
 }
 const avgDelta =
 deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;

 // Soft check vs MVA: if local is clearly below last year, allow the larger haircut
 const localPull =
 Number.isFinite(localAtar) && localAtar < lastAtar - 0.15
 ? Math.min(0.1, lastAtar - localAtar)
 : 0;

 let haircut = 0;
 if (avgDelta < -0.35 || localPull >= 0.1) {
 haircut = 0.1;
 } else if (avgDelta < -0.08 || localPull >= 0.05) {
 haircut = 0.05;
 } else {
 haircut = 0;
 }

 const atar = round2(lastAtar - haircut);
 const atarLow = atar;
 // Upper bound stays at last year (trajectory may flatten)
 const atarHigh = round2(Math.min(99.95, Math.max(atar, lastAtar)));

 const years = recent.map((p) => `${p.year}=${p.atar_low}`).join(", ");
 return {
 atar,
 atarLow,
 atarHigh,
 haircut,
 detail: `last ${last.year}=${lastAtar}; Δ̄=${round2(avgDelta)}; −${haircut} [${years}]`,
 };
}

export async function POST(request: Request) {
 const profile = await getProfile();
 if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const body = await request.json();
 const rows = normalizeSubjects(Array.isArray(body.subjects) ? body.subjects : []);

 const payload: QtacSubjectPayload[] = [];
 const resolved: { subject: string; code: string; raw: number }[] = [];
 const warnings: string[] = [];

 for (const row of rows) {
 const meta =
 qtacBySlug(row.subject) ||
 (row.qtacCode ? { code: row.qtacCode, slug: row.subject, name: row.subject } : null);
 if (!meta?.code) {
 warnings.push(`Unknown QTAC subject: ${row.subject}`);
 continue;
 }
 const raw = resolveRaw(row);
 if (raw == null) continue;
 const score = Math.round(Math.max(0, Math.min(100, raw)));
 payload.push({ subject_code: meta.code, score_low: score, score_high: score });
 resolved.push({ subject: row.subject, code: meta.code, raw: score });
 }

 if (payload.length < 5) {
 return NextResponse.json(
 {
 error: "Enter at least 5 subjects with IA1-3 and EA (or a raw override) for an estimate.",
 warnings,
 resolved,
 },
 { status: 400 }
 );
 }

 const local = calculateAtar(
 resolved.map((r) => ({
 subject: r.subject,
 raw: r.raw,
 }))
 );

 let predictions: QtacPrediction[] = [];
 let qtacError: string | null = null;

 try {
 const res = await fetch(QTAC_API, {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Origin: "https://atar-navigator.qtac.edu.au",
 Referer: "https://atar-navigator.qtac.edu.au/",
 },
 body: JSON.stringify({
 session_id: `vantage-${profile.id.slice(0, 8)}`,
 subjects: payload,
 forecast_only: false,
 }),
 });
 const data = await res.json().catch(() => ({}));
 if (!res.ok || data.error) {
 qtacError = data.error || `QTAC Navigator returned ${res.status}`;
 } else {
 predictions = (data.atar_predictions || []) as QtacPrediction[];
 }
 } catch (err) {
 qtacError = err instanceof Error ? err.message : "Could not reach QTAC";
 }

 if (qtacError && !predictions.length) {
 const atar = round2(local.atar);
 return NextResponse.json({
 source: "mva-local",
 atar,
 atarLow: atar,
 atarHigh: atar,
 used: local.used,
 resolved,
 warnings: [...warnings, `QTAC unavailable (${qtacError}); using local scaling.`],
 disclaimer:
 "Estimate from QCE scaling model. Not an official ATAR prediction.",
 });
 }

 const blended = blendEstimates(predictions, local.atar);

 return NextResponse.json({
 source: "qtac-trajectory",
 atar: blended.atar,
 atarLow: blended.atarLow,
 atarHigh: blended.atarHigh,
 haircut: blended.haircut,
 blend: blended.detail,
 used: local.used,
 qtacYears: predictions
 .filter((p) => p.year <= 2025)
 .slice(-3)
 .map((p) => ({ year: p.year, atar: p.atar_low })),
 resolved,
 warnings: [...warnings, ...local.warnings],
 disclaimer:
 "Based on last completed QTAC scaling year, adjusted ≤0.10 for recent TEA/ATAR trajectory. Not an official ATAR.",
 });
}
