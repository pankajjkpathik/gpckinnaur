import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { facultyRoles } from "./roles";
import { requireRole, requireStaff } from "./roles.server";

const yearRe = /^\d{4}-\d{2}$/;
const WEEKS_PER_SEMESTER = 14;

// List subjects the current faculty teaches (used in generator dropdown).
export const myTeachingSubjects = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ academic_year: z.string().regex(yearRe) }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("faculty_assignments")
      .select(
        "id, branch, semester, subject_id, subjects(id, code, name, lecture_hours, practical_hours, kind)",
      )
      .eq("staff_id", me.id)
      .eq("academic_year", data.academic_year);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// Load the weekly plan for a subject (any staff can read; role-scoped elsewhere).
export const listWeeklyPlan = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        staff_id: z.number().int().optional(),
        subject_id: z.number().int(),
        academic_year: z.string().regex(yearRe),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireStaff();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const staffId = data.staff_id ?? me.id;
    const { data: rows, error } = await supabaseAdmin
      .from("weekly_lesson_plans")
      .select("*")
      .eq("staff_id", staffId)
      .eq("subject_id", data.subject_id)
      .eq("academic_year", data.academic_year)
      .order("week_no");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// Regenerate a 14-week plan from syllabus_units. Replaces existing rows.
export const generateWeeklyPlan = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        subject_id: z.number().int(),
        academic_year: z.string().regex(yearRe),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: subject, error: sErr } = await supabaseAdmin
      .from("subjects")
      .select("id, code, name, branch, semester, lecture_hours, practical_hours")
      .eq("id", data.subject_id)
      .single();
    if (sErr || !subject) throw new Error("Subject not found");

    const { data: units, error: uErr } = await supabaseAdmin
      .from("syllabus_units")
      .select("id, unit_no, title, hours, topics")
      .eq("subject_id", data.subject_id)
      .eq("academic_year", data.academic_year)
      .order("unit_no");
    if (uErr) throw new Error(uErr.message);
    if (!units || units.length === 0) {
      throw new Error(
        "No syllabus units defined for this subject/year. Add units in Admin → Syllabus Units first.",
      );
    }

    const perWeek = Math.max(1, (subject.lecture_hours ?? 0) + (subject.practical_hours ?? 0));
    const totalPeriods = perWeek * WEEKS_PER_SEMESTER;
    const totalHours = units.reduce((s, u) => s + (u.hours ?? 0), 0) || units.length;

    // Build a flat list of "period slots" tagged to units, then chunk into 14 weeks.
    const slotUnits: Array<{
      unit_id: number;
      unit_no: number;
      title: string;
      topicList: string[];
    }> = [];
    let assigned = 0;
    units.forEach((u, idx) => {
      const isLast = idx === units.length - 1;
      const share = isLast
        ? totalPeriods - assigned
        : Math.max(1, Math.round(((u.hours ?? 0) / totalHours) * totalPeriods));
      assigned += share;
      const topicsRaw = (u.topics as unknown) ?? [];
      const topicList = Array.isArray(topicsRaw)
        ? (topicsRaw as unknown[]).map((t) => String(t)).filter(Boolean)
        : String(topicsRaw)
            .split(/[,;\n]/)
            .map((s) => s.trim())
            .filter(Boolean);
      for (let i = 0; i < share; i++) {
        slotUnits.push({ unit_id: u.id, unit_no: u.unit_no, title: u.title, topicList });
      }
    });

    // Chunk slots into 14 weeks (perWeek per row).
    const rows: any[] = [];
    for (let w = 0; w < WEEKS_PER_SEMESTER; w++) {
      const slice = slotUnits.slice(w * perWeek, (w + 1) * perWeek);
      if (slice.length === 0) {
        rows.push({
          staff_id: me.id,
          subject_id: data.subject_id,
          academic_year: data.academic_year,
          branch: subject.branch,
          semester: subject.semester,
          week_no: w + 1,
          unit_id: null,
          unit_no: null,
          topics: "Revision / Buffer",
          periods: perWeek,
          learning_outcomes: "",
          teaching_method: "",
          notes: "",
        });
        continue;
      }
      // Determine dominant unit for the week (first slot).
      const primary = slice[0];
      const uniqueUnits = Array.from(new Set(slice.map((s) => s.unit_no)));
      // Pick topics proportionally from the primary unit; fall back to unit title.
      const topics =
        uniqueUnits.length === 1
          ? (() => {
              const idx = w -
                slotUnits.findIndex((s) => s.unit_no === primary.unit_no) / perWeek;
              // simple: rotate through the unit's topic list
              const tl = primary.topicList.length > 0 ? primary.topicList : [primary.title];
              const rel = Math.max(0, Math.floor(idx));
              const chunkSize = Math.max(1, Math.ceil(tl.length / Math.max(1, Math.ceil(slice.length / perWeek))));
              const start = (rel * chunkSize) % Math.max(1, tl.length);
              return tl.slice(start, start + chunkSize).join("; ") || primary.title;
            })()
          : slice
              .map((s) => `U${s.unit_no}: ${s.title}`)
              .filter((v, i, a) => a.indexOf(v) === i)
              .join(" | ");
      rows.push({
        staff_id: me.id,
        subject_id: data.subject_id,
        academic_year: data.academic_year,
        branch: subject.branch,
        semester: subject.semester,
        week_no: w + 1,
        unit_id: primary.unit_id,
        unit_no: primary.unit_no,
        topics: topics.slice(0, 500),
        periods: slice.length,
        learning_outcomes: "",
        teaching_method: primary.title,
        notes: uniqueUnits.length > 1 ? `Spans units: ${uniqueUnits.join(", ")}` : "",
      });
    }

    // Wipe existing rows for this (staff, subject, year) and insert fresh.
    await supabaseAdmin
      .from("weekly_lesson_plans")
      .delete()
      .eq("staff_id", me.id)
      .eq("subject_id", data.subject_id)
      .eq("academic_year", data.academic_year);

    const { error: iErr } = await supabaseAdmin.from("weekly_lesson_plans").insert(rows);
    if (iErr) throw new Error(iErr.message);

    return { ok: true, weeks: WEEKS_PER_SEMESTER, periods_per_week: perWeek };
  });

// Update a single weekly row (topics / outcomes / method / periods / notes).
export const updateWeeklyPlanRow = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int(),
        topics: z.string().max(2000).optional(),
        periods: z.number().int().min(0).max(40).optional(),
        learning_outcomes: z.string().max(2000).optional(),
        teaching_method: z.string().max(500).optional(),
        notes: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin
      .from("weekly_lesson_plans")
      .update(patch)
      .eq("id", id)
      .eq("staff_id", me.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Delete the entire generated plan for a subject.
export const deleteWeeklyPlan = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({ subject_id: z.number().int(), academic_year: z.string().regex(yearRe) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("weekly_lesson_plans")
      .delete()
      .eq("staff_id", me.id)
      .eq("subject_id", data.subject_id)
      .eq("academic_year", data.academic_year);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
