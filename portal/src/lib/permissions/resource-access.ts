export type EnrollmentTier = "private_1on1" | "masterclass" | "both";
export type ResourceCategory =
  | "core_resource"
  | "mc_booklet_blank"
  | "mc_solution"
  | "mc_recording"
  | "shared_library";

export type AccessReason =
  | "admin"
  | "tutor_subject"
  | "enrolled_tier"
  | "manual_unlock"
  | "locked_subject"
  | "locked_tier"
  | "unreleased";

export type UpsellType = "add_subject" | "upgrade_masterclass" | "ask_tutor";

export type AccessResult = {
  canAccess: boolean;
  reason: AccessReason;
  upsellType?: UpsellType;
};

export type AccessUser = {
  id: string;
  role: "student" | "tutor" | "admin" | "unverified";
};

export type AccessResource = {
  id: string;
  category: ResourceCategory;
  subjectSlug: string;
  /** Global release flag for solutions (legacy) */
  solutionsReleased?: boolean;
};

/**
 * Derive enrollment tier for a subject from class enrolments + private pairs.
 * Prefer explicit enrolment.tier when present.
 * Private pair alone (or with private_1on1 enrolment) does NOT grant masterclass.
 */
export function resolveSubjectTier(input: {
  enrolledClassTiers: EnrollmentTier[];
  hasPrivatePair: boolean;
}): EnrollmentTier | null {
  const tiers = new Set(input.enrolledClassTiers);
  const hasMc = tiers.has("masterclass") || tiers.has("both");
  const hasPrivateEnrol = tiers.has("private_1on1") || tiers.has("both");
  const hasPrivate = input.hasPrivatePair || hasPrivateEnrol;

  if (hasMc && hasPrivate) return "both";
  if (hasMc) return "masterclass";
  if (hasPrivate) return "private_1on1";
  return null;
}

export function checkResourceAccess(input: {
  user: AccessUser;
  resource: AccessResource;
  subjectTier: EnrollmentTier | null;
  teachesSubject: boolean;
  hasManualUnlock: boolean;
  /** Any Private or Masterclass enrolment (for Resource Library packs). */
  hasProgramAccess?: boolean;
}): AccessResult {
  const {
    user,
    resource,
    subjectTier,
    teachesSubject,
    hasManualUnlock,
    hasProgramAccess = false,
  } = input;

  if (user.role === "admin") {
    return { canAccess: true, reason: "admin" };
  }

  if (user.role === "tutor") {
    if (teachesSubject || hasProgramAccess) return { canAccess: true, reason: "tutor_subject" };
    return { canAccess: false, reason: "locked_subject", upsellType: "add_subject" };
  }

  if (user.role !== "student") {
    return { canAccess: false, reason: "locked_subject" };
  }

  const isMasterclass = subjectTier === "masterclass" || subjectTier === "both";
  const isPrivate = subjectTier === "private_1on1" || subjectTier === "both";

  switch (resource.category) {
    case "shared_library": {
      if (hasProgramAccess || isMasterclass || isPrivate) {
        return { canAccess: true, reason: "enrolled_tier" };
      }
      return { canAccess: false, reason: "locked_subject", upsellType: "add_subject" };
    }

    case "core_resource":
    case "mc_booklet_blank":
      // Masterclass libraries require Masterclass enrolment (not free with Private).
      if (isMasterclass) return { canAccess: true, reason: "enrolled_tier" };
      if (isPrivate) {
        return { canAccess: false, reason: "locked_tier", upsellType: "upgrade_masterclass" };
      }
      return { canAccess: false, reason: "locked_subject", upsellType: "add_subject" };

    case "mc_solution": {
      if (isMasterclass) return { canAccess: true, reason: "enrolled_tier" };
      if (hasManualUnlock) return { canAccess: true, reason: "manual_unlock" };
      if (resource.solutionsReleased && isMasterclass) {
        return { canAccess: true, reason: "enrolled_tier" };
      }
      if (isPrivate) {
        return { canAccess: false, reason: "locked_tier", upsellType: "ask_tutor" };
      }
      return { canAccess: false, reason: "locked_subject", upsellType: "add_subject" };
    }

    case "mc_recording": {
      if (isMasterclass) return { canAccess: true, reason: "enrolled_tier" };
      if (isPrivate) {
        return { canAccess: false, reason: "locked_tier", upsellType: "upgrade_masterclass" };
      }
      return { canAccess: false, reason: "locked_subject", upsellType: "add_subject" };
    }

    default:
      return { canAccess: false, reason: "locked_tier" };
  }
}

/** Map legacy resource_files.kind (+ optional category) to ResourceCategory */
export function categoryFromFile(file: {
  category?: string | null;
  kind: string;
  classStream?: string | null;
  setSection?: string | null;
}): ResourceCategory {
  if (
    file.category === "core_resource" ||
    file.category === "mc_booklet_blank" ||
    file.category === "mc_solution" ||
    file.category === "mc_recording" ||
    file.category === "shared_library"
  ) {
    return file.category;
  }

  const stream = (file.classStream || "").toLowerCase();
  const section = (file.setSection || "").toLowerCase();

  if (stream === "library") return "shared_library";
  if (file.kind === "mock" || section === "mocks" || section === "retrieval") {
    return "shared_library";
  }
  if (file.kind === "solutions") return "mc_solution";
  if (file.kind === "workbook" && stream === "masterclass") return "mc_booklet_blank";
  return "core_resource";
}

export function stripLockedResource<T extends { storage_path?: string | null; video_url?: string | null }>(
  row: T,
  canAccess: boolean
): Omit<T, "storage_path" | "video_url"> {
  if (canAccess) return row as Omit<T, "storage_path" | "video_url">;
  const safe = { ...row };
  delete safe.storage_path;
  delete safe.video_url;
  return safe;
}
