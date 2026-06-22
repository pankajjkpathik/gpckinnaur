import { getCookie, useSession } from "@tanstack/react-start/server";
import { staffSessionConfig, type StaffSession } from "./sessions";

export type StaffRole = StaffSession["role"];

export async function getStaffSession(): Promise<StaffSession | null> {
  if (!getCookie(staffSessionConfig.name)) return null;
  const s = await useSession<StaffSession>(staffSessionConfig);
  return s.data?.id ? (s.data as StaffSession) : null;
}

export async function requireStaff(): Promise<StaffSession> {
  const me = await getStaffSession();
  if (!me) throw new Error("Not authenticated");
  return me;
}

export async function requireRole(roles: StaffRole[]): Promise<StaffSession> {
  const me = await requireStaff();
  if (!roles.includes(me.role)) throw new Error("Forbidden: insufficient role");
  return me;
}

// admin_staff handles system configuration (timetable, syllabus, calendar, master data).
// super_admin can do everything.
export const adminRoles: StaffRole[] = ["super_admin", "admin_staff"];
export const clerkRoles: StaffRole[] = ["super_admin", "clerk"];
export const hodRoles: StaffRole[] = ["super_admin", "principal", "hod"];
export const facultyRoles: StaffRole[] = ["super_admin", "principal", "hod", "faculty"];
