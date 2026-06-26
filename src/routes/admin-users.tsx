import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { staffMe } from "@/lib/auth.functions";
import {
  adminListStaff, adminListStudents,
  adminCreateStaff, adminCreateStudent,
  adminResetStaffPassword, adminResetStudentPassword,
  adminToggleStaffActive, adminToggleStudentActive,
  adminDeleteStaff, adminDeleteStudent,
  adminUpdateStaff, adminUpdateStudent,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin-users")({
  head: () => ({ meta: [
    { title: "User Management — GP Kinnaur" },
    { name: "description", content: "User Management — GP Kinnaur (internal portal)." },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: AdminUsersPage,
});

// ── User-ID suggestion rule (per spec) ─────────────────────────────────────
function suggestUserId(role: string, name: string) {
  const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9.]+/g, ".").replace(/^\.+|\.+$/g, "");
  if (role === "principal" || role === "hod" || role === "tpo") return role;
  if (role === "faculty") return name ? slug(name) : "";
  return name ? slug(name) : "";
}

function AdminUsersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading: meLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  const [tab, setTab] = useState<"staff" | "students">("staff");

  useEffect(() => {
    if (meLoading) return;
    if (!me) navigate({ to: "/admin-login" });
    else if (me.role !== "super_admin" && me.role !== "admin_staff" && me.role !== "clerk") navigate({ to: "/staff-dashboard" });
  }, [me, meLoading, navigate]);

  const staffQ = useQuery({ queryKey: ["admin-staff"], queryFn: () => adminListStaff(), enabled: !!me });
  const studentQ = useQuery({ queryKey: ["admin-students"], queryFn: () => adminListStudents(), enabled: !!me });

  const invalidate = (k: string) => qc.invalidateQueries({ queryKey: [k] });

  if (meLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Admin · User Management</p>
            <p className="font-bold text-slate-800">Login Accounts &amp; Credentials</p>
          </div>
          <Link to="/admin" className="text-sm px-3 py-1.5 border rounded text-slate-700 hover:bg-slate-100">← Admin Console</Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded p-3 mb-4">
          User Management handles only <b>login credentials &amp; basic profile</b> (Name, User&nbsp;ID, Password, Photo).
          To edit richer Faculty or Student records, use the dedicated sections in the Admin Console.
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("staff")} className={`px-4 py-2 rounded text-sm font-medium ${tab === "staff" ? "bg-slate-800 text-white" : "bg-white border text-slate-700"}`}>Staff Accounts ({staffQ.data?.length ?? "…"})</button>
          <button onClick={() => setTab("students")} className={`px-4 py-2 rounded text-sm font-medium ${tab === "students" ? "bg-slate-800 text-white" : "bg-white border text-slate-700"}`}>Student Accounts ({studentQ.data?.length ?? "…"})</button>
        </div>

        {tab === "staff" ? (
          <StaffPanel rows={(staffQ.data as any[]) ?? []} canToggle={me.role === "super_admin"} onChange={() => invalidate("admin-staff")} />
        ) : (
          <StudentPanel rows={(studentQ.data as any[]) ?? []} onChange={() => invalidate("admin-students")} />
        )}
      </div>
    </div>
  );
}

// ─── Avatar helper ──────────────────────────────────────────────────────────
function Avatar({ url, name }: { url?: string | null; name?: string | null }) {
  if (url) return <img src={url} alt={name || "user"} className="w-9 h-9 rounded-full object-cover border" />;
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  return <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-semibold">{letter}</div>;
}

