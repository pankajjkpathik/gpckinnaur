// Server-only helpers for global app settings. Kept out of *.functions.ts so
// server functions don't accidentally leak this module (or supabaseAdmin) into
// the client bundle.
import { SETTING_KEYS } from "./settings.functions";

const DEFAULT_SESSION_START = "2026-08-01";

export async function readActiveSessionStart(): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", SETTING_KEYS.ACTIVE_SESSION_START)
    .maybeSingle();
  const v = (data?.value as string | null) ?? DEFAULT_SESSION_START;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : DEFAULT_SESSION_START;
}
