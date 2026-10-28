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

  if (profile?.role === "admin" || profile?.role === "tutor" || isAdminEmail) {
    if (isAdminEmail && profile && profile.role !== "admin") {
      const service = createServiceClient();
      await service.from("profiles").update({ role: "admin" }).eq("id", user.id);
    }
    return NextResponse.redirect(`${origin}/app`);
  }

  const { count } = await supabase
    .from("enrolments")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", user.id);

  if (!count) {
    return NextResponse.redirect(`${origin}/not-enrolled`);
  }

  return NextResponse.redirect(`${origin}/app`);
}
