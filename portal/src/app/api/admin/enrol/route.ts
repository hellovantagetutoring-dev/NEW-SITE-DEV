import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const fullName = String(body.fullName || "").trim();
  const classId = String(body.classId || "");
  const role = body.role === "tutor" ? "tutor" : "student";
  if (!email || !fullName || !classId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const service = createServiceClient();

  // Find existing profile by email, or create auth invite user
  const { data: existing } = await service
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  let userId = existing?.id as string | undefined;

  if (!userId) {
    const { data: created, error } = await service.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !created.user) {
      return NextResponse.json(
        { error: error?.message || "Could not create user placeholder" },
        { status: 500 }
      );
    }
    userId = created.user.id;
    await service.from("profiles").upsert({
      id: userId,
      email,
      full_name: fullName,
      role,
    });
  } else {
    await service
      .from("profiles")
      .update({ full_name: fullName, role: existing?.role === "admin" ? "admin" : role })
      .eq("id", userId);
  }

  if (role === "tutor") {
    await service.from("class_tutors").upsert({ class_id: classId, profile_id: userId });
  } else {
    await service.from("enrolments").upsert({ class_id: classId, profile_id: userId });
  }

  return NextResponse.json({ message: `Added ${email} to class` });
}
