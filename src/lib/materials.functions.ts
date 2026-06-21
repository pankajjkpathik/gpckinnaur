import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { staffSessionConfig, type StaffSession } from "./sessions";

export const listMaterials = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        type: z.string().optional(),
        department: z.string().optional(),
        semester: z.number().optional(),
      })
      .optional()
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("study_materials")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (data?.type) q = q.eq("type", data.type);
    if (data?.department) q = q.in("department", [data.department, "all"]);
    if (data?.semester) q = q.eq("semester", data.semester);
    const { data: rows } = await q;
    return rows ?? [];
  });

export const createMaterial = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        title: z.string().min(1),
        type: z.enum(["notes", "syllabus", "paper", "form"]),
        department: z.string(),
        semester: z.number().nullable().optional(),
        subject: z.string().optional(),
        fileUrl: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const session = await useSession<StaffSession>(staffSessionConfig);
    const user = session.data;
    if (!user?.id) throw new Error("Not authenticated");
    if (!["super_admin", "principal", "hod", "faculty"].includes(user.role))
      throw new Error("Insufficient permissions");
    let dept = data.department;
    if (["hod", "faculty"].includes(user.role) && user.department) dept = user.department;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("study_materials")
      .insert({
        title: data.title,
        type: data.type,
        department: dept,
        semester: data.semester ?? null,
        subject: data.subject || null,
        file_url: data.fileUrl,
        uploaded_by: user.id,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteMaterial = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data }) => {
    const session = await useSession<StaffSession>(staffSessionConfig);
    const user = session.data;
    if (!user?.id) throw new Error("Not authenticated");
    if (!["super_admin", "principal", "hod"].includes(user.role))
      throw new Error("Insufficient permissions");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("study_materials").delete().eq("id", data.id);
    return { success: true };
  });
