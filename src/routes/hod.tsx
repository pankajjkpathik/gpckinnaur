import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Users,
  ClipboardCheck,
  FileSpreadsheet,
  BookMarked,
  Calendar,
  ArrowLeft,
  Check,
  RotateCcw,
  ChevronDown,
  Home,
  LayoutDashboard,
  Shield,
  Mail,
  Trash2,
  Plus,
  GraduationCap,
  Building2,
  RefreshCw,
} from "lucide-react";
import { staffMe, staffLogout } from "@/lib/auth.functions";
import { HeroBanner } from "@/components/portal/HeroBanner";
import { avatarUrl } from "@/lib/portal-identity";

import { hodRoles, hasRole } from "@/lib/roles";
import {
  hodDashboard,
  hodPendingLessonPlans,
  hodMarksGroups,
  hodMarksDetail,
  hodReviewMarks,
  deptClassAttendance,
  hodUpsertTimetableSlot,
  hodListAssignments,
  hodUpsertAssignment,
  hodDeleteAssignment,
} from "@/lib/hod.functions";
import { hodDepartmentOverview } from "@/lib/tpo.functions";
import { reviewLessonPlan } from "@/lib/faculty.functions";
import { listPeriods, listTimetable, listSubjects, listStaffByRole } from "@/lib/academic.functions";
import { TimetableGrid } from "@/components/portal/TimetableGrid";
import { exportPDF, exportExcel, exportCSV } from "@/lib/report-export";
import { DepartmentOverviewPanel } from "@/components/portal/DepartmentOverviewPanel";
import { deptToBranch, branchToDept } from "@/lib/branch";
import { SyllabusCoverage } from "@/components/portal/SyllabusCoverage";

