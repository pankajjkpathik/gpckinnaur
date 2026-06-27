import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, KeyRound, Search } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles, hasRole } from "@/lib/roles";
import { facultyList, facultyCreate, facultyUpdate, facultyDelete, facultyResetPassword } from "@/lib/people.functions";
import { facultyPhoto } from "@/lib/faculty-photos";

export const Route = createFileRoute("/admin/faculty")({
  head: () => portalMeta("Faculty Management"),
  component: FacultyManagement,
});

type Faculty = Awaited<ReturnType<typeof facultyList>>[number];

const BRANCHES = ["civil", "mechanical", "applied_science"];

function FacultyManagement() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!hasRole(me, adminRoles)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const qc = useQueryClient();
  const listQ = useQuery({ queryKey: ["faculty-list"], queryFn: () => facultyList({ data: {} }) });
  const [editing, setEditing] = useState<Faculty | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const del = useMutation({
    mutationFn: (id: number) => facultyDelete({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["faculty-list"] }),
  });
  const resetPw = useMutation({
    mutationFn: (v: { id: number; newPassword: string }) => facultyResetPassword({ data: v }),
  });

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  const rows = (listQ.data ?? []).filter((f: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (f.name || "").toLowerCase().includes(s) ||
      (f.username || "").toLowerCase().includes(s) ||
      (f.designation || "").toLowerCase().includes(s) ||
      (f.department || "").toLowerCase().includes(s) ||
      (f.pmis_number || "").toLowerCase().includes(s) ||
      (f.ip_number || "").toLowerCase().includes(s)
    );
  });

  return (
    <PortalShell title="Faculty Management" subtitle="Department teaching staff records" me={me as any} accent="rose">
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
            <Plus className="w-4 h-4" /> Add Faculty
          </button>
        </div>

        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Existing Faculty Members</h1>
              <p className="text-xs text-gray-400">
                {rows.length} record{rows.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, PMIS, dept…"
                className="border rounded pl-8 pr-3 py-2 text-sm w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto border rounded">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Photo</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Designation</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Department</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">PMIS No.</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">DOJ</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f: any) => (
                  <tr key={f.id} className="border-t">
                    <td className="px-4 py-3">
                      {facultyPhoto(f.name) ? (
                        <img src={facultyPhoto(f.name)!} alt={f.name ?? ""} className="w-10 h-10 rounded-full object-cover border" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">—</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{f.name || <span className="text-gray-400 italic">(no name)</span>}</p>
                      <p className="text-xs text-gray-400">
                        @{f.username} · {f.role}
                        {f.is_active ? "" : " · inactive"}
                      </p>
                    </td>
                    <td className="px-4 py-3">{f.designation ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{f.department ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{f.pmis_number ?? "—"}</td>
                    <td className="px-4 py-3">{f.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{f.email ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{f.date_of_joining ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => setEditing(f)}
                          className="text-gray-500 hover:text-gray-700"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const p = prompt(`New password for ${f.username} (min 8 chars):`);
                            if (p) resetPw.mutate({ id: f.id, newPassword: p });
                          }}
                          className="text-gray-500 hover:text-gray-700"
                          title="Reset password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${f.name || f.username}? This removes their login too.`))
                              del.mutate(f.id);
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
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      {listQ.isLoading ? "Loading…" : "No faculty found."}
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
        <FacultyForm
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["faculty-list"] });
            setCreating(false);
            setEditing(null);
          }}
          canPrincipal={me.role === "super_admin"}
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

function FacultyForm({
  initial,
  onClose,
  onSaved,
  canPrincipal,
}: {
  initial: Faculty | null;
  onClose: () => void;
  onSaved: () => void;
  canPrincipal: boolean;
}) {
  const isEdit = !!initial;
  const create = useMutation({ mutationFn: (d: any) => facultyCreate({ data: d }), onSuccess: onSaved });
  const update = useMutation({ mutationFn: (d: any) => facultyUpdate({ data: d }), onSuccess: onSaved });
  const busy = create.isPending || update.isPending;
  const err = (create.error || update.error) as Error | null;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const base: any = {
      name: fd.get("name") || null,
      designation: fd.get("designation") || null,
      dob: fd.get("dob") || null,
      ip_number: fd.get("ip_number") || null,
      pmis_number: fd.get("pmis_number") || null,
      department: fd.get("department") || null,
      phone: fd.get("phone") || null,
      email: fd.get("email") || null,
      last_salary_drawn: fd.get("last_salary_drawn") ? Number(fd.get("last_salary_drawn")) : null,
      address: fd.get("address") || null,
      date_of_joining: fd.get("date_of_joining") || null,
      date_of_retirement: fd.get("date_of_retirement") || null,
      role: fd.get("role") || "faculty",
      extra_roles: fd.getAll("extra_roles") as string[],
    };
    if (isEdit) {
      update.mutate({ id: (initial as any).id, username: fd.get("username") || undefined, ...base });
    } else {
      create.mutate({ ...base, username: fd.get("username"), password: fd.get("password") });
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
          <h3 className="font-bold text-lg">{isEdit ? "Edit Faculty" : "Add Faculty"}</h3>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4 text-sm">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Name">
              <input name="name" defaultValue={v.name ?? ""} className="border rounded w-full px-3 py-2" />
            </Field>
            <Field label="Designation">
              <input
                name="designation"
                defaultValue={v.designation ?? ""}
                placeholder="e.g. Lecturer"
                className="border rounded w-full px-3 py-2"
              />
            </Field>
            <Field label="Department">
              <select
                name="department"
                defaultValue={v.department ?? ""}
                className="border rounded w-full px-3 py-2 bg-white"
              >
                <option value="">—</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date of Birth">
              <input name="dob" type="date" defaultValue={v.dob ?? ""} className="border rounded w-full px-3 py-2" />
            </Field>
            <Field label="IP Number">
              <input name="ip_number" defaultValue={v.ip_number ?? ""} className="border rounded w-full px-3 py-2" />
            </Field>
            <Field label="PMIS Number">
              <input
                name="pmis_number"
                defaultValue={v.pmis_number ?? ""}
                className="border rounded w-full px-3 py-2"
              />
            </Field>
            <Field label="Phone Number">
              <input name="phone" defaultValue={v.phone ?? ""} className="border rounded w-full px-3 py-2" />
            </Field>
            <Field label="Email">
              <input
                name="email"
                type="email"
                defaultValue={v.email ?? ""}
                className="border rounded w-full px-3 py-2"
              />
            </Field>
            <Field label="Last Salary Drawn (₹)">
              <input
                name="last_salary_drawn"
                type="number"
                step="0.01"
                defaultValue={v.last_salary_drawn ?? ""}
                className="border rounded w-full px-3 py-2"
              />
            </Field>
            <Field label="Date of Joining">
              <input
                name="date_of_joining"
                type="date"
                defaultValue={v.date_of_joining ?? ""}
                className="border rounded w-full px-3 py-2"
              />
            </Field>
            <Field label="Date of Retirement">
              <input
                name="date_of_retirement"
                type="date"
                defaultValue={v.date_of_retirement ?? ""}
                className="border rounded w-full px-3 py-2"
              />
            </Field>
            <Field label="Primary Role">
              <select
                name="role"
                defaultValue={v.role ?? "faculty"}
                className="border rounded w-full px-3 py-2 bg-white"
              >
                <option value="faculty">faculty</option>
                <option value="hod">hod</option>
                <option value="tpo">tpo</option>
                <option value="admin_staff">admin_staff</option>
                <option value="clerk">clerk</option>
                {canPrincipal && <option value="principal">principal</option>}
              </select>
            </Field>
          </div>

          <Field label="Additional Roles (multi-role access)">
            <div className="flex flex-wrap gap-3 border rounded px-3 py-2">
              {(["faculty", "hod", "tpo", "admin_staff", "clerk"] as const).map((r) => (
                <label key={r} className="inline-flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    name="extra_roles"
                    value={r}
                    defaultChecked={Array.isArray(v.extra_roles) && v.extra_roles.includes(r)}
                    className="accent-[#7b1f4c]"
                  />
                  {r}
                </label>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              e.g. tick <strong>tpo</strong> to give a faculty member Training &amp; Placement access. HOD already
              implies faculty access.
            </p>
          </Field>
          <Field label="Address">
            <textarea
              name="address"
              rows={2}
              defaultValue={v.address ?? ""}
              className="border rounded w-full px-3 py-2 resize-y"
            />
          </Field>

          <div className="border-t pt-4 grid sm:grid-cols-2 gap-4">
            <Field label="Login Username">
              <input
                name="username"
                defaultValue={v.username ?? ""}
                required
                className="border rounded w-full px-3 py-2"
              />
            </Field>
            {!isEdit && (
              <Field label="Password (min 8)">
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
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
              {busy ? "Saving…" : isEdit ? "Save Changes" : "Create Faculty"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
