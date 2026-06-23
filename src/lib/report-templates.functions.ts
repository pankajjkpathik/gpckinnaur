import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminRoles } from "./roles";
import { requireRole, requireStaff } from "./roles.server";

const KINDS = ["monthly_attendance", "mid_sessional", "final_sessional", "external_practical", "other"] as const;

export const templatesList = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaff();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("report_templates")
    .select("id, name, kind, file_name, created_at, updated_at")
    .order("kind").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const templateUpload = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    name: z.string().min(2).max(120),
    kind: z.enum(KINDS),
    file_name: z.string().min(1).max(200),
    file_b64: z.string().min(10),
  }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("report_templates").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const templateDelete = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("report_templates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const templateDownload = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    id: z.number().int(),
    branch: z.string().optional(),
    semester: z.number().int().min(1).max(8).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    await requireStaff();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tpl, error } = await supabaseAdmin
      .from("report_templates")
      .select("name, file_name, file_b64")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !tpl) throw new Error("Template not found");

    let roster: any[] = [];
    if (data.branch && data.semester) {
      const { data: studs } = await supabaseAdmin
        .from("students")
        .select("enrollment_no, name, father_name")
        .eq("branch", data.branch)
        .eq("semester", data.semester)
        .eq("is_active", true)
        .order("enrollment_no");
      roster = studs ?? [];
    }

    return { file_name: tpl.file_name, file_b64: tpl.file_b64, name: tpl.name, roster };
  });

export const templatesBulkDelete = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ ids: z.array(z.number().int()).min(1).max(500) }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error, count } = await supabaseAdmin.from("report_templates").delete({ count: "exact" }).in("id", data.ids);
    if (error) throw new Error(error.message);
    return { deleted: count ?? data.ids.length };
  });
