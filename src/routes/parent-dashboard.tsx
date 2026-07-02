import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  Shield,
  DollarSign,
  LogOut,
} from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";
import {
  parentMe,
  parentLogout,
  parentAttendance,
  parentMarks,
  parentBoardMarks,
  parentDisciplinary,
  parentFees,
} from "@/lib/parent.functions";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/parent-dashboard")({
  head: () =>
    pageMeta({
      title: "Parent Dashboard — GP Kinnaur",
      description: "Parent Dashboard for Government Polytechnic Kinnaur.",
      path: "/parent-dashboard",
    }),
  component: ParentDashboard,
});

type Tab = "attendance" | "marks" | "board" | "disciplinary" | "fees";

function ParentDashboard() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["parent-me"], queryFn: () => parentMe() });
  const [tab, setTab] = useState<Tab>("attendance");
  useEffect(() => {
    if (!isLoading && !me) nav({ to: "/parent-login" });
  }, [isLoading, me, nav]);
  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  const st: any = me.student ?? {};
  const initials = (st.name || "")
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function logout() {
    await parentLogout({});
    window.location.href = "/";
  }

  const tabs: { key: Tab; label: string; icon: any; color: string }[] = [
    { key: "attendance", label: "Attendance", icon: ClipboardCheck, color: "bg-emerald-600" },
    { key: "marks", label: "Marks", icon: FileSpreadsheet, color: "bg-amber-500" },
    { key: "board", label: "Board Marks", icon: GraduationCap, color: "bg-indigo-600" },
    { key: "disciplinary", label: "Disciplinary Actions", icon: Shield, color: "bg-rose-600" },
    { key: "fees", label: "Fees Payment", icon: DollarSign, color: "bg-teal-600" },
  ];

  return (
    <div className="min-h-screen bg-emerald-50/40">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logoAsset.url} alt="GPK" className="w-10 h-10 rounded-full bg-white p-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-700">GP Kinnaur · Parent</p>
              <p className="font-bold text-gray-800">Parent Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link to="/messages" className="hidden sm:inline px-3 py-1.5 rounded border hover:bg-gray-50 text-xs text-gray-600">
              Messages
            </Link>
            <button onClick={logout} className="px-3 py-1.5 rounded border hover:bg-gray-50 text-xs text-gray-600 inline-flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
            {st.image_url ? (
              <img src={st.image_url} alt={st.name} className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500/40" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">{initials}</div>
            )}
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider text-gray-700">
              {st.name?.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white border rounded-lg p-5 mb-5">
          <p className="text-xs uppercase tracking-wider text-emerald-700 font-semibold">Viewing records for</p>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{st.name?.toUpperCase()}</h1>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">
            {st.enrollment_no} · {st.branch}-Sem{st.semester}
            {st.father_name ? ` · Father: ${st.father_name}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`p-3 rounded-lg border text-left transition-shadow ${
                tab === t.key
                  ? "bg-white border-emerald-500 shadow-md"
                  : "bg-white/70 border-transparent hover:shadow-sm"
              }`}
            >
              <span className={`inline-flex w-8 h-8 rounded ${t.color} text-white items-center justify-center mb-1.5`}>
                <t.icon className="w-4 h-4" />
              </span>
              <p className="text-xs font-semibold text-gray-800">{t.label}</p>
            </button>
          ))}
        </div>

        <div className="bg-white border rounded-lg p-5">
          {tab === "attendance" && <AttTab />}
          {tab === "marks" && <MarksTab />}
          {tab === "board" && <BoardTab />}
          {tab === "disciplinary" && <DiscTab />}
          {tab === "fees" && <FeesTab />}
        </div>
      </div>
    </div>
  );
}

function AttTab() {
  const q = useQuery({ queryKey: ["parent-att"], queryFn: () => parentAttendance() });
  const data = q.data ?? { by_subject: [], records: [] };
  const total = data.by_subject.reduce((s: number, x: any) => s + x.total, 0);
  const present = data.by_subject.reduce((s: number, x: any) => s + x.present, 0);
  const pct = total ? Math.round((present / total) * 100) : 0;
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-2">📊 Attendance</h2>
      <p className="text-3xl font-bold text-emerald-700 mb-4">{pct}% overall</p>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="text-left px-4 py-2 text-gray-500 font-medium">Subject</th>
            <th className="text-left px-4 py-2 text-gray-500 font-medium">Present</th>
            <th className="text-left px-4 py-2 text-gray-500 font-medium">Total</th>
            <th className="text-left px-4 py-2 text-gray-500 font-medium">%</th>
          </tr></thead>
          <tbody>
            {data.by_subject.map((s: any) => (
              <tr key={s.code} className="border-t">
                <td className="px-4 py-2">{s.code} <span className="text-gray-400 text-xs">— {s.name}</span></td>
                <td className="px-4 py-2">{s.present}</td>
                <td className="px-4 py-2">{s.total}</td>
                <td className={`px-4 py-2 font-semibold ${s.pct < 75 ? "text-rose-600" : "text-emerald-700"}`}>{s.pct}%</td>
              </tr>
            ))}
            {data.by_subject.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No attendance yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MarksTab() {
  const q = useQuery({ queryKey: ["parent-marks"], queryFn: () => parentMarks() });
  const rows = q.data ?? [];
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">📝 Internal Marks (HOD-approved)</h2>
      <MarksTable rows={rows} />
    </div>
  );
}
function BoardTab() {
  const q = useQuery({ queryKey: ["parent-board"], queryFn: () => parentBoardMarks() });
  const rows = q.data ?? [];
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">🎓 Board Marks</h2>
      <MarksTable rows={rows} />
    </div>
  );
}
function MarksTable({ rows }: { rows: any[] }) {
  return (
    <div className="border rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50"><tr>
          <th className="text-left px-4 py-2 text-gray-500 font-medium">Subject</th>
          <th className="text-left px-4 py-2 text-gray-500 font-medium">Exam</th>
          <th className="text-left px-4 py-2 text-gray-500 font-medium">Marks</th>
          <th className="text-left px-4 py-2 text-gray-500 font-medium">Year</th>
        </tr></thead>
        <tbody>
          {rows.map((r: any, i: number) => (
            <tr key={i} className="border-t">
              <td className="px-4 py-2">{r.subjects?.code} <span className="text-gray-400 text-xs">— {r.subjects?.name}</span></td>
              <td className="px-4 py-2 text-xs capitalize">{String(r.exam_type).replace(/_/g, " ")}</td>
              <td className="px-4 py-2 font-semibold">{r.obtained ?? "—"}<span className="text-gray-400 font-normal"> / {r.max_marks}</span></td>
              <td className="px-4 py-2 text-xs text-gray-500">{r.academic_year}</td>
            </tr>
          ))}
          {rows.length === 0 && (<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No results yet.</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
function DiscTab() {
  const q = useQuery({ queryKey: ["parent-disc"], queryFn: () => parentDisciplinary() });
  const rows = q.data ?? [];
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">🛡️ Disciplinary Actions</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded p-4">No disciplinary actions on record. ✅</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((a: any) => (
            <li key={a.id} className="border rounded p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-800">{a.title}</p>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase">{a.severity}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{a.action_date} {a.resolution_date ? `· Resolved: ${a.resolution_date}` : ""}</p>
              {a.detail && <p className="text-sm text-gray-700 mt-2">{a.detail}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
function FeesTab() {
  const q = useQuery({ queryKey: ["parent-fees"], queryFn: () => parentFees() });
  const rows = q.data ?? [];
  const inr = (n: any) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-4">💰 Fees Payment</h2>
      <div className="border rounded overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="text-left px-4 py-2 text-gray-500 font-medium">Year / Sem</th>
            <th className="text-left px-4 py-2 text-gray-500 font-medium">Total</th>
            <th className="text-left px-4 py-2 text-gray-500 font-medium">Paid</th>
            <th className="text-left px-4 py-2 text-gray-500 font-medium">Balance</th>
            <th className="text-left px-4 py-2 text-gray-500 font-medium">Status</th>
          </tr></thead>
          <tbody>
            {rows.map((r: any) => {
              const bal = Number(r.total_amount || 0) - Number(r.paid_amount || 0);
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{r.academic_year} · Sem {r.semester ?? "—"}</td>
                  <td className="px-4 py-2">{inr(r.total_amount)}</td>
                  <td className="px-4 py-2">{inr(r.paid_amount)}</td>
                  <td className="px-4 py-2 font-semibold">{inr(bal)}</td>
                  <td className="px-4 py-2 text-xs uppercase">
                    <span className={`px-2 py-0.5 rounded ${r.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{r.status ?? (bal <= 0 ? "paid" : "due")}</span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (<tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No fee records available.</td></tr>)}
          </tbody>
        </table>
      </div>
      <Link to="/" className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded font-semibold text-sm">
        Go to Fees Payment Portal →
      </Link>
    </div>
  );
}
