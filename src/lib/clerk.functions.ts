import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clerkRoles, requireRole, adminRoles } from "./roles";

const clerkAccess = clerkRoles.concat(adminRoles);

export const clerkListStudents = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ branch: z.string().optional(), semester: z.number().int().optional(), q: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await requireRole(clerkAccess);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("students")
      .select("id, enrollment_no, name, father_name, branch, semester, batch_year, phone, email, is_active, address, guardian_phone, dob, admission_date")
      .order("enrollment_no");
    if (data.branch) q = q.eq("branch", data.branch);
    if (data.semester) q = q.eq("semester", data.semester);
    if (data.q) q = q.or(`name.ilike.%${data.q}%,enrollment_no.ilike.%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const clerkUpdateStudent = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int(),
        name: z.string().min(2).max(100).optional(),
        father_name: z.string().max(100).optional().nullable(),
        branch: z.string().max(50).optional(),
        semester: z.number().int().min(1).max(8).optional(),
        batch_year: z.number().int().min(2000).max(2100).optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().max(15).optional().nullable(),
        address: z.string().optional().nullable(),
        guardian_phone: z.string().max(20).optional().nullable(),
        dob: z.string().optional().nullable(),
        admission_date: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(clerkAccess);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("students").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clerkBulkImportStudents = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        defaultPassword: z.string().min(6).max(100),
        rows: z
          .array(
            z.object({
              enrollment_no: z.string().min(3).max(40),
              name: z.string().min(2).max(100),
              father_name: z.string().optional(),
              branch: z.string().min(2).max(50),
              semester: z.number().int().min(1).max(8),
              batch_year: z.number().int().min(2000).max(2100),
              email: z.string().email().optional().or(z.literal("")),
              phone: z.string().optional(),
            }),
          )
          .min(1)
          .max(500),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(clerkAccess);
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = await bcrypt.hash(data.defaultPassword, 12);
    const inserted: string[] = [];
    const failed: { enrollment_no: string; reason: string }[] = [];
    for (const r of data.rows) {
      const { error } = await supabaseAdmin.from("students").insert({
        enrollment_no: r.enrollment_no.toUpperCase(),
        name: r.name,
        father_name: r.father_name || null,
        branch: r.branch,
        semester: r.semester,
        batch_year: r.batch_year,
        email: r.email || null,
        phone: r.phone || null,
        password_hash: hash,
        is_active: true,
      });
      if (error) failed.push({ enrollment_no: r.enrollment_no, reason: error.message });
      else inserted.push(r.enrollment_no);
    }
    return { inserted: inserted.length, failed };
  });

export const clerkPromoteStudents = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ branch: z.string(), fromSemester: z.number().int().min(1).max(7) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(clerkAccess);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("students")
      .update({ semester: data.fromSemester + 1 })
      .eq("branch", data.branch)
      .eq("semester", data.fromSemester)
      .eq("is_active", true)
      .select("id");
    if (error) throw new Error(error.message);
    return { promoted: rows?.length ?? 0 };
  });
