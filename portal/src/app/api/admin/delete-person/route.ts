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
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (id === profile.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: target } = await service.from("profiles").select("id, role").eq("id", id).maybeSingle();
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (target.role === "admin") {
    const { count } = await service
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count || 0) <= 1) {
      return NextResponse.json({ error: "Cannot delete the only admin" }, { status: 400 });
    }
  }

  const { error: authErr } = await service.auth.admin.deleteUser(id);
  if (authErr) {
    // Fallback: delete profile row (cascade) if auth user missing
    const { error } = await service.from("profiles").delete().eq("id", id);
    if (error) return NextResponse.json({ error: authErr.message || error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Person deleted" });
}
