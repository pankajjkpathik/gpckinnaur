import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminRoles } from "./roles";
import { requireRole } from "./roles.server";

// Keys we manage via UI. Keeping them in one place avoids typos across callers.
export const SETTING_KEYS = {
  INSTITUTE_ADDRESS: "institute_address",
  INSTITUTE_LOGO: "institute_logo",
  ACTIVE_SESSION_YEAR: "active_session_year",
  ACTIVE_SESSION_START: "active_session_start",
} as const;

function computeDefaultYear(d = new Date()) {
  const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.INSTITUTE_ADDRESS]: "Camp at GP Rohru, Distt. Shimla (H.P.)",
  [SETTING_KEYS.INSTITUTE_LOGO]: "",
  [SETTING_KEYS.ACTIVE_SESSION_YEAR]: computeDefaultYear(),
  [SETTING_KEYS.ACTIVE_SESSION_START]: "2026-08-01",
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

// Active academic session — used as the default across timetable, syllabus,
// admissions, and attendance rollovers. Public read so every portal (and SSR
// loaders) can access without a bearer token.
export const getActiveSession = createServerFn({ method: "GET" }).handler(async () => {
  const [year, start] = await Promise.all([
    readSetting(SETTING_KEYS.ACTIVE_SESSION_YEAR),
    readSetting(SETTING_KEYS.ACTIVE_SESSION_START),
  ]);
  return { year, startDate: start };
});

const yearRe = /^\d{4}-\d{2}$/;

export const setActiveSession = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        year: z.string().regex(yearRe, "Year must look like 2026-27"),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireRole(adminRoles);
    // Cross-check: the YY suffix should match year+1 for consistency.
    const [y1, y2] = data.year.split("-");
    const expected = String((Number(y1) + 1) % 100).padStart(2, "0");
    if (y2 !== expected) throw new Error(`Year suffix should be ${expected} for ${y1}-`);
    await writeSetting(SETTING_KEYS.ACTIVE_SESSION_YEAR, data.year);
    await writeSetting(SETTING_KEYS.ACTIVE_SESSION_START, data.startDate);
    return { ok: true };
  });
