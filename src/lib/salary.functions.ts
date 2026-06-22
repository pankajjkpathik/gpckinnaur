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
    await requireRole(access);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("staff_salary").upsert(
      { ...data, paid_on: data.paid_on || null, remarks: data.remarks || null },
      { onConflict: "staff_id,month,year" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const salaryDelete = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(access);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("staff_salary").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
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
