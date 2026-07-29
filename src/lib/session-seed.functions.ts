import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminRoles } from "./roles";
import { requireRole } from "./roles.server";

const SEED_BRANCHES = ["civil", "mechanical"] as const;
const SEED_SEMESTERS = [1, 2, 3, 4, 5, 6] as const;

function prevSessionYear(target: string): string | null {
  const m = /^(\d{4})-(\d{2})$/.exec(target);
  if (!m) return null;
  const y = Number(m[1]) - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

/**
 * Seed a new academic session by cloning the previous session's syllabus
 * units and timetable slots for Civil and Mechanical Engineering (Sem 1-6),
 * and ensure an academic_calendar row exists for the target session.
 *
 * Idempotent: rows already present in the target session are skipped.
 */
export const initializeSession = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        targetYear: z.string().regex(/^\d{4}-\d{2}$/),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        semesterLabel: z.string().default("Odd 2026"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const source = prevSessionYear(data.targetYear);
    const report: {
      target: string;
      source: string | null;
      syllabus_units_copied: number;
      timetable_slots_copied: number;
      calendar_created: boolean;
      per_branch: Record<string, { units: number; slots: number }>;
    } = {
      target: data.targetYear,
      source,
      syllabus_units_copied: 0,
      timetable_slots_copied: 0,
      calendar_created: false,
      per_branch: {},
    };

    // Fetch all subjects for the seed branches once (subjects are session-agnostic).
    const { data: subjects, error: sErr } = await supabaseAdmin
      .from("subjects")
      .select("id, branch, semester")
      .in("branch", SEED_BRANCHES as unknown as string[])
      .in("semester", SEED_SEMESTERS as unknown as number[]);
    if (sErr) throw sErr;
    const subjectIds = (subjects ?? []).map((s) => s.id);

    for (const branch of SEED_BRANCHES) {
      const per = { units: 0, slots: 0 };
      for (const semester of SEED_SEMESTERS) {
        const branchSubjectIds = (subjects ?? [])
          .filter((s) => s.branch === branch && s.semester === semester)
          .map((s) => s.id);

        // ---- Syllabus units ----
        if (source && branchSubjectIds.length) {
          const { data: srcUnits } = await supabaseAdmin
            .from("syllabus_units")
            .select("subject_id, unit_no, title, topics, lecture_hours, practical_hours, semester")
            .in("subject_id", branchSubjectIds)
            .eq("academic_year", source);

          const { data: existing } = await supabaseAdmin
            .from("syllabus_units")
            .select("subject_id, unit_no")
            .in("subject_id", branchSubjectIds)
            .eq("academic_year", data.targetYear);
          const key = (r: any) => `${r.subject_id}::${r.unit_no}`;
          const existSet = new Set((existing ?? []).map(key));

          const toInsert = (srcUnits ?? [])
            .filter((r) => !existSet.has(key(r)))
            .map((r) => ({
              subject_id: r.subject_id,
              unit_no: r.unit_no,
              title: r.title,
              topics: r.topics,
              lecture_hours: r.lecture_hours,
              practical_hours: r.practical_hours,
              semester: r.semester ?? semester,
              academic_year: data.targetYear,
            }));
          if (toInsert.length) {
            const { error } = await supabaseAdmin.from("syllabus_units").insert(toInsert);
            if (error) throw error;
            per.units += toInsert.length;
            report.syllabus_units_copied += toInsert.length;
          }
        }

        // ---- Timetable slots (unpublished clone) ----
        if (source) {
          const { data: srcSlots } = await supabaseAdmin
            .from("timetable")
            .select(
              "day_of_week, period_no, subject_id, staff_id, room, group_label, span_periods, co_staff_ids, guest_faculty",
            )
            .eq("branch", branch)
            .eq("semester", semester)
            .eq("academic_year", source);

          const { data: existSlots } = await supabaseAdmin
            .from("timetable")
            .select("day_of_week, period_no, group_label")
            .eq("branch", branch)
            .eq("semester", semester)
            .eq("academic_year", data.targetYear);
          const sKey = (r: any) => `${r.day_of_week}::${r.period_no}::${r.group_label ?? ""}`;
          const existSlotSet = new Set((existSlots ?? []).map(sKey));

          const toInsertSlots = (srcSlots ?? [])
            .filter((r) => !existSlotSet.has(sKey(r)))
            .map((r) => ({
              branch,
              semester,
              academic_year: data.targetYear,
              day_of_week: r.day_of_week,
              period_no: r.period_no,
              subject_id: r.subject_id,
              staff_id: r.staff_id,
              room: r.room,
              group_label: r.group_label ?? "",
              span_periods: r.span_periods ?? 1,
              co_staff_ids: r.co_staff_ids ?? [],
              guest_faculty: r.guest_faculty,
              published: false,
            }));
          if (toInsertSlots.length) {
            const { error } = await supabaseAdmin.from("timetable").insert(toInsertSlots);
            if (error) throw error;
            per.slots += toInsertSlots.length;
            report.timetable_slots_copied += toInsertSlots.length;
          }
        }
      }
      report.per_branch[branch] = per;
    }

    // ---- Academic calendar row ----
    const { data: cal } = await supabaseAdmin
      .from("academic_calendar")
      .select("id")
      .eq("academic_year", data.targetYear)
      .limit(1);
    if (!cal || cal.length === 0) {
      const endDate =
        data.endDate ||
        (() => {
          const d = new Date(data.startDate);
          d.setMonth(d.getMonth() + 5);
          return d.toISOString().slice(0, 10);
        })();
      const { error } = await supabaseAdmin.from("academic_calendar").insert({
        academic_year: data.targetYear,
        semester_label: data.semesterLabel,
        sem_start: data.startDate,
        sem_end: endDate,
        exam_dates: [],
        holidays: [],
        events: [],
        published: false,
      });
      if (error) throw error;
      report.calendar_created = true;
    }

    // Silence unused warning
    void subjectIds;
    return report;
  });
