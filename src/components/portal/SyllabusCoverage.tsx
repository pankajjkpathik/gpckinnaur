import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, CalendarCheck } from "lucide-react";
import {
  coverageMySubjects,
  coverageUnits,
  coverageLectures,
  coverageAddLecture,
  coverageDeleteLecture,
  coverageSummary,
  coverageFacultyOptions,
} from "@/lib/coverage.functions";

type Mode = "faculty" | "view";

const BRANCHES = [
  { code: "civil", label: "Civil Engineering" },
  { code: "mechanical", label: "Mechanical Engineering" },
  { code: "applied_science", label: "Applied Sciences" },
];
const SEMESTERS = [1, 2, 3, 4, 5, 6];

export function SyllabusCoverage({
  mode,
  academicYear,
  scope,
  filters,
  title = "Syllabus Coverage",
  subtitle,
}: {
  mode: Mode;
  academicYear: string;
  scope?: { branch?: string; semester?: number; staff_id?: number };
  /** "hod" locks branch, allows semester + faculty filters. "principal" allows all three. */
  filters?: "hod" | "principal";
  title?: string;
  subtitle?: string;
}) {
  const qc = useQueryClient();

  // ── Local filter state (only used when filters prop set) ──
  const [branchF, setBranchF] = useState<string>(scope?.branch ?? "");
  const [semF, setSemF] = useState<number | "">(scope?.semester ?? "");
  const [staffF, setStaffF] = useState<number | "">("");

  const effBranch = filters === "principal" ? (branchF || null) : (scope?.branch ?? null);
  const effSemester = filters ? (semF === "" ? null : Number(semF)) : (scope?.semester ?? null);
  const effStaff = filters ? (staffF === "" ? null : Number(staffF)) : (scope?.staff_id ?? null);

  const facultyOpts = useQuery({
    queryKey: ["cov-faculty-opts", effBranch ?? ""],
    queryFn: () => coverageFacultyOptions({ data: { branch: effBranch ?? null } }),
    enabled: !!filters,
  });

  // ── Summary ──
  const summary = useQuery({
    queryKey: ["cov-summary", academicYear, effBranch ?? "", effSemester ?? 0, effStaff ?? 0],
    queryFn: () =>
      coverageSummary({
        data: {
          academic_year: academicYear,
          branch: effBranch,
          semester: effSemester,
          staff_id: effStaff,
        },
      }),
  });
  const rows = (summary.data ?? []) as any[];

  const overall = useMemo(() => {
    if (rows.length === 0) return 0;
    const p = rows.reduce((a, r) => a + (r.planned_hours || 0), 0);
    const d = rows.reduce((a, r) => a + (r.delivered_hours || 0), 0);
    return p > 0 ? Math.min(100, Math.round((d / p) * 100)) : 0;
  }, [rows]);

  const [openSubject, setOpenSubject] = useState<{
    subject_id: number;
    branch: string;
    semester: number;
    code: string;
    name: string;
  } | null>(null);

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-lg shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-800">{title}</p>
            <p className="text-xs text-gray-400">
              {subtitle ?? "Lectures delivered per subject and syllabus coverage %."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-gray-400">Overall</p>
            <p className="text-2xl font-bold text-[#7b1f4c]">{overall}%</p>
          </div>
        </div>

        {filters && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {filters === "principal" && (
              <select
                value={branchF}
                onChange={(e) => setBranchF(e.target.value)}
                className="border rounded px-2 py-1.5"
              >
                <option value="">All branches</option>
                {BRANCHES.map((b) => (
                  <option key={b.code} value={b.label}>{b.label}</option>
                ))}
              </select>
            )}
            {filters === "hod" && scope?.branch && (
              <span className="border rounded px-2 py-1.5 bg-gray-50 text-gray-600 text-xs">
                Branch: {scope.branch}
              </span>
            )}
            <select
              value={semF}
              onChange={(e) => setSemF(e.target.value === "" ? "" : Number(e.target.value))}
              className="border rounded px-2 py-1.5"
            >
              <option value="">All semesters</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>Sem {s}</option>
              ))}
            </select>
            <select
              value={staffF}
              onChange={(e) => setStaffF(e.target.value === "" ? "" : Number(e.target.value))}
              className="border rounded px-2 py-1.5 min-w-[180px]"
            >
              <option value="">All faculty</option>
              {(facultyOpts.data ?? []).map((f: any) => (
                <option key={f.id} value={f.id}>{f.name || f.username}</option>
              ))}
            </select>
            {(branchF || semF !== "" || staffF !== "") && filters === "principal" && (
              <button
                onClick={() => { setBranchF(""); setSemF(""); setStaffF(""); }}
                className="text-xs text-gray-500 underline"
              >
                Reset
              </button>
            )}
            {(semF !== "" || staffF !== "") && filters === "hod" && (
              <button
                onClick={() => { setSemF(""); setStaffF(""); }}
                className="text-xs text-gray-500 underline"
              >
                Reset
              </button>
            )}
          </div>
        )}


        <div className="mt-4 border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Subject</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Br / Sem</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Faculty</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Delivered / Planned</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Coverage</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Last Class</th>
                <th className="text-right px-4 py-2 text-gray-500 font-medium">Log</th>
              </tr>
            </thead>
            <tbody>
              {summary.isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">Loading…</td>
                </tr>
              )}
              {!summary.isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">No subjects in scope.</td>
                </tr>
              )}
              {rows.map((r: any) => (
                <tr key={`${r.subject_id}-${r.branch}-${r.semester}`} className="border-t">
                  <td className="px-4 py-2">
                    <div className="font-medium text-gray-800">{r.code}</div>
                    <div className="text-xs text-gray-500">{r.name}</div>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">{r.branch} · S{r.semester}</td>
                  <td className="px-4 py-2 text-xs text-gray-600">{r.faculty?.label ?? "—"}</td>
                  <td className="px-4 py-2 text-xs text-gray-700">
                    {r.delivered_hours} / {r.planned_hours || "—"}
                  </td>
                  <td className="px-4 py-2 w-48">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${r.percent}%` }}
                        />
                      </div>
                      <span className="text-xs w-9 text-right font-semibold text-gray-700">{r.percent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">{r.last_date ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() =>
                        setOpenSubject({
                          subject_id: r.subject_id,
                          branch: r.branch,
                          semester: r.semester,
                          code: r.code,
                          name: r.name,
                        })
                      }
                      className="text-xs text-[#7b1f4c] hover:underline inline-flex items-center gap-1"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Faculty entry panel */}
      {mode === "faculty" && (
        <FacultyEntryPanel
          academicYear={academicYear}
          onSaved={() => qc.invalidateQueries({ queryKey: ["cov-summary"] })}
        />
      )}

      {openSubject && (
        <SubjectLogModal
          open={openSubject}
          academicYear={academicYear}
          canDelete={mode === "faculty"}
          onClose={() => setOpenSubject(null)}
          onChanged={() => qc.invalidateQueries({ queryKey: ["cov-summary"] })}
        />
      )}
    </div>
  );
}

function FacultyEntryPanel({
  academicYear,
  onSaved,
}: {
  academicYear: string;
  onSaved: () => void;
}) {
  const subs = useQuery({
    queryKey: ["cov-my-subs", academicYear],
    queryFn: () => coverageMySubjects({ data: { academic_year: academicYear } }),
  });
  const subjects = (subs.data ?? []) as any[];

  const [key, setKey] = useState<string>("");
  const chosen = subjects.find((s: any) => `${s.subject_id}|${s.branch}|${s.semester}` === key);

  const units = useQuery({
    queryKey: ["cov-units", chosen?.subject_id],
    queryFn: () => coverageUnits({ data: { subject_id: chosen!.subject_id } }),
    enabled: !!chosen,
  });

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [unitId, setUnitId] = useState<number | "">("");
  const [topic, setTopic] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const add = useMutation({
    mutationFn: async () => {
      if (!chosen) throw new Error("Select a subject");
      if (!topic.trim()) throw new Error("Enter topic covered");
      return coverageAddLecture({
        data: {
          subject_id: chosen.subject_id,
          branch: chosen.branch,
          semester: chosen.semester,
          academic_year: academicYear,
          unit_id: unitId === "" ? null : Number(unitId),
          topic: topic.trim(),
          actual_date: date,
        },
      });
    },
    onSuccess: () => {
      setTopic("");
      setUnitId("");
      setErr(null);
      onSaved();
    },
    onError: (e: any) => setErr(e.message),
  });

  return (
    <div className="bg-white border rounded-lg shadow-sm p-5">
      <p className="font-semibold text-gray-800 mb-1">Record a Lecture Delivered</p>
      <p className="text-xs text-gray-400 mb-4">
        Log every class you deliver — subject, date, unit and topic covered. The system computes coverage % automatically.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
        <div className="lg:col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">Subject</label>
          <select
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setUnitId("");
            }}
            className="border rounded w-full px-3 py-2"
          >
            <option value="">Select subject…</option>
            {subjects.map((s: any) => (
              <option key={`${s.subject_id}|${s.branch}|${s.semester}`} value={`${s.subject_id}|${s.branch}|${s.semester}`}>
                {s.subjects?.code} — {s.subjects?.name} ({s.branch} S{s.semester})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded w-full px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Unit</label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value === "" ? "" : Number(e.target.value))}
            className="border rounded w-full px-3 py-2"
            disabled={!chosen}
          >
            <option value="">—</option>
            {(units.data ?? []).map((u: any) => (
              <option key={u.id} value={u.id}>
                U{u.unit_no}: {u.title}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-5">
          <label className="text-xs text-gray-500 mb-1 block">Topic covered</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Kirchhoff's Voltage Law — problems"
            className="border rounded w-full px-3 py-2"
          />
        </div>
      </div>
      {err && <p className="text-xs text-rose-700 mt-2">{err}</p>}
      <button
        disabled={add.isPending}
        onClick={() => add.mutate()}
        className="mt-4 bg-[#7b1f4c] text-white px-5 py-2 rounded font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60"
      >
        <Plus className="w-4 h-4" /> {add.isPending ? "Saving…" : "Add lecture"}
      </button>
      {add.isSuccess && <p className="text-xs text-emerald-700 mt-2">Lecture recorded.</p>}
    </div>
  );
}

function SubjectLogModal({
  open,
  academicYear,
  canDelete,
  onClose,
  onChanged,
}: {
  open: { subject_id: number; branch: string; semester: number; code: string; name: string };
  academicYear: string;
  canDelete: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["cov-lectures", open.subject_id, open.branch, open.semester, academicYear],
    queryFn: () =>
      coverageLectures({
        data: {
          subject_id: open.subject_id,
          branch: open.branch,
          semester: open.semester,
          academic_year: academicYear,
        },
      }),
  });
  const del = useMutation({
    mutationFn: (id: number) => coverageDeleteLecture({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cov-lectures"] });
      onChanged();
    },
  });
  const rows = (list.data ?? []) as any[];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b flex items-start justify-between">
          <div>
            <p className="font-semibold text-gray-800">{open.code} — {open.name}</p>
            <p className="text-xs text-gray-500">{open.branch} · Semester {open.semester} · {academicYear}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Date</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Unit</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Topic Covered</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Faculty</th>
                {canDelete && <th className="text-right px-4 py-2 text-gray-500 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {list.isLoading && (
                <tr><td colSpan={canDelete ? 5 : 4} className="px-4 py-6 text-center text-gray-400">Loading…</td></tr>
              )}
              {!list.isLoading && rows.length === 0 && (
                <tr><td colSpan={canDelete ? 5 : 4} className="px-4 py-6 text-center text-gray-400">No lectures logged yet.</td></tr>
              )}
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2 whitespace-nowrap">{r.actual_date}</td>
                  <td className="px-4 py-2 text-xs">
                    {r.syllabus_units ? `U${r.syllabus_units.unit_no}: ${r.syllabus_units.title}` : "—"}
                  </td>
                  <td className="px-4 py-2">{r.topic}</td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {r.staff_users?.name || r.staff_users?.username || "—"}
                  </td>
                  {canDelete && (
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => { if (confirm("Delete this lecture entry?")) del.mutate(r.id); }}
                        className="text-rose-600 hover:text-rose-800 inline-flex items-center gap-1 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
