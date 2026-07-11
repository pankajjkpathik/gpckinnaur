import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Download,
  FileText,
  BookOpen,
  GraduationCap,
  Upload,
  BookMarked,
  DollarSign,
  Users,
  Shield,
  ArrowLeft,
  Printer,
  CheckCircle2,
  MessageCircle,
  ClipboardCheck,
  FileSpreadsheet,
  Calendar,
  CalendarClock,
  NotebookPen,
} from "lucide-react";
import { studentMe, studentLogout } from "@/lib/auth.functions";
import { listMaterials } from "@/lib/materials.functions";
import {
  studentDashboard,
  studentAttendance,
  studentMarks,
  studentTimetable,
  studentSyllabus,
  studentMyLeaves,
  studentApplyLeave,
  studentCancelLeave,
  studentCalendar,
  studentCirculars,
  studentGrading,
  studentFaculty,
  studentDocuments,
} from "@/lib/student.functions";
import {
  studentListAssignments,
  studentSubmitAssignment,
  studentMySubmissions,
  studentMyFees,
  studentMyDisciplinary,
} from "@/lib/assignments.functions";
import { studentParentStatus, studentSetParentPassword } from "@/lib/parent.functions";
import { LessonPlanLibrary } from "@/components/portal/LessonPlanLibrary";
import { SyllabusCoverage } from "@/components/portal/SyllabusCoverage";
import { QuickCard } from "@/components/portal/QuickCard";
import logoAsset from "@/assets/logo.png.asset.json";


export const Route = createFileRoute("/student-dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — GP Kinnaur" },
      {
        name: "description",
        content: "Student Dashboard — GP Kinnaur at Government Polytechnic, Kinnaur — internal portal page.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: StudentDashboard,
});

type View =
  | "home"
  | "attendance"
  | "marks"
  | "results"
  | "semester-reports"
  | "upload"
  | "assignments-docs"
  | "lesson-plans"
  | "exam-schedule"
  | "timetable"
  | "syllabus"
  | "fees"
  | "faculty"
  | "disciplinary"
  | "parent-access";

