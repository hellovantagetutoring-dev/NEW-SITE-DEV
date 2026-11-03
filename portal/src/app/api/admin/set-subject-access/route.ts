import { NextResponse } from "next/server";
import { tierFromToggles } from "@/lib/access-tier";
import { getProfile } from "@/lib/auth";
import { normalizeSubjectKey, subjectLabel } from "@/lib/student-fields";
import { createServiceClient } from "@/lib/supabase/server";

type ClassRow = { id: string; name: string; subject: string; stream: string };

function subjectAliases(subjectKey: string): string[] {
  return Array.from(
    new Set(
      [
        subjectKey,
        subjectKey === "methods" ? "maths-methods" : "",
        subjectKey === "methods" ? "mathematical-methods" : "",
        subjectKey === "specialist" ? "specialist-maths" : "",
        subjectKey === "specialist" ? "specialist-mathematics" : "",
        subjectKey === "maths-methods" ? "methods" : "",
        subjectKey === "specialist-maths" ? "specialist" : "",
      ].filter(Boolean)
    )
  );
}

async function ensureMasterclass(
  service: ReturnType<typeof createServiceClient>,
  subjectKey: string
): Promise<{ klass: ClassRow | null; classIds: string[]; error?: string }> {
  const aliases = subjectAliases(subjectKey);
  const { data, error: classErr } = await service
    .from("classes")
    .select("id, name, subject, stream")
    .eq("stream", "masterclass")
    .in("subject", aliases)
    .order("name")
    .limit(20);

  if (classErr) return { klass: null, classIds: [], error: classErr.message };

  const matched = (data || []) as ClassRow[];
  if (matched.length) {
    const exact =
      matched.find((c) => normalizeSubjectKey(String(c.subject || "")) === subjectKey) ||
      matched[0];
    return { klass: exact, classIds: matched.map((c) => c.id) };
  }

  const label = subjectLabel(subjectKey);
  const { data: created, error: createErr } = await service
    .from("classes")
    .insert({
      name: `${label} Masterclass`,
      subject: subjectKey,
      unit_band: "",
      year_label: "",
      stream: "masterclass",
    })
    .select("id, name, subject, stream")
    .single();

  if (createErr || !created) {
    return {
      klass: null,
      classIds: [],
      error: createErr?.message || `Could not create masterclass for “${subjectKey}”.`,
    };
  }

  return { klass: created as ClassRow, classIds: [created.id] };
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const profileId = String(body.profileId || "").trim();
  const subjectKey = normalizeSubjectKey(String(body.subject || ""));
  const masterclass = !!body.masterclass;
  const private11 = !!body.private11;

  if (!profileId || !subjectKey) {
    return NextResponse.json({ error: "Missing profile or subject" }, { status: 400 });
  }

  const tier = tierFromToggles({ masterclass, private11 });
  const service = createServiceClient();

  const { klass, classIds, error: ensureErr } = await ensureMasterclass(service, subjectKey);
  if (ensureErr || !klass) {
    return NextResponse.json(
      { error: ensureErr || `No masterclass class for “${subjectKey}”.` },
      { status: 400 }
    );
  }

  if (!tier) {
    const { error } = await service
      .from("enrolments")
      .delete()
      .eq("profile_id", profileId)
      .in("class_id", classIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      message: `Removed ${subjectLabel(subjectKey)}`,
      tier: null,
      subject: subjectKey,
      classId: klass.id,
    });
  }

  const row = { profile_id: profileId, class_id: klass.id, tier };
  let { error } = await service.from("enrolments").upsert(row, {
    onConflict: "profile_id,class_id",
  });

  if (error && /tier|schema cache/i.test(error.message)) {
    ({ error } = await service.from("enrolments").upsert(
      { profile_id: profileId, class_id: klass.id },
      { onConflict: "profile_id,class_id" }
    ));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: `Updated ${klass.name}`,
    tier,
    classId: klass.id,
    subject: subjectKey,
  });
}
