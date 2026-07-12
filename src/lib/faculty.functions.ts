import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { facultyRoles, hodRoles } from "./roles";
import { requireRole, requireStaff } from "./roles.server";
import type { StaffSession } from "./sessions";

const yearRe = /^\d{4}-\d{2}$/;

// Ensure the caller is actually the teacher of (subject, branch, semester).
// Bypass for super_admin / principal / hod — they oversee everyone.
async function assertSubjectAccess(
  me: StaffSession,
  args: { subject_id: number; branch: string; semester: number; academic_year?: string },
) {
  const held = [me.role, ...(me.extraRoles ?? [])];
  if (held.some((r) => ["super_admin", "principal", "hod"].includes(r as string))) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let q = supabaseAdmin
    .from("faculty_assignments")
    .select("id")
    .eq("staff_id", me.id)
    .eq("subject_id", args.subject_id)
    .eq("branch", args.branch)
    .eq("semester", args.semester)
    .limit(1);
  if (args.academic_year) q = q.eq("academic_year", args.academic_year);
  const { data } = await q;
  if (!data || data.length === 0) {
    throw new Error("Forbidden: you are not assigned to teach this class/subject.");
  }
}

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
        exam_type: z.enum(["first_class_test", "second_class_test", "house_test", "internal", "assignment", "assignment_2", "class_test_1", "class_test_2", "mid_sessional", "final_sessional", "practical", "viva", "report_writing"]),
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
        exam_type: z.enum(["first_class_test", "second_class_test", "house_test", "internal", "assignment", "assignment_2", "class_test_1", "class_test_2", "mid_sessional", "final_sessional", "practical", "viva", "report_writing"]),
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
        exam_type: z.enum(["first_class_test", "second_class_test", "house_test", "internal", "assignment", "assignment_2", "class_test_1", "class_test_2", "mid_sessional", "final_sessional", "practical", "viva", "report_writing"]),
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

// ═══ OFFICIAL REPORT DATA (Individual Register, Consolidated, Sessional, Monthly, Final Attendance) ═══

async function loadRoster(branch: string, semester: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("students")
    .select("id, enrollment_no, name, father_name")
    .eq("branch", branch)
    .eq("semester", semester)
    .eq("is_active", true)
    .order("enrollment_no");
  return data ?? [];
}

// 1. Individual Subject Register — daily attendance grid
export const individualSubjectRegister = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      branch: z.string(),
      semester: z.number().int(),
      subject_id: z.number().int(),
      from_date: z.string(),
      to_date: z.string(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const students = await loadRoster(data.branch, data.semester);
    const { data: subj } = await supabaseAdmin.from("subjects").select("code, name").eq("id", data.subject_id).maybeSingle();
    const { data: rec } = await supabaseAdmin
      .from("attendance")
      .select("student_id, date, status")
      .eq("subject_id", data.subject_id)
      .gte("date", data.from_date)
      .lte("date", data.to_date);
    const dateSet = new Set<string>();
    (rec ?? []).forEach((r: any) => dateSet.add(r.date));
    const dates = Array.from(dateSet).sort();
    const map = new Map<string, string>();
    (rec ?? []).forEach((r: any) => map.set(`${r.student_id}|${r.date}`, r.status));
    return {
      subject: subj,
      dates,
      students: students.map((s: any) => {
        const marks = dates.map((d) => map.get(`${s.id}|${d}`) || "");
        const total = marks.filter((m) => m).length;
        const present = marks.filter((m) => m === "present" || m === "late").length;
        return {
          ...s,
          marks,
          total,
          present,
          pct: total ? Math.round((present / total) * 1000) / 10 : 0,
        };
      }),
    };
  });

