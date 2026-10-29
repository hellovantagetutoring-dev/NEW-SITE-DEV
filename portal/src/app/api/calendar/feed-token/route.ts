import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const service = createServiceClient();
  const tok =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

  const { error } = await service
    .from("profiles")
    .update({ calendar_feed_token: tok })
    .eq("id", profile.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ token: tok });
}

export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const service = createServiceClient();
  const { data } = await service
    .from("profiles")
    .select("calendar_feed_token")
    .eq("id", profile.id)
    .maybeSingle();

  let token = data?.calendar_feed_token;
  if (!token) {
    const res = await POST();
    const json = await res.json();
    token = json.token;
  }

  return NextResponse.json({ token });
}
