import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import {
  categoryFromFile,
  checkResourceAccess,
  resolveSubjectTier,
  type AccessResult,
  type EnrollmentTier,
  type ResourceCategory,
} from "./resource-access";

export type FileAccessMeta = {
  id: string;
  set_id: string;
  kind: string;
  category: ResourceCategory;
  solutions_released_at: string | null;
  access: AccessResult;
};

export async function getSubjectTierForUser(
  profile: Profile,
  subjectSlug: string
): Promise<{
  tier: EnrollmentTier | null;
  teachesSubject: boolean;
}> {
  const supabase = await createClient();
  const service = createServiceClient();
  const client = profile.role === "admin" || profile.role === "tutor" ? service : supabase;

  if (profile.role === "admin") {
    return { tier: "both", teachesSubject: true };
  }

  if (profile.role === "tutor") {
    const { data: tutorSubjects } = await client
      .from("tutor_subjects")
      .select("subject_id, subjects:subject_id (slug)")
      .eq("tutor_id", profile.id);

    const teachesFromTable = (tutorSubjects || []).some((row) => {
      const sub = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects;
      return (sub as { slug?: string } | null)?.slug === subjectSlug;
    });

    // Fallback: tutors of classes in this subject, or private pairs
    const { data: classTutor } = await client
      .from("class_tutors")
      .select("class_id, classes:class_id (subject)")
      .eq("profile_id", profile.id);

    const teachesClass = (classTutor || []).some((row) => {
      const klass = Array.isArray(row.classes) ? row.classes[0] : row.classes;
      return (klass as { subject?: string } | null)?.subject === subjectSlug;
    });

    const { count: pairCount } = await client
      .from("private_assignments")
      .select("*", { count: "exact", head: true })
      .eq("tutor_id", profile.id)
      .ilike("subject", `%${subjectSlug}%`);

    return {
      tier: null,
      teachesSubject: teachesFromTable || teachesClass || (pairCount || 0) > 0,
    };
  }

  // Student
  const { data: enrolments } = await client
    .from("enrolments")
    .select("tier, classes:class_id (subject, stream)")
    .eq("profile_id", profile.id);

  const enrolledClassTiers: EnrollmentTier[] = [];
  for (const row of enrolments || []) {
    const klass = Array.isArray(row.classes) ? row.classes[0] : row.classes;
    const sub = (klass as { subject?: string; stream?: string } | null)?.subject;
    if (sub !== subjectSlug) continue;
    const tier = (row.tier as EnrollmentTier | null) || "masterclass";
    enrolledClassTiers.push(tier);
  }

  const { count: privateCount } = await client
    .from("private_assignments")
    .select("*", { count: "exact", head: true })
    .eq("student_id", profile.id)
    .or(`subject.ilike.%${subjectSlug}%,subject.ilike.%${subjectSlug.replace("-", " ")}%`);

  const tier = resolveSubjectTier({
    enrolledClassTiers,
    hasPrivatePair: (privateCount || 0) > 0,
  });

  return { tier, teachesSubject: false };
}

export async function evaluateFileAccess(
  profile: Profile,
  file: {
    id: string;
    kind: string;
    category?: string | null;
    solutions_released_at?: string | null;
    set_id: string;
  },
  subjectSlug: string,
  classStream?: string | null
): Promise<AccessResult> {
  const { tier, teachesSubject } = await getSubjectTierForUser(profile, subjectSlug);

  let hasManualUnlock = false;
  if (profile.role === "student") {
    try {
      const service = createServiceClient();
      const { count, error } = await service
        .from("resource_unlocks")
        .select("*", { count: "exact", head: true })
        .eq("student_id", profile.id)
        .eq("resource_id", file.id);
      if (!error) hasManualUnlock = (count || 0) > 0;
    } catch {
      hasManualUnlock = false;
    }
  }

  const category = categoryFromFile({
    category: file.category,
    kind: file.kind,
    classStream,
  });

  return checkResourceAccess({
    user: { id: profile.id, role: profile.role },
    resource: {
      id: file.id,
      category,
      subjectSlug,
      solutionsReleased: !!file.solutions_released_at,
    },
    subjectTier: tier,
    teachesSubject,
    hasManualUnlock,
  });
}
