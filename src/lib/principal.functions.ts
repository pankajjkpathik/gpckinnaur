import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { principalRoles } from "./roles";
import { requireRole } from "./roles.server";

const yearRe = /^\d{4}-\d{2}$/;

// ============ PRINCIPAL DASHBOARD ============
export const principalDashboard = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ academic_year: z.string().regex(yearRe) }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(principalRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [students, staff, pendingLessons, pendingMarks, pendingLeaves, circulars] = await Promise.all([
      supabaseAdmin.from("students").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin.from("staff_users").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin
        .from("lesson_plans")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted")
        .eq("academic_year", data.academic_year),
      supabaseAdmin
        .from("marks")
        .select("id", { count: "exact", head: true })
        .eq("submitted_to_hod", true)
        .eq("approved_by_hod", false)
        .eq("academic_year", data.academic_year),
      supabaseAdmin.from("leave_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("circulars").select("id", { count: "exact", head: true }),
    ]);
    return {
      students: students.count ?? 0,
      staff: staff.count ?? 0,
      pending_lessons: pendingLessons.count ?? 0,
      pending_marks: pendingMarks.count ?? 0,
      pending_leaves: pendingLeaves.count ?? 0,
      circulars: circulars.count ?? 0,
    };
  });

// ============ INSTITUTE-WIDE ATTENDANCE BY DEPARTMENT ============
export const instituteAttendance = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ from_date: z.string(), to_date: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(principalRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: students } = await supabaseAdmin
      .from("students")
      .select("id, branch, semester")
      .eq("is_active", true);
    const ids = (students ?? []).map((s: any) => s.id);
    if (ids.length === 0) return [];
    const { data: marks } = await supabaseAdmin
      .from("attendance")
      .select("student_id, status")
      .in("student_id", ids)
      .gte("date", data.from_date)
      .lte("date", data.to_date);
    const sMap = new Map<number, { branch: string; semester: number }>();
    (students ?? []).forEach((s: any) => sMap.set(s.id, { branch: s.branch, semester: s.semester }));
    const agg = new Map<string, { branch: string; semester: number; t: number; p: number; students: Set<number> }>();
    (marks ?? []).forEach((m: any) => {
      const s = sMap.get(m.student_id);
      if (!s) return;
      const k = `${s.branch}|${s.semester}`;
      if (!agg.has(k)) agg.set(k, { branch: s.branch, semester: s.semester, t: 0, p: 0, students: new Set() });
      const a = agg.get(k)!;
      a.t += 1;
      a.students.add(m.student_id);
      if (m.status === "present" || m.status === "late") a.p += 1;
    });
    return Array.from(agg.values())
      .map((a) => ({
        branch: a.branch,
        semester: a.semester,
        total: a.t,
        present: a.p,
        pct: a.t ? Math.round((a.p / a.t) * 1000) / 10 : 0,
        students: a.students.size,
      }))
      .sort((a, b) => a.branch.localeCompare(b.branch) || a.semester - b.semester);
  });

