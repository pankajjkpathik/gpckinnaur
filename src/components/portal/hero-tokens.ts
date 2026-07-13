// Shared portal hero design tokens.
// Each palette carries a light variant plus optional `dark:`-prefixed classes
// that Tailwind applies when the root has the `.dark` class. Prefixes are
// baked into the strings so the v4 JIT scanner can see them at build time.

export type HeroPalette = {
  /** Tailwind gradient stops (light) + optional dark: prefixed additions. */
  gradient: string;
  /** Tailwind color class for the highlighted user name. */
  nameColor: string;
  /** Tailwind color class for the uppercase eyebrow (date · role). */
  eyebrowColor: string;
  /** Tailwind color class for the highlighted meta word inside the subtitle. */
  metaColor: string;
  /** Tailwind bg-* class for the decorative blur blob (accent side). */
  blob: string;
};

export type HeroPaletteName =
  | "faculty"
  | "principal"
  | "hod"
  | "tpo"
  | "clerk"
  | "student"
  | "parent"
  | "staff";

// Light + dark literals live side-by-side in the same string. Dark values
// are chosen to keep contrast comfortable on `.dark` surfaces: slightly
// deeper gradient stops and one-shade-brighter accent text.
export const HERO_PALETTES: Record<HeroPaletteName, HeroPalette> = {
  faculty: {
    gradient:
      "from-[#7b1f4c] via-[#5a1638] to-[#2d0a1c] dark:from-[#4a1030] dark:via-[#340a22] dark:to-[#1a0510]",
    nameColor: "text-amber-300 dark:text-amber-200",
    eyebrowColor: "text-amber-200/90 dark:text-amber-100/90",
    metaColor: "text-amber-200 dark:text-amber-100",
    blob: "bg-orange-300 dark:bg-orange-500/60",
  },
  principal: {
    gradient:
      "from-[#3730a3] via-[#2e1065] to-[#1e1b4b] dark:from-[#241d7a] dark:via-[#1c0949] dark:to-[#0f0d2e]",
    nameColor: "text-amber-300 dark:text-amber-200",
    eyebrowColor: "text-amber-200/90 dark:text-amber-100/90",
    metaColor: "text-amber-200 dark:text-amber-100",
    blob: "bg-amber-300 dark:bg-amber-500/60",
  },
  hod: {
    gradient:
      "from-[#065f46] via-[#064e3b] to-[#052e2b] dark:from-[#043d2e] dark:via-[#032f24] dark:to-[#021a18]",
    nameColor: "text-lime-300 dark:text-lime-200",
    eyebrowColor: "text-lime-200/90 dark:text-lime-100/90",
    metaColor: "text-lime-200 dark:text-lime-100",
    blob: "bg-lime-300 dark:bg-lime-500/60",
  },
  tpo: {
    gradient:
      "from-[#0e7490] via-[#155e75] to-[#083344] dark:from-[#0a5266] dark:via-[#0e4152] dark:to-[#04202b]",
    nameColor: "text-cyan-200 dark:text-cyan-100",
    eyebrowColor: "text-cyan-200/90 dark:text-cyan-100/90",
    metaColor: "text-cyan-200 dark:text-cyan-100",
    blob: "bg-cyan-300 dark:bg-cyan-500/60",
  },
  clerk: {
    gradient:
      "from-[#b45309] via-[#78350f] to-[#431407] dark:from-[#7a3906] dark:via-[#52240a] dark:to-[#2a0c04]",
    nameColor: "text-yellow-200 dark:text-yellow-100",
    eyebrowColor: "text-yellow-200/90 dark:text-yellow-100/90",
    metaColor: "text-yellow-200 dark:text-yellow-100",
    blob: "bg-yellow-300 dark:bg-yellow-500/60",
  },
  student: {
    gradient:
      "from-[#6d28d9] via-[#4c1d95] to-[#2e1065] dark:from-[#4a1c96] dark:via-[#33116a] dark:to-[#1c0949]",
    nameColor: "text-fuchsia-200 dark:text-fuchsia-100",
    eyebrowColor: "text-fuchsia-200/90 dark:text-fuchsia-100/90",
    metaColor: "text-fuchsia-200 dark:text-fuchsia-100",
    blob: "bg-fuchsia-400 dark:bg-fuchsia-500/60",
  },
  parent: {
    gradient:
      "from-[#047857] via-[#065f46] to-[#022c22] dark:from-[#034d38] dark:via-[#043d2e] dark:to-[#011a14]",
    nameColor: "text-lime-200 dark:text-lime-100",
    eyebrowColor: "text-lime-200/90 dark:text-lime-100/90",
    metaColor: "text-lime-200 dark:text-lime-100",
    blob: "bg-emerald-300 dark:bg-emerald-500/60",
  },
  staff: {
    gradient:
      "from-[#0f172a] via-[#1e293b] to-[#020617] dark:from-[#0a1020] dark:via-[#131c2b] dark:to-[#01030d]",
    nameColor: "text-sky-300 dark:text-sky-200",
    eyebrowColor: "text-sky-200/90 dark:text-sky-100/90",
    metaColor: "text-sky-200 dark:text-sky-100",
    blob: "bg-sky-400 dark:bg-sky-500/60",
  },
};

// Typography tokens shared across every hero banner. Tweak once here to
// re-tune the greeting rhythm globally. Text stays white in both themes;
// the outer surface already dims via the dark gradient stops.
export const HERO_TYPOGRAPHY = {
  eyebrow:
    "text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.22em] font-semibold truncate",
  heading:
    "mt-1.5 font-extrabold text-white leading-tight tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] dark:drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] text-[clamp(1.35rem,4.5vw,2rem)] sm:text-3xl break-words",
  subtitle: "mt-2 text-[13px] sm:text-sm text-white/95 dark:text-white/85 leading-relaxed",
  statValue: "text-lg sm:text-2xl font-bold text-white leading-none",
  statLabel: "text-[9px] sm:text-[10px] uppercase tracking-wider text-white/80 dark:text-white/70 mt-1",
  // Decorative blob wrapper opacity — softer in dark to avoid hot glow.
  blobLayer: "absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none",
  // Stat tile surface tuning per theme.
  statTile:
    "bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 sm:px-4 sm:py-3 border border-white/15 dark:border-white/10 text-center min-w-[70px]",
} as const;

export function resolveHeroPalette(p: HeroPaletteName | HeroPalette): HeroPalette {
  return typeof p === "string" ? HERO_PALETTES[p] : p;
}
