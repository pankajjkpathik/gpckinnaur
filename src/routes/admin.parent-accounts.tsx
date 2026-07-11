import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Search, KeyRound, ShieldCheck, ShieldOff, History, X } from "lucide-react";
import {
  adminListParentAccounts,
  adminResetParentPassword,
  adminSetParentActive,
  adminParentAuditEvents,
} from "@/lib/parent.functions";

export const Route = createFileRoute("/admin/parent-accounts")({
  head: () => ({
    meta: [
      { title: "Parent Accounts — GP Kinnaur Admin" },
      { name: "description", content: "Manage parent portal logins for GP Kinnaur students." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ParentAccounts,
});

function fmt(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return d;
  }
}

function ParentAccounts() {
  const qc = useQueryClient();
  const list = useServerFn(adminListParentAccounts);
  const reset = useServerFn(adminResetParentPassword);
  const setActive = useServerFn(adminSetParentActive);

  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState<string>("");
  const [drawer, setDrawer] = useState<{ studentId: number; name: string; enrollment: string } | null>(null);
  const [resetResult, setResetResult] = useState<{ enrollment: string; password: string } | null>(null);

  const q = useQuery({
    queryKey: ["admin-parent-accounts", search, branch, semester],
    queryFn: () =>
      list({
        data: {
          search: search || undefined,
          branch: branch || undefined,
          semester: semester ? Number(semester) : undefined,
        },
      }),
  });

  const rows: any[] = q.data ?? [];

  const resetMut = useMutation({
    mutationFn: (studentId: number) => reset({ data: { studentId } }),
    onSuccess: (res, studentId) => {
      const row = rows.find((r) => r.student_id === studentId);
      setResetResult({ enrollment: row?.enrollment_no ?? "", password: res.temporaryPassword });
      qc.invalidateQueries({ queryKey: ["admin-parent-accounts"] });
    },
  });
  const toggleMut = useMutation({
    mutationFn: ({ studentId, isActive }: { studentId: number; isActive: boolean }) =>
      setActive({ data: { studentId, isActive } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-parent-accounts"] }),
  });

  const branches = useMemo(
    () => Array.from(new Set(rows.map((r) => r.branch).filter(Boolean))).sort(),
    [rows],
  );

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-[color:var(--navy)] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/admin" className="text-xs text-white/70 flex items-center gap-1 hover:text-white">
            <ArrowLeft className="w-3 h-3" /> Admin Console
          </Link>
          <h1 className="text-2xl font-bold mt-1">Parent Login Accounts</h1>
          <p className="text-xs text-white/70 mt-0.5">
            Every active student has a parent login as <code className="bg-white/10 px-1 rounded">p-&lt;enrollment&gt;</code>.
            Reset passwords or disable access here.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-4">
        {/* Filters */}
        <div className="bg-white border rounded p-3 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Enrollment or name"
                className="border rounded pl-8 pr-3 py-2 text-sm w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="border rounded px-3 py-2 text-sm">
              <option value="">All</option>
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Semester</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="border rounded px-3 py-2 text-sm">
              <option value="">All</option>
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-500 ml-auto">
            {q.isFetching ? "Loading…" : `${rows.length} account${rows.length === 1 ? "" : "s"}`}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Student</th>
                <th className="text-left px-3 py-2 font-medium">Username</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-left px-3 py-2 font-medium">Last Login</th>
                <th className="text-left px-3 py-2 font-medium">Last Logout</th>
                <th className="text-left px-3 py-2 font-medium">Password Updated</th>
                <th className="text-right px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student_id} className="border-t">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-gray-800">{r.name}</p>
                    <p className="text-[11px] text-gray-500 font-mono">
                      {r.enrollment_no} · {r.branch}-Sem{r.semester}
                    </p>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">p-{r.enrollment_no}</td>
                  <td className="px-3 py-2">
                    {!r.provisioned ? (
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">Not provisioned</span>
                    ) : r.is_active ? (
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Active</span>
                    ) : (
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800">Disabled</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.last_login_event ? (
                      <>
                        <div>{fmt(r.last_login_event.at)}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{r.last_login_event.ip ?? "—"}</div>
                      </>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.last_logout_event ? (
                      <>
                        <div>{fmt(r.last_logout_event.at)}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{r.last_logout_event.ip ?? "—"}</div>
                      </>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">{fmt(r.password_updated_at)}</td>
                  <td className="px-3 py-2 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => {
                        if (confirm(`Reset password for ${r.name} to "Welcome@123"?`)) resetMut.mutate(r.student_id);
                      }}
                      disabled={resetMut.isPending}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-amber-50 text-amber-800 border-amber-200"
                      title="Reset password to Welcome@123"
                    >
                      <KeyRound className="w-3 h-3" /> Reset
                    </button>
                    {r.provisioned && (
                      <button
                        onClick={() => toggleMut.mutate({ studentId: r.student_id, isActive: !r.is_active })}
                        disabled={toggleMut.isPending}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 border rounded ${
                          r.is_active
                            ? "hover:bg-rose-50 text-rose-800 border-rose-200"
                            : "hover:bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {r.is_active ? <ShieldOff className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                        {r.is_active ? "Disable" : "Enable"}
                      </button>
                    )}
                    <button
                      onClick={() => setDrawer({ studentId: r.student_id, name: r.name, enrollment: r.enrollment_no })}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-gray-50"
                    >
                      <History className="w-3 h-3" /> Audit
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !q.isFetching && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-gray-400 text-sm">
                    No students match the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Reset-password result modal */}
      {resetResult && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setResetResult(null)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">Password reset</h3>
              <button onClick={() => setResetResult(null)}><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <p className="text-sm text-gray-700 mb-3">Share these credentials with the parent:</p>
            <div className="bg-gray-50 border rounded p-3 font-mono text-sm space-y-1">
              <div>Username: <b>p-{resetResult.enrollment}</b></div>
              <div>Password: <b>{resetResult.password}</b></div>
            </div>
            <p className="text-[11px] text-gray-500 mt-3">
              The parent (or student) can change this later from the student portal's Parent Password setting.
            </p>
          </div>
        </div>
      )}

      {/* Audit drawer */}
      {drawer && <AuditDrawer info={drawer} onClose={() => setDrawer(null)} />}
    </div>
  );
}

function AuditDrawer({ info, onClose }: { info: { studentId: number; name: string; enrollment: string }; onClose: () => void }) {
  const fn = useServerFn(adminParentAuditEvents);
  const q = useQuery({
    queryKey: ["parent-audit", info.studentId],
    queryFn: () => fn({ data: { studentId: info.studentId, limit: 100 } }),
  });
  const rows: any[] = q.data ?? [];
  const badge = (a: string) => {
    if (a === "parent_login_success") return "bg-emerald-100 text-emerald-800";
    if (a === "parent_login_failure") return "bg-rose-100 text-rose-800";
    if (a === "parent_logout") return "bg-gray-100 text-gray-700";
    if (a === "parent_password_reset") return "bg-amber-100 text-amber-800";
    if (a === "parent_enabled") return "bg-emerald-100 text-emerald-800";
    if (a === "parent_disabled") return "bg-rose-100 text-rose-800";
    return "bg-sky-100 text-sky-800";
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-stretch justify-end z-50" onClick={onClose}>
      <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-800">Audit events</h3>
            <p className="text-xs text-gray-500 font-mono">{info.name} · p-{info.enrollment}</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        {q.isLoading && <p className="text-sm text-gray-400">Loading…</p>}
        {!q.isLoading && rows.length === 0 && (
          <p className="text-sm text-gray-500 bg-gray-50 border rounded p-4">No audit events recorded.</p>
        )}
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="border rounded p-3">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${badge(r.action)}`}>
                  {String(r.action).replace(/_/g, " ")}
                </span>
                <span className="text-[11px] text-gray-500">{fmt(r.created_at)}</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1 font-mono">
                {r.actor_type} · IP {r.ip ?? "—"}
              </div>
              {r.details && Object.keys(r.details).length > 0 && (
                <pre className="text-[11px] bg-gray-50 border rounded mt-2 p-2 overflow-x-auto">
{JSON.stringify(r.details, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
