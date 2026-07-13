import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ComponentType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  principalDashboard,
  instituteAttendance,
  syllabusCompliance,
  instituteResults,
  listCirculars,
  createCircular,
  deleteCircular,
  principalMonthlyAttendance,
  principalFinalSessional,
} from "@/lib/principal.functions";
import {
  principalListStudents,
  listDisciplinaryActions,
  createDisciplinaryAction,
  deleteDisciplinaryAction,
} from "@/lib/assignments.functions";
import {
  listPlacements,
  hodDepartmentOverview,
  listIndustrialTraining,
  listGuestLectures,
} from "@/lib/tpo.functions";
import { listPeriods, listTimetable } from "@/lib/academic.functions";
import { TimetableGrid } from "@/components/portal/TimetableGrid";
import { LessonPlanLibrary } from "@/components/portal/LessonPlanLibrary";
import { SyllabusCoverage } from "@/components/portal/SyllabusCoverage";
import { QuickCard } from "@/components/portal/QuickCard";
import { HeroBanner } from "@/components/portal/HeroBanner";
import {
  listParentMessages,
  markParentMessageRead,
  deleteParentMessage,
  getPTM,
  upsertPTM,
} from "@/lib/admin-extras.functions";
import { exportRows } from "@/lib/report-export";
import {
  Trash2,
  Plus,
  Download,
  ArrowLeft,
  ClipboardCheck,
  FileSpreadsheet,
  BookMarked,
  Calendar,
  Briefcase,
  Mail,
  CalendarCheck,
  Shield,
  FileText,
  Video,
  BarChart3,
  ChevronDown,
  Home,
  LayoutDashboard,
  GraduationCap,
  Factory,
  ClipboardList,
} from "lucide-react";

import { BarStats, PieStats } from "@/components/portal/Charts";
import { DepartmentOverviewPanel } from "@/components/portal/DepartmentOverviewPanel";
import { staffMe, staffLogout } from "@/lib/auth.functions";

export const Route = createFileRoute("/principal")({
  head: () => ({
    meta: [
      { title: "Principal Portal — GP Kinnaur" },
      { name: "description", content: "Institute-wide attendance, results, syllabus compliance, and circulars." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PrincipalPortal,
});

function defaultYear() {
  const d = new Date();
  const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

type View =
  | "home"
  | "attendance"
  | "sessional"
  | "syllabus"
  | "timetable"
  | "placements"
  | "messages"
  | "ptm"
  | "circulars"
  | "disciplinary"
  | "department"
  | "tpo_placements"
  | "tpo_training"
  | "tpo_lectures";

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-gray-600 border rounded px-3 py-1.5 mb-5 hover:bg-gray-50 bg-white"
    >
      <ArrowLeft className="w-4 h-4" /> Back to Dashboard
    </button>
  );
}

function PrincipalPortal() {
  const [view, setView] = useState<View>("home");
  const [year, setYear] = useState(defaultYear());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { data: me } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });

  async function logout() {
    await staffLogout({});
    window.location.href = "/";
  }
  const initials = (me?.username || "P")[0].toUpperCase();

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
            <div
              className="w-10 h-10 rounded-full bg-[#7b1f4c]/10 flex items-center justify-center text-xl shrink-0"
              aria-hidden
            >
              🏛️
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">GP Kinnaur · Principal</p>
              <p className="font-bold text-gray-800">Principal Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-xs text-gray-400 hidden sm:block">AY</label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border rounded px-2 py-1 text-sm w-20"
              placeholder="2025-26"
            />
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
        <PrincipalSidebar
          active={view}
          onNav={navTo}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
        <main className="flex-1 min-w-0">
          {view === "home" && <HomeView year={year} onNav={setView} me={me as any} />}
          {view === "attendance" && <AttendanceReportsView year={year} onBack={() => setView("home")} />}
          {view === "sessional" && (
            <>
              <BackBtn onClick={() => setView("home")} />
              <ResultsMonitor year={year} />
            </>
          )}
          {view === "syllabus" && (
            <>
              <BackBtn onClick={() => setView("home")} />
              <SyllabusMonitor year={year} />
            </>
          )}
          {view === "timetable" && <TimetableView onBack={() => setView("home")} />}
          {view === "placements" && <PlacementDataView onBack={() => setView("home")} />}
          {view === "messages" && <MessagesView onBack={() => setView("home")} />}
          {view === "ptm" && <PTMView onBack={() => setView("home")} />}
          {view === "circulars" && (
            <>
              <BackBtn onClick={() => setView("home")} />
              <Circulars />
            </>
          )}
          {view === "disciplinary" && (
            <>
              <BackBtn onClick={() => setView("home")} />
              <Disciplinary />
            </>
          )}
          {view === "department" && <DepartmentOverviewView year={year} onBack={() => setView("home")} />}
          {view === "tpo_placements" && <PlacementDataView onBack={() => setView("home")} />}
          {view === "tpo_training" && <TpoTrainingDetailsView onBack={() => setView("home")} />}
          {view === "tpo_lectures" && <TpoLecturesDetailsView onBack={() => setView("home")} />}
        </main>
      </div>
    </div>
  );
}

/* ─── Sidebar with collapsible Principal + TPO groups ─────────────────────── */

type NavItem = { view: View; label: string; icon: ComponentType<{ className?: string }> };