export const Route = createFileRoute("/hod")({
  head: () => ({
    meta: [
      { title: "HOD Portal — GP Kinnaur" },
      { name: "description", content: "Head of Department console for reviews, monitoring and allotments." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: HodPortal,
});

type View =
  | "home"
  | "overview"
  | "faculty"
  | "attendance"
  | "sessional"
  | "syllabus"
  | "timetable"
  | "lessons";

function defaultAY() {
  const d = new Date();
  const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border rounded-lg shadow-sm p-5 ${className}`}>{children}</div>;
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-gray-600 border rounded px-3 py-1.5 mb-5 hover:bg-gray-50 bg-white"
    >
      <ArrowLeft className="w-4 h-4" /> Back to Dashboard Home
    </button>
  );
}

/* ─── Sidebar navigation config ──────────────────────────────────────────── */
type NavItem = { view: View; label: string; icon: ComponentType<{ className?: string }> };

const HOD_NAV: NavItem[] = [
  { view: "home", label: "Dashboard", icon: Home },
  { view: "overview", label: "Department Overview", icon: BarChart3 },
  { view: "faculty", label: "Manage Faculty", icon: Users },
  { view: "attendance", label: "Attendance Reports", icon: ClipboardCheck },
  { view: "sessional", label: "Sessional Reports", icon: FileSpreadsheet },
  { view: "syllabus", label: "Syllabus Coverage", icon: BookMarked },
  { view: "timetable", label: "Branch Timetable", icon: Calendar },
  { view: "lessons", label: "Lesson Plan Reviews", icon: GraduationCap },
];

function HodSidebar({
  active,
  onNav,
  mobileOpen,
  onCloseMobile,
}: {
  active: View;
  onNav: (v: View) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const [hodOpen, setHodOpen] = useState(true);

  const inner = (
    <nav className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 space-y-2">
      <div>
        <button
          onClick={() => setHodOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#7b1f4c] to-[#a63a6b] text-white text-sm font-semibold shadow-sm"
        >
          <span className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" /> HOD Portal
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${hodOpen ? "" : "-rotate-90"}`} />
        </button>
        {hodOpen && (
          <ul className="mt-1.5 space-y-0.5">
            {HOD_NAV.map((item) => {
              const isActive = active === item.view;
              return (
                <li key={item.view}>
                  <button
                    onClick={() => onNav(item.view)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-[#7b1f4c]/10 text-[#7b1f4c] font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? "text-[#7b1f4c]" : "text-gray-400"}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="pt-1 border-t border-gray-100">
        <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-[0.18em] text-gray-400 font-semibold">General</p>
        <ul className="space-y-0.5">
          <li>
            <Link
              to="/faculty"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <GraduationCap className="w-4 h-4 text-gray-400" /> Faculty Portal
            </Link>
          </li>
          <li>
            <a
              href="https://www.gpkinnaur.edu.in"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Home className="w-4 h-4 text-gray-400" /> Public Website
            </a>
          </li>
          <li>
            <a
              href="/staff-profile"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <LayoutDashboard className="w-4 h-4 text-gray-400" /> My Profile
            </a>
          </li>
          <li>
            <a
              href="/staff-change-password"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Shield className="w-4 h-4 text-gray-400" /> Change Password
            </a>
          </li>
          <li>
            <a
              href="/messages"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <Mail className="w-4 h-4 text-gray-400" /> Internal Messages
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 sticky top-[76px] self-start">{inner}</aside>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={onCloseMobile}>
          <div
            className="absolute left-0 top-0 h-full w-72 bg-[#f7f7fb] p-4 overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {inner}
          </div>
        </div>
      )}
    </>
  );
}

function HodPortal() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!hasRole(me, hodRoles)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const VALID_VIEWS: View[] = ["home", "overview", "faculty", "attendance", "sessional", "syllabus", "timetable", "lessons"];
  const initialView: View = (() => {
    if (typeof window === "undefined") return "home";
    const v = new URLSearchParams(window.location.search).get("view") as View | null;
    return v && VALID_VIEWS.includes(v) ? v : "home";
  })();
  const [view, setView] = useState<View>(initialView);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const ay = defaultAY();

  // Keep ?view= in sync with current view so refresh/back-forward preserves selection.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (view === "home") url.searchParams.delete("view");
    else url.searchParams.set("view", view);
    window.history.replaceState(null, "", url.toString());
  }, [view]);

  // Respond to back/forward navigation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = () => {
      const v = new URLSearchParams(window.location.search).get("view") as View | null;
      setView(v && VALID_VIEWS.includes(v) ? v : "home");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  async function logout() {
    await staffLogout({});
    window.location.href = "/";
  }

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  const isViewer = me.role !== "hod";
  const branch = deptToBranch(me.department);
  const deptLabel = branchToDept(branch);
  const initials = (me.username || "H")[0].toUpperCase();

  function navTo(v: View) {
    setView(v);
    setMobileNavOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#f7f7fb]">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileNavOpen((o) => !o)}
              className="lg:hidden -ml-1 p-2 rounded hover:bg-gray-100"
              aria-label="Toggle navigation"
            >
              <LayoutDashboard className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-10 h-10 rounded-full bg-[#7b1f4c]/10 flex items-center justify-center text-xl shrink-0" aria-hidden>
              🎓
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">GP Kinnaur · HOD</p>
              <p className="font-bold text-gray-800 truncate">HOD Portal · {deptLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs text-gray-400 hidden sm:block">AY {ay}</span>
            <Link to="/messages" className="px-3 py-1.5 rounded border hover:bg-gray-50 text-xs text-gray-600">
              Messages
            </Link>
            <button onClick={logout} className="px-3 py-1.5 rounded border hover:bg-gray-50 text-xs text-gray-600">
              Log out
            </button>
            <div className="w-9 h-9 rounded-full bg-[#7b1f4c] text-white flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 flex gap-6">
        <HodSidebar
          active={view}
          onNav={navTo}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
        <main className="flex-1 min-w-0">
          {isViewer && view !== "home" && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded px-3 py-2 mb-4">
              You are viewing the HOD portal as <strong className="capitalize">{me.role}</strong>. Approvals and edits are disabled.
            </div>
          )}
          <fieldset
            disabled={isViewer && (view === "sessional" || view === "faculty" || view === "timetable" || view === "lessons")}
            className={
              isViewer && (view === "sessional" || view === "faculty" || view === "timetable" || view === "lessons")
                ? "pointer-events-none opacity-90"
                : ""
            }
          >
            {view === "home" && <HomeView me={me as any} deptLabel={deptLabel} ay={ay} />}
            {view === "overview" && (
              <OverviewView branch={branch} ay={ay} deptLabel={deptLabel} onBack={() => setView("home")} />
            )}
            {view === "faculty" && (
              <FacultyAllotmentView branch={branch} deptLabel={deptLabel} onBack={() => setView("home")} />
            )}
            {view === "attendance" && (
              <AttendanceReportsView defaultBranch={branch} onBack={() => setView("home")} />
            )}
            {view === "sessional" && <SessionalReportsView ay={ay} onBack={() => setView("home")} />}
            {view === "syllabus" && (
              <SyllabusProgressView branch={branch} deptLabel={deptLabel} ay={ay} onBack={() => setView("home")} />
            )}
            {view === "timetable" && (
              <TimetableView branch={branch} ay={ay} editable={!isViewer} onBack={() => setView("home")} />
            )}
            {view === "lessons" && <LessonsReviewView ay={ay} onBack={() => setView("home")} />}
          </fieldset>
        </main>
      </div>
    </div>
  );
}

/* ─── HOME ───────────────────────────────────────────────────────────────── */
function HomeView({ me, deptLabel, ay }: { me: any; deptLabel: string; ay: string }) {
  const q = useQuery({ queryKey: ["hod-dash", ay], queryFn: () => hodDashboard({ data: { academic_year: ay } }) });

  const snapshots: { label: string; value: number | string; tint: string; ring: string }[] = [
    { label: "Pending Lesson Plans", value: q.data?.pending_lessons ?? "—", tint: "bg-rose-500/5", ring: "text-rose-600" },
    { label: "Pending Marks", value: q.data?.pending_marks ?? "—", tint: "bg-orange-500/5", ring: "text-orange-600" },
    { label: "Pending Leaves", value: q.data?.pending_leaves ?? "—", tint: "bg-indigo-500/5", ring: "text-indigo-600" },
  ];

  return (
    <div className="space-y-6">
      <HeroBanner
        name={me?.name || me?.username || "HOD"}
        role={`HOD · ${deptLabel}`}
        palette="hod"
        avatarSrc={avatarUrl(me)}
        subtitle={
          <>
            Academic Year <span className="font-semibold text-lime-200">{ay}</span>
            <span className="text-white/70"> · Department oversight for {deptLabel}.</span>
          </>
        }
        stats={[
          { value: q.data?.pending_lessons ?? 0, label: "Pending Lessons" },
          { value: q.data?.pending_marks ?? 0, label: "Pending Marks" },
          { value: q.data?.pending_leaves ?? 0, label: "Pending Leaves" },
        ]}
      />


      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-2">Department Snapshot</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {snapshots.map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.tint}`}>
              <p className="text-[11px] text-gray-500 leading-tight">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.ring}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <p className="font-semibold text-gray-800 mb-1">Welcome, {me?.name || me?.username}!</p>
        <p className="text-sm text-gray-500">
          Use the left navigation to open any HOD section — department analytics, faculty allotment, attendance,
          sessional marks, syllabus coverage, timetable and lesson-plan reviews.
        </p>
      </Card>
    </div>
  );
}

/* ─── DEPARTMENT OVERVIEW ────────────────────────────────────────────────── */
function OverviewView({
  branch,
  ay,
  deptLabel,
  onBack,
}: {
  branch: string;
  ay: string;
  deptLabel: string;
  onBack: () => void;
}) {
  const q = useQuery({
    queryKey: ["hod-overview", branch, ay],
    queryFn: () => hodDepartmentOverview({ data: { branch, academic_year: ay } }),
  });

  if (q.isLoading || !q.data) {
    return (
      <div>
        <BackBtn onClick={onBack} />
        <p className="text-sm text-gray-400">Loading department analytics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">Department Overview — {deptLabel}</h1>
      <DepartmentOverviewPanel d={q.data as any} />
    </div>
  );
}

/* ─── MANAGE FACULTY (subject allotment, HOD-scoped) ─────────────────────── */
function FacultyAllotmentView({
  branch,
  deptLabel,
  onBack,
}: {
  branch: string;
  deptLabel: string;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const [year, setYear] = useState(defaultAY());
  const [form, setForm] = useState({ semester: 0, subject_id: 0, staff_id: 0 });

  const assignQ = useQuery({
    queryKey: ["hod-assignments", branch, year],
    queryFn: () => hodListAssignments({ data: { branch, academic_year: year } }),
    enabled: !!branch,
  });
  const staffQ = useQuery({
    queryKey: ["staff-all-for-hod"],
    queryFn: () => listStaffByRole({ data: {} as any }),
  });
  const subjQ = useQuery({
    queryKey: ["subjects-of", branch, form.semester],
    queryFn: () => listSubjects({ data: { branch, semester: form.semester } as any }),
    enabled: !!branch && !!form.semester,
  });

  const save = useMutation({
    mutationFn: (d: any) => hodUpsertAssignment({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hod-assignments"] });
      setForm((f) => ({ ...f, subject_id: 0, staff_id: 0 }));
    },
  });
  const del = useMutation({
    mutationFn: (id: number) => hodDeleteAssignment({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hod-assignments"] }),
  });

  // Faculty options: same rule as admin (any role with faculty capability),
  // grouped as "Department" (own dept) vs "Guest Faculty" (other depts).
  const facultyPool = (staffQ.data ?? []).filter(
    (s: any) =>
      ["faculty", "hod"].includes(s.role) || (s.extra_roles ?? []).includes("faculty"),
  );
  const own = facultyPool.filter((s: any) => deptToBranch(s.department) === branch);
  const guests = facultyPool.filter((s: any) => deptToBranch(s.department) !== branch);

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Manage Faculty — Subject Allotment</h1>
            <p className="text-xs text-gray-500">
              Allot subjects to your department faculty and guest faculty. Branch is locked to <strong>{deptLabel}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-xs text-gray-500">Academic Year</label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              pattern="\d{4}-\d{2}"
              className="border rounded px-2 py-1.5 text-sm w-24"
            />
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.staff_id || !form.subject_id || !form.semester) return;
            save.mutate({ ...form, branch, academic_year: year });
          }}
          className="grid sm:grid-cols-5 gap-2 items-end border-t pt-4"
        >
          <label className="text-xs">
            1. Branch
            <input
              value={deptLabel}
              disabled
              className="w-full border rounded px-2 py-1.5 text-sm bg-gray-100"
            />
          </label>
          <label className="text-xs">
            2. Semester
            <select
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: Number(e.target.value), subject_id: 0 })}
              required
              className="w-full border rounded px-2 py-1.5 text-sm bg-white"
            >
              <option value={0}>— select —</option>
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <option key={s} value={s}>
                  Sem {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            3. Subject
            <select
              value={form.subject_id}
              onChange={(e) => setForm({ ...form, subject_id: Number(e.target.value) })}
              required
              disabled={!form.semester}
              className="w-full border rounded px-2 py-1.5 text-sm bg-white disabled:bg-gray-100"
            >
              <option value={0}>
                {!form.semester
                  ? "— pick semester first —"
                  : (subjQ.data ?? []).length === 0
                    ? "— no subjects —"
                    : "— select —"}
              </option>
              {(subjQ.data ?? []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            4. Faculty
            <select
              value={form.staff_id}
              onChange={(e) => setForm({ ...form, staff_id: Number(e.target.value) })}
              required
              disabled={!form.subject_id}
              className="w-full border rounded px-2 py-1.5 text-sm bg-white disabled:bg-gray-100"
            >
              <option value={0}>— select —</option>
              {own.length > 0 && (
                <optgroup label={`Department — ${deptLabel}`}>
                  {own.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.username} ({s.role})
                    </option>
                  ))}
                </optgroup>
              )}
              {guests.length > 0 && (
                <optgroup label="Guest Faculty (other departments)">
                  {guests.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.username} · {s.department ?? "—"}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
          <button
            disabled={save.isPending || !form.staff_id}
            className="bg-[#7b1f4c] text-white rounded px-3 py-2 text-sm font-semibold inline-flex items-center gap-1 justify-center disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Allot
          </button>
          {save.error && <p className="col-span-full text-xs text-rose-700">{(save.error as Error).message}</p>}
        </form>
      </Card>

      <Card>
        <p className="font-semibold text-gray-800 mb-2">Existing Allotments — {year}</p>
        <div className="border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Faculty</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Department</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Subject</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Class</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(assignQ.data ?? []).map((a: any) => {
                const isGuest = deptToBranch(a.staff_users?.department) !== branch;
                return (
                  <tr key={a.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{a.staff_users?.name || a.staff_users?.username}</span>
                        {isGuest && (
                          <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">
                            GUEST
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 capitalize">{a.staff_users?.department ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs">{a.subjects?.code}</span> — {a.subjects?.name}
                    </td>
                    <td className="px-3 py-2 text-xs capitalize">
                      {a.branch} · Sem {a.semester}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => confirm("Remove this allotment?") && del.mutate(a.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {(assignQ.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400">
                    {assignQ.isLoading ? "Loading…" : "No allotments yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ─── ATTENDANCE REPORTS ─────────────────────────────────────────────────── */
function AttendanceReportsView({ defaultBranch = "", onBack }: { defaultBranch?: string; onBack: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);
  const semesterAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
  }, []);
  const [branch, setBranch] = useState(defaultBranch);
  const [sem, setSem] = useState<number | "">("");
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const q = useQuery({
    enabled: !!branch && !!sem,
    queryKey: ["hod-mon", branch, sem, from, to],
    queryFn: () => deptClassAttendance({ data: { branch, semester: Number(sem), from_date: from, to_date: to } }),
  });
  const rows = (q.data ?? []).map((s: any) => [s.enrollment_no, s.name, s.present, s.total, `${s.pct}%`]);
  const header = ["Enrollment", "Name", "Present", "Total", "Percentage"];
  const fileBase = `class_attendance_${branch}_S${sem}`;
  const title = `Class Attendance — ${branch}-Sem${sem}`;

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Attendance Reports</h1>
        <p className="text-xs text-gray-400 mb-4">Filter by branch + semester. Use quick ranges for monthly / semester view.</p>
        <div className="grid sm:grid-cols-4 gap-2 text-sm mb-2">
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="border rounded px-3 py-2 bg-white">
            <option value="">— Branch —</option>
            <option value="civil">Civil Engineering</option>
            <option value="mechanical">Mechanical Engineering</option>
            <option value="applied_science">Applied Sciences</option>
          </select>
          <select
            value={sem}
            onChange={(e) => setSem(e.target.value ? Number(e.target.value) : "")}
            className="border rounded px-3 py-2 bg-white"
          >
            <option value="">— Semester —</option>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <option key={s} value={s}>Sem {s}</option>
            ))}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-3 py-2" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-3 py-2" />
        </div>
        <div className="flex gap-2 mb-3 text-xs">
          <button onClick={() => { setFrom(monthAgo); setTo(today); }} className="border rounded px-2 py-1 hover:bg-gray-50">📅 This Month</button>
          <button onClick={() => { setFrom(semesterAgo); setTo(today); }} className="border rounded px-2 py-1 hover:bg-gray-50">📚 This Semester</button>
        </div>

        {rows.length > 0 && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => exportPDF(fileBase, title, `${from} to ${to}`, header, rows)}
              className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded"
            >
              PDF
            </button>
            <button
              onClick={() => exportExcel(fileBase, "Attendance", header, rows)}
              className="text-xs bg-green-700 text-white px-3 py-1.5 rounded"
            >
              Excel
            </button>
            <button
              onClick={() => exportCSV(fileBase, header, rows)}
              className="text-xs bg-gray-100 px-3 py-1.5 rounded"
            >
              CSV
            </button>
          </div>
        )}
        {q.data && (
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {header.map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const pct = q.data![i].pct;
                  return (
                    <tr key={i} className={`border-t ${pct < 75 ? "bg-rose-50" : ""}`}>
                      {r.map((c, j) => (
                        <td key={j} className="px-4 py-3">
                          {c}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Select a branch and semester to view attendance.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ─── SESSIONAL REPORTS (marks) — tabs: pending / approved ───────────────── */
function SessionalReportsView({ ay, onBack }: { ay: string; onBack: () => void }) {
  const [tab, setTab] = useState<"pending" | "approved" | "returned">("pending");
  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Sessional Reports</h1>
            <p className="text-xs text-gray-500">
              Validate internal marks sheets submitted by faculty. Approved sheets remain visible for reference.
            </p>
          </div>
          <div className="inline-flex rounded-lg border overflow-hidden text-xs">
            {(["pending", "approved", "returned"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 capitalize ${
                  tab === t ? "bg-[#7b1f4c] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <MarksTable ay={ay} status={tab} />
      </Card>
    </div>
  );
}

function ProvenanceBadge({ row, status }: { row: any; status: "pending" | "approved" | "returned" }) {
  const when = row.reviewed_at ? new Date(row.reviewed_at).toLocaleString() : null;
  const who = row.reviewer?.name || row.reviewer?.username;
  const cls =
    status === "approved"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "returned"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-slate-50 text-slate-600 border-slate-200";
  const label = status === "pending" ? "Pending" : status === "approved" ? "Approved" : "Returned";
  const tooltip =
    status === "pending"
      ? "Awaiting HOD review"
      : `${label}${who ? ` by ${who}` : ""}${when ? ` · ${when}` : ""}`;
  return (
    <span
      title={tooltip}
      className={`inline-flex flex-col items-start gap-0.5 px-2 py-1 rounded border text-[10px] leading-tight ${cls}`}
    >
      <span className="font-semibold uppercase tracking-wide">{label}</span>
      {status !== "pending" && (who || when) && (
        <span className="text-[9px] opacity-80">
          {who ? `by ${who}` : ""}
          {who && when ? " · " : ""}
          {when ?? ""}
        </span>
      )}
    </span>
  );
}

function MarksTable({ ay, status }: { ay: string; status: "pending" | "approved" | "returned" }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["hod-marks-groups", ay, status],
    queryFn: () => hodMarksGroups({ data: { academic_year: ay, status } }),
  });
  const [open, setOpen] = useState<any | null>(null);
  const detail = useQuery({
    enabled: !!open,
    queryKey: ["hod-marks-detail", open?.subject_id, open?.exam_type, ay],
    queryFn: () =>
      hodMarksDetail({ data: { subject_id: open.subject_id, exam_type: open.exam_type, academic_year: ay } }),
  });
  const review = useMutation({
    mutationFn: (v: { decision: "approved" | "returned"; remarks?: string }) =>
      hodReviewMarks({ data: { subject_id: open.subject_id, exam_type: open.exam_type, academic_year: ay, ...v } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hod-marks-groups"] });
      setOpen(null);
    },
  });
  return (
    <>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Class</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Exam</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Faculty</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">#</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((b: any, i: number) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-3 font-mono text-xs">
                  {b.subjects?.code} {b.subjects?.name}
                </td>
                <td className="px-4 py-3 text-xs capitalize">
                  {b.subjects?.branch}-Sem{b.subjects?.semester}
                </td>
                <td className="px-4 py-3 text-xs">{b.exam_type}</td>
                <td className="px-4 py-3">{b.staff_users?.name || b.staff_users?.username}</td>
                <td className="px-4 py-3 text-center">{b.count}</td>
                <td className="px-4 py-3"><ProvenanceBadge row={b} status={status} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setOpen(b)} className="text-xs underline text-indigo-700">
                    {status === "pending" ? "Review" : "View"}
                  </button>
                </td>
              </tr>
            ))}
            {q.data && q.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {status === "pending"
                    ? "No marks pending approval."
                    : status === "approved"
                      ? "No approved marks yet."
                      : "No returned marks."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && detail.data && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <h3 className="font-bold">
                {open.subjects?.code} — {open.exam_type}
              </h3>
              <p className="text-xs text-gray-400">
                Submitted by {open.staff_users?.name || open.staff_users?.username}
                {status === "approved" && <span className="ml-2 text-green-700">· Approved</span>}
                {status === "returned" && <span className="ml-2 text-amber-700">· Returned</span>}
              </p>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-400 font-medium">Enrollment</th>
                    <th className="text-left px-3 py-2 text-gray-400 font-medium">Name</th>
                    <th className="px-3 py-2 text-gray-400 font-medium">Marks</th>
                    <th className="text-left px-3 py-2 text-gray-400 font-medium">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.data.map((r: any) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">{r.students?.enrollment_no}</td>
                      <td className="px-3 py-2">{r.students?.name}</td>
                      <td className="px-3 py-2 text-center">
                        {r.obtained ?? "—"} / {r.max_marks}
                      </td>
                      <td className="px-3 py-2 text-xs">{r.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t flex gap-2 justify-end">
              {status === "pending" && (
                <>
                  <button
                    onClick={() => {
                      const r = prompt("Return remarks?", "Please revise.");
                      if (r != null) review.mutate({ decision: "returned", remarks: r });
                    }}
                    className="text-sm bg-amber-600 text-white px-3 py-1.5 rounded"
                  >
                    Return for Revision
                  </button>
                  <button
                    onClick={() => review.mutate({ decision: "approved" })}
                    className="text-sm bg-green-600 text-white px-3 py-1.5 rounded"
                  >
                    Approve &amp; Lock
                  </button>
                </>
              )}
              <button onClick={() => setOpen(null)} className="text-sm px-3 py-1.5">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── SYLLABUS COVERAGE ──────────────────────────────────────────────────── */
function SyllabusProgressView({
  branch,
  deptLabel,
  ay,
  onBack,
}: {
  branch: string;
  deptLabel: string;
  ay: string;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-xl font-bold text-gray-800">Syllabus Coverage — {deptLabel}</h1>
      <p className="text-xs text-gray-400 -mt-1">
        Lectures delivered per subject in your department. Same view is shown to students and the Principal.
      </p>
      <SyllabusCoverage mode="view" academicYear={ay} scope={{ branch }} filters="hod" />
    </div>
  );
}

/* ─── BRANCH TIMETABLE ───────────────────────────────────────────────────── */
function TimetableView({
  branch,
  ay,
  editable,
  onBack,
}: {
  branch: string;
  ay: string;
  editable: boolean;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const [sem, setSem] = useState(3);
  const periodsQ = useQuery({ queryKey: ["periods"], queryFn: () => listPeriods() });
  const ttQ = useQuery({
    queryKey: ["hod-tt", branch, sem, ay],
    queryFn: () => listTimetable({ data: { branch, semester: sem, academic_year: ay } }),
    enabled: !!branch,
  });
  const subjQ = useQuery({
    queryKey: ["subjects-of", branch, sem],
    queryFn: () => listSubjects({ data: { branch, semester: sem } as any }),
    enabled: !!branch,
  });
  const staffQ = useQuery({
    queryKey: ["staff-all"],
    queryFn: () => listStaffByRole({ data: {} as any }),
  });
  const save = useMutation({
    mutationFn: (d: any) =>
      hodUpsertTimetableSlot({ data: { branch, semester: sem, academic_year: ay, ...d } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hod-tt"] }),
  });

  const ORD = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Branch Timetable</h1>
            <p className="text-xs text-gray-400">
              {editable ? "Click any slot to edit. Restricted to your own branch." : "Read-only."}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={sem}
              onChange={(e) => setSem(Number(e.target.value))}
              className="border rounded px-2 py-1.5 text-sm bg-white"
            >
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <option key={s} value={s}>
                  {ORD[s]} Sem
                </option>
              ))}
            </select>
            <button
              onClick={() => window.print()}
              className="border rounded px-3 py-1.5 text-sm inline-flex items-center gap-1.5"
            >
              🖨️ Print
            </button>
          </div>
        </div>
        {save.error && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2 mb-2">
            {(save.error as Error).message}
          </p>
        )}
        {(periodsQ.data ?? []).length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">
            Periods Master not configured yet. Ask Admin to set it up.
          </p>
        ) : (
          <TimetableGrid
            periods={periodsQ.data as any}
            slots={(ttQ.data ?? []) as any}
            subjects={subjQ.data as any}
            staff={staffQ.data as any}
            editable={editable}
            onSaveSlot={(p: any) => save.mutate(p)}
            institutionLine="Govt. Polytechnic Kinnaur, Camp at GP Rohru Distt. Shimla (H.P.)"
            classLine={`${branchToDept(branch)} - ${ORD[sem]} Semester`}
          />
        )}
      </Card>
    </div>
  );
}

/* ─── LESSON PLAN REVIEWS ────────────────────────────────────────────────── */
function LessonsReviewView({ ay, onBack }: { ay: string; onBack: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["hod-lessons", ay],
    queryFn: () => hodPendingLessonPlans({ data: { academic_year: ay } }),
  });
  const review = useMutation({
    mutationFn: (v: { id: number; decision: "approved" | "returned"; hod_remarks?: string }) =>
      reviewLessonPlan({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hod-lessons"] }),
  });
  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-4">Pending Lesson Plan Reviews</h1>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Faculty</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Topic</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Planned</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">{p.staff_users?.username}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.subjects?.code}</td>
                  <td className="px-4 py-3">{p.topic}</td>
                  <td className="px-4 py-3 text-xs">{p.planned_date ?? "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => review.mutate({ id: p.id, decision: "approved" })}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded inline-flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const r = prompt("Remarks?");
                        if (r != null) review.mutate({ id: p.id, decision: "returned", hod_remarks: r });
                      }}
                      className="text-xs bg-amber-600 text-white px-2 py-1 rounded ml-1 inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Return
                    </button>
                  </td>
                </tr>
              ))}
              {q.data && q.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No pending lesson plans.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

