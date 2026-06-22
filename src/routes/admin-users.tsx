import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { staffMe } from "@/lib/auth.functions";
import {
  adminListStaff, adminListStudents,
  adminCreateStaff, adminCreateStudent,
  adminResetStaffPassword, adminResetStudentPassword,
  adminToggleStaffActive, adminToggleStudentActive,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin-users")({
  head: () => ({ meta: [{ title: "User Management — GP Kinnaur" }] }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading: meLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  const [tab, setTab] = useState<"staff" | "students">("staff");

  useEffect(() => {
    if (meLoading) return;
    if (!me) navigate({ to: "/staff-login" });
    else if (me.role !== "super_admin" && me.role !== "admin_staff") navigate({ to: "/staff-dashboard" });
  }, [me, meLoading, navigate]);

  const staffQ = useQuery({ queryKey: ["admin-staff"], queryFn: () => adminListStaff(), enabled: !!me });
  const studentQ = useQuery({ queryKey: ["admin-students"], queryFn: () => adminListStudents(), enabled: !!me });

  const invalidate = (k: string) => qc.invalidateQueries({ queryKey: [k] });

  if (meLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-[color:var(--navy)] text-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-[color:var(--gold)] font-semibold uppercase">Admin · User Management</p>
            <p className="font-bold">GP Kinnaur Portal</p>
          </div>
          <Link to="/staff-dashboard" className="text-sm px-3 py-1.5 border border-white/40 rounded">← Dashboard</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("staff")} className={`px-4 py-2 rounded ${tab === "staff" ? "bg-[color:var(--navy)] text-white" : "bg-white border"}`}>Staff ({staffQ.data?.length ?? "…"})</button>
          <button onClick={() => setTab("students")} className={`px-4 py-2 rounded ${tab === "students" ? "bg-[color:var(--navy)] text-white" : "bg-white border"}`}>Students ({studentQ.data?.length ?? "…"})</button>
        </div>

        {tab === "staff" ? (
          <StaffPanel
            rows={staffQ.data ?? []}
            canToggle={me.role === "super_admin"}
            onChange={() => invalidate("admin-staff")}
          />
        ) : (
          <StudentPanel
            rows={studentQ.data ?? []}
            onChange={() => invalidate("admin-students")}
          />
        )}
      </div>
    </div>
  );
}

function CreateStaffForm({ onDone }: { onDone: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: (d: any) => adminCreateStaff({ data: d }),
    onSuccess: () => { setMsg("Created."); onDone(); },
    onError: (e: any) => setMsg(e.message),
  });
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      m.mutate({
        username: String(f.get("username")),
        role: String(f.get("role")),
        department: String(f.get("department") || ""),
        password: String(f.get("password")),
      });
      (e.currentTarget as HTMLFormElement).reset();
    }} className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-white border rounded p-3 mb-4">
      <input name="username" placeholder="username" required className="border rounded px-2 py-1.5 text-sm" />
      <select name="role" defaultValue="faculty" className="border rounded px-2 py-1.5 text-sm">
        <option value="faculty">Faculty</option>
        <option value="hod">HoD</option>
        <option value="principal">Principal</option>
        <option value="admin_staff">Admin Staff</option>
        <option value="super_admin">Super Admin</option>
      </select>
      <input name="department" placeholder="Department (optional)" className="border rounded px-2 py-1.5 text-sm" />
      <input name="password" type="password" placeholder="Temp password (≥8)" required minLength={8} autoComplete="new-password" className="border rounded px-2 py-1.5 text-sm" />
      <button disabled={m.isPending} className="bg-[color:var(--navy)] text-white rounded px-3 py-1.5 text-sm font-semibold disabled:opacity-50">
        {m.isPending ? "Creating…" : "+ Add Staff"}
      </button>
      {msg && <p className="md:col-span-5 text-xs">{msg}</p>}
    </form>
  );
}

function StaffPanel({ rows, canToggle, onChange }: { rows: any[]; canToggle: boolean; onChange: () => void }) {
  const reset = useMutation({ mutationFn: (d: any) => adminResetStaffPassword({ data: d }), onSuccess: onChange });
  const toggle = useMutation({ mutationFn: (d: any) => adminToggleStaffActive({ data: d }), onSuccess: onChange });
  const [resetTarget, setResetTarget] = useState<{ id: number; label: string } | null>(null);
  return (
    <>
      <CreateStaffForm onDone={onChange} />
      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary"><tr>
            <th className="px-3 py-2 text-left">ID</th>
            <th className="px-3 py-2 text-left">Username</th>
            <th className="px-3 py-2 text-left">Role</th>
            <th className="px-3 py-2 text-left">Department</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Last Login</th>
            <th className="px-3 py-2 text-left">Actions</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.id}</td>
                <td className="px-3 py-2 font-medium">{r.username}</td>
                <td className="px-3 py-2">{r.role}</td>
                <td className="px-3 py-2">{r.department ?? "—"}</td>
                <td className="px-3 py-2">{r.is_active ? <span className="text-green-700">Active</span> : <span className="text-rose-700">Disabled</span>}</td>
                <td className="px-3 py-2 text-xs">{r.last_login ? new Date(r.last_login).toLocaleString() : "—"}</td>
                <td className="px-3 py-2 flex gap-2">
                  <button onClick={() => setResetTarget({ id: r.id, label: r.username })} className="text-xs px-2 py-1 border rounded">Reset PW</button>
                  {canToggle && (
                    <button onClick={() => toggle.mutate({ id: r.id, active: !r.is_active })}
                      className={`text-xs px-2 py-1 rounded ${r.is_active ? "bg-rose-100 text-rose-700" : "bg-green-100 text-green-700"}`}>
                      {r.is_active ? "Disable" : "Enable"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {resetTarget && (
        <ResetPasswordDialog
          label={resetTarget.label}
          minLen={8}
          onCancel={() => setResetTarget(null)}
          onSubmit={(pw) => { reset.mutate({ id: resetTarget.id, newPassword: pw }); setResetTarget(null); }}
        />
      )}
    </>
  );
}

function ResetPasswordDialog({ label, minLen, onSubmit, onCancel }: { label: string; minLen: number; onSubmit: (pw: string) => void; onCancel: () => void }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-[color:var(--navy)] mb-1">Reset Password</h3>
        <p className="text-xs text-muted-foreground mb-3">For <b>{label}</b> (min {minLen} chars)</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (pw.length < minLen) { setErr(`Must be at least ${minLen} characters`); return; }
          if (pw !== confirm) { setErr("Passwords do not match"); return; }
          onSubmit(pw);
        }} className="space-y-2">
          <input autoFocus type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" className="w-full border rounded px-3 py-2 text-sm" />
          <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" className="w-full border rounded px-3 py-2 text-sm" />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onCancel} className="text-sm px-3 py-1.5 border rounded">Cancel</button>
            <button type="submit" className="text-sm px-3 py-1.5 bg-[color:var(--navy)] text-white rounded">Update</button>
          </div>
        </form>
      </div>
    </div>
  );
}