const PRINCIPAL_NAV: NavItem[] = [
  { view: "home", label: "Dashboard", icon: Home },
  { view: "department", label: "Department Overview", icon: BarChart3 },
  { view: "attendance", label: "Attendance Reports", icon: ClipboardCheck },
  { view: "sessional", label: "Sessional Reports", icon: FileSpreadsheet },
  { view: "syllabus", label: "Syllabus Status", icon: BookMarked },
  { view: "timetable", label: "View Timetable", icon: Calendar },
  { view: "placements", label: "Placement Data", icon: Briefcase },
  { view: "messages", label: "Parents Messages", icon: Mail },
  { view: "ptm", label: "PTM Information", icon: CalendarCheck },
  { view: "circulars", label: "Circulars", icon: FileText },
  { view: "disciplinary", label: "Disciplinary Actions", icon: Shield },
];

// TPO section under Principal is view-only. All create/edit/delete rights remain with the TPO.
const TPO_NAV: NavItem[] = [
  { view: "tpo_placements", label: "Placement Details", icon: Briefcase },
  { view: "tpo_training", label: "Industrial Training Details", icon: Factory },
  { view: "tpo_lectures", label: "Guest Lecture Details", icon: ClipboardList },
];

function PrincipalSidebar({
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
  const [principalOpen, setPrincipalOpen] = useState(true);
  const [tpoOpen, setTpoOpen] = useState(false);

  const inner = (
    <nav className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 space-y-2">
      {/* Principal group */}
      <div>
        <button
          onClick={() => setPrincipalOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#7b1f4c] to-[#a63a6b] text-white text-sm font-semibold shadow-sm"
        >
          <span className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" /> Principal Portal
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${principalOpen ? "" : "-rotate-90"}`} />
        </button>
        {principalOpen && (
          <ul className="mt-1.5 space-y-0.5">
            {PRINCIPAL_NAV.map((item) => {
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

      {/* TPO group — view-only inside Principal Portal (management stays with TPO) */}
      <div>
        <button
          onClick={() => setTpoOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#5b1138] to-[#7b1f4c] text-white text-sm font-semibold shadow-sm"
        >
          <span className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> TPO Information
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${tpoOpen ? "" : "-rotate-90"}`} />
        </button>
        {tpoOpen && (
          <ul className="mt-1.5 space-y-0.5">
            {TPO_NAV.map((item) => {
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
    </nav>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-[76px] self-start">
        {inner}
      </aside>
      {/* Mobile drawer */}
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

// ─── HOME (card grid) ─────────────────────────────────────────────────────────
function HomeView({ year, onNav, me }: { year: string; onNav: (v: View) => void; me: any }) {
  const fn = useServerFn(principalDashboard);

  const { data } = useQuery({
    queryKey: ["principal-dash", year],
    queryFn: () => fn({ data: { academic_year: year } }),
  });

  const cards: { icon: any; label: string; desc: string; color: string; border: string; view: View; badge?: number }[] =
    [
      {
        icon: BarChart3,
        label: "Department Overview",
        desc: "Department-wise stats & analytics",
        color: "bg-[#5b1138]",
        border: "border-[#5b1138]",
        view: "department",
      },
      {
        icon: ClipboardCheck,
        label: "Attendance Reports",
        desc: "View student attendance summaries",
        color: "bg-[#7b1f4c]",
        border: "border-[#7b1f4c]",
        view: "attendance",
      },
      {
        icon: FileSpreadsheet,
        label: "Sessional Reports",
        desc: "Generate final internal marks reports",
        color: "bg-orange-500",
        border: "border-orange-500",
        view: "sessional",
        badge: data?.pending_marks,
      },
      {
        icon: BookMarked,
        label: "Syllabus Status",
        desc: "Monitor syllabus completion",
        color: "bg-gray-500",
        border: "border-gray-500",
        view: "syllabus",
      },
      {
        icon: Calendar,
        label: "View Timetable",
        desc: "Look up class schedules",
        color: "bg-green-600",
        border: "border-green-600",
        view: "timetable",
      },
      {
        icon: Briefcase,
        label: "Placement Data",
        desc: "Analyze student placement statistics",
        color: "bg-rose-600",
        border: "border-rose-600",
        view: "placements",
      },
      {
        icon: Mail,
        label: "Parents Messages",
        desc: "Review messages from parents",
        color: "bg-purple-600",
        border: "border-purple-600",
        view: "messages",
      },
      {
        icon: CalendarCheck,
        label: "PTM Information",
        desc: "Manage PTM details",
        color: "bg-cyan-500",
        border: "border-cyan-500",
        view: "ptm",
      },
      {
        icon: FileText,
        label: "Circulars",
        desc: "Publish institute circulars",
        color: "bg-[#4a0e2e]",
        border: "border-[#4a0e2e]",
        view: "circulars",
      },
      {
        icon: Shield,
        label: "Disciplinary Actions",
        desc: "Issue official student notices",
        color: "bg-gray-600",
        border: "border-gray-600",
        view: "disciplinary",
      },
    ];

  return (
    <div className="space-y-6">
      <HeroBanner
        name={me?.name || "Principal"}
        role="Principal"
        palette="principal"
        subtitle={
          <>
            Academic Year <span className="font-semibold text-amber-200">{year}</span>
            <span className="text-white/70"> · Institute-wide oversight & analytics.</span>
          </>
        }
        stats={[
          { value: data?.students ?? "—", label: "Students" },
          { value: data?.staff ?? "—", label: "Staff" },
          { value: data?.circulars ?? "—", label: "Circulars" },
        ]}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <QuickCard
            key={c.view}
            icon={c.icon}
            label={c.label}
            desc={c.desc}
            color={c.color}
            border={c.border}
            badge={c.badge}
            onClick={() => onNav(c.view)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── PLACEMENT DATA ───────────────────────────────────────────────────────────
function PlacementDataView({ onBack }: { onBack: () => void }) {
  const fn = useServerFn(listPlacements);
  const { data = [] } = useQuery({ queryKey: ["principal-placements"], queryFn: () => fn({ data: {} }) });
  const rows = data as any[];
  const latestYear = rows.length ? Math.max(...rows.map((r) => r.year)) : new Date().getFullYear();
  const byCompany = useMemo(() => {
    const agg = new Map<string, number>();
    rows.filter((r) => r.year === latestYear).forEach((r) => agg.set(r.company, (agg.get(r.company) ?? 0) + 1));
    return Array.from(agg.entries()).map(([label, value]) => ({ label, value }));
  }, [rows, latestYear]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <BackBtn onClick={onBack} />
        <button onClick={() => window.print()} className="border rounded px-3 py-1.5 text-sm inline-flex items-center gap-1.5 bg-white">🖨️ Print</button>
      </div>
      <div className="bg-white border rounded-lg p-5">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Placement Data (Read-only)</h1>
        <p className="text-xs text-gray-400 mb-4">View and analyze student placement records.</p>

        {byCompany.length > 0 ? (
          <>
            <p className="font-semibold text-gray-800 mb-3">Placements by Company ({latestYear})</p>
            <BarStats data={byCompany} color="#7b1f4c" />
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">No placement records yet.</p>
        )}
      </div>
      <div className="bg-white border rounded-lg p-5">
        <p className="font-semibold text-gray-800 mb-4">All Placement Records</p>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Student Name</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Roll Number</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Company</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Year</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Package (LPA)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.student_name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.roll_number ?? "—"}</td>
                  <td className="px-4 py-3">{r.company}</td>
                  <td className="px-4 py-3">{r.year}</td>
                  <td className="px-4 py-3">{r.package_lpa ?? "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No placement records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PARENTS MESSAGES ─────────────────────────────────────────────────────────
function MessagesView({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listParentMessages);
  const markFn = useServerFn(markParentMessageRead);
  const delFn = useServerFn(deleteParentMessage);
  const { data = [] } = useQuery({ queryKey: ["principal-messages"], queryFn: () => listFn() });
  const markRead = useMutation({
    mutationFn: (id: number) => markFn({ data: { id, status: "read" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["principal-messages"] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["principal-messages"] }),
  });
  const msgs = data as any[];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <div className="bg-white border rounded-lg p-5">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Parents Messages</h1>
        <p className="text-xs text-gray-400 mb-4">Inbox for all messages sent by parents.</p>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">From</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {msgs.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.from_name}</p>
                    {m.student_name && <p className="text-xs text-gray-400">{m.student_name}</p>}
                  </td>
                  <td className="px-4 py-3">{m.subject ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {m.created_at ? new Date(m.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {m.status === "new" ? (
                      <span className="text-xs px-2.5 py-1 bg-[#7b1f4c] text-white rounded-full font-semibold">
                        New
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 border rounded-full text-gray-500">Read</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 items-center">
                      {m.status === "new" && (
                        <button
                          onClick={() => markRead.mutate(m.id)}
                          className="text-xs text-[#7b1f4c] hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("Delete?")) del.mutate(m.id);
                        }}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {msgs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No messages from parents yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PTM INFORMATION ──────────────────────────────────────────────────────────
function PTMView({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const getFn = useServerFn(getPTM);
  const saveFn = useServerFn(upsertPTM);
  const { data: ptm } = useQuery({ queryKey: ["principal-ptm"], queryFn: () => getFn() });
  const [tab, setTab] = useState<"view" | "edit">("view");
  const [form, setForm] = useState({ date: "", time: "", agenda: "", meetLink: "" });

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          id: ptm?.id,
          meeting_date: form.date || ptm?.meeting_date || null,
          meeting_time: form.time || ptm?.meeting_time || null,
          agenda: form.agenda
            ? form.agenda.split("\n").filter(Boolean)
            : Array.isArray(ptm?.agenda)
              ? (ptm!.agenda as string[])
              : [],
          meet_link: form.meetLink || ptm?.meet_link || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["principal-ptm"] });
      setTab("view");
    },
  });

  const agenda = Array.isArray(ptm?.agenda) ? (ptm!.agenda as string[]) : [];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <div className="bg-white border rounded-lg p-5">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Manage PTM</h1>
        <p className="text-xs text-gray-400 mb-4">Set and view details for the next upcoming Parent-Teacher Meeting.</p>
        <div className="flex border rounded overflow-hidden mb-5">
          <button
            onClick={() => setTab("view")}
            className={`flex-1 py-2 text-sm font-medium ${tab === "view" ? "bg-white" : "bg-gray-50 text-gray-500"}`}
          >
            View Information
          </button>
          <button
            onClick={() => {
              setForm({
                date: ptm?.meeting_date ?? "",
                time: ptm?.meeting_time ?? "",
                agenda: agenda.join("\n"),
                meetLink: ptm?.meet_link ?? "",
              });
              setTab("edit");
            }}
            className={`flex-1 py-2 text-sm font-medium ${tab === "edit" ? "bg-white" : "bg-gray-50 text-gray-500"}`}
          >
            Edit Information
          </button>
        </div>
        {tab === "view" ? (
          <div className="space-y-5">
            <div className="flex gap-8 bg-gray-50 border rounded p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#7b1f4c]" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-semibold">{ptm?.meeting_date ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarCheck className="w-5 h-5 text-[#7b1f4c]" />
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="font-semibold">{ptm?.meeting_time ?? "—"}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#7b1f4c]" /> Agenda
              </p>
              {agenda.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {agenda.map((a, i) => (
                    <li key={i}>
                      {i + 1}. {a}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No agenda set.</p>
              )}
            </div>
            <div className="text-center">
              {ptm?.meet_link ? (
                <a
                  href={ptm.meet_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#7b1f4c] text-white px-6 py-2 rounded font-semibold"
                >
                  <Video className="w-4 h-4" /> Join Virtual Meeting
                </a>
              ) : (
                <button className="inline-flex items-center gap-2 bg-[#7b1f4c] text-white px-6 py-2 rounded font-semibold opacity-60 cursor-not-allowed">
                  <Video className="w-4 h-4" /> Join Virtual Meeting
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="border rounded w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Time</label>
                <input
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="e.g. 10:00 AM"
                  className="border rounded w-full px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Meet Link (optional)</label>
              <input
                value={form.meetLink}
                onChange={(e) => setForm({ ...form, meetLink: e.target.value })}
                placeholder="https://meet.google.com/…"
                className="border rounded w-full px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Agenda (one item per line)</label>
              <textarea
                rows={4}
                value={form.agenda}
                onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                className="border rounded w-full px-3 py-2 resize-y"
              />
            </div>
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="bg-[#7b1f4c] text-white px-5 py-2 rounded font-semibold disabled:opacity-50"
            >
              {save.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VIEW TIMETABLE (read-only with branch + sem selector) ────────────────────
function TimetableView({ onBack }: { onBack: () => void }) {
  const [branch, setBranch] = useState("mechanical");
  const [sem, setSem] = useState(3);
  const [year, setYear] = useState(defaultYear());
  const periodsQ = useQuery({ queryKey: ["periods"], queryFn: () => listPeriods() });
  const ttQ = useQuery({
    queryKey: ["principal-tt", branch, sem, year],
    queryFn: () => listTimetable({ data: { branch, semester: sem, academic_year: year } }),
  });
  const BRANCHES: Record<string, string> = {
    civil: "Civil Engineering",
    mechanical: "Mechanical Engineering",
    applied_science: "Applied Sciences",
  };
  const ORD = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <div className="bg-white border rounded-lg p-5">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Branch Timetable (Read-only)</h1>
            <p className="text-xs text-gray-400">View weekly schedule for any class.</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="border rounded px-2 py-1.5 text-sm bg-white">
              {Object.entries(BRANCHES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={sem} onChange={(e) => setSem(Number(e.target.value))} className="border rounded px-2 py-1.5 text-sm bg-white">
              {[1, 2, 3, 4, 5, 6].map((s) => <option key={s} value={s}>{ORD[s]} Sem</option>)}
            </select>
            <input value={year} onChange={(e) => setYear(e.target.value)} pattern="\d{4}-\d{2}" className="border rounded px-2 py-1.5 text-sm w-24" />
            <button onClick={() => window.print()} className="border rounded px-3 py-1.5 text-sm inline-flex items-center gap-1.5">
              🖨️ Print
            </button>
          </div>
        </div>
        {(periodsQ.data ?? []).length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">Periods Master not configured.</p>
        ) : (
          <TimetableGrid
            periods={periodsQ.data as any}
            slots={(ttQ.data ?? []) as any}
            editable={false}
            institutionLine="Govt. Polytechnic Kinnaur, Camp at GP Rohru Distt. Shimla (H.P.)"
            classLine={`${BRANCHES[branch] ?? branch} - ${ORD[sem]} Semester`}
          />
        )}
      </div>
    </div>
  );
}


function Card({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className={`bg-white border rounded-lg p-4 ${tone || ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-[color:var(--navy)] mt-1">{value}</p>
    </div>
  );
}

function AttendanceMonitor() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const fn = useServerFn(instituteAttendance);
  const { data = [], isFetching } = useQuery({
    queryKey: ["inst-att", from, to],
    queryFn: () => fn({ data: { from_date: from, to_date: to } }),
  });

  const totals = useMemo(() => {
    const t = (data as any[]).reduce((s, r) => s + r.total, 0);
    const p = (data as any[]).reduce((s, r) => s + r.present, 0);
    return { t, p, pct: t ? Math.round((p / t) * 1000) / 10 : 0 };
  }, [data]);

  function dl(fmt: "pdf" | "xlsx" | "csv") {
    exportRows({
      filename: `institute-attendance-${from}-to-${to}`,
      title: `Institute Attendance ${from} → ${to}`,
      columns: [
        { key: "branch", label: "Branch" },
        { key: "semester", label: "Sem" },
        { key: "students", label: "Students" },
        { key: "total", label: "Records" },
        { key: "present", label: "Present" },
        { key: "pct", label: "%" },
      ],
      rows: data as any[],
      format: fmt,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 bg-white border rounded p-3">
        <div>
          <label className="block text-xs text-muted-foreground">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="ml-auto flex gap-2">
          {(["pdf", "xlsx", "csv"] as const).map((f) => (
            <button
              key={f}
              onClick={() => dl(f)}
              className="text-xs border rounded px-3 py-1.5 flex items-center gap-1 hover:bg-secondary"
            >
              <Download className="w-3 h-3" /> {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Card label="Records" value={totals.t} />
        <Card label="Present" value={totals.p} />
        <Card label="Overall %" value={`${totals.pct}%`} tone={totals.pct < 75 ? "ring-1 ring-rose-300" : ""} />
      </div>
      <div className="bg-white border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--navy)] text-white">
            <tr>
              <th className="px-3 py-2 text-left">Branch</th>
              <th className="px-3 py-2 text-left">Sem</th>
              <th className="px-3 py-2 text-right">Students</th>
              <th className="px-3 py-2 text-right">Records</th>
              <th className="px-3 py-2 text-right">Present</th>
              <th className="px-3 py-2 text-right">%</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(data as any[]).map((r, i) => (
              <tr key={i} className={r.pct < 75 ? "bg-rose-50" : ""}>
                <td className="px-3 py-2 capitalize">{r.branch}</td>
                <td className="px-3 py-2">{r.semester}</td>
                <td className="px-3 py-2 text-right">{r.students}</td>
                <td className="px-3 py-2 text-right">{r.total}</td>
                <td className="px-3 py-2 text-right">{r.present}</td>
                <td className="px-3 py-2 text-right font-semibold">{r.pct}%</td>
              </tr>
            ))}
            {!isFetching && data.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-muted-foreground">
                  No attendance data in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultsMonitor({ year }: { year: string }) {
  const [examType, setExamType] = useState("internal_1");
  const fn = useServerFn(instituteResults);
  const { data = [] } = useQuery({
    queryKey: ["inst-results", year, examType],
    queryFn: () => fn({ data: { academic_year: year, exam_type: examType } }),
  });

  function dl(fmt: "pdf" | "xlsx" | "csv") {
    exportRows({
      filename: `institute-results-${year}-${examType}`,
      title: `Institute Results ${year} (${examType})`,
      columns: [
        { key: "branch", label: "Branch" },
        { key: "semester", label: "Sem" },
        { key: "entries", label: "Entries" },
        { key: "pass_pct", label: "Pass %" },
        { key: "avg_pct", label: "Avg %" },
      ],
      rows: data as any[],
      format: fmt,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 bg-white border rounded p-3">
        <div>
          <label className="block text-xs text-muted-foreground">Exam</label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="border rounded px-2 py-1 text-sm bg-white"
          >
            {["internal_1", "internal_2", "mid_term", "sessional", "final"].map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex gap-2">
          {(["pdf", "xlsx", "csv"] as const).map((f) => (
            <button
              key={f}
              onClick={() => dl(f)}
              className="text-xs border rounded px-3 py-1.5 flex items-center gap-1 hover:bg-secondary"
            >
              <Download className="w-3 h-3" /> {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--navy)] text-white">
            <tr>
              <th className="px-3 py-2 text-left">Branch</th>
              <th className="px-3 py-2 text-left">Sem</th>
              <th className="px-3 py-2 text-right">Entries</th>
              <th className="px-3 py-2 text-right">Pass %</th>
              <th className="px-3 py-2 text-right">Avg %</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(data as any[]).map((r, i) => (
              <tr key={i} className={r.pass_pct < 60 ? "bg-amber-50" : ""}>
                <td className="px-3 py-2 capitalize">{r.branch}</td>
                <td className="px-3 py-2">{r.semester}</td>
                <td className="px-3 py-2 text-right">{r.entries}</td>
                <td className="px-3 py-2 text-right font-semibold">{r.pass_pct}%</td>
                <td className="px-3 py-2 text-right">{r.avg_pct}%</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-muted-foreground">
                  No approved marks for this exam yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SyllabusMonitor(props: { year: string }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Lectures delivered per subject across the institute. The same view is available in HOD and Student portals.
      </p>
      <SyllabusCoverage mode="view" academicYear={props.year} filters="principal" title="Institute-wide Syllabus Coverage" />
    </div>
  );
}


function Circulars() {
  const qc = useQueryClient();
  const list = useServerFn(listCirculars);
  const create = useServerFn(createCircular);
  const del = useServerFn(deleteCircular);
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({ queryKey: ["circulars"], queryFn: () => list() });
  const mCreate = useMutation({
    mutationFn: (d: any) => create({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["circulars"] });
      setOpen(false);
    },
  });
  const mDel = useMutation({
    mutationFn: (id: number) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["circulars"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[color:var(--navy)]">Circulars</h2>
        <button
          onClick={() => setOpen(true)}
          className="bg-[color:var(--gold)] text-[color:var(--navy)] px-4 py-2 rounded font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Circular
        </button>
      </div>
      <div className="space-y-2">
        {(data as any[]).map((c) => (
          <div key={c.id} className="bg-white border rounded p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-[color:var(--navy)] text-white px-2 py-0.5 rounded">
                  {new Date(c.published_at).toLocaleDateString()}
                </span>
                <span className="bg-secondary px-2 py-0.5 rounded uppercase">{c.audience}</span>
                {c.staff_users?.username && <span className="text-muted-foreground">by {c.staff_users.username}</span>}
              </div>
              <p className="font-semibold mt-2">{c.title}</p>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{c.body}</p>
              {c.attachment_url && (
                <a
                  href={c.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[color:var(--navy)] underline mt-1 inline-block"
                >
                  Attachment
                </a>
              )}
            </div>
            <button
              onClick={() => confirm("Delete circular?") && mDel.mutate(c.id)}
              className="text-destructive p-2 hover:bg-destructive/10 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground bg-white border rounded p-6 text-center">No circulars yet.</p>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="bg-white rounded-lg p-5 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">New Circular</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                mCreate.mutate({
                  title: fd.get("title"),
                  body: fd.get("body"),
                  audience: fd.get("audience") || "all",
                  attachment_url: fd.get("attachment_url") || undefined,
                });
              }}
              className="space-y-3"
            >
              <input name="title" required placeholder="Title" className="w-full border rounded px-3 py-2 text-sm" />
              <textarea
                name="body"
                required
                rows={5}
                placeholder="Body"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <select name="audience" className="w-full border rounded px-3 py-2 text-sm bg-white">
                {["all", "staff", "faculty", "hod", "students"].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <input
                name="attachment_url"
                placeholder="Attachment URL (optional)"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <button
                disabled={mCreate.isPending}
                className="w-full bg-[color:var(--navy)] text-white py-2 rounded font-semibold disabled:opacity-50"
              >
                Publish
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Disciplinary() {
  const qc = useQueryClient();
  const studentsFn = useServerFn(principalListStudents);
  const listFn = useServerFn(listDisciplinaryActions);
  const createFn = useServerFn(createDisciplinaryAction);
  const delFn = useServerFn(deleteDisciplinaryAction);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: students = [] } = useQuery({ queryKey: ["principal-students"], queryFn: () => studentsFn() });
  const { data = [] } = useQuery({ queryKey: ["disciplinary"], queryFn: () => listFn({ data: {} }) });

  const mCreate = useMutation({
    mutationFn: (d: any) => createFn({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplinary"] });
      setOpen(false);
    },
  });
  const mDel = useMutation({
    mutationFn: (id: number) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinary"] }),
  });

  const filteredStudents = search
    ? (students as any[]).filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.enrollment_no.toLowerCase().includes(search.toLowerCase()),
      )
    : (students as any[]);

  const sevTone: Record<string, string> = {
    notice: "bg-amber-100 text-amber-800",
    warning: "bg-orange-100 text-orange-800",
    suspension: "bg-rose-100 text-rose-800",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[color:var(--navy)]">Disciplinary Actions</h2>
          <p className="text-xs text-muted-foreground">
            Issue official disciplinary notices to students. Only the Principal can manage these.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-[color:var(--gold)] text-[color:var(--navy)] px-4 py-2 rounded font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Issue Action
        </button>
      </div>

      <div className="space-y-2">
        {(data as any[]).map((d) => (
          <div key={d.id} className="bg-white border rounded p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded capitalize font-semibold ${sevTone[d.severity] ?? sevTone.notice}`}
                >
                  {d.severity}
                </span>
                <span className="bg-secondary px-2 py-0.5 rounded">Issued {d.action_date}</span>
                {d.resolution_date && (
                  <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                    Resolve by {d.resolution_date}
                  </span>
                )}
                <span className="text-muted-foreground">
                  {d.students?.name} · {d.students?.enrollment_no}
                </span>
              </div>
              <p className="font-semibold mt-2">{d.title}</p>
              {d.detail && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{d.detail}</p>}
            </div>
            <button
              onClick={() => confirm("Delete this disciplinary action?") && mDel.mutate(d.id)}
              className="text-destructive p-2 hover:bg-destructive/10 rounded shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground bg-white border rounded p-6 text-center">
            No disciplinary actions on record.
          </p>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="bg-white rounded-lg p-5 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">Issue Disciplinary Action</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const sid = fd.get("student_id");
                if (!sid) return;
                mCreate.mutate({
                  student_id: Number(sid),
                  title: fd.get("title"),
                  detail: fd.get("detail") || null,
                  action_date: fd.get("action_date") || null,
                  resolution_date: fd.get("resolution_date") || null,
                  severity: fd.get("severity") || "notice",
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Search student</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or enrollment no…"
                  className="w-full border rounded px-3 py-2 text-sm mb-2"
                />
                <select name="student_id" required className="w-full border rounded px-3 py-2 text-sm bg-white">
                  <option value="">Select student</option>
                  {filteredStudents.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.enrollment_no} ({s.branch}-Sem{s.semester})
                    </option>
                  ))}
                </select>
              </div>
              <input
                name="title"
                required
                placeholder="Title (e.g. Late submission, Misconduct)"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <textarea
                name="detail"
                rows={4}
                placeholder="Details of the action / notice…"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Action Date</label>
                  <input type="date" name="action_date" className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Last Date of Resolution</label>
                  <input type="date" name="resolution_date" className="w-full border rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <select
                name="severity"
                defaultValue="notice"
                className="w-full border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="notice">Notice</option>
                <option value="warning">Warning</option>
                <option value="suspension">Suspension</option>
              </select>
              {mCreate.error && <p className="text-xs text-destructive">{(mCreate.error as Error).message}</p>}
              <button
                disabled={mCreate.isPending}
                className="w-full bg-[color:var(--navy)] text-white py-2 rounded font-semibold disabled:opacity-50"
              >
                {mCreate.isPending ? "Issuing…" : "Issue Action"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DEPARTMENT OVERVIEW (read-only, with department dropdown) ────────────────
function DepartmentOverviewView({ year, onBack }: { year: string; onBack: () => void }) {
  const [branch, setBranch] = useState("");
  const q = useQuery({
    enabled: !!branch,
    queryKey: ["principal-dept-overview", branch, year],
    queryFn: () => hodDepartmentOverview({ data: { branch, academic_year: year } }),
  });

  const BRANCHES = [
    { value: "civil", label: "Civil Engineering" },
    { value: "mechanical", label: "Mechanical Engineering" },
    { value: "applied_science", label: "Applied Sciences" },
  ];
  const selectedLabel = BRANCHES.find((b) => b.value === branch)?.label;

  return (
    <div className="space-y-5">
      <BackBtn onClick={onBack} />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800">
          Department Overview{selectedLabel ? ` — ${selectedLabel}` : ""}
        </h1>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Department</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="border rounded px-3 py-2 text-sm bg-white min-w-[200px]"
          >
            <option value="">Select a department…</option>
            {BRANCHES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!branch ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <p className="text-gray-500 text-sm">
            Please select a department from the dropdown above to view its overview.
          </p>
        </div>
      ) : q.isLoading || !q.data ? (
        <p className="text-sm text-gray-400">Loading department analytics…</p>
      ) : (
        <DepartmentOverviewPanel d={q.data as any} />
      )}
    </div>
  );
}

// ─── ATTENDANCE REPORTS (read-only, department-wise) ──────────────────────────
function AttendanceReportsView({ year, onBack }: { year: string; onBack: () => void }) {
  const [branch, setBranch] = useState("");
  const [sem, setSem] = useState<number | "">("");
  const [tab, setTab] = useState<"monthly" | "final-att" | "sessional">("monthly");
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);

  const BRANCHES = [
    { value: "civil", label: "Civil Engineering" },
    { value: "mechanical", label: "Mechanical Engineering" },
    { value: "applied_science", label: "Applied Sciences" },
  ];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <h1 className="text-2xl font-bold text-gray-800">Attendance &amp; Sessional Reports</h1>
        <button
          onClick={() => window.print()}
          className="border px-3 py-2 rounded text-sm inline-flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" /> Print
        </button>
      </div>

      <div className="bg-white border rounded-lg p-4 print:hidden">
        <div className="grid sm:grid-cols-4 gap-3 text-sm">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Department</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="border rounded w-full px-3 py-2 bg-white"
            >
              <option value="">Select…</option>
              {BRANCHES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Semester</label>
            <select
              value={sem}
              onChange={(e) => setSem(e.target.value ? Number(e.target.value) : "")}
              className="border rounded w-full px-3 py-2 bg-white"
            >
              <option value="">Select…</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  Sem {n}
                </option>
              ))}
            </select>
          </div>
          {tab === "monthly" && (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">From</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="border rounded w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">To</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="border rounded w-full px-3 py-2"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex border rounded overflow-hidden mt-4 text-sm">
          {(
            [
              { k: "monthly", label: "Monthly Attendance" },
              { k: "final-att", label: "Final Attendance" },
              { k: "sessional", label: "Final Sessional Report" },
            ] as const
          ).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex-1 py-2 font-medium ${tab === t.k ? "bg-[#7b1f4c] text-white" : "bg-gray-50 text-gray-600"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!branch || !sem ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <p className="text-gray-500 text-sm">Select a department and semester to view the report.</p>
        </div>
      ) : tab === "monthly" ? (
        <MonthlyAttendanceReport branch={branch} sem={sem as number} from_date={from} to_date={to} />
      ) : tab === "final-att" ? (
        <MonthlyAttendanceReport
          branch={branch}
          sem={sem as number}
          from_date={`${year.slice(0, 4)}-08-01`}
          to_date={`${Number(year.slice(0, 4)) + 1}-07-31`}
          isFinal
        />
      ) : (
        <SessionalReport branch={branch} sem={sem as number} academic_year={year} />
      )}
    </div>
  );
}

function MonthlyAttendanceReport({
  branch,
  sem,
  from_date,
  to_date,
  isFinal,
}: {
  branch: string;
  sem: number;
  from_date: string;
  to_date: string;
  isFinal?: boolean;
}) {
  const q = useQuery({
    queryKey: ["principal-monthly-att", branch, sem, from_date, to_date],
    queryFn: () => principalMonthlyAttendance({ data: { branch, semester: sem, from_date, to_date } }),
  });

  if (q.isLoading || !q.data) {
    return <p className="text-sm text-gray-400 text-center py-8">Loading…</p>;
  }
  const { students, subjects, cells } = q.data as any;
  const theory = (subjects as any[]).filter((s) => s.kind === "theory");
  const practical = (subjects as any[]).filter((s) => s.kind === "practical");

  function rowSummary(sid: number, subset: any[]) {
    let p = 0,
      t = 0;
    subset.forEach((sub) => {
      const c = cells?.[sid]?.[sub.id];
      if (c) {
        p += c.present;
        t += c.total;
      }
    });
    const pct = t ? Math.round((p / t) * 1000) / 10 : 0;
    return { p, t, pct, fine: pct < 75 ? Math.round((75 - pct) * 10) : 0 };
  }

  return (
    <div className="bg-white border rounded-lg p-4 overflow-x-auto">
      <div className="text-center mb-3">
        <p className="font-bold text-gray-800">OFFICE OF THE PRINCIPAL</p>
        <p className="font-bold text-gray-800">GOVT. POLYTECHNIC KINNAUR CAMP AT ROHRU</p>
        <p className="text-sm mt-1">
          {isFinal ? "FINAL " : ""}ATTENDANCE POSITION OF {sem}
          {ordinalSuffix(sem)} SEM {branch.toUpperCase()} BRANCH
          <span className="text-xs text-gray-500">
            {" "}
            · {from_date} to {to_date}
          </span>
        </p>
      </div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th rowSpan={2} className="border px-2 py-1">
              S.No
            </th>
            <th rowSpan={2} className="border px-2 py-1 text-left">
              Name
            </th>
            {theory.length > 0 && (
              <th colSpan={theory.length} className="border px-2 py-1">
                THEORY
              </th>
            )}
            {practical.length > 0 && (
              <th colSpan={practical.length} className="border px-2 py-1">
                PRACTICAL
              </th>
            )}
            <th rowSpan={2} className="border px-2 py-1">
              TOTAL
            </th>
            <th rowSpan={2} className="border px-2 py-1">
              %age
            </th>
            <th rowSpan={2} className="border px-2 py-1">
              FINE
              <br />
              RUPEES
            </th>
          </tr>
          <tr className="bg-gray-50">
            {theory.map((s: any) => (
              <th key={s.id} className="border px-1 py-1 font-mono">
                {s.code}
              </th>
            ))}
            {practical.map((s: any) => (
              <th key={s.id} className="border px-1 py-1 font-mono">
                {s.code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(students as any[]).map((stud, i) => {
            const all = rowSummary(stud.id, [...theory, ...practical]);
            return (
              <tr key={stud.id} className={all.pct < 75 ? "bg-rose-50" : ""}>
                <td className="border px-2 py-1 text-center">{i + 1}</td>
                <td className="border px-2 py-1">{stud.name}</td>
                {theory.map((s: any) => {
                  const c = cells?.[stud.id]?.[s.id];
                  return (
                    <td key={s.id} className="border px-1 py-1 text-center">
                      {c ? `${c.present}/${c.total}` : "-"}
                    </td>
                  );
                })}
                {practical.map((s: any) => {
                  const c = cells?.[stud.id]?.[s.id];
                  return (
                    <td key={s.id} className="border px-1 py-1 text-center">
                      {c ? `${c.present}/${c.total}` : "-"}
                    </td>
                  );
                })}
                <td className="border px-2 py-1 text-center font-semibold">
                  {all.p}/{all.t}
                </td>
                <td className="border px-2 py-1 text-center font-semibold">{all.pct}%</td>
                <td className="border px-2 py-1 text-center text-rose-600">{all.fine > 0 ? all.fine : ""}</td>
              </tr>
            );
          })}
          {students.length === 0 && (
            <tr>
              <td colSpan={6 + theory.length + practical.length} className="border px-2 py-6 text-center text-gray-400">
                No students found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex justify-between mt-8 text-xs px-2">
        <p className="font-bold">Class Incharge</p>
        <p className="font-bold">HOD</p>
        <p className="font-bold">
          Principal
          <br />
          <span className="font-normal text-gray-500">GP Kinnaur</span>
        </p>
      </div>
    </div>
  );
}

function SessionalReport({ branch, sem, academic_year }: { branch: string; sem: number; academic_year: string }) {
  const q = useQuery({
    queryKey: ["principal-final-sessional", branch, sem, academic_year],
    queryFn: () => principalFinalSessional({ data: { branch, semester: sem, academic_year } }),
  });

  if (q.isLoading || !q.data) {
    return <p className="text-sm text-gray-400 text-center py-8">Loading…</p>;
  }
  const { students, theory, practical, marks } = q.data as any;

  function SubReport({ heading, subjects }: { heading: string; subjects: any[] }) {
    if (subjects.length === 0) return null;
    // Common max marks per subject in your format (Internal Assessment).
    // Display 40 max / 16 min as in the reference; these can be configured later.
    const maxPerSubject = 40;
    const minPerSubject = 16;
    const grandMax = maxPerSubject * subjects.length;

    return (
      <div className="overflow-x-auto mb-8">
        <div className="text-center mb-3">
          <p className="font-bold text-gray-800">CONSOLIDATED DETAIL OF INTERNAL ASSESSMENT ({heading})</p>
          <p className="text-sm mt-1">
            <span className="font-semibold">Institute:</span> GOVT. POLYTECHNIC KINNAUR ·
            <span className="font-semibold ml-2">Semester:</span> {sem}
            {ordinalSuffix(sem)} ·<span className="font-semibold ml-2">Branch:</span> {branch.toUpperCase()} ·
            <span className="font-semibold ml-2">Session:</span> {academic_year}
          </p>
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th rowSpan={3} className="border px-2 py-1">
                Sr.
                <br />
                No
              </th>
              <th rowSpan={3} className="border px-2 py-1">
                Board Roll No
              </th>
              <th rowSpan={3} className="border px-2 py-1 text-left">
                Name of the Candidate
              </th>
              <th colSpan={subjects.length} className="border px-2 py-1">
                Name of the Subjects
              </th>
              <th rowSpan={3} className="border px-2 py-1">
                Grand
                <br />
                Total
              </th>
            </tr>
            <tr className="bg-gray-50">
              {subjects.map((s: any) => (
                <th key={s.id} className="border px-1 py-1 font-mono">
                  {s.code}
                </th>
              ))}
            </tr>
            <tr className="bg-gray-50">
              {subjects.map((s: any) => (
                <th key={s.id} className="border px-1 py-1 text-[10px] text-gray-500">
                  Max {maxPerSubject} / Min {minPerSubject}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(students as any[]).map((stud, i) => {
              const studentMarks = marks?.[stud.id] ?? {};
              const total = subjects.reduce((sum: number, s: any) => sum + (studentMarks[s.id] ?? 0), 0);
              return (
                <tr key={stud.id}>
                  <td className="border px-2 py-1 text-center">{i + 1}</td>
                  <td className="border px-2 py-1 font-mono">{stud.enrollment_no}</td>
                  <td className="border px-2 py-1">{stud.name}</td>
                  {subjects.map((s: any) => {
                    const v = studentMarks[s.id];
                    const fail = v != null && v < minPerSubject;
                    return (
                      <td
                        key={s.id}
                        className={`border px-1 py-1 text-center ${fail ? "text-rose-600 font-semibold" : ""}`}
                      >
                        {v != null ? v.toFixed(1) : "-"}
                      </td>
                    );
                  })}
                  <td className="border px-2 py-1 text-center font-semibold">{total.toFixed(1)}</td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={4 + subjects.length} className="border px-2 py-6 text-center text-gray-400">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold">
              <td colSpan={3 + subjects.length} className="border px-2 py-1 text-right">
                Grand Max:
              </td>
              <td className="border px-2 py-1 text-center">{grandMax}</td>
            </tr>
          </tfoot>
        </table>
        <div className="flex justify-between mt-4 text-xs px-2">
          <p>Prepared by: ____________</p>
          <p>Checked by: ____________</p>
          <p className="font-bold">Principal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <SubReport heading="Theory" subjects={theory} />
      <SubReport heading="Practical" subjects={practical} />
      {theory.length === 0 && practical.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No subjects configured for this branch/semester.</p>
      )}
    </div>
  );
}

function ordinalSuffix(n: number) {
  if (n % 10 === 1 && n !== 11) return "st";
  if (n % 10 === 2 && n !== 12) return "nd";
  if (n % 10 === 3 && n !== 13) return "rd";
  return "th";
}
