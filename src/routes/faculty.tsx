import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, ClipboardCheck, BookOpen, FileSpreadsheet, FileText, FilePlus, Trash2, Download } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta, PortalCard, SectionTitle } from "@/components/portal/PortalShell";
import { facultyRoles } from "@/lib/roles";
import { listAssignments, facultyTimetable, listPeriods } from "@/lib/academic.functions";
import {
  facultyDashboard, getAttendance, submitAttendance, getMarks, saveMarks,
  listLessonPlans, upsertLessonPlan, deleteLessonPlan,
  myLeaves, applyLeave, cancelLeave,
  attendanceReport, marksReport,
} from "@/lib/faculty.functions";
import { exportPDF, exportExcel, exportCSV } from "@/lib/report-export";

export const Route = createFileRoute("/faculty")({
  head: () => portalMeta("Faculty Portal"),
  component: FacultyPortal,
});

type Tab = "home" | "attendance" | "marks" | "lessons" | "leave" | "reports";

const DAY_LABELS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function defaultAY() {
  const d = new Date();
  const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

function FacultyPortal() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!facultyRoles.includes(me.role as any)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);
  const [tab, setTab] = useState<Tab>("home");
  const [ay] = useState(defaultAY());
  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell title="Faculty Portal" subtitle={`Academic Year ${ay}`} me={me as any} accent="teal">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex gap-1 border-b overflow-x-auto">
          {([
            ["home", "Dashboard", Calendar],
            ["attendance", "Attendance", ClipboardCheck],
            ["marks", "Marks Entry", FileSpreadsheet],
            ["lessons", "Lesson Plans", BookOpen],
            ["leave", "Leave", FileText],
            ["reports", "Reports", Download],
          ] as [Tab, string, any][]).map(([k, l, Icon]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm border-b-2 -mb-px inline-flex items-center gap-2 ${tab === k ? "border-teal-700 text-teal-700 font-semibold" : "border-transparent text-muted-foreground"}`}>
              <Icon className="w-4 h-4" />{l}
            </button>
          ))}
        </div>
        {tab === "home" && <DashboardTab ay={ay} me={me as any} />}
        {tab === "attendance" && <AttendanceTab ay={ay} me={me as any} />}
        {tab === "marks" && <MarksTab ay={ay} me={me as any} />}
        {tab === "lessons" && <LessonsTab ay={ay} me={me as any} />}
        {tab === "leave" && <LeaveTab />}
        {tab === "reports" && <ReportsTab ay={ay} me={me as any} />}
      </div>
    </PortalShell>
  );
}

// ============ DASHBOARD ============
function DashboardTab({ ay }: { ay: string; me: any }) {
  const dash = useQuery({ queryKey: ["fac-dash", ay], queryFn: () => facultyDashboard({ data: { academic_year: ay } }) });
  if (dash.isLoading) return <p className="text-sm">Loading…</p>;
  const d = dash.data!;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <PortalCard className="p-4">
        <SectionTitle>Today's Schedule ({DAY_LABELS[d.day_of_week]})</SectionTitle>
        {d.today_classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No classes scheduled today.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {d.today_classes.map((c: any) => (
              <li key={c.id} className="flex items-center justify-between border-b pb-1.5">
                <span>P{c.period_no} · <strong>{c.subjects?.code}</strong> · {c.branch}-Sem{c.semester} {c.room ? `· ${c.room}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </PortalCard>
      <PortalCard className="p-4">
        <SectionTitle>My Subjects ({ay})</SectionTitle>
        {d.assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subjects assigned. Contact admin.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {d.assignments.map((a: any) => (
              <li key={a.id}>· {a.subjects?.code} {a.subjects?.name} ({a.branch}-Sem{a.semester})</li>
            ))}
          </ul>
        )}
      </PortalCard>
      <PortalCard className="p-4">
        <SectionTitle>Pending Lesson Plans</SectionTitle>
        {d.pending_lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">All caught up.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {d.pending_lessons.map((p: any) => (
              <li key={p.id}>· [{p.status}] {p.topic}</li>
            ))}
          </ul>
        )}
      </PortalCard>
      <PortalCard className="p-4">
        <SectionTitle>Recent Leave</SectionTitle>
        {d.recent_leaves.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leave history.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {d.recent_leaves.map((l: any) => (
              <li key={l.id}>· {l.leave_type} · {l.from_date} → {l.to_date} <span className="text-xs text-muted-foreground">[{l.status}]</span></li>
            ))}
          </ul>
        )}
      </PortalCard>
    </div>
  );
}

