import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles, hasRole } from "@/lib/roles";
import {
  listPeriods,
  upsertPeriod,
  deletePeriod,
  bulkImportPeriods,
  bulkDeletePeriods,
} from "@/lib/academic.functions";
import { BulkOpsBar } from "@/components/admin/BulkOpsBar";

export const Route = createFileRoute("/admin/periods")({
  head: () => portalMeta("Periods Master"),
  component: PeriodsPage,
});

const PERIOD_SAMPLE = [
  { period_no: 1, start_time: "09:00", end_time: "09:50", is_break: false, label: "" },
  { period_no: 2, start_time: "09:50", end_time: "10:40", is_break: false, label: "" },
  { period_no: 3, start_time: "10:40", end_time: "11:00", is_break: true, label: "Recess" },
];

function PeriodsPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!hasRole(me, adminRoles)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const periodsQ = useQuery({ queryKey: ["periods"], queryFn: () => listPeriods(), enabled: !!me });
  const save = useMutation({
    mutationFn: (d: any) => upsertPeriod({ data: d }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["periods"] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => deletePeriod({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["periods"] }),
  });

  const [next, setNext] = useState({
    period_no: 1,
    start_time: "09:00",
    end_time: "09:50",
    is_break: false,
    label: "",
  });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggle = (id: number) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    const ids = (periodsQ.data ?? []).map((r: any) => r.id);
    setSelected(selected.size === ids.length ? new Set() : new Set(ids));
  };

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell title="Periods Master" subtitle="Admin · Bell Schedule" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex justify-end">
          <BulkOpsBar
            sample={PERIOD_SAMPLE}
            sampleName="periods-sample"
            onImport={async (rows) => {
              const r = await bulkImportPeriods({ data: { rows } });
              qc.invalidateQueries({ queryKey: ["periods"] });
              return r;
            }}
            selectedCount={selected.size}
            onBulkDelete={async () => {
              await bulkDeletePeriods({ data: { ids: Array.from(selected) } });
              setSelected(new Set());
              qc.invalidateQueries({ queryKey: ["periods"] });
            }}
          />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(next);
          }}
          className="bg-white border rounded p-3 grid grid-cols-2 sm:grid-cols-6 gap-2 items-end"
        >
          <label className="text-xs">
            Period #{" "}
            <input
              type="number"
              min={1}
              max={12}
              value={next.period_no}
              onChange={(e) => setNext({ ...next, period_no: Number(e.target.value) })}
              className="w-full border rounded px-2 py-1.5"
            />
          </label>
          <label className="text-xs">
            Start{" "}
            <input
              type="time"
              value={next.start_time}
              onChange={(e) => setNext({ ...next, start_time: e.target.value })}
              className="w-full border rounded px-2 py-1.5"
            />
          </label>
          <label className="text-xs">
            End{" "}
            <input
              type="time"
              value={next.end_time}
              onChange={(e) => setNext({ ...next, end_time: e.target.value })}
              className="w-full border rounded px-2 py-1.5"
            />
          </label>
          <label className="text-xs">
            Label{" "}
            <input
              value={next.label}
              onChange={(e) => setNext({ ...next, label: e.target.value })}
              placeholder="e.g. Lunch"
              className="w-full border rounded px-2 py-1.5"
            />
          </label>
          <label className="text-xs flex items-center gap-1">
            <input
              type="checkbox"
              checked={next.is_break}
              onChange={(e) => setNext({ ...next, is_break: e.target.checked })}
            />{" "}
            Break
          </label>
          <button
            disabled={save.isPending}
            className="bg-rose-700 text-white rounded px-3 py-2 text-sm font-semibold inline-flex items-center gap-1 justify-center disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Save
          </button>
          {save.error && <p className="col-span-full text-xs text-destructive">{save.error.message}</p>}
        </form>

        <div className="bg-white border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.size > 0 && selected.size === (periodsQ.data ?? []).length}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Start</th>
                <th className="px-3 py-2 text-left">End</th>
                <th className="px-3 py-2 text-left">Label</th>
                <th className="px-3 py-2 text-left">Break</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(periodsQ.data ?? []).map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                  </td>
                  <td className="px-3 py-2 font-mono">{p.period_no}</td>
                  <td className="px-3 py-2">{p.start_time}</td>
                  <td className="px-3 py-2">{p.end_time}</td>
                  <td className="px-3 py-2">{p.label ?? "—"}</td>
                  <td className="px-3 py-2">{p.is_break ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => confirm("Delete period?") && del.mutate(p.id)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {(periodsQ.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-muted-foreground">
                    No periods configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}
