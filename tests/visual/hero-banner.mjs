#!/usr/bin/env node
/**
 * Visual regression harness for HeroBanner.
 *
 * Loads /dev/hero-preview and screenshots each palette card at three common
 * viewport widths (mobile / tablet / desktop) for both light and dark themes.
 *
 * Usage:
 *   node tests/visual/hero-banner.mjs           # write baselines
 *   node tests/visual/hero-banner.mjs --check   # compare against baselines
 *
 * Baselines land in tests/visual/__baselines__/hero-banner/ and diffs (only
 * created in --check mode when a screenshot changes) land in
 * tests/visual/__diffs__/hero-banner/. Diffs are pixel-level: byte-identical
 * files pass; any change is surfaced as a failure with the offending path.
 *
 * The dev server on http://localhost:8080 must already be running.
 */
import { chromium } from "playwright";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_DIR = join(__dirname, "__baselines__", "hero-banner");
const DIFF_DIR = join(__dirname, "__diffs__", "hero-banner");
const CHECK = process.argv.includes("--check");
const URL_BASE = process.env.PREVIEW_URL ?? "http://localhost:8080";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 900 },
  { name: "tablet", width: 820, height: 1100 },
  { name: "desktop", width: 1280, height: 1400 },
];

const PALETTES = [
  "faculty",
  "principal",
  "hod",
  "tpo",
  "clerk",
  "student",
  "parent",
  "staff",
];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

async function run() {
  await mkdir(BASE_DIR, { recursive: true });
  if (CHECK) await mkdir(DIFF_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const written = [];

  try {
    for (const theme of ["light", "dark"]) {
      for (const vp of VIEWPORTS) {
        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
        });
        const page = await ctx.newPage();
        const url = `${URL_BASE}/dev/hero-preview`;
        await page.goto(url, { waitUntil: "networkidle" });

        if (theme === "dark") {
          await page.evaluate(() => {
            const cb = document.querySelector(
              'header input[type="checkbox"]',
            );
            if (cb && !cb.checked) cb.click();
          });
          await page.waitForTimeout(150);
        }

        // Section that matches this viewport width (nearest available).
        // The preview page renders three fixed widths regardless of viewport,
        // so we screenshot the section whose data-viewport most closely
        // matches the current viewport width.
        const targetWidth =
          vp.width <= 500 ? 375 : vp.width <= 900 ? 768 : 1280;

        for (const palette of PALETTES) {
          const selector = `section[data-viewport="${targetWidth}"] div[data-palette="${palette}"]`;
          const el = await page.locator(selector).first();
          await el.waitFor({ state: "visible", timeout: 5000 });
          const buf = await el.screenshot({ animations: "disabled" });
          const name = `${theme}-${vp.name}-${palette}.png`;
          const basePath = join(BASE_DIR, name);

          if (!CHECK) {
            await writeFile(basePath, buf);
            written.push(name);
          } else if (!(await exists(basePath))) {
            failures.push(`missing baseline: ${name} (run without --check)`);
          } else {
            const baseline = await readFile(basePath);
            if (!(await bytesEqual(baseline, buf))) {
              const diffPath = join(DIFF_DIR, name);
              await writeFile(diffPath, buf);
              failures.push(`changed: ${name} → ${diffPath}`);
            }
          }
        }

        await ctx.close();
      }
    }
  } finally {
    await browser.close();
  }

  if (CHECK) {
    if (failures.length) {
      console.error(`✗ ${failures.length} visual regression(s):`);
      for (const f of failures) console.error("  " + f);
      process.exit(1);
    }
    console.log(
      `✓ hero-banner: ${VIEWPORTS.length * PALETTES.length * 2} screenshots match baselines`,
    );
  } else {
    console.log(`✓ wrote ${written.length} baselines to ${BASE_DIR}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
