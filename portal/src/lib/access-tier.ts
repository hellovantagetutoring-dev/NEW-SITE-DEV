import type { EnrollmentTier } from "@/lib/permissions/resource-access";

export type AccessToggles = {
  masterclass: boolean;
  private11: boolean;
};

export function togglesFromTier(tier: EnrollmentTier | string | null | undefined): AccessToggles {
  if (tier === "both") return { masterclass: true, private11: true };
  if (tier === "private_1on1") return { masterclass: false, private11: true };
  if (tier === "masterclass") return { masterclass: true, private11: false };
  return { masterclass: false, private11: false };
}

export function tierFromToggles(t: AccessToggles): EnrollmentTier | null {
  if (t.masterclass && t.private11) return "both";
  if (t.masterclass) return "masterclass";
  if (t.private11) return "private_1on1";
  return null;
}

export function accessPills(tier: EnrollmentTier | string | null | undefined): string[] {
  const t = togglesFromTier(tier);
  const pills: string[] = [];
  if (t.masterclass) pills.push("MC");
  if (t.private11) pills.push("1-1");
  return pills;
}

/** Collapse multiple enrolment tiers for one subject into one display tier */
export function mergeTiers(tiers: (EnrollmentTier | string | null | undefined)[]): EnrollmentTier | null {
  let mc = false;
  let p11 = false;
  for (const tier of tiers) {
    const t = togglesFromTier(tier);
    mc = mc || t.masterclass;
    p11 = p11 || t.private11;
  }
  return tierFromToggles({ masterclass: mc, private11: p11 });
}
