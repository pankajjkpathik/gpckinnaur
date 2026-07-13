import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clerkRoles, adminRoles } from "./roles";
import { requireRole } from "./roles.server";

const access = clerkRoles.concat(adminRoles);

export const salaryList = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ month: z.number().int().optional(), year: z.number().int().optional() }).parse(d ?? {}))
  .handler(async ({ data }) => {
    await requireRole(access);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("staff_salary")
      .select("id, staff_id, month, year, basic, da, hra, other_allow, deductions, net_pay, remarks, paid_on, staff_users!inner(username, role, department)")
      .order("year", { ascending: false })
      .order("month", { ascending: false });
    if (data.month) q = q.eq("month", data.month);
    if (data.year) q = q.eq("year", data.year);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const salaryUpsert = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      staff_id: z.number().int(),
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(2000).max(2100),
      basic: z.number().min(0),
      da: z.number().min(0).default(0),
      hra: z.number().min(0).default(0),
      other_allow: z.number().min(0).default(0),
      deductions: z.number().min(0).default(0),
      remarks: z.string().optional().nullable(),
      paid_on: z.string().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const me = await requireRole(access);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await supabaseAdmin
      .from("staff_users")
      .select("username, name")
      .eq("id", data.staff_id)
      .maybeSingle();
    const net_pay =
      Number(data.basic) + Number(data.da) + Number(data.hra) + Number(data.other_allow) - Number(data.deductions);
    const { error } = await supabaseAdmin.from("staff_salary").upsert(
      { ...data, paid_on: data.paid_on || null, remarks: data.remarks || null },
      { onConflict: "staff_id,month,year" },
    );
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      actor_type: "staff",
      actor_id: me.id,
      action: "salary_upsert",
      entity: "staff_salary",
      entity_id: `${data.staff_id}:${data.year}-${String(data.month).padStart(2, "0")}`,
      details: {
        actor_name: me.username,
        staff_name: staff?.name || staff?.username || null,
        month: data.month,
        year: data.year,
        net_pay,
      },
    });
    return { ok: true };
  });

export const salaryDelete = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    const me = await requireRole(access);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await supabaseAdmin
      .from("staff_salary")
      .select("staff_id, month, year, net_pay, staff_users(username, name)")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await supabaseAdmin.from("staff_salary").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      actor_type: "staff",
      actor_id: me.id,
      action: "salary_delete",
      entity: "staff_salary",
      entity_id: String(data.id),
      details: {
        actor_name: me.username,
        staff_name: (prev as any)?.staff_users?.name || (prev as any)?.staff_users?.username || null,
        month: prev?.month ?? null,
        year: prev?.year ?? null,
        net_pay: prev?.net_pay ?? null,
      },
    });
    return { ok: true };
  });

export const salaryStaffList = createServerFn({ method: "GET" }).handler(async () => {
  await requireRole(access);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("staff_users")
    .select("id, username, role, department")
    .eq("is_active", true)
    .order("username");
  if (error) throw new Error(error.message);
  return data ?? [];
});
