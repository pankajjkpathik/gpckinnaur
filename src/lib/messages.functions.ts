import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStaffSession } from "./roles.server";
import { getCookie, useSession } from "@tanstack/react-start/server";
import { studentSessionConfig, type StudentSession } from "./sessions";

type Me = { kind: "staff" | "student"; id: number; name: string };

async function whoAmI(): Promise<Me> {
  const staff = await getStaffSession();
  if (staff) return { kind: "staff", id: staff.id, name: staff.username };
  if (getCookie(studentSessionConfig.name)) {
    const s = await useSession<StudentSession>(studentSessionConfig);
    if (s.data?.id) return { kind: "student", id: s.data.id, name: s.data.name };
  }
  throw new Error("Not authenticated");
}

const peerKind = z.enum(["staff", "student"]);

async function attachNames(rows: any[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const staffIds = new Set<number>(), studentIds = new Set<number>();
  rows.forEach((r) => {
    (r.sender_kind === "staff" ? staffIds : studentIds).add(r.sender_id);
    (r.recipient_kind === "staff" ? staffIds : studentIds).add(r.recipient_id);
  });
  const [staff, students] = await Promise.all([
    staffIds.size ? supabaseAdmin.from("staff_users").select("id, username, role").in("id", Array.from(staffIds)) : Promise.resolve({ data: [] as any[] }),
    studentIds.size ? supabaseAdmin.from("students").select("id, name, enrollment_no").in("id", Array.from(studentIds)) : Promise.resolve({ data: [] as any[] }),
  ]);
  const sMap = new Map((staff.data ?? []).map((s: any) => [s.id, s]));
  const tMap = new Map((students.data ?? []).map((s: any) => [s.id, s]));
  return rows.map((r) => ({
    ...r,
    sender_name: r.sender_kind === "staff" ? (sMap.get(r.sender_id) as any)?.username : (tMap.get(r.sender_id) as any)?.name,
    sender_meta: r.sender_kind === "staff" ? (sMap.get(r.sender_id) as any)?.role : (tMap.get(r.sender_id) as any)?.enrollment_no,
    recipient_name: r.recipient_kind === "staff" ? (sMap.get(r.recipient_id) as any)?.username : (tMap.get(r.recipient_id) as any)?.name,
    recipient_meta: r.recipient_kind === "staff" ? (sMap.get(r.recipient_id) as any)?.role : (tMap.get(r.recipient_id) as any)?.enrollment_no,
  }));
}

export const inbox = createServerFn({ method: "GET" }).handler(async () => {
  const me = await whoAmI();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("recipient_kind", me.kind)
    .eq("recipient_id", me.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return { me, items: await attachNames(data ?? []) };
});

export const sent = createServerFn({ method: "GET" }).handler(async () => {
  const me = await whoAmI();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("sender_kind", me.kind)
    .eq("sender_id", me.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return { me, items: await attachNames(data ?? []) };
});

export const unreadCount = createServerFn({ method: "GET" }).handler(async () => {
  const me = await whoAmI();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("recipient_kind", me.kind)
    .eq("recipient_id", me.id)
    .is("read_at", null);
  return { count: count ?? 0 };
});

export const sendMessage = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    recipient_kind: peerKind,
    recipient_id: z.number().int().positive(),
    body: z.string().min(1).max(4000),
  }).parse(d))
  .handler(async ({ data }) => {
    const me = await whoAmI();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Validate recipient exists
    const tbl = data.recipient_kind === "staff" ? "staff_users" : "students";
    const { data: r } = await supabaseAdmin.from(tbl).select("id").eq("id", data.recipient_id).maybeSingle();
    if (!r) throw new Error("Recipient not found");
    const { error } = await supabaseAdmin.from("messages").insert({
      sender_kind: me.kind, sender_id: me.id,
      recipient_kind: data.recipient_kind, recipient_id: data.recipient_id,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markRead = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int().positive() }).parse(d))
  .handler(async ({ data }) => {
    const me = await whoAmI();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("messages").update({ read_at: new Date().toISOString() })
      .eq("id", data.id).eq("recipient_kind", me.kind).eq("recipient_id", me.id).is("read_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const contacts = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ kind: peerKind, q: z.string().max(80).optional() }).parse(d))
  .handler(async ({ data }) => {
    await whoAmI();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.kind === "staff") {
      let q = supabaseAdmin.from("staff_users").select("id, username, role, department").eq("is_active", true).order("username").limit(200);
      if (data.q) q = q.ilike("username", `%${data.q}%`);
      const { data: rows } = await q;
      return (rows ?? []).map((r: any) => ({ id: r.id, label: r.username, sub: `${r.role}${r.department ? " · " + r.department : ""}` }));
    } else {
      let q = supabaseAdmin.from("students").select("id, name, enrollment_no, branch, semester").eq("is_active", true).order("name").limit(200);
      if (data.q) q = q.or(`name.ilike.%${data.q}%,enrollment_no.ilike.%${data.q}%`);
      const { data: rows } = await q;
      return (rows ?? []).map((r: any) => ({ id: r.id, label: r.name, sub: `${r.enrollment_no} · ${r.branch}-Sem${r.semester}` }));
    }
  });