// ============ SYLLABUS COMPLIANCE ============
export const syllabusCompliance = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ academic_year: z.string().regex(yearRe) }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(principalRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Total syllabus units per subject (denominator)
    const { data: subjects } = await supabaseAdmin
      .from("subjects")
      .select("id, code, name, branch, semester");
    const totalUnits = new Map<number, number>();
    const { data: allUnits } = await supabaseAdmin.from("syllabus_units").select("subject_id");
    (allUnits ?? []).forEach((u: any) =>
      totalUnits.set(u.subject_id, (totalUnits.get(u.subject_id) ?? 0) + 1),
    );
    // Lesson plans for this AY (numerator + coverage avg)
    const { data: plans } = await supabaseAdmin
      .from("lesson_plans")
      .select("subject_id, status, coverage_pct")
      .eq("academic_year", data.academic_year);
    const agg = new Map<number, { plans: number; approved: number; cov_sum: number }>();
    (plans ?? []).forEach((p: any) => {
      if (!agg.has(p.subject_id)) agg.set(p.subject_id, { plans: 0, approved: 0, cov_sum: 0 });
      const a = agg.get(p.subject_id)!;
      a.plans += 1;
      a.cov_sum += Number(p.coverage_pct || 0);
      if (p.status === "approved") a.approved += 1;
    });
    return (subjects ?? [])
      .map((s: any) => {
        const a = agg.get(s.id) ?? { plans: 0, approved: 0, cov_sum: 0 };
        const total = totalUnits.get(s.id) ?? 0;
        return {
          subject_id: s.id,
          code: s.code,
          name: s.name,
          branch: s.branch,
          semester: s.semester,
          units: total,
          avg_coverage: a.plans ? Math.round((a.cov_sum / a.plans) * 10) / 10 : 0,
          approved_pct: total ? Math.round((a.approved / total) * 100) : 0,
        };
      })
      .filter((r) => r.units > 0)
      .sort((x, y) => (x.branch || "").localeCompare(y.branch || "") || x.semester - y.semester);
  });


// ============ RESULTS OVERVIEW ============
export const instituteExamTypes = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ academic_year: z.string().regex(yearRe) }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(principalRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("marks")
      .select("exam_type")
      .eq("academic_year", data.academic_year)
      .eq("approved_by_hod", true);
    const set = new Set<string>();
    (rows ?? []).forEach((r: any) => { if (r.exam_type) set.add(r.exam_type); });
    return Array.from(set).sort();
  });

export const instituteResults = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ academic_year: z.string().regex(yearRe), exam_type: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(principalRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("marks")
      .select("obtained, max_marks, subjects(branch,semester)")
      .eq("academic_year", data.academic_year)
      .eq("approved_by_hod", true);
    if (data.exam_type && data.exam_type.trim() !== "") q = q.eq("exam_type", data.exam_type);
    const { data: rows } = await q;
    const agg = new Map<string, { branch: string; semester: number; total: number; pass: number; sum: number }>();
    (rows ?? []).forEach((r: any) => {
      const b = r.subjects?.branch,
        s = r.subjects?.semester;
      if (!b || !s) return;
      const k = `${b}|${s}`;
      if (!agg.has(k)) agg.set(k, { branch: b, semester: s, total: 0, pass: 0, sum: 0 });
      const a = agg.get(k)!;
      a.total += 1;
      const pct = (Number(r.obtained) / Number(r.max_marks)) * 100;
      a.sum += pct;
      if (pct >= 35) a.pass += 1;
    });
    return Array.from(agg.values())
      .map((a) => ({
        branch: a.branch,
        semester: a.semester,
        entries: a.total,
        pass_pct: a.total ? Math.round((a.pass / a.total) * 1000) / 10 : 0,
        avg_pct: a.total ? Math.round((a.sum / a.total) * 10) / 10 : 0,
      }))
      .sort((a, b) => a.branch.localeCompare(b.branch) || a.semester - b.semester);
  });