// 2. Cumulative Consolidated Attendance Register — per subject % across the class
export const cumulativeConsolidatedRegister = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      branch: z.string(),
      semester: z.number().int(),
      from_date: z.string(),
      to_date: z.string(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const students = await loadRoster(data.branch, data.semester);
    const { data: subs } = await supabaseAdmin
      .from("subjects")
      .select("id, code, name")
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .order("code");
    const { data: rec } = await supabaseAdmin
      .from("attendance")
      .select("student_id, subject_id, status")
      .gte("date", data.from_date)
      .lte("date", data.to_date)
      .in("subject_id", (subs ?? []).map((s: any) => s.id));
    const agg = new Map<string, { total: number; present: number }>();
    (rec ?? []).forEach((r: any) => {
      const k = `${r.student_id}|${r.subject_id}`;
      if (!agg.has(k)) agg.set(k, { total: 0, present: 0 });
      const a = agg.get(k)!;
      a.total += 1;
      if (r.status === "present" || r.status === "late") a.present += 1;
    });
    return {
      subjects: subs ?? [],
      students: students.map((s: any) => ({
        ...s,
        per_subject: (subs ?? []).map((sub: any) => {
          const a = agg.get(`${s.id}|${sub.id}`) || { total: 0, present: 0 };
          return {
            subject_id: sub.id,
            code: sub.code,
            total: a.total,
            present: a.present,
            pct: a.total ? Math.round((a.present / a.total) * 1000) / 10 : 0,
          };
        }),
      })),
    };
  });

// 3. Subject Sessional Report (S-1) — Theory + Practical breakdown per HP TSB rules
//   Theory weightage: House Test 40% + avg(CT-1, CT-2) 20% + avg(Assignment-1, Assignment-2) 20% + Attendance 20%
//   Practical weightage: Performance 60% + Report Writing 20% + Viva 20%
export const subjectSessionalReport = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      branch: z.string(),
      semester: z.number().int(),
      subject_id: z.number().int(),
      academic_year: z.string().regex(yearRe),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const students = await loadRoster(data.branch, data.semester);
    const { data: subj } = await supabaseAdmin.from("subjects").select("code, name, credits, kind").eq("id", data.subject_id).maybeSingle();
    const { data: rows } = await supabaseAdmin
      .from("marks")
      .select("student_id, exam_type, obtained, max_marks")
      .eq("subject_id", data.subject_id)
      .eq("academic_year", data.academic_year);
    const map = new Map<string, { obtained: number | null; max_marks: number | null }>();
    (rows ?? []).forEach((r: any) => map.set(`${r.student_id}|${r.exam_type}`, r));

    // Attendance % per student for this subject
    const { data: att } = await supabaseAdmin
      .from("attendance")
      .select("student_id, status")
      .eq("subject_id", data.subject_id);
    const attAgg = new Map<number, { p: number; t: number }>();
    (att ?? []).forEach((r: any) => {
      const cur = attAgg.get(r.student_id) || { p: 0, t: 0 };
      cur.t += 1;
      if (r.status === "present" || r.status === "P") cur.p += 1;
      attAgg.set(r.student_id, cur);
    });

    // Weightage maxes (out of total 100 per section)
    const MAX = {
      test: 20,        // avg CT1/CT2 mapped to 20
      assignment: 20,  // avg A1/A2 mapped to 20
      house_test: 40,
      attendance: 20,
      performance: 60,
      report: 20,
      viva: 20,
    };

    const scale = (m: any, cap: number) => {
      if (!m || m.obtained == null) return null;
      const denom = Number(m.max_marks) || cap;
      return Math.round(((Number(m.obtained) / denom) * cap) * 10) / 10;
    };
    const avg = (a: number | null, b: number | null) => {
      const vals = [a, b].filter((x): x is number => x != null);
      if (vals.length === 0) return null;
      return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
    };

    return {
      subject: subj,
      weightage: MAX,
      students: students.map((s: any) => {
        const ct1 = map.get(`${s.id}|first_class_test`) ?? null;
        const ct2 = map.get(`${s.id}|second_class_test`) ?? null;
        const ht = map.get(`${s.id}|house_test`) ?? null;
        const a1 = map.get(`${s.id}|assignment`) ?? null;
        const a2 = map.get(`${s.id}|assignment_2`) ?? null;
        const perf = map.get(`${s.id}|practical`) ?? null;
        const rep = map.get(`${s.id}|report_writing`) ?? null;
        const viv = map.get(`${s.id}|viva`) ?? null;

        const testScore = avg(scale(ct1, MAX.test), scale(ct2, MAX.test));
        const asgScore = avg(scale(a1, MAX.assignment), scale(a2, MAX.assignment));
        const htScore = scale(ht, MAX.house_test);
        const agg = attAgg.get(s.id) || { p: 0, t: 0 };
        const attPct = agg.t > 0 ? (agg.p / agg.t) * 100 : null;
        const attScore = attPct != null ? Math.round((attPct * MAX.attendance / 100) * 10) / 10 : null;
        const totalA = [testScore, asgScore, htScore, attScore]
          .filter((v): v is number => v != null)
          .reduce((s, v) => s + v, 0);

        const perfScore = scale(perf, MAX.performance);
        const repScore = scale(rep, MAX.report);
        const vivScore = scale(viv, MAX.viva);
        const totalB = [perfScore, repScore, vivScore]
          .filter((v): v is number => v != null)
          .reduce((s, v) => s + v, 0);

        return {
          ...s,
          ct1, ct2, ht, a1, a2,
          perf, rep, viv,
          test_score: testScore, assignment_score: asgScore, house_test_score: htScore,
          attendance_pct: attPct != null ? Math.round(attPct * 10) / 10 : null,
          attendance_score: attScore,
          theory_total: Math.round(totalA * 10) / 10,
          performance_score: perfScore, report_score: repScore, viva_score: vivScore,
          practical_total: Math.round(totalB * 10) / 10,
          grand_total: Math.round((totalA + totalB) * 10) / 10,
        };
      }),
    };
  });


