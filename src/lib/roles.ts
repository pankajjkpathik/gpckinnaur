// Client-safe role constants & types (no server imports).
import type { StaffSession } from "./sessions";

export type StaffRole = StaffSession["role"];

// admin_staff handles system configuration (timetable, syllabus, calendar, master data).
// super_admin can do everything.
export const adminRoles: StaffRole[] = ["super_admin", "admin_staff"];
export const clerkRoles: StaffRole[] = ["super_admin", "clerk"];
export const hodRoles: StaffRole[] = ["super_admin", "principal", "hod"];
export const facultyRoles: StaffRole[] = ["super_admin", "principal", "hod", "faculty"];
export const principalRoles: StaffRole[] = ["super_admin", "principal"];
// Training & Placement Officer — now a real assignable role; principal/admin also allowed.
export const tpoRoles: StaffRole[] = ["super_admin", "principal", "admin_staff", "tpo"];

// All roles a staff member effectively holds (primary + extras).
export function heldRoles(me: { role: StaffRole; extraRoles?: StaffRole[] } | null | undefined): StaffRole[] {
  if (!me) return [];
  return [me.role, ...(me.extraRoles ?? [])];
}

// Does this person hold ANY of the allowed roles (primary or extra)?
export function hasRole(
  me: { role: StaffRole; extraRoles?: StaffRole[] } | null | undefined,
  allowed: StaffRole[],
): boolean {
  if (!me) return false;
  return heldRoles(me).some((r) => allowed.includes(r));
}

// Assignable roles for the Faculty Management UI.
export const ASSIGNABLE_ROLES: StaffRole[] = ["faculty", "hod", "tpo", "admin_staff", "clerk", "principal"];
