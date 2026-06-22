import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { studentMe, studentLogout } from "@/lib/auth.functions";
import { listMaterials } from "@/lib/materials.functions";
import { listNotices } from "@/lib/notices.functions";

export const Route = createFileRoute("/student-dashboard")({
  head: () => ({ meta: [{ title: "Student Dashboard — GP Kinnaur" }] }),
  component: StudentDashboard,
});

type Tab = "notes" | "syllabus" | "paper" | "form" | "notices";

function StudentDashboard() {
  const navigate = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["student-me"], queryFn: () => studentMe() });
  const [tab, setTab] = useState<Tab>("notes");

  useEffect(() => {
    if (!isLoading && !me) navigate({ to: "/student-login" });
  }, [me, isLoading, navigate]);

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  async function logout() {
    await studentLogout({});
    window.location.href = "/";
  }

  const initials = me.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();

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
        <div className="flex flex-wrap gap-1 border-b">
          {([
            ["notes", "📚 Study Material"],
            ["syllabus", "📋 Syllabus"],
            ["paper", "📝 Previous Papers"],
            ["form", "📄 Important Forms"],
            ["notices", "📢 Notices"],
          ] as [Tab, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === k ? "border-[color:var(--student)] text-[color:var(--student)]" : "border-transparent text-muted-foreground"}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {tab === "notes" && <NotesTab branch={me.branch} semester={me.semester} />}
        {tab === "syllabus" && <SyllabusTab branch={me.branch} />}
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
          {[1,2,3,4,5,6].map((s) => (<option key={s} value={s}>Sem {s}</option>))}
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

function SyllabusTab({ branch }: any) {
  const { data = [] } = useQuery({
    queryKey: ["mat", "syllabus", branch],
    queryFn: () => listMaterials({ data: { type: "syllabus", department: branch } as any }),
  });
  if (data.length === 0) return <p className="text-sm text-muted-foreground p-8 text-center bg-white rounded border">Syllabus will be uploaded soon.</p>;
  const groups = [1,2,3,4,5,6].map((s) => ({ s, items: data.filter((m: any) => m.semester === s) }));
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.s}>
          <h4 className="font-semibold text-[color:var(--student)] mb-2">Semester {g.s}</h4>
          {g.items.length === 0 ? <p className="text-xs text-muted-foreground">—</p> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{g.items.map((m: any) => <MatCard key={m.id} m={m} />)}</div>
          )}
        </div>
      ))}
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
          {[1,2,3,4,5,6].map((s) => (<option key={s} value={s}>Sem {s}</option>))}
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
  const fixed = ["Leave Application Form", "Bonafide Certificate Request", "Fee Receipt Request", "Character Certificate Request"];
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fixed.map((f) => (
          <div key={f} className="bg-white border rounded-lg p-4">
            <p className="font-semibold">{f}</p>
            <p className="text-xs text-muted-foreground">Standard form</p>
          </div>
        ))}
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground p-4 text-center bg-white rounded border">No additional forms uploaded.</p>
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
