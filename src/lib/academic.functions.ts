import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminRoles, facultyRoles, requireRole, requireStaff } from "./roles";

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

export const upsertSubject = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int().optional(),
        code: z.string().min(1).max(20),
        name: z.string().min(2).max(150),
        branch: z.string().min(1).max(50),
        semester: z.number().int().min(1).max(8),
        kind: z.enum(["theory", "practical"]).default("theory"),
        credits: z.number().int().min(0).max(20).default(0),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { code: data.code, name: data.name, branch: data.branch, semester: data.semester, kind: data.kind, credits: data.credits };
    const { error } = data.id
      ? await supabaseAdmin.from("subjects").update(payload).eq("id", data.id)
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
