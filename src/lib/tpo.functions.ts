import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hodRoles, tpoRoles } from "./roles";
import { requireRole } from "./roles.server";

const yearRe = /^\d{4}-\d{2}$/;

// =====================================================================
// PLACEMENTS  (TPO manage; HOD/principal read)
// =====================================================================

export const listPlacements = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ branch: z.string().optional(), year: z.number().int().optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    await requireRole(tpoRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("placements").select("*").order("year", { ascending: false }).order("company");
    if (data.branch) q = q.eq("branch", data.branch);
    if (data.year) q = q.eq("year", data.year);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertPlacement = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int().optional(),
        student_id: z.number().int().optional().nullable(),
        student_name: z.string().min(1).max(150),
        roll_number: z.string().max(40).optional().nullable(),
        branch: z.string().max(50).optional().nullable(),
        company: z.string().min(1).max(200),
        package_lpa: z.number().min(0).max(9999).optional().nullable(),
        year: z.number().int().min(2000).max(2100),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(tpoRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      student_id: data.student_id || null,
      roll_number: data.roll_number || null,
      branch: data.branch || null,
      package_lpa: data.package_lpa ?? null,
    };
    const { error } = id
      ? await supabaseAdmin.from("placements").update(payload).eq("id", id)
      : await supabaseAdmin.from("placements").insert({ ...payload, created_by: me.id });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePlacement = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(tpoRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("placements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =====================================================================
// INDUSTRIAL TRAINING  (TPO manage)
// =====================================================================

export const listIndustrialTraining = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ branch: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    await requireRole(tpoRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("industrial_training").select("*").order("created_at", { ascending: false });
    if (data.branch) q = q.eq("branch", data.branch);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createIndustrialTraining = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        training_type: z.string().min(1).max(100),
        branch: z.string().max(50).optional().nullable(),
        semester: z.number().int().optional().nullable(),
        student_ids: z.array(z.number().int()).default([]),
        student_names: z.array(z.string()).default([]),
        company: z.string().max(200).optional().nullable(),
        start_date: z.string().optional().nullable(),
        end_date: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(tpoRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("industrial_training").insert({
      training_type: data.training_type,
      branch: data.branch || null,
      semester: data.semester ?? null,
      student_ids: data.student_ids,
      student_names: data.student_names,
      company: data.company || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      created_by: me.id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteIndustrialTraining = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(tpoRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("industrial_training").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =====================================================================
// GUEST LECTURES  (TPO manage)
// =====================================================================

export const listGuestLectures = createServerFn({ method: "GET" }).handler(async () => {
  await requireRole(tpoRoles);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("guest_lectures")
    .select("*")
    .order("lecture_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const createGuestLecture = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        topic: z.string().min(1).max(300),
        speaker: z.string().min(1).max(200),
        lecture_date: z.string().optional().nullable(),
        department: z.string().max(100).optional().nullable(),
        detail: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(tpoRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("guest_lectures").insert({
      topic: data.topic,
      speaker: data.speaker,
      lecture_date: data.lecture_date || null,
      department: data.department || null,
      detail: data.detail || null,
      created_by: me.id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGuestLecture = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(tpoRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("guest_lectures").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// TPO: students for a class (for the Assign Training student picker).
export const tpoListStudents = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ branch: z.string().optional(), semester: z.number().int().optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    await requireRole(tpoRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("students")
      .select("id, enrollment_no, name, branch, semester")
      .eq("is_active", true)
      .order("name");
    if (data.branch) q = q.eq("branch", data.branch);
    if (data.semester) q = q.eq("semester", data.semester);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// =====================================================================
// HOD DEPARTMENT OVERVIEW  (analytics aggregation for the dashboard)
// =====================================================================

export const hodDepartmentOverview = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ branch: z.string(), academic_year: z.string().regex(yearRe) }).parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(hodRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const branch = data.branch;

    // ---- 1. Students of the department (for attendance + counts) ----
    const { data: students } = await supabaseAdmin
      .from("students")
      .select("id, semester")
      .eq("branch", branch)
      .eq("is_active", true);
    const studentIds = (students ?? []).map((s: any) => s.id);
    const semesters = Array.from(new Set((students ?? []).map((s: any) => s.semester))).sort();

    // ---- 2. Attendance % per ongoing semester ----
    const attendanceBySem: { label: string; value: number }[] = [];
    if (studentIds.length > 0) {
      const { data: att } = await supabaseAdmin
        .from("attendance")
        .select("student_id, status")
        .in("student_id", studentIds);
      const semOf = new Map<number, number>();
      (students ?? []).forEach((s: any) => semOf.set(s.id, s.semester));
      const agg = new Map<number, { t: number; p: number }>();
      (att ?? []).forEach((a: any) => {
        const sem = semOf.get(a.student_id);
        if (sem == null) return;
        if (!agg.has(sem)) agg.set(sem, { t: 0, p: 0 });
        const x = agg.get(sem)!;
        x.t += 1;
        if (a.status === "present" || a.status === "late") x.p += 1;
      });
      semesters.forEach((sem) => {
        const x = agg.get(sem);
        attendanceBySem.push({ label: `Sem ${sem}`, value: x && x.t ? Math.round((x.p / x.t) * 1000) / 10 : 0 });
      });
    }

    // ---- 3. Faculty of the department + workload (periods/week from timetable) ----
    const { departmentAliases } = await import("./branch");
    const { data: faculty } = await supabaseAdmin
      .from("staff_users")
      .select("id, username, name, department, role")
      .in("department", departmentAliases(branch))
      .in("role", ["faculty", "hod"]);
    const facultyIds = (faculty ?? []).map((f: any) => f.id);

    const { data: ttRows } = await supabaseAdmin
      .from("timetable")
      .select("staff_id")
      .eq("branch", branch)
      .eq("academic_year", data.academic_year);
    const loadByStaff = new Map<number, number>();
    (ttRows ?? []).forEach((r: any) => {
      if (r.staff_id == null) return;
      loadByStaff.set(r.staff_id, (loadByStaff.get(r.staff_id) ?? 0) + 1);
    });
    const facultyWorkload = (faculty ?? []).map((f: any) => ({
      label: f.name || f.username,
      value: loadByStaff.get(f.id) ?? 0,
    }));

    // ---- 4. Syllabus coverage (from lesson_plans approved vs total syllabus units) ----
    const { data: subjects } = await supabaseAdmin
      .from("subjects")
      .select("id, code, name")
      .eq("branch", branch);
    const subjectIds = (subjects ?? []).map((s: any) => s.id);
    const syllabusCoverage: { label: string; value: number }[] = [];
    if (subjectIds.length > 0) {
      const { data: units } = await supabaseAdmin
        .from("syllabus_units")
        .select("subject_id")
        .in("subject_id", subjectIds);
      const totalUnits = new Map<number, number>();
      (units ?? []).forEach((u: any) => totalUnits.set(u.subject_id, (totalUnits.get(u.subject_id) ?? 0) + 1));

      const { data: lessons } = await supabaseAdmin
        .from("lesson_plans")
        .select("subject_id, status")
        .in("subject_id", subjectIds)
        .eq("academic_year", data.academic_year)
        .eq("status", "approved");
      const doneUnits = new Map<number, number>();
      (lessons ?? []).forEach((l: any) => doneUnits.set(l.subject_id, (doneUnits.get(l.subject_id) ?? 0) + 1));

      (subjects ?? []).forEach((s: any) => {
        const total = totalUnits.get(s.id) ?? 0;
        const done = doneUnits.get(s.id) ?? 0;
        if (total > 0) {
          syllabusCoverage.push({ label: s.code, value: Math.round((done / total) * 100) });
        }
      });
    }

    // ---- 5. Class Test & House Test performance (avg % per subject) ----
    async function examAvgBySubject(examType: string) {
      if (subjectIds.length === 0) return [];
      const { data: marks } = await supabaseAdmin
        .from("marks")
        .select("subject_id, obtained, max_marks, subjects(code)")
        .in("subject_id", subjectIds)
        .eq("exam_type", examType)
        .eq("academic_year", data.academic_year)
        .eq("approved_by_hod", true);
      const agg = new Map<string, { sum: number; n: number }>();
      (marks ?? []).forEach((m: any) => {
        const code = m.subjects?.code ?? String(m.subject_id);
        const pct = Number(m.max_marks) ? (Number(m.obtained) / Number(m.max_marks)) * 100 : 0;
        if (!agg.has(code)) agg.set(code, { sum: 0, n: 0 });
        const x = agg.get(code)!;
        x.sum += pct;
        x.n += 1;
      });
      return Array.from(agg.entries()).map(([code, x]) => ({ label: code, value: Math.round(x.sum / x.n) }));
    }
    const classTest1 = await examAvgBySubject("first_class_test");
    const classTest2 = await examAvgBySubject("second_class_test");
    // Merge CT1 + CT2 by subject for a grouped-ish bar (we keep CT1 primarily, fall back to CT2)
    const classTestMap = new Map<string, number>();
    classTest1.forEach((d) => classTestMap.set(d.label, d.value));
    classTest2.forEach((d) => { if (!classTestMap.has(d.label)) classTestMap.set(d.label, d.value); });
    const classTestPerformance = Array.from(classTestMap.entries()).map(([label, value]) => ({ label, value }));
    const houseTestPerformance = await examAvgBySubject("house_test");

    // ---- 6. Industrial training count (students in training for this branch) ----
    const { data: training } = await supabaseAdmin
      .from("industrial_training")
      .select("student_ids")
      .eq("branch", branch);
    let trainingCount = 0;
    (training ?? []).forEach((t: any) => {
      if (Array.isArray(t.student_ids)) trainingCount += t.student_ids.length;
    });

    // ---- 7. Placements (by company, this branch) ----
    const { data: placements } = await supabaseAdmin
      .from("placements")
      .select("company, year")
      .eq("branch", branch);
    const placeAgg = new Map<string, number>();
    (placements ?? []).forEach((p: any) => placeAgg.set(p.company, (placeAgg.get(p.company) ?? 0) + 1));
    const placementsByCompany = Array.from(placeAgg.entries()).map(([label, value]) => ({ label, value }));

    return {
      branch,
      department: me.department,
      semesters,
      student_count: studentIds.length,
      faculty_count: (faculty ?? []).length,
      attendance_by_semester: attendanceBySem,
      faculty_workload: facultyWorkload,
      faculty_details: (faculty ?? []).map((f: any) => ({
        id: f.id, username: f.username, role: f.role, department: f.department,
        load: loadByStaff.get(f.id) ?? 0,
      })),
      syllabus_coverage: syllabusCoverage,
      class_test_performance: classTestPerformance,
      house_test_performance: houseTestPerformance,
      training_count: trainingCount,
      placement_count: (placements ?? []).length,
      placements_by_company: placementsByCompany,
    };
  });