// ─── Add Staff ──────────────────────────────────────────────────────────────
function CreateStaffForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("faculty");
  const [username, setUsername] = useState("");
  const [touchedId, setTouchedId] = useState(false);
  const [password, setPassword] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: (d: any) => adminCreateStaff({ data: d }),
    onSuccess: () => {
      setMsg("Created.");
      setName(""); setUsername(""); setPassword(""); setImageUrl(""); setTouchedId(false);
      onDone();
    },
    onError: (e: any) => setMsg(e.message),
  });

  // Auto-fill ID per rule unless user edited it
  const effectiveUsername = touchedId ? username : suggestUserId(role, name);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      m.mutate({ name, username: effectiveUsername, role, password, image_url: imageUrl || null });
    }} className="bg-white border rounded p-4 mb-4">
      <p className="text-sm font-semibold text-slate-800 mb-3">+ Add Staff Account</p>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required className="border rounded px-2 py-1.5 text-sm" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
          <option value="faculty">Faculty</option>
          <option value="hod">HoD</option>
          <option value="principal">Principal</option>
          <option value="tpo">TPO</option>
          <option value="clerk">Clerk</option>
          <option value="admin_staff">Admin Staff</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <input value={effectiveUsername} onChange={(e) => { setTouchedId(true); setUsername(e.target.value); }} placeholder="User ID" required className="border rounded px-2 py-1.5 text-sm font-mono" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (≥8)" required minLength={8} autoComplete="new-password" className="border rounded px-2 py-1.5 text-sm" />
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" className="border rounded px-2 py-1.5 text-sm" />
      </div>
      <p className="text-[11px] text-slate-500 mt-2">
        User-ID rule: Principal → <code>principal</code> · HOD → <code>hod</code> · TPO → <code>tpo</code> · Faculty → faculty full name · Students → Roll No.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <button disabled={m.isPending || !name || !effectiveUsername || password.length < 8} className="bg-slate-800 text-white rounded px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {m.isPending ? "Creating…" : "Add Staff"}
        </button>
        {msg && <span className="text-xs text-slate-600">{msg}</span>}
      </div>
    </form>
  );
}

