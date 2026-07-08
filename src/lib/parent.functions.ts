import { createServerFn } from "@tanstack/react-start";
import { getCookie, useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  getParentSessionSecretIssue,
  parentSessionConfig,
  type ParentSession,
} from "./sessions";

async function requireParent(): Promise<ParentSession> {
  if (!getCookie(parentSessionConfig.name)) throw new Error("Not authenticated");
  const s = await useSession<ParentSession>(parentSessionConfig);
  if (!s.data?.studentId) throw new Error("Not authenticated");
  return s.data as ParentSession;
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
// Parents sign in with their ward's enrollment number prefixed by "p-"
// (e.g. p-250824009024) and the standard password "Welcome@123".
const PARENT_STANDARD_PASSWORD = "Welcome@123";

export const parentLogin = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ enrollmentNo: z.string().min(1), password: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const issue = getParentSessionSecretIssue();
    if (issue) throw new Error(issue);
    const raw = data.enrollmentNo.trim();
    const stripped = raw.replace(/^[pP]\s*[-_ ]\s*/, "");
    if (stripped === raw) {
      throw new Error('Enrollment must be prefixed with "p-" (e.g. p-250824009024).');
    }
    if (data.password !== PARENT_STANDARD_PASSWORD) throw new Error("Invalid credentials");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id, enrollment_no, name, branch, semester, is_active")
      .eq("enrollment_no", stripped.toUpperCase())
      .maybeSingle();
    if (!student || !student.is_active) throw new Error("Invalid credentials");
    const session = await useSession<ParentSession>(parentSessionConfig);
    await session.update({
      studentId: student.id,
      enrollmentNo: student.enrollment_no,
      studentName: student.name,
      branch: student.branch,
      semester: student.semester,
    });
    return { success: true };
  });


export const parentLogout = createServerFn({ method: "POST" }).handler(async () => {
  const s = await useSession<ParentSession>(parentSessionConfig);
  await s.clear();
  return { success: true };
});

export const parentMe = createServerFn({ method: "GET" }).handler(async () => {
  if (getParentSessionSecretIssue()) return null;
  if (!getCookie(parentSessionConfig.name)) return null;
  const s = await useSession<ParentSession>(parentSessionConfig);
  if (!s.data?.studentId) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: st } = await supabaseAdmin
    .from("students")
    .select(
      "id, enrollment_no, name, father_name, guardian_name, branch, semester, batch_year, phone, email, image_url, parent_phone, address",
    )
    .eq("id", s.data.studentId)
    .maybeSingle();
  return { ...s.data, student: st ?? null };
});

// ─── STUDENT-SIDE: set / reset parent password ───────────────────────────────
export const studentSetParentPassword = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ newPassword: z.string().min(6).max(60) }).parse(d))
  .handler(async ({ data }) => {
    const { studentSessionConfig } = await import("./sessions");
    if (!getCookie(studentSessionConfig.name)) throw new Error("Not authenticated");
    const s = await useSession(studentSessionConfig as any);
    const sd: any = s.data;
    if (!sd?.id) throw new Error("Not authenticated");
    const bcrypt = (await import("bcryptjs")).default;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = await bcrypt.hash(data.newPassword, 12);
    const { error } = await supabaseAdmin
      .from("parent_users")
      .upsert(
        { student_id: sd.id, password_hash: hash, is_active: true, updated_at: new Date().toISOString() },
        { onConflict: "student_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const studentParentStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { studentSessionConfig } = await import("./sessions");
  if (!getCookie(studentSessionConfig.name)) return { enabled: false };
  const s = await useSession(studentSessionConfig as any);
  const sd: any = s.data;
  if (!sd?.id) return { enabled: false };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: pu } = await supabaseAdmin
    .from("parent_users")
    .select("is_active, last_login, updated_at")
    .eq("student_id", sd.id)
    .maybeSingle();
  return {
    enabled: !!pu?.is_active,
    last_login: pu?.last_login ?? null,
    updated_at: pu?.updated_at ?? null,
    enrollment_no: sd.enrollmentNo,
  };
});

// ─── PARENT DATA ─────────────────────────────────────────────────────────────
export const parentAttendance = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireParent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("attendance")
    .select("date, period_no, status, subjects(code,name)")
    .eq("student_id", me.studentId)
    .order("date", { ascending: false })
    .limit(500);
  const map = new Map<string, { code: string; name: string; total: number; present: number }>();
  (data ?? []).forEach((r: any) => {
    const k = r.subjects?.code || "?";
    if (!map.has(k)) map.set(k, { code: k, name: r.subjects?.name || "", total: 0, present: 0 });
    const s = map.get(k)!;
    s.total += 1;
    if (r.status === "present" || r.status === "late") s.present += 1;
  });
  return {
    records: data ?? [],
    by_subject: Array.from(map.values()).map((s) => ({
      ...s,
      pct: s.total ? Math.round((s.present / s.total) * 1000) / 10 : 0,
    })),
  };
});

export const parentMarks = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireParent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("marks")
    .select("exam_type, obtained, max_marks, academic_year, approved_by_hod, subjects(code,name,credits)")
    .eq("student_id", me.studentId)
    .eq("approved_by_hod", true);
  return data ?? [];
});

export const parentBoardMarks = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireParent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("marks")
    .select("exam_type, obtained, max_marks, academic_year, approved_by_hod, subjects(code,name,credits)")
    .eq("student_id", me.studentId)
    .in("exam_type", ["final_sessional", "practical", "viva"])
    .eq("approved_by_hod", true);
  return data ?? [];
});

export const parentDisciplinary = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireParent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("disciplinary_actions")
    .select("*")
    .eq("student_id", me.studentId)
    .order("action_date", { ascending: false });
  return data ?? [];
});

export const parentFees = createServerFn({ method: "GET" }).handler(async () => {
  const me = await requireParent();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("fee_records")
    .select("*")
    .eq("student_id", me.studentId)
    .order("id", { ascending: false });
  return data ?? [];
});
