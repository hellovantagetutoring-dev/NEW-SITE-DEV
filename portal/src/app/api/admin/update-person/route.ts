import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const id = String(body.id || "");
  const fullName = String(body.fullName ?? "").trim();
  const role = String(body.role || "").trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!["student", "tutor", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const service = createServiceClient();

  if (role !== "admin" && id === profile.id) {
    const { count } = await service
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count || 0) <= 1) {
      return NextResponse.json({ error: "Cannot demote the only admin" }, { status: 400 });
    }
  }

  const { error } = await service
    .from("profiles")
    .update({ full_name: fullName, role })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Person updated" });
}
