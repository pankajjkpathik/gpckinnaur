import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Download } from "lucide-react";
import { listAuditLog } from "@/lib/audit.functions";
import { exportRows } from "@/lib/report-export";

export const Route = createFileRoute("/admin.audit")({
  head: () => ({ meta: [
    { title: "Audit Log — GP Kinnaur" },
    { name: "description", content: "System audit trail of administrative actions." },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: AuditLog,
});

function AuditLog() {
  const fn = useServerFn(listAuditLog);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const { data = [], isFetching } = useQuery({
    queryKey: ["audit", entity, action, actor],
    queryFn: () => fn({ data: {
      entity: entity || undefined, action: action || undefined,
      actor_type: actor || undefined, limit: 300,
    } }),
  });

  function dl(fmt: "pdf" | "xlsx" | "csv") {
    exportRows({
      filename: `audit-log-${new Date().toISOString().slice(0, 10)}`,
      title: "Audit Log",
      columns: [
        { key: "created_at", label: "When" },
        { key: "actor_type", label: "Actor Type" },
        { key: "actor_id", label: "Actor" },
        { key: "action", label: "Action" },
        { key: "entity", label: "Entity" },
        { key: "entity_id", label: "Entity ID" },
        { key: "ip", label: "IP" },
      ],
      rows: (data as any[]).map((r) => ({ ...r, created_at: new Date(r.created_at).toLocaleString() })),
      format: fmt,
    });
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-[color:var(--navy)] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/staff-dashboard" className="text-xs text-white/70 flex items-center gap-1 hover:text-white">
            <ArrowLeft className="w-3 h-3" /> Staff Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-1">Audit Log</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6 space-y-4">
        <div className="bg-white border rounded p-3 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-muted-foreground">Entity</label>
            <input value={entity} onChange={(e) => setEntity(e.target.value)} placeholder="students, marks…" className="border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground">Action</label>
            <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="create, update, delete" className="border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground">Actor Type</label>
            <select value={actor} onChange={(e) => setActor(e.target.value)} className="border rounded px-2 py-1 text-sm bg-white">
              <option value="">All</option>
              <option value="staff">Staff</option>
              <option value="student">Student</option>
              <option value="system">System</option>
            </select>
          </div>
          <div className="ml-auto flex gap-2">
            {(["pdf", "xlsx", "csv"] as const).map((f) => (
              <button key={f} onClick={() => dl(f)} className="text-xs border rounded px-3 py-1.5 flex items-center gap-1 hover:bg-secondary">
                <Download className="w-3 h-3" /> {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--navy)] text-white">
              <tr>
                <th className="px-3 py-2 text-left">When</th>
                <th className="px-3 py-2 text-left">Actor</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Entity</th>
                <th className="px-3 py-2 text-left">Details</th>
                <th className="px-3 py-2 text-left">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data as any[]).map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs">{r.actor_type}{r.actor_id ? ` #${r.actor_id}` : ""}</td>
                  <td className="px-3 py-2"><span className="text-[10px] bg-secondary px-2 py-0.5 rounded uppercase">{r.action}</span></td>
                  <td className="px-3 py-2 text-xs">{r.entity}{r.entity_id ? ` #${r.entity_id}` : ""}</td>
                  <td className="px-3 py-2 text-xs max-w-md truncate" title={typeof r.details === "object" ? JSON.stringify(r.details) : String(r.details ?? "")}>
                    {r.details ? (typeof r.details === "object" ? JSON.stringify(r.details) : String(r.details)) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.ip ?? "—"}</td>
                </tr>
              ))}
              {!isFetching && data.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No audit entries match the filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
