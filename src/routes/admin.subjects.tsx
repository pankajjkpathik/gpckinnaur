import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Upload, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles } from "@/lib/roles";
import { listSubjects, upsertSubject, deleteSubject, bulkImportSubjects } from "@/lib/academic.functions";


export const Route = createFileRoute("/admin/subjects")({
  head: () => portalMeta("Subjects"),
  component: SubjectsPage,
});

type Subject = {
  id: number; code: string; name: string; branch: string; semester: number; kind: "theory" | "practical"; credits: number;
};

function SubjectsPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!adminRoles.includes(me.role as any)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const [branch, setBranch] = useState("");
  const [sem, setSem] = useState<number | "">("");
  const [editing, setEditing] = useState<Partial<Subject> | null>(null);

  const subjectsQ = useQuery({
    queryKey: ["subjects", branch, sem],
    queryFn: () => listSubjects({ data: { branch: branch || undefined, semester: sem || undefined } as any }),
    enabled: !!me,
  });

  const save = useMutation({
    mutationFn: (d: any) => upsertSubject({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); setEditing(null); },
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteSubject({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell title="Subjects" subtitle="Admin · Master Data" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="border rounded px-3 py-2 text-sm bg-white">
            <option value="">All branches</option>
            {["civil", "mechanical", "applied_science"].map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={sem} onChange={(e) => setSem(e.target.value ? Number(e.target.value) : "")} className="border rounded px-3 py-2 text-sm bg-white">
            <option value="">All semesters</option>
            {[1,2,3,4,5,6].map((s) => <option key={s} value={s}>Sem {s}</option>)}
          </select>
          <div className="ml-auto"><BulkBar onImported={() => qc.invalidateQueries({ queryKey: ["subjects"] })} /></div>
          <button onClick={() => setEditing({ kind: "theory", credits: 4 })} className="bg-rose-700 text-white px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>


        <div className="bg-white border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-3 py-2">Code</th>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Branch</th>
                <th className="text-left px-3 py-2">Sem</th>
                <th className="text-left px-3 py-2">Kind</th>
                <th className="text-left px-3 py-2">Credits</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(subjectsQ.data ?? []).map((s: any) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{s.code}</td>
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2 capitalize">{s.branch}</td>
                  <td className="px-3 py-2">{s.semester}</td>
                  <td className="px-3 py-2 capitalize">{s.kind}</td>
                  <td className="px-3 py-2">{s.credits}</td>
                  <td className="px-3 py-2 flex gap-1 justify-end">
                    <button onClick={() => setEditing(s)} className="p-1.5 hover:bg-secondary rounded"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => confirm("Delete subject?") && del.mutate(s.id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {(subjectsQ.data ?? []).length === 0 && (
                <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">No subjects yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {editing && (
          <SubjectModal
            initial={editing}
            onClose={() => setEditing(null)}
            onSave={(d: any) => save.mutate(d)}
            pending={save.isPending}
            error={save.error?.message}
          />
        )}
      </div>
    </PortalShell>
  );
}

function SubjectModal({ initial, onClose, onSave, pending, error }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-[color:var(--navy)] mb-3">{initial.id ? "Edit" : "Add"} Subject</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          onSave({
            id: initial.id,
            code: String(f.get("code")),
            name: String(f.get("name")),
            branch: String(f.get("branch")),
            semester: Number(f.get("semester")),
            kind: String(f.get("kind")),
            credits: Number(f.get("credits")),
          });
        }} className="space-y-2">
          <input name="code" defaultValue={initial.code} required placeholder="Code (e.g. CS301)" className="w-full border rounded px-3 py-2 text-sm" />
          <input name="name" defaultValue={initial.name} required placeholder="Subject Name" className="w-full border rounded px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select name="branch" defaultValue={initial.branch ?? "civil"} required className="border rounded px-3 py-2 text-sm bg-white">
              <option value="civil">Civil</option><option value="mechanical">Mechanical</option><option value="applied_science">Applied Science</option>
            </select>
            <input name="semester" type="number" min={1} max={8} defaultValue={initial.semester ?? 1} required className="border rounded px-3 py-2 text-sm" placeholder="Semester" />
            <select name="kind" defaultValue={initial.kind ?? "theory"} className="border rounded px-3 py-2 text-sm bg-white">
              <option value="theory">Theory</option><option value="practical">Practical</option>
            </select>
            <input name="credits" type="number" min={0} max={20} defaultValue={initial.credits ?? 4} required className="border rounded px-3 py-2 text-sm" placeholder="Credits" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded text-sm">Cancel</button>
            <button disabled={pending} className="px-4 py-1.5 bg-rose-700 text-white rounded text-sm disabled:opacity-50">{pending ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const SUBJECT_SAMPLE = [
  { code: "CE301", name: "Surveying", branch: "civil", semester: 3, kind: "theory", credits: 4 },
  { code: "CE301P", name: "Surveying Lab", branch: "civil", semester: 3, kind: "practical", credits: 2 },
];

function BulkBar({ onImported }: { onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ inserted: number; errors: { row: number; error: string }[] } | null>(null);
  const imp = useMutation({
    mutationFn: (rows: any[]) => bulkImportSubjects({ data: { rows } }),
    onSuccess: (r) => { setResult(r); onImported(); },
  });

  const downloadSample = () => {
    const ws = XLSX.utils.json_to_sheet(SUBJECT_SAMPLE);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subjects");
    XLSX.writeFile(wb, "subjects-sample.xlsx");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setResult(null);
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
    if (rows.length === 0) { alert("Empty sheet"); return; }
    imp.mutate(rows);
    e.target.value = "";
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button type="button" onClick={downloadSample} className="px-3 py-2 border rounded text-sm inline-flex items-center gap-1">
        <Download className="w-4 h-4" /> Sample.xlsx
      </button>
      <button type="button" onClick={() => fileRef.current?.click()} disabled={imp.isPending} className="px-3 py-2 bg-emerald-700 text-white rounded text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-50">
        <Upload className="w-4 h-4" /> {imp.isPending ? "Importing…" : "Bulk Upload"}
      </button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFile} />
      {imp.error && <span className="text-xs text-destructive">{(imp.error as any).message}</span>}
      {result && (
        <span className="text-xs text-muted-foreground">
          ✓ {result.inserted} imported{result.errors.length ? ` · ${result.errors.length} errors (row ${result.errors.slice(0,3).map(e=>e.row).join(", ")}${result.errors.length>3?"…":""})` : ""}
        </span>
      )}
    </div>
  );
}

