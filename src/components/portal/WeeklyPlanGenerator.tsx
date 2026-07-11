import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Save, Printer, RotateCcw, Info } from "lucide-react";
import {
  myTeachingSubjects,
  listWeeklyPlan,
  generateWeeklyPlan,
  updateWeeklyPlanRow,
  deleteWeeklyPlan,
} from "@/lib/weekly-plan.functions";

type Row = {
  id: number;
  week_no: number;
  unit_no: number | null;
  topics: string;
  periods: number;
  learning_outcomes: string | null;
  teaching_method: string | null;
  notes: string | null;
};

export function WeeklyPlanGenerator({ academicYear }: { academicYear: string }) {
  const qc = useQueryClient();
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [msg, setMsg] = useState<string | null>(null);

  const subjectsQ = useQuery({
    queryKey: ["my-teaching-subjects", academicYear],
    queryFn: () => myTeachingSubjects({ data: { academic_year: academicYear } }),
  });

  const subjects = (subjectsQ.data ?? []) as any[];
  const chosen = useMemo(
    () => subjects.find((s) => s.subject_id === subjectId),
    [subjects, subjectId],
  );

  const planQ = useQuery({
    queryKey: ["weekly-plan", subjectId, academicYear],
    enabled: !!subjectId,
    queryFn: () =>
      listWeeklyPlan({
        data: { subject_id: Number(subjectId), academic_year: academicYear },
      }),
  });

  const gen = useMutation({
    mutationFn: () =>
      generateWeeklyPlan({
        data: { subject_id: Number(subjectId), academic_year: academicYear },
      }),
    onSuccess: (r) => {
      setMsg(`Generated ${r.weeks}-week plan (${r.periods_per_week} periods/week).`);
      qc.invalidateQueries({ queryKey: ["weekly-plan", subjectId, academicYear] });
    },
    onError: (e: any) => setMsg(e.message ?? "Failed to generate."),
  });

  const clr = useMutation({
    mutationFn: () =>
      deleteWeeklyPlan({
        data: { subject_id: Number(subjectId), academic_year: academicYear },
      }),
    onSuccess: () => {
      setMsg("Plan cleared.");
      qc.invalidateQueries({ queryKey: ["weekly-plan", subjectId, academicYear] });
    },
  });

  const rows = (planQ.data ?? []) as Row[];

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-lg p-5 shadow-sm print:hidden">
        <div className="flex items-start gap-2 text-xs text-gray-600 mb-3">
          <Info className="w-4 h-4 mt-0.5 text-sky-600" />
          <p>
            Pick one of your assigned subjects and generate a <b>14-week lesson plan</b>. The
            generator reads the syllabus units defined for the subject (admin → Syllabus Units)
            and distributes topics across weeks using the subject's{" "}
            <b>L + P periods per week</b>. You can edit each row and print the final plan.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Subject</label>
            <select
              value={subjectId}
              onChange={(e) =>
                setSubjectId(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="border rounded w-full px-3 py-2 text-sm"
            >
              <option value="">— Choose a subject —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.subject_id}>
                  {s.subjects?.code} · {s.subjects?.name} — {s.branch} Sem {s.semester}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-500">
            {chosen && (
              <>
                <div>
                  Periods/week:{" "}
                  <b>
                    {(chosen.subjects?.lecture_hours ?? 0) +
                      (chosen.subjects?.practical_hours ?? 0)}
                  </b>{" "}
                  (L {chosen.subjects?.lecture_hours ?? 0} + P{" "}
                  {chosen.subjects?.practical_hours ?? 0})
                </div>
                <div>Semester weeks: <b>14</b></div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            disabled={!subjectId || gen.isPending}
            onClick={() => gen.mutate()}
            className="bg-[#7b1f4c] text-white px-4 py-2 rounded text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            {gen.isPending ? "Generating…" : rows.length ? "Regenerate Plan" : "Generate 14-Week Plan"}
          </button>
          {rows.length > 0 && (
            <>
              <button
                onClick={() => window.print()}
                className="border px-4 py-2 rounded text-sm inline-flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print / Save as PDF
              </button>
              <button
                onClick={() => {
                  if (confirm("Delete this generated plan?")) clr.mutate();
                }}
                className="text-rose-600 border border-rose-200 px-4 py-2 rounded text-sm inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Clear Plan
              </button>
            </>
          )}
        </div>
        {msg && <p className="text-xs text-emerald-700 mt-3">{msg}</p>}
        {gen.isError && (
          <p className="text-xs text-rose-700 mt-3">{(gen.error as any)?.message}</p>
        )}
      </div>

      {rows.length > 0 && chosen && (
        <PlanTable rows={rows} subject={chosen} academicYear={academicYear} />
      )}

      {subjectId && !planQ.isLoading && rows.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded p-4 print:hidden">
          No plan generated yet. Click <b>Generate 14-Week Plan</b> above.
        </div>
      )}
    </div>
  );
}

function PlanTable({
  rows,
  subject,
  academicYear,
}: {
  rows: Row[];
  subject: any;
  academicYear: string;
}) {
  const qc = useQueryClient();
  const [edits, setEdits] = useState<Record<number, Partial<Row>>>({});

  const save = useMutation({
    mutationFn: (patch: any) => updateWeeklyPlanRow({ data: patch }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["weekly-plan", subject?.subject_id, academicYear] }),
  });

  function onEdit(id: number, field: keyof Row, value: any) {
    setEdits((p) => ({ ...p, [id]: { ...p[id], [field]: value } }));
  }
  function commit(id: number) {
    const patch = edits[id];
    if (!patch) return;
    save.mutate({ id, ...patch });
    setEdits((p) => {
      const { [id]: _, ...rest } = p;
      return rest;
    });
  }

  const totalPeriods = rows.reduce((s, r) => s + (r.periods ?? 0), 0);

  return (
    <div className="bg-white border rounded-lg shadow-sm p-5 print:border-0 print:shadow-none print:p-0">
      <div className="mb-4 print:mb-6">
        <h2 className="text-lg font-bold text-[#7b1f4c] print:text-black">
          Lesson Plan — {subject.subjects?.name} ({subject.subjects?.code})
        </h2>
        <p className="text-xs text-gray-600">
          Branch: {subject.branch} · Semester {subject.semester} · Academic Year {academicYear}
        </p>
        <p className="text-xs text-gray-600">
          14 weeks · Total periods: <b>{totalPeriods}</b>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 print:bg-white">
              <th className="border px-2 py-2 text-left w-12">Week</th>
              <th className="border px-2 py-2 text-left w-14">Unit</th>
              <th className="border px-2 py-2 text-left">Topics to cover</th>
              <th className="border px-2 py-2 text-left w-16">Periods</th>
              <th className="border px-2 py-2 text-left print:w-40">Learning Outcomes</th>
              <th className="border px-2 py-2 text-left print:w-32">Method</th>
              <th className="border px-2 py-2 text-left print:w-32">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const e = edits[r.id] ?? {};
              const val = (k: keyof Row) => (k in e ? (e as any)[k] : (r as any)[k]) ?? "";
              return (
                <tr key={r.id} className="align-top">
                  <td className="border px-2 py-2 font-semibold text-center">W{r.week_no}</td>
                  <td className="border px-2 py-2 text-center">{r.unit_no ?? "—"}</td>
                  <td className="border px-2 py-1">
                    <textarea
                      className="w-full border-0 focus:ring-0 text-sm resize-y print:border-0"
                      rows={2}
                      value={val("topics")}
                      onChange={(ev) => onEdit(r.id, "topics", ev.target.value)}
                      onBlur={() => commit(r.id)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      min={0}
                      max={40}
                      className="w-14 border rounded px-1 py-0.5 text-sm print:border-0"
                      value={val("periods")}
                      onChange={(ev) => onEdit(r.id, "periods", Number(ev.target.value))}
                      onBlur={() => commit(r.id)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <textarea
                      className="w-full border-0 focus:ring-0 text-sm resize-y print:border-0"
                      rows={2}
                      value={val("learning_outcomes")}
                      onChange={(ev) => onEdit(r.id, "learning_outcomes", ev.target.value)}
                      onBlur={() => commit(r.id)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      className="w-full border-0 focus:ring-0 text-sm print:border-0"
                      value={val("teaching_method")}
                      onChange={(ev) => onEdit(r.id, "teaching_method", ev.target.value)}
                      onBlur={() => commit(r.id)}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      className="w-full border-0 focus:ring-0 text-sm print:border-0"
                      value={val("notes")}
                      onChange={(ev) => onEdit(r.id, "notes", ev.target.value)}
                      onBlur={() => commit(r.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-gray-500 flex items-center gap-2 print:hidden">
        <Save className="w-3.5 h-3.5" /> Changes save automatically when you leave a cell.
      </div>

      <div className="hidden print:block mt-10 text-xs">
        <div className="grid grid-cols-3 gap-8 pt-8">
          <div className="border-t pt-2 text-center">Faculty Signature</div>
          <div className="border-t pt-2 text-center">HOD Signature</div>
          <div className="border-t pt-2 text-center">Principal Signature</div>
        </div>
      </div>
    </div>
  );
}
