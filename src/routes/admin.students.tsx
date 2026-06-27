import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, KeyRound, Search } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles, hasRole } from "@/lib/roles";
import { studentList, studentCreate, studentUpdate, studentDelete, studentResetPassword } from "@/lib/people.functions";

export const Route = createFileRoute("/admin/students")({
  head: () => portalMeta("Student Management"),
  component: StudentManagement,
});

type Student = Awaited<ReturnType<typeof studentList>>[number];

const BRANCHES = ["civil", "mechanical", "applied_science"];

function StudentManagement() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!hasRole(me, adminRoles)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const qc = useQueryClient();
  const listQ = useQuery({ queryKey: ["student-list"], queryFn: () => studentList({ data: {} }) });
  const [editing, setEditing] = useState<Student | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const del = useMutation({
    mutationFn: (id: number) => studentDelete({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["student-list"] }),
  });
  const resetPw = useMutation({
    mutationFn: (v: { id: number; newPassword: string }) => studentResetPassword({ data: v }),
  });

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  const rows = (listQ.data ?? []).filter((s: any) => {
    if (branchFilter && s.branch !== branchFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(q) ||
      (s.enrollment_no || "").toLowerCase().includes(q) ||
      (s.father_name || "").toLowerCase().includes(q) ||
      (s.aadhaar_number || "").includes(search)
    );
  });

  return (
    <PortalShell title="Student Management" subtitle="Student records & details" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 border rounded px-3 py-1.5 hover:bg-gray-50 bg-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Admin Console
          </Link>
          <button
            onClick={() => setCreating(true)}
            className="bg-[#7b1f4c] text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>

        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Student Records</h1>
              <p className="text-xs text-gray-400">
                {rows.length} record{rows.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">All branches</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, enrollment…"
                  className="border rounded pl-8 pr-3 py-2 text-sm w-56"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border rounded">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Student</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Father / Guardian</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Class</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Parent Phone</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Aadhaar</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Bank A/C</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s: any) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-400 font-mono">
                        {s.enrollment_no}
                        {s.is_active ? "" : " · inactive"}
                      </p>
                    </td>
                    <td className="px-4 py-3">{s.father_name || s.guardian_name || "—"}</td>
                    <td className="px-4 py-3 capitalize text-xs">
                      {s.branch}-Sem{s.semester}
                    </td>
                    <td className="px-4 py-3">{s.parent_phone ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.aadhaar_number ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.bank_account_number ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => setEditing(s)}
                          className="text-gray-500 hover:text-gray-700"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const p = prompt(`New password for ${s.enrollment_no} (min 6 chars):`);
                            if (p) resetPw.mutate({ id: s.id, newPassword: p });
                          }}
                          className="text-gray-500 hover:text-gray-700"
                          title="Reset password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${s.name}? This removes their login too.`)) del.mutate(s.id);
                          }}
                          className="text-rose-500 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      {listQ.isLoading ? "Loading…" : "No students found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {resetPw.isSuccess && <p className="text-xs text-green-700 mt-2">Password reset.</p>}
        </div>
      </div>

      {(creating || editing) && (
        <StudentForm
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["student-list"] });
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </PortalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function StudentForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Student | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const create = useMutation({ mutationFn: (d: any) => studentCreate({ data: d }), onSuccess: onSaved });
  const update = useMutation({ mutationFn: (d: any) => studentUpdate({ data: d }), onSuccess: onSaved });
  const busy = create.isPending || update.isPending;
  const err = (create.error || update.error) as Error | null;
  const thisYear = new Date().getFullYear();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const base: any = {
      name: fd.get("name"),
      father_name: fd.get("father_name") || null,
      guardian_name: fd.get("guardian_name") || null,
      dob: fd.get("dob") || null,
      branch: fd.get("branch"),
      semester: Number(fd.get("semester")),
      batch_year: Number(fd.get("batch_year")),
      address: fd.get("address") || null,
      aadhaar_number: fd.get("aadhaar_number") || null,
      phone: fd.get("phone") || null,
      parent_phone: fd.get("parent_phone") || null,
      email: fd.get("email") || null,
      bank_account_number: fd.get("bank_account_number") || null,
    };
    if (isEdit) {
      update.mutate({ id: (initial as any).id, enrollment_no: fd.get("enrollment_no") || undefined, ...base });
    } else {
      create.mutate({ ...base, enrollment_no: fd.get("enrollment_no"), password: fd.get("password") });
    }
  }

  const v = (initial ?? {}) as any;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="bg-white rounded-lg w-full max-w-3xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b sticky top-0 bg-white rounded-t-lg">
          <h3 className="font-bold text-lg">{isEdit ? "Edit Student" : "Add Student"}</h3>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4 text-sm">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Name">
              <input name="name" defaultValue={v.name ?? ""} required className="border rounded w-full px-3 py-2" />
            </Field>
            <Field label="Father's Name">
              <input
                name="father_name"
                defaultValue={v.father_name ?? ""}
                className="border rounded w-full px-3 py-2"
              />
            </Field>
            <Field label="Guardian's Name">
              <input
                name="guardian_name"
                defaultValue={v.guardian_name ?? ""}
                className="border rounded w-full px-3 py-2"
              />
            </Field>
            <Field label="Date of Birth">
              <input name="dob" type="date" defaultValue={v.dob ?? ""} className="border rounded w-full px-3 py-2" />
            </Field>
            <Field label="Department">
              <select
                name="branch"
                defaultValue={v.branch ?? "civil"}
                required
                className="border rounded w-full px-3 py-2 bg-white"
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Semester">
              <select
                name="semester"
                defaultValue={v.semester ?? 1}
                required
                className="border rounded w-full px-3 py-2 bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Batch Year">
              <input
                name="batch_year"
                type="number"
                defaultValue={v.batch_year ?? thisYear}
                required
                min={2000}
                max={2100}
                className="border rounded w-full px-3 py-2"
              />
            </Field>
            <Field label="Aadhaar Number">
              <input
                name="aadhaar_number"
                defaultValue={v.aadhaar_number ?? ""}
                className="border rounded w-full px-3 py-2"
              />
            </Field>
            <Field label="Bank Account Number">
              <input
                name="bank_account_number"
                defaultValue={v.bank_account_number ?? ""}
                className="border rounded w-full px-3 py-2"
              />
            </Field>
            <Field label="Student Phone">
              <input name="phone" defaultValue={v.phone ?? ""} className="border rounded w-full px-3 py-2" />
            </Field>
            <Field label="Parent Mobile Number">
              <input
                name="parent_phone"
                defaultValue={v.parent_phone ?? ""}
                className="border rounded w-full px-3 py-2"
              />
            </Field>
            <Field label="Email ID">
              <input
                name="email"
                type="email"
                defaultValue={v.email ?? ""}
                className="border rounded w-full px-3 py-2"
              />
            </Field>
          </div>
          <Field label="Address">
            <textarea
              name="address"
              rows={2}
              defaultValue={v.address ?? ""}
              className="border rounded w-full px-3 py-2 resize-y"
            />
          </Field>

          <div className="border-t pt-4 grid sm:grid-cols-2 gap-4">
            <Field label="Enrollment No.">
              <input
                name="enrollment_no"
                defaultValue={v.enrollment_no ?? ""}
                required
                className="border rounded w-full px-3 py-2"
              />
            </Field>
            {!isEdit && (
              <Field label="Password (min 6)">
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="border rounded w-full px-3 py-2"
                />
              </Field>
            )}
          </div>

          {err && <p className="text-xs text-rose-700">{err.message}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="border px-4 py-2 rounded">
              Cancel
            </button>
            <button
              disabled={busy}
              className="bg-[#7b1f4c] text-white px-5 py-2 rounded font-semibold disabled:opacity-50"
            >
              {busy ? "Saving…" : isEdit ? "Save Changes" : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
