import { createServerFn } from "@tanstack/react-start";
import { getCookie, useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { facultyRoles } from "./roles";
import { requireRole, requireStaff } from "./roles.server";
import {
  staffSessionConfig,
  studentSessionConfig,
  parentSessionConfig,
  type StaffSession,
  type StudentSession,
  type ParentSession,
} from "./sessions";

const yearRe = /^\d{4}-\d{2}$/;

// Any authenticated portal user may read coverage.
async function requireAnyPortal(): Promise<{ scope?: { branch?: string; semester?: number } }> {
  if (getCookie(staffSessionConfig.name)) {
    const s = await useSession<StaffSession>(staffSessionConfig);
    if (s.data?.id) return {};
  }
  if (getCookie(studentSessionConfig.name)) {
    const s = await useSession<StudentSession>(studentSessionConfig);
    if (s.data?.id) return { scope: { branch: s.data.branch, semester: s.data.semester } };
  }
  if (getCookie(parentSessionConfig.name)) {
    const s = await useSession<ParentSession>(parentSessionConfig);
    if (s.data?.studentId) return { scope: { branch: s.data.branch, semester: s.data.semester } };
  }
  throw new Error("Not authenticated");
}

// ─── Faculty: list subjects the faculty teaches ──────────────────────────────
export const coverageMySubjects = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ academic_year: z.string().regex(yearRe) }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("faculty_assignments")
      .select("subject_id, branch, semester, subjects(id, code, name, lecture_hours, practical_hours)")
      .eq("staff_id", me.id)
      .eq("academic_year", data.academic_year);
    if (error) throw new Error(error.message);
    // dedupe by subject_id + branch + semester
    const seen = new Set<string>();
    const list = (rows ?? []).filter((r: any) => {
      const k = `${r.subject_id}|${r.branch}|${r.semester}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return !!r.subjects;
    });
    return list;
  });

// ─── Units for a subject ─────────────────────────────────────────────────────
export const coverageUnits = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      subject_id: z.number().int(),
      academic_year: z.string().regex(yearRe).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAnyPortal();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("syllabus_units")
      .select("id, unit_no, title, hours, academic_year")
      .eq("subject_id", data.subject_id)
      .order("unit_no");
    if (data.academic_year) q = q.eq("academic_year", data.academic_year);
    const { data: units, error } = await q;
    if (error) throw new Error(error.message);
    return units ?? [];
  });

// ─── Lecture log (delivered) for a subject ───────────────────────────────────
export const coverageLectures = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      subject_id: z.number().int(),
      branch: z.string(),
      semester: z.number().int(),
      academic_year: z.string().regex(yearRe),
      staff_id: z.number().int().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAnyPortal();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("lesson_plans")
      .select("id, staff_id, subject_id, unit_id, topic, actual_date, academic_year, staff_users:staff_id(username,name), syllabus_units:unit_id(unit_no, title, hours)")
      .eq("subject_id", data.subject_id)
      .eq("branch", data.branch)
      .eq("semester", data.semester)
      .eq("academic_year", data.academic_year)
      .not("actual_date", "is", null)
      .order("actual_date", { ascending: false });
    if (data.staff_id) q = q.eq("staff_id", data.staff_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ─── Faculty: add a delivered lecture entry ──────────────────────────────────
export const coverageAddLecture = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      subject_id: z.number().int(),
      branch: z.string().min(2),
      semester: z.number().int().min(1).max(8),
      academic_year: z.string().regex(yearRe),
      unit_id: z.number().int().optional().nullable(),
      topic: z.string().min(2).max(300),
      actual_date: z.string(), // YYYY-MM-DD
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("lesson_plans").insert({
      staff_id: me.id,
      subject_id: data.subject_id,
      branch: data.branch,
      semester: data.semester,
      academic_year: data.academic_year,
      unit_id: data.unit_id ?? null,
      topic: data.topic,
      actual_date: data.actual_date,
      status: "approved",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const coverageDeleteLecture = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireRole(facultyRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // faculty can only delete own; hod/principal/super can delete any
    const { data: row } = await supabaseAdmin
      .from("lesson_plans")
      .select("staff_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Not found");
    const held = [me.role, ...(me.extraRoles ?? [])];
    const canAny = held.some((r) => ["super_admin", "principal", "hod"].includes(r as string));
    if (!canAny && row.staff_id !== me.id) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("lesson_plans").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Summary across subjects (used by HOD, Principal, Student portals) ───────
export const coverageSummary = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      academic_year: z.string().regex(yearRe),
      branch: z.string().optional().nullable(),
      semester: z.number().int().min(1).max(8).optional().nullable(),
      staff_id: z.number().int().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const auth = await requireAnyPortal();
    // Students/parents: force scope to their own branch/semester.
    const branch = auth.scope?.branch ?? data.branch ?? null;
    const semester = auth.scope?.semester ?? data.semester ?? null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Faculty scoping: when staff_id filter is set, restrict subject list to
    // the (subject, branch, semester) tuples that faculty is actually assigned.
    let scopedTuples: Set<string> | null = null;
    if (data.staff_id) {
      const { data: fa } = await supabaseAdmin
        .from("faculty_assignments")
        .select("subject_id, branch, semester")
        .eq("staff_id", data.staff_id)
        .eq("academic_year", data.academic_year);
      scopedTuples = new Set((fa ?? []).map((r: any) => `${r.subject_id}|${r.branch}|${r.semester}`));
      if (scopedTuples.size === 0) return [];
    }

    // 1. subjects in scope
    let subjQ = supabaseAdmin
      .from("subjects")
      .select("id, code, name, branch, semester, lecture_hours, practical_hours")
      .order("branch")
      .order("semester")
      .order("code");
    if (branch) subjQ = subjQ.eq("branch", branch);
    if (semester) subjQ = subjQ.eq("semester", semester);
    const { data: subjectsRaw, error: sErr } = await subjQ;
    if (sErr) throw new Error(sErr.message);

    // If staff filter set, keep only subjects the faculty teaches in matching branch/sem
    const subjects = scopedTuples
      ? (subjectsRaw ?? []).filter((s: any) => scopedTuples!.has(`${s.id}|${s.branch}|${s.semester}`))
      : (subjectsRaw ?? []);
    const subjIds = subjects.map((s: any) => s.id);
    if (subjIds.length === 0) return [];

    // 2. total planned hours per subject (scoped to the requested academic year)
    const { data: units } = await supabaseAdmin
      .from("syllabus_units")
      .select("subject_id, hours")
      .eq("academic_year", data.academic_year)
      .in("subject_id", subjIds);
    const plannedBySubj = new Map<number, number>();
    (units ?? []).forEach((u: any) => {
      plannedBySubj.set(u.subject_id, (plannedBySubj.get(u.subject_id) ?? 0) + (u.hours || 0));
    });

    // 3. delivered lectures per subject (+staff)
    let lecQ = supabaseAdmin
      .from("lesson_plans")
      .select("subject_id, staff_id, branch, semester, actual_date, staff_users:staff_id(username,name)")
      .in("subject_id", subjIds)
      .eq("academic_year", data.academic_year)
      .not("actual_date", "is", null);
    if (branch) lecQ = lecQ.eq("branch", branch);
    if (semester) lecQ = lecQ.eq("semester", semester);
    if (data.staff_id) lecQ = lecQ.eq("staff_id", data.staff_id);
    const { data: lectures } = await lecQ;

    const deliveredBySubj = new Map<number, number>();
    const lastBySubj = new Map<number, string>();
    const facultyBySubj = new Map<number, { id: number; label: string }>();
    (lectures ?? []).forEach((l: any) => {
      deliveredBySubj.set(l.subject_id, (deliveredBySubj.get(l.subject_id) ?? 0) + 1);
      const prev = lastBySubj.get(l.subject_id);
      if (!prev || (l.actual_date && l.actual_date > prev)) lastBySubj.set(l.subject_id, l.actual_date);
      if (!facultyBySubj.has(l.subject_id) && l.staff_users) {
        facultyBySubj.set(l.subject_id, {
          id: l.staff_id,
          label: l.staff_users?.name || l.staff_users?.username || "—",
        });
      }
    });

    return subjects.map((s: any) => {
      const planned = plannedBySubj.get(s.id) ?? (s.lecture_hours || 0) + (s.practical_hours || 0);
      const delivered = deliveredBySubj.get(s.id) ?? 0;
      const pct = planned > 0 ? Math.min(100, Math.round((delivered / planned) * 100)) : 0;
      return {
        subject_id: s.id,
        code: s.code,
        name: s.name,
        branch: s.branch,
        semester: s.semester,
        planned_hours: planned,
        delivered_hours: delivered,
        percent: pct,
        last_date: lastBySubj.get(s.id) ?? null,
        faculty: facultyBySubj.get(s.id) ?? null,
      };
    });
  });

// ─── Faculty roster (for HOD/Principal filter dropdown) ──────────────────────
export const coverageFacultyOptions = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ branch: z.string().optional().nullable() }).parse(d))
  .handler(async ({ data }) => {
    await requireStaff();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { branchToDept } = await import("./branch");
    let q = supabaseAdmin
      .from("staff_users")
      .select("id, username, name, department, role")
      .in("role", ["faculty", "hod", "principal", "super_admin"])
      .order("name");
    if (data.branch) {
      const dept = branchToDept(data.branch);
      q = q.in("department", [dept, data.branch]);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

