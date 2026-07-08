import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  ClipboardCheck,
  BookOpen,
  FileSpreadsheet,
  FileText,
  FilePlus,
  Trash2,
  Download,
  ClipboardList,
  Eye,
  Printer,
  BookMarked,
  GraduationCap,
  BarChart2,
  ArrowLeft,
  CheckSquare,
} from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { PdfDocsInline } from "@/components/portal/PdfDocsInline";
import { facultyRoles, hasRole } from "@/lib/roles";
import { listAssignments, listPeriods } from "@/lib/academic.functions";
import {
  facultyDashboard,
  getAttendance,
  submitAttendance,
  getMarks,
  saveMarks,
  listLessonPlans,
  upsertLessonPlan,
  deleteLessonPlan,
  myLeaves,
  applyLeave,
  cancelLeave,
  attendanceReport,
  marksReport,
  individualSubjectRegister,
  cumulativeConsolidatedRegister,
  subjectSessionalReport,
  endSemSessionalReport,
  monthlyAttendanceRegister,
  finalAttendanceReport,
} from "@/lib/faculty.functions";
import { exportPDF, exportExcel, exportCSV } from "@/lib/report-export";
import {
  facultyListAssignmentsCreated,
  createAssignment,
  deleteAssignment as deleteAssignmentFn,
  facultyReceivedSubmissions,
  facultyGradeSubmission,
} from "@/lib/assignments.functions";

export const Route = createFileRoute("/faculty")({
  head: () => portalMeta("Faculty Portal"),
  component: FacultyPortal,
});

type View =
  | "home"
  | "attendance"
  | "marks"
  | "semester-marks"
  | "assignments"
  | "submissions"
  | "syllabus"
  | "lesson-plans"
  | "exam-schedule"
  | "reports";

const EXAM_TYPES = [
  "first_class_test",
  "second_class_test",
  "house_test",
  "internal",
  "assignment",
  "assignment_2",
  "mid_sessional",
  "final_sessional",
  "practical",
  "viva",
  "report_writing",
] as const;


// Test types used in Marks Entry (in display order). Practical fields (Performance/Report/Viva)
// stay blank for pure-theory subjects; they contribute to the Sessional S-1 total when filled.
const MARKS_ENTRY_TESTS: { key: (typeof EXAM_TYPES)[number]; label: string; defaultMax: number; section: "theory" | "practical" }[] = [
  { key: "first_class_test", label: "Class Test 1", defaultMax: 20, section: "theory" },
  { key: "second_class_test", label: "Class Test 2", defaultMax: 20, section: "theory" },
  { key: "house_test", label: "House Test", defaultMax: 40, section: "theory" },
  { key: "assignment", label: "Assignment 1", defaultMax: 10, section: "theory" },
  { key: "assignment_2", label: "Assignment 2", defaultMax: 10, section: "theory" },
  { key: "practical", label: "Performance", defaultMax: 60, section: "practical" },
  { key: "report_writing", label: "Report", defaultMax: 20, section: "practical" },
  { key: "viva", label: "Viva", defaultMax: 20, section: "practical" },
];


const DAY_LABELS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function defaultAY() {
  const d = new Date();
  const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

// ─── Shared card grid item ───────────────────────────────────────────────────
function QuickCard({
  icon: Icon,
  label,
  desc,
  color,
  border,
  onClick,
}: {
  icon: any;
  label: string;
  desc: string;
  color: string;
  border: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 p-4 bg-white rounded border-t-4 ${border} shadow-sm hover:shadow-md transition-shadow text-left w-full`}
    >
      <span className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </span>
      <span>
        <p className="font-semibold text-gray-800 text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </span>
    </button>
  );
}

// ─── Back button ─────────────────────────────────────────────────────────────
function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-[#7b1f4c] font-medium mb-4 hover:underline"
    >
      <ArrowLeft className="w-4 h-4" /> Back to Dashboard
    </button>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border rounded-lg shadow-sm p-5 ${className}`}>{children}</div>;
}

// ─── Main portal ──────────────────────────────────────────────────────────────
function FacultyPortal() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!hasRole(me, facultyRoles)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const [view, setView] = useState<View>("home");
  const [ay] = useState(defaultAY());

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  const isViewer = me.role !== "faculty";

  return (
    <PortalShell
      title={isViewer ? "Faculty View (Read-only)" : "Faculty Portal"}
      subtitle={`Academic Year ${ay}`}
      me={me as any}
      accent="teal"
    >
      <div className="container mx-auto px-4 py-6">
        {isViewer && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded px-3 py-2 mb-4">
            You are viewing the Faculty portal as <strong className="capitalize">{me.role}</strong>. Edits are disabled.
          </div>
        )}
        <fieldset disabled={isViewer} className={isViewer ? "pointer-events-none opacity-90" : ""}>
          {view === "home" && <HomeView me={me as any} ay={ay} onNav={setView} />}
          {view === "attendance" && <AttendanceView ay={ay} me={me as any} onBack={() => setView("home")} />}
          {view === "marks" && <MarksView ay={ay} me={me as any} onBack={() => setView("home")} />}
          {view === "semester-marks" && <SemesterMarksView ay={ay} me={me as any} onBack={() => setView("home")} />}
          {view === "assignments" && <AssignmentsView ay={ay} me={me as any} onBack={() => setView("home")} />}
          {view === "submissions" && <SubmissionsView onBack={() => setView("home")} />}
          {view === "syllabus" && <SyllabusView ay={ay} me={me as any} onBack={() => setView("home")} />}
          {view === "lesson-plans" && <LessonPlansView ay={ay} me={me as any} onBack={() => setView("home")} />}
          {view === "exam-schedule" && <ExamScheduleView ay={ay} me={me as any} onBack={() => setView("home")} />}
          {view === "reports" && <ReportsView ay={ay} me={me as any} onBack={() => setView("home")} />}
        </fieldset>
      </div>
    </PortalShell>
  );
}

