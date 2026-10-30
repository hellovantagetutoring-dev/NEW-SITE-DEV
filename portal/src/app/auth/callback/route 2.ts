import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const service = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("id", user.id)
    .maybeSingle();

  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdminEmail = admins.includes(user.email.toLowerCase());

  if (isAdminEmail) {
    if (profile && profile.role !== "admin") {
      await service.from("profiles").update({ role: "admin" }).eq("id", user.id);
    }
    return NextResponse.redirect(`${origin}/app`);
  }

  if (profile?.role === "admin" || profile?.role === "tutor") {
    return NextResponse.redirect(`${origin}/app`);
  }

  const { count: enrolCount } = await supabase
    .from("enrolments")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", user.id);

  const { count: privateCount } = await supabase
    .from("private_assignments")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id);

  const authorised = (enrolCount || 0) > 0 || (privateCount || 0) > 0;

  if (!authorised) {
    // Mark cold / unauthorised sign-ins so Admin can see them as unverified logins
    await service
      .from("profiles")
      .update({ role: "unverified", last_sign_in_at: new Date().toISOString() })
      .eq("id", user.id);
    return NextResponse.redirect(`${origin}/not-enrolled`);
  }

  // Known student who was previously unverified
  if (profile?.role === "unverified") {
    await service.from("profiles").update({ role: "student" }).eq("id", user.id);
  }

  return NextResponse.redirect(`${origin}/app`);
}
