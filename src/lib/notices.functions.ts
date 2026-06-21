import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { staffSessionConfig, type StaffSession } from "./sessions";

export const listNotices = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("notices")
    .select("*")
    .order("date", { ascending: false });
  return data ?? [];
});

export const createNotice = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        title: z.string().min(1).max(300),
        content: z.string().optional(),
        category: z.string().default("general"),
        link: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const session = await useSession<StaffSession>(staffSessionConfig);
    const user = session.data;
    if (!user?.id || !user.role) throw new Error("Not authenticated");
    if (!["super_admin", "principal", "hod"].includes(user.role as string))
      throw new Error("Insufficient permissions");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("notices")
      .insert({
        title: data.title,
        content: data.content || null,
        category: data.category,
        link: data.link || null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteNotice = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.number() }).parse(d))
  .handler(async ({ data }) => {
    const session = await useSession<StaffSession>(staffSessionConfig);
    const user = session.data;
    if (!user?.id || !user.role) throw new Error("Not authenticated");
    if (!["super_admin", "principal", "hod"].includes(user.role as string))
      throw new Error("Insufficient permissions");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("notices").delete().eq("id", data.id);
    return { success: true };
  });