// ============ ATTENDANCE ============
function AttendanceTab({ ay, me }: { ay: string; me: any }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const asg = useQuery({ queryKey: ["fac-asg", me.id, ay], queryFn: () => listAssignments({ data: { staff_id: me.id, academic_year: ay } }) });
  const periods = useQuery({ queryKey: ["periods"], queryFn: () => listPeriods() });
  const [asgId, setAsgId] = useState<number | "">("");
  const [date, setDate] = useState(today);
  const [pno, setPno] = useState<number | "">("");
  const a = (asg.data ?? []).find((x: any) => x.id === asgId);
  const rosterQ = useQuery({
    enabled: !!a && !!pno,
    queryKey: ["att", a?.branch, a?.semester, a?.subject_id, date, pno],
    queryFn: () => getAttendance({ data: { branch: a!.branch, semester: a!.semester, subject_id: a!.subject_id, date, period_no: Number(pno) } }),
  });
  const [marks, setMarks] = useState<Record<number, string>>({});
  useEffect(() => {
    if (rosterQ.data) {
      const m: Record<number, string> = {};
      rosterQ.data.forEach((s: any) => (m[s.id] = s.status));
      setMarks(m);
    }
  }, [rosterQ.data]);
  const save = useMutation({
    mutationFn: () => submitAttendance({ data: { subject_id: a!.subject_id, date, period_no: Number(pno), entries: Object.entries(marks).map(([id, st]) => ({ student_id: Number(id), status: st as any })) } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["att"] }),
  });

  return (
    <PortalCard className="p-4 space-y-4">
      <SectionTitle>Mark Attendance</SectionTitle>
      <div className="grid sm:grid-cols-4 gap-3 text-sm">
        <select value={asgId} onChange={(e) => setAsgId(e.target.value ? Number(e.target.value) : "")} className="border rounded px-2 py-1.5">
          <option value="">Subject / Class…</option>
          {(asg.data ?? []).map((x: any) => (
            <option key={x.id} value={x.id}>{x.subjects?.code} · {x.branch}-Sem{x.semester}</option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today} className="border rounded px-2 py-1.5" />
        <select value={pno} onChange={(e) => setPno(e.target.value ? Number(e.target.value) : "")} className="border rounded px-2 py-1.5">
          <option value="">Period…</option>
          {(periods.data ?? []).filter((p: any) => !p.is_break).map((p: any) => (
            <option key={p.id} value={p.period_no}>P{p.period_no} {p.start_time}-{p.end_time}</option>
          ))}
        </select>
        {date !== today && <span className="text-xs text-amber-700 self-center">Editing past date — entries will be locked.</span>}
      </div>
      {rosterQ.isLoading && <p className="text-sm">Loading roster…</p>}
      {rosterQ.data && rosterQ.data.length === 0 && <p className="text-sm text-muted-foreground">No students in this class.</p>}
      {rosterQ.data && rosterQ.data.length > 0 && (
        <>
          <div className="flex gap-2 text-xs">
            <button onClick={() => { const m: any = {}; rosterQ.data.forEach((s: any) => (m[s.id] = "present")); setMarks(m); }} className="px-2 py-1 bg-green-100 text-green-800 rounded">All Present</button>
            <button onClick={() => { const m: any = {}; rosterQ.data.forEach((s: any) => (m[s.id] = "absent")); setMarks(m); }} className="px-2 py-1 bg-rose-100 text-rose-800 rounded">All Absent</button>
          </div>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary"><tr><th className="text-left px-3 py-2">Enrollment</th><th className="text-left px-3 py-2">Name</th><th className="px-3 py-2">Status</th></tr></thead>
              <tbody>
                {rosterQ.data.map((s: any) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-3 py-1.5 font-mono text-xs">{s.enrollment_no}</td>
                    <td className="px-3 py-1.5">{s.name}</td>
                    <td className="px-3 py-1.5 text-center">
                      <select disabled={s.locked} value={marks[s.id] ?? "present"} onChange={(e) => setMarks({ ...marks, [s.id]: e.target.value })} className="border rounded px-2 py-0.5 text-xs">
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="leave">Leave</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => save.mutate()} disabled={save.isPending} className="bg-teal-700 text-white px-4 py-2 rounded text-sm font-semibold">
            {save.isPending ? "Saving…" : "Submit Attendance"}
          </button>
          {save.isSuccess && <p className="text-xs text-green-700">Saved {save.data?.count} entries.</p>}
          {save.error && <p className="text-xs text-rose-700">{(save.error as Error).message}</p>}
        </>
      )}
    </PortalCard>
  );
}

// ============ MARKS ============
const EXAM_TYPES = ["internal", "assignment", "mid_sessional", "final_sessional", "practical", "viva"] as const;
function MarksTab({ ay, me }: { ay: string; me: any }) {
  const qc = useQueryClient();
  const asg = useQuery({ queryKey: ["fac-asg", me.id, ay], queryFn: () => listAssignments({ data: { staff_id: me.id, academic_year: ay } }) });
  const [asgId, setAsgId] = useState<number | "">("");
  const [examType, setExamType] = useState<typeof EXAM_TYPES[number]>("internal");
  const [maxMarks, setMaxMarks] = useState<number>(20);
  const a = (asg.data ?? []).find((x: any) => x.id === asgId);
  const data = useQuery({
    enabled: !!a,
    queryKey: ["marks", a?.subject_id, examType, ay],
    queryFn: () => getMarks({ data: { branch: a!.branch, semester: a!.semester, subject_id: a!.subject_id, exam_type: examType, academic_year: ay } }),
  });
  const [entries, setEntries] = useState<Record<number, { obtained: string; remarks: string }>>({});
  useEffect(() => {
    if (data.data) {
      const m: any = {};
      data.data.rows.forEach((r: any) => (m[r.id] = { obtained: r.obtained != null ? String(r.obtained) : "", remarks: r.remarks ?? "" }));
      setEntries(m);
      if (data.data.rows[0]?.max_marks) setMaxMarks(Number(data.data.rows[0].max_marks));
    }
  }, [data.data]);
  const save = useMutation({
    mutationFn: (submit: boolean) =>
      saveMarks({
        data: {
          subject_id: a!.subject_id, exam_type: examType, academic_year: ay, max_marks: maxMarks, submit_to_hod: submit,
          entries: Object.entries(entries).map(([id, v]) => ({
            student_id: Number(id), obtained: v.obtained === "" ? null : Number(v.obtained), remarks: v.remarks || null,
          })),
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marks"] }),
  });
  const locked = data.data?.submitted;

  return (
    <PortalCard className="p-4 space-y-4">
      <SectionTitle>Marks Entry</SectionTitle>
      <div className="grid sm:grid-cols-4 gap-3 text-sm">
        <select value={asgId} onChange={(e) => setAsgId(e.target.value ? Number(e.target.value) : "")} className="border rounded px-2 py-1.5">
          <option value="">Subject / Class…</option>
          {(asg.data ?? []).map((x: any) => (<option key={x.id} value={x.id}>{x.subjects?.code} · {x.branch}-Sem{x.semester}</option>))}
        </select>
        <select value={examType} onChange={(e) => setExamType(e.target.value as any)} className="border rounded px-2 py-1.5">
          {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
        </select>
        <label className="text-xs text-muted-foreground flex items-center gap-2">Max marks
          <input type="number" min={1} max={1000} value={maxMarks} onChange={(e) => setMaxMarks(Number(e.target.value))} disabled={locked} className="border rounded px-2 py-1 w-20" />
        </label>
        {locked && <span className="text-xs text-amber-700 self-center">Submitted to HOD — locked.</span>}
      </div>
      {data.data && (
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary"><tr><th className="text-left px-3 py-2">Enrollment</th><th className="text-left px-3 py-2">Name</th><th className="px-3 py-2">Marks / {maxMarks}</th><th className="text-left px-3 py-2">Remarks</th></tr></thead>
            <tbody>
              {data.data.rows.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-1.5 font-mono text-xs">{r.enrollment_no}</td>
                  <td className="px-3 py-1.5">{r.name}</td>
                  <td className="px-3 py-1.5 text-center">
                    <input type="number" step={0.5} min={0} max={maxMarks} disabled={locked || r.locked} value={entries[r.id]?.obtained ?? ""} onChange={(e) => setEntries({ ...entries, [r.id]: { obtained: e.target.value, remarks: entries[r.id]?.remarks ?? "" } })} className="border rounded px-2 py-0.5 w-20 text-right" />
                  </td>
                  <td className="px-3 py-1.5">
                    <input type="text" disabled={locked || r.locked} value={entries[r.id]?.remarks ?? ""} onChange={(e) => setEntries({ ...entries, [r.id]: { obtained: entries[r.id]?.obtained ?? "", remarks: e.target.value } })} className="border rounded px-2 py-0.5 w-full text-xs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data.data && !locked && (
        <div className="flex gap-2">
          <button onClick={() => save.mutate(false)} disabled={save.isPending} className="bg-secondary px-4 py-2 rounded text-sm">Save Draft</button>
          <button onClick={() => { if (confirm("Submit to HOD? This will lock all entries.")) save.mutate(true); }} disabled={save.isPending} className="bg-teal-700 text-white px-4 py-2 rounded text-sm font-semibold">Submit to HOD</button>
          {save.isSuccess && <p className="text-xs text-green-700 self-center">Saved.</p>}
          {save.error && <p className="text-xs text-rose-700 self-center">{(save.error as Error).message}</p>}
        </div>
      )}
    </PortalCard>
  );
}

// ============ LESSON PLANS ============
function LessonsTab({ ay, me }: { ay: string; me: any }) {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["lessons", ay, me.id], queryFn: () => listLessonPlans({ data: { academic_year: ay, staff_id: me.id } }) });
  const asg = useQuery({ queryKey: ["fac-asg", me.id, ay], queryFn: () => listAssignments({ data: { staff_id: me.id, academic_year: ay } }) });
  const [adding, setAdding] = useState(false);
  const save = useMutation({
    mutationFn: (d: any) => upsertLessonPlan({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lessons"] }); setAdding(false); },
  });
  const del = useMutation({ mutationFn: (id: number) => deleteLessonPlan({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }) });

  return (
    <PortalCard className="p-4 space-y-3">
      <SectionTitle action={<button onClick={() => setAdding(true)} className="text-sm bg-teal-700 text-white px-3 py-1.5 rounded inline-flex items-center gap-1"><FilePlus className="w-4 h-4" />New Plan</button>}>
        Lesson Plans
      </SectionTitle>
      {adding && <LessonForm ay={ay} assignments={asg.data ?? []} onCancel={() => setAdding(false)} onSave={(d) => save.mutate(d)} saving={save.isPending} />}
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary"><tr><th className="text-left px-3 py-2">Subject</th><th className="text-left px-3 py-2">Topic</th><th className="text-left px-3 py-2">Planned</th><th className="text-left px-3 py-2">Actual</th><th className="px-3 py-2">Status</th><th></th></tr></thead>
          <tbody>
            {(list.data ?? []).map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-1.5 font-mono text-xs">{p.subjects?.code}</td>
                <td className="px-3 py-1.5">{p.topic}{p.hod_remarks ? <p className="text-xs text-amber-700">HOD: {p.hod_remarks}</p> : null}</td>
                <td className="px-3 py-1.5 text-xs">{p.planned_date ?? "—"}</td>
                <td className="px-3 py-1.5 text-xs">{p.actual_date ?? "—"}</td>
                <td className="px-3 py-1.5 text-center"><span className="text-xs px-2 py-0.5 rounded bg-secondary">{p.status}</span></td>
                <td className="px-3 py-1.5 text-right">
                  {(p.status === "draft" || p.status === "returned") && (
                    <button onClick={() => { if (confirm("Delete?")) del.mutate(p.id); }} className="text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  )}
                </td>
              </tr>
            ))}
            {list.data && list.data.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground text-sm">No lesson plans yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </PortalCard>
  );
}

function LessonForm({ ay, assignments, onCancel, onSave, saving }: { ay: string; assignments: any[]; onCancel: () => void; onSave: (d: any) => void; saving: boolean }) {
  const [asgId, setAsgId] = useState<number | "">("");
  const [topic, setTopic] = useState("");
  const [planned, setPlanned] = useState("");
  const [actual, setActual] = useState("");
  const [status, setStatus] = useState<"draft" | "submitted">("draft");
  const a = assignments.find((x: any) => x.id === asgId);
  return (
    <div className="border rounded p-3 bg-secondary/30 space-y-2">
      <div className="grid sm:grid-cols-3 gap-2 text-sm">
        <select value={asgId} onChange={(e) => setAsgId(e.target.value ? Number(e.target.value) : "")} className="border rounded px-2 py-1.5">
          <option value="">Subject / Class…</option>
          {assignments.map((x: any) => (<option key={x.id} value={x.id}>{x.subjects?.code} · {x.branch}-Sem{x.semester}</option>))}
        </select>
        <input type="date" value={planned} onChange={(e) => setPlanned(e.target.value)} placeholder="Planned date" className="border rounded px-2 py-1.5" />
        <input type="date" value={actual} onChange={(e) => setActual(e.target.value)} placeholder="Actual date" className="border rounded px-2 py-1.5" />
      </div>
      <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic / lesson title" className="border rounded px-2 py-1.5 w-full text-sm" />
      <div className="flex gap-2 items-center">
        <label className="text-xs">Status:
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="border rounded px-2 py-1 ml-2">
            <option value="draft">Draft</option>
            <option value="submitted">Submit to HOD</option>
          </select>
        </label>
        <button onClick={() => a && topic && onSave({ subject_id: a.subject_id, branch: a.branch, semester: a.semester, topic, planned_date: planned || null, actual_date: actual || null, status, academic_year: ay })} disabled={!a || !topic || saving} className="ml-auto bg-teal-700 text-white px-3 py-1.5 rounded text-sm">Save</button>
        <button onClick={onCancel} className="text-sm px-3 py-1.5">Cancel</button>
      </div>
    </div>
  );
}

// ============ LEAVE ============
function LeaveTab() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["my-leaves"], queryFn: () => myLeaves() });
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ leave_type: "casual", from_date: "", to_date: "", reason: "" });
  const save = useMutation({
    mutationFn: () => applyLeave({ data: form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-leaves"] }); setAdding(false); setForm({ leave_type: "casual", from_date: "", to_date: "", reason: "" }); },
  });
  const cancel = useMutation({ mutationFn: (id: number) => cancelLeave({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["my-leaves"] }) });

  return (
    <PortalCard className="p-4 space-y-3">
      <SectionTitle action={<button onClick={() => setAdding(true)} className="text-sm bg-teal-700 text-white px-3 py-1.5 rounded">Apply for Leave</button>}>
        Leave Applications
      </SectionTitle>
      {adding && (
        <div className="border rounded p-3 bg-secondary/30 space-y-2">
          <div className="grid sm:grid-cols-4 gap-2 text-sm">
            <select value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} className="border rounded px-2 py-1.5">
              <option value="casual">Casual</option><option value="medical">Medical</option><option value="earned">Earned</option><option value="duty">On Duty</option>
            </select>
            <input type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} className="border rounded px-2 py-1.5" />
            <input type="date" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} className="border rounded px-2 py-1.5" />
            <button onClick={() => save.mutate()} disabled={!form.from_date || !form.to_date || !form.reason || save.isPending} className="bg-teal-700 text-white px-3 py-1.5 rounded text-sm">Submit</button>
          </div>
          <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason" rows={2} className="border rounded px-2 py-1.5 w-full text-sm" />
          {save.error && <p className="text-xs text-rose-700">{(save.error as Error).message}</p>}
        </div>
      )}
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary"><tr><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">From</th><th className="text-left px-3 py-2">To</th><th className="text-left px-3 py-2">Reason</th><th className="px-3 py-2">Status</th><th></th></tr></thead>
          <tbody>
            {(list.data ?? []).map((l: any) => (
              <tr key={l.id} className="border-t">
                <td className="px-3 py-1.5">{l.leave_type}</td>
                <td className="px-3 py-1.5 text-xs">{l.from_date}</td>
                <td className="px-3 py-1.5 text-xs">{l.to_date}</td>
                <td className="px-3 py-1.5 text-xs">{l.reason}{l.approver_remarks ? <p className="text-amber-700">Note: {l.approver_remarks}</p> : null}</td>
                <td className="px-3 py-1.5 text-center"><span className="text-xs px-2 py-0.5 rounded bg-secondary">{l.status}</span></td>
                <td className="px-3 py-1.5 text-right">
                  {l.status === "pending" && <button onClick={() => cancel.mutate(l.id)} className="text-xs text-rose-600 underline">Cancel</button>}
                </td>
              </tr>
            ))}
            {list.data && list.data.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground text-sm">No leave applications.</td></tr>}
          </tbody>
        </table>
      </div>
    </PortalCard>
  );
}

// ============ REPORTS ============
function ReportsTab({ ay, me }: { ay: string; me: any }) {
  const asg = useQuery({ queryKey: ["fac-asg", me.id, ay], queryFn: () => listAssignments({ data: { staff_id: me.id, academic_year: ay } }) });
  const [kind, setKind] = useState<"attendance" | "marks">("attendance");
  const [asgId, setAsgId] = useState<number | "">("");
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  }, []);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [examType, setExamType] = useState<typeof EXAM_TYPES[number]>("internal");
  const a = (asg.data ?? []).find((x: any) => x.id === asgId);
  const attQ = useQuery({
    enabled: kind === "attendance" && !!a,
    queryKey: ["att-rep", a?.id, from, to],
    queryFn: () => attendanceReport({ data: { branch: a!.branch, semester: a!.semester, subject_id: a!.subject_id, from_date: from, to_date: to } }),
  });
  const mkQ = useQuery({
    enabled: kind === "marks" && !!a,
    queryKey: ["marks-rep", a?.id, examType, ay],
    queryFn: () => marksReport({ data: { branch: a!.branch, semester: a!.semester, subject_id: a!.subject_id, exam_type: examType, academic_year: ay } }),
  });

  const title = kind === "attendance"
    ? `Attendance Report — ${a?.subjects?.code ?? ""}`
    : `Marks Report — ${a?.subjects?.code ?? ""} (${examType})`;
  const subtitle = kind === "attendance" ? `${a?.branch}-Sem${a?.semester} · ${from} to ${to}` : `${a?.branch}-Sem${a?.semester} · AY ${ay}`;
  const rows = kind === "attendance"
    ? (attQ.data ?? []).map((s: any) => [s.enrollment_no, s.name, s.present, s.total, `${s.pct}%`])
    : (mkQ.data ?? []).map((s: any) => [s.enrollment_no, s.name, s.obtained ?? "", s.max_marks ?? "", s.remarks ?? ""]);
  const header = kind === "attendance"
    ? ["Enrollment", "Name", "Present", "Total", "Percentage"]
    : ["Enrollment", "Name", "Obtained", "Max", "Remarks"];
  const fileBase = `${kind}_${a?.subjects?.code ?? "rep"}_${a?.branch ?? ""}_S${a?.semester ?? ""}`;

  return (
    <PortalCard className="p-4 space-y-3">
      <SectionTitle>Reports</SectionTitle>
      <div className="grid sm:grid-cols-5 gap-2 text-sm">
        <select value={kind} onChange={(e) => setKind(e.target.value as any)} className="border rounded px-2 py-1.5">
          <option value="attendance">Attendance</option>
          <option value="marks">Marks</option>
        </select>
        <select value={asgId} onChange={(e) => setAsgId(e.target.value ? Number(e.target.value) : "")} className="border rounded px-2 py-1.5 col-span-2">
          <option value="">Subject / Class…</option>
          {(asg.data ?? []).map((x: any) => (<option key={x.id} value={x.id}>{x.subjects?.code} · {x.branch}-Sem{x.semester}</option>))}
        </select>
        {kind === "attendance" ? (
          <>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1.5" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1.5" />
          </>
        ) : (
          <select value={examType} onChange={(e) => setExamType(e.target.value as any)} className="border rounded px-2 py-1.5 col-span-2">
            {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
        )}
      </div>
      {rows.length > 0 && (
        <div className="flex gap-2">
          <button onClick={() => exportPDF(fileBase, title, subtitle, header, rows)} className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded">Download PDF</button>
          <button onClick={() => exportExcel(fileBase, "Report", header, rows)} className="text-xs bg-green-700 text-white px-3 py-1.5 rounded">Download Excel</button>
          <button onClick={() => exportCSV(fileBase, header, rows)} className="text-xs bg-secondary px-3 py-1.5 rounded">CSV</button>
        </div>
      )}
      {rows.length > 0 && (
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary"><tr>{header.map((h) => <th key={h} className="text-left px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t">{r.map((c, j) => <td key={j} className="px-3 py-1.5 text-sm">{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {a && rows.length === 0 && !attQ.isLoading && !mkQ.isLoading && (
        <p className="text-sm text-muted-foreground">No data for the selected filters.</p>
      )}
    </PortalCard>
  );
}
