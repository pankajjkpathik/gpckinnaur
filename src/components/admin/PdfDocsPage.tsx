import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, Download, Trash2, FileText } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell } from "@/components/portal/PortalShell";
import { adminRoles } from "@/lib/roles";
import { pdfDocList, pdfDocUpload, pdfDocDownload, pdfDocDelete } from "@/lib/pdf-documents.functions";

const BRANCHES = ["civil", "mechanical", "applied_science"];

export function PdfDocsPage({ docType, title, subtitle }: { docType: "calendar" | "syllabus"; title: string; subtitle: string }) {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!adminRoles.includes(me.role as any)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const qc = useQueryClient();
  const listQ = useQuery({ queryKey: ["pdf-docs", docType], queryFn: () => pdfDocList({ data: { doc_type: docType } }) });
  const [form, setForm] = useState({ title: "", branch: "", semester: "" });
  const [file, setFile] = useState<{ name: string; b64: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = useMutation({
    mutationFn: (d: any) => pdfDocUpload({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pdf-docs", docType] }); setForm({ title: "", branch: "", semester: "" }); setFile(null); },
  });
  const del = useMutation({
    mutationFn: (id: number) => pdfDocDelete({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdf-docs", docType] }),
  });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") { alert("Please choose a PDF file."); return; }
    setBusy(true);
    const b64 = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(f);
    });
    setFile({ name: f.name, b64 });
    if (!form.title) setForm((s) => ({ ...s, title: f.name.replace(/\.pdf$/i, "") }));
    setBusy(false);
  }

  async function doDownload(id: number) {
    const res = await pdfDocDownload({ data: { id } });
    const bytes = atob(res.file_b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([arr], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url; a.download = res.file_name; a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  const rows = listQ.data ?? [];

  return (
    <PortalShell title={title} subtitle={subtitle} me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-600 border rounded px-3 py-1.5 hover:bg-gray-50 bg-white">
          <ArrowLeft className="w-4 h-4" /> Back to Admin Console
        </Link>

        <div className="bg-white border rounded-lg p-5">
          <h1 className="text-xl font-bold text-gray-800 mb-1">{title}</h1>
          <p className="text-xs text-gray-400 mb-4">{subtitle}</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Academic Calendar 2025-26" className="border rounded w-full px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Branch (optional)</label>
              <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} className="border rounded w-full px-3 py-2 text-sm bg-white">
                <option value="">All branches</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Semester (optional)</label>
              <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="border rounded w-full px-3 py-2 text-sm bg-white">
                <option value="">All semesters</option>
                {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">PDF File</label>
              <input type="file" accept="application/pdf" onChange={onFile} className="border rounded w-full px-2 py-1.5 text-sm" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => file && upload.mutate({ doc_type: docType, title: form.title || file.name, branch: form.branch || null, semester: form.semester ? Number(form.semester) : null, file_name: file.name, file_b64: file.b64 })}
              disabled={!file || !form.title || upload.isPending || busy}
              className="bg-[#7b1f4c] text-white px-5 py-2 rounded font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> {upload.isPending ? "Uploading…" : busy ? "Reading…" : "Upload PDF"}
            </button>
            {file && <span className="text-xs text-gray-500">{file.name}</span>}
            {upload.error && <span className="text-xs text-rose-700">{(upload.error as Error).message}</span>}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-5">
          <p className="font-semibold text-gray-800 mb-4">Uploaded {docType === "calendar" ? "Calendars" : "Syllabi"}</p>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Scope</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">File</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Uploaded</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d: any) => (
                  <tr key={d.id} className="border-t">
                    <td className="px-4 py-3 font-medium flex items-center gap-2"><FileText className="w-4 h-4 text-[#7b1f4c]" /> {d.title}</td>
                    <td className="px-4 py-3 text-xs capitalize">{d.branch ? `${d.branch}${d.semester ? ` · Sem ${d.semester}` : ""}` : "All"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{d.file_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 items-center">
                        <button onClick={() => doDownload(d.id)} className="text-[#7b1f4c] hover:underline inline-flex items-center gap-1 text-xs"><Download className="w-4 h-4" /> Download</button>
                        <button onClick={() => { if (confirm("Delete this document?")) del.mutate(d.id); }} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{listQ.isLoading ? "Loading…" : "No documents uploaded yet."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
