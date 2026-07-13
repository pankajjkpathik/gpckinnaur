// Storybook-style preview route for the shared HeroBanner component.
// Renders every palette across three container widths (mobile / tablet / desktop)
// on both light and dark surfaces so typography, spacing, wrapping, and colour
// contrast can be eyeballed — and screenshotted by the Playwright script in
// tests/visual/hero-banner.mjs — in a single scroll.
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

const WIDTHS: { label: string; px: number }[] = [
  { label: "Mobile · 375", px: 375 },
  { label: "Tablet · 768", px: 768 },
  { label: "Desktop · 1280", px: 1280 },
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
          {PALETTES.length} palettes × {WIDTHS.length} widths
        </p>
        <div className="ml-auto flex items-center gap-2 text-xs">
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

      <main className="p-4 sm:p-6 space-y-10">
        {WIDTHS.map((w) => (
          <section key={w.px} data-viewport={w.px}>
            <h2 className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-3">
              {w.label}px
            </h2>
            <div className="space-y-4 overflow-x-auto">
              {PALETTES.map((name) => (
                <div
                  key={name}
                  data-palette={name}
                  data-width={w.px}
                  style={{ width: w.px, maxWidth: "100%" }}
                  className="mx-auto"
                >
                  <p className="text-[11px] font-mono opacity-60 mb-1">{name}</p>
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
                </div>
              ))}
            </div>
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
