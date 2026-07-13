import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus,
  Pencil,
  Upload,
  ArrowUpCircle,
  Download,
  FileSpreadsheet,
  Trash2,
  Users,
  UserPlus,
  Wallet,
  UsersRound,
  Landmark,
  Wrench,
  Beaker,
  User,
  KeyRound,
  Camera,
  Loader2,
  Activity,
  History,
} from "lucide-react";
import * as XLSX from "xlsx";
import { staffMe, uploadStaffAvatar, staffChangePassword, staffUpdateProfile } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { HeroBanner } from "@/components/portal/HeroBanner";
import { QuickCard } from "@/components/portal/QuickCard";
import { avatarUrl, displayName, initialsOf } from "@/lib/portal-identity";
import { clerkRoles, hasRole } from "@/lib/roles";
import {
  clerkListStudents,
  clerkUpdateStudent,
  clerkBulkImportStudents,
  clerkPromoteStudents,
  clerkRecentActivity,
  clerkGlobalSearch,
} from "@/lib/clerk.functions";
import { adminCreateStudent } from "@/lib/admin.functions";
import { salaryList, salaryUpsert, salaryDelete, salaryStaffList } from "@/lib/salary.functions";


export const Route = createFileRoute("/clerk")({
  head: () => portalMeta("Clerk Portal"),
  component: ClerkPortal,
});

type Tab = "home" | "students" | "import" | "promote" | "salary" | "profile" | "password";

