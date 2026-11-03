import { NextResponse } from "next/server";
import { tierFromToggles } from "@/lib/access-tier";
import { getProfile } from "@/lib/auth";
import { normalizeSubjectKey, subjectLabel } from "@/lib/student-fields";
import { createServiceClient } from "@/lib/supabase/server";

type ClassRow = { id: string; name: string; subject: string; stream: string };

async function ensureMasterclass(
  service: ReturnType<typeof createServiceClient>,
  subjectKey: string
): Promise<{ klass: ClassRow | null; matched: ClassRow[]; error?: string }> {
  const { data: all, error: classErr } = await service
    .from("classes")
    .select("id, name, subject, stream")
    .eq("stream", "masterclass")
    .order("name");

  if (classErr) return { klass: null, matched: [], error: classErr.message };

  const matched = (all || []).filter(
    (c) => normalizeSubjectKey(String(c.subject || "")) === subjectKey
  ) as ClassRow[];

  if (matched.length) {
    const exact =
      matched.find((c) => String(c.subject || "").toLowerCase() === subjectKey) || matched[0];
    return { klass: exact, matched };
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
      matched: [],
      error: createErr?.message || `Could not create masterclass for “${subjectKey}”.`,
    };
  }

  return { klass: created as ClassRow, matched: [created as ClassRow] };
}

async function upsertEnrolment(
  service: ReturnType<typeof createServiceClient>,
  profileId: string,
  classId: string,
  tier: string
): Promise<string | null> {
  const row = { profile_id: profileId, class_id: classId, tier };

  const upsert = await service.from("enrolments").upsert(row, {
    onConflict: "profile_id,class_id",
  });
  if (!upsert.error) return null;

  if (/tier|schema cache/i.test(upsert.error.message)) {
    // Column may be missing from schema cache — still ensure the enrolment row exists.
    const bare = await service.from("enrolments").upsert(
      { profile_id: profileId, class_id: classId },
      { onConflict: "profile_id,class_id" }
    );
    if (!bare.error) {
      const upd = await service
        .from("enrolments")
        .update({ tier })
        .eq("profile_id", profileId)
        .eq("class_id", classId);
      if (upd.error && !/tier|schema cache/i.test(upd.error.message)) {
        return upd.error.message;
      }
      return null;
    }
  }

  // Fallback path: update then insert (some PostgREST configs reject upsert).
  const upd = await service
    .from("enrolments")
    .update({ tier })
    .eq("profile_id", profileId)
    .eq("class_id", classId)
    .select("profile_id");
  if (!upd.error && upd.data && upd.data.length > 0) return null;

  const ins = await service.from("enrolments").insert(row);
  if (!ins.error) return null;
  if (/tier|schema cache/i.test(ins.error.message)) {
    const bare = await service
      .from("enrolments")
      .insert({ profile_id: profileId, class_id: classId });
    return bare.error?.message || null;
  }
  return ins.error.message;
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

  const { klass, matched, error: ensureErr } = await ensureMasterclass(service, subjectKey);
  if (ensureErr || !klass) {
    return NextResponse.json(
      { error: ensureErr || `No masterclass class for “${subjectKey}”.` },
      { status: 400 }
    );
  }

  const classIds = matched.map((c) => c.id);

  if (!tier) {
    const { error } = await service
      .from("enrolments")
      .delete()
      .eq("profile_id", profileId)
      .in("class_id", classIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      message: `Removed access for ${subjectLabel(subjectKey)}`,
      tier: null,
      subject: subjectKey,
      classId: klass.id,
    });
  }

  // Primary write on the canonical/first class.
  const primaryErr = await upsertEnrolment(service, profileId, klass.id, tier);
  if (primaryErr) return NextResponse.json({ error: primaryErr }, { status: 500 });

  // Keep sibling unit-band classes for the same subject in sync when already enrolled.
  for (const id of classIds) {
    if (id === klass.id) continue;
    const { data: existing } = await service
      .from("enrolments")
      .select("profile_id")
      .eq("profile_id", profileId)
      .eq("class_id", id)
      .maybeSingle();
    if (existing) {
      const syncErr = await upsertEnrolment(service, profileId, id, tier);
      if (syncErr) return NextResponse.json({ error: syncErr }, { status: 500 });
    }
  }

  return NextResponse.json({
    message: `Updated ${klass.name} access`,
    tier,
    classId: klass.id,
    subject: subjectKey,
  });
}
