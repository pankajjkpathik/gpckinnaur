# Portal Hero Tokens

The gradient banner at the top of every dashboard (`<HeroBanner />`) is
driven by two tables in `hero-tokens.ts`:

- **`HERO_PALETTES`** — one entry per role (colours, gradients, blob tint).
- **`HERO_TYPOGRAPHY`** — the greeting/eyebrow/stat text sizing shared by
  every palette.

Both are plain Tailwind class strings, so the visual language lives in one
file and every portal picks up the changes automatically.

## Preview & tests

- Live preview: [`/dev/hero-preview`](../../routes/dev.hero-preview.tsx) —
  toggles for **Dark**, **Stats**, and **Long name**.
- Visual regression: `node tests/visual/hero-banner.mjs [--check]`
  (48 screenshots: 8 palettes × 3 viewports × 2 themes).

## Cookbook

### Add a new role palette

1. Extend the `HeroPaletteName` union with the new key.
2. Add a matching entry to `HERO_PALETTES` (TypeScript enforces this — the
   build fails if either side is missing).
3. Pass the new name into `HeroBanner`:

```tsx
<HeroBanner palette="librarian" name={me.name} role="Librarian" />
```

### Tweak an existing palette

Edit that one entry in `HERO_PALETTES`. Keep the `dark:` twins next to their
light siblings inside the **same string** — Tailwind v4's scanner only ships
classes it can see verbatim, so anything built by interpolation
(`` `text-${hue}-300` ``) will silently disappear.

### Resize the greeting across every dashboard

Edit `HERO_TYPOGRAPHY.heading` — every banner re-renders on the next build.
The heading uses `text-[clamp(1.35rem,4.5vw,2rem)] sm:text-3xl` today; bump
the `sm:text-*` step to grow it on desktop only.

### One-off palette override (avoid unless truly one-off)

`HeroBanner`'s `palette` prop also accepts a full `HeroPalette` object,
handy for prototyping — but prefer named tokens so future refactors reach
every call site.

```tsx
<HeroBanner
  palette={{
    gradient: "from-[#111] via-[#222] to-[#000] dark:from-[#000] dark:via-[#111] dark:to-[#000]",
    nameColor: "text-emerald-300 dark:text-emerald-200",
    eyebrowColor: "text-emerald-200/90 dark:text-emerald-100/90",
    metaColor: "text-emerald-200 dark:text-emerald-100",
    blob: "bg-emerald-400 dark:bg-emerald-500/60",
  }}
  name={me.name}
/>
```

## Contrast target

Text sits on the **darkest** stop of the gradient. Aim for ≥ 4.5:1 for both
the white greeting and the highlighted `nameColor` against every stop, in
both themes. The current palettes clear 6:1 comfortably; verify new
palettes with the Playwright harness above (any pixel change is surfaced as
a diff, so contrast regressions get caught alongside layout shifts).

## Palette table (today)

| Name        | Light gradient span             | Name accent           | Blob        |
| ----------- | ------------------------------- | --------------------- | ----------- |
| `faculty`   | maroon → deep maroon → near-black | amber-300             | orange-300  |
| `principal` | indigo → violet → indigo-950      | amber-300             | amber-300   |
| `hod`       | emerald → emerald-900 → near-black | lime-300             | lime-300    |
| `tpo`       | cyan-700 → cyan-800 → slate-900   | cyan-200              | cyan-300    |
| `clerk`     | amber-700 → brown → deep brown    | yellow-200            | yellow-300  |
| `student`   | violet → violet-900 → violet-950  | fuchsia-200           | fuchsia-400 |
| `parent`    | emerald-700 → emerald-800 → forest | lime-200             | emerald-300 |
| `staff`     | slate-900 → slate-800 → near-black | sky-300              | sky-400     |

If this table drifts from `HERO_PALETTES`, the tokens file wins — update
this row.
