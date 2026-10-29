export type UserRole = "student" | "tutor" | "admin" | "unverified";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  last_sign_in_at: string | null;
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
  storage_path: string;
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
  methods: "#7EB6D9",
  specialist: "#1B3A6B",
  chemistry: "#E8A0BF",
  physics: "#7B6BB0",
  literature: "#C4A484",
};