// 4. End-Semester Sessional Report (S-2) — all subjects consolidated
export const endSemSessionalReport = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      branch: z.string(),
      semester: z.number().int(),
      academic_year: z.string().regex(yearRe),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const students = await loadRoster(data.branch, data.semester);
    const { data: subs } = await supabaseAdmin
      .from("subjects")
      .select("id, code, name, credits")
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .order("code");
    const { data: rows } = await supabaseAdmin
      .from("marks")
      .select("student_id, subject_id, exam_type, obtained, max_marks")
      .eq("academic_year", data.academic_year)
      .in("subject_id", (subs ?? []).map((s: any) => s.id));
    // For each student × subject, sum all internal test marks
    const agg = new Map<string, { obtained: number; max: number }>();
    (rows ?? []).forEach((r: any) => {
      if (r.obtained == null) return;
      const k = `${r.student_id}|${r.subject_id}`;
      if (!agg.has(k)) agg.set(k, { obtained: 0, max: 0 });
      const a = agg.get(k)!;
      a.obtained += Number(r.obtained);
      a.max += Number(r.max_marks || 0);
    });
    return {
      subjects: subs ?? [],
      students: students.map((s: any) => ({
        ...s,
        per_subject: (subs ?? []).map((sub: any) => {
          const a = agg.get(`${s.id}|${sub.id}`) || { obtained: 0, max: 0 };
          return { subject_id: sub.id, code: sub.code, obtained: a.obtained, max: a.max };
        }),
      })),
    };
  });

