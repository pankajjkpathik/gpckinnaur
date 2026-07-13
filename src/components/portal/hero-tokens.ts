/**
 * Shared portal hero design tokens.
 * ---------------------------------
 * Every dashboard hero (`<HeroBanner />`) reads its colours and typography
 * from this file. Palettes come in matched **light + dark** pairs so a single
 * palette name renders correctly under both `.dark` and default themes.
 *
 * ## When to edit this file
 *
 * 1. **Tweak an existing role's colours** → edit that entry in `HERO_PALETTES`.
 * 2. **Adjust heading / stat / eyebrow sizing globally** → edit `HERO_TYPOGRAPHY`.
 * 3. **Add a brand new role** → add a name to `HeroPaletteName`, add its
 *    palette to `HERO_PALETTES`, done. `resolveHeroPalette` picks it up
 *    automatically and TypeScript flags any consumer that forgot the new name.
 *
 * ## Class-name rules (important — Tailwind v4 JIT)
 *
 * The Tailwind v4 scanner only ships classes it can see as complete string
 * literals at build time. That means:
 *
 * - Never build class names by string concatenation
 *   (`` `text-${colour}-300` `` will not ship).
 * - Always inline the full `dark:` variant in the same string
 *   (`"text-amber-300 dark:text-amber-200"`), not via a runtime branch.
 * - Arbitrary hex stops (`from-[#7b1f4c]`) are fine — the scanner sees them
 *   verbatim in this file.
 *
 * ## Contrast target
 *
 * Text sits on the darkest gradient stop. Aim for ≥ 4.5:1 for the greeting
 * (white) and ≥ 4.5:1 for the highlighted name against every stop, in both
 * themes. The current palettes all clear 6:1 — see
 * `tests/visual/hero-banner.mjs` for the regression harness that captures
 * each palette across mobile / tablet / desktop.
 *
 * ## Example — adding a new "librarian" palette
 *
 * ```ts
 * // 1. Extend the name union.
 * export type HeroPaletteName = ... | "librarian";
 *
 * // 2. Add the palette. Match the shape of an existing entry.
 * librarian: {
 *   gradient:
 *     "from-[#7c2d12] via-[#57180d] to-[#2b0a05] " +
 *     "dark:from-[#571a09] dark:via-[#3a1006] dark:to-[#1a0603]",
 *   nameColor:    "text-orange-200 dark:text-orange-100",
 *   eyebrowColor: "text-orange-200/90 dark:text-orange-100/90",
 *   metaColor:    "text-orange-200 dark:text-orange-100",
 *   blob:         "bg-orange-300 dark:bg-orange-500/60",
 * },
 *
 * // 3. Use it from a route.
 * <HeroBanner palette="librarian" name={me.name} role="Librarian" />
 * ```
 *
 * See `HeroBanner.tsx` for the render sites of each token and
 * `src/routes/dev.hero-preview.tsx` for a live storybook-style preview.
 */

/**
 * One hero look. Every field is a Tailwind class string; `dark:` variants
 * are inlined so the v4 scanner can see them.
 */
export type HeroPalette = {
  /**
   * Tailwind gradient stops for `bg-gradient-to-br`. Include both light
   * stops (`from-... via-... to-...`) and their `dark:`-prefixed twins
   * inside a single space-separated string.
   */
  gradient: string;
  /**
   * Colour of the highlighted user name in the greeting.
   * Use a light shade (e.g. `text-amber-300`) that clears 4.5:1 against
   * the darkest gradient stop in both themes.
   */
  nameColor: string;
  /**
   * Colour of the uppercase eyebrow line (date · role) above the greeting.
   * Slightly dimmer than `nameColor` — usually the `/90` variant of the same hue.
   */
  eyebrowColor: string;
  /**
   * Colour of the highlighted meta word inside the subtitle line
   * (e.g. the `today` inside "Here's your snapshot for today").
   */
  metaColor: string;
  /**
   * Background colour for the decorative blur blob on the accent side of the
   * banner. Typically a `bg-<hue>-300` in light and `bg-<hue>-500/60` in dark.
   */
  blob: string;
};

/**
 * Single source of truth for the set of registered palette names.
 * Iterated by the dev preview + visual regression harness so new palettes
 * flow into both automatically.
 */
export const HERO_PALETTE_NAMES = [
  "faculty",
  "principal",
  "hod",
  "tpo",
  "clerk",
  "student",
  "parent",
  "staff",
] as const;

