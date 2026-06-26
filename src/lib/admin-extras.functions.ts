import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminRoles } from "./roles";
import { requireRole, requireStaff } from "./roles.server";

// =====================================================================
// CLASSES
// =====================================================================

export const listClasses = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("classes")
    .select("*")
    .order("department")
    .order("semester");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const upsertClass = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int().optional(),
        name: z.string().min(1).max(150),
        class_id: z.string().min(1).max(40),
        department: z.string().max(150).optional().nullable(),
        semester: z.number().int().min(1).max(12).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...payload } = data;
    const { error } = id
      ? await supabaseAdmin.from("classes").update(payload).eq("id", id)
      : await supabaseAdmin.from("classes").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteClass = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("classes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =====================================================================
// ANNOUNCEMENTS (login-page marquee)
// =====================================================================

// Public read — login page marquee needs these without auth.
export const listAnnouncements = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const createAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ content: z.string().min(1).max(1000) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("announcements")
      .insert({ content: data.content })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =====================================================================
// PTM MEETINGS
// =====================================================================

// Returns the latest (current) PTM record, or null if none.
export const getPTM = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("ptm_meetings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
});

export const upsertPTM = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: z.number().int().optional(),
        meeting_date: z.string().optional().nullable(),
        meeting_time: z.string().max(40).optional().nullable(),
        agenda: z.array(z.string()).default([]),
        meet_link: z
          .string()
          .max(500)
          .optional()
          .nullable()
          .or(z.literal("").transform(() => null)),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      meeting_date: data.meeting_date || null,
      meeting_time: data.meeting_time || null,
      agenda: data.agenda,
      meet_link: data.meet_link || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = data.id
      ? await supabaseAdmin.from("ptm_meetings").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("ptm_meetings").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// =====================================================================
// PARENT MESSAGES
// =====================================================================

export const listParentMessages = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("parent_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

// Public — a parent portal / contact form can post a message without staff auth.
export const createParentMessage = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        from_name: z.string().min(1).max(150),
        student_name: z.string().max(150).optional().nullable(),
        student_id: z.number().int().optional().nullable(),
        subject: z.string().max(300).optional().nullable(),
        body: z.string().optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("parent_messages")
      .insert({
        from_name: data.from_name,
        student_name: data.student_name || null,
        student_id: data.student_id || null,
        subject: data.subject || null,
        body: data.body || null,
        status: "new",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const markParentMessageRead = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ id: z.number().int(), status: z.enum(["new", "read"]).default("read") }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("parent_messages")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteParentMessage = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("parent_messages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
