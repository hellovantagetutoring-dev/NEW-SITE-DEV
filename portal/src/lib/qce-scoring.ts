/**
 * QCAA General subject instrument weightings (= max marks on the ISMG).
 * Source: QCAA senior syllabuses 2025/26: weight % and mark total are the same number.
 */

import { mvaScaleRaw } from "@/lib/mva-scaling";

export type IaWeighting = {
 ia1: number;
 ia2: number;
 ia3: number;
 external: number;
 ia1Label: string;
 ia2Label: string;
 ia3Label: string;
 eaLabel?: string;
};

function w(
 ia1: number,
 ia2: number,
 ia3: number,
 external: number,
 labels: [string, string, string, string?]
): IaWeighting {
 return {
 ia1,
 ia2,
 ia3,
 external,
 ia1Label: labels[0],
 ia2Label: labels[1],
 ia3Label: labels[2],
 eaLabel: labels[3] || "External assessment",
 };
}

const MATHS = w(20, 15, 15, 50, [
 "IA1 PSMT",
 "IA2 Examination",
 "IA3 Examination",
 "EA Examination",
]);

const SCIENCE = w(10, 20, 20, 50, [
 "IA1 Data test",
 "IA2 Student experiment",
 "IA3 Research investigation",
 "EA Examination",
]);

const EVEN_75_25 = (l1: string, l2: string, l3: string, ea = "EA Examination") =>
 w(25, 25, 25, 25, [l1, l2, l3, ea]);

const LANG = w(20, 25, 30, 25, [
 "IA1 Short response",
 "IA2 Extended response",
 "IA3 Multimodal + interview",
 "EA Combination response",
]);

/** Per-subject QCAA instrument maxima (sum to 100). */
export const SUBJECT_IA_WEIGHTS: Record<string, IaWeighting> = {
 // English
 english: EVEN_75_25(
 "IA1 Spoken persuasive",
 "IA2 Written public audience",
 "IA3 Extended response exam"
 ),
 literature: EVEN_75_25(
 "IA1 Extended response exam",
 "IA2 Imaginative response",
 "IA3 Imaginative response"
 ),
 eal: EVEN_75_25(
 "IA1 Extended response exam",
 "IA2 Persuasive response",
 "IA3 Imaginative response"
 ),
 "english-extension": w(20, 20, 35, 25, [
 "IA1 Reading and defence",
 "IA2 Complex transformation",
 "IA3 Academic research paper",
 ]),

 // Maths: 50/50
 methods: MATHS,
 specialist: MATHS,
 "general-maths": MATHS,

 // Sciences: 10/20/20/50
 biology: SCIENCE,
 chemistry: SCIENCE,
 physics: SCIENCE,
 psychology: SCIENCE,
 "earth-science": SCIENCE,
 "marine-science": SCIENCE,

 // Humanities: mostly 25/25/25/25
 economics: EVEN_75_25(
 "IA1 Combination exam",
 "IA2 Investigation",
 "IA3 Extended response exam"
 ),
 accounting: EVEN_75_25(
 "IA1 Cash management project",
 "IA2 Combination exam",
 "IA3 Combination exam"
 ),
 business: EVEN_75_25(
 "IA1 Combination exam",
 "IA2 Business report",
 "IA3 Feasibility report"
 ),
 "legal-studies": EVEN_75_25(
 "IA1 Combination exam",
 "IA2 Inquiry report",
 "IA3 Analytical essay"
 ),
 "modern-history": EVEN_75_25(
 "IA1 Extended response exam",
 "IA2 Investigation",
 "IA3 Investigation",
 "EA Short response exam"
 ),
 "ancient-history": EVEN_75_25(
 "IA1 Extended response exam",
 "IA2 Investigation",
 "IA3 Investigation",
 "EA Short response exam"
 ),
 geography: EVEN_75_25(
 "IA1 Combination exam",
 "IA2 Field report",
 "IA3 Data report"
 ),
 philosophy: EVEN_75_25(
 "IA1 Extended response exam",
 "IA2 Analytical essay",
 "IA3 Analytical essay"
 ),
 "study-of-religion": EVEN_75_25(
 "IA1 Extended response exam",
 "IA2 Inquiry response",
 "IA3 Inquiry response",
 "EA Short response exam"
 ),

 // Technologies
 "digital-solutions": EVEN_75_25(
 "IA1 Technical proposal",
 "IA2 Digital solution",
 "IA3 Digital solution"
 ),
 engineering: EVEN_75_25(
 "IA1 Engineered solution",
 "IA2 Combination exam",
 "IA3 Engineered solution"
 ),
 design: w(20, 30, 25, 25, [
 "IA1 Design challenge",
 "IA2 Project",
 "IA3 Project",
 "EA Extended response",
 ]),
 "food-nutrition": EVEN_75_25(
 "IA1 Combination exam",
 "IA2 Food & Nutrition solution",
 "IA3 Food & Nutrition solution"
 ),

 // HPE
 health: EVEN_75_25(
 "IA1 Action research",
 "IA2 Extended response exam",
 "IA3 Investigation"
 ),
 "physical-education": EVEN_75_25(
 "IA1 Project folio",
 "IA2 Investigation report",
 "IA3 Project folio"
 ),

 // Languages: 20/25/30/25
 japanese: LANG,
 french: LANG,
 german: LANG,
 chinese: LANG,
 spanish: LANG,
 italian: LANG,
};

