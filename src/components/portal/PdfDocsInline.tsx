import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Download, Trash2, FileText } from "lucide-react";
import { pdfDocList, pdfDocUpload, pdfDocDownload, pdfDocDelete } from "@/lib/pdf-documents.functions";
const branches = ["Civil Engineering", "Mechanical Engineering", "Applied Sciences", "Administration"] as const;
const semesters = [1, 2, 3, 4, 5, 6] as const;

type DocType = "calendar" | "syllabus" | "lesson_plan" | "exam_schedule";

async function fileToB64(f: File): Promise<string> {
  const buf = await f.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function PdfDocsInline({ docType, uploadLabel }: { docType: DocType; uploadLabel: string }) {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["pdf-docs", docType], queryFn: () => pdfDocList({ data: { doc_type: docType } }) });
  const [title, setTitle] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Select a PDF file");
      if (!title.trim()) throw new Error("Enter a title");
      if (file.size > 8 * 1024 * 1024) throw new Error("File too large (max 8 MB)");
      const b64 = await fileToB64(file);
      return pdfDocUpload({
        data: {
          doc_type: docType,
          title: title.trim(),
          branch: branch || null,
          semester: semester === "" ? null : Number(semester),
          file_name: file.name,
          file_b64: b64,
        },
      });
    },
    onSuccess: () => {
      setTitle("");
      setFile(null);
      setBranch("");
      setSemester("");
      setErr(null);
      qc.invalidateQueries({ queryKey: ["pdf-docs", docType] });
    },
    onError: (e: any) => setErr(e.message),
  });

  const del = useMutation({
    mutationFn: (id: number) => pdfDocDelete({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdf-docs", docType] }),
  });

  async function download(id: number) {
    const r = await pdfDocDownload({ data: { id } });
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${r.file_b64}`;
    link.download = r.file_name;
    link.click();
  }

  return (
    <>
      <div className="bg-white border rounded-lg shadow-sm p-5">
        <p className="font-semibold text-gray-800 mb-1">{uploadLabel}</p>
        <p className="text-xs text-gray-400 mb-4">PDF only (max 8 MB). File is stored securely and downloadable by staff and students.</p>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Applied Physics — Unit 1 Lesson Plan"
              className="border rounded w-full px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Branch (optional)</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="border rounded w-full px-3 py-2">
              <option value="">All</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Semester (optional)</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value === "" ? "" : Number(e.target.value))}
              className="border rounded w-full px-3 py-2"
            >
              <option value="">All</option>
              {semesters.map((s) => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">PDF File</label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="border rounded w-full px-3 py-2 text-sm"
            />
          </div>
        </div>
        {err && <p className="text-xs text-rose-700 mt-2">{err}</p>}
        <button
          disabled={upload.isPending}
          onClick={() => upload.mutate()}
          className="mt-4 bg-[#7b1f4c] text-white px-5 py-2 rounded font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Upload className="w-4 h-4" /> {upload.isPending ? "Uploading…" : "Upload"}
        </button>
        {upload.isSuccess && <p className="text-xs text-emerald-700 mt-2">Uploaded successfully.</p>}
      </div>

      <div className="bg-white border rounded-lg shadow-sm p-5">
        <p className="font-semibold text-gray-800 mb-4">Uploaded Files</p>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Branch / Sem</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">File</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Uploaded</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(list.data ?? []).map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{r.branch || "All"}{r.semester ? ` · Sem ${r.semester}` : ""}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{r.file_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => download(r.id)} className="text-emerald-700 hover:text-emerald-900 mr-3 inline-flex items-center gap-1 text-xs">
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                    <button
                      onClick={() => { if (confirm("Delete this file?")) del.mutate(r.id); }}
                      className="text-rose-600 hover:text-rose-800 inline-flex items-center gap-1 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {(list.data ?? []).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No files uploaded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
