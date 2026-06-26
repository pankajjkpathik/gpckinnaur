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
import { facultyRoles } from "@/lib/roles";
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
  "mid_sessional",
  "final_sessional",
  "practical",
  "viva",
] as const;

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
    else if (!facultyRoles.includes(me.role as any)) nav({ to: "/staff-dashboard" });
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
          {view === "exam-schedule" && <ExamScheduleView onBack={() => setView("home")} />}
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
                {rosterQ.data.map((s: any) => (
                  <tr key={s.id} className="border-t">
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
                              checked={(marks[s.id] ?? "present") === opt}
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
                ))}
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
  const [examType, setExamType] = useState<(typeof EXAM_TYPES)[number]>("internal");
  const [maxMarks, setMaxMarks] = useState<number>(20);
  const [loaded, setLoaded] = useState(false);
  const a = (asg.data ?? []).find((x: any) => x.id === asgId);

  const data = useQuery({
    enabled: !!a && loaded,
    queryKey: ["marks", a?.subject_id, examType, ay],
    queryFn: () =>
      getMarks({
        data: {
          branch: a!.branch,
          semester: a!.semester,
          subject_id: a!.subject_id,
          exam_type: examType,
          academic_year: ay,
        },
      }),
  });
  const [entries, setEntries] = useState<Record<number, { obtained: string; remarks: string }>>({});
  useEffect(() => {
    if (data.data) {
      const m: any = {};
      data.data.rows.forEach(
        (r: any) => (m[r.id] = { obtained: r.obtained != null ? String(r.obtained) : "", remarks: r.remarks ?? "" }),
      );
      setEntries(m);
      if (data.data.rows[0]?.max_marks) setMaxMarks(Number(data.data.rows[0].max_marks));
    }
  }, [data.data]);

  const save = useMutation({
    mutationFn: (submit: boolean) =>
      saveMarks({
        data: {
          subject_id: a!.subject_id,
          branch: a!.branch,
          semester: a!.semester,
          exam_type: examType,
          academic_year: ay,
          max_marks: maxMarks,
          submit,
          entries: Object.entries(entries).map(([id, v]) => ({
            student_id: Number(id),
            obtained: v.obtained === "" ? null : Number(v.obtained),
            remarks: v.remarks || null,
          })),
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marks"] }),
  });
  const locked = data.data?.submitted;
  const selectedSubject = a ? `${a.subjects?.name || a.subjects?.code}` : "";

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">Enter Student Marks</h1>

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
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as any)}
              className="border rounded w-full px-3 py-2"
            >
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
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

      {data.data && (
        <Card>
          <p className="font-semibold text-gray-800 mb-4">Enter Marks: {selectedSubject}</p>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Roll</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">House Test</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Class Test 1</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Class Test 2</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Assignment 1</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Assignment 2</th>
                </tr>
              </thead>
              <tbody>
                {data.data.rows.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">{r.enrollment_no}</td>
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        max={maxMarks}
                        disabled={locked || r.locked}
                        value={entries[r.id]?.obtained ?? ""}
                        onChange={(e) =>
                          setEntries({
                            ...entries,
                            [r.id]: { obtained: e.target.value, remarks: entries[r.id]?.remarks ?? "" },
                          })
                        }
                        className="border rounded px-2 py-1 w-20 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" disabled={locked} className="border rounded px-2 py-1 w-20 text-sm" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" disabled={locked} className="border rounded px-2 py-1 w-20 text-sm" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" disabled={locked} className="border rounded px-2 py-1 w-20 text-sm" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" disabled={locked} className="border rounded px-2 py-1 w-20 text-sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!locked && (
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => save.mutate(false)}
                disabled={save.isPending}
                className="border px-4 py-2 rounded text-sm text-gray-700"
              >
                Save Draft
              </button>
              <button
                onClick={() => {
                  if (confirm("Submit to HOD? This will lock all entries.")) save.mutate(true);
                }}
                disabled={save.isPending}
                className="bg-[#7b1f4c] text-white px-4 py-2 rounded text-sm font-semibold"
              >
                Submit to HOD
              </button>
            </div>
          )}
          {locked && <p className="text-xs text-amber-700 mt-2">Submitted to HOD — entries locked.</p>}
          {save.isSuccess && <p className="text-xs text-green-700 mt-2">Saved.</p>}
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
  const asg = useQuery({
    queryKey: ["fac-asg", me.id, ay],
    queryFn: () => listAssignments({ data: { staff_id: me.id, academic_year: ay } }),
  });
  const [asgId, setAsgId] = useState<number | "">("");
  const [totalUnits, setTotalUnits] = useState("10");
  const [unitsCovered, setUnitsCovered] = useState("");
  const [remarks, setRemarks] = useState("");
  const pct = totalUnits && unitsCovered ? Math.round((Number(unitsCovered) / Number(totalUnits)) * 100) + "%" : "";

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">Syllabus Coverage</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <p className="font-semibold text-gray-800 mb-4">Add New Coverage Record</p>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Class</label>
              <select
                value={asgId}
                onChange={(e) => setAsgId(e.target.value ? Number(e.target.value) : "")}
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
                <option>Select subject</option>
                {(asg.data ?? []).map((x: any) => (
                  <option key={x.id} value={x.subject_id}>
                    {x.subjects?.name || x.subjects?.code}
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
            <button className="bg-[#7b1f4c] text-white w-full py-2 rounded font-semibold">Save</button>
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
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Units</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">% Covered</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No records found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── LESSON PLANS ─────────────────────────────────────────────────────────────
function LessonPlansView({ ay, me, onBack }: { ay: string; me: any; onBack: () => void }) {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["lessons", ay, me.id],
    queryFn: () => listLessonPlans({ data: { academic_year: ay, staff_id: me.id } }),
  });
  const asg = useQuery({
    queryKey: ["fac-asg", me.id, ay],
    queryFn: () => listAssignments({ data: { staff_id: me.id, academic_year: ay } }),
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteLessonPlan({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">Manage Lesson Plans</h1>

      <Card>
        <p className="font-semibold text-gray-800 mb-1">Upload New Lesson Plan</p>
        <p className="text-xs text-gray-400 mb-4">Upload a lesson plan document for a class.</p>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Plan Title</label>
            <input placeholder="e.g., Unit 1 Plan" className="border rounded w-full px-3 py-2" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Class</label>
            <select className="border rounded w-full px-3 py-2">
              <option value="">Select a class</option>
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
              <option value="">Select a subject</option>
              {(asg.data ?? []).map((x: any) => (
                <option key={x.id} value={x.subject_id}>
                  {x.subjects?.name || x.subjects?.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Lesson Plan File</label>
            <input type="file" className="border rounded w-full px-3 py-2 text-sm" />
          </div>
        </div>
        <button className="mt-4 bg-[#7b1f4c] text-white px-5 py-2 rounded font-semibold text-sm">Upload Plan</button>
      </Card>

      <Card>
        <p className="font-semibold text-gray-800 mb-4">Uploaded Lesson Plans</p>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Class</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Upload Date</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(list.data ?? []).map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">{p.topic}</td>
                  <td className="px-4 py-3">
                    {p.branch}-Sem{p.semester}
                  </td>
                  <td className="px-4 py-3">{p.subjects?.code}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {p.planned_date ?? p.created_at?.slice(0, 10) ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {(p.status === "draft" || p.status === "returned") && (
                      <button
                        onClick={() => {
                          if (confirm("Delete?")) del.mutate(p.id);
                        }}
                        className="text-rose-600 hover:text-rose-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {list.data && list.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No lesson plans found.
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

// ─── EXAM SCHEDULE ────────────────────────────────────────────────────────────
function ExamScheduleView({ onBack }: { onBack: () => void }) {
  const [schedules] = useState<any[]>([]);
  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">Manage Exam Schedules</h1>

      <Card>
        <p className="font-semibold text-gray-800 mb-1">Upload New Exam Schedule</p>
        <p className="text-xs text-gray-400 mb-4">Upload a datesheet document for an examination.</p>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Name of Exam</label>
            <select className="border rounded w-full px-3 py-2">
              <option value="">Select an exam</option>
              <option>House Test</option>
              <option>Mid Semester</option>
              <option>End Semester</option>
              <option>Practical</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Class</label>
            <select className="border rounded w-full px-3 py-2">
              <option value="">Select a class</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
            <input type="date" className="border rounded w-full px-3 py-2" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">End Date</label>
            <input type="date" className="border rounded w-full px-3 py-2" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Datesheet File (PDF)</label>
            <input type="file" accept=".pdf" className="border rounded w-full px-3 py-2 text-sm" />
          </div>
        </div>
        <button className="mt-4 bg-[#7b1f4c] text-white px-5 py-2 rounded font-semibold text-sm">
          Upload Schedule
        </button>
      </Card>

      <Card>
        <p className="font-semibold text-gray-800 mb-4">Uploaded Schedules</p>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Exam Name</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Class</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Start Date</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">End Date</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No schedules uploaded yet.
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

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function ReportsView({ ay, me, onBack }: { ay: string; me: any; onBack: () => void }) {
  const asg = useQuery({
    queryKey: ["fac-asg", me.id, ay],
    queryFn: () => listAssignments({ data: { staff_id: me.id, academic_year: ay } }),
  });
  const [kind, setKind] = useState<"attendance" | "marks">("attendance");
  const [asgId, setAsgId] = useState<number | "">("");
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [examType, setExamType] = useState<(typeof EXAM_TYPES)[number]>("internal");
  const a = (asg.data ?? []).find((x: any) => x.id === asgId);

  const attQ = useQuery({
    enabled: kind === "attendance" && !!a,
    queryKey: ["att-rep", a?.id, from, to],
    queryFn: () =>
      attendanceReport({
        data: { branch: a!.branch, semester: a!.semester, subject_id: a!.subject_id, from_date: from, to_date: to },
      }),
  });
  const mkQ = useQuery({
    enabled: kind === "marks" && !!a,
    queryKey: ["marks-rep", a?.id, examType, ay],
    queryFn: () =>
      marksReport({
        data: {
          branch: a!.branch,
          semester: a!.semester,
          subject_id: a!.subject_id,
          exam_type: examType,
          academic_year: ay,
        },
      }),
  });

  const reportCards = [
    {
      label: "Individual Subject Register",
      desc: "Generate a daily attendance register for a specific class and subject.",
      icon: CheckSquare,
    },
    {
      label: "Cumulative Consolidated Register",
      desc: "View a cumulative attendance summary for all subjects in a class.",
      icon: BarChart2,
    },
    {
      label: "Subject Sessional Report",
      desc: "Generate a detailed sessional mark breakdown for a single subject.",
      icon: FileText,
    },
    {
      label: "End-Semester Sessional Report",
      desc: "Generate the final consolidated sessional marks for all subject types.",
      icon: FileSpreadsheet,
    },
    {
      label: "Final Attendance Report",
      desc: "Generate the official detailed attendance report for the board, including fine calculations.",
      icon: ClipboardList,
    },
  ];

  const rows =
    kind === "attendance"
      ? (attQ.data ?? []).map((s: any) => [s.enrollment_no, s.name, s.present, s.total, `${s.pct}%`])
      : (mkQ.data ?? []).map((s: any) => [
          s.enrollment_no,
          s.name,
          s.obtained ?? "",
          s.max_marks ?? "",
          s.remarks ?? "",
        ]);
  const header =
    kind === "attendance"
      ? ["Enrollment", "Name", "Present", "Total", "Percentage"]
      : ["Enrollment", "Name", "Obtained", "Max", "Remarks"];
  const fileBase = `${kind}_${a?.subjects?.code ?? "rep"}_${a?.branch ?? ""}_S${a?.semester ?? ""}`;
  const title =
    kind === "attendance"
      ? `Attendance Report — ${a?.subjects?.code ?? ""}`
      : `Marks Report — ${a?.subjects?.code ?? ""} (${examType})`;
  const subtitle =
    kind === "attendance"
      ? `${a?.branch}-Sem${a?.semester} · ${from} to ${to}`
      : `${a?.branch}-Sem${a?.semester} · AY ${ay}`;

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">Generate Reports</h1>
      <p className="text-sm text-gray-500">Select a report type to generate and download.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((rc) => (
          <div key={rc.label} className="bg-white border rounded-lg shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <p className="font-semibold text-gray-800 text-sm">{rc.label}</p>
              <rc.icon className="w-5 h-5 text-[#7b1f4c] flex-shrink-0" />
            </div>
            <p className="text-xs text-gray-500 flex-1">{rc.desc}</p>
            <button
              onClick={() => {
                if (rows.length > 0) {
                  exportPDF(fileBase, title, subtitle, header, rows);
                }
              }}
              className="bg-[#7b1f4c] text-white w-full py-2 rounded text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Generate
            </button>
          </div>
        ))}
      </div>

      {/* Filter panel */}
      <Card>
        <p className="font-semibold text-gray-800 mb-3">Report Filters</p>
        <div className="grid sm:grid-cols-5 gap-2 text-sm">
          <select value={kind} onChange={(e) => setKind(e.target.value as any)} className="border rounded px-3 py-2">
            <option value="attendance">Attendance</option>
            <option value="marks">Marks</option>
          </select>
          <select
            value={asgId}
            onChange={(e) => setAsgId(e.target.value ? Number(e.target.value) : "")}
            className="border rounded px-3 py-2 col-span-2"
          >
            <option value="">Subject / Class…</option>
            {(asg.data ?? []).map((x: any) => (
              <option key={x.id} value={x.id}>
                {x.subjects?.code} · {x.branch}-Sem{x.semester}
              </option>
            ))}
          </select>
          {kind === "attendance" ? (
            <>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </>
          ) : (
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as any)}
              className="border rounded px-3 py-2 col-span-2"
            >
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          )}
        </div>
        {rows.length > 0 && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => exportPDF(fileBase, title, subtitle, header, rows)}
              className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded"
            >
              Download PDF
            </button>
            <button
              onClick={() => exportExcel(fileBase, "Report", header, rows)}
              className="text-xs bg-green-700 text-white px-3 py-1.5 rounded"
            >
              Download Excel
            </button>
            <button
              onClick={() => exportCSV(fileBase, header, rows)}
              className="text-xs bg-gray-100 px-3 py-1.5 rounded"
            >
              CSV
            </button>
          </div>
        )}
        {rows.length > 0 && (
          <div className="border rounded overflow-hidden mt-3">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {header.map((h) => (
                    <th key={h} className="text-left px-4 py-2 text-gray-400 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    {r.map((c: any, j: number) => (
                      <td key={j} className="px-4 py-2">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {a && rows.length === 0 && !attQ.isLoading && !mkQ.isLoading && (
          <p className="text-sm text-gray-400 mt-3">No data for selected filters.</p>
        )}
      </Card>
    </div>
  );
}