const EXAM_TABS = [
  { key: "house_test", label: "House Test" },
  { key: "first_class_test", label: "Class Test 1" },
  { key: "second_class_test", label: "Class Test 2" },
  { key: "assignment", label: "Assignment 1" },
  { key: "assignment_2", label: "Assignment 2" },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────
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

function gradeFor(pct: number, scheme: any[]): string {
  const row = scheme.find((s) => pct >= Number(s.min_pct) && pct <= Number(s.max_pct));
  return row?.grade ?? "—";
}

function StudentDashboard() {
  const navigate = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["student-me"], queryFn: () => studentMe() });
  const [view, setView] = useState<View>("home");

  useEffect(() => {
    if (!isLoading && !me) navigate({ to: "/student-login" });
  }, [me, isLoading, navigate]);

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  async function logout() {
    await studentLogout({});
    window.location.href = "/";
  }

  const initials = me.name
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f7fb]">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logoAsset.url}
              alt="GP Kinnaur logo"
              className="w-10 h-10 object-contain rounded-full bg-white p-0.5 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">GP Kinnaur · Student</p>
              <p className="font-bold text-gray-800">Student Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link to="/student-profile" className="px-3 py-1.5 rounded border hover:bg-gray-50 text-xs text-gray-600">
              👤 Profile
            </Link>
            <Link to="/messages" className="px-3 py-1.5 rounded border hover:bg-gray-50 text-xs text-gray-600">
              Messages
            </Link>
            <a
              href="/student-change-password"
              className="px-3 py-1.5 rounded border hover:bg-gray-50 text-xs text-gray-600"
            >
              Change Password
            </a>
            <button onClick={logout} className="px-3 py-1.5 rounded border hover:bg-gray-50 text-xs text-gray-600">
              Logout
            </button>
            {me.image_url ? (
              <img src={me.image_url} alt={me.name} className="w-9 h-9 rounded-full object-cover border-2 border-[#7b1f4c]/40" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#7b1f4c] text-white flex items-center justify-center font-bold text-sm">
                {initials}
              </div>
            )}
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider text-gray-700">{me.name?.toUpperCase()}</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {view === "home" && <HomeView me={me} onNav={setView} />}
        {view === "attendance" && <AttendanceView onBack={() => setView("home")} />}
        {view === "marks" && <MarksView onBack={() => setView("home")} />}
        {view === "results" && <ResultsView me={me} onBack={() => setView("home")} />}
        {view === "semester-reports" && <SemesterReportsView me={me} onBack={() => setView("home")} />}
        {view === "parent-access" && <ParentAccessView onBack={() => setView("home")} />}
        {view === "upload" && <UploadAssignmentView onBack={() => setView("home")} />}
        {view === "documents" && <DocumentsView onBack={() => setView("home")} />}
        {view === "fees" && <FeesView onBack={() => setView("home")} />}
        {view === "faculty" && <FacultyView onBack={() => setView("home")} />}
        {view === "disciplinary" && <DisciplinaryView onBack={() => setView("home")} />}
      </div>
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeView({ me, onNav }: { me: any; onNav: (v: View) => void }) {
  const cards: { icon: any; label: string; desc: string; color: string; border: string; view: View }[] = [
    {
      icon: ClipboardCheck,
      label: "My Attendance",
      desc: "View your attendance record",
      color: "bg-[#7b1f4c]",
      border: "border-[#7b1f4c]",
      view: "attendance",
    },
    {
      icon: FileSpreadsheet,
      label: "My Marks",
      desc: "Check your internal marks",
      color: "bg-orange-500",
      border: "border-orange-500",
      view: "marks",
    },
    {
      icon: GraduationCap,
      label: "My Results",
      desc: "View your board results",
      color: "bg-gray-500",
      border: "border-gray-500",
      view: "results",
    },
    {
      icon: FileText,
      label: "Semester Reports",
      desc: "Download progress reports",
      color: "bg-green-600",
      border: "border-green-600",
      view: "semester-reports",
    },


    {
      icon: Upload,
      label: "Upload Assignment",
      desc: "Submit your completed work",
      color: "bg-purple-600",
      border: "border-purple-600",
      view: "upload",
    },
    {
      icon: BookOpen,
      label: "Documents",
      desc: "Access shared documents",
      color: "bg-cyan-500",
      border: "border-cyan-500",
      view: "documents",
    },
    {
      icon: DollarSign,
      label: "Fees Payment",
      desc: "Check and pay your fees",
      color: "bg-gray-400",
      border: "border-gray-400",
      view: "fees",
    },
    {
      icon: Users,
      label: "My Faculty",
      desc: "Contact your teachers",
      color: "bg-[#7b1f4c]",
      border: "border-[#7b1f4c]",
      view: "faculty",
    },
    {
      icon: Shield,
      label: "Disciplinary Actions",
      desc: "View any official notices",
      color: "bg-orange-500",
      border: "border-orange-500",
      view: "disciplinary",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Welcome, {me.name ? me.name.toUpperCase() : "STUDENT"}</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <button
            key={c.view}
            onClick={() => onNav(c.view)}
            className={`flex items-center gap-4 p-4 bg-white rounded border-t-4 ${c.border} shadow-sm hover:shadow-md transition-shadow text-left w-full`}
          >
            <span className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${c.color}`}>
              <c.icon className="w-6 h-6 text-white" />
            </span>
            <span>
              <p className="font-semibold text-gray-800 text-sm">{c.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MY ATTENDANCE ────────────────────────────────────────────────────────────
function AttendanceView({ onBack }: { onBack: () => void }) {
  const fn = useServerFn(studentAttendance);
  const { data, isLoading } = useQuery({ queryKey: ["student-att"], queryFn: () => fn() });

  const overall = useMemo(() => {
    if (!data) return 0;
    const t = data.by_subject.reduce((s: number, x: any) => s + x.total, 0);
    const p = data.by_subject.reduce((s: number, x: any) => s + x.present, 0);
    return t ? Math.round((p / t) * 100) : 0;
  }, [data]);

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">My Attendance</h1>
        <p className="text-xs text-gray-400 mb-6">
          A detailed breakdown of your attendance record for the current semester.
        </p>

        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm">Overall Attendance</p>
          <p className="text-4xl font-bold text-[#7b1f4c] my-1">{overall}%</p>
          <div className="max-w-md mx-auto h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#7b1f4c] rounded-full transition-all" style={{ width: `${overall}%` }} />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
        ) : (
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
                  <th className="text-center px-4 py-3 text-gray-400 font-medium">Total Classes</th>
                  <th className="text-center px-4 py-3 text-gray-400 font-medium">Attended Classes</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {(data?.by_subject ?? []).map((s: any) => (
                  <tr key={s.code} className="border-t">
                    <td className="px-4 py-3">{s.name || s.code}</td>
                    <td className="px-4 py-3 text-center">{s.total}</td>
                    <td className="px-4 py-3 text-center">{s.present}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${s.pct < 75 ? "text-rose-600" : "text-green-600"}`}
                    >
                      {s.pct}%
                    </td>
                  </tr>
                ))}
                {(data?.by_subject ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      No attendance recorded yet.
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

// ─── MY MARKS ─────────────────────────────────────────────────────────────────
function MarksView({ onBack }: { onBack: () => void }) {
  const fn = useServerFn(studentMarks);
  const gradingFn = useServerFn(studentGrading);
  const { data = [], isLoading } = useQuery({ queryKey: ["student-marks"], queryFn: () => fn({ data: {} }) });
  const { data: scheme = [] } = useQuery({ queryKey: ["student-grading"], queryFn: () => gradingFn() });
  const [activeExam, setActiveExam] = useState(EXAM_TABS[0].key);

  const rows = (data as any[]).filter((r) => r.exam_type === activeExam);

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">My Marks</h1>
        <p className="text-xs text-gray-400 mb-4">
          Your performance in various internal assessments throughout the semester.
        </p>

        <div className="flex border rounded overflow-hidden mb-5 text-sm">
          {EXAM_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveExam(t.key)}
              className={`flex-1 py-2.5 font-medium ${activeExam === t.key ? "bg-white text-gray-800" : "bg-gray-50 text-gray-400"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
        ) : (
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
                  <th className="text-center px-4 py-3 text-gray-400 font-medium">Max Marks</th>
                  <th className="text-center px-4 py-3 text-gray-400 font-medium">Marks Obtained</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any, i: number) => {
                  const pct = Number(r.max_marks) ? (Number(r.obtained) / Number(r.max_marks)) * 100 : 0;
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3">{r.subjects?.name || r.subjects?.code}</td>
                      <td className="px-4 py-3 text-center">{r.max_marks}</td>
                      <td className="px-4 py-3 text-center font-semibold text-[#7b1f4c]">{r.obtained}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-block px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium">
                          {gradeFor(pct, scheme as any[])}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      No marks for this assessment yet.
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

// ─── MY RESULTS (Semester-wise SGPA/CGPA) ─────────────────────────────────────
function ResultsView({ me, onBack }: { me: any; onBack: () => void }) {
  const fn = useServerFn(studentMarks);
  const gradingFn = useServerFn(studentGrading);
  const { data = [] } = useQuery({ queryKey: ["student-marks-all"], queryFn: () => fn({ data: {} }) });
  const { data: scheme = [] } = useQuery({ queryKey: ["student-grading"], queryFn: () => gradingFn() });

  // Build a semester summary from final_sessional marks where available.
  const semesters = useMemo(() => {
    const finals = (data as any[]).filter((r) => r.exam_type === "final_sessional");
    const byYear = new Map<string, any[]>();
    finals.forEach((r) => {
      const k = r.academic_year || "—";
      if (!byYear.has(k)) byYear.set(k, []);
      byYear.get(k)!.push(r);
    });
    let cumCredit = 0,
      cumPoints = 0;
    return Array.from(byYear.entries()).map(([year, rows], idx) => {
      let credits = 0,
        points = 0;
      rows.forEach((r) => {
        const cr = Number(r.subjects?.credits ?? 4);
        const pct = Number(r.max_marks) ? (Number(r.obtained) / Number(r.max_marks)) * 100 : 0;
        const gp = Number(
          (scheme as any[]).find((s) => pct >= Number(s.min_pct) && pct <= Number(s.max_pct))?.grade_point ?? 0,
        );
        credits += cr;
        points += cr * gp;
      });
      cumCredit += credits;
      cumPoints += points;
      return {
        semester: idx + 1,
        year,
        gradePoints: Math.round(points),
        courseCredits: credits,
        earnedCredits: credits,
        sgpaPoints: Math.round(points * 10) / 10,
        cgpaPoints: Math.round(cumPoints * 10) / 10,
        sgpa: credits ? (Math.round((points / credits) * 100) / 100).toFixed(2) : "—",
        cgpa: cumCredit ? (Math.round((cumPoints / cumCredit) * 100) / 100).toFixed(2) : "—",
      };
    });
  }, [data, scheme]);

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <div className="bg-[#7b1f4c] text-white rounded-lg px-5 py-4 flex items-center gap-2">
        <GraduationCap className="w-5 h-5" />
        <h1 className="text-lg font-bold">Student's Result</h1>
      </div>

      <Card>
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Enrollment No.*</label>
            <input readOnly value={me.enrollment_no} className="border rounded w-full px-3 py-2 bg-gray-50 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Student Name*</label>
            <input
              readOnly
              value={me.name?.toUpperCase()}
              className="border rounded w-full px-3 py-2 bg-gray-50 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Current Semester*</label>
            <input readOnly value={me.semester} className="border rounded w-full px-3 py-2 bg-gray-50 text-sm" />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-gray-800">Result Summary</p>
            <p className="text-xs text-gray-400">Semester-wise performance overview.</p>
          </div>
          <button onClick={() => window.print()} className="text-gray-500 hover:text-gray-700">
            <Printer className="w-5 h-5" />
          </button>
        </div>

        <div className="border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Semester</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Grade Point</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Course Credits</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Earned Credits</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Point Secured SGPA</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Point Secured CGPA</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">SGPA</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">CGPA</th>
              </tr>
            </thead>
            <tbody>
              {semesters.map((s) => (
                <tr key={s.semester} className="border-t">
                  <td className="px-4 py-3 text-[#7b1f4c] font-medium">{s.semester}</td>
                  <td className="px-4 py-3">{s.gradePoints}</td>
                  <td className="px-4 py-3">{s.courseCredits}</td>
                  <td className="px-4 py-3">{s.earnedCredits}</td>
                  <td className="px-4 py-3">{s.sgpaPoints}</td>
                  <td className="px-4 py-3">{s.cgpaPoints}</td>
                  <td className="px-4 py-3 font-semibold">{s.sgpa}</td>
                  <td className="px-4 py-3 font-semibold">{s.cgpa}</td>
                </tr>
              ))}
              {semesters.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No semester results published yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Note: Results are compiled from final sessional marks approved by the HOD.
        </p>
      </Card>
    </div>
  );
}

// ─── SEMESTER REPORTS ─────────────────────────────────────────────────────────
function SemesterReportsView({ me, onBack }: { me: any; onBack: () => void }) {
  const fn = useServerFn(studentMarks);
  const { data = [] } = useQuery({ queryKey: ["student-marks-all"], queryFn: () => fn({ data: {} }) });

  const groups = useMemo(() => {
    const g = new Map<string, any[]>();
    (data as any[]).forEach((r) => {
      const k = `${r.academic_year || "—"} · ${r.exam_type}`;
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(r);
    });
    return Array.from(g.entries());
  }, [data]);

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Semester Reports</h1>
        <p className="text-xs text-gray-400 mb-4">Download your consolidated progress reports.</p>

        {groups.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No reports available yet.</p>
        ) : (
          <div className="space-y-3">
            {groups.map(([label, rows]) => {
              const total = rows.reduce((s, r) => s + Number(r.max_marks || 0), 0);
              const got = rows.reduce((s, r) => s + Number(r.obtained || 0), 0);
              const pct = total ? Math.round((got / total) * 1000) / 10 : 0;
              return (
                <div key={label} className="border rounded p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold capitalize">{label.replace(/_/g, " ")}</p>
                    <p className="text-xs text-gray-400">
                      {rows.length} subjects · {got}/{total} ({pct}%)
                    </p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 border rounded px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── MY ASSIGNMENTS ───────────────────────────────────────────────────────────
// ─── PARENT ACCESS ────────────────────────────────────────────────────────────
function ParentAccessView({ onBack }: { onBack: () => void }) {
  const statusFn = useServerFn(studentParentStatus);
  const setFn = useServerFn(studentSetParentPassword);
  const qc = useQueryClient();
  const { data: status } = useQuery({ queryKey: ["parent-status"], queryFn: () => statusFn() });
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: () => setFn({ data: { newPassword: pw } }),
    onSuccess: () => {
      setPw("");
      setPw2("");
      qc.invalidateQueries({ queryKey: ["parent-status"] });
    },
    onError: (e: any) => setErr(e.message),
  });
  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">👨‍👩‍👧 Parent Access</h1>
        <p className="text-xs text-gray-500 mb-5">
          Set (or reset) the password your parent will use to sign into the Parent Portal. Your parent will log in
          using your Enrollment No. and the password you set below.
        </p>

        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-5">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            Parent Portal Login Details
          </p>
          <p className="text-sm text-gray-700">
            Enrollment No. (IR): <b className="font-mono">{status?.enrollment_no ?? "—"}</b>
          </p>
          <p className="text-sm text-gray-700">
            Status:{" "}
            <span className={status?.enabled ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>
              {status?.enabled ? "✓ Enabled" : "Not set — parent cannot log in yet"}
            </span>
          </p>
          {status?.last_login && (
            <p className="text-xs text-gray-500 mt-1">Last parent login: {new Date(status.last_login).toLocaleString()}</p>
          )}
        </div>

        <div className="max-w-sm space-y-3">
          <div>
            <label className="text-xs text-gray-600 font-medium mb-1 block">New Password (min 6 chars)</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="border rounded w-full px-3 py-2 text-sm"
              minLength={6}
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium mb-1 block">Confirm Password</label>
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="border rounded w-full px-3 py-2 text-sm"
            />
          </div>
          {err && <p className="text-xs text-rose-700">{err}</p>}
          <button
            onClick={() => {
              setErr(null);
              if (pw.length < 6) return setErr("Password must be at least 6 characters.");
              if (pw !== pw2) return setErr("Passwords do not match.");
              save.mutate();
            }}
            disabled={save.isPending}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded text-sm disabled:opacity-60"
          >
            {save.isPending ? "Saving…" : status?.enabled ? "Reset Parent Password" : "Enable Parent Access"}
          </button>
          {save.isSuccess && (
            <p className="text-xs text-emerald-700">Saved. Share the password with your parent.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── UPLOAD ASSIGNMENT ────────────────────────────────────────────────────────
function UploadAssignmentView({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const fn = useServerFn(studentListAssignments);
  const mySubsFn = useServerFn(studentMySubmissions);
  const submitFn = useServerFn(studentSubmitAssignment);
  const { data = [] } = useQuery({ queryKey: ["student-assignments"], queryFn: () => fn() });
  const { data: mySubs = [] } = useQuery({ queryKey: ["student-my-subs"], queryFn: () => mySubsFn() });
  const submittedIds = new Set((mySubs as any[]).map((s: any) => s.assignment_id));
  const today = new Date().toISOString().slice(0, 10);
  const pending = (data as any[]).filter(
    (a: any) => (!a.due_date || a.due_date >= today) && !submittedIds.has(a.id),
  );
  const [selected, setSelected] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [comments, setComments] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      submitFn({ data: { assignment_id: Number(selected), file_url: fileUrl, comments: comments || null } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-my-subs"] });
      setSelected("");
      setFileUrl("");
      setComments("");
    },
  });

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Upload Assignment</h1>
        <p className="text-xs text-gray-400 mb-4">Submit your completed assignment files directly to your faculty.</p>

        <div className="max-w-lg mx-auto space-y-4">
          <div className="border rounded-lg divide-y bg-gray-50/50">
            <p className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              📌 Pending Assignments ({pending.length})
            </p>
            {pending.length === 0 ? (
              <p className="px-3 py-4 text-sm text-emerald-700 text-center">
                No pending assignments. You’re all caught up! ✅
              </p>
            ) : (
              pending.map((a: any) => (
                <div key={a.id} className="px-3 py-2 text-xs flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{a.title}</p>
                    <p className="text-gray-500 truncate">
                      {a.subject_name || "—"}
                      {a.due_date ? ` · Due ${a.due_date}` : ""}
                    </p>
                  </div>
                  {a.file_url && (
                    <a href={a.file_url} target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold hover:underline shrink-0">
                      Download PDF
                    </a>
                  )}
                </div>
              ))
            )}
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-1 block">Select Assignment</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="border rounded w-full px-3 py-2 text-sm"
            >
              <option value="">Select a pending assignment</option>
              {pending.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.subject_name ? `${a.subject_name} — ` : ""}
                  {a.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Only assignments with future due dates are shown here.</p>
          </div>
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Assignment File URL (PDF)</label>
            <input
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://…/my-submission.pdf"
              className="border rounded w-full px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Upload your PDF to Drive/storage and paste the shareable link here.
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Comments (Optional)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              placeholder="Add any comments for your teacher…"
              className="border rounded w-full px-3 py-2 text-sm resize-y"
            />
          </div>
          <button
            onClick={() => submit.mutate()}
            disabled={!selected || !fileUrl || submit.isPending}
            className="bg-[#7b1f4c] text-white w-full py-2.5 rounded font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" /> {submit.isPending ? "Submitting…" : "Submit Assignment"}
          </button>
          {submit.isSuccess && <p className="text-sm text-green-700 text-center">Submitted successfully!</p>}
          {submit.error && <p className="text-sm text-rose-700 text-center">{(submit.error as Error).message}</p>}
        </div>
      </Card>
    </div>
  );
}

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
function DocumentsView({ onBack }: { onBack: () => void }) {
  const fn = useServerFn(studentDocuments);
  const ttFn = useServerFn(studentTimetable);
  const sylFn = useServerFn(studentSyllabus);
  const [tab, setTab] = useState<"assignment" | "lesson_plan" | "exam_schedule" | "timetable" | "syllabus">(
    "assignment",
  );
  const isDoc = tab === "assignment" || tab === "exam_schedule";
  const { data = [], isLoading } = useQuery({
    queryKey: ["student-docs", tab],
    queryFn: () => fn({ data: { type: tab as "assignment" | "exam_schedule" } }),
    enabled: isDoc,
  });
  const { data: tt } = useQuery({
    queryKey: ["student-tt-docs"],
    queryFn: () => ttFn(),
    enabled: tab === "timetable",
  });
  const { data: syl = [] } = useQuery({
    queryKey: ["student-syl-docs"],
    queryFn: () => sylFn(),
    enabled: tab === "syllabus",
  });

  const tabs = [
    { key: "assignment" as const, label: "Assignments" },
    { key: "lesson_plan" as const, label: "Lesson Plans" },
    { key: "exam_schedule" as const, label: "Exam Schedules" },
    { key: "timetable" as const, label: "Timetable" },
    { key: "syllabus" as const, label: "Syllabus" },
  ];

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Documents</h1>
        <p className="text-xs text-gray-400 mb-4">
          A central repository for all important documents shared by your faculty.
        </p>

        <div className="flex flex-wrap gap-1 border-b mb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.key ? "border-[#7b1f4c] text-[#7b1f4c]" : "border-transparent text-gray-400"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isDoc && (
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {(data as any[]).map((d: any) => (
                  <tr key={d.id} className="border-t">
                    <td className="px-4 py-3">{d.subject ?? "—"}</td>
                    <td className="px-4 py-3">{d.title}</td>
                    <td className="px-4 py-3">{d.uploaded_at?.slice(0, 10) ?? "—"}</td>
                    <td className="px-4 py-3">
                      <a
                        href={d.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 border rounded px-3 py-1.5 text-sm hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4" /> Download
                      </a>
                    </td>
                  </tr>
                ))}
                {!isLoading && (data as any[]).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      No documents in this category yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "lesson_plan" && <LessonPlanLibrary docType="lesson_plan" title="Lesson Plans" subtitle="PDFs uploaded by your faculty." />}



        {tab === "timetable" && (
          <div className="border rounded overflow-x-auto">
            {!tt ? (
              <p className="p-6 text-center text-sm text-gray-400">Loading…</p>
            ) : (tt.entries as any[]).length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">No timetable published yet.</p>
            ) : (
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-500">Day</th>
                    {(tt.periods as any[]).map((p) => (
                      <th key={p.period_no} className="text-left px-3 py-2 text-gray-500">
                        P{p.period_no}
                        <div className="text-[10px] text-gray-400 font-normal">
                          {p.start_time?.slice(0, 5)}–{p.end_time?.slice(0, 5)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map((d) => (
                    <tr key={d} className="border-t align-top">
                      <td className="px-3 py-2 font-medium text-gray-700">{DAYS[d]}</td>
                      {(tt.periods as any[]).map((p) => {
                        const slots = (tt.entries as any[]).filter(
                          (e) => e.day_of_week === d && e.period_no === p.period_no,
                        );
                        return (
                          <td key={p.period_no} className="px-3 py-2">
                            {slots.length === 0 ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              slots.map((s, i) => (
                                <div key={i} className="mb-1 last:mb-0">
                                  <div className="font-semibold text-gray-800">
                                    {s.subjects?.code ?? "—"}
                                  </div>
                                  <div className="text-[11px] text-gray-500">{s.subjects?.name}</div>
                                  <div className="text-[11px] text-gray-500">
                                    {s.staff_users?.username ? `@${s.staff_users.username}` : ""}
                                    {s.room ? ` · ${s.room}` : ""}
                                  </div>
                                </div>
                              ))
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "syllabus" && (
          <div className="space-y-4">
            <SyllabusCoverage
              mode="view"
              academicYear={(() => {
                const d = new Date();
                const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
                return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
              })()}
              title="Syllabus Coverage"
              subtitle="Delivered vs planned hours for each of your subjects."
            />
            <div className="border rounded overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 text-sm">Syllabus units</div>
              {(syl as any[]).length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-400">No syllabus available for your class yet.</p>
              ) : (
                <div className="divide-y">
                  {(syl as any[]).map((s: any) => (
                    <div key={s.id} className="p-4">
                      <p className="font-medium text-gray-800 text-sm mb-1">{s.code} — {s.name}</p>
                      {(s.units ?? []).length === 0 ? (
                        <p className="text-xs text-gray-400">No units added.</p>
                      ) : (
                        <ul className="text-xs text-gray-600 space-y-1">
                          {s.units.map((u: any) => (
                            <li key={u.unit_no}>
                              <span className="font-medium text-gray-700">Unit {u.unit_no}:</span> {u.title}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── FEES PAYMENT ─────────────────────────────────────────────────────────────
function FeesView({ onBack }: { onBack: () => void }) {
  const fn = useServerFn(studentMyFees);
  const { data = [], isLoading } = useQuery({ queryKey: ["student-fees"], queryFn: () => fn() });
  const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

  // Only show admin-entered fee records; no hardcoded defaults.
  const record = (data as any[])[0];
  const components: { label: string; amount: number }[] =
    record && Array.isArray(record.components) ? record.components : [];
  const total = record ? Number(record.total_amount) : 0;
  const paid = record ? Number(record.paid_amount) : 0;
  const balance = total - paid;
  const status = record?.status ?? "due";
  const isPaid = !!record && (status === "paid" || balance <= 0);


  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-xl font-bold text-gray-800">Fees Payment</h1>
          {!isLoading &&
            (isPaid ? (
              <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">PAID</span>
            ) : (
              <span className="text-xs px-3 py-1 bg-rose-100 text-rose-700 rounded-full font-semibold">UNPAID</span>
            ))}
        </div>
        <p className="text-xs text-gray-400 mb-4">View your current fee status and details of any outstanding dues.</p>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
        ) : !record ? (
          <div className="border border-amber-200 bg-amber-50 rounded p-6 text-center">
            <p className="text-amber-800 font-semibold">No fee details available yet.</p>
            <p className="text-amber-700 text-sm mt-1">
              The administration office has not posted any fee record for you. Please check back after the official notice.
            </p>
          </div>
        ) : (

          <>
            {isPaid ? (
              <div className="border border-green-200 bg-green-50 rounded p-4 mb-4">
                <p className="text-green-800 font-semibold flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Fees Paid
                </p>
                <p className="text-green-700 text-sm mt-1">Your fees are fully paid. Thank you!</p>
              </div>
            ) : (
              <div className="border border-rose-200 bg-rose-50 rounded p-4 mb-4">
                <p className="text-rose-700 font-semibold flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4" /> Fees Due
                </p>
                <p className="text-rose-600 text-sm mt-1">
                  Your fee payment is currently due. Please find the breakdown below and complete the payment.
                  {record?.due_date ? ` Due by ${record.due_date}.` : ""}
                </p>
              </div>
            )}

            <div className="border rounded overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Fee Component</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((c, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3">{c.label}</td>
                      <td className="px-4 py-3 text-right">{inr(c.amount)}</td>
                    </tr>
                  ))}
                  {paid > 0 && (
                    <tr className="border-t text-green-700">
                      <td className="px-4 py-3">Paid</td>
                      <td className="px-4 py-3 text-right">− {inr(paid)}</td>
                    </tr>
                  )}
                  <tr className="border-t bg-gray-50 font-semibold">
                    <td className="px-4 py-3">{paid > 0 ? "Balance Due" : "Total Amount Due"}</td>
                    <td className="px-4 py-3 text-right">{inr(balance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {!isPaid && (
              <div className="flex justify-end">
                <a
                  href="https://paydirect.eduqfix.com/app/VVCO30lzy1+8f9Cwn903U0k6styIKc5RHS16JRoA/10880/32805"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#7b1f4c] text-white px-6 py-2.5 rounded font-semibold inline-flex items-center gap-2"
                >
                  Pay Now ({inr(balance)})
                </a>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ─── MY FACULTY ───────────────────────────────────────────────────────────────
function FacultyView({ onBack }: { onBack: () => void }) {
  const fn = useServerFn(studentFaculty);
  const { data = [], isLoading } = useQuery({ queryKey: ["student-faculty"], queryFn: () => fn() });

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">My Faculty</h1>
        <p className="text-xs text-gray-400 mb-5">A quick way to contact the faculty members who teach you.</p>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
        ) : (data as any[]).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No faculty assigned to your class yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(data as any[]).map((f: any) => (
              <div key={f.id} className="border rounded-lg p-5 flex flex-col items-center text-center gap-3">
                <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-[#7b1f4c]/30 flex items-center justify-center text-xl font-bold text-gray-500">
                  {(f.username || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{f.username}</p>
                  <p className="text-xs text-gray-500">{f.department ?? (f.subjects || []).join(", ")}</p>
                </div>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Hello ${f.username}, I have a query regarding ${(f.subjects || []).join(", ")}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white w-full py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── DISCIPLINARY ACTIONS ─────────────────────────────────────────────────────
function DisciplinaryView({ onBack }: { onBack: () => void }) {
  const fn = useServerFn(studentMyDisciplinary);
  const { data = [], isLoading } = useQuery({ queryKey: ["student-disciplinary"], queryFn: () => fn() });
  const records = data as any[];

  const sevTone: Record<string, string> = {
    notice: "bg-amber-100 text-amber-800",
    warning: "bg-orange-100 text-orange-800",
    suspension: "bg-rose-100 text-rose-800",
  };

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Disciplinary Actions</h1>
        <p className="text-xs text-gray-400 mb-4">A record of any official disciplinary actions or notices issued.</p>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
        ) : records.length === 0 ? (
          <div className="border border-green-200 bg-green-50 rounded p-4">
            <p className="text-green-800 font-semibold flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4" /> No Actions on Record
            </p>
            <p className="text-green-700 text-sm mt-1">Your disciplinary record is clear. Keep up the good work!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((r: any) => (
              <div key={r.id} className="border rounded p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{r.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded capitalize ${sevTone[r.severity] ?? sevTone.notice}`}>
                    {r.severity}
                  </span>
                </div>
                {r.detail && <p className="text-sm text-gray-500 mt-1">{r.detail}</p>}
                <div className="flex flex-wrap gap-3 mt-2 text-xs">
                  <span className="text-gray-400">Issued: {r.action_date}</span>
                  {r.resolution_date && (
                    <span className="text-rose-600 font-medium">Last date of resolution: {r.resolution_date}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
