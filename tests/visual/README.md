# Visual Regression: HeroBanner

Storybook-style preview + Playwright screenshot harness for the shared
`HeroBanner` component.

## Preview page

Open `/dev/hero-preview` in the running app. It renders every hero palette
(`faculty`, `principal`, `hod`, `tpo`, `clerk`, `student`, `parent`, `staff`)
at three fixed container widths — **375px**, **768px**, **1280px** — with
toggles for:

- **Dark** — flips `.dark` on `<html>` to preview the dark gradient stops
- **Stats** — hides the right-hand stat tiles to check heading wrapping
- **Long name** — forces a very long user name to check truncation + wrap

Nothing links to this route from the app nav — it's a dev-only surface.

## Screenshot harness

`tests/visual/hero-banner.mjs` drives Playwright over the preview page and
captures **8 palettes × 3 viewports × 2 themes = 48 element screenshots**
per run.

```
node tests/visual/hero-banner.mjs           # (re)write baselines
node tests/visual/hero-banner.mjs --check   # compare against baselines
```

Requires the dev server on `http://localhost:8080`. Set `PREVIEW_URL` to
point at a different origin.

- Baselines: `tests/visual/__baselines__/hero-banner/`
- Diffs (only in `--check`): `tests/visual/__diffs__/hero-banner/`

The comparison is byte-exact: any pixel change fails and writes the current
screenshot into `__diffs__/` for side-by-side inspection. Regenerate the
baseline by re-running the command without `--check` after confirming the
change is intentional.
