import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ─── Classes ────────────────────────────────────────────────────────────────
export const listClasses = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const { data, error } = await s.from("classes").select("*").order("id");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const upsertClass = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      id: z.number().optional(),
      class_id: z.string(),
      name: z.string(),
      department: z.string().nullable().optional(),
      semester: z.number().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const s = await db();
    const { id, ...rest } = data;
    if (id) {
      const { error } = await s.from("classes").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await s.from("classes").insert(rest);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteClass = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data }) => {
    const s = await db();
    const { error } = await s.from("classes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Announcements ──────────────────────────────────────────────────────────
export const listAnnouncements = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const { data, error } = await s
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const createAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ content: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const s = await db();
    const { error } = await s.from("announcements").insert({ content: data.content, is_active: true });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data }) => {
    const s = await db();
    const { error } = await s.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── PTM ────────────────────────────────────────────────────────────────────
export const getPTM = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const { data, error } = await s
    .from("ptm_meetings")
    .select("*")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});

export const upsertPTM = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      id: z.number().optional(),
      meeting_date: z.string().nullable().optional(),
      meeting_time: z.string().nullable().optional(),
      agenda: z.array(z.string()).optional(),
      meet_link: z.string().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const s = await db();
    const payload: any = {
      meeting_date: data.meeting_date ?? null,
      meeting_time: data.meeting_time ?? null,
      agenda: data.agenda ?? [],
      meet_link: data.meet_link ?? null,
      updated_at: new Date().toISOString(),
    };
    if (data.id) {
      const { error } = await s.from("ptm_meetings").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await s.from("ptm_meetings").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ─── Parent messages ────────────────────────────────────────────────────────
export const listParentMessages = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const { data, error } = await s
    .from("parent_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const markParentMessageRead = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number(), status: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const s = await db();
    const { error } = await s.from("parent_messages").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteParentMessage = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data }) => {
    const s = await db();
    const { error } = await s.from("parent_messages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