// ============ CIRCULARS ============
export const listCirculars = createServerFn({ method: "GET" }).handler(async () => {
  await requireRole(principalRoles);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("circulars")
    .select("*, staff_users:published_by(username)")
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const createCircular = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        title: z.string().min(2),
        body: z.string().min(2),
        audience: z.enum(["all", "staff", "students", "faculty", "hod"]).default("all"),
        attachment_url: z.string().url().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const session = await requireRole(principalRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("circulars").insert({
      title: data.title,
      body: data.body,
      audience: data.audience,
      attachment_url: data.attachment_url ?? null,
      published_by: session.id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCircular = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(principalRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("circulars").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =====================================================================
// READ-ONLY DEPARTMENT-WISE REPORTS for Principal
// Formats inspired by GP Kinnaur's existing Attendance.pdf / Sessional.pdf
// =====================================================================

/** Monthly attendance: one row per student × subject, for a given branch+semester+month. */
export const principalMonthlyAttendance = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        branch: z.string(),
        semester: z.number().int().min(1).max(8),
        from_date: z.string(),
        to_date: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(principalRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: students } = await supabaseAdmin
      .from("students")
      .select("id, enrollment_no, name")
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .eq("is_active", true)
      .order("enrollment_no");
    if (!students || students.length === 0) return { students: [], subjects: [], cells: {} };

    const { data: subjects } = await supabaseAdmin
      .from("subjects")
      .select("id, code, name, kind")
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .order("kind")
      .order("code");
    const subjectIds = (subjects ?? []).map((s: any) => s.id);

    const studentIds = students.map((s: any) => s.id);
    const { data: att } = await supabaseAdmin
      .from("attendance")
      .select("student_id, subject_id, status, date_of_class")
      .in("student_id", studentIds)
      .in("subject_id", subjectIds.length ? subjectIds : [-1])
      .gte("date_of_class", data.from_date)
      .lte("date_of_class", data.to_date);

    // cells[student_id][subject_id] = { present, total, pct }
    const cells: Record<number, Record<number, { present: number; total: number; pct: number }>> = {};
    students.forEach((s: any) => {
      cells[s.id] = {};
    });
    (att ?? []).forEach((a: any) => {
      const cell = cells[a.student_id];
      if (!cell) return;
      if (!cell[a.subject_id]) cell[a.subject_id] = { present: 0, total: 0, pct: 0 };
      cell[a.subject_id].total += 1;
      if (a.status === "present" || a.status === "late") cell[a.subject_id].present += 1;
    });
    Object.values(cells).forEach((row) => {
      Object.values(row).forEach((c) => {
        c.pct = c.total ? Math.round((c.present / c.total) * 1000) / 10 : 0;
      });
    });

    return { students: students ?? [], subjects: subjects ?? [], cells };
  });

/** Final sessional report — one row per student × subject with marks (theory + practical). */
export const principalFinalSessional = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        branch: z.string(),
        semester: z.number().int().min(1).max(8),
        academic_year: z.string().regex(yearRe),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(principalRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: students } = await supabaseAdmin
      .from("students")
      .select("id, enrollment_no, name")
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .eq("is_active", true)
      .order("enrollment_no");
    if (!students || students.length === 0) return { students: [], theory: [], practical: [], marks: {} };

    const { data: subjects } = await supabaseAdmin
      .from("subjects")
      .select("id, code, name, kind")
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .order("code");

    const studentIds = students.map((s: any) => s.id);
    const subjectIds = (subjects ?? []).map((s: any) => s.id);

    // Pull all approved marks and take the "final" view = sum/max per (student,subject)
    // Aggregating internal/assignment/CT/house_test/practical/viva as the Internal Assessment total.
    const { data: marks } = await supabaseAdmin
      .from("marks")
      .select("student_id, subject_id, exam_type, max_marks, obtained")
      .in("student_id", studentIds)
      .in("subject_id", subjectIds.length ? subjectIds : [-1])
      .eq("academic_year", data.academic_year)
      .eq("approved_by_hod", true);

    // marks_per[student_id][subject_id] = sum of obtained
    const marksMap: Record<number, Record<number, number>> = {};
    students.forEach((s: any) => {
      marksMap[s.id] = {};
    });
    (marks ?? []).forEach((m: any) => {
      const row = marksMap[m.student_id];
      if (!row) return;
      row[m.subject_id] = (row[m.subject_id] ?? 0) + Number(m.obtained ?? 0);
    });

    const theory = (subjects ?? []).filter((s: any) => s.kind === "theory");
    const practical = (subjects ?? []).filter((s: any) => s.kind === "practical");

    return { students: students ?? [], theory, practical, marks: marksMap };
  });
