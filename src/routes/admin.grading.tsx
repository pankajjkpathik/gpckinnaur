import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles } from "@/lib/roles";
import { listGrading, replaceGrading } from "@/lib/academic.functions";

export const Route = createFileRoute("/admin/grading")({
  head: () => portalMeta("Grading Scheme"),
  component: GradingPage,
});

type Row = { min_pct: number; max_pct: number; grade: string; grade_point: number; is_pass: boolean };

const DEFAULT_ROWS: Row[] = [
  { min_pct: 90, max_pct: 100, grade: "A+", grade_point: 10, is_pass: true },
  { min_pct: 80, max_pct: 89.99, grade: "A", grade_point: 9, is_pass: true },
  { min_pct: 70, max_pct: 79.99, grade: "B", grade_point: 8, is_pass: true },
  { min_pct: 60, max_pct: 69.99, grade: "C", grade_point: 7, is_pass: true },
  { min_pct: 50, max_pct: 59.99, grade: "D", grade_point: 6, is_pass: true },
  { min_pct: 40, max_pct: 49.99, grade: "E", grade_point: 5, is_pass: true },
  { min_pct: 0,  max_pct: 39.99, grade: "F", grade_point: 0, is_pass: false },
];

function GradingPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!adminRoles.includes(me.role as any)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const q = useQuery({ queryKey: ["grading"], queryFn: () => listGrading(), enabled: !!me });
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    if (q.data) {
      setRows(q.data.length ? q.data.map((r: any) => ({ ...r, min_pct: Number(r.min_pct), max_pct: Number(r.max_pct), grade_point: Number(r.grade_point) })) : DEFAULT_ROWS);
    }
  }, [q.data]);
  const save = useMutation({
    mutationFn: () => replaceGrading({ data: { rows: rows ?? [] } as any }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grading"] }),
  });

  if (isLoading || !me || !rows) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell title="Grading Scheme" subtitle="Admin · Result Configuration" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6 space-y-4 max-w-3xl">
        <p className="text-sm text-muted-foreground">Define grade boundaries from highest to lowest. Used when results are computed.</p>
        <div className="bg-white border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary"><tr>
              <th className="px-2 py-2 text-left">Min %</th><th className="px-2 py-2 text-left">Max %</th>
              <th className="px-2 py-2 text-left">Grade</th><th className="px-2 py-2 text-left">Grade Pt</th>
              <th className="px-2 py-2 text-left">Pass</th><th></th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1"><input type="number" step="0.01" value={r.min_pct} onChange={(e) => upd(i, "min_pct", Number(e.target.value))} className="w-20 border rounded px-2 py-1" /></td>
                  <td className="px-2 py-1"><input type="number" step="0.01" value={r.max_pct} onChange={(e) => upd(i, "max_pct", Number(e.target.value))} className="w-20 border rounded px-2 py-1" /></td>
                  <td className="px-2 py-1"><input value={r.grade} onChange={(e) => upd(i, "grade", e.target.value)} className="w-16 border rounded px-2 py-1" /></td>
                  <td className="px-2 py-1"><input type="number" step="0.01" value={r.grade_point} onChange={(e) => upd(i, "grade_point", Number(e.target.value))} className="w-20 border rounded px-2 py-1" /></td>
                  <td className="px-2 py-1"><input type="checkbox" checked={r.is_pass} onChange={(e) => upd(i, "is_pass", e.target.checked)} /></td>
                  <td className="px-2 py-1 text-right"><button onClick={() => setRows(rows.filter((_, j) => j !== i))} className="p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between">
          <button onClick={() => setRows([...rows, { min_pct: 0, max_pct: 100, grade: "?", grade_point: 0, is_pass: true }])} className="border px-3 py-2 rounded text-sm inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add row</button>
          <button onClick={() => save.mutate()} disabled={save.isPending} className="bg-rose-700 text-white px-4 py-2 rounded text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-50"><Save className="w-4 h-4" /> {save.isPending ? "Saving…" : "Save Scheme"}</button>
        </div>
        {save.error && <p className="text-xs text-destructive">{save.error.message}</p>}
        {save.isSuccess && <p className="text-xs text-green-700">Saved.</p>}
      </div>
    </PortalShell>
  );

  function upd<K extends keyof Row>(i: number, k: K, v: Row[K]) {
    setRows(rows!.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  }
}
