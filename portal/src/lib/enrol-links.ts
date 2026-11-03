const SITE = process.env.NEXT_PUBLIC_MARKETING_URL || "https://vantagetutoring.com.au";

export type EnrolProgram = "private" | "masterclass" | "ucat";

/** Map portal program keys to marketing enrol ?program= values. */
function marketingProgramParam(program?: EnrolProgram | string | null): string | null {
  const p = String(program || "").toLowerCase();
  if (p === "private" || p === "masterclass") return p;
  // Marketing form uses data-enrol-program="medprep" for UCAT
  if (p === "ucat" || p === "medprep") return "medprep";
  return null;
}

export function marketingEnrolUrl(program?: EnrolProgram | string | null): string {
  const mapped = marketingProgramParam(program);
  if (mapped) return `${SITE}/enrol?program=${mapped}`;
  return `${SITE}/enrol`;
}
