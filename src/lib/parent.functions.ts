import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestIP, useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  getParentSessionSecretIssue,
  parentSessionConfig,
  type ParentSession,
} from "./sessions";

// Best-effort audit writer. Never throws — we don't want log failures to
// block or leak information about login flow.
async function logParentAuth(
  action: "parent_login_success" | "parent_login_failure" | "parent_logout",
  opts: {
    studentId?: number | null;
    enrollmentInput?: string | null;
    reason?: string;
    resolvedEnrollment?: string | null;
  },
) {
  try {
    const ip = (() => {
      try { return getRequestIP({ xForwardedFor: true }) ?? null; } catch { return null; }
    })();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("audit_log").insert({
      actor_type: "parent",
      actor_id: opts.studentId ?? null,
      action,
      entity: "parent_users",
      entity_id: opts.studentId != null ? String(opts.studentId) : null,
      details: {
        enrollment_input: opts.enrollmentInput ?? null,
        resolved_enrollment: opts.resolvedEnrollment ?? null,
        reason: opts.reason ?? null,
      },
      ip,
    });
  } catch (e) {
    console.error("[audit] parent auth log failed", e);
  }
}


// Every parent-facing server fn MUST go through this guard. It:
//  1. requires a signed parent session cookie
//  2. re-verifies on every request that the parent_users row is still
//     active for the session's studentId (revocation / deactivation)
//  3. re-verifies the target student still exists and is active
//  4. returns ONLY the server-verified studentId — callers must never trust
//     a studentId that arrives from the client (query params, body, etc.).
async function requireParent(): Promise<ParentSession & { studentId: number }> {
  if (!getCookie(parentSessionConfig.name)) throw new Error("Not authenticated");
  const s = await useSession<ParentSession>(parentSessionConfig);
  const sd = s.data;
  if (!sd?.studentId) throw new Error("Not authenticated");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: pu }, { data: student }] = await Promise.all([
    supabaseAdmin
      .from("parent_users")
      .select("student_id, is_active")
      .eq("student_id", sd.studentId)
      .maybeSingle(),
    supabaseAdmin
      .from("students")
      .select("id, is_active, enrollment_no")
      .eq("id", sd.studentId)
      .maybeSingle(),
  ]);

  if (!pu?.is_active || !student?.is_active) {
    await s.clear();
    throw new Error("Parent access has been revoked. Please sign in again.");
  }
  // Defence-in-depth: if the session enrollment no ever drifts from the
  // database (e.g. student re-enrolled with a new number), refuse the request
  // rather than serving another student's data.
  if (sd.enrollmentNo && student.enrollment_no && sd.enrollmentNo !== student.enrollment_no) {
    await s.clear();
    throw new Error("Session mismatch. Please sign in again.");
  }

  return { ...(sd as ParentSession), studentId: student.id };
}

// Helper for parent-scoped queries: throws if the caller tries to pass a
// studentId that does not match the authenticated parent's ward.
function assertOwnStudent(me: { studentId: number }, requested?: number | null) {
  if (requested != null && Number(requested) !== me.studentId) {
    throw new Error("Forbidden: cannot access another student's data");
  }
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
// Parents sign in with their ward's enrollment number prefixed by "p-"
// (e.g. p-250824009024) and the password the student set for them via
// studentSetParentPassword. There is NO shared/universal password.

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
      await logParentAuth("parent_login_failure", {
        enrollmentInput: raw, reason: "missing_p_prefix",
      });
      throw new Error('Enrollment must be prefixed with "p-" (e.g. p-250824009024).');
    }
    const resolvedEnrollment = stripped.toUpperCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id, enrollment_no, name, branch, semester, is_active")
      .eq("enrollment_no", resolvedEnrollment)
      .maybeSingle();
    if (!student || !student.is_active) {
      await logParentAuth("parent_login_failure", {
        enrollmentInput: raw, resolvedEnrollment,
        reason: student ? "student_inactive" : "student_not_found",
      });
      throw new Error("Invalid credentials");
    }

    const { data: pu } = await supabaseAdmin
      .from("parent_users")
      .select("password_hash, is_active")
      .eq("student_id", student.id)
      .maybeSingle();
    if (!pu?.password_hash || !pu.is_active) {
      await logParentAuth("parent_login_failure", {
        studentId: student.id, enrollmentInput: raw, resolvedEnrollment,
        reason: !pu ? "parent_not_provisioned" : (!pu.password_hash ? "no_password_set" : "parent_inactive"),
      });
      throw new Error(
        "Parent access has not been set up yet. Ask your ward to set a parent password from their student portal.",
      );
    }
    const bcrypt = (await import("bcryptjs")).default;
    const ok = await bcrypt.compare(data.password, pu.password_hash);
    if (!ok) {
      await logParentAuth("parent_login_failure", {
        studentId: student.id, enrollmentInput: raw, resolvedEnrollment,
        reason: "bad_password",
      });
      throw new Error("Invalid credentials");
    }

    await supabaseAdmin
      .from("parent_users")
      .update({ last_login: new Date().toISOString() })
      .eq("student_id", student.id);

    const session = await useSession<ParentSession>(parentSessionConfig);
    await session.update({
      studentId: student.id,
      enrollmentNo: student.enrollment_no,
      studentName: student.name,
      branch: student.branch,
      semester: student.semester,
    });
    await logParentAuth("parent_login_success", {
      studentId: student.id, enrollmentInput: raw, resolvedEnrollment,
    });
    return { success: true };
  });


export const parentLogout = createServerFn({ method: "POST" }).handler(async () => {
  const s = await useSession<ParentSession>(parentSessionConfig);
  const studentId = (s.data as ParentSession | undefined)?.studentId ?? null;
  const enrollmentNo = (s.data as ParentSession | undefined)?.enrollmentNo ?? null;
  await s.clear();
  await logParentAuth("parent_logout", { studentId, resolvedEnrollment: enrollmentNo });
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
