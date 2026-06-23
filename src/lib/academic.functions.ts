import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminRoles, facultyRoles } from "./roles";
import { requireRole, requireStaff } from "./roles.server";

const yearRe = /^\d{4}-\d{2}$/; // e.g. 2025-26

// ============ SUBJECTS ============

export const listSubjects = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ branch: z.string().optional(), semester: z.number().int().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await requireStaff();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("subjects").select("*").order("branch").order("semester").order("code");
    if (data.branch) q = q.eq("branch", data.branch);
    if (data.semester) q = q.eq("semester", data.semester);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const subjectCategoryEnum = z.enum(["BS","HS","ES","PCC","PE","OE","AU","Project"]);

export const upsertSubject = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int().optional(),
        code: z.string().min(1).max(20),
        name: z.string().min(2).max(150),
        branch: z.string().min(1).max(50),
        semester: z.number().int().min(1).max(6),
        kind: z.enum(["theory", "practical"]).default("theory"),
        credits: z.number().int().min(0).max(20).default(0),
        category: subjectCategoryEnum.optional().nullable(),
        lecture_hours: z.number().int().min(0).max(40).default(0),
        practical_hours: z.number().int().min(0).max(40).default(0),
        dcs_bs_hours: z.number().int().min(0).max(40).default(0),
        total_weekly_load: z.number().int().min(0).max(60).default(0),
        internal_theory_marks: z.number().int().min(0).max(500).default(0),
        internal_practical_marks: z.number().int().min(0).max(500).default(0),
        external_theory_marks: z.number().int().min(0).max(500).default(0),
        external_practical_marks: z.number().int().min(0).max(500).default(0),
        total_marks: z.number().int().min(0).max(2000).default(0),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...payload } = data;
    const { error } = id
      ? await supabaseAdmin.from("subjects").update(payload).eq("id", id)
      : await supabaseAdmin.from("subjects").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSubject = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("subjects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ PERIODS ============

export const listPeriods = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("periods_master").select("*").order("period_no");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const upsertPeriod = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int().optional(),
        period_no: z.number().int().min(1).max(12),
        start_time: z.string().regex(/^\d{2}:\d{2}$/),
        end_time: z.string().regex(/^\d{2}:\d{2}$/),
        is_break: z.boolean().default(false),
        label: z.string().max(30).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      period_no: data.period_no,
      start_time: data.start_time,
      end_time: data.end_time,
      is_break: data.is_break,
      label: data.label || null,
    };
    const { error } = data.id
      ? await supabaseAdmin.from("periods_master").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("periods_master").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePeriod = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("periods_master").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ GRADING SCHEME ============

export const listGrading = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("grading_scheme").select("*").order("min_pct", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const replaceGrading = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        rows: z
          .array(
            z.object({
              min_pct: z.number().min(0).max(100),
              max_pct: z.number().min(0).max(100),
              grade: z.string().min(1).max(5),
              grade_point: z.number().min(0).max(10),
              is_pass: z.boolean().default(true),
            }),
          )
          .min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("grading_scheme").delete().neq("id", -1);
    const { error } = await supabaseAdmin.from("grading_scheme").insert(data.rows);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ SYLLABUS UNITS ============

export const listSyllabus = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ subject_id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireStaff();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("syllabus_units")
      .select("*")
      .eq("subject_id", data.subject_id)
      .order("unit_no");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertSyllabusUnit = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int().optional(),
        subject_id: z.number().int(),
        unit_no: z.number().int().min(1).max(20),
        title: z.string().min(1).max(200),
        topics: z.array(z.string()).default([]),
        hours: z.number().int().min(0).default(0),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      subject_id: data.subject_id,
      unit_no: data.unit_no,
      title: data.title,
      topics: data.topics,
      hours: data.hours,
    };
    const { error } = data.id
      ? await supabaseAdmin.from("syllabus_units").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("syllabus_units").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSyllabusUnit = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("syllabus_units").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ ACADEMIC CALENDAR ============

