import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ReleaseSolutionsButton } from "./ReleaseSolutionsButton";

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

  const sections = [
    { key: "workbooks", label: "Workbooks" },
    { key: "homework", label: "Homework" },
    { key: "mocks", label: "Mock exams" },
  ];

  const canRelease = profile.role === "admin";

  return (
    <AppShell profile={profile} active="dashboard">
      <p style={{ marginBottom: "0.5rem" }}>
        <Link href="/app" className="muted">
          ← Classes
        </Link>
      </p>
      <h1 className="section-title">{klass.name}</h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        {klass.subject}
        {klass.unit_band ? ` · ${klass.unit_band}` : ""}
      </p>

      {sections.map((section) => {
        const sectionSets = (sets || []).filter((s) => s.section === section.key);
        if (!sectionSets.length) return null;
        return (
          <section key={section.key} style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>{section.label}</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {sectionSets.map((set) => {
                const setFiles = (files || []).filter((f) => f.set_id === set.id);
                const isPinned = set.id === newestId;
                return (
                  <div
                    key={set.id}
                    className="card"
                    style={
                      isPinned
                        ? { boxShadow: "0 0 0 2px color-mix(in srgb, var(--gold) 45%, transparent)" }
                        : undefined
                    }
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div>
                        {isPinned && <span className="pill">This week</span>}
                        <h3 style={{ margin: "0.4rem 0 0.15rem", fontSize: "1rem" }}>
                          {set.code} · {set.title}
                        </h3>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                        {setFiles.map((file) => {
                          if (
                            file.kind === "solutions" &&
                            !file.solutions_released_at &&
                            !canRelease
                          ) {
                            return (
                              <span key={file.id} className="muted" style={{ fontSize: "0.85rem" }}>
                                Solutions locked
                              </span>
                            );
                          }
                          return (
                            <a
                              key={file.id}
                              className="btn btn-primary"
                              href={`/api/download/${file.id}`}
                              style={{ padding: "0.45rem 0.9rem", fontSize: "0.85rem" }}
                            >
                              Download {file.kind}
                            </a>
                          );
                        })}
                        {canRelease &&
                          setFiles
                            .filter((f) => f.kind === "solutions" && !f.solutions_released_at)
                            .map((f) => (
                              <ReleaseSolutionsButton key={`rel-${f.id}`} fileId={f.id} />
                            ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {!sets?.length && (
        <p className="muted">No sets released yet. Admins can upload PDFs in Admin.</p>
      )}
    </AppShell>
  );
}
