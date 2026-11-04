export type UserRole = "student" | "tutor" | "admin" | "unverified";
export type TutorTier = "academic_tutor" | "senior_tutor" | null;
export type EnrollmentTier = "private_1on1" | "masterclass" | "both";
export type ResourceCategory =
  | "core_resource"
  | "mc_booklet_blank"
  | "mc_solution"
  | "mc_recording";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  last_sign_in_at: string | null;
  year_level?: string;
  subjects?: string[];
  tutor_tier?: TutorTier;
};

export type ClassRow = {
  id: string;
  name: string;
  subject: string;
  unit_band: string;
  year_label: string;
  stream?: "masterclass" | "private";
};

export type ResourceSet = {
  id: string;
  class_id: string;
  code: string;
  title: string;
  section: string;
  release_at: string | null;
  cover_path: string | null;
  sort_key: string;
};

export type ResourceFile = {
  id: string;
  set_id: string;
  kind: "workbook" | "homework" | "mock" | "solutions";
  category?: ResourceCategory;
  /** Only present when the viewer is allowed to access the file */
  storage_path?: string;
  video_url?: string | null;
  solutions_released_at: string | null;
};

export type SessionRow = {
  id: string;
  class_id: string | null;
  student_id: string | null;
  tutor_id: string | null;
  starts_at: string;
  ends_at: string;
  type: "masterclass" | "private";
  title: string;
  location_or_link: string;
};

export const SUBJECT_ACCENT: Record<string, string> = {
  methods: "#5BA4D9",
  specialist: "#3D5A99",
  chemistry: "#E891B4",
  physics: "#8B7CC9",
  literature: "#C9A27A",
  english: "#6CB5A0",
  economics: "#E0A35C",
  philosophy: "#9B8EC4",
  "digital-solutions": "#4EAEB5",
  engineering: "#D97B6C",
  japanese: "#E07A8A",
  french: "#6A9BE0",
  spanish: "#E0B04D",
  ucat: "#5C7CFA",
  general: "#C5A15F",
  retrieval: "#34C759",
  mocks: "#FF9F0A",
  library: "#AF52DE",
};
