import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Save, X } from "lucide-react";
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

export const Route = createFileRoute("/admin/syllabus-units")({
  head: () => portalMeta("Planned Unit Hours"),
  component: SyllabusUnitsPage,
});

type Unit = {
  id?: number;
  subject_id: number;
  unit_no: number;
  title: string;
  topics: string[];
  hours: number;
};

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

  const subjectsQ = useQuery({
    queryKey: ["subjects", branch, sem],
    queryFn: () => listSubjects({ data: { branch: branch || undefined, semester: sem || undefined } as any }),
    enabled: !!me,
  });

  const unitsQ = useQuery({
    queryKey: ["syllabus-units", subjectId],
    queryFn: () => listSyllabus({ data: { subject_id: Number(subjectId) } }),
    enabled: !!subjectId,
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
  const subjectPlanned = subject ? (subject.lecture_hours ?? 0) + (subject.practical_hours ?? 0) : 0;

  const [editing, setEditing] = useState<Unit | null>(null);

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell title="Planned Unit Hours" subtitle="Admin · Syllabus Coverage Setup" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6 space-y-4 max-w-5xl">
        <p className="text-sm text-muted-foreground">
          Define units and planned hours per subject. Coverage % across all portals is computed against the sum of these
          unit hours (falling back to the subject's L+P hours if no units are defined).
        </p>

        <ReconciliationPanel
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
                  {subject.code} · {subject.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Subject L+P hours: <b>{subjectPlanned}</b> · Sum of unit hours: <b>{totalPlanned}</b>
                  {totalPlanned !== subjectPlanned && totalPlanned > 0 && (
                    <span className="text-amber-600"> · mismatch — coverage uses unit hours ({totalPlanned})</span>
                  )}
                  {totalPlanned === 0 && (
                    <span className="text-amber-600"> · no units yet — coverage falls back to L+P ({subjectPlanned})</span>
                  )}
                </p>
              </div>
              <button
                onClick={() =>
                  setEditing({
                    subject_id: subject.id,
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
