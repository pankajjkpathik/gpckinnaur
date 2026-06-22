import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Calendar, FileText, BookOpen, Clock, ClipboardList, Megaphone, GraduationCap } from "lucide-react";
import { studentMe, studentLogout } from "@/lib/auth.functions";
import { listMaterials } from "@/lib/materials.functions";
import { listNotices } from "@/lib/notices.functions";
import {
  studentDashboard, studentAttendance, studentMarks, studentTimetable,
  studentSyllabus, studentMyLeaves, studentApplyLeave, studentCancelLeave,
  studentCalendar, studentCirculars,
} from "@/lib/student.functions";

export const Route = createFileRoute("/student-dashboard")({
  head: () => ({ meta: [{ title: "Student Dashboard — GP Kinnaur" }, { name: "description", content: "Student Dashboard — GP Kinnaur at Government Polytechnic, Kinnaur — internal portal page." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: StudentDashboard,
});

type Tab =
  | "home" | "attendance" | "marks" | "timetable" | "syllabus"
  | "calendar" | "leave" | "circulars"
  | "notes" | "syllabus_files" | "paper" | "form" | "notices";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function StudentDashboard() {
  const navigate = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["student-me"], queryFn: () => studentMe() });
  const [tab, setTab] = useState<Tab>("home");

  useEffect(() => {
    if (!isLoading && !me) navigate({ to: "/student-login" });
  }, [me, isLoading, navigate]);

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  async function logout() {
    await studentLogout({});
    window.location.href = "/";
  }

  const initials = me.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();

  const tabs: [Tab, string][] = [
    ["home", "🏠 Home"],
    ["attendance", "📊 Attendance"],
    ["marks", "🎯 Marks & Results"],
    ["timetable", "⏰ Time Table"],
    ["syllabus", "📋 Syllabus"],
    ["calendar", "📅 Calendar"],
    ["leave", "📝 Leave"],
    ["circulars", "📣 Circulars"],
    ["notes", "📚 Notes"],
    ["paper", "📄 Papers"],
    ["form", "🗂 Forms"],
    ["notices", "📢 Notices"],
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-[color:var(--student)] text-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white text-[color:var(--student)] flex items-center justify-center font-bold">GPK</div>
            <p className="font-bold">Student Portal</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right hidden sm:block">
              <p className="font-medium">{me.name}</p>
              <p className="text-xs text-white/80">{me.enrollment_no}</p>
            </div>
            <a href="/student-change-password" className="px-3 py-1.5 rounded border border-white/40 text-sm">Change Password</a>
            <button onClick={logout} className="px-3 py-1.5 rounded border border-white/40 text-sm">Logout</button>
          </div>
        </div>
      </header>

      <div className="bg-[color:var(--student-light)] border-b">
        <div className="container mx-auto px-4 py-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[color:var(--student)] text-white flex items-center justify-center font-bold text-lg">{initials}</div>
          <div>
            <p className="text-xl font-bold text-[color:var(--student)]">{me.name}</p>
            <div className="flex flex-wrap gap-2 mt-1 text-xs">
              <Badge>📚 Branch: <strong className="capitalize">{me.branch}</strong></Badge>
              <Badge>📖 Semester: <strong>{me.semester}</strong></Badge>
              <Badge>🎓 Batch: <strong>{me.batch_year}</strong></Badge>
              <Badge>🆔 <strong>{me.enrollment_no}</strong></Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-4">
        <div className="flex flex-wrap gap-1 border-b overflow-x-auto">
          {tabs.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${tab === k ? "border-[color:var(--student)] text-[color:var(--student)]" : "border-transparent text-muted-foreground"}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {tab === "home" && <HomeTab setTab={setTab} />}
        {tab === "attendance" && <AttendanceTab />}
        {tab === "marks" && <MarksTab />}
        {tab === "timetable" && <TimetableTab />}
        {tab === "syllabus" && <SyllabusOfficialTab />}
        {tab === "calendar" && <CalendarTab />}
        {tab === "leave" && <LeaveTab />}
        {tab === "circulars" && <CircularsTab />}
        {tab === "notes" && <NotesTab branch={me.branch} semester={me.semester} />}
        {tab === "paper" && <PapersTab branch={me.branch} />}
        {tab === "form" && <FormsTab />}
        {tab === "notices" && <NoticesTab />}
      </div>
    </div>
  );
}

function Badge({ children }: any) {
  return <span className="bg-white border border-emerald-200 rounded-full px-3 py-1 text-emerald-800">{children}</span>;
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className={`bg-white border rounded-lg p-4 ${tone || ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-[color:var(--student)] mt-1">{value}</p>
    </div>
  );
}

function HomeTab({ setTab }: { setTab: (t: Tab) => void }) {
  const fn = useServerFn(studentDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["student-dash"], queryFn: () => fn() });
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const lowAttendance = data.attendance_pct > 0 && data.attendance_pct < 75;
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Overall Attendance" value={`${data.attendance_pct}%`} tone={lowAttendance ? "ring-1 ring-rose-300" : ""} />
        <Stat label="Periods Attended" value={`${data.present_periods} / ${data.total_periods}`} />
        <Stat label="Pending Leave Requests" value={data.pending_leaves} />
        <Stat label="Today's Periods" value={data.today_periods.length} />
      </div>
      {lowAttendance && (
        <div className="bg-rose-50 border border-rose-200 rounded p-3 text-sm text-rose-800">
          ⚠️ Your attendance is below 75%. Please consult your class teacher.
        </div>
      )}
      <div className="bg-white border rounded-lg">
        <div className="px-4 py-3 border-b font-semibold flex items-center gap-2"><Clock className="w-4 h-4" /> Today's Schedule</div>
        {data.today_periods.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No classes scheduled for today.</p>
        ) : (
          <ul className="divide-y">
            {data.today_periods.map((p: any) => (
              <li key={p.period_no} className="px-4 py-2 flex items-center gap-3 text-sm">
                <span className="bg-[color:var(--student)] text-white text-xs px-2 py-1 rounded">P{p.period_no}</span>
                <span className="font-medium">{p.subjects?.code} — {p.subjects?.name}</span>
                <span className="text-muted-foreground text-xs ml-auto">{p.staff_users?.username || "—"} {p.room ? `· ${p.room}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <QuickLink icon={<ClipboardList className="w-5 h-5" />} label="View Marks" onClick={() => setTab("marks")} />
        <QuickLink icon={<Calendar className="w-5 h-5" />} label="Academic Calendar" onClick={() => setTab("calendar")} />
        <QuickLink icon={<FileText className="w-5 h-5" />} label="Apply for Leave" onClick={() => setTab("leave")} />
      </div>
    </div>
  );
}

function QuickLink({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="bg-white border rounded-lg p-4 flex items-center gap-3 hover:shadow-sm text-left">
      <span className="w-10 h-10 rounded-full bg-[color:var(--student-light)] text-[color:var(--student)] flex items-center justify-center">{icon}</span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function AttendanceTab() {
  const fn = useServerFn(studentAttendance);
  const { data, isLoading } = useQuery({ queryKey: ["student-att"], queryFn: () => fn() });
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-lg">
        <div className="px-4 py-3 border-b font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4" /> Subject-wise Attendance</div>
        {data.by_subject.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No attendance recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr><th className="px-3 py-2">Code</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2 text-right">Present</th><th className="px-3 py-2 text-right">Total</th><th className="px-3 py-2 text-right">%</th></tr>
            </thead>
            <tbody className="divide-y">
              {data.by_subject.map((s: any) => (
                <tr key={s.code} className={s.pct < 75 ? "bg-rose-50" : ""}>
                  <td className="px-3 py-2 font-medium">{s.code}</td>
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 text-right">{s.present}</td>
                  <td className="px-3 py-2 text-right">{s.total}</td>
                  <td className="px-3 py-2 text-right font-semibold">{s.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="bg-white border rounded-lg">
        <div className="px-4 py-3 border-b font-semibold">Recent Records</div>
        <ul className="divide-y max-h-96 overflow-y-auto">
          {data.records.slice(0, 100).map((r: any, i: number) => (
            <li key={i} className="px-4 py-2 flex items-center gap-3 text-sm">
              <span className="text-xs text-muted-foreground w-24">{r.date}</span>
              <span className="text-xs">P{r.period_no}</span>
              <span className="flex-1">{r.subjects?.code} — {r.subjects?.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                r.status === "present" ? "bg-emerald-100 text-emerald-700" :
                r.status === "late" ? "bg-amber-100 text-amber-700" :
                "bg-rose-100 text-rose-700"
              }`}>{r.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MarksTab() {
  const fn = useServerFn(studentMarks);
  const { data = [], isLoading } = useQuery({ queryKey: ["student-marks"], queryFn: () => fn({ data: {} }) });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (data.length === 0) return <p className="text-sm text-muted-foreground bg-white border rounded p-6 text-center">No approved marks yet. Check back after your faculty submits and HOD approves.</p>;

  // Group by exam_type
  const groups = new Map<string, any[]>();
  (data as any[]).forEach((r) => {
    if (!groups.has(r.exam_type)) groups.set(r.exam_type, []);
    groups.get(r.exam_type)!.push(r);
  });

  return (
    <div className="space-y-5">
      {Array.from(groups.entries()).map(([exam, rows]) => {
        const total = rows.reduce((s, r) => s + Number(r.max_marks || 0), 0);
        const got = rows.reduce((s, r) => s + Number(r.obtained || 0), 0);
        const pct = total ? Math.round((got / total) * 1000) / 10 : 0;
        return (
          <div key={exam} className="bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <p className="font-semibold capitalize">{exam.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">{rows[0].academic_year}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[color:var(--student)]">{pct}%</p>
                <p className="text-xs text-muted-foreground">{got} / {total}</p>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left">
                <tr><th className="px-3 py-2">Code</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2 text-right">Obtained</th><th className="px-3 py-2 text-right">Max</th><th className="px-3 py-2 text-right">%</th></tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r, i) => {
                  const p = Number(r.max_marks) ? Math.round((Number(r.obtained) / Number(r.max_marks)) * 1000) / 10 : 0;
                  return (
                    <tr key={i} className={p < 35 ? "bg-rose-50" : ""}>
                      <td className="px-3 py-2 font-medium">{r.subjects?.code}</td>
                      <td className="px-3 py-2">{r.subjects?.name}</td>
                      <td className="px-3 py-2 text-right">{r.obtained}</td>
                      <td className="px-3 py-2 text-right">{r.max_marks}</td>
                      <td className="px-3 py-2 text-right font-semibold">{p}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

function TimetableTab() {
  const fn = useServerFn(studentTimetable);
  const { data, isLoading } = useQuery({ queryKey: ["student-tt"], queryFn: () => fn() });
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const periods = (data.periods || []).map((p: any) => p.period_no).sort((a: number, b: number) => a - b);
  const periodNos = periods.length > 0 ? periods : [1, 2, 3, 4, 5, 6, 7, 8];
  const grid: Record<number, Record<number, any>> = {};
  (data.entries as any[]).forEach((e) => {
    if (!grid[e.day_of_week]) grid[e.day_of_week] = {};
    grid[e.day_of_week][e.period_no] = e;
  });
  return (
    <div className="bg-white border rounded-lg overflow-auto">
      <table className="w-full text-xs">
        <thead className="bg-[color:var(--student)] text-white">
          <tr>
            <th className="px-2 py-2 text-left">Day</th>
            {periodNos.map((p: number) => <th key={p} className="px-2 py-2">P{p}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y">
          {[1, 2, 3, 4, 5, 6].map((d) => (
            <tr key={d}>
              <td className="px-2 py-2 font-semibold">{DAYS[d]}</td>
              {periodNos.map((p: number) => {
                const e = grid[d]?.[p];
                return (
                  <td key={p} className="px-2 py-2 border-l align-top min-w-[110px]">
                    {e ? (
                      <div>
                        <p className="font-semibold">{e.subjects?.code}</p>
                        <p className="text-[10px] text-muted-foreground">{e.staff_users?.username}{e.room ? ` · ${e.room}` : ""}</p>
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SyllabusOfficialTab() {
  const fn = useServerFn(studentSyllabus);
  const { data = [], isLoading } = useQuery({ queryKey: ["student-syllabus"], queryFn: () => fn() });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (data.length === 0) return <p className="text-sm text-muted-foreground bg-white border rounded p-6 text-center">Syllabus has not been configured for your current semester.</p>;
  return (
    <div className="space-y-4">
      {(data as any[]).map((s) => (
        <div key={s.id} className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-secondary/40">
            <p className="font-semibold"><GraduationCap className="w-4 h-4 inline mr-1" /> {s.code} — {s.name}</p>
          </div>
          {s.units.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No units configured.</p>
          ) : (
            <ul className="divide-y">
              {s.units.map((u: any) => (
                <li key={u.unit_no} className="px-4 py-3">
                  <p className="font-medium text-sm">Unit {u.unit_no}: {u.title}</p>
                  {u.topics && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{u.topics}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function CalendarTab() {
  const fn = useServerFn(studentCalendar);
  const { data = [] } = useQuery({ queryKey: ["student-cal"], queryFn: () => fn() });
  if (data.length === 0) return <p className="text-sm text-muted-foreground bg-white border rounded p-6 text-center">No upcoming events in the academic calendar.</p>;
  return (
    <ul className="space-y-2">
      {(data as any[]).map((e) => (
        <li key={e.id} className="bg-white border rounded-lg p-4 flex items-start gap-3">
          <div className="text-xs bg-[color:var(--student)] text-white rounded px-2 py-1 text-center font-bold shrink-0 min-w-[64px]">
            {new Date(e.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
          </div>
          <div>
            <p className="font-semibold">{e.title}</p>
            <p className="text-xs text-muted-foreground">{e.start_date}{e.end_date && e.end_date !== e.start_date ? ` → ${e.end_date}` : ""} · {e.event_type}</p>
            {e.description && <p className="text-sm text-muted-foreground mt-1">{e.description}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function LeaveTab() {
  const qc = useQueryClient();
  const list = useServerFn(studentMyLeaves);
  const apply = useServerFn(studentApplyLeave);
  const cancel = useServerFn(studentCancelLeave);
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({ queryKey: ["student-leaves"], queryFn: () => list() });
  const mApply = useMutation({
    mutationFn: (d: any) => apply({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["student-leaves"] }); setOpen(false); },
  });
  const mCancel = useMutation({
    mutationFn: (id: number) => cancel({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-leaves"] }),
  });
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-[color:var(--student)]">My Leave Applications</h2>
        <button onClick={() => setOpen(true)} className="bg-[color:var(--student)] text-white px-4 py-2 rounded font-semibold">Apply for Leave</button>
      </div>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr><th className="px-3 py-2">Type</th><th className="px-3 py-2">From</th><th className="px-3 py-2">To</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2">Status</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody className="divide-y">
            {(data as any[]).map((l) => (
              <tr key={l.id}>
                <td className="px-3 py-2 capitalize">{l.leave_type}</td>
                <td className="px-3 py-2">{l.from_date}</td>
                <td className="px-3 py-2">{l.to_date}</td>
                <td className="px-3 py-2 max-w-xs truncate">{l.reason}</td>
                <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded ${
                  l.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                  l.status === "rejected" ? "bg-rose-100 text-rose-700" :
                  "bg-amber-100 text-amber-700"
                }`}>{l.status}</span></td>
                <td className="px-3 py-2 text-right">
                  {l.status === "pending" && (
                    <button onClick={() => confirm("Cancel this request?") && mCancel.mutate(l.id)} className="text-xs text-rose-600 hover:underline">Cancel</button>
                  )}
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">No leave applications yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-lg p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">Apply for Leave</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              mApply.mutate({
                leave_type: fd.get("leave_type"),
                from_date: fd.get("from_date"),
                to_date: fd.get("to_date"),
                reason: fd.get("reason"),
              });
            }} className="space-y-3">
              <select name="leave_type" required className="w-full border rounded px-3 py-2 text-sm bg-white">
                {["medical", "casual", "earned", "duty"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" name="from_date" required className="border rounded px-3 py-2 text-sm" />
                <input type="date" name="to_date" required className="border rounded px-3 py-2 text-sm" />
              </div>
              <textarea name="reason" required rows={4} placeholder="Reason" className="w-full border rounded px-3 py-2 text-sm" />
              <button disabled={mApply.isPending} className="w-full bg-[color:var(--student)] text-white py-2 rounded font-semibold disabled:opacity-50">Submit</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CircularsTab() {
  const fn = useServerFn(studentCirculars);
  const { data = [] } = useQuery({ queryKey: ["student-circulars"], queryFn: () => fn() });
  if (data.length === 0) return <p className="text-sm text-muted-foreground bg-white border rounded p-6 text-center">No circulars at the moment.</p>;
  return (
    <ul className="space-y-3">
      {(data as any[]).map((c) => (
        <li key={c.id} className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-[color:var(--student)] text-white px-2 py-0.5 rounded"><Megaphone className="w-3 h-3 inline mr-1" />{new Date(c.published_at).toLocaleDateString()}</span>
            <span className="bg-secondary px-2 py-0.5 rounded uppercase">{c.audience}</span>
          </div>
          <p className="font-semibold mt-2">{c.title}</p>
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{c.body}</p>
          {c.attachment_url && <a href={c.attachment_url} target="_blank" rel="noreferrer" className="text-xs text-[color:var(--student)] underline mt-2 inline-block">Attachment</a>}
        </li>
      ))}
    </ul>
  );
}

// ===== Existing material/notice tabs (kept) =====

function MatCard({ m }: any) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <p className="font-semibold">{m.title}</p>
      <div className="flex gap-2 mt-2 text-xs">
        {m.subject && <span className="bg-secondary px-2 py-0.5 rounded">{m.subject}</span>}
        <span className="text-muted-foreground">{new Date(m.uploaded_at).toLocaleDateString()}</span>
      </div>
      <a href={m.file_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[color:var(--student)] text-white text-sm">
        <Download className="w-3 h-3" /> Download
      </a>
    </div>
  );
}

function NotesTab({ branch, semester }: any) {
  const [subject, setSubject] = useState("");
  const [sem, setSem] = useState(semester);
  const { data = [] } = useQuery({
    queryKey: ["mat", "notes", branch, sem],
    queryFn: () => listMaterials({ data: { type: "notes", department: branch, semester: sem } as any }),
  });
  const filtered = subject ? data.filter((m: any) => (m.subject ?? "").toLowerCase().includes(subject.toLowerCase())) : data;
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Search by subject" className="border rounded px-3 py-2 text-sm" />
        <select value={sem} onChange={(e) => setSem(Number(e.target.value))} className="border rounded px-3 py-2 text-sm bg-white">
          {[1, 2, 3, 4, 5, 6].map((s) => (<option key={s} value={s}>Sem {s}</option>))}
        </select>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground p-8 text-center bg-white rounded border">No study materials uploaded yet. Check back soon.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{filtered.map((m: any) => <MatCard key={m.id} m={m} />)}</div>
      )}
    </div>
  );
}

function PapersTab({ branch }: any) {
  const [sem, setSem] = useState<number | "">("");
  const [subject, setSubject] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["mat", "paper", branch, sem],
    queryFn: () => listMaterials({ data: { type: "paper", department: branch, semester: sem || undefined } as any }),
  });
  const filtered = subject ? data.filter((m: any) => (m.subject ?? "").toLowerCase().includes(subject.toLowerCase())) : data;
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={sem} onChange={(e) => setSem(e.target.value ? Number(e.target.value) : "")} className="border rounded px-3 py-2 text-sm bg-white">
          <option value="">All semesters</option>
          {[1, 2, 3, 4, 5, 6].map((s) => (<option key={s} value={s}>Sem {s}</option>))}
        </select>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="border rounded px-3 py-2 text-sm" />
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground p-8 text-center bg-white rounded border">Previous papers will be uploaded soon.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{filtered.map((m: any) => <MatCard key={m.id} m={m} />)}</div>
      )}
    </div>
  );
}

function FormsTab() {
  const { data = [] } = useQuery({
    queryKey: ["mat", "form"],
    queryFn: () => listMaterials({ data: { type: "form", department: "all" } as any }),
  });
  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground p-4 text-center bg-white rounded border">No forms uploaded.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{data.map((m: any) => <MatCard key={m.id} m={m} />)}</div>
      )}
    </div>
  );
}

const cat: Record<string, string> = {
  admission: "bg-emerald-100 text-emerald-800",
  exam: "bg-sky-100 text-sky-800",
  scholarship: "bg-amber-100 text-amber-800",
  event: "bg-purple-100 text-purple-800",
  placement: "bg-rose-100 text-rose-800",
  general: "bg-slate-100 text-slate-700",
};

function NoticesTab() {
  const { data = [] } = useQuery({ queryKey: ["notices"], queryFn: () => listNotices() });
  return (
    <ul className="space-y-3">
      {data.map((n: any) => (
        <li key={n.id} className="bg-white border rounded-lg p-4 flex items-start gap-3">
          <div className="text-xs bg-[color:var(--gold)] text-[color:var(--navy)] rounded px-2 py-1 text-center font-bold shrink-0 min-w-[56px]">
            {new Date(n.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
          </div>
          <div className="flex-1">
            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${cat[n.category] ?? cat.general}`}>{n.category}</span>
            <p className="font-semibold mt-1">{n.title}</p>
            {n.content && <p className="text-sm text-muted-foreground mt-1">{n.content}</p>}
            {n.link && <a href={n.link} target="_blank" rel="noreferrer" className="text-sm text-sky-700 underline mt-2 inline-block">View Details →</a>}
          </div>
        </li>
      ))}
    </ul>
  );
}
