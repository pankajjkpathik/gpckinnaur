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
    await requireRole(hodRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const update = data.decision === "approved"
      ? { approved_by_hod: true, locked: true, returned_remarks: null }
      : { submitted_to_hod: false, approved_by_hod: false, returned_remarks: data.remarks ?? "Please revise." };
    const { error } = await supabaseAdmin
      .from("marks")
      .update({ ...update, updated_at: new Date().toISOString() })
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
