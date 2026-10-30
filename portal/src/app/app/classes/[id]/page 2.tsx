import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClassWorkspace } from "./ClassWorkspace";

export default async function ClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: klass } = await supabase
    .from("classes")
    .select("id, name, subject, unit_band, year_label")
    .eq("id", id)
    .maybeSingle();
  if (!klass) notFound();

  const { data: sets } = await supabase
    .from("resource_sets")
    .select("id, code, title, section, release_at, sort_key, cover_path")
    .eq("class_id", id)
    .order("sort_key", { ascending: true });

  const setIds = (sets || []).map((s) => s.id);
  const { data: files } = setIds.length
    ? await supabase
        .from("resource_files")
        .select("id, set_id, kind, storage_path, solutions_released_at")
        .in("set_id", setIds)
    : { data: [] as const };

  const newestId = [...(sets || [])].sort((a, b) => {
    const ta = a.release_at ? new Date(a.release_at).getTime() : 0;
    const tb = b.release_at ? new Date(b.release_at).getTime() : 0;
    return tb - ta;
  })[0]?.id;

  return (
    <ClassWorkspace
      classId={klass.id}
      className={klass.name}
      subject={klass.subject}
      unitBand={klass.unit_band || ""}
      yearLabel={klass.year_label || ""}
      sets={sets || []}
      files={[...(files || [])]}
      newestId={newestId}
      canRelease={profile.role === "admin"}
    />
  );
}
