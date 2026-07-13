import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hodRoles } from "./roles";
import { requireRole } from "./roles.server";

const yearRe = /^\d{4}-\d{2}$/;

// ============ HOD DASHBOARD ============
export const hodDashboard = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ academic_year: z.string().regex(yearRe) }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(hodRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [lessons, marks, leaves] = await Promise.all([
      supabaseAdmin.from("lesson_plans").select("id", { count: "exact", head: true }).eq("status", "submitted").eq("academic_year", data.academic_year),
      supabaseAdmin.from("marks").select("id", { count: "exact", head: true }).eq("submitted_to_hod", true).eq("approved_by_hod", false).eq("academic_year", data.academic_year),
      supabaseAdmin.from("leave_applications").select("id", { count: "exact", head: true }).eq("applicant_type", "staff").eq("status", "pending"),
    ]);
    return {
      pending_lessons: lessons.count ?? 0,
      pending_marks: marks.count ?? 0,
      pending_leaves: leaves.count ?? 0,
    };
  });

// ============ LESSON PLANS — pending review ============
export const hodPendingLessonPlans = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ academic_year: z.string().regex(yearRe) }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(hodRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("lesson_plans")
      .select("*, subjects(code,name), staff_users(username,department), syllabus_units(unit_no,title)")
      .eq("status", "submitted")
      .eq("academic_year", data.academic_year)
      .order("updated_at");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ============ MARKS — pending approval ============
export const hodPendingMarks = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ academic_year: z.string().regex(yearRe) }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(hodRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Group by (subject_id, exam_type, entered_by)
    const { data: rows, error } = await supabaseAdmin
      .from("marks")
      .select("subject_id, exam_type, entered_by, academic_year, subjects(code,name,branch,semester), staff_users:entered_by(username)")
      .eq("submitted_to_hod", true)
      .eq("approved_by_hod", false)
      .eq("academic_year", data.academic_year);
    if (error) throw new Error(error.message);
    const groups = new Map<string, any>();
    (rows ?? []).forEach((r: any) => {
      const k = `${r.subject_id}|${r.exam_type}|${r.entered_by}`;
      if (!groups.has(k)) groups.set(k, { ...r, count: 0 });
      groups.get(k).count += 1;
    });
    return Array.from(groups.values());
  });

export const hodMarksDetail = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ subject_id: z.number().int(), exam_type: z.string(), academic_year: z.string().regex(yearRe) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(hodRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("marks")
      .select("id, student_id, obtained, max_marks, remarks, returned_remarks, students(enrollment_no,name)")
      .eq("subject_id", data.subject_id)
      .eq("exam_type", data.exam_type)
      .eq("academic_year", data.academic_year);
    if (error) throw new Error(error.message);
    return (rows ?? []).sort((a: any, b: any) => (a.students?.enrollment_no || "").localeCompare(b.students?.enrollment_no || ""));
  });

export const hodReviewMarks = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        subject_id: z.number().int(),
        exam_type: z.string(),
        academic_year: z.string().regex(yearRe),
        decision: z.enum(["approved", "returned"]),
        remarks: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(hodRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const update = data.decision === "approved"
      ? { approved_by_hod: true, locked: true, returned_remarks: null, reviewed_by: me.id, reviewed_at: now }
      : { submitted_to_hod: false, approved_by_hod: false, returned_remarks: data.remarks ?? "Please revise.", reviewed_by: me.id, reviewed_at: now };
    const { error } = await supabaseAdmin
      .from("marks")
      .update({ ...update, updated_at: now })
      .eq("subject_id", data.subject_id)
      .eq("exam_type", data.exam_type)
      .eq("academic_year", data.academic_year);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ DEPT MONITORING ============
export const deptClassAttendance = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ branch: z.string(), semester: z.number().int(), from_date: z.string(), to_date: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(hodRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: students } = await supabaseAdmin
      .from("students")
      .select("id, enrollment_no, name")
      .eq("branch", data.branch).eq("semester", data.semester).eq("is_active", true).order("enrollment_no");
    const ids = (students ?? []).map((s: any) => s.id);
    if (ids.length === 0) return [];
    const { data: marks } = await supabaseAdmin
      .from("attendance")
      .select("student_id, status")
      .in("student_id", ids)
      .gte("date", data.from_date).lte("date", data.to_date);
    const agg = new Map<number, { t: number; p: number }>();
    ids.forEach((id) => agg.set(id, { t: 0, p: 0 }));
    (marks ?? []).forEach((m: any) => {
      const a = agg.get(m.student_id)!;
      a.t += 1;
      if (m.status === "present" || m.status === "late") a.p += 1;
    });
    return (students ?? []).map((s: any) => {
      const a = agg.get(s.id)!;
      return { ...s, total: a.t, present: a.p, pct: a.t ? Math.round((a.p / a.t) * 1000) / 10 : 0 };
    });
  });

// ============ HOD-SCOPED TIMETABLE EDITS (own branch only) ============
const yearReTT = /^\d{4}-\d{2}$/;

