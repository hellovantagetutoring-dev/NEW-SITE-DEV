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

  // Match student subject slugs to class.subject (exact first, then common aliases).
  const aliases = Array.from(
    new Set([
      subject,
      subject.replace(/\s+/g, "-"),
      subject === "methods" ? "maths-methods" : "",
      subject === "specialist" ? "specialist-maths" : "",
      subject === "maths-methods" ? "methods" : "",
      subject === "specialist-maths" ? "specialist" : "",
    ].filter(Boolean))
  );

  const { data: classes, error: classErr } = await service
    .from("classes")
    .select("id, name, subject, stream")
    .eq("stream", "masterclass")
    .in("subject", aliases)
    .order("name");

  if (classErr) return NextResponse.json({ error: classErr.message }, { status: 500 });

  const klass =
    (classes || []).find((c) => String(c.subject || "").toLowerCase() === subject) ||
    (classes || [])[0];

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
    return NextResponse.json({
      message: `Removed access for ${klass.name}`,
      tier: null,
      subject: String(klass.subject || subject).toLowerCase(),
    });
  }

  const row = { profile_id: profileId, class_id: klass.id, tier };
  let { error } = await service
    .from("enrolments")
    .upsert(row, { onConflict: "profile_id,class_id" });
  if (error && /tier|schema cache/i.test(error.message)) {
    ({ error } = await service
      .from("enrolments")
      .upsert(
        { profile_id: profileId, class_id: klass.id },
        { onConflict: "profile_id,class_id" }
      ));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: `Updated ${klass.name} access`,
    tier,
    classId: klass.id,
    subject: String(klass.subject || subject).toLowerCase(),
  });
}
