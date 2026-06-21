// Session configs for staff & student portals. Read on the server only.
export const staffSessionConfig = {
  password:
    process.env.STAFF_SESSION_SECRET ||
    "gpkinnaur_staff_secret_change_in_prod_2024_padding_padding",
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
  password:
    process.env.STUDENT_SESSION_SECRET ||
    "gpkinnaur_student_secret_change_in_prod_2024_padding_padding",
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
