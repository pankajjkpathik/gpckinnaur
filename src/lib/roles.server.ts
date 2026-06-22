// Server-only role helpers (cookie/session access).
import { getCookie, useSession } from "@tanstack/react-start/server";
import { staffSessionConfig, type StaffSession } from "./sessions";
import type { StaffRole } from "./roles";

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
