import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut, ArrowLeft, MessageSquare, FileSpreadsheet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { staffLogout } from "@/lib/auth.functions";
import { unreadCount } from "@/lib/messages.functions";

export function portalMeta(title: string) {
  return {
    meta: [
      { title: `${title} — GP Kinnaur` },
      { name: "description", content: `${title} — internal portal page at Government Polytechnic, Kinnaur.` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  };
}

// Three subtle, professional color schemes — one per audience.
export type PortalScheme = "principal" | "staff" | "student";

const schemeStyles: Record<PortalScheme, { accent: string; chip: string; emoji: string; label: string; iconBg: string }> = {
  principal: {
    accent: "border-t-4 border-indigo-700",
    iconBg: "bg-indigo-100 text-indigo-700",
    chip: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    emoji: "🏛️",
    label: "Leadership",
  },
  staff: {
    accent: "border-t-4 border-teal-600",
    iconBg: "bg-teal-100 text-teal-700",
    chip: "bg-teal-100 text-teal-800 border border-teal-200",
    emoji: "👔",
    label: "Staff",
  },
  student: {
    accent: "border-t-4 border-emerald-600",
    iconBg: "bg-emerald-100 text-emerald-700",
    chip: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    emoji: "🎓",
    label: "Student",
  },
};

// Legacy accent → scheme mapping (keeps existing callers working).
const accentToScheme: Record<string, PortalScheme> = {
  navy: "principal",
  indigo: "staff",
  teal: "staff",
  rose: "staff",
  amber: "staff",
};

export function PortalShell({
  title,
  subtitle,
  me,
  accent,
  scheme,
  children,
}: {
  title: string;
  subtitle?: string;
  me: { username: string; role: string; department: string | null };
  accent?: "navy" | "teal" | "indigo" | "rose" | "amber";
  scheme?: PortalScheme;
  children: ReactNode;
}) {
  const resolved: PortalScheme = scheme ?? (accent ? accentToScheme[accent] : "staff");
  const s = schemeStyles[resolved];

  async function logout() {
    await staffLogout({});
    window.location.href = "/";
  }
  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      <header className={`${s.bg} text-white shadow-sm`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-xl shrink-0" aria-hidden>
              {s.emoji}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">{subtitle ?? `GP Kinnaur · ${s.label}`}</p>
              <h1 className="text-lg font-bold truncate">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${s.chip} uppercase tracking-wider`}>
              <span aria-hidden>👤</span>
              {me.username.toUpperCase()} · {me.role.replace(/_/g, " ").toUpperCase()}
            </span>
            <Link to="/staff-reports" className="text-xs px-3 py-1.5 border border-white/30 hover:bg-white/10 rounded inline-flex items-center gap-1" title="Report Templates">
              <FileSpreadsheet className="w-3 h-3" /> <span className="hidden sm:inline">Reports</span>
            </Link>
            <MessagesLink />
            <Link to="/staff-dashboard" className="text-xs px-3 py-1.5 border border-white/30 hover:bg-white/10 rounded inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Dashboard
            </Link>
            <button onClick={logout} className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded inline-flex items-center gap-1">
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

function MessagesLink() {
  const { data } = useQuery({ queryKey: ["msg-unread"], queryFn: () => unreadCount(), refetchInterval: 30000, retry: false });
  const n = data?.count ?? 0;
  return (
    <Link to="/messages" className="text-xs px-3 py-1.5 border border-white/30 hover:bg-white/10 rounded inline-flex items-center gap-1 relative">
      <MessageSquare className="w-3 h-3" /> Messages
      {n > 0 && <span className="bg-rose-500 text-white text-[10px] rounded-full px-1.5 ml-1">{n}</span>}
    </Link>
  );
}

export function PortalCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white border rounded-lg shadow-sm ${className}`}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-bold text-[color:var(--navy)]">{children}</h2>
      {action}
    </div>
  );
}
