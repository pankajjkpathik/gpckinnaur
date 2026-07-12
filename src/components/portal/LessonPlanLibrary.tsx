import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Download, Trash2, FileText } from "lucide-react";
import {
  pdfDocListShared,
  pdfDocDownloadShared,
  pdfDocUpload,
  pdfDocDelete,
} from "@/lib/pdf-documents.functions";

const BRANCHES = ["Civil Engineering", "Mechanical Engineering", "Applied Sciences", "Administration"] as const;
const SEMESTERS = [1, 2, 3, 4, 5, 6] as const;

type DocType = "lesson_plan" | "syllabus" | "exam_schedule" | "calendar";

async function fileToB64(f: File): Promise<string> {
  const buf = await f.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function LessonPlanLibrary({
  docType = "lesson_plan",
  canUpload = false,
  canDelete = false,
  defaultBranch,
  defaultSemester,
  lockFilters = false,
  title = "Lesson Plans",
  subtitle = "PDFs uploaded by faculty. Available to students, HODs and Principal.",
}: {
  docType?: DocType;
  canUpload?: boolean;
  canDelete?: boolean;
  defaultBranch?: string;
  defaultSemester?: number;
  /** Hide the branch/semester filter dropdowns and force the defaults. */
  lockFilters?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const qc = useQueryClient();
  const [branch, setBranch] = useState<string>(defaultBranch ?? "");
  const [semester, setSemester] = useState<number | "">(defaultSemester ?? "");

  const effBranch = lockFilters ? (defaultBranch ?? "") : branch;
  const effSem = lockFilters ? (defaultSemester ?? "") : semester;

  const list = useQuery({
    queryKey: ["lp-lib", docType, effBranch, effSem],
    queryFn: () =>
      pdfDocListShared({
        data: {
          doc_type: docType,
          branch: effBranch || null,
          semester: effSem === "" ? null : Number(effSem),
        },
      }),
  });

  const rows = (list.data ?? []) as any[];

  // Coverage summary: count of PDFs per (branch, semester) — one uniform format everywhere.
  const summary = useMemo(() => {
    const agg = new Map<string, { branch: string; semester: string; count: number }>();
    rows.forEach((r) => {
      const b = r.branch || "All";
      const s = r.semester ? `Sem ${r.semester}` : "All";
      const k = `${b}|${s}`;
      if (!agg.has(k)) agg.set(k, { branch: b, semester: s, count: 0 });
      agg.get(k)!.count += 1;
    });
    return Array.from(agg.values()).sort((a, b) => a.branch.localeCompare(b.branch));
  }, [rows]);

  async function download(id: number) {
    const r = await pdfDocDownloadShared({ data: { id } });
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${r.file_b64}`;
    link.download = r.file_name;
    link.click();
  }

  return (
    <div className="space-y-4">
      {canUpload && <UploadCard docType={docType} onDone={() => qc.invalidateQueries({ queryKey: ["lp-lib", docType] })} />}

      <div className="bg-white border rounded-lg shadow-sm p-5">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <p className="font-semibold text-gray-800">{title}</p>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
          {!lockFilters && (
            <div className="flex gap-2 text-sm">
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="border rounded px-2 py-1.5"
              >
                <option value="">All branches</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value === "" ? "" : Number(e.target.value))}
                className="border rounded px-2 py-1.5"
              >
                <option value="">All semesters</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>
                    Sem {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {summary.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            {summary.map((s) => (
              <div key={`${s.branch}-${s.semester}`} className="border rounded p-3 bg-gray-50">
                <p className="text-xs text-gray-500">
                  {s.branch} · {s.semester}
                </p>
                <p className="text-lg font-semibold text-[color:var(--navy,#7b1f4c)]">{s.count} PDF{s.count === 1 ? "" : "s"}</p>
              </div>
            ))}
          </div>
        )}

        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Branch / Sem</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Uploaded By</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">File</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Loading…
                  </td>
                </tr>
              )}
              {!list.isLoading &&
                rows.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{r.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {r.branch || "All"}
                      {r.semester ? ` · Sem ${r.semester}` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {r.staff_users?.name || r.staff_users?.username || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {r.file_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.created_at?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => download(r.id)}
                        className="text-emerald-700 hover:text-emerald-900 mr-3 inline-flex items-center gap-1 text-xs"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                      {canDelete && <DeleteButton id={r.id} docType={docType} />}
                    </td>
                  </tr>
                ))}
              {!list.isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No {docType.replace("_", " ")} PDFs uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DeleteButton({ id, docType }: { id: number; docType: DocType }) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: (i: number) => pdfDocDelete({ data: { id: i } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lp-lib", docType] }),
  });
  return (
    <button
      onClick={() => {
        if (confirm("Delete this file?")) del.mutate(id);
      }}
      className="text-rose-600 hover:text-rose-800 inline-flex items-center gap-1 text-xs"
    >
      <Trash2 className="w-3.5 h-3.5" /> Delete
    </button>
  );
}

function UploadCard({ docType, onDone }: { docType: DocType; onDone: () => void }) {
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
      onDone();
    },
    onError: (e: any) => setErr(e.message),
  });

  return (
    <div className="bg-white border rounded-lg shadow-sm p-5">
      <p className="font-semibold text-gray-800 mb-1">Upload New {docType === "lesson_plan" ? "Lesson Plan" : "PDF"}</p>
      <p className="text-xs text-gray-400 mb-4">
        PDF only (max 8 MB). Once uploaded, visible to students, HOD and Principal.
      </p>
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
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
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
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                Sem {s}
              </option>
            ))}
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
  );
}
