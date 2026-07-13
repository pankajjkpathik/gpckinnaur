#!/usr/bin/env node
/**
 * Navigation regression test.
 *
 * Verifies that every top-bar / dashboard link surfaced from the shared
 * portal shell (and each per-role portal header) points at a route file
 * that actually exists under src/routes/. This catches regressions where
 * a nav link is edited/renamed but the target route is missing, so the
 * "Dashboard", "Messages", "Reports", "Profile" (etc.) buttons don't 404
 * after future edits.
 *
 * Run: `node tests/nav-links.test.mjs`
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ROUTES_DIR = resolve(ROOT, "src/routes");

/* ---------- helpers ---------- */

/** Convert a URL path like "/hod" or "/staff-profile" to candidate
 *  route filenames under src/routes/. TanStack Start allows either
 *  dot-separated or nested folders; index.tsx maps to "/". */
function routeFileCandidates(urlPath) {
  const clean = urlPath.replace(/^\/+/, "").replace(/\/+$/, "");
  if (clean === "") {
    return ["index.tsx", "index.ts"];
  }
  const dotted = clean.replace(/\//g, ".");
  return [
    `${dotted}.tsx`,
    `${dotted}.ts`,
    `${dotted}/index.tsx`,
    `${dotted}/index.ts`,
    `${clean}.tsx`,
    `${clean}.ts`,
    `${clean}/index.tsx`,
    `${clean}/index.ts`,
  ];
}

function routeExists(urlPath) {
  return routeFileCandidates(urlPath).some((f) =>
    existsSync(resolve(ROUTES_DIR, f)),
  );
}

/** Extract all string literals passed to `to="..."` or `href="..."` from a
 *  source file. Ignores dynamic expressions (`to={...}`). */
function extractStaticLinks(source) {
  const out = new Set();
  const re = /\b(?:to|href)\s*=\s*"(\/[A-Za-z0-9._\-/]*)"/g;
  let m;
  while ((m = re.exec(source)) !== null) out.add(m[1]);
  return [...out];
}

/* ---------- test cases ---------- */

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const shellPath = resolve(ROOT, "src/components/portal/PortalShell.tsx");
const shellSrc = readFileSync(shellPath, "utf8");

test("PortalShell top-bar static links all resolve to real routes", () => {
  const links = extractStaticLinks(shellSrc).filter(
    (p) => p.startsWith("/") && !p.startsWith("//"),
  );
  assert(links.length > 0, "no <Link to='/…'> found in PortalShell");

  // These are the top-bar destinations we ship today. If one is removed,
  // update the list below intentionally.
  const REQUIRED = ["/staff-reports", "/messages", "/staff-profile"];
  for (const req of REQUIRED) {
    assert(
      links.includes(req),
      `PortalShell no longer links to expected top-bar route ${req}`,
    );
  }

  const missing = links.filter((p) => !routeExists(p));
  assert(
    missing.length === 0,
    `PortalShell links point to missing routes: ${missing.join(", ")}`,
  );
});

test("PortalShell dashboardHref() targets all exist", () => {
  // Mirror src/components/portal/PortalShell.tsx :: dashboardHref.
  // Update BOTH places together on purpose — that's the whole point of
  // this test.
  const ROLE_TARGETS = {
    principal: "/principal",
    super_admin: "/admin",
    hod: "/hod",
    tpo: "/tpo",
    clerk: "/clerk",
    faculty: "/faculty",
    default: "/staff-dashboard",
  };
  const missing = Object.entries(ROLE_TARGETS).filter(
    ([, target]) => !routeExists(target),
  );
  assert(
    missing.length === 0,
    `dashboardHref role targets missing route files: ${missing
      .map(([r, t]) => `${r}→${t}`)
      .join(", ")}`,
  );

  // Ensure the source still references every mapped path — catches a rename
  // in PortalShell that skipped a role branch.
  for (const [role, target] of Object.entries(ROLE_TARGETS)) {
    if (role === "default") continue;
    assert(
      shellSrc.includes(`"${target}"`),
      `dashboardHref in PortalShell no longer references ${target} for role ${role}`,
    );
  }
});

test("Per-portal header top-bar links resolve", () => {
  // Files that render their own top header (not the shared PortalShell).
  const files = ["hod.tsx", "principal.tsx", "tpo.tsx", "clerk.tsx"];
  const problems = [];
  for (const f of files) {
    const p = resolve(ROUTES_DIR, f);
    if (!existsSync(p)) continue;
    const src = readFileSync(p, "utf8");
    const links = extractStaticLinks(src).filter(
      (l) => l.startsWith("/") && !l.startsWith("//"),
    );
    for (const l of links) {
      // Ignore known external / non-app paths.
      if (l.startsWith("/__")) continue;
      if (!routeExists(l)) problems.push(`${f}: ${l}`);
    }
  }
  assert(
    problems.length === 0,
    `Portal headers link to missing routes: ${problems.join(" · ")}`,
  );
});

test("src/routes/ contains the four role portals we ship", () => {
  const need = ["hod.tsx", "principal.tsx", "tpo.tsx", "clerk.tsx"];
  const present = readdirSync(ROUTES_DIR);
  const missing = need.filter((n) => !present.includes(n));
  assert(
    missing.length === 0,
    `role portal files missing: ${missing.join(", ")}`,
  );
});

/* ---------- report ---------- */

const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;

for (const r of results) {
  if (r.ok) console.log(`  ok  ${r.name}`);
  else console.log(`  FAIL  ${r.name}\n        ${r.error}`);
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
