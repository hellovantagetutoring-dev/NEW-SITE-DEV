import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { normalizeSubjectKey, subjectLabel } from "@/lib/student-fields";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/** One Masterclass subject library per subject for the active cohort year. */
const MASTERCLASS_COHORT_YEAR = "2027";

function isCohortYear(yearLabel: string, year = MASTERCLASS_COHORT_YEAR) {
  return String(yearLabel || "").includes(year);
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const streamRaw = String(body.stream || "masterclass").toLowerCase();
  const stream =
    streamRaw === "private" ? "private" : streamRaw === "library" ? "library" : "masterclass";

  const subject = normalizeSubjectKey(String(body.subject || "").trim());
  if (!subject) {
    return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  }

  let name = String(body.name || "").trim();
  let unitBand = String(body.unitBand || "").trim();
  let yearLabel = String(body.yearLabel || "").trim();

  if (stream === "masterclass") {
    yearLabel = yearLabel && isCohortYear(yearLabel) ? yearLabel : MASTERCLASS_COHORT_YEAR;
    if (!name) name = `${subjectLabel(subject)} Masterclass ${MASTERCLASS_COHORT_YEAR}`;
    unitBand = unitBand || "";

    const service = createServiceClient();
    const { data: existing, error: findErr } = await service
      .from("classes")
      .select("id, name, year_label")
      .eq("stream", "masterclass")
      .eq("subject", subject);

    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });

    const clash = (existing || []).find((c) => isCohortYear(c.year_label || MASTERCLASS_COHORT_YEAR));
    // Treat blank year_label as the active cohort so legacy rows still block duplicates.
    const clashLegacy = (existing || []).find((c) => !String(c.year_label || "").trim());
    const blocker = clash || clashLegacy;
    if (blocker) {
      return NextResponse.json(
        {
          error: `Masterclass already exists for ${subjectLabel(subject)} (${MASTERCLASS_COHORT_YEAR}): “${blocker.name}”. Delete it first if you need to replace it.`,
        },
        { status: 409 }
      );
    }
  } else if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("classes").insert({
    name,
    subject,
    unit_band: unitBand,
    year_label: yearLabel,
    stream,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    message:
      stream === "masterclass"
        ? `Created ${name} (one Masterclass library per subject for ${MASTERCLASS_COHORT_YEAR})`
        : "Class created",
  });
}
