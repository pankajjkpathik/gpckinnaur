import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Download,
  FileText,
  BookOpen,
  GraduationCap,
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
  studentMyFees,
  studentMyDisciplinary,
  studentMySubmissions,
  studentSetAssignmentStatus,
  studentRequestFeeReceipt,
} from "@/lib/assignments.functions";

import { LessonPlanLibrary } from "@/components/portal/LessonPlanLibrary";
import { SyllabusCoverage } from "@/components/portal/SyllabusCoverage";
import { TimetableGrid } from "@/components/portal/TimetableGrid";
import { HeroBanner } from "@/components/portal/HeroBanner";

import { branchToDept } from "@/lib/branch";
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
  
  | "assignments-docs"
  | "lesson-plans"
  | "exam-schedule"
  | "timetable"
  | "syllabus"
  | "fees"
  | "faculty"
  | "disciplinary";


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

  const NAV: { icon: any; label: string; view: View }[] = [
    { icon: GraduationCap, label: "Home", view: "home" },
    { icon: ClipboardCheck, label: "My Attendance", view: "attendance" },
    { icon: FileSpreadsheet, label: "My Marks", view: "marks" },
    { icon: GraduationCap, label: "My Results", view: "results" },
    { icon: NotebookPen, label: "Lesson Plans", view: "lesson-plans" },
    { icon: BookMarked, label: "Syllabus Coverage", view: "syllabus" },
    { icon: Calendar, label: "Timetable", view: "timetable" },
    { icon: CalendarClock, label: "Exam Schedule", view: "exam-schedule" },
    { icon: BookOpen, label: "Assignments", view: "assignments-docs" },
    
    { icon: DollarSign, label: "Fees Payment", view: "fees" },
    { icon: Users, label: "My Faculty", view: "faculty" },
    { icon: Shield, label: "Disciplinary Actions", view: "disciplinary" },
  ];


  return (
    <div className="min-h-screen bg-[#f7f7fb]">
      <header className="bg-white border-b">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
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

      <div className="flex">
        {/* LHS sidebar */}
        <aside className="w-60 shrink-0 bg-white border-r min-h-[calc(100vh-65px)] sticky top-0 self-start hidden md:block">
          <nav className="py-3">
            {NAV.map((item) => {
              const active = view === item.view;
              const Icon = item.icon;
              return (
                <button
                  key={item.view}
                  onClick={() => setView(item.view)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left border-l-4 transition ${
                    active
                      ? "border-[#7b1f4c] bg-[#7b1f4c]/5 text-[#7b1f4c] font-semibold"
                      : "border-transparent text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full border-b bg-white overflow-x-auto flex whitespace-nowrap">
          {NAV.map((item) => {
            const active = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`px-3 py-2 text-xs ${
                  active ? "border-b-2 border-[#7b1f4c] text-[#7b1f4c] font-semibold" : "text-gray-600"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* RHS output */}
        <main className="flex-1 min-w-0 p-4 md:p-6">
          {(() => {
            const goHome = () => setView("home");
            return (
              <>
                {view === "home" && <HomeView me={me} setView={setView} />}
                {view === "attendance" && <AttendanceView onBack={goHome} />}
                {view === "marks" && <MarksView onBack={goHome} />}
                {view === "results" && <ResultsView me={me} onBack={goHome} />}
                
                {view === "assignments-docs" && <AssignmentDocsView onBack={goHome} />}
                {view === "lesson-plans" && <LessonPlansView me={me} onBack={goHome} />}
                {view === "exam-schedule" && <ExamScheduleView me={me} onBack={goHome} />}
                {view === "timetable" && <TimetableView me={me} onBack={goHome} />}
                {view === "syllabus" && <SyllabusView me={me} onBack={goHome} />}
                {view === "fees" && <FeesView onBack={goHome} />}
                {view === "faculty" && <FacultyView onBack={goHome} />}
                {view === "disciplinary" && <DisciplinaryView onBack={goHome} />}

              </>
            );
          })()}
        </main>
      </div>
    </div>
  );
}

// ─── Assignment status buttons (shared: dashboard + assignments page) ────────
function useMySubmissions() {
  const fn = useServerFn(studentMySubmissions);
  return useQuery({ queryKey: ["student-my-submissions"], queryFn: () => fn() });
}

function useSetAssignmentStatus() {
  const qc = useQueryClient();
  const fn = useServerFn(studentSetAssignmentStatus);
  return useMutation({
    mutationFn: (v: { assignment_id: number; status: "noted" | "submitted" }) => fn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-my-submissions"] });
      qc.invalidateQueries({ queryKey: ["student-assignments-home"] });
      qc.invalidateQueries({ queryKey: ["student-assignments-list"] });
    },
  });
}

function AssignmentStatusButtons({
  assignmentId,
  currentStatus,
  size = "sm",
}: {
  assignmentId: number;
  currentStatus: string | null;
  size?: "xs" | "sm";
}) {
  const m = useSetAssignmentStatus();
  const disabled = m.isPending;
  const pad = size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  const btn = (active: boolean) =>
    `${pad} rounded font-semibold border transition disabled:opacity-50 ${
      active
        ? "bg-emerald-600 text-white border-emerald-600"
        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
    }`;
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => m.mutate({ assignment_id: assignmentId, status: "noted" })}
        className={btn(currentStatus === "noted")}
        title="Mark as noted"
      >
        {currentStatus === "noted" ? "✓ Noted" : "Noted"}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => m.mutate({ assignment_id: assignmentId, status: "submitted" })}
        className={btn(currentStatus === "submitted" || currentStatus === "graded")}
        title="Mark as submitted"
      >
        {currentStatus === "submitted" || currentStatus === "graded" ? "✓ Submitted" : "Submitted"}
      </button>
    </div>
  );
}

// ─── HOME (summary) ───────────────────────────────────────────────────────────
function HomeView({ me, setView }: { me: any; setView: (v: any) => void }) {
  const [openClass, setOpenClass] = useState<any | null>(null);
  const [feesOpen, setFeesOpen] = useState(false);
  const dashFn = useServerFn(studentDashboard);
  const assignFn = useServerFn(studentListAssignments);
  const feesFn = useServerFn(studentMyFees);
  const { data } = useQuery({ queryKey: ["student-dash"], queryFn: () => dashFn() });
  const { data: assignments = [] } = useQuery({ queryKey: ["student-assignments-home"], queryFn: () => assignFn() });
  const { data: fees = [] } = useQuery({ queryKey: ["student-fees-home"], queryFn: () => feesFn() });
  const { data: mySubs = [] } = useMySubmissions();
  const subStatus = (aid: number) =>
    (mySubs as any[]).find((s) => s.assignment_id === aid)?.status ?? null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingAssignments = (assignments as any[])
    .filter((a) => a.due_date && new Date(a.due_date) >= today)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);
  const pendingFees = (fees as any[]).filter(
    (f) => Number(f.total_amount || 0) - Number(f.paid_amount || 0) > 0,
  );
  const totalDue = pendingFees.reduce(
    (s, f) => s + (Number(f.total_amount || 0) - Number(f.paid_amount || 0)),
    0,
  );
  const daysUntil = (d: string) =>
    Math.ceil((new Date(d).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-5">
      <HeroBanner
        name={me.name || "Student"}
        role={me.branch ? `${me.branch} · Sem ${me.semester ?? ""}` : "Student"}
        palette="student"
        subtitle={<span className="text-white/80">Choose an option from the left panel to view your details.</span>}
        stats={[
          { value: data ? `${data.attendance_pct}%` : "—", label: "Attendance" },
          { value: data?.today_periods?.length ?? 0, label: "Today" },
          { value: data?.pending_leaves ?? 0, label: "Leaves" },
        ]}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-400">Overall Attendance</p>
          <p className="text-3xl font-bold text-[#7b1f4c] mt-1">
            {data ? `${data.attendance_pct}%` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data ? `${data.present_periods} / ${data.total_periods} periods` : ""}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-400">Today's Classes</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">
            {data?.today_periods?.length ?? 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">{data?.today_date}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-400">Pending Leaves</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{data?.pending_leaves ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Applications awaiting approval</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Today's classes */}
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="w-4 h-4 text-[#7b1f4c]" />
            <h2 className="font-semibold text-gray-800">Today's Classes</h2>
          </div>
          {(data?.today_periods?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No classes scheduled today.</p>
          ) : (
            <ul className="divide-y">
              {data!.today_periods.map((p: any) => {
                const pm = (data as any).periods?.find((x: any) => x.period_no === p.period_no);
                return (
                  <li key={p.period_no}>
                    <button
                      type="button"
                      onClick={() => setOpenClass({ ...p, timing: pm })}
                      className="w-full py-2 flex items-start gap-3 text-left hover:bg-gray-50 rounded px-1 -mx-1 transition"
                    >
                      <span className="w-8 h-8 rounded-full bg-[#7b1f4c]/10 text-[#7b1f4c] text-xs font-bold flex items-center justify-center shrink-0">
                        P{p.period_no}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {p.subjects?.name || p.subjects?.code || "—"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {p.staff_users?.username || "TBA"}
                          {p.room ? ` · Room ${p.room}` : ""}
                          {pm ? ` · ${pm.start_time?.slice(0, 5)}–${pm.end_time?.slice(0, 5)}` : ""}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#7b1f4c] font-semibold shrink-0 mt-1">View →</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>


        {/* Assignment reminders */}
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <NotebookPen className="w-4 h-4 text-indigo-600" />
            <h2 className="font-semibold text-gray-800">Assignment Reminders</h2>
          </div>
          {upcomingAssignments.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No upcoming assignments.</p>
          ) : (
            <ul className="divide-y">
              {upcomingAssignments.map((a: any) => {
                const dn = daysUntil(a.due_date);
                const urgent = dn <= 2;
                return (
                  <li key={a.id} className="py-2 space-y-1.5">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {a.subjects?.code || a.subject_name || ""} · Due{" "}
                          {new Date(a.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                          urgent ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {dn === 0 ? "Today" : `${dn}d`}
                      </span>
                    </div>
                    <AssignmentStatusButtons assignmentId={a.id} currentStatus={subStatus(a.id)} size="xs" />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Fees reminder */}
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h2 className="font-semibold text-gray-800">Fees Reminder</h2>
            </div>
            {pendingFees.length > 0 && (
              <button
                type="button"
                onClick={() => setFeesOpen(true)}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
              >
                View details
              </button>
            )}
          </div>
          {pendingFees.length === 0 ? (
            <p className="text-sm text-emerald-700 py-4 text-center">
              All fees are paid. Thank you!
            </p>
          ) : (
            <>
              <div className="bg-rose-50 border border-rose-200 rounded p-3 mb-3">
                <p className="text-xs text-rose-700 uppercase tracking-wide">Total Outstanding</p>
                <p className="text-2xl font-bold text-rose-700">₹{totalDue.toLocaleString()}</p>
              </div>
              <ul className="divide-y">
                {pendingFees.slice(0, 4).map((f: any) => {
                  const due = Number(f.total_amount || 0) - Number(f.paid_amount || 0);
                  return (
                    <li key={f.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 truncate">
                          Sem {f.semester} · {f.academic_year}
                        </p>
                        {f.due_date && (
                          <p className="text-xs text-gray-500">
                            Due {new Date(f.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-rose-600 shrink-0">
                        ₹{due.toLocaleString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() => setFeesOpen(true)}
                className="mt-3 w-full text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded py-2"
              >
                View outstanding & request receipt
              </button>
            </>
          )}
        </Card>
      </div>

      <FeesDetailDialog
        open={feesOpen}
        onClose={() => setFeesOpen(false)}
        fees={fees as any[]}
      />



      <ClassDetailDialog
        openClass={openClass}
        onClose={() => setOpenClass(null)}
        attBySubject={(data as any)?.attendance_by_subject || {}}
        setView={setView}
      />
    </div>
  );
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ClassDetailDialog({
  openClass,
  onClose,
  attBySubject,
  setView,
}: {
  openClass: any | null;
  onClose: () => void;
  attBySubject: Record<string, { total: number; present: number }>;
  setView: (v: any) => void;
}) {
  const sylFn = useServerFn(studentSyllabus);
  const { data: syllabus = [], isLoading } = useQuery({
    queryKey: ["student-syllabus-modal"],
    queryFn: () => sylFn(),
    enabled: !!openClass,
  });

  if (!openClass) return null;
  const subjectId = openClass.subjects?.id ?? openClass.subject_id;
  const subj = (syllabus as any[]).find((s) => s.id === subjectId);
  const att = attBySubject[String(subjectId)];
  const pct = att && att.total ? Math.round((att.present / att.total) * 1000) / 10 : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b bg-[#7b1f4c] text-white flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest opacity-80">
              Period {openClass.period_no}
              {openClass.timing
                ? ` · ${openClass.timing.start_time?.slice(0, 5)}–${openClass.timing.end_time?.slice(0, 5)}`
                : ""}
              {" · "}
              {DAY_NAMES[openClass.day_of_week] ?? ""}
            </p>
            <h3 className="text-lg font-bold truncate">
              {openClass.subjects?.name || openClass.subjects?.code || "Class"}
            </h3>
            <p className="text-xs opacity-90 truncate">
              {openClass.subjects?.code ? `${openClass.subjects.code} · ` : ""}
              {openClass.staff_users?.username || "TBA"}
              {openClass.room ? ` · Room ${openClass.room}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Attendance summary */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="font-semibold text-gray-800 text-sm">Your Attendance in this Subject</h4>
            </div>
            {att ? (
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-emerald-700">{pct}%</div>
                <div className="text-sm text-gray-600">
                  {att.present} present of {att.total} periods
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No attendance recorded yet for this subject.</p>
            )}
          </section>

          {/* Syllabus */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <BookMarked className="w-4 h-4 text-[#7b1f4c]" />
              <h4 className="font-semibold text-gray-800 text-sm">Syllabus Notes</h4>
            </div>
            {isLoading ? (
              <p className="text-sm text-gray-400">Loading syllabus…</p>
            ) : !subj || !subj.units?.length ? (
              <p className="text-sm text-gray-500">No syllabus units published for this subject yet.</p>
            ) : (
              <ol className="space-y-3">
                {subj.units.map((u: any) => (
                  <li key={u.unit_no} className="border-l-2 border-[#7b1f4c]/30 pl-3">
                    <p className="text-sm font-semibold text-gray-800">
                      Unit {u.unit_no}: {u.title}
                    </p>
                    {u.topics && u.topics.length > 0 && (
                      <ul className="mt-1 text-xs text-gray-600 list-disc list-inside space-y-0.5">
                        {u.topics.map((t: string, i: number) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t bg-gray-50 flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => {
              onClose();
              setView("attendance");
            }}
            className="px-3 py-1.5 rounded border text-xs font-medium text-gray-700 hover:bg-white flex items-center gap-1.5"
          >
            <ClipboardCheck className="w-3.5 h-3.5" /> Full Attendance
          </button>
          <button
            onClick={() => {
              onClose();
              setView("syllabus");
            }}
            className="px-3 py-1.5 rounded border text-xs font-medium text-gray-700 hover:bg-white flex items-center gap-1.5"
          >
            <BookMarked className="w-3.5 h-3.5" /> Syllabus Coverage
          </button>
          <button
            onClick={() => {
              onClose();
              setView("timetable");
            }}
            className="px-3 py-1.5 rounded bg-[#7b1f4c] text-white text-xs font-medium hover:bg-[#65173e] flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" /> Full Timetable
          </button>
        </div>
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

// ─── MY ASSIGNMENTS ───────────────────────────────────────────────────────────



// ─── DOCS: Assignments & Exam Schedule (shared table) ────────────────────────
function DocsListView({
  onBack,
  type,
  title,
  subtitle,
}: {
  onBack: () => void;
  type: "assignment" | "exam_schedule";
  title: string;
  subtitle: string;
}) {
  const fn = useServerFn(studentDocuments);
  const { data = [], isLoading } = useQuery({
    queryKey: ["student-docs", type],
    queryFn: () => fn({ data: { type } }),
  });

  return (
    <div className="space-y-4">
      
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">{title}</h1>
        <p className="text-xs text-gray-400 mb-4">{subtitle}</p>

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
                    Nothing in this category yet.
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

function AssignmentDocsView({ onBack }: { onBack: () => void }) {
  void onBack;
  const fn = useServerFn(studentListAssignments);
  const { data = [], isLoading } = useQuery({
    queryKey: ["student-assignments-list"],
    queryFn: () => fn(),
  });
  const { data: mySubs = [] } = useMySubmissions();
  const subStatus = (aid: number) =>
    (mySubs as any[]).find((s) => s.assignment_id === aid)?.status ?? null;
  const rows = data as any[];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Assignments</h1>
        <p className="text-xs text-gray-400 mb-4">
          Download the assignment brief. Mark it as <b>Noted</b> once you've read it, and as{" "}
          <b>Submitted</b> after handing your work to your faculty.
        </p>
        <div className="border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Due Date</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">File</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a: any) => {
                const overdue = a.due_date && a.due_date < today;
                const st = subStatus(a.id);
                return (
                  <tr key={a.id} className="border-t">
                    <td className="px-4 py-3">{a.subjects?.name || a.subject_name || "—"}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{a.title}</p>
                      {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {a.due_date ?? "—"}
                      {overdue && <span className="ml-1 text-[10px] text-rose-600 font-semibold">OVERDUE</span>}
                    </td>
                    <td className="px-4 py-3">
                      {a.file_url ? (
                        <a
                          href={a.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 border rounded px-3 py-1.5 text-sm hover:bg-gray-50"
                        >
                          <Download className="w-4 h-4" /> Download
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No file</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AssignmentStatusButtons assignmentId={a.id} currentStatus={st} />
                    </td>
                  </tr>
                );
              })}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No assignments posted for your class yet.
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


function ExamScheduleView({ me, onBack }: { me: any; onBack: () => void }) {
  void onBack;
  return (
    <div className="space-y-4">
      <Card>
        <LessonPlanLibrary
          docType="exam_schedule"
          defaultBranch={branchToDept(me.branch)}
          defaultSemester={me.semester}
          lockFilters
          title="Exam Schedule"
          subtitle={`Datesheets uploaded by your faculty — ${branchToDept(me.branch)} · Semester ${me.semester}.`}
        />
      </Card>
    </div>
  );
}

// ─── LESSON PLANS ─────────────────────────────────────────────────────────────
function LessonPlansView({ me, onBack }: { me: any; onBack: () => void }) {
  void onBack;
  return (
    <div className="space-y-4">
      <Card>
        <LessonPlanLibrary
          docType="lesson_plan"
          defaultBranch={branchToDept(me.branch)}
          defaultSemester={me.semester}
          lockFilters
          title="Lesson Plans"
          subtitle={`PDFs uploaded by your faculty — ${branchToDept(me.branch)} · Semester ${me.semester}.`}
        />
      </Card>
    </div>
  );
}

// ─── TIMETABLE ────────────────────────────────────────────────────────────────
function TimetableView({ me, onBack }: { me: any; onBack: () => void }) {
  void onBack;
  const ttFn = useServerFn(studentTimetable);
  const { data: tt } = useQuery({ queryKey: ["student-tt"], queryFn: () => ttFn() });
  const periods = (tt?.periods ?? []) as any[];

  const ORD = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Timetable</h1>
            <p className="text-xs text-gray-400">Your weekly class schedule.</p>
          </div>
          <button
            onClick={() => window.print()}
            className="border rounded px-3 py-1.5 text-sm inline-flex items-center gap-1.5"
          >
            🖨️ Print
          </button>
        </div>

        {!tt ? (
          <p className="p-6 text-center text-sm text-gray-400">Loading…</p>
        ) : periods.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">Timetable periods not configured yet.</p>
        ) : (tt.entries as any[]).length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">No timetable published yet for your class.</p>
        ) : (
          <TimetableGrid
            periods={periods as any}
            slots={(tt.entries as any[]) as any}
            editable={false}
            institutionLine="Govt. Polytechnic Kinnaur, Camp at GP Rohru Distt. Shimla (H.P.)"
            classLine={`${branchToDept(me.branch)} - ${ORD[me.semester] ?? me.semester} Semester`}
          />
        )}
      </Card>
    </div>
  );
}

// ─── SYLLABUS COVERAGE ────────────────────────────────────────────────────────
function SyllabusView({ me, onBack }: { me: any; onBack: () => void }) {
  void onBack;
  const sylFn = useServerFn(studentSyllabus);
  const { data: syl = [] } = useQuery({ queryKey: ["student-syl"], queryFn: () => sylFn() });
  const academicYear = (() => {
    const d = new Date();
    const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
    return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
  })();

  return (
    <div className="space-y-4">
      <Card>
        <SyllabusCoverage
          mode="view"
          academicYear={academicYear}
          scope={{ branch: me.branch, semester: me.semester }}
          title="Syllabus Coverage"
          subtitle={`Delivered vs planned hours — ${branchToDept(me.branch)} · Semester ${me.semester}.`}
        />
        <div className="border rounded overflow-hidden mt-6">
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
