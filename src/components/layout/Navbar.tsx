import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPortalHome = pathname === "/";

  return (
    <nav className="bg-[color:var(--navy)] text-white sticky top-0 z-40 shadow">
      <div className="container mx-auto px-4 flex items-center justify-between py-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/85 hover:text-[color:var(--gold)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Institute Portal
        </Link>
        {!isPortalHome && (
          <div className="hidden md:flex items-center gap-2 text-xs">
            <Link
              to="/student-login"
              className="px-3 py-1.5 rounded-md bg-[color:var(--gold)] text-[color:var(--navy-dark)] font-semibold hover:opacity-90"
            >
              Student Login
            </Link>
            <Link
              to="/staff-login"
              className="px-3 py-1.5 rounded-md border border-white/40 hover:bg-white/10"
            >
              Staff Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
