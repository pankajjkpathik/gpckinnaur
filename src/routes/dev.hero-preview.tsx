// Storybook-style preview route for the shared HeroBanner component.
// Renders every palette on one page so typography, spacing, wrapping, and
// colour contrast can be eyeballed — and screenshotted by the Playwright
// script in tests/visual/hero-banner.mjs — across common viewport sizes.
//
// Each palette renders at the full container width because HeroBanner uses
// viewport-based Tailwind breakpoints (`sm:` = 640px viewport), not container
// queries; the harness sets the actual browser viewport to mobile / tablet /
// desktop widths and this page fills whatever it's given.
//
// Not linked from the app nav; visit /dev/hero-preview directly.

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeroBanner, type HeroPaletteName } from "@/components/portal/HeroBanner";

export const Route = createFileRoute("/dev/hero-preview")({
  head: () => ({
    meta: [
      { title: "HeroBanner Preview" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: HeroPreviewPage,
});

const PALETTES: HeroPaletteName[] = [
  "faculty",
  "principal",
  "hod",
  "tpo",
  "clerk",
  "student",
  "parent",
  "staff",
];

const SAMPLE_NAMES: Record<HeroPaletteName, string> = {
  faculty: "Dr. Rajesh Kumar",
  principal: "Prof. Anita Sharma",
  hod: "Dr. Meera Patel",
  tpo: "Mr. Vikram Joshi",
  clerk: "Ms. Kavita Rao",
  student: "Aarav Singh",
  parent: "Mr. Ramesh Verma",
  staff: "Mr. Suresh Kumar",
};

const SAMPLE_STATS = [
  { value: "12", label: "Classes" },
  { value: "4", label: "Pending" },
  { value: "98%", label: "Attendance" },
];

function HeroPreviewPage() {
  const [dark, setDark] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [longName, setLongName] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    return () => root.classList.remove("dark");
  }, [dark]);

  return (
    <div
      className={
        dark
          ? "min-h-dvh bg-slate-950 text-slate-100"
          : "min-h-dvh bg-slate-50 text-slate-900"
      }
    >
      <header
        className={`sticky top-0 z-10 border-b px-4 py-3 flex flex-wrap items-center gap-3 ${
          dark ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-200"
        } backdrop-blur`}
      >
        <h1 className="text-sm font-semibold">HeroBanner Preview</h1>
        <p className="text-xs opacity-70">
          {PALETTES.length} palettes · viewport-driven layout
        </p>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={dark}
              onChange={(e) => setDark(e.target.checked)}
            />
            Dark
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showStats}
              onChange={(e) => setShowStats(e.target.checked)}
            />
            Stats
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={longName}
              onChange={(e) => setLongName(e.target.checked)}
            />
            Long name
          </label>
        </div>
      </header>

      <main className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
        {PALETTES.map((name) => (
          <section key={name} data-palette={name}>
            <p className="text-[11px] font-mono opacity-60 mb-1.5">{name}</p>
            <HeroBanner
              palette={name}
              name={
                longName
                  ? `${SAMPLE_NAMES[name]} Chandrashekhar-Balasubramanian`
                  : SAMPLE_NAMES[name]
              }
              role={roleFor(name)}
              subtitle="Here's your snapshot for today — quick, calm, and to the point."
              stats={showStats ? SAMPLE_STATS : undefined}
            />
          </section>
        ))}
      </main>
    </div>
  );
}

function roleFor(p: HeroPaletteName): string {
  switch (p) {
    case "faculty":
      return "Assistant Professor";
    case "principal":
      return "Principal";
    case "hod":
      return "HOD · Computer Science";
    case "tpo":
      return "Training & Placement Officer";
    case "clerk":
      return "Office Clerk";
    case "student":
      return "B.Tech · Year 3";
    case "parent":
      return "Parent";
    case "staff":
      return "Staff";
  }
}
