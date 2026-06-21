import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

type Item = { label: string; to?: string; children?: { label: string; to: string }[] };

const items: Item[] = [
  { label: "Home", to: "/" },
  {
    label: "About",
    children: [
      { label: "Institute", to: "/about" },
      { label: "AICTE Approval", to: "/about" },
      { label: "HPTSB Affiliation", to: "/about" },
    ],
  },
  {
    label: "Departments",
    children: [
      { label: "Civil Engineering", to: "/departments/1" },
      { label: "Mechanical Engineering", to: "/departments/2" },
    ],
  },
  { label: "Admission", to: "/admissions" },
  {
    label: "Staff",
    children: [
      { label: "Faculty", to: "/staff/faculty" },
      { label: "Non-Teaching Staff", to: "/staff/non-teaching" },
      { label: "Admin Staff", to: "/staff/admin" },
      { label: "Committees", to: "/staff/committees" },
    ],
  },
  { label: "Anti-Ragging", to: "/anti-ragging" },
  {
    label: "Alumni",
    children: [
      { label: "Our Alumni", to: "/alumni" },
      { label: "Alumni Registration", to: "/alumni/register" },
    ],
  },
  {
    label: "RTI",
    children: [
      { label: "RTI Home", to: "/about" },
      { label: "RTI Act 2005", to: "/about" },
      { label: "Mandatory Disclosure", to: "/about" },
      { label: "Section 4(1)B", to: "/about" },
      { label: "Suo-moto Disclosure", to: "/about" },
    ],
  },
  { label: "Contact", to: "/contact" },
];

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [staff, setStaff] = useState<{ username: string } | null>(null);
  const [student, setStudent] = useState<{ name: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    import("@/lib/auth.functions").then(async ({ staffMe, studentMe }) => {
      const s = await staffMe().catch(() => null);
      const st = await studentMe().catch(() => null);
      setStaff(s as any);
      setStudent(st as any);
    });
  }, []);

  const isActive = (to?: string) => to && (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <nav className="bg-[color:var(--navy)] text-white sticky top-0 z-40 shadow">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <ul className="hidden lg:flex items-center">
          {items.map((it) => (
            <li key={it.label} className="relative group">
              {it.to ? (
                <Link
                  to={it.to}
                  className={`block px-3 py-3 text-sm font-medium hover:bg-white/10 ${
                    isActive(it.to) ? "bg-[color:var(--gold)] text-[color:var(--navy)]" : ""
                  }`}
                >
                  {it.label}
                </Link>
              ) : (
                <button className="px-3 py-3 text-sm font-medium hover:bg-white/10 flex items-center gap-1">
                  {it.label} <ChevronDown className="w-3 h-3" />
                </button>
              )}
              {it.children && (
                <ul className="hidden group-hover:block absolute top-full left-0 bg-white text-[color:var(--navy)] min-w-[220px] shadow-lg rounded-b-md overflow-hidden">
                  {it.children.map((c) => (
                    <li key={c.label}>
                      <Link
                        to={c.to}
                        className="block px-4 py-2 text-sm hover:bg-[color:var(--accent)]"
                      >
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        <button
          className="lg:hidden py-3"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>

        <div className="flex items-center gap-2 py-2">
          {student ? (
            <Link
              to="/student-dashboard"
              className="px-3 py-1.5 text-xs sm:text-sm rounded-md bg-[color:var(--student)] hover:opacity-90 font-medium"
            >
              My Portal
            </Link>
          ) : (
            <Link
              to="/student-login"
              className="px-3 py-1.5 text-xs sm:text-sm rounded-md bg-[color:var(--gold)] text-[color:var(--navy)] hover:opacity-90 font-semibold"
            >
              Student Portal
            </Link>
          )}
          {staff ? (
            <Link
              to="/staff-dashboard"
              className="px-3 py-1.5 text-xs sm:text-sm rounded-md border border-white/60 hover:bg-white/10"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/staff-login"
              className="px-3 py-1.5 text-xs sm:text-sm rounded-md border border-white/60 hover:bg-white/10"
            >
              Staff Login
            </Link>
          )}
        </div>
      </div>

      {mobileOpen && (
        <ul className="lg:hidden border-t border-white/10 pb-2">
          {items.map((it) => (
            <li key={it.label}>
              {it.to ? (
                <Link
                  to={it.to}
                  className="block px-4 py-2 text-sm hover:bg-white/10"
                  onClick={() => setMobileOpen(false)}
                >
                  {it.label}
                </Link>
              ) : (
                <details>
                  <summary className="px-4 py-2 text-sm cursor-pointer">{it.label}</summary>
                  {it.children?.map((c) => (
                    <Link
                      key={c.to}
                      to={c.to}
                      className="block pl-8 pr-4 py-2 text-sm hover:bg-white/10"
                      onClick={() => setMobileOpen(false)}
                    >
                      {c.label}
                    </Link>
                  ))}
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
