// Client-safe role constants & types (no server imports).
import type { StaffSession } from "./sessions";

export type StaffRole = StaffSession["role"];

// admin_staff handles system configuration (timetable, syllabus, calendar, master data).
// super_admin can do everything.
export const adminRoles: StaffRole[] = ["super_admin", "admin_staff"];
export const clerkRoles: StaffRole[] = ["super_admin", "clerk"];
export const hodRoles: StaffRole[] = ["super_admin", "principal", "hod"];
export const facultyRoles: StaffRole[] = ["super_admin", "principal", "hod", "faculty"];
