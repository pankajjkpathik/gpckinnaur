import { createServerFn } from "@tanstack/react-start";
import { getCookie, useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  getStaffSessionSecretIssue,
  getStudentSessionSecretIssue,
  staffSessionConfig,
  studentSessionConfig,
  type StaffSession,
  type StudentSession,
} from "./sessions";

// ---------- STAFF ----------

export const staffLogin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ username: z.string().min(1), password: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const secretIssue = getStaffSessionSecretIssue();
    if (secretIssue) throw new Error(secretIssue);
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("staff_users")
      .select("*")
      .eq("username", data.username)
      .eq("is_active", true)
      .maybeSingle();
    if (!row) throw new Error("Invalid credentials");
    const ok = await bcrypt.compare(data.password, row.password_hash);
    if (!ok) throw new Error("Invalid credentials");
    await supabaseAdmin.from("staff_users").update({ last_login: new Date().toISOString() }).eq("id", row.id);
    const session = await useSession<StaffSession>(staffSessionConfig);
    await session.update({
      id: row.id,
      username: row.username,
      role: row.role as StaffSession["role"],
      extraRoles: (row.extra_roles ?? []) as StaffSession["extraRoles"],
      department: row.department,
    });
    return { success: true, role: row.role };
  });

export const staffLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<StaffSession>(staffSessionConfig);
  await session.clear();
  return { success: true };
});

export const staffMe = createServerFn({ method: "GET" }).handler(async () => {
  if (getStaffSessionSecretIssue()) return null;
  if (!getCookie(staffSessionConfig.name)) return null;
  const session = await useSession<StaffSession>(staffSessionConfig);
  if (!session.data?.id) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("staff_users")
    .select("name, image_url, designation")
    .eq("id", session.data.id)
    .maybeSingle();
  return {
    ...session.data,
    name: row?.name ?? null,
    image_url: row?.image_url ?? null,
    designation: row?.designation ?? null,
  };
});

export const staffChangePassword = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) }).parse(d))
  .handler(async ({ data }) => {
    const session = await useSession<StaffSession>(staffSessionConfig);
    if (!session.data?.id) throw new Error("Not authenticated");
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("staff_users")
      .select("password_hash")
      .eq("id", session.data.id)
      .maybeSingle();
    if (!row) throw new Error("User not found");
    const ok = await bcrypt.compare(data.currentPassword, row.password_hash);
    if (!ok) throw new Error("Current password incorrect");
    const newHash = await bcrypt.hash(data.newPassword, 12);
    await supabaseAdmin.from("staff_users").update({ password_hash: newHash }).eq("id", session.data.id);
    return { success: true };
  });

// ---------- STUDENT ----------

export const studentLogin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ enrollmentNo: z.string().min(1), password: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const secretIssue = getStudentSessionSecretIssue();
    if (secretIssue) throw new Error(secretIssue);
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("students")
      .select("*")
      .eq("enrollment_no", data.enrollmentNo.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();
    if (!row) throw new Error("Invalid credentials");
    const ok = await bcrypt.compare(data.password, row.password_hash);
    if (!ok) throw new Error("Invalid credentials");
    const session = await useSession<StudentSession>(studentSessionConfig);
    await session.update({
      id: row.id,
      enrollmentNo: row.enrollment_no,
      name: row.name,
      branch: row.branch,
      semester: row.semester,
      batchYear: row.batch_year,
    });
    return { success: true };
  });

export const studentLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<StudentSession>(studentSessionConfig);
  await session.clear();
  return { success: true };
});

export const studentMe = createServerFn({ method: "GET" }).handler(async () => {
  if (getStudentSessionSecretIssue()) return null;
  if (!getCookie(studentSessionConfig.name)) return null;
  const session = await useSession<StudentSession>(studentSessionConfig);
  if (!session.data?.id) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("students")
    .select("id, enrollment_no, name, father_name, branch, semester, batch_year, phone, email, image_url, created_at")
    .eq("id", session.data.id)
    .maybeSingle();
  return row;
});
