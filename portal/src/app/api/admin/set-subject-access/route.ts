import { NextResponse } from "next/server";
import { tierFromToggles } from "@/lib/access-tier";
import { getProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const profileId = String(body.profileId || "").trim();
  const subject = String(body.subject || "").trim().toLowerCase();
  const masterclass = !!body.masterclass;
  const private11 = !!body.private11;

  if (!profileId || !subject) {
    return NextResponse.json({ error: "Missing profile or subject" }, { status: 400 });
  }

  const tier = tierFromToggles({ masterclass, private11 });
  const service = createServiceClient();

  const { data: klass, error: classErr } = await service
    .from("classes")
    .select("id, name, subject, stream")
    .eq("subject", subject)
    .eq("stream", "masterclass")
    .order("name")
    .limit(1)
    .maybeSingle();

  if (classErr) return NextResponse.json({ error: classErr.message }, { status: 500 });
  if (!klass) {
    return NextResponse.json(
      {
        error: `No masterclass class for “${subject}”. Create one under Classes first.`,
      },
      { status: 400 }
    );
  }

  if (!tier) {
    const { error } = await service
      .from("enrolments")
      .delete()
      .eq("profile_id", profileId)
      .eq("class_id", klass.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: `Removed access for ${klass.name}`, tier: null });
  }

  const row = { profile_id: profileId, class_id: klass.id, tier };
  let { error } = await service.from("enrolments").upsert(row);
  if (error && /tier|schema cache/i.test(error.message)) {
    ({ error } = await service
      .from("enrolments")
      .upsert({ profile_id: profileId, class_id: klass.id }));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: `Updated ${klass.name} access`,
    tier,
    classId: klass.id,
  });
}