async function assertOwnBranch(branch: string) {
  const me = await requireRole(hodRoles);
  const { deptToBranch } = await import("./branch");
  const myBranch = deptToBranch(me.department);
  // super_admin / principal may edit any branch; HOD only their own.
  if (me.role === "hod" && myBranch !== branch.toLowerCase()) {
    throw new Error("You may only edit your own department's timetable.");
  }
  return me;
}

export const hodUpsertTimetableSlot = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        branch: z.string(),
        semester: z.number().int(),
        day_of_week: z.number().int().min(1).max(6),
        period_no: z.number().int().min(1).max(12),
        subject_id: z.number().int().nullable(),
        staff_id: z.number().int().nullable(),
        room: z.string().max(30).optional().nullable(),
        academic_year: z.string().regex(yearReTT),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await assertOwnBranch(data.branch);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.staff_id) {
      const { data: conflict } = await supabaseAdmin
        .from("timetable")
        .select("id, branch, semester")
        .eq("academic_year", data.academic_year)
        .eq("day_of_week", data.day_of_week)
        .eq("period_no", data.period_no)
        .eq("staff_id", data.staff_id)
        .neq("branch", data.branch)
        .limit(1);
      if (conflict && conflict.length > 0) {
        throw new Error(
          `Faculty conflict: already teaching ${conflict[0].branch}-Sem${conflict[0].semester} at this slot.`,
        );
      }
    }
    const { error } = await supabaseAdmin
      .from("timetable")
      .upsert(
        { ...data, room: data.room || null },
        { onConflict: "branch,semester,day_of_week,period_no,academic_year" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const hodPublishTimetable = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        branch: z.string(),
        semester: z.number().int(),
        academic_year: z.string().regex(yearReTT),
        published: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await assertOwnBranch(data.branch);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("timetable")
      .update({ published: data.published })
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .eq("academic_year", data.academic_year);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


// ============ MARKS GROUPS (pending or approved) — HOD visibility ============
export const hodMarksGroups = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        academic_year: z.string().regex(yearRe),
        status: z.enum(["pending", "approved", "returned"]).default("pending"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(hodRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("marks")
      .select(
        "subject_id, exam_type, entered_by, academic_year, approved_by_hod, submitted_to_hod, returned_remarks, reviewed_at, updated_at, subjects(code,name,branch,semester), staff_users:entered_by(username,name), reviewer:reviewed_by(username,name)",
      )
      .eq("academic_year", data.academic_year);
    if (data.status === "approved") q = q.eq("approved_by_hod", true);
    else if (data.status === "pending") q = q.eq("submitted_to_hod", true).eq("approved_by_hod", false);
    else if (data.status === "returned")
      q = q.eq("submitted_to_hod", false).not("returned_remarks", "is", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const groups = new Map<string, any>();
    (rows ?? []).forEach((r: any) => {
      const k = `${r.subject_id}|${r.exam_type}|${r.entered_by}`;
      if (!groups.has(k)) groups.set(k, { ...r, count: 0 });
      groups.get(k).count += 1;
    });
    return Array.from(groups.values());
  });

// ============ HOD-SCOPED FACULTY ASSIGNMENTS (subject allotment) ============
async function assertHodBranch(branch: string) {
  const me = await requireRole(hodRoles);
  const { deptToBranch } = await import("./branch");
  const myBranch = deptToBranch(me.department);
  if (me.role === "hod" && myBranch !== branch.toLowerCase()) {
    throw new Error("You may only manage allotments in your own department.");
  }
  return me;
}

export const hodListAssignments = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ academic_year: z.string().regex(yearRe), branch: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    await assertHodBranch(data.branch);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("faculty_assignments")
      .select(
        "id, staff_id, subject_id, branch, semester, academic_year, staff_users(username,name,department,role), subjects(code,name,branch,semester)",
      )
      .eq("branch", data.branch)
      .eq("academic_year", data.academic_year)
      .order("semester");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const hodUpsertAssignment = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        staff_id: z.number().int(),
        subject_id: z.number().int(),
        branch: z.string().min(1),
        semester: z.number().int().min(1).max(8),
        academic_year: z.string().regex(yearRe),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await assertHodBranch(data.branch);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Ensure the subject belongs to this branch/sem.
    const { data: subj } = await supabaseAdmin
      .from("subjects")
      .select("id, branch, semester")
      .eq("id", data.subject_id)
      .maybeSingle();
    if (!subj) throw new Error("Subject not found.");
    if (subj.branch !== data.branch || subj.semester !== data.semester) {
      throw new Error("Subject does not match the selected branch/semester.");
    }
    const { error } = await supabaseAdmin.from("faculty_assignments").upsert(data, {
      onConflict: "staff_id,subject_id,branch,semester,academic_year",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const hodDeleteAssignment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireRole(hodRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("faculty_assignments")
      .select("id, branch")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Assignment not found.");
    if (me.role === "hod") {
      const { deptToBranch } = await import("./branch");
      if (deptToBranch(me.department) !== row.branch.toLowerCase()) {
        throw new Error("You may only remove allotments in your own department.");
      }
    }
    const { error } = await supabaseAdmin.from("faculty_assignments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