function CreateStudentForm({ onDone }: { onDone: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: (d: any) => adminCreateStudent({ data: d }),
    onSuccess: () => { setMsg("Created."); onDone(); },
    onError: (e: any) => setMsg(e.message),
  });
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      m.mutate({
        enrollment_no: String(f.get("enrollment_no")),
        name: String(f.get("name")),
        branch: String(f.get("branch")),
        semester: Number(f.get("semester")),
        batch_year: Number(f.get("batch_year")),
        email: String(f.get("email") || ""),
        phone: String(f.get("phone") || ""),
        password: String(f.get("password")),
      });
      (e.currentTarget as HTMLFormElement).reset();
    }} className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white border rounded p-3 mb-4">
      <input name="enrollment_no" placeholder="Enrollment No" required className="border rounded px-2 py-1.5 text-sm" />
      <input name="name" placeholder="Full Name" required className="border rounded px-2 py-1.5 text-sm" />
      <input name="branch" placeholder="Branch (e.g. CSE)" required className="border rounded px-2 py-1.5 text-sm" />
      <input name="semester" type="number" min={1} max={8} placeholder="Sem" required className="border rounded px-2 py-1.5 text-sm" />
      <input name="batch_year" type="number" min={2000} max={2100} placeholder="Batch Year" required className="border rounded px-2 py-1.5 text-sm" />
      <input name="email" type="email" placeholder="Email (optional)" className="border rounded px-2 py-1.5 text-sm" />
      <input name="phone" placeholder="Phone (optional)" className="border rounded px-2 py-1.5 text-sm" />
      <input name="password" type="password" placeholder="Temp password (≥6)" required minLength={6} autoComplete="new-password" className="border rounded px-2 py-1.5 text-sm" />
      <button disabled={m.isPending} className="md:col-span-4 bg-[color:var(--student)] text-white rounded px-3 py-2 text-sm font-semibold disabled:opacity-50">
        {m.isPending ? "Creating…" : "+ Add Student"}
      </button>
      {msg && <p className="col-span-2 md:col-span-4 text-xs">{msg}</p>}
    </form>
  );
}

function StudentPanel({ rows, onChange }: { rows: any[]; onChange: () => void }) {
  const reset = useMutation({ mutationFn: (d: any) => adminResetStudentPassword({ data: d }), onSuccess: onChange });
  const toggle = useMutation({ mutationFn: (d: any) => adminToggleStudentActive({ data: d }), onSuccess: onChange });
  const [q, setQ] = useState("");
  const filtered = rows.filter((r) => !q || r.enrollment_no.toLowerCase().includes(q.toLowerCase()) || r.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <CreateStudentForm onDone={onChange} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or enrollment no…" className="w-full mb-3 border rounded px-3 py-2 text-sm" />
      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary"><tr>
            <th className="px-3 py-2 text-left">Enrollment</th>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">Branch</th>
            <th className="px-3 py-2 text-left">Sem</th>
            <th className="px-3 py-2 text-left">Batch</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2 font-mono">{r.enrollment_no}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.branch}</td>
                <td className="px-3 py-2">{r.semester}</td>
                <td className="px-3 py-2">{r.batch_year}</td>
                <td className="px-3 py-2">{r.is_active ? <span className="text-green-700">Active</span> : <span className="text-rose-700">Disabled</span>}</td>
                <td className="px-3 py-2 flex gap-2">
                  <button onClick={() => {
                    const p = prompt(`New password for ${r.enrollment_no} (min 6 chars):`);
                    if (p && p.length >= 6) reset.mutate({ id: r.id, newPassword: p });
                  }} className="text-xs px-2 py-1 border rounded">Reset PW</button>
                  <button onClick={() => toggle.mutate({ id: r.id, active: !r.is_active })}
                    className={`text-xs px-2 py-1 rounded ${r.is_active ? "bg-rose-100 text-rose-700" : "bg-green-100 text-green-700"}`}>
                    {r.is_active ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
