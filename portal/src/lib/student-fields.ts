export const YEAR_LEVEL_PRESETS = [
 "Year 3",
 "Year 4",
 "Year 5",
 "Year 6",
 "Year 7",
 "Year 8",
 "Year 9",
 "Year 10",
 "Year 11",
 "Year 12",
 "UCAT",
 "Masterclass",
] as const;

export const STUDENT_SUBJECTS = [
 { value: "methods", label: "Maths Methods" },
 { value: "specialist", label: "Specialist Maths" },
 { value: "chemistry", label: "Chemistry" },
 { value: "physics", label: "Physics" },
 { value: "literature", label: "Literature" },
 { value: "english", label: "English" },
 { value: "economics", label: "Economics" },
 { value: "philosophy", label: "Philosophy" },
 { value: "digital-solutions", label: "Digital Solutions" },
 { value: "engineering", label: "Engineering" },
 { value: "japanese", label: "Japanese" },
 { value: "french", label: "French" },
 { value: "spanish", label: "Spanish" },
 { value: "ucat", label: "UCAT" },
] as const;

export type StudentSubject = (typeof STUDENT_SUBJECTS)[number]["value"];

const SUBJECT_VALUES = new Set(STUDENT_SUBJECTS.map((s) => s.value));
const SUBJECT_LABELS = Object.fromEntries(STUDENT_SUBJECTS.map((s) => [s.value, s.label]));

/** Canonical subject slug for enrolments / class matching (methods, chemistry, …). */
export function normalizeSubjectKey(raw: string): string {
  const s = String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/[_/]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  if (
    s === "maths-methods" ||
    s === "mathematical-methods" ||
    s === "math-methods" ||
    s === "mathematicalmethods"
  ) {
    return "methods";
  }
  if (
    s === "specialist-maths" ||
    s === "specialist-mathematics" ||
    s === "specialistmathematics"
  ) {
    return "specialist";
  }
  if (s === "digi-sol" || s === "digitalsolutions" || s === "digital-solution") {
    return "digital-solutions";
  }
  return s;
}

export function subjectLabel(slug: string): string {
  const key = normalizeSubjectKey(slug);
  return SUBJECT_LABELS[key] || slug;
}

export function parseYearLevel(stored?: string | null): {
 preset: string;
 other: string;
} {
 const value = String(stored || "").trim();
 if (!value) return { preset: "", other: "" };
 if ((YEAR_LEVEL_PRESETS as readonly string[]).includes(value)) {
 return { preset: value, other: "" };
 }
 return { preset: "other", other: value };
}

export function normalizeYearLevel(raw: unknown, otherRaw?: unknown): string {
 const value = String(raw ?? "").trim();
 if (!value) return "";
 if (value === "other") {
 return String(otherRaw ?? "").trim().slice(0, 80);
 }
 if ((YEAR_LEVEL_PRESETS as readonly string[]).includes(value)) return value;
 // Allow previously saved custom values through
 return value.slice(0, 80);
}

export function parseSubjects(stored?: string[] | null): {
 selected: string[];
 other: string;
} {
 const list = stored || [];
 const selected: string[] = [];
 const custom: string[] = [];
 for (const item of list) {
 const s = String(item || "").trim();
 if (!s) continue;
 if (SUBJECT_VALUES.has(s as StudentSubject)) selected.push(s);
 else custom.push(s);
 }
 return { selected, other: custom.join(", ") };
}

export function normalizeSubjects(raw: unknown, otherRaw?: unknown): string[] {
 const list = Array.isArray(raw)
 ? raw
 : typeof raw === "string"
 ? raw.split(",")
 : [];
 const out: string[] = [];
 const seen = new Set<string>();

 for (const item of list) {
 const s = String(item || "").trim().toLowerCase();
 if (!s || s === "other" || seen.has(s)) continue;
 if (SUBJECT_VALUES.has(s as StudentSubject)) {
 seen.add(s);
 out.push(s);
 }
 }

 const otherText = String(otherRaw ?? "").trim();
 if (otherText) {
 for (const part of otherText.split(",")) {
 const custom = part.trim().slice(0, 60);
 if (!custom) continue;
 const key = custom.toLowerCase();
 if (seen.has(key)) continue;
 seen.add(key);
 out.push(custom);
 }
 }

 return out;
}

export function formatSubjects(subjects: string[] | null | undefined): string {
 if (!subjects?.length) return "-";
 return subjects.map((s) => SUBJECT_LABELS[s] || s).join(", ");
}

export function formatYearLevel(yearLevel?: string | null): string {
 return yearLevel?.trim() || "-";
}
