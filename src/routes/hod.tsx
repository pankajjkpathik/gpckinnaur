import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, BookOpen, FileSpreadsheet, FileText, BarChart3, Check, RotateCcw } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta, PortalCard, SectionTitle } from "@/components/portal/PortalShell";
import { hodRoles } from "@/lib/roles";
import {
  hodDashboard, hodPendingLessonPlans, hodPendingMarks, hodMarksDetail, hodReviewMarks, deptClassAttendance,
} from "@/lib/hod.functions";
import { reviewLessonPlan, pendingLeavesForReview, reviewLeave } from "@/lib/faculty.functions";
import { exportPDF, exportExcel, exportCSV } from "@/lib/report-export";
import { BarStats, PieStats } from "@/components/portal/Charts";

export const Route = createFileRoute("/hod")({
  head: () => portalMeta("HOD Portal"),
  component: HodPortal,
});

type Tab = "home" | "lessons" | "marks" | "leave" | "monitor";

function defaultAY() {
  const d = new Date();
  const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

function HodPortal() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!hodRoles.includes(me.role as any)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);
  const [tab, setTab] = useState<Tab>("home");
  const ay = defaultAY();
  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;
  const isViewer = me.role !== "hod"; // Principal / Admin see this as read-only HOD View
  const title = isViewer ? "HOD View (Read-only)" : "HOD Portal";
  return (
    <PortalShell title={title} subtitle={`Academic Year ${ay}`} me={me as any} accent="indigo">
      <div className="container mx-auto px-4 py-6 space-y-4">
        {isViewer && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded px-3 py-2">
            You are viewing the HOD portal as <strong className="capitalize">{me.role}</strong>. Approvals are disabled — sign in as the relevant HOD to take action.
          </div>
        )}
        <div className="flex gap-1 border-b overflow-x-auto">
          {([
            ["home", "Overview", LayoutDashboard],
            ["lessons", "Lesson Reviews", BookOpen],
            ["marks", "Marks Approvals", FileSpreadsheet],
            ["leave", "Leave Approvals", FileText],
            ["monitor", "Class Monitor", BarChart3],
          ] as [Tab, string, any][]).map(([k, l, I]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm border-b-2 -mb-px inline-flex items-center gap-2 ${tab === k ? "border-indigo-700 text-indigo-700 font-semibold" : "border-transparent text-muted-foreground"}`}>
              <I className="w-4 h-4" />{l}
            </button>
          ))}
        </div>
        <fieldset disabled={isViewer} className={isViewer ? "pointer-events-none opacity-90" : ""}>
        {tab === "home" && <OverviewTab ay={ay} />}
        {tab === "lessons" && <LessonsReviewTab ay={ay} />}
        {tab === "marks" && <MarksApprovalsTab ay={ay} />}
        {tab === "leave" && <LeaveApprovalsTab />}
        {tab === "monitor" && <ClassMonitorTab />}
        </fieldset>
      </div>
    </PortalShell>
  );
}

function OverviewTab({ ay }: { ay: string }) {
  const q = useQuery({ queryKey: ["hod-dash", ay], queryFn: () => hodDashboard({ data: { academic_year: ay } }) });
  if (q.isLoading || !q.data) return <p className="text-sm">Loading…</p>;
  const cards = [
    { label: "Lesson Plans awaiting review", value: q.data.pending_lessons, color: "bg-sky-100 text-sky-800" },
    { label: "Marks batches awaiting approval", value: q.data.pending_marks, color: "bg-amber-100 text-amber-800" },
    { label: "Leave applications pending", value: q.data.pending_leaves, color: "bg-rose-100 text-rose-800" },
  ];
  const chartData = [
    { label: "Lessons", value: q.data.pending_lessons },
    { label: "Marks", value: q.data.pending_marks },
    { label: "Leaves", value: q.data.pending_leaves },
  ];
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <PortalCard key={c.label} className="p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 inline-block px-3 py-1 rounded ${c.color}`}>{c.value}</p>
          </PortalCard>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <PortalCard className="p-4">
          <SectionTitle>Pending Workload</SectionTitle>
          <BarStats data={chartData} color="#6366f1" />
        </PortalCard>
        <PortalCard className="p-4">
          <SectionTitle>Workload Distribution</SectionTitle>
          <PieStats data={chartData.filter((d) => d.value > 0)} />
          {chartData.every((d) => d.value === 0) && <p className="text-xs text-center text-muted-foreground">No pending items — all caught up.</p>}
        </PortalCard>
      </div>
    </div>
  );
}

