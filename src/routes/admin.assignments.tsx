import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles, hasRole } from "@/lib/roles";
import {
  listAssignments,
  upsertAssignment,
  deleteAssignment,
  listStaffByRole,
  listSubjects,
  bulkImportAssignments,
  bulkDeleteAssignments,
} from "@/lib/academic.functions";
import { BulkOpsBar } from "@/components/admin/BulkOpsBar";

export const Route = createFileRoute("/admin/assignments")({
  head: () => portalMeta("Faculty Assignments"),
  component: AssignmentsPage,
});

const ASSIGN_SAMPLE = [
  { username: "prof.sharma", subject_code: "CE301", branch: "civil", semester: 3, academic_year: "2025-26" },
  { username: "prof.verma", subject_code: "ME201", branch: "mechanical", semester: 2, academic_year: "2025-26" },
];

function AssignmentsPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!hasRole(me, adminRoles)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const [year, setYear] = useState("2026-27");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({ branch: "", semester: 0, subject_id: 0, staff_id: 0 });

  const assignQ = useQuery({
    queryKey: ["assignments", year],
    queryFn: () => listAssignments({ data: { academic_year: year } as any }),
    enabled: !!me,
  });
  const staffQ = useQuery({
    queryKey: ["staff-faculty"],
    queryFn: () => listStaffByRole({ data: {} as any }),
    enabled: !!me,
  });
  // Cascading subjects: only fetch once branch + semester are chosen.
  const subjQ = useQuery({
    queryKey: ["subjects-of", form.branch, form.semester],
    queryFn: () => listSubjects({ data: { branch: form.branch, semester: form.semester } as any }),
    enabled: !!me && !!form.branch && !!form.semester,
  });

  const save = useMutation({
    mutationFn: (d: any) => upsertAssignment({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      setForm((f) => ({ ...f, subject_id: 0, staff_id: 0 }));
    },
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteAssignment({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });

  const toggle = (id: number) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    const ids = (assignQ.data ?? []).map((r: any) => r.id);
    setSelected(selected.size === ids.length ? new Set() : new Set(ids));
  };

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  const BRANCHES: Array<[string, string]> = [
    ["civil", "Civil Engineering"],
    ["mechanical", "Mechanical Engineering"],
    ["applied_science", "Applied Sciences"],
  ];

  return (
    <PortalShell title="Faculty Assignments" subtitle="Admin · Teaching Allocation" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm">Academic Year</label>
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            pattern="\d{4}-\d{2}"
            className="border rounded px-2 py-1.5 text-sm"
          />
          <div className="ml-auto">
            <BulkOpsBar
              sample={ASSIGN_SAMPLE}
              sampleName="faculty-assignments-sample"
              onImport={async (rows) => {
                const r = await bulkImportAssignments({ data: { rows } });
                qc.invalidateQueries({ queryKey: ["assignments"] });
                return r;
              }}
              selectedCount={selected.size}
              onBulkDelete={async () => {
                await bulkDeleteAssignments({ data: { ids: Array.from(selected) } });
                setSelected(new Set());
                qc.invalidateQueries({ queryKey: ["assignments"] });
              }}
            />
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.staff_id || !form.subject_id || !form.branch || !form.semester) return;
            save.mutate({ ...form, academic_year: year });
          }}
          className="bg-white border rounded p-3 grid sm:grid-cols-5 gap-2 items-end"
        >
          <label className="text-xs">
            1. Branch
            <select
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value, semester: 0, subject_id: 0 })}
              required
              className="w-full border rounded px-2 py-1.5 text-sm bg-white"
            >
              <option value="">— select —</option>
              {BRANCHES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            2. Semester
            <select
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: Number(e.target.value), subject_id: 0 })}
              required
              disabled={!form.branch}
              className="w-full border rounded px-2 py-1.5 text-sm bg-white disabled:bg-gray-100"
            >
              <option value={0}>— select —</option>
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <option key={s} value={s}>
                  Sem {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            3. Subject
            <select
              value={form.subject_id}
              onChange={(e) => setForm({ ...form, subject_id: Number(e.target.value) })}
              required
              disabled={!form.semester}
              className="w-full border rounded px-2 py-1.5 text-sm bg-white disabled:bg-gray-100"
            >
              <option value={0}>
                {!form.semester
                  ? "— pick branch + sem first —"
                  : (subjQ.data ?? []).length === 0
                  ? "— no subjects —"
                  : "— select —"}
              </option>
              {(subjQ.data ?? []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            4. Faculty
            <select
              value={form.staff_id}
              onChange={(e) => setForm({ ...form, staff_id: Number(e.target.value) })}
              required
              disabled={!form.subject_id}
              className="w-full border rounded px-2 py-1.5 text-sm bg-white disabled:bg-gray-100"
            >
              <option value={0}>— select —</option>
              {(staffQ.data ?? [])
                .filter((s: any) => ["faculty", "hod"].includes(s.role) || (s.extra_roles ?? []).includes("faculty"))
                .map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.username} ({s.role})
                  </option>
                ))}
            </select>
          </label>
          <button
            disabled={save.isPending || !form.staff_id}
            className="bg-rose-700 text-white rounded px-3 py-2 text-sm font-semibold inline-flex items-center gap-1 justify-center disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Assign
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
                    checked={selected.size > 0 && selected.size === (assignQ.data ?? []).length}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-3 py-2 text-left">Faculty</th>
                <th className="px-3 py-2 text-left">Subject</th>
                <th className="px-3 py-2 text-left">Class</th>
                <th className="px-3 py-2 text-left">Year</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(assignQ.data ?? []).map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggle(a.id)} />
                  </td>
                  <td className="px-3 py-2">{a.staff_users?.username ?? `#${a.staff_id}`}</td>
                  <td className="px-3 py-2">
                    {a.subjects?.code} — {a.subjects?.name}
                  </td>
                  <td className="px-3 py-2 capitalize">
                    {a.branch} · Sem {a.semester}
                  </td>
                  <td className="px-3 py-2">{a.academic_year}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => confirm("Remove?") && del.mutate(a.id)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {(assignQ.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-muted-foreground">
                    No assignments for {year}.
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
