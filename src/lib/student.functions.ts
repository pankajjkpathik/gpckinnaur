import { createServerFn } from "@tanstack/react-start";
import { getCookie, useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { studentSessionConfig, type StudentSession } from "./sessions";

async function requireStudent(): Promise<StudentSession> {
  if (!getCookie(studentSessionConfig.name)) throw new Error("Not authenticated");
  const s = await useSession<StudentSession>(studentSessionConfig);
  if (!s.data?.id) throw new Error("Not authenticated");
  return s.data as StudentSession;
}

const yearRe = /^\d{4}-\d{2}$/;

// ============ DASHBOARD ============
export const studentDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireStudent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = new Date().toISOString().slice(0, 10);
  const dow = new Date().getDay();
  const [att, todayPeriods, pendingLeaves] = await Promise.all([
    supabaseAdmin.from("attendance").select("status").eq("student_id", me.id),
    supabaseAdmin
      .from("timetable")
      .select("period_no, room, subjects(code,name), staff_users:staff_id(username)")
      .eq("branch", me.branch)
      .eq("semester", me.semester)
      .eq("day_of_week", dow)
      .eq("published", true)
      .order("period_no"),
    supabaseAdmin
      .from("leave_applications")
      .select("id", { count: "exact", head: true })
      .eq("applicant_id", me.id)
      .eq("applicant_type", "student")
      .eq("status", "pending"),
  ]);
  const all = att.data ?? [];
  const total = all.length;
  const present = all.filter((a: any) => a.status === "present" || a.status === "late").length;
  return {
    attendance_pct: total ? Math.round((present / total) * 1000) / 10 : 0,
    total_periods: total,
    present_periods: present,
    today_periods: todayPeriods.data ?? [],
    pending_leaves: pendingLeaves.count ?? 0,
    today_date: today,
  };
});

// ============ ATTENDANCE ============
export const studentAttendance = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireStudent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("attendance")
    .select("date, period_no, status, subjects(code,name)")
    .eq("student_id", me.id)
    .order("date", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  const subj = new Map<string, { code: string; name: string; total: number; present: number }>();
  (data ?? []).forEach((r: any) => {
    const k = r.subjects?.code || "?";
    if (!subj.has(k)) subj.set(k, { code: k, name: r.subjects?.name || "", total: 0, present: 0 });
    const s = subj.get(k)!;
    s.total += 1;
    if (r.status === "present" || r.status === "late") s.present += 1;
  });
  return {
    records: data ?? [],
    by_subject: Array.from(subj.values()).map((s) => ({
      ...s,
      pct: s.total ? Math.round((s.present / s.total) * 1000) / 10 : 0,
    })),
  };
});

// ============ MARKS / RESULTS ============
export const studentMarks = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ academic_year: z.string().regex(yearRe).optional() }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireStudent();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("marks")
      .select("exam_type, obtained, max_marks, academic_year, approved_by_hod, subjects(code,name,credits)")
      .eq("student_id", me.id)
      .eq("approved_by_hod", true);
    if (data.academic_year) q = q.eq("academic_year", data.academic_year);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ============ TIMETABLE ============
export const studentTimetable = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireStudent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [tt, periods] = await Promise.all([
    supabaseAdmin
      .from("timetable")
      .select("day_of_week, period_no, room, subjects(code,name), staff_users:staff_id(username)")
      .eq("branch", me.branch)
      .eq("semester", me.semester)
      .eq("published", true)
      .order("day_of_week")
      .order("period_no"),
    supabaseAdmin.from("periods_master").select("*").order("period_no"),
  ]);
  return { entries: tt.data ?? [], periods: periods.data ?? [] };
});

// ============ SYLLABUS ============
export const studentSyllabus = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireStudent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: subjects } = await supabaseAdmin
    .from("subjects")
    .select("id, code, name")
    .eq("branch", me.branch)
    .eq("semester", me.semester)
    .order("code");
  const ids = (subjects ?? []).map((s: any) => s.id);
  if (ids.length === 0) return [];
  const { data: units } = await supabaseAdmin
    .from("syllabus_units")
    .select("subject_id, unit_no, title, topics")
    .in("subject_id", ids)
    .order("unit_no");
  return (subjects ?? []).map((s: any) => ({
    ...s,
    units: (units ?? []).filter((u: any) => u.subject_id === s.id),
  }));
});

// ============ LEAVE ============
export const studentMyLeaves = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireStudent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("leave_applications")
    .select("*")
    .eq("applicant_id", me.id)
    .eq("applicant_type", "student")
    .order("applied_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const studentApplyLeave = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        leave_type: z.enum(["medical", "casual", "earned", "duty"]),
        from_date: z.string(),
        to_date: z.string(),
        reason: z.string().min(2),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireStudent();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("leave_applications").insert({
      applicant_id: me.id,
      applicant_type: "student",
      leave_type: data.leave_type,
      from_date: data.from_date,
      to_date: data.to_date,
      reason: data.reason,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const studentCancelLeave = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireStudent();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("leave_applications")
      .delete()
      .eq("id", data.id)
      .eq("applicant_id", me.id)
      .eq("applicant_type", "student")
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ ACADEMIC CALENDAR ============
export const studentCalendar = createServerFn({ method: "GET" }).handler(async () => {
  await requireStudent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("academic_calendar")
    .select("*")
    .gte("end_date", today)
    .order("start_date")
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ============ CIRCULARS ============
export const studentCirculars = createServerFn({ method: "GET" }).handler(async () => {
  await requireStudent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("circulars")
    .select("*")
    .in("audience", ["all", "students"])
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ============ GRADING SCHEME (for letter grades on marks) ============
export const studentGrading = createServerFn({ method: "GET" }).handler(async () => {
  await requireStudent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("grading_scheme").select("*").order("min_pct", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ============ MY FACULTY (teachers of my class) ============
export const studentFaculty = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireStudent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Distinct faculty teaching this branch+semester via published timetable.
  const { data, error } = await supabaseAdmin
    .from("timetable")
    .select("staff_id, subjects(code,name), staff_users:staff_id(username, department)")
    .eq("branch", me.branch)
    .eq("semester", me.semester)
    .eq("published", true);
  if (error) throw new Error(error.message);
  const map = new Map<number, any>();
  (data ?? []).forEach((r: any) => {
    if (!r.staff_id || !r.staff_users) return;
    if (!map.has(r.staff_id)) {
      map.set(r.staff_id, {
        id: r.staff_id,
        username: r.staff_users.username,
        department: r.staff_users.department ?? null,
        subjects: new Set<string>(),
      });
    }
    if (r.subjects?.code) map.get(r.staff_id).subjects.add(r.subjects.code);
  });
  return Array.from(map.values()).map((f) => ({ ...f, subjects: Array.from(f.subjects) }));
});

// ============ MY ASSIGNMENTS (lesson_plans flagged as assignments / materials) ============
// Returns assignment-type study materials targeted at the student's branch+semester.
export const studentAssignments = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireStudent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("study_materials")
    .select("*")
    .eq("type", "assignment")
    .or(`department.eq.${me.branch},department.eq.all`)
    .order("uploaded_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ============ DOCUMENTS (lesson plans / exam schedules / shared docs) ============
export const studentDocuments = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ type: z.enum(["assignment", "lesson_plan", "exam_schedule"]).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const me = await requireStudent();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("study_materials")
      .select("*")
      .or(`department.eq.${me.branch},department.eq.all`)
      .order("uploaded_at", { ascending: false });
    if (data.type) q = q.eq("type", data.type);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
