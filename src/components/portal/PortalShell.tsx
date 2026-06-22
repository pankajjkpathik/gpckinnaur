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

export function PortalShell({
  title,
  subtitle,
  me,
  accent = "navy",
  children,
}: {
  title: string;
  subtitle?: string;
  me: { username: string; role: string; department: string | null };
  accent?: "navy" | "teal" | "indigo" | "rose" | "amber";
  children: ReactNode;
}) {
  const accentBg: Record<string, string> = {
    navy: "bg-[color:var(--navy)]",
    teal: "bg-teal-700",
    indigo: "bg-indigo-700",
    rose: "bg-rose-700",
    amber: "bg-amber-600",
  };
  async function logout() {
    await staffLogout({});
    window.location.href = "/";
  }
  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      <header className={`${accentBg[accent]} text-white`}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-white/70">{subtitle ?? "GP Kinnaur Portal"}</p>
            <h1 className="text-lg font-bold truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-white/80 hidden sm:inline">
              {me.username} · {me.role}
            </span>
            <Link to="/staff-reports" className="text-xs px-3 py-1.5 border border-white/40 rounded inline-flex items-center gap-1" title="Report Templates">
              <FileSpreadsheet className="w-3 h-3" /> <span className="hidden sm:inline">Reports</span>
            </Link>
            <MessagesLink />
            <Link to="/staff-dashboard" className="text-xs px-3 py-1.5 border border-white/40 rounded inline-flex items-center gap-1">
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
    <Link to="/messages" className="text-xs px-3 py-1.5 border border-white/40 rounded inline-flex items-center gap-1 relative">
      <MessageSquare className="w-3 h-3" /> Messages
      {n > 0 && <span className="bg-rose-500 text-white text-[10px] rounded-full px-1.5 ml-1">{n}</span>}
    </Link>
  );
}



export function PortalCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white border rounded-lg ${className}`}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-bold text-[color:var(--navy)]">{children}</h2>
      {action}
    </div>
  );
}
