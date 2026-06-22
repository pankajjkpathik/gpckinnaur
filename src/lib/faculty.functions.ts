import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { facultyRoles, hodRoles, requireRole, requireStaff } from "./roles";

const yearRe = /^\d{4}-\d{2}$/;

// ============ DASHBOARD ============

export const facultyDashboard = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ academic_year: z.string().regex(yearRe) }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = new Date();
    const dow = today.getDay() === 0 ? 7 : today.getDay(); // 1=Mon..7=Sun
    const { data: classes } = await supabaseAdmin
      .from("timetable")
      .select("*, subjects(code,name)")
      .eq("staff_id", me.id)
      .eq("academic_year", data.academic_year)
      .eq("day_of_week", dow)
      .order("period_no");
    const { data: assignments } = await supabaseAdmin
      .from("faculty_assignments")
      .select("id, branch, semester, subject_id, subjects(code,name)")
      .eq("staff_id", me.id)
      .eq("academic_year", data.academic_year);
    const { data: leaveBalance } = await supabaseAdmin
      .from("leave_applications")
      .select("id, leave_type, from_date, to_date, status")
      .eq("applicant_type", "staff")
      .eq("applicant_id", me.id)
      .order("applied_at", { ascending: false })
      .limit(5);
    const { data: pendingLessons } = await supabaseAdmin
      .from("lesson_plans")
      .select("id, topic, status")
      .eq("staff_id", me.id)
      .eq("academic_year", data.academic_year)
      .in("status", ["draft", "returned"]);
    return {
      today_classes: classes ?? [],
      assignments: assignments ?? [],
      recent_leaves: leaveBalance ?? [],
      pending_lessons: pendingLessons ?? [],
      day_of_week: dow,
    };
  });

// ============ ROSTER (students in a class) ============

export const classRoster = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ branch: z.string(), semester: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("students")
      .select("id, enrollment_no, name")
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .eq("is_active", true)
      .order("enrollment_no");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ============ ATTENDANCE ============

export const getAttendance = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        branch: z.string(),
        semester: z.number().int(),
        subject_id: z.number().int(),
        date: z.string(),
        period_no: z.number().int(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: students } = await supabaseAdmin
      .from("students")
      .select("id, enrollment_no, name")
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .eq("is_active", true)
      .order("enrollment_no");
    const { data: marks } = await supabaseAdmin
      .from("attendance")
      .select("student_id, status, locked")
      .eq("subject_id", data.subject_id)
      .eq("date", data.date)
      .eq("period_no", data.period_no);
    const map = new Map<number, { status: string; locked: boolean }>();
    (marks ?? []).forEach((m: any) => map.set(m.student_id, { status: m.status, locked: m.locked }));
    return (students ?? []).map((s: any) => ({
      ...s,
      status: map.get(s.id)?.status ?? "present",
      locked: map.get(s.id)?.locked ?? false,
    }));
  });

export const submitAttendance = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        subject_id: z.number().int(),
        date: z.string(),
        period_no: z.number().int(),
        entries: z.array(
          z.object({
            student_id: z.number().int(),
            status: z.enum(["present", "absent", "leave", "late"]),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = new Date().toISOString().slice(0, 10);
    const locked = data.date !== today; // lock if not today
    const rows = data.entries.map((e) => ({
      student_id: e.student_id,
      subject_id: data.subject_id,
      date: data.date,
      period_no: data.period_no,
      status: e.status,
      marked_by: me.id,
      locked,
    }));
    const { error } = await supabaseAdmin
      .from("attendance")
      .upsert(rows, { onConflict: "student_id,subject_id,date,period_no" });
    if (error) throw new Error(error.message);
    return { ok: true, count: rows.length };
  });

// ============ MARKS ============

export const getMarks = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        branch: z.string(),
        semester: z.number().int(),
        subject_id: z.number().int(),
        exam_type: z.enum(["internal", "assignment", "mid_sessional", "final_sessional", "practical", "viva"]),
        academic_year: z.string().regex(yearRe),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: students } = await supabaseAdmin
      .from("students")
      .select("id, enrollment_no, name")
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .eq("is_active", true)
      .order("enrollment_no");
    const { data: rows } = await supabaseAdmin
      .from("marks")
      .select("*")
      .eq("subject_id", data.subject_id)
      .eq("exam_type", data.exam_type)
      .eq("academic_year", data.academic_year);
    const map = new Map<number, any>();
    (rows ?? []).forEach((r: any) => map.set(r.student_id, r));
    const submitted = (rows ?? []).some((r: any) => r.submitted_to_hod || r.locked);
    return {
      submitted,
      rows: (students ?? []).map((s: any) => ({
        ...s,
        obtained: map.get(s.id)?.obtained ?? null,
        max_marks: map.get(s.id)?.max_marks ?? null,
        remarks: map.get(s.id)?.remarks ?? null,
        locked: map.get(s.id)?.locked ?? false,
      })),
    };
  });

