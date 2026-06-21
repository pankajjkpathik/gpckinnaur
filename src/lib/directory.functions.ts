import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listDepartments = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("departments").select("*").order("id");
  return data ?? [];
});

export const getDepartment = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: dept } = await supabaseAdmin
      .from("departments")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!dept) return null;
    const { data: fac } = await supabaseAdmin
      .from("faculty")
      .select("*")
      .eq("department_id", data.id);
    return { ...dept, faculty: fac ?? [] };
  });

export const listFaculty = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ departmentId: z.number().optional() }).optional().parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("faculty").select("*").order("id");
    if (data?.departmentId) q = q.eq("department_id", data.departmentId);
    const { data: rows } = await q;
    return rows ?? [];
  });
