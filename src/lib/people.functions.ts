import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminRoles } from "./roles";
import { requireRole } from "./roles.server";

async function requireAdmin() {
  return requireRole(adminRoles);
}

const optStr = z
  .string()
  .optional()
  .nullable()
  .or(z.literal("").transform(() => null));
const optDate = z
  .string()
  .optional()
  .nullable()
  .or(z.literal("").transform(() => null));
const optNum = z.number().optional().nullable();

// =====================================================================
// FACULTY / STAFF — full profile CRUD
// =====================================================================

export const facultyList = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ department: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("staff_users")
      .select(
        "id, username, name, designation, role, extra_roles, department, dob, ip_number, pmis_number, phone, email, last_salary_drawn, address, date_of_joining, date_of_retirement, is_active",
      )
      .in("role", ["faculty", "hod", "principal", "tpo", "admin_staff"])
      .order("name", { nullsFirst: false });
    if (data.department) q = q.eq("department", data.department);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const facultyProfileSchema = z.object({
  name: optStr,
  designation: optStr,
  dob: optDate,
  ip_number: optStr,
  pmis_number: optStr,
  department: optStr,
  phone: optStr,
  email: optStr.refine((v) => v == null || /\S+@\S+\.\S+/.test(v), { message: "Invalid email" }),
  last_salary_drawn: optNum,
  address: optStr,
  date_of_joining: optDate,
  date_of_retirement: optDate,
});

// Guards role/extra_roles escalation. A caller can only assign roles at or
// below their own privilege tier (super_admin > principal > hod > everyone
// else). Prevents an HOD or Principal from silently granting themselves
// Principal- or Super-Admin-level access via extra_roles.
type ManageableRole = "faculty" | "hod" | "principal" | "tpo" | "admin_staff" | "clerk" | "super_admin";
function assertRoleAssignmentAllowed(
  callerRole: string,
  targets: (ManageableRole | undefined)[],
) {
  const wanted = new Set(targets.filter(Boolean) as ManageableRole[]);
  if (callerRole === "super_admin") return;
  if (wanted.has("super_admin")) throw new Error("Only super admin can assign super_admin");
  if (wanted.has("principal")) throw new Error("Only super admin can assign principal");
  if (callerRole === "principal") return;
  // HOD (and anyone below) cannot promote to HOD.
  if (wanted.has("hod")) throw new Error("Only principal or super admin can assign HOD");
}

export const facultyCreate = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    facultyProfileSchema
      .extend({
        username: z.string().min(3).max(40),
        role: z.enum(["faculty", "hod", "principal", "tpo", "admin_staff", "clerk"]).default("faculty"),
        extra_roles: z.array(z.enum(["faculty", "hod", "principal", "tpo", "admin_staff", "clerk"])).default([]),
        password: z.string().min(8).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireAdmin();
    assertRoleAssignmentAllowed(me.role, [data.role, ...(data.extra_roles ?? [])] as ManageableRole[]);
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = await bcrypt.hash(data.password, 12);
    const { password, ...profile } = data;
    const { error } = await supabaseAdmin.from("staff_users").insert({
      ...profile,
      username: data.username.toLowerCase(),
      password_hash: hash,
      is_active: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const facultyUpdate = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    facultyProfileSchema
      .extend({
        id: z.number().int(),
        username: z.string().min(3).max(40).optional(),
        role: z.enum(["faculty", "hod", "principal", "tpo", "admin_staff", "clerk"]).optional(),
        extra_roles: z.array(z.enum(["faculty", "hod", "principal", "tpo", "admin_staff", "clerk"])).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireAdmin();
    const { id, ...patch } = data;
    assertRoleAssignmentAllowed(me.role, [patch.role, ...(patch.extra_roles ?? [])] as ManageableRole[]);
    // Extra guard: nobody may edit their own role/extra_roles (blocks self-escalation).
    if (id === me.id && (patch.role !== undefined || patch.extra_roles !== undefined)) {
      throw new Error("You cannot change your own role or additional roles.");
    }
    if (patch.username) (patch as any).username = patch.username.toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("staff_users").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const facultyDelete = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireAdmin();
    if (data.id === me.id) throw new Error("Cannot delete yourself");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("staff_users").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =====================================================================
// STUDENTS — full profile CRUD
// =====================================================================

export const studentList = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ branch: z.string().optional(), semester: z.number().int().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("students")
      .select(
        "id, enrollment_no, name, father_name, guardian_name, dob, branch, semester, batch_year, address, aadhaar_number, phone, parent_phone, email, bank_account_number, is_active",
      )
      .order("name");
    if (data.branch) q = q.eq("branch", data.branch);
    if (data.semester) q = q.eq("semester", data.semester);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const studentProfileSchema = z.object({
  name: z.string().min(2).max(100),
  father_name: optStr,
  guardian_name: optStr,
  dob: optDate,
  branch: z.string().min(2).max(50),
  semester: z.number().int().min(1).max(8),
  batch_year: z.number().int().min(2000).max(2100),
  address: optStr,
  aadhaar_number: optStr,
  phone: optStr,
  parent_phone: optStr,
  email: optStr.refine((v) => v == null || /\S+@\S+\.\S+/.test(v), { message: "Invalid email" }),
  bank_account_number: optStr,
});

export const studentCreate = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    studentProfileSchema
      .extend({
        enrollment_no: z.string().min(3).max(40),
        password: z.string().min(6).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = await bcrypt.hash(data.password, 12);
    const { password, ...profile } = data;
    const { error } = await supabaseAdmin.from("students").insert({
      ...profile,
      enrollment_no: data.enrollment_no.toUpperCase(),
      password_hash: hash,
      is_active: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const studentUpdate = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    studentProfileSchema
      .partial()
      .extend({ id: z.number().int(), enrollment_no: z.string().min(3).max(40).optional() })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { id, ...patch } = data;
    if (patch.enrollment_no) (patch as any).enrollment_no = patch.enrollment_no.toUpperCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("students").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const studentDelete = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("students").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Reset password (shared helper for both, since profile pages own this now)
export const facultyResetPassword = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int(), newPassword: z.string().min(8).max(100) }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = await bcrypt.hash(data.newPassword, 12);
    const { error } = await supabaseAdmin.from("staff_users").update({ password_hash: hash }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const studentResetPassword = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int(), newPassword: z.string().min(6).max(100) }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = await bcrypt.hash(data.newPassword, 12);
    const { error } = await supabaseAdmin.from("students").update({ password_hash: hash }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
