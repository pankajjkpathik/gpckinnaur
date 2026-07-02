// Session configs for staff & student portals. Read on the server only.
const MIN_SESSION_SECRET_LENGTH = 32;
const SESSION_SECRET_FALLBACK_NAMES = ["LOVABLE_API_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;

function getSessionSecretValue(name: string): string | null {
  const value = process.env[name];
  if (value && value.length >= MIN_SESSION_SECRET_LENGTH) return value;

  const fallbackName = SESSION_SECRET_FALLBACK_NAMES.find(
    (candidate) => (process.env[candidate]?.length ?? 0) >= MIN_SESSION_SECRET_LENGTH,
  );
  const fallback = fallbackName ? process.env[fallbackName] : undefined;
  return fallback ? `${name}:${fallback}:gpk-portal-session-v1` : null;
}

export function getSessionSecretIssue(name: string): string | null {
  if (getSessionSecretValue(name)) return null;
  const value = process.env[name];
  if (!value) return `${name} is not configured.`;
  if (value.length < MIN_SESSION_SECRET_LENGTH) {
    return `${name} is too short (must be >=${MIN_SESSION_SECRET_LENGTH} chars).`;
  }
  return null;
}

function requireSecret(name: string): string {
  const issue = getSessionSecretIssue(name);
  if (issue) {
    throw new Error(`${name} is not set or is too short (must be >=32 chars). Configure it as a project secret.`);
  }
  return getSessionSecretValue(name)!;
}

export const getStaffSessionSecretIssue = () => getSessionSecretIssue("STAFF_SESSION_SECRET");
export const getStudentSessionSecretIssue = () => getSessionSecretIssue("STUDENT_SESSION_SECRET");
// Parents share the student session secret (issue signalled via student session).
export const getParentSessionSecretIssue = () => getSessionSecretIssue("STUDENT_SESSION_SECRET");

export const staffSessionConfig = {
  get password() {
    return requireSecret("STAFF_SESSION_SECRET");
  },
  name: "gpk_staff_sid",
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
  maxAge: 60 * 60 * 8, // 8h
};

export const studentSessionConfig = {
  get password() {
    return requireSecret("STUDENT_SESSION_SECRET");
  },
  name: "gpk_student_sid",
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
  maxAge: 60 * 60 * 4, // 4h
};

export const parentSessionConfig = {
  get password() {
    return requireSecret("STUDENT_SESSION_SECRET");
  },
  name: "gpk_parent_sid",
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
  maxAge: 60 * 60 * 4, // 4h
};

export type StaffSession = {
  id: number;
  username: string;
  role: "super_admin" | "principal" | "hod" | "faculty" | "admin_staff" | "clerk" | "tpo";
  extraRoles?: ("super_admin" | "principal" | "hod" | "faculty" | "admin_staff" | "clerk" | "tpo")[];
  department: string | null;
};

export type StudentSession = {
  id: number;
  enrollmentNo: string;
  name: string;
  branch: string;
  semester: number;
  batchYear: number;
};

export type ParentSession = {
  studentId: number;
  enrollmentNo: string;
  studentName: string;
  branch: string;
  semester: number;
};
