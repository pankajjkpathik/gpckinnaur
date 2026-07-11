// Client-safe role constants & types (no server imports).
import type { StaffSession } from "./sessions";

export type StaffRole = StaffSession["role"];

// Admin console access is restricted to super_admin, principal, and hod.
// super_admin can do everything; principal & hod manage academic/system config.
export const adminRoles: StaffRole[] = ["super_admin", "principal", "hod"];
export const clerkRoles: StaffRole[] = ["super_admin", "clerk"];
// Roles permitted in the hidden /admin-login console.
export const adminPortalRoles: StaffRole[] = ["super_admin", "principal", "hod", "clerk"];
// Roles permitted in the public /staff-login page.
export const publicStaffRoles: StaffRole[] = ["principal", "hod", "faculty", "tpo"];
export const hodRoles: StaffRole[] = ["super_admin", "principal", "hod"];
export const facultyRoles: StaffRole[] = ["super_admin", "principal", "hod", "faculty"];
export const principalRoles: StaffRole[] = ["super_admin", "principal"];
// Training & Placement Officer — now a real assignable role; principal/admin also allowed.
export const tpoRoles: StaffRole[] = ["super_admin", "principal", "admin_staff", "tpo"];

// All roles a staff member effectively holds (primary + extras).
export function heldRoles(me: { role?: StaffRole | null; extraRoles?: StaffRole[] | null } | null | undefined): StaffRole[] {
  if (!me) return [];
  return [...(me.role ? [me.role] : []), ...(me.extraRoles ?? [])];
}

// Does this person hold ANY of the allowed roles (primary or extra)?
export function hasRole(
  me: { role?: StaffRole | null; extraRoles?: StaffRole[] | null } | null | undefined,
  allowed: StaffRole[],
): boolean {
  if (!me) return false;
  return heldRoles(me).some((r) => allowed.includes(r));
}

// Assignable roles for the Faculty Management UI.
export const ASSIGNABLE_ROLES: StaffRole[] = ["faculty", "hod", "tpo", "admin_staff", "clerk", "principal"];
