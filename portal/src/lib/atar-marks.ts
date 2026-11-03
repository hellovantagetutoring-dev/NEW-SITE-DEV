import { qtacBySlug } from "@/lib/qtac-subjects";
import type { SubjectMarkRow } from "@/lib/qce-scoring";

function parseMark(v: unknown): number | null {
 if (v == null || v === "") return null;
 const n = Number(v);
 return Number.isFinite(n) ? n : null;
}

/** Accept new IA1-EA rows or legacy { subject, raw } rows. */
export function normalizeSubjects(raw: unknown[]): SubjectMarkRow[] {
 const out: SubjectMarkRow[] = [];
 for (const item of raw) {
 const s = item as Record<string, unknown>;
 const subject = String(s.subject || "").toLowerCase().trim();
 if (!subject || subject === "ucat") continue;
 const meta = qtacBySlug(subject);
 const ia1 = parseMark(s.ia1 ?? s.ia1_score);
 const ia2 = parseMark(s.ia2 ?? s.ia2_score);
 const ia3 = parseMark(s.ia3 ?? s.ia3_score);
 const ea = parseMark(s.ea ?? s.ea_score);
 const rawOverride = parseMark(
 s.rawOverride ?? (s.raw != null && ia1 == null ? s.raw : null)
 );
 out.push({
 subject,
 qtacCode: String(s.qtacCode || meta?.code || "") || undefined,
 ia1,
 ia2,
 ia3,
 ea,
 rawOverride,
 });
 }
 return out;
}