export const saveMarks = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        subject_id: z.number().int(),
        exam_type: z.enum(["internal", "assignment", "mid_sessional", "final_sessional", "practical", "viva"]),
        academic_year: z.string().regex(yearRe),
        max_marks: z.number().min(1).max(1000),
        submit_to_hod: z.boolean().default(false),
        entries: z.array(
          z.object({
            student_id: z.number().int(),
            obtained: z.number().nullable(),
            remarks: z.string().nullable().optional(),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = data.entries.map((e) => ({
      student_id: e.student_id,
      subject_id: data.subject_id,
      exam_type: data.exam_type,
      max_marks: data.max_marks,
      obtained: e.obtained,
      remarks: e.remarks ?? null,
      entered_by: me.id,
      submitted_to_hod: data.submit_to_hod,
      academic_year: data.academic_year,
    }));
    const { error } = await supabaseAdmin
      .from("marks")
      .upsert(rows, { onConflict: "student_id,subject_id,exam_type,academic_year" });
    if (error) throw new Error(error.message);
    return { ok: true, count: rows.length, submitted: data.submit_to_hod };
  });

// ============ LESSON PLANS ============

export const listLessonPlans = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        academic_year: z.string().regex(yearRe),
        staff_id: z.number().int().optional(),
        subject_id: z.number().int().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("lesson_plans")
      .select("*, subjects(code,name), staff_users(username), syllabus_units(unit_no,title)")
      .eq("academic_year", data.academic_year)
      .order("planned_date", { ascending: false });
    if (data.staff_id) q = q.eq("staff_id", data.staff_id);
    else if (me.role === "faculty") q = q.eq("staff_id", me.id);
    if (data.subject_id) q = q.eq("subject_id", data.subject_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertLessonPlan = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int().optional(),
        subject_id: z.number().int(),
        branch: z.string(),
        semester: z.number().int(),
        unit_id: z.number().int().nullable().optional(),
        topic: z.string().min(2).max(300),
        planned_date: z.string().nullable().optional(),
        actual_date: z.string().nullable().optional(),
        status: z.enum(["draft", "submitted"]).default("draft"),
        academic_year: z.string().regex(yearRe),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      staff_id: me.id,
      subject_id: data.subject_id,
      branch: data.branch,
      semester: data.semester,
      unit_id: data.unit_id ?? null,
      topic: data.topic,
      planned_date: data.planned_date || null,
      actual_date: data.actual_date || null,
      status: data.status,
      academic_year: data.academic_year,
      updated_at: new Date().toISOString(),
    };
    const { error } = data.id
      ? await supabaseAdmin.from("lesson_plans").update(payload).eq("id", data.id).eq("staff_id", me.id)
      : await supabaseAdmin.from("lesson_plans").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLessonPlan = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("lesson_plans")
      .delete()
      .eq("id", data.id)
      .eq("staff_id", me.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// HOD-level approve/return
export const reviewLessonPlan = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int(),
        decision: z.enum(["approved", "returned"]),
        hod_remarks: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(hodRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("lesson_plans")
      .update({ status: data.decision, hod_remarks: data.hod_remarks ?? null, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ LEAVE ============

export const myLeaves = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireStaff();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("leave_applications")
    .select("*, approver:approver_id(username)")
    .eq("applicant_type", "staff")
    .eq("applicant_id", me.id)
    .order("applied_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const applyLeave = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        leave_type: z.string().min(2).max(20),
        from_date: z.string(),
        to_date: z.string(),
        reason: z.string().min(2),
        comp_off: z.boolean().default(false),
        substitute_staff_id: z.number().int().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireStaff();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("leave_applications").insert({
      applicant_type: "staff",
      applicant_id: me.id,
      leave_type: data.leave_type,
      from_date: data.from_date,
      to_date: data.to_date,
      reason: data.reason,
      comp_off: data.comp_off,
      substitute_staff_id: data.substitute_staff_id ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelLeave = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireStaff();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("leave_applications")
      .update({ status: "cancelled", decided_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("applicant_id", me.id)
      .eq("applicant_type", "staff")
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// HOD/Principal — pending leaves to review
export const pendingLeavesForReview = createServerFn({ method: "GET" }).handler(async () => {
  await requireRole(hodRoles);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("leave_applications")
    .select("*, staff:applicant_id(username, department)")
    .eq("applicant_type", "staff")
    .eq("status", "pending")
    .order("applied_at");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const reviewLeave = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int(),
        decision: z.enum(["approved", "rejected"]),
        remarks: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(hodRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("leave_applications")
      .update({
        status: data.decision,
        approver_id: me.id,
        approver_remarks: data.remarks ?? null,
        decided_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ REPORTS ============

export const attendanceReport = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        branch: z.string(),
        semester: z.number().int(),
        subject_id: z.number().int().optional(),
        from_date: z.string(),
        to_date: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: students } = await supabaseAdmin
      .from("students")
      .select("id, enrollment_no, name")
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .eq("is_active", true)
      .order("enrollment_no");
    let q = supabaseAdmin
      .from("attendance")
      .select("student_id, status")
      .gte("date", data.from_date)
      .lte("date", data.to_date);
    if (data.subject_id) q = q.eq("subject_id", data.subject_id);
    const { data: marks } = await q;
    const agg = new Map<number, { total: number; present: number }>();
    (students ?? []).forEach((s: any) => agg.set(s.id, { total: 0, present: 0 }));
    (marks ?? []).forEach((m: any) => {
      const a = agg.get(m.student_id);
      if (!a) return;
      a.total += 1;
      if (m.status === "present" || m.status === "late") a.present += 1;
    });
    return (students ?? []).map((s: any) => {
      const a = agg.get(s.id) ?? { total: 0, present: 0 };
      const pct = a.total ? Math.round((a.present / a.total) * 1000) / 10 : 0;
      return { ...s, total: a.total, present: a.present, pct };
    });
  });

export const marksReport = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        branch: z.string(),
        semester: z.number().int(),
        subject_id: z.number().int(),
        exam_type: z.enum(["internal", "assignment", "mid_sessional", "final_sessional", "practical", "viva"]),
        academic_year: z.string().regex(yearRe),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: students } = await supabaseAdmin
      .from("students")
      .select("id, enrollment_no, name")
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .eq("is_active", true)
      .order("enrollment_no");
    const { data: rows } = await supabaseAdmin
      .from("marks")
      .select("student_id, obtained, max_marks, remarks")
      .eq("subject_id", data.subject_id)
      .eq("exam_type", data.exam_type)
      .eq("academic_year", data.academic_year);
    const map = new Map<number, any>();
    (rows ?? []).forEach((r: any) => map.set(r.student_id, r));
    return (students ?? []).map((s: any) => ({
      ...s,
      obtained: map.get(s.id)?.obtained ?? null,
      max_marks: map.get(s.id)?.max_marks ?? null,
      remarks: map.get(s.id)?.remarks ?? null,
    }));
  });
