import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles } from "@/lib/roles";
import { listSubjects, listSyllabus, upsertSyllabusUnit, deleteSyllabusUnit, bulkImportSyllabus, bulkDeleteSyllabus } from "@/lib/academic.functions";
import { BulkOpsBar } from "@/components/admin/BulkOpsBar";

export const Route = createFileRoute("/admin/syllabus")({
  head: () => portalMeta("Syllabus"),
  component: SyllabusPage,
});

const SYLLABUS_SAMPLE = [
  { subject_code: "CE301", branch: "civil", semester: 3, unit_no: 1, title: "Introduction to Surveying", hours: 6, topics: "Definitions|Classifications|Principles" },
  { subject_code: "CE301", branch: "civil", semester: 3, unit_no: 2, title: "Chain Surveying", hours: 8, topics: "Instruments\nRanging\nOffsets" },
];

function SyllabusPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!adminRoles.includes(me.role as any)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const subjQ = useQuery({ queryKey: ["subjects-all"], queryFn: () => listSubjects({ data: {} as any }), enabled: !!me });
  const unitsQ = useQuery({
    queryKey: ["syllabus", subjectId],
    queryFn: () => listSyllabus({ data: { subject_id: subjectId! } }),
    enabled: !!me && !!subjectId,
  });
  const save = useMutation({ mutationFn: (d: any) => upsertSyllabusUnit({ data: d }), onSuccess: () => qc.invalidateQueries({ queryKey: ["syllabus"] }) });
  const del = useMutation({ mutationFn: (id: number) => deleteSyllabusUnit({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["syllabus"] }) });

  const toggle = (id: number) => {
    const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s);
  };

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell title="Syllabus" subtitle="Admin · Unit-wise Topics" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="bg-white border rounded p-3 flex flex-wrap items-center gap-2">
          <label className="text-sm font-semibold">Subject:</label>
          <select value={subjectId ?? ""} onChange={(e) => { setSubjectId(e.target.value ? Number(e.target.value) : null); setSelected(new Set()); }} className="border rounded px-3 py-2 text-sm bg-white">
            <option value="">— Select a subject —</option>
            {(subjQ.data ?? []).map((s: any) => (
              <option key={s.id} value={s.id}>{s.branch.toUpperCase()} · Sem {s.semester} · {s.code} — {s.name}</option>
            ))}
          </select>
          <div className="ml-auto">
            <BulkOpsBar
              sample={SYLLABUS_SAMPLE}
              sampleName="syllabus-sample"
              onImport={async (rows) => {
                const r = await bulkImportSyllabus({ data: { rows } });
                qc.invalidateQueries({ queryKey: ["syllabus"] });
                return r;
              }}
              selectedCount={selected.size}
              onBulkDelete={async () => {
                await bulkDeleteSyllabus({ data: { ids: Array.from(selected) } });
                setSelected(new Set());
                qc.invalidateQueries({ queryKey: ["syllabus"] });
              }}
            />
          </div>
        </div>

        {subjectId && (
          <>
            <UnitForm
              subjectId={subjectId}
              nextUnitNo={((unitsQ.data ?? []).at(-1)?.unit_no ?? 0) + 1}
              onSave={(d: any) => save.mutate(d)}
              pending={save.isPending}
              error={save.error?.message}
            />
            <div className="space-y-2">
              {(unitsQ.data ?? []).map((u: any) => (
                <div key={u.id} className="bg-white border rounded p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1" checked={selected.has(u.id)} onChange={() => toggle(u.id)} />
                      <div>
                        <p className="font-semibold">Unit {u.unit_no}: {u.title}</p>
                        <p className="text-xs text-muted-foreground">{u.hours} hours</p>
                      </div>
                    </div>
                    <button onClick={() => confirm("Delete unit?") && del.mutate(u.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {Array.isArray(u.topics) && u.topics.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                      {u.topics.map((t: string, i: number) => <li key={i}>{t}</li>)}
                    </ul>
                  )}
                </div>
              ))}
              {(unitsQ.data ?? []).length === 0 && <p className="text-sm text-muted-foreground bg-white border rounded p-6 text-center">No units yet for this subject.</p>}
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}

function UnitForm({ subjectId, nextUnitNo, onSave, pending, error }: any) {
  const [topicsText, setTopicsText] = useState("");
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const topics = topicsText.split("\n").map((t) => t.trim()).filter(Boolean);
      onSave({
        subject_id: subjectId,
        unit_no: Number(f.get("unit_no")),
        title: String(f.get("title")),
        hours: Number(f.get("hours") || 0),
        topics,
      });
      (e.currentTarget as HTMLFormElement).reset();
      setTopicsText("");
    }} className="bg-white border rounded p-3 grid sm:grid-cols-6 gap-2 items-end">
      <label className="text-xs">Unit # <input name="unit_no" type="number" min={1} defaultValue={nextUnitNo} required className="w-full border rounded px-2 py-1.5" /></label>
      <label className="text-xs sm:col-span-3">Title <input name="title" required className="w-full border rounded px-2 py-1.5" /></label>
      <label className="text-xs">Hours <input name="hours" type="number" min={0} defaultValue={0} className="w-full border rounded px-2 py-1.5" /></label>
      <button disabled={pending} className="bg-rose-700 text-white rounded px-3 py-2 text-sm font-semibold inline-flex items-center gap-1 justify-center disabled:opacity-50">
        <Plus className="w-4 h-4" /> Add
      </button>
      <label className="text-xs sm:col-span-6">Topics (one per line)
        <textarea value={topicsText} onChange={(e) => setTopicsText(e.target.value)} rows={3} className="w-full border rounded px-2 py-1.5 mt-1" />
      </label>
      {error && <p className="text-xs text-destructive sm:col-span-6">{error}</p>}
    </form>
  );
}