// 5. Monthly Attendance Register — theory/practical/overall %
export const monthlyAttendanceRegister = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      branch: z.string(),
      semester: z.number().int(),
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const students = await loadRoster(data.branch, data.semester);
    const { data: subs } = await supabaseAdmin
      .from("subjects")
      .select("id, code, name, kind")
      .eq("branch", data.branch)
      .eq("semester", data.semester)
    const startD = new Date(data.year, data.month - 1, 1);
    const endD = new Date(data.year, data.month, 0);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const { data: rec } = await supabaseAdmin
      .from("attendance")
      .select("student_id, subject_id, status")
      .gte("date", fmt(startD))
      .lte("date", fmt(endD))
      .in("subject_id", (subs ?? []).map((s: any) => s.id));
    const type = new Map<number, string>();
    (subs ?? []).forEach((s: any) => type.set(s.id, s.kind));
    const per = new Map<number, { th_t: number; th_p: number; pr_t: number; pr_p: number }>();
    students.forEach((s: any) => per.set(s.id, { th_t: 0, th_p: 0, pr_t: 0, pr_p: 0 }));
    (rec ?? []).forEach((r: any) => {
      const st = per.get(r.student_id);
      if (!st) return;
      const isPractical = type.get(r.subject_id) === "practical";
      if (isPractical) {
        st.pr_t += 1;
        if (r.status === "present" || r.status === "late") st.pr_p += 1;
      } else {
        st.th_t += 1;
        if (r.status === "present" || r.status === "late") st.th_p += 1;
      }
    });
    return {
      month: data.month,
      year: data.year,
      students: students.map((s: any) => {
        const x = per.get(s.id)!;
        const tt = x.th_t + x.pr_t;
        const tp = x.th_p + x.pr_p;
        return {
          ...s,
          theory_present: x.th_p,
          theory_total: x.th_t,
          theory_pct: x.th_t ? Math.round((x.th_p / x.th_t) * 1000) / 10 : 0,
          practical_present: x.pr_p,
          practical_total: x.pr_t,
          practical_pct: x.pr_t ? Math.round((x.pr_p / x.pr_t) * 1000) / 10 : 0,
          overall_pct: tt ? Math.round((tp / tt) * 1000) / 10 : 0,
        };
      }),
    };
  });

// 6. Final Attendance Report (Board) — includes House Test weightage & fine (₹5/period)
export const finalAttendanceReport = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      branch: z.string(),
      semester: z.number().int(),
      from_date: z.string(),
      to_date: z.string(),
      academic_year: z.string().regex(yearRe),
      house_test_bonus_periods: z.number().int().default(0),
      sports_bonus_periods: z.number().int().default(0),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const students = await loadRoster(data.branch, data.semester);
    const { data: subs } = await supabaseAdmin
      .from("subjects")
      .select("id, code, name, kind")
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .order("code");
    const { data: rec } = await supabaseAdmin
      .from("attendance")
      .select("student_id, subject_id, status")
      .gte("date", data.from_date)
      .lte("date", data.to_date)
      .in("subject_id", (subs ?? []).map((s: any) => s.id));
    const agg = new Map<string, { t: number; p: number }>();
    (rec ?? []).forEach((r: any) => {
      const k = `${r.student_id}|${r.subject_id}`;
      if (!agg.has(k)) agg.set(k, { t: 0, p: 0 });
      const a = agg.get(k)!;
      a.t += 1;
      if (r.status === "present" || r.status === "late") a.p += 1;
    });
    const FINE_PER_PERIOD = 5;
    return {
      subjects: subs ?? [],
      house_test_bonus: data.house_test_bonus_periods,
      sports_bonus: data.sports_bonus_periods,
      fine_per_period: FINE_PER_PERIOD,
      students: students.map((s: any) => {
        let total = 0;
        let present = 0;
        const perSub = (subs ?? []).map((sub: any) => {
          const a = agg.get(`${s.id}|${sub.id}`) || { t: 0, p: 0 };
          total += a.t;
          present += a.p;
          return {
            subject_id: sub.id,
            code: sub.code,
            total: a.t,
            present: a.p,
            pct: a.t ? Math.round((a.p / a.t) * 1000) / 10 : 0,
          };
        });
        const adjustedPresent =
          present + data.house_test_bonus_periods + data.sports_bonus_periods;
        const absentPeriods = Math.max(0, total - present);
        const fine = absentPeriods * FINE_PER_PERIOD;
        return {
          ...s,
          per_subject: perSub,
          total_periods: total,
          present_periods: present,
          adjusted_present: adjustedPresent,
          absent_periods: absentPeriods,
          overall_pct: total ? Math.round((present / total) * 1000) / 10 : 0,
          adjusted_pct: total ? Math.round((adjustedPresent / total) * 1000) / 10 : 0,
          fine_rupees: fine,
        };
      }),
    };
  });