function ClerkPortal() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login", replace: true });
    else if (!hasRole(me, clerkRoles)) nav({ to: "/staff-dashboard", replace: true });
  }, [me, isLoading, nav]);
  const [tab, setTab] = useState<Tab>("home");
  if (isLoading || !me || !hasRole(me, clerkRoles)) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading…</div>;

  const NAV: { icon: any; label: string; tab: Tab }[] = [
    { icon: UsersRound, label: "Dashboard", tab: "home" },
    { icon: Users, label: "Students", tab: "students" },
    { icon: Upload, label: "Bulk Import", tab: "import" },
    { icon: ArrowUpCircle, label: "Promote", tab: "promote" },
    { icon: Wallet, label: "Salary", tab: "salary" },
    { icon: User, label: "My Profile", tab: "profile" },
    { icon: KeyRound, label: "Change Password", tab: "password" },
  ];

  return (
    <PortalShell title="Clerk Portal" subtitle="Master Records" me={me as any} accent="amber">
      <div className="flex">
        {/* LHS sidebar */}
        <aside className="w-60 shrink-0 bg-white border-r min-h-[calc(100vh-65px)] sticky top-0 self-start hidden md:block">
          <nav className="py-3">
            {NAV.map((item) => {
              const active = tab === item.tab;
              const Icon = item.icon;
              return (
                <button
                  key={item.tab}
                  onClick={() => setTab(item.tab)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left border-l-4 transition ${
                    active
                      ? "border-amber-600 bg-amber-50 text-amber-700 font-semibold"
                      : "border-transparent text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full border-b bg-white overflow-x-auto flex whitespace-nowrap">
          {NAV.map((item) => {
            const active = tab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setTab(item.tab)}
                className={`px-3 py-2 text-xs ${
                  active ? "border-b-2 border-amber-600 text-amber-700 font-semibold" : "text-gray-600"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* RHS output */}
        <main className="flex-1 min-w-0 p-4 md:p-6 space-y-4">
          {tab === "home" && <HomeTab me={me as any} onNav={setTab} />}
          {tab === "students" && <StudentsTab />}
          {tab === "import" && <ImportTab />}
          {tab === "promote" && <PromoteTab />}
          {tab === "salary" && <SalaryTab />}
          {tab === "profile" && <ProfileTab me={me as any} />}
          {tab === "password" && <PasswordTab me={me as any} />}
        </main>
      </div>
    </PortalShell>
  );
}

function HomeTab({ me, onNav }: { me: any; onNav: (t: Tab) => void }) {
  const qc = useQueryClient();
  const uploadFn = useServerFn(uploadStaffAvatar);
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller");
      const b64: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onerror = () => reject(new Error("Failed to read file"));
        r.onload = () => {
          const s = String(r.result || "");
          const i = s.indexOf(",");
          resolve(i >= 0 ? s.slice(i + 1) : s);
        };
        r.readAsDataURL(file);
      });
      return uploadFn({ data: { filename: file.name, contentType: file.type || "image/png", contentBase64: b64 } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-me"] });
      qc.invalidateQueries({ queryKey: ["staff-me-profile"] });
    },
  });

  const studentsQ = useQuery({
    queryKey: ["clerk-students", "", "", ""],
    queryFn: () => clerkListStudents({ data: {} as any }),
  });
  const staffQ = useQuery({ queryKey: ["salary-staff"], queryFn: () => salaryStaffList() });
  const now = new Date();
  const salaryQ = useQuery({
    queryKey: ["salary-list", now.getMonth() + 1, now.getFullYear()],
    queryFn: () => salaryList({ data: { month: now.getMonth() + 1, year: now.getFullYear() } }),
  });
  const activityQ = useQuery({
    queryKey: ["clerk-activity"],
    queryFn: () => clerkRecentActivity({ data: { limit: 20 } }),
    refetchInterval: 60_000,
  });

  const students = studentsQ.data ?? [];
  const staff = staffQ.data ?? [];
  const salary = salaryQ.data ?? [];
  const totalStudents = students.length;
  const totalStaff = staff.length;
  const monthlyNet = salary.reduce((s: number, r: any) => s + Number(r.net_pay || 0), 0);
  const paidStaffThisMonth = salary.length;

  const byBranch = useMemo(() => {
    const agg = new Map<string, number>();
    students.forEach((r: any) => agg.set(r.branch, (agg.get(r.branch) ?? 0) + 1));
    return agg;
  }, [students]);

  const branchTiles = [
    { key: "civil", label: "Civil", icon: Landmark, tone: "from-sky-500 to-blue-600" },
    { key: "mechanical", label: "Mechanical", icon: Wrench, tone: "from-orange-500 to-red-500" },
    { key: "applied_science", label: "Applied Science", icon: Beaker, tone: "from-emerald-500 to-teal-600" },
  ];

  const quickActions: {
    tab: Tab;
    icon: any;
    label: string;
    desc: string;
    color: string;
    border: string;
    stat: string | number;
    statLabel: string;
  }[] = [
    {
      tab: "students",
      icon: Users,
      label: "Students",
      desc: "Master records — search, edit, export",
      color: "bg-amber-600",
      border: "border-amber-600",
      stat: totalStudents,
      statLabel: "On roll",
    },
    {
      tab: "import",
      icon: Upload,
      label: "Bulk Import",
      desc: "Upload Excel / paste CSV",
      color: "bg-emerald-600",
      border: "border-emerald-600",
      stat: "XLSX",
      statLabel: "Sample ready",
    },
    {
      tab: "promote",
      icon: ArrowUpCircle,
      label: "Promote",
      desc: "Roll semester forward branch-wise",
      color: "bg-sky-600",
      border: "border-sky-600",
      stat: `${Array.from(byBranch.values()).length}`,
      statLabel: "Branches",
    },
    {
      tab: "salary",
      icon: Wallet,
      label: "Salary",
      desc: "Enter monthly pay & export sheet",
      color: "bg-rose-600",
      border: "border-rose-600",
      stat: paidStaffThisMonth,
      statLabel: `Paid ${now.toLocaleString("en", { month: "short" })}`,
    },
  ];

  const monthLabel = now.toLocaleString("en", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <HeroBanner
        name={me?.name || me?.username || "Clerk"}
        role="Office & Records"
        avatarSrc={avatarUrl(me)}
        onAvatarChange={(f) => uploadAvatar.mutate(f)}
        avatarUploading={uploadAvatar.isPending}
        palette="clerk"
        subtitle={
          <>
            <span className="text-white/80">Master records · Admissions · Payroll</span>
            <span className="text-white/60"> · {monthLabel} · Use the left panel to jump into any module.</span>
          </>
        }
        stats={[
          { value: totalStudents, label: "Students" },
          { value: totalStaff, label: "Staff" },
          { value: paidStaffThisMonth, label: "Paid this month" },
        ]}
      />

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-white border-b">
          <p className="font-semibold text-gray-800">Quick Actions</p>
          <p className="text-[11px] text-gray-500">Everything the office needs, one click away.</p>
        </div>
        <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((q) => (
            <QuickCard
              key={q.tab}
              icon={q.icon}
              label={q.label}
              desc={q.desc}
              color={q.color}
              border={q.border}
              stat={q.stat}
              statLabel={q.statLabel}
              onClick={() => onNav(q.tab)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile icon={Users} label="Total Students" value={totalStudents} tone="from-amber-500 to-orange-600" />
        <KpiTile icon={UsersRound} label="Staff Members" value={totalStaff} tone="from-sky-500 to-indigo-600" />
        <KpiTile icon={Wallet} label={`Net Payroll (${now.toLocaleString("en", { month: "short" })})`} value={`₹${monthlyNet.toLocaleString("en-IN")}`} tone="from-emerald-500 to-teal-600" />
        <KpiTile icon={UserPlus} label="Salary Entries" value={paidStaffThisMonth} tone="from-rose-500 to-fuchsia-600" />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b">
            <p className="font-semibold text-gray-800">Branch Strength</p>
            <p className="text-[11px] text-gray-500">Active students grouped by department.</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {branchTiles.map((b) => {
              const count = byBranch.get(b.key) ?? 0;
              const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
              return (
                <div key={b.key} className="relative overflow-hidden rounded-lg border p-4">
                  <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${b.tone} opacity-15 blur-2xl`} />
                  <div className="relative flex items-start gap-3">
                    <span className={`w-9 h-9 rounded-lg bg-gradient-to-br ${b.tone} text-white flex items-center justify-center shadow`}>
                      <b.icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">{b.label}</p>
                      <p className="text-2xl font-bold text-gray-900 leading-none mt-0.5">{count}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{pct}% of total</p>
                    </div>
                  </div>
                  <div className="relative mt-3 h-1.5 bg-gray-100 rounded overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${b.tone}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">Recently Added</p>
              <p className="text-[11px] text-gray-500">Latest student records.</p>
            </div>
            <button onClick={() => onNav("students")} className="text-[11px] text-amber-700 hover:underline">
              All students →
            </button>
          </div>
          <ul className="divide-y">
            {students.length === 0 ? (
              <li className="p-5 text-xs text-gray-400 text-center">No students on roll yet.</li>
            ) : (
              [...students]
                .sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0))
                .slice(0, 5)
                .map((s: any) => (
                  <li key={s.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-xs font-bold shadow">
                      {(s.name || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">
                        <span className="font-mono">{s.enrollment_no}</span> · <span className="capitalize">{s.branch}</span> · Sem {s.semester}
                      </p>
                    </div>
                  </li>
                ))
            )}
          </ul>
        </div>
      </div>

      <ActivityPanel rows={activityQ.data ?? []} loading={activityQ.isLoading} />
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white border shadow-sm p-4">
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${tone} opacity-15 blur-2xl`} />
      <div className="relative flex items-center gap-3">
        <span className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tone} text-white flex items-center justify-center shadow`}>
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xl font-bold text-gray-900 leading-none truncate">{value}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Recent Activity / Audit Log ─────────────────────────────────────────────
type ActivityRow = {
  id: number;
  action: string;
  entity: string | null;
  entity_id: string | null;
  details: any;
  created_at: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function relTime(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 14) return `${d}d ago`;
  const dt = new Date(iso);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
}

function describeActivity(row: ActivityRow): { icon: any; tone: string; label: string; text: React.ReactNode } {
  const d = row.details ?? {};
  const actor = d.actor_name || "Someone";
  switch (row.action) {
    case "student_update": {
      const fields = Array.isArray(d.fields) ? d.fields.join(", ") : "";
      return {
        icon: Pencil,
        tone: "bg-amber-100 text-amber-700 border-amber-200",
        label: "Student edit",
        text: (
          <>
            <span className="font-semibold text-gray-800">{actor}</span> edited{" "}
            <span className="font-medium text-gray-800">{d.student_name || `#${row.entity_id}`}</span>
            {d.enrollment_no && <span className="text-gray-500"> ({d.enrollment_no})</span>}
            {fields && <span className="text-gray-500"> · {fields}</span>}
          </>
        ),
      };
    }
    case "student_promote": {
      return {
        icon: ArrowUpCircle,
        tone: "bg-sky-100 text-sky-700 border-sky-200",
        label: "Promotion",
        text: (
          <>
            <span className="font-semibold text-gray-800">{actor}</span> promoted{" "}
            <span className="font-medium text-gray-800 capitalize">{d.branch}</span> from Sem{" "}
            <span className="font-semibold">{d.from_semester}</span> → Sem{" "}
            <span className="font-semibold">{d.to_semester}</span>
            {typeof d.promoted === "number" && (
              <span className="text-gray-500"> · {d.promoted} student{d.promoted === 1 ? "" : "s"}</span>
            )}
          </>
        ),
      };
    }
    case "salary_upsert": {
      const period = d.month && d.year ? `${MONTHS[d.month - 1]} ${d.year}` : "";
      return {
        icon: Wallet,
        tone: "bg-emerald-100 text-emerald-700 border-emerald-200",
        label: "Salary",
        text: (
          <>
            <span className="font-semibold text-gray-800">{actor}</span> recorded pay for{" "}
            <span className="font-medium text-gray-800">{d.staff_name || `Staff #${row.entity_id}`}</span>
            {period && <span className="text-gray-500"> · {period}</span>}
            {d.net_pay != null && (
              <span className="text-gray-500"> · ₹{Number(d.net_pay).toLocaleString("en-IN")}</span>
            )}
          </>
        ),
      };
    }
    case "salary_delete": {
      const period = d.month && d.year ? `${MONTHS[d.month - 1]} ${d.year}` : "";
      return {
        icon: Trash2,
        tone: "bg-rose-100 text-rose-700 border-rose-200",
        label: "Salary removed",
        text: (
          <>
            <span className="font-semibold text-gray-800">{actor}</span> removed salary for{" "}
            <span className="font-medium text-gray-800">{d.staff_name || `Staff #${row.entity_id}`}</span>
            {period && <span className="text-gray-500"> · {period}</span>}
          </>
        ),
      };
    }
    default:
      return {
        icon: Activity,
        tone: "bg-gray-100 text-gray-700 border-gray-200",
        label: row.action,
        text: <span className="text-gray-600">{row.action} on {row.entity}</span>,
      };
  }
}

const ACTIVITY_FILTERS: { key: "all" | "student_update" | "student_promote" | "salary"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "student_update", label: "Edits" },
  { key: "student_promote", label: "Promotions" },
  { key: "salary", label: "Salary" },
];

function ActivityPanel({ rows, loading }: { rows: ActivityRow[]; loading?: boolean }) {
  const [filter, setFilter] = useState<(typeof ACTIVITY_FILTERS)[number]["key"]>("all");
  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "salary") return rows.filter((r) => r.action.startsWith("salary_"));
    return rows.filter((r) => r.action === filter);
  }, [rows, filter]);

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" /> Recent Activity
          </p>
          <p className="text-[11px] text-gray-500">
            Student edits, semester promotions & salary changes — newest first.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {ACTIVITY_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`text-[11px] px-2 py-1 rounded-full border transition ${
                filter === f.key
                  ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="divide-y max-h-[360px] overflow-y-auto">
        {loading ? (
          <li className="p-6 text-xs text-gray-400 text-center flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading activity…
          </li>
        ) : filtered.length === 0 ? (
          <li className="p-6 text-xs text-gray-400 text-center flex flex-col items-center gap-1">
            <Activity className="w-4 h-4 text-gray-300" />
            {rows.length === 0
              ? "No activity yet. Edits, promotions, and salary entries will appear here."
              : "No entries match this filter."}
          </li>
        ) : (
          filtered.map((row) => {
            const meta = describeActivity(row);
            const Icon = meta.icon;
            return (
              <li key={row.id} className="px-4 py-3 flex items-start gap-3">
                <span className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${meta.tone}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wider font-semibold border px-1.5 py-0.5 rounded ${meta.tone}`}>
                      {meta.label}
                    </span>
                    <span
                      className="text-[10px] text-gray-400 ml-auto shrink-0"
                      title={new Date(row.created_at).toLocaleString()}
                    >
                      {relTime(row.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 leading-snug">{meta.text}</p>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}



function StudentsTab() {
  const qc = useQueryClient();
  const [branch, setBranch] = useState("");
  const [sem, setSem] = useState<number | "">("");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const list = useQuery({
    queryKey: ["clerk-students", branch, sem, q],
    queryFn: () =>
      clerkListStudents({
        data: { branch: branch || undefined, semester: sem || undefined, q: q || undefined } as any,
      }),
  });
  const create = useMutation({
    mutationFn: (d: any) => adminCreateStudent({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clerk-students"] });
      setAdding(false);
    },
  });
  const update = useMutation({
    mutationFn: (d: any) => clerkUpdateStudent({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clerk-students"] });
      qc.invalidateQueries({ queryKey: ["clerk-activity"] });
      setEditing(null);
    },
  });

  const exportCsv = () => {
    const rows = list.data ?? [];
    const header = [
      "enrollment_no",
      "name",
      "father_name",
      "branch",
      "semester",
      "batch_year",
      "email",
      "phone",
      "address",
      "guardian_phone",
    ];
    const csv = [header.join(",")]
      .concat(rows.map((r: any) => header.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name / enrollment"
          className="border rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="border rounded px-2 py-2 text-sm bg-white"
        >
          <option value="">All branches</option>
          {["civil", "mechanical", "applied_science"].map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={sem}
          onChange={(e) => setSem(e.target.value ? Number(e.target.value) : "")}
          className="border rounded px-2 py-2 text-sm bg-white"
        >
          <option value="">All sems</option>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <option key={s} value={s}>
              Sem {s}
            </option>
          ))}
        </select>
        <button onClick={exportCsv} className="border px-3 py-2 rounded text-sm inline-flex items-center gap-1">
          <Download className="w-4 h-4" /> CSV
        </button>
        <button
          onClick={() => setAdding(true)}
          className="bg-amber-600 text-white px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>
      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-3 py-2 text-left">Enrollment</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Branch</th>
              <th className="px-3 py-2 text-left">Sem</th>
              <th className="px-3 py-2 text-left">Batch</th>
              <th className="px-3 py-2 text-left">Contact</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(list.data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2 font-mono">{r.enrollment_no}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 capitalize">{r.branch}</td>
                <td className="px-3 py-2">{r.semester}</td>
                <td className="px-3 py-2">{r.batch_year}</td>
                <td className="px-3 py-2 text-xs">
                  {r.phone ?? "—"} · {r.email ?? "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setEditing(r)} className="p-1.5 hover:bg-secondary rounded">
                    <Pencil className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {(list.data ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-muted-foreground">
                  No students match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {adding && (
        <StudentFormModal
          title="Add Student"
          requirePassword
          onClose={() => setAdding(false)}
          onSave={(d: any) => create.mutate(d)}
          pending={create.isPending}
          error={create.error?.message}
        />
      )}
      {editing && (
        <StudentFormModal
          title={`Edit ${editing.enrollment_no}`}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(d: any) => update.mutate({ id: editing.id, ...d })}
          pending={update.isPending}
          error={update.error?.message}
        />
      )}
    </div>
  );
}

function StudentFormModal({ title, initial = {}, requirePassword = false, onClose, onSave, pending, error }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-xl w-full p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-[color:var(--navy)] mb-3">{title}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const out: any = {
              enrollment_no: String(f.get("enrollment_no") || initial.enrollment_no || ""),
              name: String(f.get("name")),
              father_name: String(f.get("father_name") || ""),
              branch: String(f.get("branch")),
              semester: Number(f.get("semester")),
              batch_year: Number(f.get("batch_year")),
              email: String(f.get("email") || ""),
              phone: String(f.get("phone") || ""),
              address: String(f.get("address") || ""),
              guardian_phone: String(f.get("guardian_phone") || ""),
              dob: String(f.get("dob") || "") || null,
              admission_date: String(f.get("admission_date") || "") || null,
            };
            if (requirePassword) out.password = String(f.get("password"));
            onSave(out);
          }}
          className="grid grid-cols-2 gap-2 text-sm"
        >
          {requirePassword && (
            <input
              name="enrollment_no"
              required
              placeholder="Enrollment No"
              defaultValue={initial.enrollment_no}
              className="border rounded px-3 py-2 col-span-2"
            />
          )}
          <input
            name="name"
            required
            placeholder="Full Name"
            defaultValue={initial.name}
            className="border rounded px-3 py-2 col-span-2"
          />
          <input
            name="father_name"
            placeholder="Father's Name"
            defaultValue={initial.father_name ?? ""}
            className="border rounded px-3 py-2 col-span-2"
          />
          <select
            name="branch"
            required
            defaultValue={initial.branch ?? "civil"}
            className="border rounded px-3 py-2 bg-white"
          >
            <option value="civil">Civil</option>
            <option value="mechanical">Mechanical</option>
            <option value="applied_science">Applied Science</option>
          </select>
          <input
            name="semester"
            type="number"
            min={1}
            max={8}
            required
            defaultValue={initial.semester ?? 1}
            className="border rounded px-3 py-2"
          />
          <input
            name="batch_year"
            type="number"
            min={2000}
            max={2100}
            required
            defaultValue={initial.batch_year ?? new Date().getFullYear()}
            className="border rounded px-3 py-2"
          />
          <input
            name="phone"
            placeholder="Phone"
            defaultValue={initial.phone ?? ""}
            className="border rounded px-3 py-2"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            defaultValue={initial.email ?? ""}
            className="border rounded px-3 py-2 col-span-2"
          />
          <input
            name="address"
            placeholder="Address"
            defaultValue={initial.address ?? ""}
            className="border rounded px-3 py-2 col-span-2"
          />
          <input
            name="guardian_phone"
            placeholder="Guardian phone"
            defaultValue={initial.guardian_phone ?? ""}
            className="border rounded px-3 py-2"
          />
          <input name="dob" type="date" defaultValue={initial.dob ?? ""} className="border rounded px-3 py-2" />
          <input
            name="admission_date"
            type="date"
            defaultValue={initial.admission_date ?? ""}
            className="border rounded px-3 py-2 col-span-2"
          />
          {requirePassword && (
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Temp password (≥6)"
              className="border rounded px-3 py-2 col-span-2"
            />
          )}
          {error && <p className="col-span-2 text-xs text-destructive">{error}</p>}
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded">
              Cancel
            </button>
            <button disabled={pending} className="px-4 py-1.5 bg-amber-600 text-white rounded disabled:opacity-50">
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STUDENT_COLS = ["enrollment_no", "name", "father_name", "branch", "semester", "batch_year", "email", "phone"];

function downloadSampleXlsx() {
  const wb = XLSX.utils.book_new();
  const data: any[][] = [
    [...STUDENT_COLS],
    ["CE2301", "Ram Kumar", "Sham Lal", "civil", 1, 2025, "ram@example.com", "9999999999"],
    ["ME2302", "Sita Devi", "Mohan Lal", "mechanical", 1, 2025, "sita@example.com", "9888888888"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, "students_sample.xlsx");
}

function ImportTab() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<any[]>([]);
  const [csv, setCsv] = useState("");
  const [pw, setPw] = useState("");
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const m = useMutation({
    mutationFn: (d: any) => clerkBulkImportStudents({ data: d }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["clerk-students"] });
    },
  });

  function parseCsv(text: string): any[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const head = lines[0].split(",").map((s) => s.trim());
    return lines.slice(1).map((l) => {
      const cells = l.split(",").map((c) => c.trim());
      const row: any = {};
      head.forEach((h, i) => (row[h] = cells[i] ?? ""));
      if (row.semester) row.semester = Number(row.semester);
      if (row.batch_year) row.batch_year = Number(row.batch_year);
      return row;
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
    const cleaned = json
      .map((r) => ({
        enrollment_no: String(r.enrollment_no ?? "").trim(),
        name: String(r.name ?? "").trim(),
        father_name: String(r.father_name ?? "").trim() || undefined,
        branch: String(r.branch ?? "")
          .trim()
          .toLowerCase(),
        semester: Number(r.semester),
        batch_year: Number(r.batch_year),
        email: String(r.email ?? "").trim() || undefined,
        phone: String(r.phone ?? "").trim() || undefined,
      }))
      .filter((r) => r.enrollment_no && r.name);
    setRows(cleaned);
    setCsv("");
  }

  function applyCsv() {
    setRows(parseCsv(csv));
    setFileName("pasted CSV");
  }

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={downloadSampleXlsx}
          className="border px-3 py-2 rounded text-sm inline-flex items-center gap-1"
        >
          <FileSpreadsheet className="w-4 h-4" /> Download Sample.xlsx
        </button>
        <span className="text-xs text-muted-foreground">
          Required: <code>enrollment_no, name, branch, semester, batch_year</code>. Optional:{" "}
          <code>father_name, email, phone</code>.
        </span>
      </div>

      <div className="bg-white border rounded p-3 space-y-2">
        <label className="block text-sm font-semibold">Option A — Upload Excel (.xlsx / .xls / .csv)</label>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="text-sm" />
        {fileName && (
          <p className="text-xs text-muted-foreground">
            Loaded <b>{fileName}</b> — {rows.length} rows parsed.
          </p>
        )}
      </div>

      <div className="bg-white border rounded p-3 space-y-2">
        <label className="block text-sm font-semibold">Option B — Paste CSV</label>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={6}
          placeholder="enrollment_no,name,branch,semester,batch_year,email,phone&#10;CE2301,Ram Kumar,civil,1,2025,ram@x.com,9999999999"
          className="w-full border rounded px-3 py-2 text-sm font-mono"
        />
        <button onClick={applyCsv} disabled={!csv} className="text-sm border px-3 py-1.5 rounded disabled:opacity-50">
          Parse CSV
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <input
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          type="password"
          minLength={6}
          placeholder="Default password for all"
          className="border rounded px-3 py-2 text-sm flex-1"
        />
        <button
          disabled={!rows.length || !pw || m.isPending}
          onClick={() => m.mutate({ defaultPassword: pw, rows })}
          className="bg-amber-600 text-white px-4 py-2 rounded text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" /> Import {rows.length} rows
        </button>
      </div>
      {m.error && <p className="text-xs text-destructive">{m.error.message}</p>}
      {result && (
        <div className="bg-white border rounded p-3 text-sm">
          <p>
            <b>{result.inserted}</b> imported, <b>{result.failed.length}</b> failed.
          </p>
          {result.failed.length > 0 && (
            <ul className="text-xs mt-2 list-disc pl-5">
              {result.failed.slice(0, 20).map((f: any, i: number) => (
                <li key={i}>
                  {f.enrollment_no}: {f.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function PromoteTab() {
  const qc = useQueryClient();
  const [branch, setBranch] = useState("civil");
  const [from, setFrom] = useState(1);
  const m = useMutation({
    mutationFn: (d: any) => clerkPromoteStudents({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clerk-students"] });
      qc.invalidateQueries({ queryKey: ["clerk-activity"] });
    },
  });
  return (
    <div className="max-w-md space-y-3">
      <p className="text-sm text-muted-foreground">
        Move every active student in (branch + semester) to the next semester. Use once per semester rollover.
      </p>
      <div className="bg-white border rounded p-4 space-y-3">
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm bg-white"
        >
          {["civil", "mechanical", "applied_science"].map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={from}
          onChange={(e) => setFrom(Number(e.target.value))}
          className="w-full border rounded px-3 py-2 text-sm bg-white"
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <option key={s} value={s}>
              Sem {s} → Sem {s + 1}
            </option>
          ))}
        </select>
        <button
          disabled={m.isPending}
          onClick={() => {
            if (confirm(`Promote ${branch} Sem ${from} → ${from + 1}?`)) m.mutate({ branch, fromSemester: from });
          }}
          className="w-full bg-amber-600 text-white py-2 rounded text-sm font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <ArrowUpCircle className="w-4 h-4" /> {m.isPending ? "Promoting…" : "Promote"}
        </button>
        {m.error && <p className="text-xs text-destructive">{m.error.message}</p>}
        {m.isSuccess && <p className="text-xs text-green-700">{(m.data as any).promoted} students promoted.</p>}
      </div>
    </div>
  );
}

function SalaryTab() {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [adding, setAdding] = useState(false);

  const staffQ = useQuery({ queryKey: ["salary-staff"], queryFn: () => salaryStaffList() });
  const listQ = useQuery({
    queryKey: ["salary-list", month, year],
    queryFn: () => salaryList({ data: { month, year } }),
  });
  const upsert = useMutation({
    mutationFn: (d: any) => salaryUpsert({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary-list"] });
      qc.invalidateQueries({ queryKey: ["clerk-activity"] });
      setAdding(false);
    },
  });
  const del = useMutation({
    mutationFn: (d: any) => salaryDelete({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salary-list"] });
      qc.invalidateQueries({ queryKey: ["clerk-activity"] });
    },
  });

  const total = useMemo(
    () => (listQ.data ?? []).reduce((s: number, r: any) => s + Number(r.net_pay || 0), 0),
    [listQ.data],
  );

  const exportXlsx = () => {
    const rows = (listQ.data ?? []).map((r: any) => ({
      Staff: r.staff_users?.username,
      Role: r.staff_users?.role,
      Dept: r.staff_users?.department,
      Month: r.month,
      Year: r.year,
      Basic: r.basic,
      DA: r.da,
      HRA: r.hra,
      "Other Allow": r.other_allow,
      Deductions: r.deductions,
      "Net Pay": r.net_pay,
      "Paid On": r.paid_on,
      Remarks: r.remarks,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Salary ${month}-${year}`);
    XLSX.writeFile(wb, `salary_${year}_${String(month).padStart(2, "0")}.xlsx`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border rounded px-2 py-2 text-sm bg-white"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {new Date(2000, m - 1, 1).toLocaleString("en", { month: "long" })}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={2000}
          max={2100}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded px-2 py-2 text-sm w-24"
        />
        <button
          onClick={() => setAdding(true)}
          className="bg-amber-600 text-white px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Salary Entry
        </button>
        <button
          onClick={exportXlsx}
          disabled={!listQ.data?.length}
          className="border px-3 py-2 rounded text-sm inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export
        </button>
        <span className="ml-auto text-sm">
          Total Net: <b>₹{total.toLocaleString("en-IN")}</b>
        </span>
      </div>

      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="px-3 py-2 text-left">Staff</th>
              <th className="px-3 py-2 text-right">Basic</th>
              <th className="px-3 py-2 text-right">DA</th>
              <th className="px-3 py-2 text-right">HRA</th>
              <th className="px-3 py-2 text-right">Other</th>
              <th className="px-3 py-2 text-right">Deduct</th>
              <th className="px-3 py-2 text-right">Net</th>
              <th className="px-3 py-2 text-left">Paid</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(listQ.data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">
                  <b>{r.staff_users?.username}</b>
                  <div className="text-xs text-muted-foreground">{r.staff_users?.role}</div>
                </td>
                <td className="px-3 py-2 text-right">{Number(r.basic).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-right">{Number(r.da).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-right">{Number(r.hra).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-right">{Number(r.other_allow).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-right text-rose-700">{Number(r.deductions).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-right font-semibold">{Number(r.net_pay).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-xs">{r.paid_on ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => {
                      if (confirm("Delete this salary entry?")) del.mutate({ id: r.id });
                    }}
                    className="p-1.5 hover:bg-secondary rounded text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {(listQ.data ?? []).length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-6 text-muted-foreground">
                  No salary entries for {month}/{year}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {adding && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setAdding(false)}
        >
          <div className="bg-white rounded-lg max-w-lg w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-[color:var(--navy)] mb-3">
              Add / Update Salary — {month}/{year}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                upsert.mutate({
                  staff_id: Number(f.get("staff_id")),
                  month,
                  year,
                  basic: Number(f.get("basic") || 0),
                  da: Number(f.get("da") || 0),
                  hra: Number(f.get("hra") || 0),
                  other_allow: Number(f.get("other_allow") || 0),
                  deductions: Number(f.get("deductions") || 0),
                  remarks: String(f.get("remarks") || "") || null,
                  paid_on: String(f.get("paid_on") || "") || null,
                });
              }}
              className="grid grid-cols-2 gap-2 text-sm"
            >
              <select name="staff_id" required className="col-span-2 border rounded px-3 py-2 bg-white">
                <option value="">— Select staff —</option>
                {(staffQ.data ?? []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.username} ({s.role}
                    {s.department ? `, ${s.department}` : ""})
                  </option>
                ))}
              </select>
              <label className="text-xs">
                Basic
                <input
                  name="basic"
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  className="w-full border rounded px-2 py-1.5"
                />
              </label>
              <label className="text-xs">
                DA
                <input
                  name="da"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={0}
                  className="w-full border rounded px-2 py-1.5"
                />
              </label>
              <label className="text-xs">
                HRA
                <input
                  name="hra"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={0}
                  className="w-full border rounded px-2 py-1.5"
                />
              </label>
              <label className="text-xs">
                Other Allowances
                <input
                  name="other_allow"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={0}
                  className="w-full border rounded px-2 py-1.5"
                />
              </label>
              <label className="text-xs col-span-2">
                Deductions
                <input
                  name="deductions"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={0}
                  className="w-full border rounded px-2 py-1.5"
                />
              </label>
              <label className="text-xs">
                Paid On
                <input name="paid_on" type="date" className="w-full border rounded px-2 py-1.5" />
              </label>
              <label className="text-xs col-span-2">
                Remarks
                <input name="remarks" className="w-full border rounded px-2 py-1.5" />
              </label>
              {upsert.error && <p className="col-span-2 text-xs text-destructive">{upsert.error.message}</p>}
              <div className="col-span-2 flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setAdding(false)} className="px-3 py-1.5 border rounded">
                  Cancel
                </button>
                <button
                  disabled={upsert.isPending}
                  className="px-4 py-1.5 bg-amber-600 text-white rounded disabled:opacity-50"
                >
                  {upsert.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileRow({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs uppercase tracking-wide text-slate-500">{k}</span>
      <span className="text-sm text-slate-800 font-medium text-right break-words">{v || "—"}</span>
    </div>
  );
}

function ProfileTab({ me }: { me: any }) {
  const qc = useQueryClient();
  const uploadFn = useServerFn(uploadStaffAvatar);
  const updateFn = useServerFn(staffUpdateProfile);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const toDateInput = (v: any) => {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d.getTime())) return typeof v === "string" ? v.slice(0, 10) : "";
    return d.toISOString().slice(0, 10);
  };

  const [form, setForm] = useState({
    name: me.name ?? "",
    designation: me.designation ?? "",
    dob: toDateInput(me.dob),
    phone: me.phone ?? "",
    email: me.email ?? "",
    address: me.address ?? "",
    ip_number: me.ip_number ?? "",
    pmis_number: me.pmis_number ?? "",
    date_of_joining: toDateInput(me.date_of_joining),
    date_of_retirement: toDateInput(me.date_of_retirement),
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const [errs, setErrs] = useState<Record<string, string>>({});

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller");
      const b64: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onerror = () => reject(new Error("Failed to read file"));
        r.onload = () => {
          const s = String(r.result || "");
          const i = s.indexOf(",");
          resolve(i >= 0 ? s.slice(i + 1) : s);
        };
        r.readAsDataURL(file);
      });
      return uploadFn({ data: { filename: file.name, contentType: file.type || "image/png", contentBase64: b64 } });
    },
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ["staff-me"] });
      qc.invalidateQueries({ queryKey: ["staff-me-profile"] });
    },
    onError: (e: any) => setError(e?.message || "Upload failed"),
  });

  const save = useMutation({
    mutationFn: (data: any) => updateFn({ data }),
    onSuccess: () => {
      setMsg({ kind: "ok", text: "Profile updated." });
      qc.invalidateQueries({ queryKey: ["staff-me"] });
      qc.invalidateQueries({ queryKey: ["staff-me-profile"] });
    },
    onError: (e: any) => setMsg({ kind: "err", text: e?.message || "Failed to save" }),
  });

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
    if (form.name.length > 100) e.name = "Name must be under 100 characters.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email.";
    if (form.phone && !/^[0-9+\-\s()]{6,15}$/.test(form.phone.trim())) e.phone = "Phone must be 6–15 digits/symbols.";
    if (form.address.length > 500) e.address = "Address must be under 500 characters.";
    if (form.designation.length > 100) e.designation = "Designation too long.";
    if (form.ip_number.length > 50) e.ip_number = "Too long.";
    if (form.pmis_number.length > 50) e.pmis_number = "Too long.";
    if (form.dob && isNaN(new Date(form.dob).getTime())) e.dob = "Invalid date.";
    if (form.date_of_joining && isNaN(new Date(form.date_of_joining).getTime())) e.date_of_joining = "Invalid date.";
    if (form.date_of_retirement && isNaN(new Date(form.date_of_retirement).getTime())) e.date_of_retirement = "Invalid date.";
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setMsg(null);
    if (!validate()) { setMsg({ kind: "err", text: "Please fix the highlighted fields." }); return; }
    const payload = {
      name: form.name.trim(),
      designation: form.designation.trim() || null,
      dob: form.dob || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      ip_number: form.ip_number.trim() || null,
      pmis_number: form.pmis_number.trim() || null,
      date_of_joining: form.date_of_joining || null,
      date_of_retirement: form.date_of_retirement || null,
    };
    save.mutate(payload);
  }

  const photo = avatarUrl(me);
  const fullName = displayName({ ...me, name: form.name || me.name });

  const Field = ({
    label, name, type = "text", value, err, ...rest
  }: {
    label: string; name: keyof typeof form; type?: string; value: string; err?: string;
  } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
      <input
        {...rest}
        name={String(name)}
        type={type}
        value={value}
        onChange={(e) => set(name, e.target.value)}
        className={`mt-1 w-full border rounded px-3 py-2 text-sm ${err ? "border-rose-400" : "border-slate-300"}`}
      />
      {err && <span className="text-[11px] text-rose-600">{err}</span>}
    </label>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border shadow-sm flex items-center gap-6">
        <div className="relative shrink-0">
          {photo ? (
            <img src={photo} alt={fullName} className="w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-md" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-4xl font-bold ring-4 ring-white shadow-md">
              {initialsOf(me.name || me.username)}
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-amber-700 text-white flex items-center justify-center shadow-lg hover:opacity-90 ring-2 ring-white cursor-pointer">
            {upload.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload.mutate(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold text-amber-800 tracking-wide uppercase break-words">{fullName}</h1>
          <p className="text-sm text-slate-600 mt-1">{form.designation || me.role}</p>
          <p className="text-xs text-slate-500 mt-1">Department: <strong>{me.department || "—"}</strong></p>
          <p className="text-xs text-slate-500 mt-2">Click the camera to update your profile photo · PNG, JPG, WEBP or GIF · up to 5 MB</p>
          {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl border p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-amber-800 mb-1">Account (read-only)</h2>
          <ProfileRow k="Username" v={me.username} />
          <ProfileRow k="Role" v={me.role} />
          <ProfileRow k="Staff ID" v={me.staff_id} />
          <ProfileRow k="Department" v={me.department} />
          <ProfileRow k="Last Login" v={me.last_login ? new Date(me.last_login).toLocaleString() : "—"} />
          <ProfileRow k="Member Since" v={me.created_at ? new Date(me.created_at).toLocaleDateString() : "—"} />
          <Field label="Full Name" name="name" value={form.name} err={errs.name} required maxLength={100} />
          <Field label="Designation" name="designation" value={form.designation} err={errs.designation} maxLength={100} />
        </div>

        <div className="bg-white rounded-xl border p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-amber-800 mb-1">Personal & Contact</h2>
          <Field label="Date of Birth" name="dob" type="date" value={form.dob} err={errs.dob} />
          <Field label="Phone" name="phone" value={form.phone} err={errs.phone} maxLength={15} inputMode="tel" />
          <Field label="Email" name="email" type="email" value={form.email} err={errs.email} maxLength={255} />
          <label className="block">
            <span className="text-[11px] uppercase tracking-wide text-slate-500">Address</span>
            <textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              maxLength={500}
              rows={2}
              className={`mt-1 w-full border rounded px-3 py-2 text-sm ${errs.address ? "border-rose-400" : "border-slate-300"}`}
            />
            {errs.address && <span className="text-[11px] text-rose-600">{errs.address}</span>}
          </label>
          <Field label="IP Number" name="ip_number" value={form.ip_number} err={errs.ip_number} maxLength={50} />
          <Field label="PMIS Number" name="pmis_number" value={form.pmis_number} err={errs.pmis_number} maxLength={50} />
          <Field label="Date of Joining" name="date_of_joining" type="date" value={form.date_of_joining} err={errs.date_of_joining} />
          <Field label="Date of Retirement" name="date_of_retirement" type="date" value={form.date_of_retirement} err={errs.date_of_retirement} />
        </div>

        <div className="md:col-span-2 flex items-center justify-end gap-3">
          {msg && (
            <span className={`text-sm ${msg.kind === "ok" ? "text-green-700" : "text-rose-600"}`}>{msg.text}</span>
          )}
          <button
            type="submit"
            disabled={save.isPending}
            className="bg-amber-700 text-white px-5 py-2 rounded font-semibold disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}



function PasswordTab({ me }: { me: any }) {
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const m = useMutation({
    mutationFn: (d: { currentPassword: string; newPassword: string }) => staffChangePassword({ data: d }),
    onSuccess: () => setMsg({ kind: "ok", text: "Password updated successfully." }),
    onError: (e: any) => setMsg({ kind: "err", text: e.message || "Failed to update" }),
  });
  return (
    <div className="max-w-md mx-auto bg-white border rounded-xl shadow-sm p-8">
      <h1 className="text-2xl font-bold text-amber-800 mb-1">Change Password</h1>
      <p className="text-sm text-muted-foreground mb-6">Signed in as <b>{me.username}</b></p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          const f = new FormData(e.currentTarget);
          const np = String(f.get("newPassword"));
          const cp = String(f.get("confirmPassword"));
          if (np !== cp) { setMsg({ kind: "err", text: "Passwords do not match" }); return; }
          m.mutate({ currentPassword: String(f.get("currentPassword")), newPassword: np });
          (e.currentTarget as HTMLFormElement).reset();
        }}
        className="space-y-3"
      >
        <input name="currentPassword" type="password" required placeholder="Current password" className="w-full border rounded px-3 py-2 text-sm" />
        <input name="newPassword" type="password" required minLength={8} placeholder="New password (min 8 chars)" className="w-full border rounded px-3 py-2 text-sm" />
        <input name="confirmPassword" type="password" required placeholder="Confirm new password" className="w-full border rounded px-3 py-2 text-sm" />
        {msg && <p className={`text-sm ${msg.kind === "ok" ? "text-green-700" : "text-destructive"}`}>{msg.text}</p>}
        <button disabled={m.isPending} className="w-full bg-amber-700 text-white py-2.5 rounded font-semibold disabled:opacity-50">
          {m.isPending ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}
