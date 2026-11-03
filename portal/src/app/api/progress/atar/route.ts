import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { normalizeSubjects } from "@/lib/atar-marks";
import { qtacBySlug } from "@/lib/qtac-subjects";
import { getIaWeights, resolveRaw } from "@/lib/qce-scoring";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data } = await service
    .from("atar_plans")
    .select("subjects, updated_at")
    .eq("student_id", profile.id)
    .maybeSingle();

  const subjects = normalizeSubjects(Array.isArray(data?.subjects) ? data.subjects : []);
  return NextResponse.json({
    subjects,
    updated_at: data?.updated_at || null,
  });
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const subjects = normalizeSubjects(Array.isArray(body.subjects) ? body.subjects : []);

  const stored = subjects.map((s) => ({
    subject: s.subject,
    qtacCode: s.qtacCode || qtacBySlug(s.subject)?.code || "",
    ia1: s.ia1,
    ia2: s.ia2,
    ia3: s.ia3,
    ea: s.ea,
    rawOverride: s.rawOverride ?? null,
    raw: resolveRaw(s),
  }));

  const service = createServiceClient();
  const { error } = await service.from("atar_plans").upsert({
    student_id: profile.id,
    subjects: stored,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  for (const s of stored) {
    if (s.ia1 == null && s.ia2 == null && s.ia3 == null) continue;
    const wts = getIaWeights(s.subject);
    await service.from("ia_trackers").upsert(
      {
        student_id: profile.id,
        subject: s.subject,
        ia1_score: s.ia1,
        ia1_max: wts.ia1,
        ia2_score: s.ia2,
        ia2_max: wts.ia2,
        ia3_score: s.ia3,
        ia3_max: wts.ia3,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,subject" }
    );
  }

  return NextResponse.json({
    message: "Marks saved",
    subjects: stored,
  });
}
