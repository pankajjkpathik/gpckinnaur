import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Save, X, Upload, FileText, Download } from "lucide-react";
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
import { parseSyllabusMarkdown, parsePracticalList, rescaleField, type ParsedUnit } from "@/lib/parse-syllabus-md";

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
  lecture_hours: number;
  practical_hours: number;
};


function currentAY(): string {
  const d = new Date();
  const y = d.getFullYear();
  const start = d.getMonth() >= 6 ? y : y - 1; // July onwards = new AY
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

function downloadBlob(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportUnits(
  subject: any,
  academicYear: string,
  units: Unit[],
  format: "json" | "csv",
) {
  const safe = (s: string) => s.replace(/[^a-z0-9\-]+/gi, "_");
  const base = `syllabus-units_${safe(subject.code)}_${academicYear}`;
  if (format === "json") {
    const payload = {
      schema: "syllabus-units.v2",
      exported_at: new Date().toISOString(),
      subject: {
        code: subject.code,
        name: subject.name,
        branch: subject.branch,
        semester: subject.semester,
        lecture_hours: subject.lecture_hours ?? 0,
        practical_hours: subject.practical_hours ?? 0,
      },
      academic_year: academicYear,
      units: units.map((u) => ({
        unit_no: u.unit_no,
        title: u.title,
        lecture_hours: u.lecture_hours,
        practical_hours: u.practical_hours,
        hours: u.hours,
        topics: u.topics ?? [],
      })),
    };
    downloadBlob(`${base}.json`, "application/json", JSON.stringify(payload, null, 2));
    return;
  }
  const rows = [
    ["Unit No", "Title", "Theory Hours", "Practical Hours", "Total Hours", "Topics"],
    ...units.map((u) => [
      u.unit_no,
      u.title,
      u.lecture_hours,
      u.practical_hours,
      u.hours,
      (u.topics ?? []).join(" | "),
    ]),
  ];
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  downloadBlob(`${base}.csv`, "text/csv;charset=utf-8", csv);
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
  const units: Unit[] = ((unitsQ.data as any) ?? []).map((u: any) => ({
    ...u,
    lecture_hours: Number(u.lecture_hours) || 0,
    practical_hours: Number(u.practical_hours) || 0,
    hours: Number(u.hours) || 0,
  }));
  const totalPlannedLecture = units.reduce((a, u) => a + (Number(u.lecture_hours) || 0), 0);
  const totalPlannedPractical = units.reduce((a, u) => a + (Number(u.practical_hours) || 0), 0);
  const totalPlanned = totalPlannedLecture + totalPlannedPractical;
  const WEEKS = 14;
  const subjectL = subject?.lecture_hours ?? 0;
  const subjectP = subject?.practical_hours ?? 0;
  const referenceLecture = subjectL * WEEKS;
  const referencePractical = subjectP * WEEKS;
  const isLabSubject =
    subject != null &&
    ((subjectP > 0 && subjectL === 0) ||
      /\b(lab|laboratory|practical|workshop)\b/i.test(
        `${subject?.name ?? ""} ${subject?.code ?? ""}`,
      ));


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
                  {isLabSubject ? (
                    <>Lab subject · P {subjectP}/week × {WEEKS} = <b>{referencePractical}</b> practical periods per semester (reference). Coverage is measured by practicals completed ÷ total practicals.</>
                  ) : (
                    <>L {subjectL}/week × {WEEKS} = <b>{referenceLecture}</b> theory periods · P {subjectP}/week × {WEEKS} = <b>{referencePractical}</b> practical periods (reference only). Unit hours are taken as-is from the syllabus.</>
                  )}
                </p>


              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setImportOpen(true)}
                  className="border border-rose-700 text-rose-700 px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1 hover:bg-rose-50"
                >
                  <Upload className="w-4 h-4" /> Import
                </button>
                <button
                  disabled={units.length === 0}
                  onClick={() => exportUnits(subject, academicYear, units, "json")}
                  className="border px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1 hover:bg-secondary disabled:opacity-50"
                  title="Download as JSON — re-importable to reuse next year"
                >
                  <Download className="w-4 h-4" /> Export JSON
                </button>
                <button
                  disabled={units.length === 0}
                  onClick={() => exportUnits(subject, academicYear, units, "csv")}
                  className="border px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1 hover:bg-secondary disabled:opacity-50"
                  title="Download as CSV"
                >
                  <Download className="w-4 h-4" /> Export CSV
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
                      lecture_hours: 0,
                      practical_hours: 0,
                    })
                  }

                  className="bg-rose-700 text-white px-3 py-2 rounded text-sm font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Unit
                </button>
              </div>
            </div>

            {units.length === 0 && (
              <div className="rounded border border-amber-200 bg-amber-50 text-amber-800 text-xs px-3 py-2">
                No {isLabSubject ? "practicals" : "units"} defined for {academicYear}. Use <b>Import</b> to load them from the syllabus .md file, or <b>Add Unit</b> manually.
              </div>
            )}


            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left px-2 py-2 w-16">{isLabSubject ? "#" : "Unit"}</th>
                    <th className="text-left px-2 py-2">{isLabSubject ? "Practical" : "Title"}</th>
                    <th className="text-left px-2 py-2">{isLabSubject ? "Notes" : "Topics"}</th>
                    {!isLabSubject && <th className="text-right px-2 py-2 w-20">Theory</th>}
                    {!isLabSubject && <th className="text-right px-2 py-2 w-20">Practical</th>}
                    {!isLabSubject && <th className="text-right px-2 py-2 w-16">Hours</th>}
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
                      {!isLabSubject && <td className="px-2 py-2 text-right">{u.lecture_hours}</td>}
                      {!isLabSubject && <td className="px-2 py-2 text-right">{u.practical_hours}</td>}
                      {!isLabSubject && <td className="px-2 py-2 text-right font-semibold">{u.hours}</td>}
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
                      <td colSpan={isLabSubject ? 4 : 7} className="text-center py-6 text-muted-foreground">
                        No {isLabSubject ? "practicals" : "units"} defined yet.
                      </td>
                    </tr>
                  )}
                </tbody>
                {units.length > 0 && !isLabSubject && (
                  <tfoot>
                    <tr className="border-t bg-secondary/40 font-semibold">
                      <td colSpan={3} className="px-2 py-2 text-right">Total</td>
                      <td className="px-2 py-2 text-right">{totalPlannedLecture}</td>
                      <td className="px-2 py-2 text-right">{totalPlannedPractical}</td>
                      <td className="px-2 py-2 text-right">{totalPlanned}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
                {units.length > 0 && isLabSubject && (
                  <tfoot>
                    <tr className="border-t bg-secondary/40 font-semibold">
                      <td colSpan={3} className="px-2 py-2 text-right">Total practicals: {units.length}</td>
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
            requiredLecture={requiredLecture}
            requiredPractical={requiredPractical}
            otherUnitsLecture={
              totalPlannedLecture -
              (editing.id
                ? (units.find((u) => u.id === editing.id)?.lecture_hours ?? 0)
                : 0)
            }
            otherUnitsPractical={
              totalPlannedPractical -
              (editing.id
                ? (units.find((u) => u.id === editing.id)?.practical_hours ?? 0)
                : 0)
            }
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
  requiredLecture,
  requiredPractical,
  otherUnitsLecture,
  otherUnitsPractical,
  onClose,
  onSave,
  pending,
  error,
}: {
  initial: Unit;
  requiredLecture: number;
  requiredPractical: number;
  otherUnitsLecture: number;
  otherUnitsPractical: number;
  onClose: () => void;
  onSave: (u: Unit) => void;
  pending: boolean;
  error?: string;
}) {
  const [unitNo, setUnitNo] = useState<number>(initial.unit_no);
  const [title, setTitle] = useState(initial.title);
  const [lectureHours, setLectureHours] = useState<number>(initial.lecture_hours ?? 0);
  const [practicalHours, setPracticalHours] = useState<number>(initial.practical_hours ?? 0);
  const [topicsText, setTopicsText] = useState((initial.topics ?? []).join("\n"));
  const [ay, setAy] = useState<string>(initial.academic_year);
  const [semOverride, setSemOverride] = useState<string>(
    initial.semester != null ? String(initial.semester) : "",
  );

  const lectureDisabled = requiredLecture === 0;
  const practicalDisabled = requiredPractical === 0;

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
            const lh = lectureDisabled ? 0 : lectureHours;
            const ph = practicalDisabled ? 0 : practicalHours;
            onSave({
              id: initial.id,
              subject_id: initial.subject_id,
              academic_year: ay,
              semester: semOverride ? Number(semOverride) : null,
              unit_no: unitNo,
              title,
              lecture_hours: lh,
              practical_hours: ph,
              hours: lh + ph,
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
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">
              Theory hours {requiredLecture > 0 && <span className="text-[10px]">(target {requiredLecture})</span>}
              <input
                type="number" min={0} max={200}
                disabled={lectureDisabled}
                value={lectureHours}
                onChange={(e) => setLectureHours(Number(e.target.value) || 0)}
                className="w-full border rounded px-2 py-1.5 text-sm mt-0.5 disabled:bg-secondary/50"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Practical hours {requiredPractical > 0 && <span className="text-[10px]">(target {requiredPractical})</span>}
              <input
                type="number" min={0} max={200}
                disabled={practicalDisabled}
                value={practicalHours}
                onChange={(e) => setPracticalHours(Number(e.target.value) || 0)}
                className="w-full border rounded px-2 py-1.5 text-sm mt-0.5 disabled:bg-secondary/50"
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

          {(requiredLecture > 0 || requiredPractical > 0) && (() => {
            const rows: { label: string; req: number; other: number; val: number }[] = [];
            if (requiredLecture > 0)
              rows.push({ label: "Theory", req: requiredLecture, other: otherUnitsLecture, val: lectureHours });
            if (requiredPractical > 0)
              rows.push({ label: "Practical", req: requiredPractical, other: otherUnitsPractical, val: practicalHours });
            const allOk = rows.every((r) => r.other + (Number(r.val) || 0) === r.req);
            return (
              <div
                className={`text-xs rounded border px-3 py-2 space-y-0.5 ${
                  allOk
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {rows.map((r) => {
                  const projected = r.other + (Number(r.val) || 0);
                  const remaining = r.req - r.other;
                  const overshoot = projected - r.req;
                  return (
                    <div key={r.label}>
                      <b>{r.label}</b>: required {r.req} · others {r.other} · this {Number(r.val) || 0} · total{" "}
                      <b>{projected}</b>
                      {overshoot === 0
                        ? " ✓"
                        : overshoot > 0
                          ? ` — ${overshoot} over (set this to ${Math.max(0, r.req - r.other)})`
                          : ` — needs ${Math.abs(overshoot)} more (set this to ${r.req - r.other})`}
                    </div>
                  );
                })}
              </div>
            );
          })()}


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
  required_lecture_hours: number;
  required_practical_hours: number;
  unit_count: number;
  unit_hours: number;
  unit_lecture_hours: number;
  unit_practical_hours: number;
  lecture_diff: number;
  practical_diff: number;
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
                  <th className="text-left px-2 py-2 w-28">Branch / Sem</th>
                  <th className="text-right px-2 py-2 w-24">Theory (unit / req)</th>
                  <th className="text-right px-2 py-2 w-20">ΔT</th>
                  <th className="text-right px-2 py-2 w-24">Practical (unit / req)</th>
                  <th className="text-right px-2 py-2 w-20">ΔP</th>
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
                    <td className="px-2 py-1.5 text-right">
                      {r.unit_lecture_hours} / {r.required_lecture_hours}
                    </td>
                    <td className={`px-2 py-1.5 text-right ${r.lecture_diff !== 0 ? "text-amber-700 font-semibold" : ""}`}>
                      {r.status === "no_units" ? "—" : (r.lecture_diff > 0 ? `+${r.lecture_diff}` : r.lecture_diff)}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      {r.unit_practical_hours} / {r.required_practical_hours}
                    </td>
                    <td className={`px-2 py-1.5 text-right ${r.practical_diff !== 0 ? "text-amber-700 font-semibold" : ""}`}>
                      {r.status === "no_units" ? "—" : (r.practical_diff > 0 ? `+${r.practical_diff}` : r.practical_diff)}
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
  const [originalParsed, setOriginalParsed] = useState<ParsedUnit[]>([]);
  const [overwrite, setOverwrite] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");

  const WEEKS = 14;
  const targetLecture = (subject.lecture_hours ?? 0) * WEEKS;
  const targetPractical = (subject.practical_hours ?? 0) * WEEKS;
  const target = targetLecture + targetPractical;
  const totalLecture = parsed.reduce((s, u) => s + (Number(u.lecture_hours) || 0), 0);
  const totalPractical = parsed.reduce((s, u) => s + (Number(u.practical_hours) || 0), 0);
  const total = totalLecture + totalPractical;
  const lectureOk = targetLecture === totalLecture;
  const practicalOk = targetPractical === totalPractical;
  const allOk = lectureOk && practicalOk;
  const view = parsed;
  const isLab =
    ((subject.practical_hours ?? 0) > 0 && (subject.lecture_hours ?? 0) === 0) ||
    /\b(lab|laboratory|practical|workshop)\b/i.test(
      `${subject.name ?? ""} ${subject.code ?? ""}`,
    );

  function handleFile(f: File) {
    setFileName(f.name);
    const isJson = /\.json$/i.test(f.name) || f.type === "application/json";
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result ?? "");
      setRaw(txt);
      let p: ParsedUnit[] = [];
      if (isJson) {
        try {
          const obj = JSON.parse(txt);
          const arr = Array.isArray(obj) ? obj : obj?.units;
          if (Array.isArray(arr)) {
            p = arr
              .map((u: any, i: number) => {
                const lh = Number(u.lecture_hours ?? u.lectureHours ?? 0);
                const ph = Number(u.practical_hours ?? u.practicalHours ?? 0);
                const legacy = Number(u.hours ?? 0);
                // v1 fallback: put legacy hours into lecture_hours
                const lecture = lh || ph ? lh : legacy;
                const practical = ph;
                return {
                  unit_no: Number(u.unit_no ?? u.unitNo ?? i + 1),
                  title: String(u.title ?? "").slice(0, 200),
                  lecture_hours: lecture,
                  practical_hours: practical,
                  hours: lecture + practical,
                  topics: Array.isArray(u.topics)
                    ? u.topics.map((t: any) => String(t))
                    : String(u.topics ?? "")
                        .split(/[,;\n]/)
                        .map((s: string) => s.trim())
                        .filter(Boolean),
                };
              })
              .sort((a, b) => a.unit_no - b.unit_no);
          }
        } catch {
          p = [];
        }
      } else {
        p = [];
        // For lab subjects (practical-only, or name/code mentions "Lab"),
        // derive the "List of Practicals" from the .md instead of units.
        if (isLab) {
          p = parsePracticalList(txt);
        }
        if (p.length === 0) p = parseSyllabusMarkdown(txt);
      }
      setParsed(p);
      setOriginalParsed(p.map((u) => ({ ...u })));
    };
    reader.readAsText(f);
  }

  function autoDistribute() {
    if (parsed.length === 0) return;
    let next = parsed;
    if (targetLecture > 0) next = rescaleField(next, targetLecture, "lecture_hours");
    if (targetPractical > 0) next = rescaleField(next, targetPractical, "practical_hours");
    setParsed(
      next.map((u) => ({
        ...u,
        hours: (Number(u.lecture_hours) || 0) + (Number(u.practical_hours) || 0),
      })),
    );
  }

  function resetHours() {
    setParsed((cur) =>
      cur.map((u, i) => {
        const o = originalParsed[i];
        if (!o) return u;
        return {
          ...u,
          lecture_hours: o.lecture_hours,
          practical_hours: o.practical_hours,
          hours: o.lecture_hours + o.practical_hours,
        };
      }),
    );
  }

  function bump(i: number, field: "lecture_hours" | "practical_hours", delta: number) {
    setParsed((cur) => {
      const next = [...cur];
      const v = Math.max(0, (Number(next[i][field]) || 0) + delta);
      next[i] = { ...next[i], [field]: v };
      next[i].hours =
        (Number(next[i].lecture_hours) || 0) + (Number(next[i].practical_hours) || 0);
      return next;
    });
  }

  function setField(i: number, field: "lecture_hours" | "practical_hours", v: number) {
    setParsed((cur) => {
      const next = [...cur];
      next[i] = { ...next[i], [field]: Math.max(0, v) };
      next[i].hours =
        (Number(next[i].lecture_hours) || 0) + (Number(next[i].practical_hours) || 0);
      return next;
    });
  }

  async function doImport() {
    if (view.length === 0) return;
    if (!allOk) {
      setErr(
        `Theory ${totalLecture}/${targetLecture} and Practical ${totalPractical}/${targetPractical} must both match. Click "Auto-distribute" or adjust with +/- controls.`,
      );
      return;
    }
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
            lecture_hours: Math.max(0, Math.round(u.lecture_hours)),
            practical_hours: Math.max(0, Math.round(u.practical_hours)),
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
            accept=".md,.markdown,.txt,.json,text/markdown,text/plain,application/json"
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
            Choose .md or .json file
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            {fileName ||
              (isLab
                ? "Lab subject detected — paste a Markdown syllabus containing a 'List of Practicals' (numbered experiments) or a previously exported .json."
                : "Accepts a Markdown syllabus (## Unit 1: Title (10 hours) …) or a previously exported .json to reuse in a new academic year.")}
          </p>
          {isLab && (
            <p className="text-[11px] text-rose-700 mt-1 font-medium">
              This is a Lab subject — practicals are imported from the “List of Practicals” section, not from Unit headings.
            </p>
          )}
        </div>

        {parsed.length > 0 && (
          <>
            <div className="mt-4 flex flex-wrap gap-2 items-center text-sm">
              <button
                type="button"
                onClick={autoDistribute}
                disabled={target <= 0}
                className="border border-rose-700 text-rose-700 px-3 py-1.5 rounded text-xs font-semibold hover:bg-rose-50 disabled:opacity-50"
              >
                Auto-distribute (T {targetLecture || "—"} / P {targetPractical || "—"})
              </button>
              <button
                type="button"
                onClick={resetHours}
                className="border px-3 py-1.5 rounded text-xs hover:bg-secondary"
              >
                Reset to parsed
              </button>
              <label className="inline-flex items-center gap-1 ml-2">
                <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
                Overwrite existing {existingUnits.length} unit(s)
              </label>
              <span
                className={`ml-auto text-xs font-semibold ${allOk ? "text-emerald-700" : "text-rose-700"}`}
              >
                {view.length} units · T {totalLecture}/{targetLecture || "—"} · P{" "}
                {totalPractical}/{targetPractical || "—"}
              </span>
            </div>

            {target > 0 && (
              allOk ? (
                <div className="mt-2 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs px-3 py-2">
                  ✓ Theory and Practical totals both match. Preview below — edit before saving.
                </div>
              ) : (
                <div className="mt-2 rounded border border-rose-200 bg-rose-50 text-rose-800 text-xs px-3 py-2 space-y-0.5">
                  {!lectureOk && (
                    <div>
                      ✗ Theory {totalLecture} ≠ required {targetLecture}
                      {" "}(Δ {totalLecture - targetLecture > 0 ? "+" : ""}{totalLecture - targetLecture})
                    </div>
                  )}
                  {!practicalOk && (
                    <div>
                      ✗ Practical {totalPractical} ≠ required {targetPractical}
                      {" "}(Δ {totalPractical - targetPractical > 0 ? "+" : ""}{totalPractical - targetPractical})
                    </div>
                  )}
                  <div className="opacity-80">Click <b>Auto-distribute</b> or adjust with the +/- controls.</div>
                </div>
              )
            )}

            <div className="mt-3 border rounded overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left px-2 py-1.5 w-14">{isLab ? "#" : "Unit"}</th>
                    <th className="text-left px-2 py-1.5">{isLab ? "Practical" : "Title"}</th>
                    <th className="text-left px-2 py-1.5">{isLab ? "Notes" : "Topics"}</th>
                    <th className="text-center px-2 py-1.5 w-32">Theory</th>
                    <th className="text-center px-2 py-1.5 w-32">Practical</th>
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
                      {(["lecture_hours", "practical_hours"] as const).map((field) => {
                        const disabled =
                          (field === "lecture_hours" && targetLecture === 0) ||
                          (field === "practical_hours" && targetPractical === 0);
                        return (
                          <td key={field} className="px-2 py-1.5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => bump(i, field, -1)}
                                className="w-6 h-6 border rounded text-sm hover:bg-secondary disabled:opacity-40"
                                aria-label={`Decrease ${field}`}
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={200}
                                disabled={disabled}
                                value={u[field]}
                                onChange={(e) => setField(i, field, Number(e.target.value) || 0)}
                                className="w-14 border rounded px-1 py-0.5 text-sm text-center disabled:bg-secondary/50"
                              />
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => bump(i, field, 1)}
                                className="w-6 h-6 border rounded text-sm hover:bg-secondary disabled:opacity-40"
                                aria-label={`Increase ${field}`}
                              >
                                +
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-secondary/40 font-semibold">
                    <td colSpan={3} className="px-2 py-1.5 text-right">Total</td>
                    <td className={`px-2 py-1.5 text-center ${!lectureOk ? "text-rose-700" : ""}`}>
                      {totalLecture}
                      {targetLecture > 0 && ` / ${targetLecture}`}
                    </td>
                    <td className={`px-2 py-1.5 text-center ${!practicalOk ? "text-rose-700" : ""}`}>
                      {totalPractical}
                      {targetPractical > 0 && ` / ${targetPractical}`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {parsed.length === 0 && raw && (
          <p className="text-xs text-amber-700 mt-3">
            {isLab
              ? "No practicals detected. Make sure the file has a heading like \"List of Practicals\" or \"Experiments\" followed by a numbered list."
              : "No units detected. Make sure headings start with \"Unit 1\", \"## Unit II\", etc."}
          </p>
        )}

        {err && <p className="text-xs text-destructive mt-3">{err}</p>}
        {progress && <p className="text-xs text-muted-foreground mt-2">{progress}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 border rounded text-sm">Cancel</button>
          <button
            disabled={busy || view.length === 0 || (target > 0 && !allOk)}
            onClick={doImport}
            title={!allOk ? `Theory ${totalLecture}/${targetLecture} · Practical ${totalPractical}/${targetPractical} must match` : ""}
            className="px-4 py-1.5 bg-rose-700 text-white rounded text-sm inline-flex items-center gap-1 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {busy ? "Importing…" : `Import ${view.length} ${isLab ? "practical(s)" : "unit(s)"}`}
          </button>
        </div>

      </div>
    </div>
  );
}


