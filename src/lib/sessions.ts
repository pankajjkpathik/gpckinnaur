// Session configs for staff & student portals. Read on the server only.
function requireSecret(name: string): string {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(
      `${name} is not set or is too short (must be >=32 chars). Configure it as a project secret.`,
    );
  }
  return value;
}

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

export type StaffSession = {
  id: number;
  username: string;
  role: "super_admin" | "principal" | "hod" | "faculty" | "admin_staff";
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
