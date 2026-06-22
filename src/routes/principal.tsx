import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  principalDashboard, instituteAttendance, syllabusCompliance,
  instituteResults, listCirculars, createCircular, deleteCircular,
} from "@/lib/principal.functions";
import { exportRows } from "@/lib/report-export";
import { Trash2, Plus, Download, ArrowLeft } from "lucide-react";
import { BarStats, PieStats } from "@/components/portal/Charts";

export const Route = createFileRoute("/principal")({
  head: () => ({ meta: [
    { title: "Principal Portal — GP Kinnaur" },
    { name: "description", content: "Institute-wide attendance, results, syllabus compliance, and circulars." },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: PrincipalPortal,
});

function defaultYear() {
  const d = new Date();
  const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

type Tab = "dashboard" | "attendance" | "results" | "syllabus" | "circulars";

function PrincipalPortal() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [year, setYear] = useState(defaultYear());

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-[color:var(--navy)] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link to="/staff-dashboard" className="text-xs text-white/70 flex items-center gap-1 hover:text-white">
              <ArrowLeft className="w-3 h-3" /> Staff Dashboard
            </Link>
            <h1 className="text-2xl font-bold mt-1">Principal Portal</h1>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/70">Academic Year</label>
            <input value={year} onChange={(e) => setYear(e.target.value)} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm w-24" placeholder="2025-26" />
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-6 flex gap-1 text-sm">
          {(["dashboard","attendance","results","syllabus","circulars"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 capitalize ${tab === t ? "bg-[color:var(--gold)] text-[color:var(--navy)] font-semibold" : "text-white/80 hover:text-white"}`}>
              {t}
            </button>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        {tab === "dashboard" && <Dashboard year={year} />}
        {tab === "attendance" && <AttendanceMonitor />}
        {tab === "results" && <ResultsMonitor year={year} />}
        {tab === "syllabus" && <SyllabusMonitor year={year} />}
        {tab === "circulars" && <Circulars />}
      </main>
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

function Dashboard({ year }: { year: string }) {
  const fn = useServerFn(principalDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["principal-dash", year], queryFn: () => fn({ data: { academic_year: year } }) });
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const populationData = [
    { label: "Students", value: data.students },
    { label: "Staff", value: data.staff },
  ];
  const pendingData = [
    { label: "Lessons", value: data.pending_lessons },
    { label: "Marks", value: data.pending_marks },
    { label: "Leaves", value: data.pending_leaves },
  ];
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card label="Active Students" value={data.students} />
        <Card label="Active Staff" value={data.staff} />
        <Card label="Circulars Published" value={data.circulars} />
        <Card label="Pending Lesson Plans" value={data.pending_lessons} tone={data.pending_lessons ? "ring-1 ring-amber-300" : ""} />
        <Card label="Marks Awaiting Approval" value={data.pending_marks} tone={data.pending_marks ? "ring-1 ring-amber-300" : ""} />
        <Card label="Pending Leave Requests" value={data.pending_leaves} tone={data.pending_leaves ? "ring-1 ring-amber-300" : ""} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm font-semibold text-[color:var(--navy)] mb-2">Institute Population</p>
          <PieStats data={populationData} />
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm font-semibold text-[color:var(--navy)] mb-2">Pending Approvals</p>
          <BarStats data={pendingData} color="#0ea5e9" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Use the tabs above to drill into institute-wide attendance, results, syllabus compliance, and circulars.</p>
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
        <div><label className="block text-xs text-muted-foreground">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" /></div>
        <div><label className="block text-xs text-muted-foreground">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded px-2 py-1 text-sm" /></div>
        <div className="ml-auto flex gap-2">
          {(["pdf","xlsx","csv"] as const).map((f) => (
            <button key={f} onClick={() => dl(f)} className="text-xs border rounded px-3 py-1.5 flex items-center gap-1 hover:bg-secondary">
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
            <tr><th className="px-3 py-2 text-left">Branch</th><th className="px-3 py-2 text-left">Sem</th><th className="px-3 py-2 text-right">Students</th><th className="px-3 py-2 text-right">Records</th><th className="px-3 py-2 text-right">Present</th><th className="px-3 py-2 text-right">%</th></tr>
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
            {!isFetching && data.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">No attendance data in this range.</td></tr>}
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
        { key: "branch", label: "Branch" }, { key: "semester", label: "Sem" },
        { key: "entries", label: "Entries" }, { key: "pass_pct", label: "Pass %" }, { key: "avg_pct", label: "Avg %" },
      ],
      rows: data as any[], format: fmt,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 bg-white border rounded p-3">
        <div><label className="block text-xs text-muted-foreground">Exam</label>
          <select value={examType} onChange={(e) => setExamType(e.target.value)} className="border rounded px-2 py-1 text-sm bg-white">
            {["internal_1","internal_2","mid_term","sessional","final"].map((e) => <option key={e} value={e}>{e}</option>)}
          </select></div>
        <div className="ml-auto flex gap-2">
          {(["pdf","xlsx","csv"] as const).map((f) => (
            <button key={f} onClick={() => dl(f)} className="text-xs border rounded px-3 py-1.5 flex items-center gap-1 hover:bg-secondary">
              <Download className="w-3 h-3" /> {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--navy)] text-white">
            <tr><th className="px-3 py-2 text-left">Branch</th><th className="px-3 py-2 text-left">Sem</th><th className="px-3 py-2 text-right">Entries</th><th className="px-3 py-2 text-right">Pass %</th><th className="px-3 py-2 text-right">Avg %</th></tr>
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
            {data.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-muted-foreground">No approved marks for this exam yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SyllabusMonitor({ year }: { year: string }) {
  const fn = useServerFn(syllabusCompliance);
  const { data = [] } = useQuery({
    queryKey: ["syllabus-comp", year],
    queryFn: () => fn({ data: { academic_year: year } }),
  });

  function dl(fmt: "pdf" | "xlsx" | "csv") {
    exportRows({
      filename: `syllabus-compliance-${year}`,
      title: `Syllabus Compliance ${year}`,
      columns: [
        { key: "code", label: "Code" }, { key: "name", label: "Subject" },
        { key: "branch", label: "Branch" }, { key: "semester", label: "Sem" },
        { key: "units", label: "Units" }, { key: "avg_coverage", label: "Avg %" },
        { key: "approved_pct", label: "Approved %" },
      ],
      rows: data as any[], format: fmt,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        {(["pdf","xlsx","csv"] as const).map((f) => (
          <button key={f} onClick={() => dl(f)} className="text-xs border rounded px-3 py-1.5 flex items-center gap-1 hover:bg-secondary bg-white">
            <Download className="w-3 h-3" /> {f.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="bg-white border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--navy)] text-white">
            <tr><th className="px-3 py-2 text-left">Code</th><th className="px-3 py-2 text-left">Subject</th><th className="px-3 py-2 text-left">Branch</th><th className="px-3 py-2 text-left">Sem</th><th className="px-3 py-2 text-right">Units</th><th className="px-3 py-2 text-right">Avg Coverage</th><th className="px-3 py-2 text-right">Approved</th></tr>
          </thead>
          <tbody className="divide-y">
            {(data as any[]).map((r) => (
              <tr key={r.subject_id} className={r.avg_coverage < 50 ? "bg-rose-50" : ""}>
                <td className="px-3 py-2 font-medium">{r.code}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 capitalize">{r.branch}</td>
                <td className="px-3 py-2">{r.semester}</td>
                <td className="px-3 py-2 text-right">{r.units}</td>
                <td className="px-3 py-2 text-right">{r.avg_coverage}%</td>
                <td className="px-3 py-2 text-right">{r.approved_pct}%</td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">No lesson plans recorded for this academic year.</td></tr>}
          </tbody>
        </table>
      </div>
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["circulars"] }); setOpen(false); },
  });
  const mDel = useMutation({
    mutationFn: (id: number) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["circulars"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[color:var(--navy)]">Circulars</h2>
        <button onClick={() => setOpen(true)} className="bg-[color:var(--gold)] text-[color:var(--navy)] px-4 py-2 rounded font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Circular
        </button>
      </div>
      <div className="space-y-2">
        {(data as any[]).map((c) => (
          <div key={c.id} className="bg-white border rounded p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-[color:var(--navy)] text-white px-2 py-0.5 rounded">{new Date(c.published_at).toLocaleDateString()}</span>
                <span className="bg-secondary px-2 py-0.5 rounded uppercase">{c.audience}</span>
                {c.staff_users?.username && <span className="text-muted-foreground">by {c.staff_users.username}</span>}
              </div>
              <p className="font-semibold mt-2">{c.title}</p>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{c.body}</p>
              {c.attachment_url && <a href={c.attachment_url} target="_blank" rel="noreferrer" className="text-xs text-[color:var(--navy)] underline mt-1 inline-block">Attachment</a>}
            </div>
            <button onClick={() => confirm("Delete circular?") && mDel.mutate(c.id)} className="text-destructive p-2 hover:bg-destructive/10 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground bg-white border rounded p-6 text-center">No circulars yet.</p>}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-lg p-5 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">New Circular</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              mCreate.mutate({
                title: fd.get("title"),
                body: fd.get("body"),
                audience: fd.get("audience") || "all",
                attachment_url: fd.get("attachment_url") || undefined,
              });
            }} className="space-y-3">
              <input name="title" required placeholder="Title" className="w-full border rounded px-3 py-2 text-sm" />
              <textarea name="body" required rows={5} placeholder="Body" className="w-full border rounded px-3 py-2 text-sm" />
              <select name="audience" className="w-full border rounded px-3 py-2 text-sm bg-white">
                {["all","staff","faculty","hod","students"].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <input name="attachment_url" placeholder="Attachment URL (optional)" className="w-full border rounded px-3 py-2 text-sm" />
              <button disabled={mCreate.isPending} className="w-full bg-[color:var(--navy)] text-white py-2 rounded font-semibold disabled:opacity-50">Publish</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
