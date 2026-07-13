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

const staffRoleEnum = z.enum([
  "super_admin",
  "principal",
  "hod",
  "faculty",
  "admin_staff",
  "clerk",
  "tpo",
]);

export const staffLogin = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        username: z.string().min(1),
        password: z.string().min(1),
        // Login page passes the tab's allowed roles. Enforced server-side so
        // portals can't be cross-logged (e.g. Principal via Faculty tab).
        allowedRoles: z.array(staffRoleEnum).min(1).optional(),
      })
      .parse(d),
  )
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

    // Portal separation. Held roles = primary + extra_roles. An HOD who also
    // teaches must have `faculty` in extra_roles to use the Faculty tab.
    if (data.allowedRoles && data.allowedRoles.length > 0) {
      const held = [row.role, ...((row.extra_roles ?? []) as string[])];
      const permitted = held.some((r) => (data.allowedRoles as string[]).includes(r));
      if (!permitted) {
        throw new Error("This account is not permitted to sign in from this portal.");
      }
    }

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
    .select("name, image_url, designation, dob, ip_number, pmis_number, phone, email, address, date_of_joining, date_of_retirement, staff_id, last_login, created_at")
    .eq("id", session.data.id)
    .maybeSingle();
  return {
    ...session.data,
    name: row?.name ?? null,
    image_url: row?.image_url ?? null,
    designation: row?.designation ?? null,
    dob: row?.dob ?? null,
    ip_number: row?.ip_number ?? null,
    pmis_number: row?.pmis_number ?? null,
    phone: row?.phone ?? null,
    email: row?.email ?? null,
    address: row?.address ?? null,
    date_of_joining: row?.date_of_joining ?? null,
    date_of_retirement: row?.date_of_retirement ?? null,
    staff_id: row?.staff_id ?? null,
    last_login: row?.last_login ?? null,
    created_at: row?.created_at ?? null,
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

export const staffUpdateProfile = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        name: z.string().trim().min(2).max(100).optional().nullable(),
        designation: z.string().trim().max(100).optional().nullable(),
        dob: z.string().trim().max(20).optional().nullable(),
        ip_number: z.string().trim().max(50).optional().nullable(),
        pmis_number: z.string().trim().max(50).optional().nullable(),
        phone: z
          .string()
          .trim()
          .max(15)
          .regex(/^[0-9+\-\s()]*$/, "Phone may only contain digits, spaces, +, -, ( or )")
          .optional()
          .nullable(),
        email: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
        address: z.string().trim().max(500).optional().nullable(),
        date_of_joining: z.string().trim().max(20).optional().nullable(),
        date_of_retirement: z.string().trim().max(20).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const session = await useSession<StaffSession>(staffSessionConfig);
    if (!session.data?.id) throw new Error("Not authenticated");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      patch[k] = v === "" ? null : v;
    }
    if (Object.keys(patch).length === 0) return { success: true };
    const { error } = await supabaseAdmin.from("staff_users").update(patch).eq("id", session.data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// Upload a profile photo for the authenticated staff user (all roles),
// store the object in the private `avatars` bucket, persist a long-lived
// signed URL on staff_users.image_url, and return the new URL so the UI
// can refresh the hero avatar immediately.
const AVATAR_SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10; // 10 years

export const uploadStaffAvatar = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        filename: z.string().min(1).max(200),
        contentType: z
          .string()
          .regex(/^image\/(png|jpe?g|webp|gif)$/i, "Only PNG, JPEG, WEBP or GIF images are allowed"),
        contentBase64: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const session = await useSession<StaffSession>(staffSessionConfig);
    if (!session.data?.id) throw new Error("Not authenticated");
    const bytes = Buffer.from(data.contentBase64, "base64");
    if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const safe = data.filename.replace(/[^\w.\-]+/g, "_");
    const path = `staff/${session.data.id}/${Date.now()}-${safe}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("avatars")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("avatars")
      .createSignedUrl(path, AVATAR_SIGNED_URL_TTL);
    if (sErr || !signed) throw new Error(sErr?.message || "Failed to sign URL");
    const { error: updErr } = await supabaseAdmin
      .from("staff_users")
      .update({ image_url: signed.signedUrl })
      .eq("id", session.data.id);
    if (updErr) throw new Error(updErr.message);
    return { image_url: signed.signedUrl };
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
