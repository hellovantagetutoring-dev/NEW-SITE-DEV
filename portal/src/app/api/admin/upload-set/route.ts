import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

function assertPdf(file: File | null, label: string) {
  if (!file || !file.size) return null;
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error(`${label} must be a PDF`);
  }
  return file;
}

export async function POST(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const classId = String(form.get("classId") || "");
    const code = String(form.get("code") || "").trim();
    const title = String(form.get("title") || "").trim();
    const section = String(form.get("section") || "workbooks");
    if (!classId || !code || !title) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const workbook = assertPdf(form.get("workbook") as File | null, "Workbook");
    if (!workbook) return NextResponse.json({ error: "Workbook PDF required" }, { status: 400 });
    const solutions = assertPdf(form.get("solutions") as File | null, "Solutions");
    const homework = assertPdf(form.get("homework") as File | null, "Homework");

    const service = createServiceClient();
    const { data: klass } = await service
      .from("classes")
      .select("stream")
      .eq("id", classId)
      .maybeSingle();
    const stream = (klass?.stream || "masterclass").toLowerCase();
    const libraryPack =
      stream === "library" || section === "mocks" || section === "retrieval";
    const primaryKind =
      section === "mocks" ? "mock" : section === "retrieval" ? "homework" : "workbook";
    const primaryCategory = libraryPack
      ? "shared_library"
      : stream === "masterclass" && primaryKind === "workbook"
        ? "mc_booklet_blank"
        : "core_resource";

    const sortKey = code.padStart(8, "0");
    const { data: set, error: setError } = await service
      .from("resource_sets")
      .insert({
        class_id: classId,
        code,
        title,
        section,
        sort_key: sortKey,
        release_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (setError || !set) {
      return NextResponse.json({ error: setError?.message || "Set failed" }, { status: 500 });
    }

    async function putFile(file: File, kind: string, category: string) {
      const path = `${classId}/${set!.id}/${kind}-${Date.now()}.pdf`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error } = await service.storage
        .from("class-resources")
        .upload(path, buffer, { contentType: "application/pdf", upsert: false });
      if (error) throw new Error(error.message);
      const row: Record<string, string | null> = {
        set_id: set!.id,
        kind,
        storage_path: path,
        solutions_released_at: null,
      };
      let { error: fileError } = await service.from("resource_files").insert({
        ...row,
        category,
      });
      if (fileError && /category|schema cache/i.test(fileError.message)) {
        ({ error: fileError } = await service.from("resource_files").insert(row));
      }
      if (fileError) throw new Error(fileError.message);
    }

    await putFile(workbook, primaryKind, primaryCategory);
    if (solutions) {
      await putFile(
        solutions,
        "solutions",
        libraryPack ? "shared_library" : "mc_solution"
      );
    }
    if (homework) {
      await putFile(
        homework,
        "homework",
        libraryPack ? "shared_library" : "core_resource"
      );
    }

    return NextResponse.json({ message: `Set ${code} is live` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
