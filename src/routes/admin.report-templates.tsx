import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { Upload, Trash2, Download, FileSpreadsheet } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { adminRoles } from "@/lib/roles";
import { templatesList, templateUpload, templateDelete, templateDownload, templatesBulkDelete } from "@/lib/report-templates.functions";

export const Route = createFileRoute("/admin/report-templates")({
  head: () => ({ meta: [{ title: "Report Templates — Admin · GP Kinnaur" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ReportTemplatesAdmin,
});

const KINDS = [
  { value: "monthly_attendance", label: "Monthly Attendance" },
  { value: "mid_sessional", label: "Mid-Semester Sessional" },
  { value: "final_sessional", label: "Semester Final Sessional" },
  { value: "external_practical", label: "External Practical Awards" },
  { value: "other", label: "Other" },
];

function ReportTemplatesAdmin() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!adminRoles.includes(me.role as any)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const list = useQuery({ queryKey: ["report-templates"], queryFn: () => templatesList(), enabled: !!me });
  const up = useMutation({
    mutationFn: (d: any) => templateUpload({ data: d }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-templates"] }),
  });
  const del = useMutation({
    mutationFn: (d: any) => templateDelete({ data: d }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-templates"] }),
  });

  const [name, setName] = useState("");
  const [kind, setKind] = useState("monthly_attendance");
  const [file, setFile] = useState<File | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = ""; for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const file_b64 = btoa(binary);
    up.mutate({ name, kind, file_name: file.name, file_b64 }, {
      onSuccess: () => { setName(""); setFile(null); (document.getElementById("tplFile") as HTMLInputElement).value = ""; },
    });
  }

  async function preview(id: number) {
    const r = await templateDownload({ data: { id } });
    const bin = atob(r.file_b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = r.file_name; a.click(); URL.revokeObjectURL(url);
  }

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-[color:var(--navy)] text-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-[color:var(--gold)] font-semibold uppercase">Admin · Report Templates</p>
            <p className="font-bold">Upload prescribed .xlsx formats</p>
          </div>
          <Link to="/admin" className="text-sm px-3 py-1.5 border border-white/40 rounded">← Admin Hub</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-4">
        <p className="text-sm text-muted-foreground max-w-3xl">
          Upload prescribed .xlsx templates (Monthly Attendance, Mid-Sessional, Final Sessional, External Practical).
          Faculty can download a copy of any template here, with the class roster auto-injected into a "Roster" sheet so they can fill marks and print.
        </p>

        <form onSubmit={submit} className="bg-white border rounded p-4 grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
          <label className="text-xs font-semibold md:col-span-2">Template Name
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} className="w-full border rounded px-3 py-2 text-sm mt-1" placeholder="e.g. CE Sem-3 Monthly Attendance FY26" />
          </label>
          <label className="text-xs font-semibold">Kind
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full border rounded px-3 py-2 text-sm mt-1 bg-white">
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold">File (.xlsx)
            <input id="tplFile" type="file" accept=".xlsx,.xls" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm mt-1" />
          </label>
          <button disabled={up.isPending || !file || !name} className="md:col-span-4 bg-[color:var(--navy)] text-white rounded px-4 py-2 text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
            <Upload className="w-4 h-4" /> {up.isPending ? "Uploading…" : "Upload Template"}
          </button>
          {up.error && <p className="md:col-span-4 text-xs text-destructive">{up.error.message}</p>}
          {up.isSuccess && <p className="md:col-span-4 text-xs text-green-700">Uploaded.</p>}
        </form>

        <div className="bg-white border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary"><tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Kind</th>
              <th className="px-3 py-2 text-left">File</th>
              <th className="px-3 py-2 text-left">Uploaded</th>
              <th></th>
            </tr></thead>
            <tbody>
              {(list.data ?? []).map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2">{KINDS.find((k) => k.value === r.kind)?.label ?? r.kind}</td>
                  <td className="px-3 py-2 text-xs inline-flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5" /> {r.file_name}</td>
                  <td className="px-3 py-2 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button onClick={() => preview(r.id)} className="text-xs px-2 py-1 border rounded inline-flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Download</button>
                    <button onClick={() => { if (confirm(`Delete "${r.name}"?`)) del.mutate({ id: r.id }); }} className="ml-2 text-xs px-2 py-1 bg-rose-600 text-white rounded inline-flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  </td>
                </tr>
              ))}
              {(list.data ?? []).length === 0 && <tr><td colSpan={5} className="text-center py-6 text-muted-foreground">No templates uploaded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
