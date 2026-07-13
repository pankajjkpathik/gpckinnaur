import { createServerFn } from "@tanstack/react-start";
import { getCookie, useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { adminRoles, facultyRoles, principalRoles } from "./roles";
import { requireRole, requireStaff } from "./roles.server";
import { studentSessionConfig, type StudentSession } from "./sessions";

async function requireStudent(): Promise<StudentSession> {
  if (!getCookie(studentSessionConfig.name)) throw new Error("Not authenticated");
  const s = await useSession<StudentSession>(studentSessionConfig);
  if (!s.data?.id) throw new Error("Not authenticated");
  return s.data as StudentSession;
}

const httpUrl = z
  .string()
  .url()
  .refine((v) => /^https?:\/\//i.test(v), { message: "File URL must be http(s)" });

const ASSIGNMENT_BUCKET = "assignments";
// Signed URLs live in `file_url` as `.../object/sign/assignments/<path>?token=...`
// so we can recover the storage path from the URL and clean up on delete.
function extractAssignmentPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/assignments\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
// 10 years — signed URLs are effectively permanent for portal downloads.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;


// =====================================================================
// ASSIGNMENTS  (faculty create / list / delete; students list their class)
// =====================================================================

export const facultyListAssignmentsCreated = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ academic_year: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("assignments")
      .select("*, subjects(code,name)")
      .order("created_at", { ascending: false });
    // Faculty see their own; principal/hod/super_admin see all.
    if (me.role === "faculty") q = q.eq("created_by", me.id);
    if (data.academic_year) q = q.eq("academic_year", data.academic_year);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createAssignment = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int().optional(),
        title: z.string().min(1).max(300),
        description: z.string().optional().nullable(),
        branch: z.string().min(1).max(50),
        semester: z.number().int().min(1).max(12),
        subject_id: z.number().int().optional().nullable(),
        subject_name: z.string().max(150).optional().nullable(),
        due_date: z.string().optional().nullable(),
        file_url: httpUrl.optional().nullable().or(z.literal("").transform(() => null)),
        academic_year: z.string().max(10).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;

    // Faculty can only create/edit assignments for classes they actually teach.
    // HOD / Principal / Super-Admin bypass.
    const held = [me.role, ...(me.extraRoles ?? [])];
    const isPrivileged = held.some((r) => ["super_admin", "principal", "hod"].includes(r as string));
    if (!isPrivileged && data.subject_id) {
      const { data: fa } = await supabaseAdmin
        .from("faculty_assignments")
        .select("id")
        .eq("staff_id", me.id)
        .eq("subject_id", data.subject_id)
        .eq("branch", data.branch)
        .eq("semester", data.semester)
        .limit(1);
      if (!fa || fa.length === 0) {
        throw new Error("Forbidden: you are not assigned to teach this subject/class.");
      }
    }
    // On edit, faculty may only edit their own assignments.
    if (!isPrivileged && id) {
      const { data: row } = await supabaseAdmin
        .from("assignments")
        .select("created_by")
        .eq("id", id)
        .maybeSingle();
      if (!row || row.created_by !== me.id) throw new Error("Forbidden");
    }

    const payload = {
      ...rest,
      description: data.description || null,
      subject_id: data.subject_id || null,
      subject_name: data.subject_name || null,
      due_date: data.due_date || null,
      file_url: data.file_url || null,
      academic_year: data.academic_year || null,
    };
    const { error } = id
      ? await supabaseAdmin.from("assignments").update(payload).eq("id", id)
      : await supabaseAdmin.from("assignments").insert({ ...payload, created_by: me.id });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAssignment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const held = [me.role, ...(me.extraRoles ?? [])];
    const isPrivileged = held.some((r) => ["super_admin", "principal", "hod"].includes(r as string));
    if (!isPrivileged) {
      const { data: row } = await supabaseAdmin
        .from("assignments")
        .select("created_by")
        .eq("id", data.id)
        .maybeSingle();
      if (!row || row.created_by !== me.id) throw new Error("Forbidden");
    }
    const { error } = await supabaseAdmin.from("assignments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Students: assignments for their branch + semester.
export const studentListAssignments = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireStudent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("assignments")
    .select("*, subjects(code,name)")
    .eq("branch", me.branch)
    .eq("semester", me.semester)
    .order("due_date", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

// =====================================================================
// SUBMISSIONS  (student submit / list own; faculty list received / grade)
// =====================================================================

export const studentSubmitAssignment = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        assignment_id: z.number().int(),
        file_url: httpUrl,
        comments: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireStudent();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Upsert: re-submitting replaces the prior file (status resets to submitted).
    const { error } = await supabaseAdmin
      .from("assignment_submissions")
      .upsert(
        {
          assignment_id: data.assignment_id,
          student_id: me.id,
          file_url: data.file_url,
          comments: data.comments || null,
          status: "submitted",
          submitted_at: new Date().toISOString(),
          grade: null,
          feedback: null,
          graded_at: null,
          graded_by: null,
        },
        { onConflict: "assignment_id,student_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const studentMySubmissions = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireStudent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("assignment_submissions")
    .select("*, assignments(title, subject_name, due_date)")
    .eq("student_id", me.id)
    .order("submitted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

// Faculty: all submissions for assignments they created (or all, for principal/hod).
export const facultyReceivedSubmissions = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ assignment_id: z.number().int().optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Resolve which assignment ids this user may view.
    let assignmentIds: number[] | null = null;
    if (me.role === "faculty") {
      const { data: mine } = await supabaseAdmin
        .from("assignments")
        .select("id")
        .eq("created_by", me.id);
      assignmentIds = (mine ?? []).map((a: any) => a.id);
      if (assignmentIds.length === 0) return [];
    }

    let q = supabaseAdmin
      .from("assignment_submissions")
      .select("*, students(name, enrollment_no), assignments(title, subject_name)")
      .order("submitted_at", { ascending: false });
    if (data.assignment_id) q = q.eq("assignment_id", data.assignment_id);
    if (assignmentIds) q = q.in("assignment_id", assignmentIds);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const facultyGradeSubmission = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int(),
        grade: z.string().max(20),
        feedback: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Faculty may only grade submissions for assignments they created.
    // HOD / Principal / Super-Admin bypass.
    const held = [me.role, ...(me.extraRoles ?? [])];
    const isPrivileged = held.some((r) => ["super_admin", "principal", "hod"].includes(r as string));
    if (!isPrivileged) {
      const { data: sub } = await supabaseAdmin
        .from("assignment_submissions")
        .select("assignment_id, assignments(created_by)")
        .eq("id", data.id)
        .maybeSingle();
      const createdBy = (sub as any)?.assignments?.created_by;
      if (!sub || createdBy !== me.id) {
        throw new Error("Forbidden: you did not create this assignment.");
      }
    }

    const { error } = await supabaseAdmin
      .from("assignment_submissions")
      .update({
        grade: data.grade,
        feedback: data.feedback || null,
        status: "graded",
        graded_at: new Date().toISOString(),
        graded_by: me.id,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =====================================================================
// FEE RECORDS  (admin manage; student view own)
// =====================================================================

export const adminListFees = createServerFn({ method: "GET" }).handler(async () => {
  await requireRole(adminRoles);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("fee_records")
    .select("*, students(name, enrollment_no, branch, semester)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const upsertFeeRecord = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int().optional(),
        student_id: z.number().int(),
        academic_year: z.string().max(10).optional().nullable(),
        semester: z.number().int().optional().nullable(),
        components: z.array(z.object({ label: z.string(), amount: z.number() })).default([]),
        paid_amount: z.number().min(0).default(0),
        due_date: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const total = data.components.reduce((s, c) => s + Number(c.amount || 0), 0);
    const status = data.paid_amount >= total && total > 0 ? "paid" : data.paid_amount > 0 ? "partial" : "due";
    const payload = {
      student_id: data.student_id,
      academic_year: data.academic_year || null,
      semester: data.semester ?? null,
      components: data.components,
      total_amount: total,
      paid_amount: data.paid_amount,
      status,
      due_date: data.due_date || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = data.id
      ? await supabaseAdmin.from("fee_records").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("fee_records").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFeeRecord = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("fee_records").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Student: own fee records.
export const studentMyFees = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireStudent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("fee_records")
    .select("*")
    .eq("student_id", me.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

// Principal: lightweight student lookup for issuing disciplinary actions.
export const principalListStudents = createServerFn({ method: "GET" }).handler(async () => {
  await requireRole(principalRoles);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, enrollment_no, name, branch, semester")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

// =====================================================================
// DISCIPLINARY ACTIONS  (PRINCIPAL only manages; student views own)
// =====================================================================

export const listDisciplinaryActions = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ student_id: z.number().int().optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    await requireRole(principalRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("disciplinary_actions")
      .select("*, students(name, enrollment_no)")
      .order("action_date", { ascending: false });
    if (data.student_id) q = q.eq("student_id", data.student_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createDisciplinaryAction = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        student_id: z.number().int(),
        title: z.string().min(1).max(300),
        detail: z.string().optional().nullable(),
        action_date: z.string().optional().nullable(),
        resolution_date: z.string().optional().nullable(),
        severity: z.enum(["notice", "warning", "suspension"]).default("notice"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(principalRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("disciplinary_actions").insert({
      student_id: data.student_id,
      title: data.title,
      detail: data.detail || null,
      action_date: data.action_date || new Date().toISOString().slice(0, 10),
      resolution_date: data.resolution_date || null,
      severity: data.severity,
      issued_by: me.id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDisciplinaryAction = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(principalRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("disciplinary_actions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Student: own disciplinary record.
export const studentMyDisciplinary = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireStudent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("disciplinary_actions")
    .select("*")
    .eq("student_id", me.id)
    .order("action_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});