export const listCalendars = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("academic_calendar").select("*").order("academic_year", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

const dateItem = z.object({ date: z.string(), label: z.string() });

export const upsertCalendar = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int().optional(),
        academic_year: z.string().regex(yearRe, "Use YYYY-YY format"),
        semester_label: z.string().min(1).max(20),
        sem_start: z.string(),
        sem_end: z.string(),
        exam_dates: z.array(dateItem).default([]),
        holidays: z.array(dateItem).default([]),
        events: z.array(dateItem).default([]),
        published: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      academic_year: data.academic_year,
      semester_label: data.semester_label,
      sem_start: data.sem_start,
      sem_end: data.sem_end,
      exam_dates: data.exam_dates,
      holidays: data.holidays,
      events: data.events,
      published: data.published,
    };
    const { error } = data.id
      ? await supabaseAdmin.from("academic_calendar").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("academic_calendar").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCalendar = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("academic_calendar").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ FACULTY ASSIGNMENTS ============

export const listAssignments = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ staff_id: z.number().int().optional(), academic_year: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    await requireStaff();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("faculty_assignments")
      .select("id, staff_id, subject_id, branch, semester, academic_year, staff_users(username,department), subjects(code,name)")
      .order("academic_year", { ascending: false });
    if (data.staff_id) q = q.eq("staff_id", data.staff_id);
    if (data.academic_year) q = q.eq("academic_year", data.academic_year);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertAssignment = createServerFn({ method: "POST" })
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
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("faculty_assignments").upsert(data, {
      onConflict: "staff_id,subject_id,branch,semester,academic_year",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAssignment = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("faculty_assignments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ TIMETABLE ============

export const listTimetable = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ branch: z.string(), semester: z.number().int(), academic_year: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireStaff();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("timetable")
      .select("*, subjects(code,name), staff_users(username)")
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .eq("academic_year", data.academic_year)
      .order("day_of_week")
      .order("period_no");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertTimetableSlot = createServerFn({ method: "POST" })
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
        academic_year: z.string().regex(yearRe),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Conflict check: same faculty in same day/period elsewhere
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
        throw new Error(`Faculty conflict: already teaching ${conflict[0].branch}-Sem${conflict[0].semester} at this slot.`);
      }
    }
    const { error } = await supabaseAdmin.from("timetable").upsert(
      { ...data, room: data.room || null },
      { onConflict: "branch,semester,day_of_week,period_no,academic_year" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const publishTimetable = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ branch: z.string(), semester: z.number().int(), academic_year: z.string(), published: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
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

export const facultyTimetable = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ staff_id: z.number().int(), academic_year: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireStaff();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("timetable")
      .select("*, subjects(code,name)")
      .eq("staff_id", data.staff_id)
      .eq("academic_year", data.academic_year)
      .order("day_of_week")
      .order("period_no");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ============ ROSTER (for clerk + admin) ============

export const listStaffByRole = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ role: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    await requireRole(facultyRoles.concat(adminRoles));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("staff_users").select("id, username, role, department").eq("is_active", true).order("username");
    if (data.role) q = q.eq("role", data.role);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ============ BULK IMPORT: SUBJECTS ============

const subjectRowSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(2).max(150),
  branch: z.string().min(1).max(50),
  semester: z.number().int().min(1).max(6),
  kind: z.enum(["theory", "practical"]).default("theory"),
  credits: z.number().int().min(0).max(20).default(0),
  category: z.enum(["BS","HS","ES","PCC","PE","OE","AU","Project"]).nullable().optional(),
  lecture_hours: z.number().int().min(0).default(0),
  practical_hours: z.number().int().min(0).default(0),
  dcs_bs_hours: z.number().int().min(0).default(0),
  total_weekly_load: z.number().int().min(0).default(0),
  internal_theory_marks: z.number().int().min(0).default(0),
  internal_practical_marks: z.number().int().min(0).default(0),
  external_theory_marks: z.number().int().min(0).default(0),
  external_practical_marks: z.number().int().min(0).default(0),
  total_marks: z.number().int().min(0).default(0),
});

export const bulkImportSubjects = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ rows: z.array(z.record(z.string(), z.any())).min(1).max(2000) }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const errors: { row: number; error: string }[] = [];
    const valid: any[] = [];
    data.rows.forEach((raw, i) => {
      try {
        const norm = {
          code: String(raw.code ?? raw.Code ?? "").trim(),
          name: String(raw.name ?? raw.Name ?? "").trim(),
          branch: String(raw.branch ?? raw.Branch ?? "").trim().toLowerCase(),
          semester: Number(raw.semester ?? raw.Semester ?? raw.sem ?? 0),
          kind: String(raw.kind ?? raw.Kind ?? "theory").trim().toLowerCase(),
          credits: Number(raw.credits ?? raw.Credits ?? 0),
        };
        valid.push(subjectRowSchema.parse(norm));
      } catch (e: any) {
        errors.push({ row: i + 2, error: e?.message ?? "Invalid row" });
      }
    });
    let inserted = 0;
    if (valid.length > 0) {
      const { error, count } = await supabaseAdmin
        .from("subjects")
        .upsert(valid, { onConflict: "code,branch,semester", count: "exact" });
      if (error) throw new Error(error.message);
      inserted = count ?? valid.length;
    }
    return { inserted, errors };
  });