/** Default when subject unknown: most common 75/25 pattern. */
const DEFAULT_WEIGHTS = EVEN_75_25("IA1", "IA2", "IA3");

export function getIaWeights(subject: string): IaWeighting {
 return SUBJECT_IA_WEIGHTS[subject.toLowerCase()] || DEFAULT_WEIGHTS;
}

/** ISMG max for an instrument = its weighting (marks toward /100). */
export function instrumentMax(
 subject: string,
 field: "ia1" | "ia2" | "ia3" | "ea"
): number {
 const wts = getIaWeights(subject);
 if (field === "ea") return wts.external;
 return wts[field];
}

/**
 * QCAA adds the four instrument marks. Each mark is already out of its weight,
 * so raw /100 = ia1 + ia2 + ia3 + ea (no further scaling).
 */
export function contribution(
 score: number | null | undefined,
 max: number,
 _weightPercent?: number
): number | null {
 if (score == null || Number.isNaN(score) || max <= 0) return null;
 return Math.max(0, Math.min(max, score));
}

export function internalTotal(input: {
 subject: string;
 ia1: number | null;
 ia1Max: number;
 ia2: number | null;
 ia2Max: number;
 ia3: number | null;
 ia3Max: number;
}): { total: number | null; max: number; parts: (number | null)[] } {
 const wts = getIaWeights(input.subject);
 const ia1Max = input.ia1Max || wts.ia1;
 const ia2Max = input.ia2Max || wts.ia2;
 const ia3Max = input.ia3Max || wts.ia3;
 const parts = [
 contribution(input.ia1, ia1Max),
 contribution(input.ia2, ia2Max),
 contribution(input.ia3, ia3Max),
 ];
 const max = wts.ia1 + wts.ia2 + wts.ia3;
 const known = parts.filter((p): p is number => p != null);
 if (!known.length) return { total: null, max, parts };
 return { total: known.reduce((a, b) => a + b, 0), max, parts };
}

/** External marks needed to hit target raw overall (0-100). */
export function externalNeededForTarget(
 internalTotalMarks: number | null,
 targetRaw: number,
 externalWeight = 50
): { neededOutOf50: number; neededPercent: number } | null {
 if (internalTotalMarks == null) return null;
 const neededFromExternal = targetRaw - internalTotalMarks;
 const neededOutOf50 = Math.max(0, Math.min(externalWeight, neededFromExternal));
 const neededPercent = (neededOutOf50 / externalWeight) * 100;
 return { neededOutOf50, neededPercent };
}

/** Scale raw /100 → scaled score using MVA/QLD logistic fits (fallback for unknown subjects). */
export function scaleSubjectRaw(subject: string, raw: number): number {
 return mvaScaleRaw(subject, raw);
}

