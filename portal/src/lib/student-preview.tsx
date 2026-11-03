"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { EnrollmentTier } from "@/lib/permissions/resource-access";

const STORAGE_KEY = "vantage.studentPreview";

export type SubjectScope = "all" | "none";

export type StudentPreviewState = {
  enabled: boolean;
  tier: EnrollmentTier;
  subjectScope: SubjectScope;
  /** Demo: pretend tutor already released solutions for private students */
  solutionsUnlocked: boolean;
};

type StudentPreviewContextValue = StudentPreviewState & {
  available: boolean;
  setEnabled: (enabled: boolean) => void;
  setTier: (tier: EnrollmentTier) => void;
  setSubjectScope: (scope: SubjectScope) => void;
  setSolutionsUnlocked: (unlocked: boolean) => void;
};

const DEFAULT_STATE: StudentPreviewState = {
  enabled: false,
  tier: "private_1on1",
  subjectScope: "all",
  solutionsUnlocked: false,
};

const StudentPreviewContext = createContext<StudentPreviewContextValue>({
  ...DEFAULT_STATE,
  available: false,
  setEnabled: () => {},
  setTier: () => {},
  setSubjectScope: () => {},
  setSolutionsUnlocked: () => {},
});

function loadState(): StudentPreviewState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<StudentPreviewState>;
    return {
      enabled: !!parsed.enabled,
      tier:
        parsed.tier === "masterclass" || parsed.tier === "both" || parsed.tier === "private_1on1"
          ? parsed.tier
          : DEFAULT_STATE.tier,
      subjectScope: parsed.subjectScope === "none" ? "none" : "all",
      solutionsUnlocked: !!parsed.solutionsUnlocked,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function StudentPreviewProvider({
  canPreview,
  children,
}: {
  canPreview: boolean;
  children: ReactNode;
}) {
  const [state, setState] = useState<StudentPreviewState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !canPreview) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated, canPreview]);

  const setEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, enabled }));
  }, []);
  const setTier = useCallback((tier: EnrollmentTier) => {
    setState((prev) => ({ ...prev, tier }));
  }, []);
  const setSubjectScope = useCallback((subjectScope: SubjectScope) => {
    setState((prev) => ({ ...prev, subjectScope }));
  }, []);
  const setSolutionsUnlocked = useCallback((solutionsUnlocked: boolean) => {
    setState((prev) => ({ ...prev, solutionsUnlocked }));
  }, []);

  const value = useMemo<StudentPreviewContextValue>(
    () => ({
      ...(canPreview ? state : DEFAULT_STATE),
      available: canPreview,
      setEnabled,
      setTier,
      setSubjectScope,
      setSolutionsUnlocked,
    }),
    [canPreview, state, setEnabled, setTier, setSubjectScope, setSolutionsUnlocked]
  );

  return (
    <StudentPreviewContext.Provider value={value}>{children}</StudentPreviewContext.Provider>
  );
}

export function useStudentPreview() {
  return useContext(StudentPreviewContext);
}

export function previewTierLabel(tier: EnrollmentTier) {
  if (tier === "private_1on1") return "Private 1-on-1";
  if (tier === "both") return "Private + Masterclass";
  return "Masterclass";
}
