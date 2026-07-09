import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, GraduationCap, ShieldCheck, Users } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GP Kinnaur — Institute Portal" },
      {
        name: "description",
        content:
          "Secure institute portal for Government Polytechnic, Kinnaur — access for students, parents and staff.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "GP Kinnaur — Institute Portal" },
      { property: "og:description", content: "Sign in to the GP Kinnaur institute portal." },
    ],
  }),
  component: PortalLanding,
});

const cards = [
  {
    tag: "For Enrolled Students",
    title: "Student Portal",
    desc: "Attendance, results, timetable, assignments & study materials.",
    to: "/student-login",
    icon: GraduationCap,
    tone: "outline",
  },
  {
    tag: "For Parents & Guardians",
    title: "Parent Portal",
    desc: "Track your ward's attendance, performance and notices.",
    to: "/parent-login",
    icon: Users,
    tone: "outline",
  },
  {
    tag: "Principal · HOD · Faculty · TPO · Clerk",
    title: "Staff Portal",
    desc: "Teaching, administration, placements and office operations.",
    to: "/staff-login",
    icon: Briefcase,
    tone: "solid",
  },
] as const;

const bottomLinks: { label: string; to: string; external?: boolean }[] = [
  { label: "Admissions", to: "/admissions" },
  { label: "Contact", to: "/contact" },
  { label: "Anti-Ragging", to: "/anti-ragging" },
  { label: "Mandatory Disclosure", to: "/mandatory-disclosure" },
  { label: "AICTE Approval", to: "/aicte-approval" },
  { label: "HPTSB Affiliation", to: "/hptsb-affiliation" },
  { label: "RTI", to: "/rti" },
  { label: "Grievance", to: "/grievance" },
];

function PortalLanding() {
  return (
    <div
      className="relative min-h-screen text-white overflow-hidden flex flex-col"
      style={{
        background:
          "radial-gradient(circle at 15% 25%, oklch(0.32 0.08 155) 0%, transparent 55%), radial-gradient(circle at 85% 75%, oklch(0.25 0.07 155) 0%, transparent 60%), oklch(0.16 0.05 155)",
      }}
    >
      {/* Diagonal texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 14px)",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoAsset.url}
              alt="GP Kinnaur logo"
              className="w-12 h-12 rounded-full bg-white/95 p-1 object-contain"
            />
            <div className="leading-tight">
              <p className="text-[10px] tracking-[0.22em] font-semibold text-[color:var(--gold)]">
                GOVERNMENT POLYTECHNIC
              </p>
              <p className="text-sm font-bold text-white">
                Kinnaur <span className="text-white/50">·</span>{" "}
                <span className="text-white/85 font-medium">Himachal Pradesh</span>
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-white/75">
            <ShieldCheck className="w-4 h-4 text-[color:var(--gold)]" />
            Secure portal · Authorised users only
          </div>
        </div>
      </header>

      {/* Main split */}
      <main className="relative z-10 flex-1">
        <div className="container mx-auto px-6 py-10 lg:py-20 grid lg:grid-cols-2 gap-14 items-center">
          {/* Left copy */}
          <div>
            <p className="text-[11px] tracking-[0.28em] font-semibold text-[color:var(--gold)] mb-6">
              INSTITUTE PORTAL
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-white">
              Welcome to{" "}
              <span className="italic text-[color:var(--gold)]">GP Kinnaur.</span>
            </h1>
            <p className="mt-6 text-white/70 max-w-md leading-relaxed">
              A single sign-in for the entire institute — attendance, results, timetables,
              assignments, notices and administration. Choose your portal to continue.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm">
              <span className="text-white/80">
                <span className="font-bold text-white">2</span> departments
              </span>
              <span className="w-px h-4 bg-white/25" />
              <span className="text-white/80">
                <span className="font-bold text-white">AICTE</span> approved
              </span>
              <span className="w-px h-4 bg-white/25" />
              <span className="text-white/80">
                <span className="font-bold text-white">HPTSB</span> affiliated
              </span>
            </div>
          </div>

          {/* Right portal cards */}
          <div className="flex flex-col gap-5">
            {cards.map((c) => {
              const solid = c.tone === "solid";
              const base = solid
                ? "bg-[color:var(--gold)] text-[color:var(--navy-dark)] border-[color:var(--gold)]"
                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white";
              return (
                <Link
                  key={c.title}
                  to={c.to}
                  className={`group relative rounded-2xl border ${base} p-5 md:p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] flex items-center gap-5`}
                >
                  <div
                    className={`shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${
                      solid ? "bg-[color:var(--navy-dark)] text-[color:var(--gold)]" : "bg-white/5 text-[color:var(--gold)]"
                    }`}
                  >
                    <c.icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[10px] tracking-[0.2em] font-semibold uppercase ${
                        solid ? "text-[color:var(--navy-dark)]/70" : "text-white/55"
                      }`}
                    >
                      {c.tag}
                    </p>
                    <h3
                      className={`mt-1 text-2xl font-bold ${
                        solid ? "text-[color:var(--navy-dark)]" : "text-[color:var(--gold)]"
                      }`}
                    >
                      {c.title}
                    </h3>
                    <p
                      className={`mt-1 text-sm ${solid ? "text-[color:var(--navy-dark)]/80" : "text-white/65"}`}
                    >
                      {c.desc}
                    </p>
                  </div>
                  <ArrowRight
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1 ${
                      solid ? "text-[color:var(--navy-dark)]" : "text-white/70"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      {/* Bottom strip: public info links */}
      <div className="relative z-10 border-t border-white/10 bg-black/25 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
          {bottomLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-white/70 hover:text-[color:var(--gold)] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="container mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/50">
          <span>© {new Date().getFullYear()} Government Polytechnic, Kinnaur. All rights reserved.</span>
          <span className="text-white/40">Unauthorised access is prohibited.</span>
        </div>
      </footer>
    </div>
  );
}