// ─── Staff Table ────────────────────────────────────────────────────────────
function StaffPanel({ rows, canToggle, onChange }: { rows: any[]; canToggle: boolean; onChange: () => void }) {
  const reset = useMutation({ mutationFn: (d: any) => adminResetStaffPassword({ data: d }), onSuccess: onChange });
  const toggle = useMutation({ mutationFn: (d: any) => adminToggleStaffActive({ data: d }), onSuccess: onChange });
  const del = useMutation({ mutationFn: (d: any) => adminDeleteStaff({ data: d }), onSuccess: onChange });
  const update = useMutation({ mutationFn: (d: any) => adminUpdateStaff({ data: d }), onSuccess: onChange });
  const [resetTarget, setResetTarget] = useState<{ id: number; label: string } | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  return (
    <>
      <CreateStaffForm onDone={onChange} />
      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Photo</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">User ID</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2"><Avatar url={r.image_url} name={r.name || r.username} /></td>
                <td className="px-3 py-2 font-medium text-slate-800">{r.name || <span className="text-slate-400 italic">— not set —</span>}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.username}</td>
                <td className="px-3 py-2 capitalize">{r.role.replace(/_/g, " ")}</td>
                <td className="px-3 py-2">{r.is_active ? <span className="text-green-700">Active</span> : <span className="text-rose-700">Disabled</span>}</td>
                <td className="px-3 py-2 flex gap-2 flex-wrap">
                  <button onClick={() => setEditTarget(r)} className="text-xs px-2 py-1 border rounded">Edit Profile</button>
                  <button onClick={() => setResetTarget({ id: r.id, label: r.username })} className="text-xs px-2 py-1 border rounded">Change Password</button>
                  {canToggle && (
                    <button onClick={() => toggle.mutate({ id: r.id, active: !r.is_active })}
                      className={`text-xs px-2 py-1 rounded ${r.is_active ? "bg-rose-100 text-rose-700" : "bg-green-100 text-green-700"}`}>
                      {r.is_active ? "Disable" : "Enable"}
                    </button>
                  )}
                  {canToggle && (
                    <button onClick={() => { if (confirm(`Delete ${r.username}? This cannot be undone.`)) del.mutate({ id: r.id }); }}
                      className="text-xs px-2 py-1 rounded bg-rose-600 text-white">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {resetTarget && (
        <ResetPasswordDialog label={resetTarget.label} minLen={8}
          onCancel={() => setResetTarget(null)}
          onSubmit={(pw) => { reset.mutate({ id: resetTarget.id, newPassword: pw }); setResetTarget(null); }} />
      )}
      {editTarget && (
        <EditStaffDialog row={editTarget} onCancel={() => setEditTarget(null)}
          onSave={(patch) => { update.mutate({ id: editTarget.id, ...patch }); setEditTarget(null); }} />
      )}
    </>
  );
}

function EditStaffDialog({ row, onSave, onCancel }: { row: any; onSave: (p: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(row.name || "");
  const [username, setUsername] = useState(row.username || "");
  const [imageUrl, setImageUrl] = useState(row.image_url || "");
  return (
    <Modal title={`Edit Profile — ${row.username}`} onClose={onCancel}>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <Avatar url={imageUrl} name={name || row.username} />
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="flex-1 border rounded px-3 py-2 text-sm" />
        </div>
        <label className="block">
          <span className="text-xs text-slate-500">Full Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">User ID</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border rounded px-3 py-2 text-sm font-mono" />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-3 py-1.5 border rounded text-sm">Cancel</button>
          <button onClick={() => onSave({ name, username, image_url: imageUrl })} className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm">Save</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Reset Password Modal ───────────────────────────────────────────────────
function ResetPasswordDialog({ label, minLen, onSubmit, onCancel }: { label: string; minLen: number; onSubmit: (pw: string) => void; onCancel: () => void }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal title="Change Password" onClose={onCancel}>
      <p className="text-xs text-slate-500 mb-3">For <b>{label}</b> (min {minLen} chars)</p>
      <form onSubmit={(e) => {
        e.preventDefault();
        if (pw.length < minLen) { setErr(`Must be at least ${minLen} characters`); return; }
        if (pw !== confirm) { setErr("Passwords do not match"); return; }
        onSubmit(pw);
      }} className="space-y-2">
        <input autoFocus type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" className="w-full border rounded px-3 py-2 text-sm" />
        <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" className="w-full border rounded px-3 py-2 text-sm" />
        {err && <p className="text-xs text-rose-700">{err}</p>}
        <div className="flex gap-2 justify-end pt-1">
          <button type="button" onClick={onCancel} className="text-sm px-3 py-1.5 border rounded">Cancel</button>
          <button type="submit" className="text-sm px-3 py-1.5 bg-slate-800 text-white rounded">Update</button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-slate-800 mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ─── Add Student ────────────────────────────────────────────────────────────
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
        password: String(f.get("password")),
      });
      (e.currentTarget as HTMLFormElement).reset();
    }} className="bg-white border rounded p-4 mb-4">
      <p className="text-sm font-semibold text-slate-800 mb-3">+ Add Student Account</p>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <input name="name" placeholder="Full Name" required className="border rounded px-2 py-1.5 text-sm md:col-span-2" />
        <input name="enrollment_no" placeholder="Roll No. (User ID)" required className="border rounded px-2 py-1.5 text-sm font-mono" />
        <input name="branch" placeholder="Branch" required className="border rounded px-2 py-1.5 text-sm" />
        <input name="semester" type="number" min={1} max={8} placeholder="Sem" required className="border rounded px-2 py-1.5 text-sm" />
        <input name="batch_year" type="number" min={2000} max={2100} placeholder="Batch" required className="border rounded px-2 py-1.5 text-sm" />
        <input name="password" type="password" placeholder="Password (≥6)" required minLength={6} autoComplete="new-password" className="border rounded px-2 py-1.5 text-sm md:col-span-2" />
        <button disabled={m.isPending} className="md:col-span-2 bg-emerald-700 text-white rounded px-3 py-2 text-sm font-semibold disabled:opacity-50">
          {m.isPending ? "Creating…" : "Add Student"}
        </button>
        {msg && <p className="col-span-2 md:col-span-6 text-xs text-slate-600">{msg}</p>}
      </div>
    </form>
  );
}