/**
 * Map TEA (sum of best 5 scaled ≈0-500) → ATAR.
 * Calibrated conservatively against recent QTAC historical points + MVA logistic scores.
 */
export function aggregateToAtar(aggregate: number): number {
 const a = Math.max(0, Math.min(500, aggregate));
 // Conservative vs older published charts (same TEA maps a bit lower)
 const points: [number, number][] = [
 [0, 30],
 [250, 55],
 [300, 68],
 [340, 78],
 [375, 85],
 [400, 88.5],
 [425, 91.2],
 [450, 93.4],
 [465, 94.7],
 [480, 96.3],
 [490, 97.5],
 [500, 98.8],
 ];
 for (let i = 0; i < points.length - 1; i++) {
 const [x0, y0] = points[i];
 const [x1, y1] = points[i + 1];
 if (a >= x0 && a <= x1) {
 const t = (a - x0) / (x1 - x0);
 return Math.round((y0 + t * (y1 - y0)) * 100) / 100;
 }
 }
 return 98.8;
}

export type AtarSubjectInput = {
 subject: string;
 raw: number;
 isEnglish?: boolean;
};

/** Subject mark row: IA1-3 + EA (each entered /20 typically), raw = weighted /100. */
export type SubjectMarkRow = {
 subject: string;
 qtacCode?: string;
 ia1: number | null;
 ia2: number | null;
 ia3: number | null;
 ea: number | null;
 /** Optional override if student already has a final /100 */
 rawOverride?: number | null;
};

export function rawFromComponents(
 subject: string,
 marks: { ia1: number | null; ia2: number | null; ia3: number | null; ea: number | null }
): number | null {
 if (marks.ia1 == null || marks.ia2 == null || marks.ia3 == null || marks.ea == null) {
 return null;
 }
 const wts = getIaWeights(subject);
 const raw =
 contribution(marks.ia1, wts.ia1)! +
 contribution(marks.ia2, wts.ia2)! +
 contribution(marks.ia3, wts.ia3)! +
 contribution(marks.ea, wts.external)!;
 return Math.round(Math.max(0, Math.min(100, raw)) * 100) / 100;
}

export function resolveRaw(row: SubjectMarkRow): number | null {
 if (row.rawOverride != null && !Number.isNaN(row.rawOverride)) {
 return Math.max(0, Math.min(100, row.rawOverride));
 }
 return rawFromComponents(row.subject, row);
}

export function calculateAtar(subjects: AtarSubjectInput[]): {
 atar: number;
 aggregate: number;
 used: { subject: string; raw: number; scaled: number }[];
 warnings: string[];
} {
 const warnings: string[] = [];
 const scaled = subjects
 .filter((s) => s.subject && !Number.isNaN(s.raw))
 .map((s) => ({
 subject: s.subject,
 raw: s.raw,
 scaled: scaleSubjectRaw(s.subject, s.raw),
 isEnglish: !!s.isEnglish || /english|literature/i.test(s.subject),
 }));

 if (scaled.length < 5) {
 warnings.push("Enter at least 5 General subjects for a stable ATAR estimate.");
 }

 // QCE ATAR: best five scaled results (no English mandate)
 const ranked = [...scaled].sort((a, b) => b.scaled - a.scaled);
 const used = ranked.slice(0, 5);

 const aggregate = used.reduce((sum, s) => sum + s.scaled, 0);
 const atar = aggregateToAtar(aggregate);
 return {
 atar,
 aggregate: Math.round(aggregate * 10) / 10,
 used: used.map(({ subject, raw, scaled: sc }) => ({
 subject,
 raw,
 scaled: Math.round(sc * 10) / 10,
 })),
 warnings,
 };
}

export const ISMG_CRITERIA: Record<string, string[]> = {
 psmt: ["Formulate", "Solve", "Evaluate & verify", "Communicate"],
 student_experiment: [
 "Research & planning",
 "Analysis of evidence",
 "Interpretation & evaluation",
 "Communication",
 ],
 research_investigation: [
 "Research & planning",
 "Analysis of evidence",
 "Interpretation & evaluation",
 "Communication",
 ],
};
