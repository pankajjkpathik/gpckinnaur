// Client-safe role constants & types (no server imports).
import type { StaffSession } from "./sessions";

export type StaffRole = StaffSession["role"];

// admin_staff handles system configuration (timetable, syllabus, calendar, master data).
// super_admin can do everything.
// Admin console at /admin merges Admin/Super-Admin and Clerk into a single workspace.
export const adminRoles: StaffRole[] = ["super_admin", "admin_staff", "clerk"];
export const clerkRoles: StaffRole[] = ["super_admin", "clerk"];
export const hodRoles: StaffRole[] = ["super_admin", "principal", "hod"];
export const facultyRoles: StaffRole[] = ["super_admin", "principal", "hod", "faculty"];
export const principalRoles: StaffRole[] = ["super_admin", "principal"];
export const tpoRoles: StaffRole[] = ["super_admin", "principal", "tpo"];

// Roles that can sign in through the public staff-login page.
export const publicStaffRoles: StaffRole[] = ["principal", "hod", "faculty", "tpo"];
// Roles that sign in via the hidden /admin-login URL.
export const adminPortalRoles: StaffRole[] = ["super_admin", "admin_staff", "clerk"];
