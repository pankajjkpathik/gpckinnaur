import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Save, X, Upload, FileText } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles, hasRole } from "@/lib/roles";
import {
  listSubjects,
  listSyllabus,
  upsertSyllabusUnit,
  deleteSyllabusUnit,
  syllabusUnitReconciliation,
} from "@/lib/academic.functions";
import { parseSyllabusMarkdown, rescaleHours, type ParsedUnit } from "@/lib/parse-syllabus-md";

export const Route = createFileRoute("/admin/syllabus-units")({
  head: () => portalMeta("Planned Unit Hours"),
  component: SyllabusUnitsPage,
});

type Unit = {
  id?: number;
  subject_id: number;
  academic_year: string;
  semester?: number | null;
  unit_no: number;
  title: string;
  topics: string[];
  hours: number;
};

function currentAY(): string {
  const d = new Date();
  const y = d.getFullYear();
  const start = d.getMonth() >= 6 ? y : y - 1; // July onwards = new AY
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

function SyllabusUnitsPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!hasRole(me, adminRoles)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const [branch, setBranch] = useState("");
  const [sem, setSem] = useState<number | "">("");
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [academicYear, setAcademicYear] = useState<string>(currentAY());

  const subjectsQ = useQuery({
    queryKey: ["subjects", branch, sem],
    queryFn: () => listSubjects({ data: { branch: branch || undefined, semester: sem || undefined } as any }),
    enabled: !!me,
  });

  const unitsQ = useQuery({
    queryKey: ["syllabus-units", subjectId, academicYear],
    queryFn: () => listSyllabus({ data: { subject_id: Number(subjectId), academic_year: academicYear } as any }),
    enabled: !!subjectId && !!academicYear,
  });

  const save = useMutation({
    mutationFn: (d: Unit) => upsertSyllabusUnit({ data: d as any }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["syllabus-units", subjectId] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteSyllabusUnit({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["syllabus-units", subjectId] }),
  });

  const subject = useMemo(
    () => (subjectsQ.data ?? []).find((s: any) => s.id === Number(subjectId)),
    [subjectsQ.data, subjectId],
  );
  const units: Unit[] = (unitsQ.data as any) ?? [];
  const totalPlanned = units.reduce((a, u) => a + (Number(u.hours) || 0), 0);
  const WEEKS = 14;
  const requiredTotal = subject
    ? ((subject.lecture_hours ?? 0) + (subject.practical_hours ?? 0)) * WEEKS
    : 0;
  const subjectPlanned = subject ? (subject.lecture_hours ?? 0) + (subject.practical_hours ?? 0) : 0;
  const hoursDiff = totalPlanned - requiredTotal;
  const hoursValid = subject != null && units.length > 0 && hoursDiff === 0;

  const [editing, setEditing] = useState<Unit | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell title="Planned Unit Hours" subtitle="Admin · Syllabus Coverage Setup" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6 space-y-4 max-w-5xl">
        <p className="text-sm text-muted-foreground">
          Define units and planned hours per subject. Coverage % across all portals is computed against the sum of these
          unit hours (falling back to the subject's L+P hours if no units are defined).
        </p>

        <ReconciliationPanel
          academicYear={academicYear}
          onJump={(row) => {
            setBranch(row.branch);
            setSem(row.semester);
            setSubjectId(row.id);
            setTimeout(() => {
              document.getElementById("subject-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 50);
          }}
        />




        <div className="flex flex-wrap gap-2 items-center bg-white border rounded p-3">
          <label className="text-xs text-muted-foreground inline-flex items-center gap-1">
            AY
            <input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-26"
              pattern="\d{4}-\d{2}"
              title="Format: YYYY-YY (e.g. 2025-26)"
              className="border rounded px-2 py-1.5 text-sm w-24"
            />
          </label>
          <select
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setSubjectId("");
            }}
            className="border rounded px-3 py-2 text-sm bg-white"
          >
            <option value="">All branches</option>
            {["civil", "mechanical", "applied_science"].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={sem}
            onChange={(e) => {
              setSem(e.target.value ? Number(e.target.value) : "");
              setSubjectId("");
            }}
            className="border rounded px-3 py-2 text-sm bg-white"
          >
            <option value="">All semesters</option>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <option key={s} value={s}>Sem {s}</option>
            ))}
          </select>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : "")}
            className="border rounded px-3 py-2 text-sm bg-white flex-1 min-w-[240px]"
          >
            <option value="">— Choose subject —</option>
            {(subjectsQ.data ?? []).map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name} ({s.branch} S{s.semester})
              </option>
            ))}
          </select>
        </div>

        {subject && (
          <div id="subject-editor" className="bg-white border rounded p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-[color:var(--navy)]">
                  {subject.code} · {subject.name}{" "}
                  <span className="text-xs font-normal text-muted-foreground">· AY {academicYear}</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Subject L+P hours: <b>{subjectPlanned}</b> · Sum of unit hours ({academicYear}): <b>{totalPlanned}</b>
                  {totalPlanned !== subjectPlanned && totalPlanned > 0 && (
                    <span className="text-amber-600"> · mismatch — coverage uses unit hours ({totalPlanned})</span>
                  )}
                  {totalPlanned === 0 && (
                    <span className="text-amber-600"> · no units yet for {academicYear} — coverage falls back to L+P ({subjectPlanned})</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setImportOpen(true)}
                  className="border border-rose-700 text-rose-700 px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1 hover:bg-rose-50"
                >
                  <Upload className="w-4 h-4" /> Import from .md
                </button>
                <button
                  onClick={() =>
                    setEditing({
                      subject_id: subject.id,
                      academic_year: academicYear,
                      semester: null,
                      unit_no: (units.at(-1)?.unit_no ?? 0) + 1,
                      title: "",
                      topics: [],
                      hours: 0,
                    })
                  }
                  className="bg-rose-700 text-white px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Unit
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left px-2 py-2 w-16">Unit</th>
                    <th className="text-left px-2 py-2">Title</th>
                    <th className="text-left px-2 py-2">Topics</th>
                    <th className="text-right px-2 py-2 w-24">Hours</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u) => (
                    <tr key={u.id} className="border-t align-top">
                      <td className="px-2 py-2 font-semibold">{u.unit_no}</td>
                      <td className="px-2 py-2">{u.title}</td>
                      <td className="px-2 py-2 text-xs text-muted-foreground">
                        {(u.topics ?? []).join(", ") || "—"}
                      </td>
                      <td className="px-2 py-2 text-right">{u.hours}</td>
                      <td className="px-2 py-2 flex gap-1 justify-end">
                        <button onClick={() => setEditing({ ...u, topics: u.topics ?? [] })} className="p-1.5 hover:bg-secondary rounded">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => u.id && confirm("Delete unit?") && del.mutate(u.id)}
                          className="p-1.5 hover:bg-destructive/10 text-destructive rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {units.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-muted-foreground">
                        No units defined yet.
                      </td>
                    </tr>
                  )}
                </tbody>
                {units.length > 0 && (
                  <tfoot>
                    <tr className="border-t bg-secondary/40 font-semibold">
                      <td colSpan={3} className="px-2 py-2 text-right">Total planned</td>
                      <td className="px-2 py-2 text-right">{totalPlanned}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {editing && (
          <UnitModal
            initial={editing}
            onClose={() => setEditing(null)}
            onSave={(u) => save.mutate(u, { onSuccess: () => setEditing(null) })}
            pending={save.isPending}
            error={save.error?.message}
          />
        )}

        {importOpen && subject && (
          <MdImportModal
            subject={subject}
            academicYear={academicYear}
            existingUnits={units}
            onClose={() => setImportOpen(false)}
            onImported={() => {
              setImportOpen(false);
              qc.invalidateQueries({ queryKey: ["syllabus-units", subjectId] });
            }}
          />
        )}
      </div>
    </PortalShell>
  );
}

