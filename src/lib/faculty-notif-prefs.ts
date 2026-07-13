import { useEffect, useState } from "react";

export type FacNotifPrefs = {
  announcements: boolean;
  deadlines: boolean;
  overdue: boolean;
  toasts: boolean;
};

export const DEFAULT_FAC_NOTIF_PREFS: FacNotifPrefs = {
  announcements: true,
  deadlines: true,
  overdue: true,
  toasts: true,
};

const CHANNEL = "fac-notif-prefs-sync";
const listeners = new Set<() => void>();
let bc: BroadcastChannel | null = null;
function getBC(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!bc) {
    try {
      bc = new BroadcastChannel(CHANNEL);
    } catch {
      bc = null;
    }
  }
  return bc;
}

export function prefsKey(userId: string | number) {
  return `fac-notif-prefs:${userId}`;
}

export function loadFacNotifPrefs(key: string): FacNotifPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_FAC_NOTIF_PREFS };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...DEFAULT_FAC_NOTIF_PREFS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_FAC_NOTIF_PREFS, ...parsed };
  } catch {
    return { ...DEFAULT_FAC_NOTIF_PREFS };
  }
}

export function saveFacNotifPrefs(key: string, prefs: FacNotifPrefs) {
  try {
    localStorage.setItem(key, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
  const ch = getBC();
  if (ch) {
    try {
      ch.postMessage({ key, ts: Date.now() });
    } catch {
      /* ignore */
    }
  }
}

export function useFacNotifPrefs(userId: string | number | undefined) {
  const key = userId != null ? prefsKey(userId) : "";
  const [prefs, setPrefs] = useState<FacNotifPrefs>(() =>
    key ? loadFacNotifPrefs(key) : { ...DEFAULT_FAC_NOTIF_PREFS },
  );
  useEffect(() => {
    if (!key) return;
    const refresh = () => setPrefs(loadFacNotifPrefs(key));
    refresh();
    listeners.add(refresh);
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === key) refresh();
    };
    window.addEventListener("storage", onStorage);
    const ch = getBC();
    const onBC = (e: MessageEvent) => {
      if (!e?.data || e.data.key === key) refresh();
    };
    ch?.addEventListener("message", onBC);
    return () => {
      listeners.delete(refresh);
      window.removeEventListener("storage", onStorage);
      ch?.removeEventListener("message", onBC);
    };
  }, [key]);
  const update = (patch: Partial<FacNotifPrefs>) => {
    if (!key) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveFacNotifPrefs(key, next);
  };
  return { prefs, update, key } as const;
}

// Non-reactive accessor for use inside realtime callbacks.
export function getFacNotifPrefs(userId: string | number | undefined): FacNotifPrefs {
  if (userId == null) return { ...DEFAULT_FAC_NOTIF_PREFS };
  return loadFacNotifPrefs(prefsKey(userId));
}
