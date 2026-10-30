import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const supabase = await createClient();
  const stream = body.stream === "private" ? "private" : "masterclass";
  const { error } = await supabase.from("classes").insert({
    name: String(body.name || "").trim(),
    subject: String(body.subject || "").trim().toLowerCase(),
    unit_band: String(body.unitBand || "").trim(),
    year_label: String(body.yearLabel || "").trim(),
    stream,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Class created" });
}