/**
 * Named palettes shipped by the app. Derived from `HERO_PALETTE_NAMES` so the
 * union and the runtime list can never drift apart. Adding a new role means
 * adding one string to the array — TypeScript will then flag `HERO_PALETTES`
 * until the matching palette entry exists.
 */
export type HeroPaletteName = (typeof HERO_PALETTE_NAMES)[number];

/** Runtime guard — narrow a `string` to a `HeroPaletteName`. */
export function isHeroPaletteName(value: unknown): value is HeroPaletteName {
  return (
    typeof value === "string" &&
    (HERO_PALETTE_NAMES as readonly string[]).includes(value)
  );
}

/**
 * The canonical palette map. Keys are `HeroPaletteName` values so TypeScript
 * fails the build if a role is added to the union without a matching entry
 * (and vice versa). Dark values sit right next to their light siblings in
 * each class string.
 */
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

/**
 * Typography + surface tokens shared across every hero banner.
 *
 * Tweak values here to re-tune the greeting rhythm globally — every portal
 * dashboard picks up the change on the next render. Text stays white in both
 * themes; the darker gradient stops in each palette dim the surface itself.
 *
 * ### Field guide
 *
 * | Key         | Rendered as                                | Change to…                          |
 * | ----------- | ------------------------------------------ | ----------------------------------- |
 * | `eyebrow`   | Uppercase "MONDAY 13 JULY · FACULTY" line  | Adjust date/role line size + tracking |
 * | `heading`   | "Good evening, Dr. Kumar 👋"               | Adjust greeting font-size / weight  |
 * | `subtitle`  | Free-form line below the greeting          | Adjust body text under the greeting |
 * | `statValue` | Big number in each stat tile               | Resize the tile numerals            |
 * | `statLabel` | Uppercase caption under each stat value    | Resize the tile captions            |
 * | `blobLayer` | Wrapper for the two blur blobs             | Change decorative blob intensity    |
 * | `statTile`  | The rounded surface each stat sits on      | Change tile padding / border tone   |
 *
 * ### Example — make headings a touch larger on desktop
 *
 * ```ts
 * heading:
 *   "mt-1.5 font-extrabold text-white leading-tight tracking-tight " +
 *   "drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] dark:drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] " +
 *   "text-[clamp(1.35rem,4.5vw,2rem)] sm:text-4xl break-words", // ← was sm:text-3xl
 * ```
 *
 * ### Example — softer stat tiles in dark mode
 *
 * ```ts
 * statTile:
 *   "bg-white/10 dark:bg-white/[0.03] backdrop-blur-sm rounded-lg " + // ← dimmer dark surface
 *   "px-3 py-2 sm:px-4 sm:py-3 border border-white/15 dark:border-white/5 text-center min-w-[70px]",
 * ```
 *
 * Reminder: keep every class string as a single literal — do not build class
 * names by interpolation, or Tailwind v4 will silently drop them at build.
 */
export const HERO_TYPOGRAPHY = {
  eyebrow:
    "text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.22em] font-semibold truncate",
  heading:
    "mt-1.5 font-extrabold text-white leading-tight tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] dark:drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] text-[clamp(1.35rem,4.5vw,2rem)] sm:text-3xl break-words",
  subtitle: "mt-2 text-[13px] sm:text-sm text-white/95 dark:text-white/85 leading-relaxed",
  statValue: "text-lg sm:text-2xl font-bold text-white leading-none",
  statLabel: "text-[9px] sm:text-[10px] uppercase tracking-wider text-white/80 dark:text-white/70 mt-1",
  /** Decorative blob wrapper opacity — softer in dark to avoid hot glow. */
  blobLayer: "absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none",
  /** Stat tile surface tuning per theme. */
  statTile:
    "bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 sm:px-4 sm:py-3 border border-white/15 dark:border-white/10 text-center min-w-[70px]",
} as const;

/**
 * Look up a registered palette by name. The `HeroBanner` prop is typed as
 * `HeroPaletteName`, so callers can only pass one of the registered names —
 * inline `HeroPalette` objects are intentionally rejected at compile time so
 * every dashboard uses the shared design tokens.
 *
 * ```tsx
 * <HeroBanner palette="faculty" ... />   // ✅ named token
 * <HeroBanner palette="banana"  ... />   // ✗ Type '"banana"' is not assignable
 * ```
 *
 * If you need a truly one-off look, add the palette to `HERO_PALETTES` first
 * (with an entry in `HERO_PALETTE_NAMES`) rather than passing raw classes.
 */
export function resolveHeroPalette(name: HeroPaletteName): HeroPalette {
  return HERO_PALETTES[name];
}
