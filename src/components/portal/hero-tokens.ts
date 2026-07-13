// Shared portal hero design tokens.
// Update palettes / typography here and every portal dashboard follows.

export type HeroPalette = {
  /** Tailwind gradient stops used for the hero background. */
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

export const HERO_PALETTES: Record<HeroPaletteName, HeroPalette> = {
  faculty: {
    gradient: "from-[#7b1f4c] via-[#5a1638] to-[#2d0a1c]",
    nameColor: "text-amber-300",
    eyebrowColor: "text-amber-200/90",
    metaColor: "text-amber-200",
    blob: "bg-orange-300",
  },
  principal: {
    gradient: "from-[#3730a3] via-[#2e1065] to-[#1e1b4b]",
    nameColor: "text-amber-300",
    eyebrowColor: "text-amber-200/90",
    metaColor: "text-amber-200",
    blob: "bg-amber-300",
  },
  hod: {
    gradient: "from-[#065f46] via-[#064e3b] to-[#052e2b]",
    nameColor: "text-lime-300",
    eyebrowColor: "text-lime-200/90",
    metaColor: "text-lime-200",
    blob: "bg-lime-300",
  },
  tpo: {
    gradient: "from-[#0e7490] via-[#155e75] to-[#083344]",
    nameColor: "text-cyan-200",
    eyebrowColor: "text-cyan-200/90",
    metaColor: "text-cyan-200",
    blob: "bg-cyan-300",
  },
  clerk: {
    gradient: "from-[#b45309] via-[#78350f] to-[#431407]",
    nameColor: "text-yellow-200",
    eyebrowColor: "text-yellow-200/90",
    metaColor: "text-yellow-200",
    blob: "bg-yellow-300",
  },
  student: {
    gradient: "from-[#6d28d9] via-[#4c1d95] to-[#2e1065]",
    nameColor: "text-fuchsia-200",
    eyebrowColor: "text-fuchsia-200/90",
    metaColor: "text-fuchsia-200",
    blob: "bg-fuchsia-400",
  },
  parent: {
    gradient: "from-[#047857] via-[#065f46] to-[#022c22]",
    nameColor: "text-lime-200",
    eyebrowColor: "text-lime-200/90",
    metaColor: "text-lime-200",
    blob: "bg-emerald-300",
  },
  staff: {
    gradient: "from-[#0f172a] via-[#1e293b] to-[#020617]",
    nameColor: "text-sky-300",
    eyebrowColor: "text-sky-200/90",
    metaColor: "text-sky-200",
    blob: "bg-sky-400",
  },
};

// Typography tokens shared across every hero banner. Tweak once here to
// re-tune the greeting rhythm globally.
export const HERO_TYPOGRAPHY = {
  eyebrow:
    "text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.22em] font-semibold truncate",
  heading:
    "mt-1.5 font-extrabold text-white leading-tight tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] text-[clamp(1.35rem,4.5vw,2rem)] sm:text-3xl break-words",
  subtitle: "mt-2 text-[13px] sm:text-sm text-white/95 leading-relaxed",
  statValue: "text-lg sm:text-2xl font-bold text-white leading-none",
  statLabel: "text-[9px] sm:text-[10px] uppercase tracking-wider text-white/80 mt-1",
} as const;

export function resolveHeroPalette(p: HeroPaletteName | HeroPalette): HeroPalette {
  return typeof p === "string" ? HERO_PALETTES[p] : p;
}
