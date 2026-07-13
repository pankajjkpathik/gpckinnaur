import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminRoles } from "./roles";
import { requireRole } from "./roles.server";

// Keys we manage via UI. Keeping them in one place avoids typos across callers.
export const SETTING_KEYS = {
  INSTITUTE_ADDRESS: "institute_address",
  INSTITUTE_LOGO: "institute_logo",
} as const;

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.INSTITUTE_ADDRESS]: "Camp at GP Rohru, Distt. Shimla (H.P.)",
  [SETTING_KEYS.INSTITUTE_LOGO]: "",
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

async function writeSetting(key: string, value: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("app_settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (error) throw new Error(error.message);
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
    await writeSetting(SETTING_KEYS.INSTITUTE_ADDRESS, data.value);
    return { ok: true, value: data.value };
  });

// Institute logo (stored as a data URL in app_settings.value — text column, no size limit,
// but keep uploads under ~500 KB so PDF generation stays snappy).
export const getInstituteLogo = createServerFn({ method: "GET" }).handler(async () => {
  return { value: await readSetting(SETTING_KEYS.INSTITUTE_LOGO) };
});

export const setInstituteLogo = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        // empty string clears the custom logo (reverts to bundled default)
        value: z.string().max(1_500_000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    const v = data.value.trim();
    if (v && !/^data:image\/(png|jpe?g|webp|svg\+xml);base64,/.test(v)) {
      throw new Error("Logo must be a PNG, JPEG, WEBP or SVG image.");
    }
    await writeSetting(SETTING_KEYS.INSTITUTE_LOGO, v);
    return { ok: true };
  });