// ─── HOME: card grid ──────────────────────────────────────────────────────────
function HomeView({ me, ay, onNav }: { me: any; ay: string; onNav: (v: View) => void }) {
  const dash = useQuery({
    queryKey: ["fac-dash", ay],
    queryFn: () => facultyDashboard({ data: { academic_year: ay } }),
  });
  const d = dash.data;

  const cards: { icon: any; label: string; desc: string; color: string; border: string; view: View }[] = [
    {
      icon: ClipboardCheck,
      label: "Record Attendance",
      desc: "Mark daily attendance",
      color: "bg-[#7b1f4c]",
      border: "border-[#7b1f4c]",
      view: "attendance",
    },
    {
      icon: FileSpreadsheet,
      label: "Enter Marks",
      desc: "Input internal assessment scores",
      color: "bg-orange-500",
      border: "border-orange-500",
      view: "marks",
    },
    {
      icon: GraduationCap,
      label: "Enter Semester Exam Marks",
      desc: "Input Final Semester Marks",
      color: "bg-gray-500",
      border: "border-gray-500",
      view: "semester-marks",
    },
    {
      icon: FilePlus,
      label: "Assignments",
      desc: "Create and manage assignments",
      color: "bg-green-600",
      border: "border-green-600",
      view: "assignments",
    },
    {
      icon: Eye,
      label: "View Submissions",
      desc: "Grade student submissions",
      color: "bg-purple-600",
      border: "border-purple-600",
      view: "submissions",
    },
    {
      icon: BookMarked,
      label: "Syllabus Coverage",
      desc: "Track teaching progress",
      color: "bg-gray-400",
      border: "border-gray-400",
      view: "syllabus",
    },
    {
      icon: BookOpen,
      label: "Lesson Plans",
      desc: "Upload and manage lesson plans",
      color: "bg-rose-600",
      border: "border-rose-600",
      view: "lesson-plans",
    },
    {
      icon: Calendar,
      label: "Exam Schedule",
      desc: "Distribute exam datesheets",
      color: "bg-cyan-500",
      border: "border-cyan-500",
      view: "exam-schedule",
    },
    {
      icon: Printer,
      label: "Generate Reports",
      desc: "Create official printable reports",
      color: "bg-[#4a0e2e]",
      border: "border-[#4a0e2e]",
      view: "reports",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Welcome, {me.name || "Faculty"}</h1>

      {/* Quick action card grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <QuickCard
            key={c.view}
            icon={c.icon}
            label={c.label}
            desc={c.desc}
            color={c.color}
            border={c.border}
            onClick={() => onNav(c.view)}
          />
        ))}
      </div>

      {/* Today's schedule + My subjects */}
      {d && (
        <div className="grid md:grid-cols-2 gap-4 mt-2">
          <Card>
            <p className="font-semibold text-gray-700 mb-3">Today's Schedule ({DAY_LABELS[d.day_of_week]})</p>
            {d.today_classes.length === 0 ? (
              <p className="text-sm text-gray-400">No classes scheduled today.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {d.today_classes.map((c: any) => (
                  <li key={c.id} className="flex items-center justify-between border-b pb-2">
                    <span>
                      P{c.period_no} · <strong>{c.subjects?.code}</strong> · {c.branch}-Sem{c.semester}
                      {c.room ? ` · ${c.room}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <p className="font-semibold text-gray-700 mb-3">My Subjects ({ay})</p>
            {d.assignments.length === 0 ? (
              <p className="text-sm text-gray-400">No subjects assigned. Contact admin.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {d.assignments.map((a: any) => (
                  <li key={a.id} className="border-b pb-1">
                    · {a.subjects?.code} {a.subjects?.name}{" "}
                    <span className="text-gray-400">
                      ({a.branch}-Sem{a.semester})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────
function AttendanceView({ ay, me, onBack }: { ay: string; me: any; onBack: () => void }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const asg = useQuery({
    queryKey: ["fac-asg", me.id, ay],
    queryFn: () => listAssignments({ data: { staff_id: me.id, academic_year: ay } }),
  });
  const periods = useQuery({ queryKey: ["periods"], queryFn: () => listPeriods() });
  const [asgId, setAsgId] = useState<number | "">("");
  const [date, setDate] = useState(today);
  const [pno, setPno] = useState<number | "">("");
  const [loaded, setLoaded] = useState(false);
  const a = (asg.data ?? []).find((x: any) => x.id === asgId);

  const rosterQ = useQuery({
    enabled: !!a && !!pno && loaded,
    queryKey: ["att", a?.branch, a?.semester, a?.subject_id, date, pno],
    queryFn: () =>
      getAttendance({
        data: { branch: a!.branch, semester: a!.semester, subject_id: a!.subject_id, date, period_no: Number(pno) },
      }),
  });
  const [marks, setMarks] = useState<Record<number, string>>({});
  useEffect(() => {
    if (rosterQ.data) {
      const m: Record<number, string> = {};
      rosterQ.data.forEach((s: any) => (m[s.id] = s.status || "present"));
      setMarks(m);
    }
  }, [rosterQ.data]);

  const save = useMutation({
    mutationFn: () =>
      submitAttendance({
        data: {
          subject_id: a!.subject_id,
          date,
          period_no: Number(pno),
          entries: Object.entries(marks).map(([id, st]) => ({ student_id: Number(id), status: st as any })),
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["att"] }),
  });

  const selectedSubject = a ? `${a.subjects?.name || a.subjects?.code} (${a.branch}-Sem${a.semester})` : "";

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">Record Attendance</h1>

      <Card>
        <p className="font-semibold text-gray-800 mb-4">Select Class, Subject, and Date</p>
        <div className="grid sm:grid-cols-4 gap-3 text-sm items-end">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Class &amp; Subject</label>
            <select
              value={asgId}
              onChange={(e) => {
                setAsgId(e.target.value ? Number(e.target.value) : "");
                setLoaded(false);
              }}
              className="border rounded w-full px-3 py-2"
            >
              <option value="">Select…</option>
              {(asg.data ?? []).map((x: any) => (
                <option key={x.id} value={x.id}>
                  {x.subjects?.code} · {x.branch}-Sem{x.semester}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Period</label>
            <select
              value={pno}
              onChange={(e) => {
                setPno(e.target.value ? Number(e.target.value) : "");
                setLoaded(false);
              }}
              className="border rounded w-full px-3 py-2"
            >
              <option value="">Period…</option>
              {(periods.data ?? [])
                .filter((p: any) => !p.is_break)
                .map((p: any) => (
                  <option key={p.id} value={p.period_no}>
                    P{p.period_no} {p.start_time}-{p.end_time}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => {
                setDate(e.target.value);
                setLoaded(false);
              }}
              className="border rounded w-full px-3 py-2"
            />
          </div>

          <button
            onClick={() => setLoaded(true)}
            disabled={!asgId || !pno}
            className="bg-[#7b1f4c] text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
          >
            Load Students
          </button>
        </div>
      </Card>

      {rosterQ.isLoading && <p className="text-sm text-gray-500">Loading roster…</p>}

      {rosterQ.data && rosterQ.data.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-800">Mark Attendance for {selectedSubject}</p>
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => {
                  const m: any = {};
                  rosterQ.data.forEach((s: any) => (m[s.id] = "present"));
                  setMarks(m);
                }}
                className="px-3 py-1 bg-green-100 text-green-800 rounded"
              >
                All Present
              </button>
              <button
                onClick={() => {
                  const m: any = {};
                  rosterQ.data.forEach((s: any) => (m[s.id] = "absent"));
                  setMarks(m);
                }}
                className="px-3 py-1 bg-rose-100 text-rose-800 rounded"
              >
                All Absent
              </button>
            </div>
          </div>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Roll Number</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Student Name</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rosterQ.data.map((s: any) => {
                  const st = marks[s.id] ?? "present";
                  const rowCls = st === "absent" ? "bg-rose-50 text-rose-700 font-semibold" : "";
                  return (
                  <tr key={s.id} className={`border-t ${rowCls}`}>
                    <td className="px-4 py-3 font-mono text-xs">{s.enrollment_no}</td>
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-4">
                        {["present", "absent", "leave"].map((opt) => (
                          <label key={opt} className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name={`att-${s.id}`}
                              value={opt}
                              checked={st === opt}
                              onChange={() => setMarks({ ...marks, [s.id]: opt })}
                              disabled={s.locked}
                              className="accent-[#7b1f4c]"
                            />
                            <span className="capitalize">{opt}</span>
                          </label>
                        ))}
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="bg-[#7b1f4c] text-white px-6 py-2 rounded font-semibold"
            >
              {save.isPending ? "Saving…" : "Save Attendance"}
            </button>
          </div>
          {save.isSuccess && <p className="text-xs text-green-700 mt-2">Saved {save.data?.count} entries.</p>}
          {save.error && <p className="text-xs text-rose-700 mt-2">{(save.error as Error).message}</p>}
        </Card>
      )}
      {rosterQ.data && rosterQ.data.length === 0 && (
        <p className="text-sm text-gray-400">No students found in this class.</p>
      )}
    </div>
  );
}

// ─── MARKS (Internal) ────────────────────────────────────────────────────────
function MarksView({ ay, me, onBack }: { ay: string; me: any; onBack: () => void }) {
  const qc = useQueryClient();
  const asg = useQuery({
    queryKey: ["fac-asg", me.id, ay],
    queryFn: () => listAssignments({ data: { staff_id: me.id, academic_year: ay } }),
  });
  const [asgId, setAsgId] = useState<number | "">("");
  const [loaded, setLoaded] = useState(false);
  const a = (asg.data ?? []).find((x: any) => x.id === asgId);

  // Fetch marks per test type
  const queries = MARKS_ENTRY_TESTS.map((t) =>
    useQuery({
      enabled: !!a && loaded,
      queryKey: ["marks-multi", a?.subject_id, t.key, ay],
      queryFn: () =>
        getMarks({
          data: {
            branch: a!.branch,
            semester: a!.semester,
            subject_id: a!.subject_id,
            exam_type: t.key as any,
            academic_year: ay,
          },
        }),
    }),
  );

  const students: any[] = (queries[0]?.data as any)?.rows ?? [];
  const anySubmitted = queries.some((q) => (q.data as any)?.submitted);

  const [maxMarks, setMaxMarks] = useState<Record<string, number>>({});
  const [entries, setEntries] = useState<Record<string, Record<number, string>>>({});

  useEffect(() => {
    const newEntries: Record<string, Record<number, string>> = {};
    const newMax: Record<string, number> = {};
    MARKS_ENTRY_TESTS.forEach((t, i) => {
      const d: any = queries[i]?.data;
      if (!d) return;
      const m: Record<number, string> = {};
      d.rows.forEach((r: any) => {
        m[r.id] = r.obtained != null ? String(r.obtained) : "";
      });
      newEntries[t.key] = m;
      const firstMax = d.rows.find((r: any) => r.max_marks)?.max_marks;
      newMax[t.key] = Number(firstMax || t.defaultMax);
    });
    setEntries((prev) => ({ ...newEntries, ...prev }));
    setMaxMarks((prev) => ({ ...newMax, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries.map((q) => q.dataUpdatedAt).join("|")]);

  const save = useMutation({
    mutationFn: async (submit: boolean) => {
      const jobs = MARKS_ENTRY_TESTS.map((t) => {
        const m = entries[t.key] || {};
        const cellEntries = students
          .map((s) => ({
            student_id: s.id,
            obtained: m[s.id] === undefined || m[s.id] === "" ? null : Number(m[s.id]),
            remarks: null as string | null,
          }))
          .filter((e) => e.obtained !== null);
        if (cellEntries.length === 0) return null;
        return saveMarks({
          data: {
            subject_id: a!.subject_id,
            exam_type: t.key as any,
            academic_year: ay,
            max_marks: maxMarks[t.key] || t.defaultMax,
            submit_to_hod: submit,
            entries: cellEntries,
          } as any,
        });
      });
      return Promise.all(jobs.filter(Boolean));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marks-multi"] }),
  });

  const subjectLabel = a ? `${a.subjects?.code ?? ""} — ${a.subjects?.name ?? ""}` : "";

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">📝 Enter Student Marks</h1>

      <Card>
        <p className="font-semibold text-gray-800 mb-4">Select Subject</p>
        <div className="grid sm:grid-cols-3 gap-3 text-sm items-end">
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Subject (Class · Sem · Subject)</label>
            <select
              value={asgId}
              onChange={(e) => {
                setAsgId(e.target.value ? Number(e.target.value) : "");
                setLoaded(false);
              }}
              className="border rounded w-full px-3 py-2"
            >
              <option value="">Select subject…</option>
              {(asg.data ?? []).map((x: any) => (
                <option key={x.id} value={x.id}>
                  {x.branch}-Sem{x.semester} · {x.subjects?.code} — {x.subjects?.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setLoaded(true)}
            disabled={!asgId}
            className="bg-[#7b1f4c] text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
          >
            Load Students
          </button>
        </div>
      </Card>

      {loaded && a && (
        <Card>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <p className="font-semibold text-gray-800">
              Subject: <span className="text-[#7b1f4c]">{subjectLabel}</span>
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {MARKS_ENTRY_TESTS.map((t) => (
                <label key={t.key} className="inline-flex items-center gap-1 border rounded px-2 py-1 bg-gray-50">
                  <span className="text-gray-600">{t.label} max:</span>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={maxMarks[t.key] ?? t.defaultMax}
                    onChange={(e) => setMaxMarks({ ...maxMarks, [t.key]: Number(e.target.value) })}
                    disabled={anySubmitted}
                    className="w-14 border rounded px-1 py-0.5 text-xs"
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Roll No.</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Name</th>
                  {MARKS_ENTRY_TESTS.map((t) => (
                    <th key={t.key} className="text-left px-3 py-2 text-gray-500 font-medium">
                      {t.label}
                      <span className="block text-[9px] text-gray-400 font-normal">
                        {t.section === "practical" ? "Practical" : "Theory"} · /{maxMarks[t.key] ?? t.defaultMax}
                      </span>
                    </th>
                  ))}
                  <th className="text-left px-3 py-2 text-gray-700 font-semibold">Sessional Total</th>
                </tr>
              </thead>
              <tbody>
                {students.map((r: any) => {
                  const val = (k: string) => {
                    const v = entries[k]?.[r.id];
                    const n = v === undefined || v === "" ? null : Number(v);
                    return Number.isFinite(n as number) ? (n as number) : null;
                  };
                  // Compute weighted sessional per HP TSB rules
                  const avgOf = (a: number | null, b: number | null) => {
                    const arr = [a, b].filter((x): x is number => x != null);
                    return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
                  };
                  const scale = (n: number | null, cap: number, key: string) => {
                    if (n == null) return null;
                    const denom = maxMarks[key] || cap;
                    return Math.round(((n / denom) * cap) * 10) / 10;
                  };
                  const testScore = avgOf(scale(val("first_class_test"), 20, "first_class_test"), scale(val("second_class_test"), 20, "second_class_test"));
                  const asgScore = avgOf(scale(val("assignment"), 20, "assignment"), scale(val("assignment_2"), 20, "assignment_2"));
                  const htScore = scale(val("house_test"), 40, "house_test");
                  const theory = [testScore, asgScore, htScore].filter((x): x is number => x != null).reduce((s, v) => s + v, 0);
                  const perf = scale(val("practical"), 60, "practical");
                  const rep = scale(val("report_writing"), 20, "report_writing");
                  const viv = scale(val("viva"), 20, "viva");
                  const practical = [perf, rep, viv].filter((x): x is number => x != null).reduce((s, v) => s + v, 0);
                  const total = Math.round((theory + practical) * 10) / 10;
                  const hasAny = [testScore, asgScore, htScore, perf, rep, viv].some((x) => x != null);
                  return (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">{r.enrollment_no}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      {MARKS_ENTRY_TESTS.map((t) => (
                        <td key={t.key} className="px-3 py-1">
                          <input
                            type="number"
                            step={0.5}
                            min={0}
                            max={maxMarks[t.key] ?? t.defaultMax}
                            disabled={anySubmitted || r.locked}
                            value={entries[t.key]?.[r.id] ?? ""}
                            onChange={(e) =>
                              setEntries({
                                ...entries,
                                [t.key]: { ...(entries[t.key] || {}), [r.id]: e.target.value },
                              })
                            }
                            className="border rounded px-2 py-1 w-16 text-sm"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 font-semibold text-[#7b1f4c]">
                        {hasAny ? total : "—"}
                        {hasAny && (
                          <span className="block text-[9px] text-gray-400 font-normal">
                            T:{Math.round(theory * 10) / 10} + P:{Math.round(practical * 10) / 10}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={3 + MARKS_ENTRY_TESTS.length} className="px-4 py-8 text-center text-gray-400 text-sm">
                      No students found for this class.
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
          {!anySubmitted && (
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => save.mutate(false)}
                disabled={save.isPending}
                className="border px-4 py-2 rounded text-sm text-gray-700 disabled:opacity-60"
              >
                💾 Save Draft
              </button>
              <button
                onClick={() => {
                  if (confirm("Submit all test marks to HOD? This will lock entries.")) save.mutate(true);
                }}
                disabled={save.isPending}
                className="bg-[#7b1f4c] text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-60"
              >
                ✅ Submit to HOD
              </button>
            </div>
          )}
          {anySubmitted && <p className="text-xs text-amber-700 mt-2">Some entries have been submitted to HOD and are now locked.</p>}
          {save.isSuccess && <p className="text-xs text-emerald-700 mt-2">Marks saved.</p>}
          {save.error && <p className="text-xs text-rose-700 mt-2">{(save.error as Error).message}</p>}
        </Card>
      )}
    </div>
  );
}


// ─── SEMESTER MARKS (HP Board) ────────────────────────────────────────────────
function SemesterMarksView({ ay, me, onBack }: { ay: string; me: any; onBack: () => void }) {
  const asg = useQuery({
    queryKey: ["fac-asg", me.id, ay],
    queryFn: () => listAssignments({ data: { staff_id: me.id, academic_year: ay } }),
  });
  const [asgId, setAsgId] = useState<number | "">("");
  const [loaded, setLoaded] = useState(false);
  const a = (asg.data ?? []).find((x: any) => x.id === asgId);
  const [rows, setRows] = useState<any[]>([]);

  const data = useQuery({
    enabled: !!a && loaded,
    queryKey: ["sem-marks", a?.subject_id, ay],
    queryFn: () =>
      getMarks({
        data: {
          branch: a!.branch,
          semester: a!.semester,
          subject_id: a!.subject_id,
          exam_type: "final_sessional",
          academic_year: ay,
        },
      }),
  });
  useEffect(() => {
    if (data.data) setRows(data.data.rows);
  }, [data.data]);

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Enter HP Board Semester Marks</h1>
        <button onClick={onBack} className="bg-[#7b1f4c] text-white px-4 py-2 rounded text-sm font-semibold">
          Dashboard
        </button>
      </div>

      <Card>
        <p className="font-semibold text-gray-800 mb-4">Select Class &amp; Subject</p>
        <div className="grid sm:grid-cols-3 gap-3 text-sm items-end">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Class</label>
            <select
              value={asgId}
              onChange={(e) => {
                setAsgId(e.target.value ? Number(e.target.value) : "");
                setLoaded(false);
              }}
              className="border rounded w-full px-3 py-2"
            >
              <option value="">Select class…</option>
              {(asg.data ?? []).map((x: any) => (
                <option key={x.id} value={x.id}>
                  {x.branch}-Sem{x.semester}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Subject</label>
            <select className="border rounded w-full px-3 py-2">
              <option>{a ? a.subjects?.name || a.subjects?.code : "Select subject"}</option>
            </select>
          </div>
          <button
            onClick={() => setLoaded(true)}
            disabled={!asgId}
            className="bg-[#7b1f4c] text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
          >
            Load Students
          </button>
        </div>
      </Card>

      {rows.length > 0 && (
        <Card>
          <p className="font-semibold text-gray-800 mb-4">Enter Marks</p>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Roll</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Theory</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Practical</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">{r.enrollment_no}</td>
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-2">
                      <input type="number" className="border rounded px-2 py-1 w-full text-sm" placeholder="" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" className="border rounded px-2 py-1 w-full text-sm" placeholder="" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <button className="bg-[#7b1f4c] text-white px-6 py-2 rounded font-semibold">Save</button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── ASSIGNMENTS ──────────────────────────────────────────────────────────────
function AssignmentsView({ ay, me, onBack }: { ay: string; me: any; onBack: () => void }) {
  const qc = useQueryClient();
  const asg = useQuery({
    queryKey: ["fac-asg", me.id, ay],
    queryFn: () => listAssignments({ data: { staff_id: me.id, academic_year: ay } }),
  });
  const created = useQuery({
    queryKey: ["fac-assignments-created", ay],
    queryFn: () => facultyListAssignmentsCreated({ data: { academic_year: ay } }),
  });
  const [form, setForm] = useState({ title: "", asgId: "" as number | "", dueDate: "", description: "", fileUrl: "" });

  const save = useMutation({
    mutationFn: () => {
      const a = (asg.data ?? []).find((x: any) => x.id === form.asgId);
      return createAssignment({
        data: {
          title: form.title,
          description: form.description || null,
          branch: a?.branch ?? "",
          semester: a?.semester ?? 1,
          subject_id: a?.subject_id ?? null,
          subject_name: a?.subjects?.name || a?.subjects?.code || null,
          due_date: form.dueDate || null,
          file_url: form.fileUrl || null,
          academic_year: ay,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fac-assignments-created"] });
      setForm({ title: "", asgId: "", dueDate: "", description: "", fileUrl: "" });
    },
  });

  const del = useMutation({
    mutationFn: (id: number) => deleteAssignmentFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fac-assignments-created"] }),
  });

  const rows = created.data ?? [];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">Manage Assignments</h1>

      <Card>
        <p className="font-semibold text-gray-800 mb-1">Create New Assignment</p>
        <p className="text-xs text-gray-400 mb-4">Fill in details and share an assignment for your students.</p>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Assignment Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Problem Set 1"
              className="border rounded w-full px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Class &amp; Subject</label>
            <select
              value={form.asgId}
              onChange={(e) => setForm({ ...form, asgId: e.target.value ? Number(e.target.value) : "" })}
              className="border rounded w-full px-3 py-2"
            >
              <option value="">Select class</option>
              {(asg.data ?? []).map((x: any) => (
                <option key={x.id} value={x.id}>
                  {x.subjects?.code} · {x.branch}-Sem{x.semester}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="border rounded w-full px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Assignment File URL (optional)</label>
            <input
              value={form.fileUrl}
              onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
              placeholder="https://…/brief.pdf"
              className="border rounded w-full px-3 py-2"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Description (Optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="border rounded w-full px-3 py-2 resize-y"
            />
          </div>
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={!form.title || !form.asgId || save.isPending}
          className="mt-4 bg-[#7b1f4c] text-white px-5 py-2 rounded font-semibold text-sm disabled:opacity-50"
        >
          {save.isPending ? "Creating…" : "Create Assignment"}
        </button>
        {save.error && <p className="text-xs text-rose-700 mt-2">{(save.error as Error).message}</p>}
      </Card>

      <Card>
        <p className="font-semibold text-gray-800 mb-4">Uploaded Assignments</p>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Class</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Due Date</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-3">{a.title}</td>
                  <td className="px-4 py-3">
                    {a.branch}-Sem{a.semester}
                  </td>
                  <td className="px-4 py-3">{a.subject_name || a.subjects?.code || "—"}</td>
                  <td className="px-4 py-3">{a.due_date ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm("Delete assignment?")) del.mutate(a.id);
                      }}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No assignments found.
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

// ─── SUBMISSIONS ──────────────────────────────────────────────────────────────
function SubmissionsView({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const subs = useQuery({ queryKey: ["fac-received-subs"], queryFn: () => facultyReceivedSubmissions({ data: {} }) });
  const [grading, setGrading] = useState<{ id: number; grade: string; feedback: string } | null>(null);

  const grade = useMutation({
    mutationFn: (d: { id: number; grade: string; feedback: string }) => facultyGradeSubmission({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fac-received-subs"] });
      setGrading(null);
    },
  });

  const rows = subs.data ?? [];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">Student Submissions</h1>
      <Card>
        <p className="font-semibold text-gray-800 mb-1">Received Assignments</p>
        <p className="text-xs text-gray-400 mb-4">View and grade assignments submitted by your students.</p>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Assignment Title</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Student Name</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Submitted On</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Download</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Grade</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s: any) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3">{s.assignments?.title ?? "—"}</td>
                  <td className="px-4 py-3">{s.assignments?.subject_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {s.students?.name ?? "—"}
                    <span className="block text-xs text-gray-400">{s.students?.enrollment_no}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={s.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#7b1f4c] hover:underline text-sm"
                    >
                      <Download className="w-4 h-4" /> File
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {s.status === "graded" ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          {s.grade}
                        </span>
                        <button
                          onClick={() => setGrading({ id: s.id, grade: s.grade ?? "", feedback: s.feedback ?? "" })}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          Edit
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setGrading({ id: s.id, grade: "", feedback: "" })}
                        className="text-xs bg-[#7b1f4c] text-white px-3 py-1 rounded"
                      >
                        Grade
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No submissions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {grading && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setGrading(null)}
        >
          <div className="bg-white rounded-lg p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">Grade Submission</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Grade</label>
                <input
                  value={grading.grade}
                  onChange={(e) => setGrading({ ...grading, grade: e.target.value })}
                  placeholder="e.g., A, 18/20, Pass"
                  className="border rounded w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Feedback (optional)</label>
                <textarea
                  value={grading.feedback}
                  onChange={(e) => setGrading({ ...grading, feedback: e.target.value })}
                  rows={3}
                  className="border rounded w-full px-3 py-2 resize-y"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setGrading(null)} className="border px-3 py-1.5 rounded">
                  Cancel
                </button>
                <button
                  onClick={() => grade.mutate(grading)}
                  disabled={!grading.grade || grade.isPending}
                  className="bg-[#7b1f4c] text-white px-4 py-1.5 rounded disabled:opacity-50"
                >
                  {grade.isPending ? "Saving…" : "Save Grade"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SYLLABUS COVERAGE ────────────────────────────────────────────────────────
function SyllabusView({ ay, me, onBack }: { ay: string; me: any; onBack: () => void }) {
  const qc = useQueryClient();
  const asg = useQuery({
    queryKey: ["fac-asg", me.id, ay],
    queryFn: () => listAssignments({ data: { staff_id: me.id, academic_year: ay } }),
  });
  const list = useQuery({
    queryKey: ["lessons", ay, me.id],
    queryFn: () => listLessonPlans({ data: { academic_year: ay, staff_id: me.id } }),
  });
  const [asgId, setAsgId] = useState<number | "">("");
  const [totalUnits, setTotalUnits] = useState("10");
  const [unitsCovered, setUnitsCovered] = useState("");
  const [remarks, setRemarks] = useState("");
  const pctNum = totalUnits && unitsCovered ? Math.round((Number(unitsCovered) / Number(totalUnits)) * 100) : 0;
  const pct = unitsCovered ? `${pctNum}%` : "";
  const a = (asg.data ?? []).find((x: any) => x.id === asgId);

  const save = useMutation({
    mutationFn: () =>
      upsertLessonPlan({
        data: {
          subject_id: a!.subject_id,
          branch: a!.branch,
          semester: a!.semester,
          topic: `Syllabus Coverage: ${unitsCovered}/${totalUnits} units (${pctNum}%)${remarks ? " — " + remarks : ""}`,
          planned_date: new Date().toISOString().slice(0, 10),
          actual_date: new Date().toISOString().slice(0, 10),
          status: "submitted",
          academic_year: ay,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons"] });
      setUnitsCovered("");
      setRemarks("");
    },
  });

  const records = (list.data ?? []).filter((r: any) => (r.topic ?? "").startsWith("Syllabus Coverage:"));

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">Syllabus Coverage</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <p className="font-semibold text-gray-800 mb-4">Add New Coverage Record</p>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Class &amp; Subject</label>
              <select
                value={asgId}
                onChange={(e) => setAsgId(e.target.value ? Number(e.target.value) : "")}
                className="border rounded w-full px-3 py-2"
              >
                <option value="">Select…</option>
                {(asg.data ?? []).map((x: any) => (
                  <option key={x.id} value={x.id}>
                    {x.subjects?.code} · {x.branch}-Sem{x.semester} — {x.subjects?.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Total Units</label>
                <input
                  type="number"
                  value={totalUnits}
                  onChange={(e) => setTotalUnits(e.target.value)}
                  className="border rounded w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Units Covered</label>
                <input
                  type="number"
                  value={unitsCovered}
                  onChange={(e) => setUnitsCovered(e.target.value)}
                  className="border rounded w-full px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Completion Percentage</label>
              <input readOnly value={pct} className="border rounded w-full px-3 py-2 bg-gray-50 text-gray-600" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Remarks (Optional)</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any notes or comments..."
                className="border rounded w-full px-3 py-2 resize-y"
              />
            </div>
            <button
              onClick={() => save.mutate()}
              disabled={!a || !unitsCovered || save.isPending}
              className="bg-[#7b1f4c] text-white w-full py-2 rounded font-semibold disabled:opacity-50"
            >
              {save.isPending ? "Saving…" : "Save"}
            </button>
            {save.isSuccess && <p className="text-xs text-green-700">Coverage saved.</p>}
            {save.error && <p className="text-xs text-rose-700">{(save.error as Error).message}</p>}
          </div>
        </Card>
        <Card>
          <p className="font-semibold text-gray-800 mb-4">My Coverage Records</p>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Class</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                      No records found.
                    </td>
                  </tr>
                )}
                {records.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">{r.subjects?.code}</td>
                    <td className="px-4 py-3">{r.branch}-Sem{r.semester}</td>
                    <td className="px-4 py-3">{r.actual_date ?? r.planned_date ?? ""}</td>
                    <td className="px-4 py-3">{(r.topic ?? "").replace("Syllabus Coverage: ", "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}


// ─── LESSON PLANS ─────────────────────────────────────────────────────────────
function LessonPlansView({ onBack }: { ay: string; me: any; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">📘 Manage Lesson Plans</h1>
      <p className="text-xs text-gray-500 -mt-2">Upload your lesson plan PDFs. Students can download these from their portal.</p>
      <PdfDocsInline docType="lesson_plan" uploadLabel="Upload New Lesson Plan (PDF)" />
    </div>
  );
}

// ─── EXAM SCHEDULE ────────────────────────────────────────────────────────────
function ExamScheduleView({ onBack }: { ay: string; me: any; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">🗓️ Manage Exam Schedules</h1>
      <p className="text-xs text-gray-500 -mt-2">Upload exam datesheets as PDFs. Students will see them in their Documents tab.</p>
      <PdfDocsInline docType="exam_schedule" uploadLabel="Upload New Exam Schedule (PDF)" />
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
type ReportKey =
  | "subject_register"
  | "consolidated_register"
  | "sessional_s1"
  | "sessional_s2"
  | "monthly_att"
  | "final_att";

function printHtml(html: string, title: string) {
  const w = window.open("", "_blank", "width=1100,height=800");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${title}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
  h1 { font-size: 18px; text-align:center; margin: 0 0 4px 0; }
  h2 { font-size: 14px; text-align:center; margin: 0 0 14px 0; color: #444; font-weight: normal; }
  table { border-collapse: collapse; width: 100%; font-size: 11px; }
  th, td { border: 1px solid #333; padding: 4px 6px; text-align: center; }
  th { background: #eee; }
  td.name, th.name, td.l, th.l { text-align: left; }
  .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; }
  @media print { .noprint { display: none; } body { padding: 8px; } }
  .btn { background:#7b1f4c; color:#fff; padding:6px 14px; border:0; border-radius:4px; cursor:pointer; font-weight:600; }
</style></head><body>
<div class="noprint" style="text-align:right;margin-bottom:10px"><button class="btn" onclick="window.print()">🖨 Print</button></div>
${html}
</body></html>`);
  w.document.close();
}

function esc(s: any): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function ReportsView({ ay, me, onBack }: { ay: string; me: any; onBack: () => void }) {
  const asg = useQuery({
    queryKey: ["fac-asg", me.id, ay],
    queryFn: () => listAssignments({ data: { staff_id: me.id, academic_year: ay } }),
  });
  const classes = Array.from(
    new Map((asg.data ?? []).map((x: any) => [`${x.branch}|${x.semester}`, { branch: x.branch, semester: x.semester }])).values(),
  );
  const [kind, setKind] = useState<ReportKey>("subject_register");
  const [classKey, setClassKey] = useState<string>("");
  const [subjectId, setSubjectId] = useState<number | "">("");
  const today = new Date();
  const [from, setFrom] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [houseBonus, setHouseBonus] = useState(0);
  const [sportsBonus, setSportsBonus] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [branch, semester] = classKey ? classKey.split("|") : ["", ""];
  const subjects = (asg.data ?? [])
    .filter((x: any) => x.branch === branch && String(x.semester) === semester)
    .map((x: any) => ({ id: x.subject_id, code: x.subjects?.code, name: x.subjects?.name }));

  const needSubject = kind === "subject_register" || kind === "sessional_s1";
  const needMonth = kind === "monthly_att";
  const needDateRange = kind === "subject_register" || kind === "consolidated_register" || kind === "final_att";

  async function generate() {
    setErr(null);
    if (!branch || !semester) return setErr("Select class");
    if (needSubject && !subjectId) return setErr("Select subject");
    setBusy(true);
    try {
      const header = `<h1>Government Polytechnic Kinnaur</h1>`;
      if (kind === "subject_register") {
        const d = await individualSubjectRegister({
          data: { branch, semester: Number(semester), subject_id: Number(subjectId), from_date: from, to_date: to },
        });
        const cols = d.dates.map((x: string) => `<th>${x.slice(5)}</th>`).join("");
        const rows = d.students
          .map(
            (s: any, i: number) =>
              `<tr><td>${i + 1}</td><td>${esc(s.enrollment_no)}</td><td class="name">${esc(s.name)}</td>${s.marks
                .map((m: string) => `<td>${m ? m[0].toUpperCase() : "-"}</td>`)
                .join("")}<td><b>${s.present}/${s.total}</b></td><td><b>${s.pct}%</b></td></tr>`,
          )
          .join("");
        printHtml(
          `${header}<h2>Individual Subject Attendance Register — ${esc(d.subject?.code)} ${esc(d.subject?.name)}<br/>${esc(branch)} · Sem ${esc(semester)} · ${from} to ${to}</h2>
          <table><thead><tr><th>#</th><th>Enroll</th><th class="l">Name</th>${cols}<th>P/T</th><th>%</th></tr></thead><tbody>${rows}</tbody></table>`,
          "Subject Register",
        );
      } else if (kind === "consolidated_register") {
        const d = await cumulativeConsolidatedRegister({
          data: { branch, semester: Number(semester), from_date: from, to_date: to },
        });
        const cols = d.subjects.map((s: any) => `<th>${esc(s.code)}</th>`).join("");
        const rows = d.students
          .map(
            (st: any, i: number) =>
              `<tr><td>${i + 1}</td><td>${esc(st.enrollment_no)}</td><td class="name">${esc(st.name)}</td>${st.per_subject
                .map((p: any) => `<td>${p.pct}%</td>`)
                .join("")}</tr>`,
          )
          .join("");
        printHtml(
          `${header}<h2>Cumulative Consolidated Attendance Register — ${esc(branch)} · Sem ${esc(semester)} · ${from} to ${to}</h2>
          <table><thead><tr><th>#</th><th>Enroll</th><th class="l">Name</th>${cols}</tr></thead><tbody>${rows}</tbody></table>`,
          "Consolidated Register",
        );
      } else if (kind === "sessional_s1") {
        const d = await subjectSessionalReport({
          data: { branch, semester: Number(semester), subject_id: Number(subjectId), academic_year: ay },
        });
        const W = d.weightage as any;
        const cell = (n: number | null | undefined) => (n == null ? "-" : String(n));
        const rows = d.students
          .map(
            (s: any, i: number) =>
              `<tr>
                <td>${i + 1}</td>
                <td>${esc(s.enrollment_no)}</td>
                <td class="name">${esc(s.name)}</td>
                <td>${cell(s.test_score)}</td>
                <td>${cell(s.assignment_score)}</td>
                <td>${cell(s.attendance_score)}${s.attendance_pct != null ? `<div style="font-size:9px;color:#888">${s.attendance_pct}%</div>` : ""}</td>
                <td>${cell(s.house_test_score)}</td>
                <td><b>${cell(s.theory_total)}</b></td>
                <td>${cell(s.performance_score)}</td>
                <td>${cell(s.report_score)}</td>
                <td>${cell(s.viva_score)}</td>
                <td><b>${cell(s.practical_total)}</b></td>
                <td><b>${cell(s.grand_total)}</b></td>
              </tr>`,
          )
          .join("");
        printHtml(
          `${header}
          <h2>Proforma for Sessional (Internal Assessment) Marks — S-1<br/>
            ${esc(d.subject?.code ?? "")} ${esc(d.subject?.name ?? "")} · ${esc(branch)} · Sem ${esc(semester)} · AY ${esc(ay)}
          </h2>
          <p style="font-size:11px;color:#555;margin:4px 0 10px">
            Weightage per HP TSB rules — Theory: House Test 40% + Class Test 20% + Assignment 20% + Attendance 20%.
            Practical: Performance 60% + Report Writing 20% + Viva 20%.
          </p>
          <table>
            <thead>
              <tr>
                <th rowspan="2">#</th>
                <th rowspan="2">Board Roll No.</th>
                <th rowspan="2" class="l">Name</th>
                <th colspan="5">Theory Marks</th>
                <th colspan="4">Practical Marks</th>
                <th rowspan="2">Grand Total (A+B)</th>
              </tr>
              <tr>
                <th>Test (${W.test})</th>
                <th>Assignment (${W.assignment})</th>
                <th>Attendance (${W.attendance})</th>
                <th>House Test (${W.house_test})</th>
                <th>Total A (${W.test + W.assignment + W.attendance + W.house_test})</th>
                <th>Performance (${W.performance})</th>
                <th>Report (${W.report})</th>
                <th>Viva (${W.viva})</th>
                <th>Total B (${W.performance + W.report + W.viva})</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="display:flex;justify-content:space-between;margin-top:40px;font-size:11px">
            <div><b>Signature of HOD</b></div>
            <div><b>Signature of the Teacher</b></div>
          </div>`,
          "Sessional S-1",
        );

      } else if (kind === "sessional_s2") {
        const d = await endSemSessionalReport({
          data: { branch, semester: Number(semester), academic_year: ay },
        });
        const cols = d.subjects.map((s: any) => `<th>${esc(s.code)}</th>`).join("");
        const rows = d.students
          .map(
            (s: any, i: number) =>
              `<tr><td>${i + 1}</td><td>${esc(s.enrollment_no)}</td><td class="name">${esc(s.name)}</td>${s.per_subject
                .map((p: any) => `<td>${p.obtained}/${p.max || "-"}</td>`)
                .join("")}</tr>`,
          )
          .join("");
        printHtml(
          `${header}<h2>End-Semester Sessional Report (S-2) — ${esc(branch)} · Sem ${esc(semester)} · AY ${esc(ay)}</h2>
          <table><thead><tr><th>#</th><th>Enroll</th><th class="l">Name</th>${cols}</tr></thead><tbody>${rows}</tbody></table>`,
          "Sessional S-2",
        );
      } else if (kind === "monthly_att") {
        const d = await monthlyAttendanceRegister({
          data: { branch, semester: Number(semester), year, month },
        });
        const rows = d.students
          .map(
            (s: any, i: number) =>
              `<tr><td>${i + 1}</td><td>${esc(s.enrollment_no)}</td><td class="name">${esc(s.name)}</td>
              <td>${s.theory_present}/${s.theory_total}</td><td>${s.theory_pct}%</td>
              <td>${s.practical_present}/${s.practical_total}</td><td>${s.practical_pct}%</td>
              <td><b>${s.overall_pct}%</b></td></tr>`,
          )
          .join("");
        printHtml(
          `${header}<h2>Monthly Attendance Register — ${esc(branch)} · Sem ${esc(semester)} · ${String(month).padStart(2, "0")}/${year}</h2>
          <table><thead><tr><th>#</th><th>Enroll</th><th class="l">Name</th><th>Theory P/T</th><th>Theory %</th><th>Practical P/T</th><th>Practical %</th><th>Overall %</th></tr></thead><tbody>${rows}</tbody></table>`,
          "Monthly Attendance",
        );
      } else if (kind === "final_att") {
        const d = await finalAttendanceReport({
          data: {
            branch,
            semester: Number(semester),
            from_date: from,
            to_date: to,
            academic_year: ay,
            house_test_bonus_periods: houseBonus,
            sports_bonus_periods: sportsBonus,
          },
        });
        const cols = d.subjects.map((s: any) => `<th colspan="2">${esc(s.code)}</th>`).join("");
        const sub2 = d.subjects.map(() => `<th>P/T</th><th>%</th>`).join("");
        const rows = d.students
          .map(
            (s: any, i: number) =>
              `<tr><td>${i + 1}</td><td>${esc(s.enrollment_no)}</td><td class="name">${esc(s.name)}</td>${s.per_subject
                .map((p: any) => `<td>${p.present}/${p.total}</td><td>${p.pct}%</td>`)
                .join("")}<td>${s.total_periods}</td><td>${s.present_periods}</td><td>${s.absent_periods}</td><td><b>${s.overall_pct}%</b></td><td><b>${s.adjusted_pct}%</b></td><td>₹${s.fine_rupees}</td></tr>`,
          )
          .join("");
        printHtml(
          `${header}<h2>Final Attendance Report (Board) — ${esc(branch)} · Sem ${esc(semester)} · ${from} to ${to}<br/>House-Test Bonus: ${houseBonus} periods · Sports Bonus: ${sportsBonus} periods · Fine: ₹${d.fine_per_period}/period</h2>
          <table><thead>
            <tr><th rowspan="2">#</th><th rowspan="2">Enroll</th><th rowspan="2" class="l">Name</th>${cols}<th rowspan="2">Total</th><th rowspan="2">Present</th><th rowspan="2">Absent</th><th rowspan="2">Raw %</th><th rowspan="2">Adj %</th><th rowspan="2">Fine</th></tr>
            <tr>${sub2}</tr>
          </thead><tbody>${rows}</tbody></table>`,
          "Final Attendance Report",
        );
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const cards: { key: ReportKey; icon: any; label: string; desc: string }[] = [
    { key: "subject_register", icon: CheckSquare, label: "Individual Subject Register", desc: "Daily attendance register for a specific class & subject." },
    { key: "consolidated_register", icon: BarChart2, label: "Cumulative Consolidated Register", desc: "Cumulative attendance summary for all subjects in a class." },
    { key: "sessional_s1", icon: FileText, label: "Subject Sessional Report", desc: "Detailed sessional mark breakdown for a single subject (S-1)." },
    { key: "sessional_s2", icon: FileSpreadsheet, label: "End-Semester Sessional Report", desc: "Final consolidated sessional marks — all subjects (S-2)." },
    { key: "monthly_att", icon: Calendar, label: "Monthly Attendance Register", desc: "Theory %, Practical %, Overall % per student for the month." },
    { key: "final_att", icon: ClipboardList, label: "Final Attendance Report (Board)", desc: "Includes House-Test / Sports bonus & fine @ ₹5/period." },
  ];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">📊 Generate Reports</h1>
      <p className="text-sm text-gray-500">Select the report type. All reports open a print-ready page.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((rc) => (
          <button
            key={rc.key}
            onClick={() => setKind(rc.key)}
            className={`text-left bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${
              kind === rc.key ? "ring-2 ring-[#7b1f4c] border-[#7b1f4c]" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <p className="font-semibold text-gray-800 text-sm">{rc.label}</p>
              <rc.icon className="w-5 h-5 text-[#7b1f4c] flex-shrink-0" />
            </div>
            <p className="text-xs text-gray-500 mt-2">{rc.desc}</p>
          </button>
        ))}
      </div>

      <Card>
        <p className="font-semibold text-gray-800 mb-3">Report Parameters</p>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Class</label>
            <select value={classKey} onChange={(e) => { setClassKey(e.target.value); setSubjectId(""); }} className="border rounded w-full px-3 py-2">
              <option value="">Select class…</option>
              {classes.map((c: any) => (
                <option key={`${c.branch}|${c.semester}`} value={`${c.branch}|${c.semester}`}>
                  {c.branch} · Sem {c.semester}
                </option>
              ))}
            </select>
          </div>
          {needSubject && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Subject</label>
              <select value={subjectId} onChange={(e) => setSubjectId(Number(e.target.value))} className="border rounded w-full px-3 py-2">
                <option value="">Select subject…</option>
                {subjects.map((s: any) => (<option key={s.id} value={s.id}>{s.code} — {s.name}</option>))}
              </select>
            </div>
          )}
          {needDateRange && (
            <>
              <div><label className="text-xs text-gray-500 mb-1 block">From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded w-full px-3 py-2" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded w-full px-3 py-2" /></div>
            </>
          )}
          {needMonth && (
            <>
              <div><label className="text-xs text-gray-500 mb-1 block">Month</label>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border rounded w-full px-3 py-2">
                  {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString(undefined, { month: "long" })}</option>))}
                </select>
              </div>
              <div><label className="text-xs text-gray-500 mb-1 block">Year</label><input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="border rounded w-full px-3 py-2" /></div>
            </>
          )}
          {kind === "final_att" && (
            <>
              <div><label className="text-xs text-gray-500 mb-1 block">House-Test Bonus (periods)</label><input type="number" value={houseBonus} onChange={(e) => setHouseBonus(Number(e.target.value))} className="border rounded w-full px-3 py-2" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Sports Bonus (periods)</label><input type="number" value={sportsBonus} onChange={(e) => setSportsBonus(Number(e.target.value))} className="border rounded w-full px-3 py-2" /></div>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button disabled={busy} onClick={generate} className="bg-[#7b1f4c] text-white px-5 py-2 rounded font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60">
            <Printer className="w-4 h-4" /> {busy ? "Generating…" : "Generate & Print"}
          </button>
          {err && <p className="text-xs text-rose-700">{err}</p>}
        </div>
      </Card>
    </div>
  );
}