// ============ BULK IMPORT: SYLLABUS ============
// Expected columns: subject_code, branch, semester, unit_no, title, hours, topics
// topics = newline-separated or "|" separated within the cell.

const syllabusRowSchema = z.object({
  subject_code: z.string().min(1),
  branch: z.string().min(1),
  semester: z.number().int().min(1).max(8),
  unit_no: z.number().int().min(1).max(20),
  title: z.string().min(1).max(200),
  hours: z.number().int().min(0).default(0),
  topics: z.array(z.string()).default([]),
});

export const bulkImportSyllabus = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ rows: z.array(z.record(z.string(), z.any())).min(1).max(5000) }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const errors: { row: number; error: string }[] = [];
    const parsed: z.infer<typeof syllabusRowSchema>[] = [];
    data.rows.forEach((raw, i) => {
      try {
        const topicsRaw = String(raw.topics ?? raw.Topics ?? "");
        const topics = topicsRaw
          .split(/\r?\n|\|/)
          .map((t) => t.trim())
          .filter(Boolean);
        parsed.push(
          syllabusRowSchema.parse({
            subject_code: String(raw.subject_code ?? raw.code ?? raw.Code ?? "").trim(),
            branch: String(raw.branch ?? raw.Branch ?? "").trim().toLowerCase(),
            semester: Number(raw.semester ?? raw.Semester ?? 0),
            unit_no: Number(raw.unit_no ?? raw.Unit ?? raw.unit ?? 0),
            title: String(raw.title ?? raw.Title ?? "").trim(),
            hours: Number(raw.hours ?? raw.Hours ?? 0),
            topics,
          }),
        );
      } catch (e: any) {
        errors.push({ row: i + 2, error: e?.message ?? "Invalid row" });
      }
    });

    // Resolve subject_code → subject_id
    const keys = Array.from(new Set(parsed.map((r) => `${r.subject_code}|${r.branch}|${r.semester}`)));
    const codes = Array.from(new Set(parsed.map((r) => r.subject_code)));
    const { data: subs, error: subErr } = await supabaseAdmin
      .from("subjects")
      .select("id, code, branch, semester")
      .in("code", codes);
    if (subErr) throw new Error(subErr.message);
    const map = new Map<string, number>();
    (subs ?? []).forEach((s: any) => map.set(`${s.code}|${s.branch}|${s.semester}`, s.id));

    const payload: any[] = [];
    parsed.forEach((r, i) => {
      const id = map.get(`${r.subject_code}|${r.branch}|${r.semester}`);
      if (!id) {
        errors.push({ row: i + 2, error: `Subject not found: ${r.subject_code} (${r.branch} sem ${r.semester})` });
        return;
      }
      payload.push({ subject_id: id, unit_no: r.unit_no, title: r.title, hours: r.hours, topics: r.topics });
    });

    let inserted = 0;
    if (payload.length > 0) {
      const { error, count } = await supabaseAdmin
        .from("syllabus_units")
        .upsert(payload, { onConflict: "subject_id,unit_no", count: "exact" });
      if (error) throw new Error(error.message);
      inserted = count ?? payload.length;
    }
    void keys;
    return { inserted, errors };
  });

