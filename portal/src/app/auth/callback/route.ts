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
 let { data: profile } = await service
 .from("profiles")
 .select("id, role, email")
 .eq("id", user.id)
 .maybeSingle();

 // Profile should be created by trigger; ensure one exists for cold sign-ups
 if (!profile) {
 const fullName =
 (user.user_metadata?.full_name as string | undefined) ||
 (user.user_metadata?.name as string | undefined) ||
 user.email.split("@")[0];
 await service.from("profiles").upsert({
 id: user.id,
 email: user.email.toLowerCase(),
 full_name: fullName,
 role: "unverified",
 last_sign_in_at: new Date().toISOString(),
 });
 profile = { id: user.id, role: "unverified", email: user.email.toLowerCase() };
 }

 const admins = (process.env.ADMIN_EMAILS || "")
 .split(",")
 .map((e) => e.trim().toLowerCase())
 .filter(Boolean);
 const isAdminEmail = admins.includes(user.email.toLowerCase());

 if (isAdminEmail) {
 if (profile.role !== "admin") {
 await service.from("profiles").update({ role: "admin" }).eq("id", user.id);
 }
 return NextResponse.redirect(`${origin}/app`);
 }

 if (profile.role === "admin" || profile.role === "tutor") {
 await service
 .from("profiles")
 .update({ last_sign_in_at: new Date().toISOString() })
 .eq("id", user.id);
 return NextResponse.redirect(`${origin}/app`);
 }

 const { count: enrolCount } = await service
 .from("enrolments")
 .select("*", { count: "exact", head: true })
 .eq("profile_id", user.id);

 const { count: privateCount } = await service
 .from("private_assignments")
 .select("*", { count: "exact", head: true })
 .eq("student_id", user.id);

 const authorised = (enrolCount || 0) > 0 || (privateCount || 0) > 0;

 if (!authorised) {
 // Cold sign-up: Progress tools unlock immediately; programs wait on admin enrol
 const { error } = await service
 .from("profiles")
 .update({ role: "unverified", last_sign_in_at: new Date().toISOString() })
 .eq("id", user.id);
 if (error) {
 console.error("Failed to mark profile unverified:", error.message);
 }
 return NextResponse.redirect(`${origin}/app`);
 }

 // Has class/pair access: ensure student role after admin pre-enrol
 if (profile.role === "unverified") {
 await service.from("profiles").update({ role: "student" }).eq("id", user.id);
 } else {
 await service
 .from("profiles")
 .update({ last_sign_in_at: new Date().toISOString() })
 .eq("id", user.id);
 }

 return NextResponse.redirect(`${origin}/app`);
}
