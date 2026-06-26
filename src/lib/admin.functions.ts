import { createServerFn } from "@tanstack/react-start";
import { getCookie, useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { staffSessionConfig, type StaffSession } from "./sessions";

async function requireAdmin(): Promise<StaffSession> {
  if (!getCookie(staffSessionConfig.name)) throw new Error("Not authenticated");
  const session = await useSession<StaffSession>(staffSessionConfig);
  const me = session.data as StaffSession | undefined;
  if (!me?.id) throw new Error("Not authenticated");
  if (me.role !== "super_admin" && me.role !== "admin_staff")
    throw new Error("Forbidden: admin access required");
  return me;
}

async function requireSuperAdmin() {
  const me = await requireAdmin();
  if (me.role !== "super_admin") throw new Error("Forbidden: super admin only");
  return me;
}

// -------- Staff --------

export const adminListStaff = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("staff_users")
    .select("id, username, name, image_url, role, department, is_active, last_login, created_at" as any)
    .order("id");
  if (error) throw new Error(error.message);
  return (data as any[]) ?? [];
});

export const adminCreateStaff = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        username: z.string().min(2).max(80),
        name: z.string().min(2).max(100).optional().nullable(),
        image_url: z.string().optional().nullable(),
        role: z.enum(["super_admin", "principal", "hod", "faculty", "admin_staff", "clerk", "tpo"]),
        department: z.string().optional().nullable(),
        password: z.string().min(8).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireAdmin();
    if (data.role === "super_admin" && me.role !== "super_admin")
      throw new Error("Only super admin can create super admin");
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = await bcrypt.hash(data.password, 12);
    const { error } = await (supabaseAdmin.from("staff_users") as any).insert({
      username: data.username.toLowerCase().trim().replace(/\s+/g, "."),
      name: data.name || null,
      image_url: data.image_url || null,
      role: data.role,
      department: data.department || null,
      password_hash: hash,
      is_active: true,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminResetStaffPassword = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ id: z.number().int(), newPassword: z.string().min(8).max(100) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = await bcrypt.hash(data.newPassword, 12);
    const { error } = await supabaseAdmin
      .from("staff_users")
      .update({ password_hash: hash })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminToggleStaffActive = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int(), active: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("staff_users")
      .update({ is_active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminUpdateStaff = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      id: z.number().int(),
      username: z.string().min(2).max(80).optional(),
      name: z.string().min(2).max(100).optional().nullable(),
      image_url: z.string().optional().nullable(),
      role: z.enum(["super_admin", "principal", "hod", "faculty", "admin_staff", "clerk", "tpo"]).optional(),
      department: z.string().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireAdmin();
    const { id, ...patch } = data as any;
    if (patch.role === "super_admin" && me.role !== "super_admin")
      throw new Error("Only super admin can assign super admin");
    if (patch.username) patch.username = String(patch.username).toLowerCase().trim().replace(/\s+/g, ".");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin.from("staff_users") as any).update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateStudent = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      id: z.number().int(),
      name: z.string().min(2).max(100).optional(),
      enrollment_no: z.string().min(2).max(40).optional(),
      image_url: z.string().optional().nullable(),
      email: z.string().email().optional().nullable().or(z.literal("")),
      phone: z.string().optional().nullable(),
      branch: z.string().optional(),
      semester: z.number().int().min(1).max(8).optional(),
      batch_year: z.number().int().min(2000).max(2100).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { id, ...patch } = data as any;
    if (patch.enrollment_no) patch.enrollment_no = String(patch.enrollment_no).toUpperCase();
    if (patch.email === "") patch.email = null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin.from("students") as any).update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteStaff = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireSuperAdmin();
    if (data.id === me.id) throw new Error("Cannot delete yourself");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("staff_users").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteStudent = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("students").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Students --------

export const adminListStudents = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, enrollment_no, name, image_url, branch, semester, batch_year, is_active, email, phone, created_at" as any)
    .order("id");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const adminCreateStudent = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        enrollment_no: z.string().min(3).max(40),
        name: z.string().min(2).max(100),
        father_name: z.string().optional().nullable(),
        branch: z.string().min(2).max(50),
        semester: z.number().int().min(1).max(8),
        batch_year: z.number().int().min(2000).max(2100),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        password: z.string().min(6).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = await bcrypt.hash(data.password, 12);
    const { error } = await supabaseAdmin.from("students").insert({
      enrollment_no: data.enrollment_no.toUpperCase(),
      name: data.name,
      father_name: data.father_name || null,
      branch: data.branch,
      semester: data.semester,
      batch_year: data.batch_year,
      email: data.email || null,
      phone: data.phone || null,
      password_hash: hash,
      is_active: true,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminResetStudentPassword = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ id: z.number().int(), newPassword: z.string().min(6).max(100) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = await bcrypt.hash(data.newPassword, 12);
    const { error } = await supabaseAdmin
      .from("students")
      .update({ password_hash: hash })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const adminToggleStudentActive = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int(), active: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("students")
      .update({ is_active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// -------- Self change-password (student) --------

import { studentSessionConfig, type StudentSession } from "./sessions";

export const studentChangePassword = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({ currentPassword: z.string().min(1), newPassword: z.string().min(6).max(100) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (!getCookie(studentSessionConfig.name)) throw new Error("Not authenticated");
    const session = await useSession<StudentSession>(studentSessionConfig);
    if (!session.data?.id) throw new Error("Not authenticated");
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("students")
      .select("password_hash")
      .eq("id", session.data.id)
      .maybeSingle();
    if (!row) throw new Error("User not found");
    const ok = await bcrypt.compare(data.currentPassword, row.password_hash);
    if (!ok) throw new Error("Current password incorrect");
    const newHash = await bcrypt.hash(data.newPassword, 12);
    await supabaseAdmin
      .from("students")
      .update({ password_hash: newHash })
      .eq("id", session.data.id);
    return { success: true };
  });
