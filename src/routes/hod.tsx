import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  FileText,
  GraduationCap,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { facultyPhoto } from "@/lib/faculty-photos";
import { initialsOf } from "@/lib/portal-identity";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { QuickCard } from "@/components/portal/QuickCard";
import { HeroBanner } from "@/components/portal/HeroBanner";
import { hodRoles, hasRole } from "@/lib/roles";
import {
  hodDashboard,
  hodPendingLessonPlans,
  hodPendingMarks,
  hodMarksDetail,
  hodReviewMarks,
  deptClassAttendance,
  hodUpsertTimetableSlot,
} from "@/lib/hod.functions";
import { hodDepartmentOverview } from "@/lib/tpo.functions";
import { reviewLessonPlan, pendingLeavesForReview, reviewLeave } from "@/lib/faculty.functions";
import { listPeriods, listTimetable, listSubjects, listStaffByRole } from "@/lib/academic.functions";
import { TimetableGrid } from "@/components/portal/TimetableGrid";
import { exportPDF, exportExcel, exportCSV } from "@/lib/report-export";
import { BarStats } from "@/components/portal/Charts";
import { DepartmentOverviewPanel } from "@/components/portal/DepartmentOverviewPanel";
import { deptToBranch } from "@/lib/branch";
import { LessonPlanLibrary } from "@/components/portal/LessonPlanLibrary";
import { SyllabusCoverage } from "@/components/portal/SyllabusCoverage";

export const Route = createFileRoute("/hod")({
  head: () => portalMeta("HOD Portal"),
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
  | "marks";

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
      className="inline-flex items-center gap-1.5 text-sm text-gray-600 border rounded px-3 py-1.5 mb-5 hover:bg-gray-50"
    >
      <ArrowLeft className="w-4 h-4" /> Back to Dashboard
    </button>
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

  const [view, setView] = useState<View>("home");
  const ay = defaultAY();

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  const isViewer = me.role !== "hod";
  const branch = deptToBranch(me.department);
  const deptLabel = me.department || "Department";

  return (
    <PortalShell
      title={isViewer ? "HOD View (Read-only)" : "HOD Portal"}
      subtitle={`Academic Year ${ay}`}
      me={me as any}
      accent="indigo"
    >
      <div className="container mx-auto px-4 py-6">
        {isViewer && view !== "home" && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded px-3 py-2 mb-4">
            You are viewing the HOD portal as <strong className="capitalize">{me.role}</strong>. Approvals are disabled.
          </div>
        )}
        <fieldset
          disabled={isViewer && view === "marks"}
          className={isViewer && view === "marks" ? "pointer-events-none opacity-90" : ""}
        >
          {view === "home" && <HomeView me={me as any} deptLabel={deptLabel} onNav={setView} />}
          {view === "overview" && (
            <OverviewView branch={branch} ay={ay} deptLabel={deptLabel} onBack={() => setView("home")} />
          )}
          {view === "faculty" && <FacultyView branch={branch} ay={ay} onBack={() => setView("home")} />}
          {view === "attendance" && (
            <AttendanceReportsView defaultBranch={branch} onBack={() => setView("home")} />
          )}
          {view === "sessional" && <SessionalReportsView ay={ay} onBack={() => setView("home")} />}
          {view === "syllabus" && <SyllabusProgressView branch={branch} ay={ay} onBack={() => setView("home")} />}
          {view === "timetable" && (
            <TimetableView branch={branch} ay={ay} editable={!isViewer} onBack={() => setView("home")} />
          )}
          {view === "marks" && <MarksApprovalsView ay={ay} onBack={() => setView("home")} />}
        </fieldset>
      </div>
    </PortalShell>
  );
}