function StudentPanel({ rows, onChange }: { rows: any[]; onChange: () => void }) {
  const reset = useMutation({ mutationFn: (d: any) => adminResetStudentPassword({ data: d }), onSuccess: onChange });
  const toggle = useMutation({ mutationFn: (d: any) => adminToggleStudentActive({ data: d }), onSuccess: onChange });
  const del = useMutation({ mutationFn: (d: any) => adminDeleteStudent({ data: d }), onSuccess: onChange });
  const update = useMutation({ mutationFn: (d: any) => adminUpdateStudent({ data: d }), onSuccess: onChange });
  const [q, setQ] = useState("");
  const [resetTarget, setResetTarget] = useState<{ id: number; label: string } | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const filtered = rows.filter((r) => !q || r.enrollment_no.toLowerCase().includes(q.toLowerCase()) || (r.name || "").toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <CreateStudentForm onDone={onChange} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or roll no…" className="w-full mb-3 border rounded px-3 py-2 text-sm" />
      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Photo</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">User ID (Roll No.)</th>
              <th className="px-3 py-2 text-left">Branch · Sem</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2"><Avatar url={r.image_url} name={r.name} /></td>
                <td className="px-3 py-2 font-medium text-slate-800">{r.name}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.enrollment_no}</td>
                <td className="px-3 py-2">{r.branch} · {r.semester}</td>
                <td className="px-3 py-2">{r.is_active ? <span className="text-green-700">Active</span> : <span className="text-rose-700">Disabled</span>}</td>
                <td className="px-3 py-2 flex gap-2 flex-wrap">
                  <button onClick={() => setEditTarget(r)} className="text-xs px-2 py-1 border rounded">Edit Profile</button>
                  <button onClick={() => setResetTarget({ id: r.id, label: r.enrollment_no })} className="text-xs px-2 py-1 border rounded">Change Password</button>
                  <button onClick={() => toggle.mutate({ id: r.id, active: !r.is_active })}
                    className={`text-xs px-2 py-1 rounded ${r.is_active ? "bg-rose-100 text-rose-700" : "bg-green-100 text-green-700"}`}>
                    {r.is_active ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => { if (confirm(`Delete ${r.enrollment_no}? This cannot be undone.`)) del.mutate({ id: r.id }); }}
                    className="text-xs px-2 py-1 rounded bg-rose-600 text-white">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {resetTarget && (
        <ResetPasswordDialog label={resetTarget.label} minLen={6}
          onCancel={() => setResetTarget(null)}
          onSubmit={(pw) => { reset.mutate({ id: resetTarget.id, newPassword: pw }); setResetTarget(null); }} />
      )}
      {editTarget && (
        <EditStudentDialog row={editTarget} onCancel={() => setEditTarget(null)}
          onSave={(patch) => { update.mutate({ id: editTarget.id, ...patch }); setEditTarget(null); }} />
      )}
    </>
  );
}

function EditStudentDialog({ row, onSave, onCancel }: { row: any; onSave: (p: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(row.name || "");
  const [enrollment, setEnrollment] = useState(row.enrollment_no || "");
  const [imageUrl, setImageUrl] = useState(row.image_url || "");
  return (
    <Modal title={`Edit Profile — ${row.enrollment_no}`} onClose={onCancel}>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <Avatar url={imageUrl} name={name} />
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="flex-1 border rounded px-3 py-2 text-sm" />
        </div>
        <label className="block">
          <span className="text-xs text-slate-500">Full Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">User ID (Roll No.)</span>
          <input value={enrollment} onChange={(e) => setEnrollment(e.target.value)} className="w-full border rounded px-3 py-2 text-sm font-mono" />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-3 py-1.5 border rounded text-sm">Cancel</button>
          <button onClick={() => onSave({ name, enrollment_no: enrollment, image_url: imageUrl })} className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm">Save</button>
        </div>
      </div>
    </Modal>
  );
}
