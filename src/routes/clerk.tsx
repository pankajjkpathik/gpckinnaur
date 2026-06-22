import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Upload, ArrowUpCircle, Download } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { clerkRoles } from "@/lib/roles";
import { clerkListStudents, clerkUpdateStudent, clerkBulkImportStudents, clerkPromoteStudents } from "@/lib/clerk.functions";
import { adminCreateStudent } from "@/lib/admin.functions";

export const Route = createFileRoute("/clerk")({
  head: () => portalMeta("Clerk Portal"),
  component: ClerkPortal,
});

type Tab = "students" | "import" | "promote";

function ClerkPortal() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!clerkRoles.includes(me.role as any)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);
  const [tab, setTab] = useState<Tab>("students");
  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell title="Clerk Portal" subtitle="Master Records" me={me as any} accent="amber">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex gap-1 border-b">
          {([["students","Students"],["import","Bulk Import"],["promote","Promote"]] as [Tab,string][]).map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm border-b-2 -mb-px ${tab === k ? "border-amber-600 text-amber-700 font-semibold" : "border-transparent text-muted-foreground"}`}>{l}</button>
          ))}
          <Link to="/admin-users" className="ml-auto text-sm text-amber-700 underline px-3 py-2">User accounts →</Link>
        </div>
        {tab === "students" && <StudentsTab />}
        {tab === "import" && <ImportTab />}
        {tab === "promote" && <PromoteTab />}
      </div>
    </PortalShell>
  );
}

function StudentsTab() {
  const qc = useQueryClient();
  const [branch, setBranch] = useState("");
  const [sem, setSem] = useState<number | "">("");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const list = useQuery({
    queryKey: ["clerk-students", branch, sem, q],
    queryFn: () => clerkListStudents({ data: { branch: branch || undefined, semester: sem || undefined, q: q || undefined } as any }),
  });
  const create = useMutation({ mutationFn: (d: any) => adminCreateStudent({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["clerk-students"] }); setAdding(false); } });
  const update = useMutation({ mutationFn: (d: any) => clerkUpdateStudent({ data: d }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["clerk-students"] }); setEditing(null); } });

  const exportCsv = () => {
    const rows = list.data ?? [];
    const header = ["enrollment_no","name","father_name","branch","semester","batch_year","email","phone","address","guardian_phone"];
    const csv = [header.join(",")].concat(rows.map((r: any) => header.map((h) => `"${String(r[h] ?? "").replace(/"/g,'""')}"`).join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `students_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / enrollment" className="border rounded px-3 py-2 text-sm flex-1 min-w-[200px]" />
        <select value={branch} onChange={(e) => setBranch(e.target.value)} className="border rounded px-2 py-2 text-sm bg-white">
          <option value="">All branches</option>
          {["civil","mechanical","applied_science"].map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={sem} onChange={(e) => setSem(e.target.value ? Number(e.target.value) : "")} className="border rounded px-2 py-2 text-sm bg-white">
          <option value="">All sems</option>
          {[1,2,3,4,5,6].map((s) => <option key={s} value={s}>Sem {s}</option>)}
        </select>
        <button onClick={exportCsv} className="border px-3 py-2 rounded text-sm inline-flex items-center gap-1"><Download className="w-4 h-4" /> CSV</button>
        <button onClick={() => setAdding(true)} className="bg-amber-600 text-white px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add Student</button>
      </div>
      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary"><tr>
            <th className="px-3 py-2 text-left">Enrollment</th><th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">Branch</th><th className="px-3 py-2 text-left">Sem</th>
            <th className="px-3 py-2 text-left">Batch</th><th className="px-3 py-2 text-left">Contact</th><th></th>
          </tr></thead>
          <tbody>
            {(list.data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2 font-mono">{r.enrollment_no}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 capitalize">{r.branch}</td>
                <td className="px-3 py-2">{r.semester}</td>
                <td className="px-3 py-2">{r.batch_year}</td>
                <td className="px-3 py-2 text-xs">{r.phone ?? "—"} · {r.email ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setEditing(r)} className="p-1.5 hover:bg-secondary rounded"><Pencil className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {(list.data ?? []).length === 0 && <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">No students match.</td></tr>}
          </tbody>
        </table>
      </div>
      {adding && <StudentFormModal title="Add Student" requirePassword onClose={() => setAdding(false)} onSave={(d: any) => create.mutate(d)} pending={create.isPending} error={create.error?.message} />}
      {editing && <StudentFormModal title={`Edit ${editing.enrollment_no}`} initial={editing} onClose={() => setEditing(null)} onSave={(d: any) => update.mutate({ id: editing.id, ...d })} pending={update.isPending} error={update.error?.message} />}
    </div>
  );
}

function StudentFormModal({ title, initial = {}, requirePassword = false, onClose, onSave, pending, error }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-xl w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-[color:var(--navy)] mb-3">{title}</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const out: any = {
            enrollment_no: String(f.get("enrollment_no") || initial.enrollment_no || ""),
            name: String(f.get("name")),
            father_name: String(f.get("father_name") || ""),
            branch: String(f.get("branch")),
            semester: Number(f.get("semester")),
            batch_year: Number(f.get("batch_year")),
            email: String(f.get("email") || ""),
            phone: String(f.get("phone") || ""),
            address: String(f.get("address") || ""),
            guardian_phone: String(f.get("guardian_phone") || ""),
            dob: String(f.get("dob") || "") || null,
            admission_date: String(f.get("admission_date") || "") || null,
          };
          if (requirePassword) out.password = String(f.get("password"));
          onSave(out);
        }} className="grid grid-cols-2 gap-2 text-sm">
          {requirePassword && <input name="enrollment_no" required placeholder="Enrollment No" defaultValue={initial.enrollment_no} className="border rounded px-3 py-2 col-span-2" />}
          <input name="name" required placeholder="Full Name" defaultValue={initial.name} className="border rounded px-3 py-2 col-span-2" />
          <input name="father_name" placeholder="Father's Name" defaultValue={initial.father_name ?? ""} className="border rounded px-3 py-2 col-span-2" />
          <select name="branch" required defaultValue={initial.branch ?? "civil"} className="border rounded px-3 py-2 bg-white">
            <option value="civil">Civil</option><option value="mechanical">Mechanical</option><option value="applied_science">Applied Science</option>
          </select>
          <input name="semester" type="number" min={1} max={8} required defaultValue={initial.semester ?? 1} className="border rounded px-3 py-2" />
          <input name="batch_year" type="number" min={2000} max={2100} required defaultValue={initial.batch_year ?? new Date().getFullYear()} className="border rounded px-3 py-2" />
          <input name="phone" placeholder="Phone" defaultValue={initial.phone ?? ""} className="border rounded px-3 py-2" />
          <input name="email" type="email" placeholder="Email" defaultValue={initial.email ?? ""} className="border rounded px-3 py-2 col-span-2" />
          <input name="address" placeholder="Address" defaultValue={initial.address ?? ""} className="border rounded px-3 py-2 col-span-2" />
          <input name="guardian_phone" placeholder="Guardian phone" defaultValue={initial.guardian_phone ?? ""} className="border rounded px-3 py-2" />
          <input name="dob" type="date" defaultValue={initial.dob ?? ""} className="border rounded px-3 py-2" />
          <input name="admission_date" type="date" defaultValue={initial.admission_date ?? ""} className="border rounded px-3 py-2 col-span-2" />
          {requirePassword && <input name="password" type="password" required minLength={6} placeholder="Temp password (≥6)" className="border rounded px-3 py-2 col-span-2" />}
          {error && <p className="col-span-2 text-xs text-destructive">{error}</p>}
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded">Cancel</button>
            <button disabled={pending} className="px-4 py-1.5 bg-amber-600 text-white rounded disabled:opacity-50">{pending ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportTab() {
  const qc = useQueryClient();
  const [csv, setCsv] = useState("");
  const [pw, setPw] = useState("");
  const [result, setResult] = useState<any>(null);
  const m = useMutation({
    mutationFn: (d: any) => clerkBulkImportStudents({ data: d }),
    onSuccess: (r) => { setResult(r); qc.invalidateQueries({ queryKey: ["clerk-students"] }); },
  });
  function parseCsv(): any[] {
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const head = lines[0].split(",").map((s) => s.trim());
    return lines.slice(1).map((l) => {
      const cells = l.split(",").map((c) => c.trim());
      const row: any = {};
      head.forEach((h, i) => (row[h] = cells[i] ?? ""));
      if (row.semester) row.semester = Number(row.semester);
      if (row.batch_year) row.batch_year = Number(row.batch_year);
      return row;
    });
  }
  const parsed = csv ? parseCsv() : [];
  return (
    <div className="space-y-3 max-w-3xl">
      <p className="text-sm text-muted-foreground">
        Paste CSV with header row. Required columns: <code className="bg-secondary px-1">enrollment_no, name, branch, semester, batch_year</code>.
        Optional: <code className="bg-secondary px-1">father_name, email, phone</code>.
      </p>
      <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={10} placeholder="enrollment_no,name,branch,semester,batch_year,email,phone&#10;CE2301,Ram Kumar,civil,1,2025,ram@x.com,9999999999" className="w-full border rounded px-3 py-2 text-sm font-mono" />
      <div className="flex gap-2 items-center">
        <input value={pw} onChange={(e) => setPw(e.target.value)} type="password" minLength={6} placeholder="Default password for all" className="border rounded px-3 py-2 text-sm flex-1" />
        <button disabled={!csv || !pw || m.isPending} onClick={() => m.mutate({ defaultPassword: pw, rows: parsed })} className="bg-amber-600 text-white px-4 py-2 rounded text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-50">
          <Upload className="w-4 h-4" /> Import {parsed.length} rows
        </button>
      </div>
      {m.error && <p className="text-xs text-destructive">{m.error.message}</p>}
      {result && (
        <div className="bg-white border rounded p-3 text-sm">
          <p><b>{result.inserted}</b> imported, <b>{result.failed.length}</b> failed.</p>
          {result.failed.length > 0 && (
            <ul className="text-xs mt-2 list-disc pl-5">
              {result.failed.slice(0, 20).map((f: any, i: number) => <li key={i}>{f.enrollment_no}: {f.reason}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function PromoteTab() {
  const [branch, setBranch] = useState("civil");
  const [from, setFrom] = useState(1);
  const m = useMutation({ mutationFn: (d: any) => clerkPromoteStudents({ data: d }) });
  return (
    <div className="max-w-md space-y-3">
      <p className="text-sm text-muted-foreground">Move every active student in (branch + semester) to the next semester. Use once per semester rollover.</p>
      <div className="bg-white border rounded p-4 space-y-3">
        <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-white">
          {["civil","mechanical","applied_science"].map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={from} onChange={(e) => setFrom(Number(e.target.value))} className="w-full border rounded px-3 py-2 text-sm bg-white">
          {[1,2,3,4,5].map((s) => <option key={s} value={s}>Sem {s} → Sem {s + 1}</option>)}
        </select>
        <button disabled={m.isPending} onClick={() => { if (confirm(`Promote ${branch} Sem ${from} → ${from + 1}?`)) m.mutate({ branch, fromSemester: from }); }} className="w-full bg-amber-600 text-white py-2 rounded text-sm font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-50">
          <ArrowUpCircle className="w-4 h-4" /> {m.isPending ? "Promoting…" : "Promote"}
        </button>
        {m.error && <p className="text-xs text-destructive">{m.error.message}</p>}
        {m.isSuccess && <p className="text-xs text-green-700">{(m.data as any).promoted} students promoted.</p>}
      </div>
    </div>
  );
}
