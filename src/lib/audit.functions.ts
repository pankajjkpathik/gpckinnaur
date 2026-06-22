import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminRoles } from "./roles";
import { requireRole } from "./roles.server";

export const listAuditLog = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      entity: z.string().optional(),
      action: z.string().optional(),
      actor_type: z.string().optional(),
      limit: z.number().int().min(1).max(500).default(200),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("audit_log").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.entity) q = q.eq("entity", data.entity);
    if (data.action) q = q.eq("action", data.action);
    if (data.actor_type) q = q.eq("actor_type", data.actor_type);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