function UnitModal({
  initial,
  onClose,
  onSave,
  pending,
  error,
}: {
  initial: Unit;
  onClose: () => void;
  onSave: (u: Unit) => void;
  pending: boolean;
  error?: string;
}) {
  const [unitNo, setUnitNo] = useState<number>(initial.unit_no);
  const [title, setTitle] = useState(initial.title);
  const [hours, setHours] = useState<number>(initial.hours);
  const [topicsText, setTopicsText] = useState((initial.topics ?? []).join("\n"));
  const [ay, setAy] = useState<string>(initial.academic_year);
  const [semOverride, setSemOverride] = useState<string>(
    initial.semester != null ? String(initial.semester) : "",
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-xl w-full p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[color:var(--navy)]">{initial.id ? "Edit" : "Add"} Unit</h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded"><X className="w-4 h-4" /></button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              id: initial.id,
              subject_id: initial.subject_id,
              academic_year: ay,
              semester: semOverride ? Number(semOverride) : null,
              unit_no: unitNo,
              title,
              hours,
              topics: topicsText.split("\n").map((t) => t.trim()).filter(Boolean),
            });
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs text-muted-foreground">
              Academic Year
              <input
                required value={ay} onChange={(e) => setAy(e.target.value)}
                placeholder="2025-26" pattern="\d{4}-\d{2}"
                className="w-full border rounded px-2 py-1.5 text-sm mt-0.5"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Semester override
              <select
                value={semOverride}
                onChange={(e) => setSemOverride(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm mt-0.5 bg-white"
              >
                <option value="">Use subject's semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Sem {s}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Unit No
              <input
                type="number" min={1} max={20} required value={unitNo}
                onChange={(e) => setUnitNo(Number(e.target.value) || 1)}
                className="w-full border rounded px-2 py-1.5 text-sm mt-0.5"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Planned Hours
              <input
                type="number" min={0} max={200} required value={hours}
                onChange={(e) => setHours(Number(e.target.value) || 0)}
                className="w-full border rounded px-2 py-1.5 text-sm mt-0.5"
              />
            </label>
          </div>
          <label className="text-xs text-muted-foreground block">
            Title
            <input
              required value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded px-2 py-1.5 text-sm mt-0.5"
            />
          </label>
          <label className="text-xs text-muted-foreground block">
            Topics (one per line)
            <textarea
              value={topicsText} onChange={(e) => setTopicsText(e.target.value)}
              rows={5} className="w-full border rounded px-2 py-1.5 text-sm mt-0.5 font-mono"
            />
          </label>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded text-sm">Cancel</button>
            <button
              disabled={pending}
              className="px-4 py-1.5 bg-rose-700 text-white rounded text-sm inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type ReconRow = {
  id: number;
  code: string;
  name: string;
  branch: string;
  semester: number;
  lp_hours: number;
  unit_count: number;
  unit_hours: number;
  diff: number;
  status: "no_units" | "mismatch" | "match";
};

function ReconciliationPanel({
  academicYear,
  onJump,
}: {
  academicYear: string;
  onJump: (row: ReconRow) => void;
}) {
  const [open, setOpen] = useState(true);
  const [branch, setBranch] = useState("");
  const [sem, setSem] = useState<number | "">("");
  const [includeMatched, setIncludeMatched] = useState(false);

  const q = useQuery({
    queryKey: ["syllabus-recon", branch, sem, includeMatched, academicYear],
    queryFn: () =>
      syllabusUnitReconciliation({
        data: {
          branch: branch || undefined,
          semester: sem || undefined,
          academic_year: academicYear,
          include_matched: includeMatched,
        } as any,
      }),
    enabled: !!academicYear,
  });

  const rows = (q.data ?? []) as ReconRow[];
  const mismatches = rows.filter((r) => r.status === "mismatch").length;
  const missing = rows.filter((r) => r.status === "no_units").length;

  return (
    <div className="bg-white border rounded">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <h3 className="font-semibold text-[color:var(--navy)]">Unit Hours Reconciliation</h3>
          <p className="text-xs text-muted-foreground">
            AY <b>{academicYear}</b> · subjects whose sum of unit hours doesn't match L+P{" "}
            {q.data && (
              <span className="ml-1">
                · <b className="text-amber-700">{mismatches}</b> mismatched ·{" "}
                <b className="text-slate-700">{missing}</b> without units
              </span>
            )}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="border-t p-3 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="border rounded px-2 py-1.5 text-sm bg-white"
            >
              <option value="">All branches</option>
              {["civil", "mechanical", "applied_science"].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              value={sem}
              onChange={(e) => setSem(e.target.value ? Number(e.target.value) : "")}
              className="border rounded px-2 py-1.5 text-sm bg-white"
            >
              <option value="">All semesters</option>
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <option key={s} value={s}>Sem {s}</option>
              ))}
            </select>
            <label className="text-xs inline-flex items-center gap-1 ml-auto">
              <input
                type="checkbox"
                checked={includeMatched}
                onChange={(e) => setIncludeMatched(e.target.checked)}
              />
              Include matched
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left px-2 py-2">Subject</th>
                  <th className="text-left px-2 py-2 w-32">Branch / Sem</th>
                  <th className="text-right px-2 py-2 w-20">L+P</th>
                  <th className="text-right px-2 py-2 w-20">Units</th>
                  <th className="text-right px-2 py-2 w-24">Unit hrs</th>
                  <th className="text-right px-2 py-2 w-20">Diff</th>
                  <th className="text-left px-2 py-2 w-28">Status</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {q.isLoading && (
                  <tr><td colSpan={8} className="text-center py-6 text-muted-foreground">Loading…</td></tr>
                )}
                {!q.isLoading && rows.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-6 text-muted-foreground">
                    All subjects match their unit hours.
                  </td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-2 py-1.5">
                      <div className="font-medium">{r.code}</div>
                      <div className="text-xs text-muted-foreground">{r.name}</div>
                    </td>
                    <td className="px-2 py-1.5 text-xs">{r.branch} · S{r.semester}</td>
                    <td className="px-2 py-1.5 text-right">{r.lp_hours}</td>
                    <td className="px-2 py-1.5 text-right">{r.unit_count}</td>
                    <td className="px-2 py-1.5 text-right">{r.unit_hours}</td>
                    <td className={`px-2 py-1.5 text-right ${r.diff !== 0 ? "text-amber-700 font-semibold" : ""}`}>
                      {r.status === "no_units" ? "—" : (r.diff > 0 ? `+${r.diff}` : r.diff)}
                    </td>
                    <td className="px-2 py-1.5">
                      {r.status === "mismatch" && (
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800">Mismatch</span>
                      )}
                      {r.status === "no_units" && (
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">No units</span>
                      )}
                      {r.status === "match" && (
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800">OK</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        onClick={() => onJump(r)}
                        className="text-xs font-semibold text-rose-700 hover:underline"
                      >
                        Jump →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MdImportModal({
  subject,
  academicYear,
  existingUnits,
  onClose,
  onImported,
}: {
  subject: any;
  academicYear: string;
  existingUnits: Unit[];
  onClose: () => void;
  onImported: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [raw, setRaw] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedUnit[]>([]);
  const [rescale, setRescale] = useState(true);
  const [overwrite, setOverwrite] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");

  const target = (subject.lecture_hours ?? 0) * 14 + (subject.practical_hours ?? 0) * 14;

  const view = useMemo(
    () => (rescale && target > 0 ? rescaleHours(parsed, target) : parsed),
    [parsed, rescale, target],
  );
  const total = view.reduce((s, u) => s + (u.hours || 0), 0);

  function handleFile(f: File) {
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result ?? "");
      setRaw(txt);
      setParsed(parseSyllabusMarkdown(txt));
    };
    reader.readAsText(f);
  }

  async function doImport() {
    if (view.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      if (overwrite) {
        setProgress("Removing existing units…");
        for (const u of existingUnits) {
          if (u.id) await deleteSyllabusUnit({ data: { id: u.id } });
        }
      }
      let i = 0;
      for (const u of view) {
        i++;
        setProgress(`Importing unit ${i} of ${view.length}…`);
        await upsertSyllabusUnit({
          data: {
            subject_id: subject.id,
            academic_year: academicYear,
            semester: null,
            unit_no: u.unit_no,
            title: u.title.slice(0, 200),
            topics: u.topics.slice(0, 200),
            hours: Math.max(0, Math.round(u.hours)),
          } as any,
        });
      }
      onImported();
    } catch (e: any) {
      setErr(e?.message ?? "Import failed");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-3xl w-full p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-[color:var(--navy)]">Import Syllabus from Markdown</h3>
            <p className="text-xs text-muted-foreground">
              {subject.code} · {subject.name} · AY {academicYear} · target hours{" "}
              <b>{target || "—"}</b>
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded"><X className="w-4 h-4" /></button>
        </div>

        <div className="border-2 border-dashed rounded p-6 text-center bg-secondary/30">
          <input
            ref={fileRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <FileText className="w-8 h-8 mx-auto text-rose-700 mb-2" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="bg-rose-700 text-white px-4 py-2 rounded text-sm font-semibold"
          >
            Choose .md file
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            {fileName || "Expected format: ## Unit 1: Title (10 hours), followed by bullet topics."}
          </p>
        </div>

        {parsed.length > 0 && (
          <>
            <div className="mt-4 flex flex-wrap gap-4 items-center text-sm">
              <label className="inline-flex items-center gap-1">
                <input type="checkbox" checked={rescale} onChange={(e) => setRescale(e.target.checked)} />
                Rescale hours to L+P×14 ({target})
              </label>
              <label className="inline-flex items-center gap-1">
                <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
                Overwrite existing {existingUnits.length} unit(s)
              </label>
              <span className="ml-auto text-xs text-muted-foreground">
                Parsed <b>{view.length}</b> units · total <b>{total}</b> hrs
              </span>
            </div>

            <div className="mt-3 border rounded overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left px-2 py-1.5 w-14">Unit</th>
                    <th className="text-left px-2 py-1.5">Title</th>
                    <th className="text-left px-2 py-1.5">Topics</th>
                    <th className="text-right px-2 py-1.5 w-16">Hrs</th>
                  </tr>
                </thead>
                <tbody>
                  {view.map((u, i) => (
                    <tr key={i} className="border-t align-top">
                      <td className="px-2 py-1.5 font-semibold">{u.unit_no}</td>
                      <td className="px-2 py-1.5">
                        <input
                          value={u.title}
                          onChange={(e) => {
                            const next = [...parsed];
                            next[i] = { ...next[i], title: e.target.value };
                            setParsed(next);
                          }}
                          className="w-full border rounded px-1.5 py-1 text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-xs text-muted-foreground">
                        <textarea
                          rows={2}
                          value={u.topics.join("\n")}
                          onChange={(e) => {
                            const next = [...parsed];
                            next[i] = {
                              ...next[i],
                              topics: e.target.value.split("\n").map((t) => t.trim()).filter(Boolean),
                            };
                            setParsed(next);
                          }}
                          className="w-full border rounded px-1.5 py-1 text-xs font-mono"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <input
                          type="number"
                          value={u.hours}
                          onChange={(e) => {
                            const next = [...parsed];
                            next[i] = { ...next[i], hours: Number(e.target.value) || 0 };
                            setParsed(next);
                          }}
                          disabled={rescale}
                          className="w-14 border rounded px-1 py-0.5 text-sm text-right disabled:bg-secondary/40"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {parsed.length === 0 && raw && (
          <p className="text-xs text-amber-700 mt-3">
            No units detected. Make sure headings start with "Unit 1", "## Unit II", etc.
          </p>
        )}

        {err && <p className="text-xs text-destructive mt-3">{err}</p>}
        {progress && <p className="text-xs text-muted-foreground mt-2">{progress}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 border rounded text-sm">Cancel</button>
          <button
            disabled={busy || view.length === 0}
            onClick={doImport}
            className="px-4 py-1.5 bg-rose-700 text-white rounded text-sm inline-flex items-center gap-1 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {busy ? "Importing…" : `Import ${view.length} unit(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}


