import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminRoles } from "./roles";
import { requireRole } from "./roles.server";

// Keys we manage via UI. Keeping them in one place avoids typos across callers.
export const SETTING_KEYS = {
  INSTITUTE_ADDRESS: "institute_address",
} as const;

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.INSTITUTE_ADDRESS]: "Camp at GP Rohru, Distt. Shimla (H.P.)",
};

async function readSetting(key: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return (data?.value as string | null) ?? DEFAULTS[key] ?? "";
}

// Public read: any authenticated staff can fetch the current institute address
// (used in the header of generated PDFs).
export const getInstituteAddress = createServerFn({ method: "GET" }).handler(async () => {
  return { value: await readSetting(SETTING_KEYS.INSTITUTE_ADDRESS) };
});

// Admin-only write.
export const setInstituteAddress = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ value: z.string().min(3).max(300) }).parse(d))
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert(
        { key: SETTING_KEYS.INSTITUTE_ADDRESS, value: data.value, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, value: data.value };
  });