// ─── HOME (card grid) ─────────────────────────────────────────────────────────
function HomeView({ me, deptLabel, onNav }: { me: any; deptLabel: string; onNav: (v: View) => void }) {
  const ay = defaultAY();
  const q = useQuery({ queryKey: ["hod-dash", ay], queryFn: () => hodDashboard({ data: { academic_year: ay } }) });

  const cards: { icon: any; label: string; desc: string; color: string; border: string; view: View; badge?: number }[] =
    [
      {
        icon: BarChart3,
        label: "Department Overview",
        desc: "Comprehensive stats for your branch.",
        color: "bg-[#7b1f4c]",
        border: "border-[#7b1f4c]",
        view: "overview",
      },
      {
        icon: Users,
        label: "Manage Faculty",
        desc: "Review department teaching staff.",
        color: "bg-orange-500",
        border: "border-orange-500",
        view: "faculty",
      },
      {
        icon: ClipboardCheck,
        label: "Attendance Reports",
        desc: "Review branch-wide attendance.",
        color: "bg-gray-500",
        border: "border-gray-500",
        view: "attendance",
      },
      {
        icon: FileSpreadsheet,
        label: "Sessional Reports",
        desc: "Validate internal marks sheets.",
        color: "bg-green-600",
        border: "border-green-600",
        view: "sessional",
        badge: q.data?.pending_marks,
      },
      {
        icon: BookMarked,
        label: "Syllabus Progress",
        desc: "Track lesson plan completion.",
        color: "bg-rose-600",
        border: "border-rose-600",
        view: "syllabus",
        badge: q.data?.pending_lessons,
      },
      {
        icon: Calendar,
        label: "Branch Timetable",
        desc: "Verify class scheduling.",
        color: "bg-purple-600",
        border: "border-purple-600",
        view: "timetable",
      },
    ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Welcome, HOD({deptLabel})</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

// ─── DEPARTMENT OVERVIEW (the analytics hub) ──────────────────────────────────
function StatTile({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
      <span className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

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

// ─── MANAGE FACULTY ───────────────────────────────────────────────────────────
function FacultyView({ branch, ay, onBack }: { branch: string; ay: string; onBack: () => void }) {
  const q = useQuery({
    queryKey: ["hod-overview", branch, ay],
    queryFn: () => hodDepartmentOverview({ data: { branch, academic_year: ay } }),
  });
  const faculty = q.data?.faculty_details ?? [];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Manage Faculty</h1>
        <p className="text-xs text-gray-400 mb-4">Review department teaching staff and their workload.</p>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Department</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Weekly Load</th>
              </tr>
            </thead>
            <tbody>
              {faculty.map((f: any) => {
                const displayName = (f.name || f.username || "").toUpperCase();
                const photo = facultyPhoto(f.name || f.username);
                return (
                  <tr key={f.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-3">
                        {photo ? (
                          <img src={photo} alt={displayName} className="w-9 h-9 rounded-full object-cover border" />
                        ) : (
                          <span className="w-9 h-9 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold flex items-center justify-center">
                            {initialsOf(f.name || f.username)}
                          </span>
                        )}
                        <span>{displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-500">{f.role}</td>
                    <td className="px-4 py-3">{f.department ?? "—"}</td>
                    <td className="px-4 py-3">{f.load} periods</td>
                  </tr>
                );
              })}
              {faculty.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    {q.isLoading ? "Loading…" : "No faculty found."}
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

// ─── ATTENDANCE REPORTS (class monitor) ───────────────────────────────────────
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

// ─── SESSIONAL REPORTS (marks approvals) ──────────────────────────────────────
function SessionalReportsView({ ay, onBack }: { ay: string; onBack: () => void }) {
  return (
    <MarksApprovalsView
      ay={ay}
      onBack={onBack}
      titleOverride="Sessional Reports"
      descOverride="Validate internal marks sheets submitted by faculty."
    />
  );
}

// ─── SYLLABUS PROGRESS (date-wise lecture log + coverage %) ──────────────────
function SyllabusProgressView({ branch, ay, onBack }: { branch: string; ay: string; onBack: () => void }) {
  const defaultBranch =
    branch === "civil" ? "Civil Engineering" :
    branch === "mechanical" ? "Mechanical Engineering" :
    branch === "applied_science" ? "Applied Sciences" : branch;
  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-xl font-bold text-gray-800">Syllabus Progress</h1>
      <p className="text-xs text-gray-400 -mt-1">
        Lectures delivered per subject in your department. Same view is shown to students and the Principal.
      </p>
      <SyllabusCoverage mode="view" academicYear={ay} scope={{ branch: defaultBranch }} filters="hod" />
    </div>
  );
}


// ─── BRANCH TIMETABLE (HOD edits own branch only) ─────────────────────────────
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
  const BRANCHES: Record<string, string> = {
    civil: "Civil Engineering",
    mechanical: "Mechanical Engineering",
    applied_science: "Applied Sciences",
  };

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
            classLine={`${BRANCHES[branch] ?? branch} - ${ORD[sem]} Semester`}
          />
        )}
      </Card>
    </div>
  );
}


// ─── LESSON REVIEWS ───────────────────────────────────────────────────────────
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

// ─── MARKS APPROVALS ──────────────────────────────────────────────────────────
function MarksApprovalsView({
  ay,
  onBack,
  titleOverride,
  descOverride,
}: {
  ay: string;
  onBack: () => void;
  titleOverride?: string;
  descOverride?: string;
}) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["hod-marks", ay], queryFn: () => hodPendingMarks({ data: { academic_year: ay } }) });
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
      qc.invalidateQueries({ queryKey: ["hod-marks"] });
      setOpen(null);
    },
  });
  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">{titleOverride ?? "Marks Awaiting Approval"}</h1>
        {descOverride && <p className="text-xs text-gray-400 mb-4">{descOverride}</p>}
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Class</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Exam</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Faculty</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">#</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((b: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3 font-mono text-xs">
                    {b.subjects?.code} {b.subjects?.name}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {b.subjects?.branch}-Sem{b.subjects?.semester}
                  </td>
                  <td className="px-4 py-3 text-xs">{b.exam_type}</td>
                  <td className="px-4 py-3">{b.staff_users?.username}</td>
                  <td className="px-4 py-3 text-center">{b.count}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setOpen(b)} className="text-xs underline text-indigo-700">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {q.data && q.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No marks pending approval.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
              <p className="text-xs text-gray-400">Submitted by {open.staff_users?.username}</p>
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
              <button onClick={() => setOpen(null)} className="text-sm px-3 py-1.5">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LEAVE APPROVALS ──────────────────────────────────────────────────────────
function LeaveApprovalsView({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["hod-leaves"], queryFn: () => pendingLeavesForReview() });
  const review = useMutation({
    mutationFn: (v: { id: number; decision: "approved" | "rejected"; remarks?: string }) => reviewLeave({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hod-leaves"] }),
  });
  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-4">Pending Leave Applications</h1>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Staff</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">From</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">To</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((l: any) => (
                <tr key={l.id} className="border-t">
                  <td className="px-4 py-3">
                    {l.staff?.username}
                    <p className="text-xs text-gray-400">{l.staff?.department}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{l.leave_type}</td>
                  <td className="px-4 py-3 text-xs">{l.from_date}</td>
                  <td className="px-4 py-3 text-xs">{l.to_date}</td>
                  <td className="px-4 py-3 text-xs">{l.reason}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => review.mutate({ id: l.id, decision: "approved" })}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const r = prompt("Rejection remarks?");
                        if (r != null) review.mutate({ id: l.id, decision: "rejected", remarks: r });
                      }}
                      className="text-xs bg-rose-600 text-white px-2 py-1 rounded ml-1"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
              {q.data && q.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No pending leave.
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