function LessonsReviewTab({ ay }: { ay: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["hod-lessons", ay], queryFn: () => hodPendingLessonPlans({ data: { academic_year: ay } }) });
  const review = useMutation({
    mutationFn: (v: { id: number; decision: "approved" | "returned"; hod_remarks?: string }) =>
      reviewLessonPlan({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hod-lessons"] }),
  });
  return (
    <PortalCard className="p-4 space-y-3">
      <SectionTitle>Pending Lesson Plan Reviews</SectionTitle>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary"><tr><th className="text-left px-3 py-2">Faculty</th><th className="text-left px-3 py-2">Subject</th><th className="text-left px-3 py-2">Topic</th><th className="text-left px-3 py-2">Planned</th><th className="px-3 py-2">Actions</th></tr></thead>
          <tbody>
            {(q.data ?? []).map((p: any) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-1.5">{p.staff_users?.username}</td>
                <td className="px-3 py-1.5 font-mono text-xs">{p.subjects?.code}</td>
                <td className="px-3 py-1.5">{p.topic}</td>
                <td className="px-3 py-1.5 text-xs">{p.planned_date ?? "—"}</td>
                <td className="px-3 py-1.5 text-right whitespace-nowrap">
                  <button onClick={() => review.mutate({ id: p.id, decision: "approved" })} className="text-xs bg-green-600 text-white px-2 py-1 rounded inline-flex items-center gap-1"><Check className="w-3 h-3" />Approve</button>
                  <button onClick={() => { const r = prompt("Remarks?"); if (r != null) review.mutate({ id: p.id, decision: "returned", hod_remarks: r }); }} className="text-xs bg-amber-600 text-white px-2 py-1 rounded ml-1 inline-flex items-center gap-1"><RotateCcw className="w-3 h-3" />Return</button>
                </td>
              </tr>
            ))}
            {q.data && q.data.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground text-sm">No pending lesson plans.</td></tr>}
          </tbody>
        </table>
      </div>
    </PortalCard>
  );
}

function MarksApprovalsTab({ ay }: { ay: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["hod-marks", ay], queryFn: () => hodPendingMarks({ data: { academic_year: ay } }) });
  const [open, setOpen] = useState<any | null>(null);
  const detail = useQuery({
    enabled: !!open,
    queryKey: ["hod-marks-detail", open?.subject_id, open?.exam_type, ay],
    queryFn: () => hodMarksDetail({ data: { subject_id: open.subject_id, exam_type: open.exam_type, academic_year: ay } }),
  });
  const review = useMutation({
    mutationFn: (v: { decision: "approved" | "returned"; remarks?: string }) =>
      hodReviewMarks({ data: { subject_id: open.subject_id, exam_type: open.exam_type, academic_year: ay, ...v } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hod-marks"] }); setOpen(null); },
  });
  return (
    <PortalCard className="p-4 space-y-3">
      <SectionTitle>Marks Awaiting Approval</SectionTitle>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary"><tr><th className="text-left px-3 py-2">Subject</th><th className="text-left px-3 py-2">Class</th><th className="text-left px-3 py-2">Exam</th><th className="text-left px-3 py-2">Faculty</th><th className="px-3 py-2">#</th><th></th></tr></thead>
          <tbody>
            {(q.data ?? []).map((b: any, i: number) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-1.5 font-mono text-xs">{b.subjects?.code} {b.subjects?.name}</td>
                <td className="px-3 py-1.5 text-xs">{b.subjects?.branch}-Sem{b.subjects?.semester}</td>
                <td className="px-3 py-1.5 text-xs">{b.exam_type}</td>
                <td className="px-3 py-1.5">{b.staff_users?.username}</td>
                <td className="px-3 py-1.5 text-center">{b.count}</td>
                <td className="px-3 py-1.5 text-right"><button onClick={() => setOpen(b)} className="text-xs underline text-indigo-700">Review</button></td>
              </tr>
            ))}
            {q.data && q.data.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground text-sm">No marks pending approval.</td></tr>}
          </tbody>
        </table>
      </div>
      {open && detail.data && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h3 className="font-bold">{open.subjects?.code} — {open.exam_type}</h3>
              <p className="text-xs text-muted-foreground">Submitted by {open.staff_users?.username}</p>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary sticky top-0"><tr><th className="text-left px-3 py-2">Enrollment</th><th className="text-left px-3 py-2">Name</th><th className="px-3 py-2">Marks</th><th className="text-left px-3 py-2">Remarks</th></tr></thead>
                <tbody>
                  {detail.data.map((r: any) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-1.5 font-mono text-xs">{r.students?.enrollment_no}</td>
                      <td className="px-3 py-1.5">{r.students?.name}</td>
                      <td className="px-3 py-1.5 text-center">{r.obtained ?? "—"} / {r.max_marks}</td>
                      <td className="px-3 py-1.5 text-xs">{r.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t flex gap-2 justify-end">
              <button onClick={() => { const r = prompt("Return remarks?", "Please revise."); if (r != null) review.mutate({ decision: "returned", remarks: r }); }} className="text-sm bg-amber-600 text-white px-3 py-1.5 rounded">Return for Revision</button>
              <button onClick={() => review.mutate({ decision: "approved" })} className="text-sm bg-green-600 text-white px-3 py-1.5 rounded">Approve & Lock</button>
              <button onClick={() => setOpen(null)} className="text-sm px-3 py-1.5">Close</button>
            </div>
          </div>
        </div>
      )}
    </PortalCard>
  );
}

function LeaveApprovalsTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["hod-leaves"], queryFn: () => pendingLeavesForReview() });
  const review = useMutation({
    mutationFn: (v: { id: number; decision: "approved" | "rejected"; remarks?: string }) =>
      reviewLeave({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hod-leaves"] }),
  });
  return (
    <PortalCard className="p-4 space-y-3">
      <SectionTitle>Pending Leave Applications</SectionTitle>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary"><tr><th className="text-left px-3 py-2">Staff</th><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">From</th><th className="text-left px-3 py-2">To</th><th className="text-left px-3 py-2">Reason</th><th></th></tr></thead>
          <tbody>
            {(q.data ?? []).map((l: any) => (
              <tr key={l.id} className="border-t">
                <td className="px-3 py-1.5">{l.staff?.username}<p className="text-xs text-muted-foreground">{l.staff?.department}</p></td>
                <td className="px-3 py-1.5 text-xs">{l.leave_type}</td>
                <td className="px-3 py-1.5 text-xs">{l.from_date}</td>
                <td className="px-3 py-1.5 text-xs">{l.to_date}</td>
                <td className="px-3 py-1.5 text-xs">{l.reason}</td>
                <td className="px-3 py-1.5 text-right whitespace-nowrap">
                  <button onClick={() => review.mutate({ id: l.id, decision: "approved" })} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Approve</button>
                  <button onClick={() => { const r = prompt("Rejection remarks?"); if (r != null) review.mutate({ id: l.id, decision: "rejected", remarks: r }); }} className="text-xs bg-rose-600 text-white px-2 py-1 rounded ml-1">Reject</button>
                </td>
              </tr>
            ))}
            {q.data && q.data.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground text-sm">No pending leave.</td></tr>}
          </tbody>
        </table>
      </div>
    </PortalCard>
  );
}

function ClassMonitorTab() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); }, []);
  const [branch, setBranch] = useState("");
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
    <PortalCard className="p-4 space-y-3">
      <SectionTitle>Class Attendance Monitor</SectionTitle>
      <div className="grid sm:grid-cols-5 gap-2 text-sm">
        <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Branch (e.g. CSE)" className="border rounded px-2 py-1.5" />
        <input type="number" min={1} max={8} value={sem} onChange={(e) => setSem(e.target.value ? Number(e.target.value) : "")} placeholder="Sem" className="border rounded px-2 py-1.5" />
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1.5" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1.5" />
      </div>
      {rows.length > 0 && (
        <div className="flex gap-2">
          <button onClick={() => exportPDF(fileBase, title, `${from} to ${to}`, header, rows)} className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded">PDF</button>
          <button onClick={() => exportExcel(fileBase, "Attendance", header, rows)} className="text-xs bg-green-700 text-white px-3 py-1.5 rounded">Excel</button>
          <button onClick={() => exportCSV(fileBase, header, rows)} className="text-xs bg-secondary px-3 py-1.5 rounded">CSV</button>
        </div>
      )}
      {q.data && (
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary"><tr>{header.map((h) => <th key={h} className="text-left px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const pct = q.data![i].pct;
                return (
                  <tr key={i} className={`border-t ${pct < 75 ? "bg-rose-50" : ""}`}>
                    {r.map((c, j) => <td key={j} className="px-3 py-1.5">{c}</td>)}
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground text-sm">No data.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </PortalCard>
  );
}
