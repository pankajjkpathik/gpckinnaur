import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, FileText, FolderOpen, Mail, GraduationCap, User, LogOut, Plus, Trash2, Download,
} from "lucide-react";
import { staffLogout, staffMe, staffChangePassword } from "@/lib/auth.functions";
import { listNotices, createNotice, deleteNotice } from "@/lib/notices.functions";
import { listMaterials, createMaterial, deleteMaterial } from "@/lib/materials.functions";
import {
  listContactSubmissions, markContactRead, listAlumniSubmissions, verifyAlumni, submissionCounts,
} from "@/lib/submissions.functions";
import logoAsset from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/staff-dashboard")({
  head: () => ({ meta: [{ title: "Staff Dashboard — GP Kinnaur" }, { name: "description", content: "Staff Dashboard — GP Kinnaur at Government Polytechnic, Kinnaur — internal portal page." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: StaffDashboard,
});

type View = "home" | "notices" | "materials" | "contact" | "alumni" | "profile";
const roleBadge: Record<string, string> = {
  super_admin: "bg-rose-100 text-rose-700",
  principal: "bg-indigo-100 text-indigo-700",
  hod: "bg-sky-100 text-sky-700",
  faculty: "bg-teal-100 text-teal-700",
  admin_staff: "bg-slate-200 text-slate-700",
};

function StaffDashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("home");
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  const { data: counts } = useQuery({ queryKey: ["counts"], queryFn: () => submissionCounts(), enabled: !!me });

  useEffect(() => {
    if (!isLoading && !me) navigate({ to: "/staff-login" });
  }, [me, isLoading, navigate]);

  if (isLoading || !me || !me.role) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  const role = me.role as string;
  const can = (rs: string[]) => rs.includes(role);
  // Admin/Super-Admin are admin-only — they do not curate notices/materials/inbox.
  const showNotices = can(["principal", "hod"]);
  const showMats = can(["hod", "faculty"]); // Principal & Admin no longer manage study material here
  const showInbox = can(["principal", "admin_staff", "super_admin"]);

  async function logout() {
    await staffLogout({});
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <aside className="w-60 bg-[color:var(--navy)] text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src={logoAsset.url} alt="GP Kinnaur logo" className="w-10 h-10 object-contain rounded-full bg-white p-0.5" />
            <div>
              <p className="text-xs text-[color:var(--gold)] font-semibold uppercase tracking-wider">Staff Portal</p>
              <p className="text-xs text-white/70">GP Kinnaur</p>
            </div>
          </div>
        </div>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[color:var(--gold)] text-[color:var(--navy)] flex items-center justify-center font-bold">{me.username?.[0]?.toUpperCase()}</div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{me.username}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded ${roleBadge[role] ?? "bg-slate-200 text-slate-700"}`}>{role}</span>
              {me.department && <p className="text-xs text-white/60 capitalize mt-1">{me.department}</p>}
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 text-sm">
          <NavBtn icon={<LayoutDashboard className="w-4 h-4" />} active={view === "home"} onClick={() => setView("home")} label="Dashboard" />
          {showNotices && <NavBtn icon={<FileText className="w-4 h-4" />} active={view === "notices"} onClick={() => setView("notices")} label="Notices" />}
          {showMats && <NavBtn icon={<FolderOpen className="w-4 h-4" />} active={view === "materials"} onClick={() => setView("materials")} label="Study Materials" />}
          {showInbox && <NavBtn icon={<Mail className="w-4 h-4" />} active={view === "contact"} onClick={() => setView("contact")} label="Contact Inbox" badge={counts?.unreadContact} />}
          {showInbox && <NavBtn icon={<GraduationCap className="w-4 h-4" />} active={view === "alumni"} onClick={() => setView("alumni")} label="Alumni Records" badge={counts?.unverifiedAlumni} />}
          <NavBtn icon={<User className="w-4 h-4" />} active={view === "profile"} onClick={() => setView("profile")} label="My Profile" />
          {/* Role-scoped portal links — each role sees only what it owns, plus read-only Views for higher roles. */}
          {(role === "super_admin" || role === "admin_staff") && (
            <>
              <a href="/admin" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 text-white/90"><User className="w-4 h-4" /> Admin Console</a>
              <a href="/admin-users" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 text-white/90"><User className="w-4 h-4" /> User Management</a>
            </>
          )}
          {role === "clerk" && (
            <a href="/clerk" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 text-white/90"><User className="w-4 h-4" /> Clerk Portal</a>
          )}
          {role === "faculty" && (
            <a href="/faculty" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 text-white/90"><GraduationCap className="w-4 h-4" /> Faculty Portal</a>
          )}
          {role === "hod" && (
            <>
              <a href="/hod" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 text-white/90"><GraduationCap className="w-4 h-4" /> HOD Portal</a>
              <a href="/faculty" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 text-white/90"><GraduationCap className="w-4 h-4" /> Faculty View</a>
            </>
          )}
          {role === "principal" && (
            <>
              <a href="/principal" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 text-white/90"><GraduationCap className="w-4 h-4" /> Principal Portal</a>
              <a href="/hod" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 text-white/90"><GraduationCap className="w-4 h-4" /> HOD View</a>
              <a href="/faculty" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 text-white/90"><GraduationCap className="w-4 h-4" /> Faculty View</a>
            </>
          )}
          <a href="/staff-change-password" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10 text-white/90"><User className="w-4 h-4" /> Change Password</a>
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-[color:var(--gold)] text-[color:var(--navy)] py-2 rounded-md font-semibold">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        {view === "home" && <DashboardHome me={me} counts={counts} />}
        {view === "notices" && showNotices && <NoticesManager />}
        {view === "materials" && showMats && <MaterialsManager me={me} />}
        {view === "contact" && showInbox && <ContactInbox />}
        {view === "alumni" && showInbox && <AlumniRecords role={role} />}
        {view === "profile" && <MyProfile me={me} />}
      </main>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick, badge }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md ${active ? "bg-[color:var(--gold)] text-[color:var(--navy)] font-semibold" : "hover:bg-white/10"}`}>
      <span className="flex items-center gap-2">{icon} {label}</span>
      {badge ? <span className="text-[10px] bg-rose-500 text-white px-1.5 rounded-full">{badge}</span> : null}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-[color:var(--navy)] mt-1">{value}</p>
    </div>
  );
}

const portalForRole: Record<string, { href: string; title: string; desc: string; accent: string }[]> = {
  super_admin: [
    { href: "/admin", title: "Admin Console", desc: "Master data, timetable, syllabus, calendar", accent: "bg-rose-50 text-rose-700 ring-rose-200" },
    { href: "/principal", title: "Principal Portal", desc: "Institute-wide monitoring & circulars", accent: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
    { href: "/hod", title: "HOD Portal", desc: "Approvals & department monitoring", accent: "bg-sky-50 text-sky-700 ring-sky-200" },
    { href: "/faculty", title: "Faculty Portal", desc: "Attendance, marks, lesson plans, leave", accent: "bg-teal-50 text-teal-700 ring-teal-200" },
    { href: "/clerk", title: "Clerk Portal", desc: "Student & staff records", accent: "bg-amber-50 text-amber-700 ring-amber-200" },
  ],
  principal: [
    { href: "/principal", title: "Open Principal Portal", desc: "Institute-wide monitoring & circulars", accent: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
    { href: "/hod", title: "HOD View", desc: "Approvals & department drill-down", accent: "bg-sky-50 text-sky-700 ring-sky-200" },
  ],
  hod: [
    { href: "/hod", title: "Open HOD Portal", desc: "Approvals & department monitoring", accent: "bg-sky-50 text-sky-700 ring-sky-200" },
    { href: "/faculty", title: "Faculty View", desc: "Mark attendance & enter marks", accent: "bg-teal-50 text-teal-700 ring-teal-200" },
  ],
  faculty: [
    { href: "/faculty", title: "Open Faculty Portal", desc: "Attendance, marks, lesson plans, leave", accent: "bg-teal-50 text-teal-700 ring-teal-200" },
  ],
  clerk: [
    { href: "/clerk", title: "Open Clerk Portal", desc: "Student & staff master records", accent: "bg-amber-50 text-amber-700 ring-amber-200" },
  ],
  admin_staff: [
    { href: "/admin", title: "Open Admin Console", desc: "System configuration", accent: "bg-rose-50 text-rose-700 ring-rose-200" },
    { href: "/admin-users", title: "User Management", desc: "Staff & student accounts", accent: "bg-slate-50 text-slate-700 ring-slate-200" },
  ],
};

function DashboardHome({ me, counts }: any) {
  const { data: notices = [] } = useQuery({ queryKey: ["notices"], queryFn: () => listNotices() });
  const portals = portalForRole[me.role] ?? [];
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-5">
        <h2 className="text-xl font-bold text-[color:var(--navy)]">Welcome back, {me.username}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Role: <span className="font-medium capitalize">{me.role}</span>
          {me.department && <> · Department: <span className="capitalize font-medium">{me.department}</span></>}
        </p>
      </div>

      {portals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Workspaces</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {portals.map((p) => (
              <a key={p.href} href={p.href}
                 className={`block rounded-lg p-4 ring-1 transition hover:shadow-md ${p.accent}`}>
                <p className="font-semibold">{p.title}</p>
                <p className="text-xs opacity-80 mt-1">{p.desc}</p>
                <p className="text-xs font-medium mt-3">Open →</p>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Notices" value={counts?.totalNotices ?? 0} />
        <StatCard label="Study Materials" value={counts?.totalMaterials ?? 0} />
        <StatCard label="Unread Contact" value={counts?.unreadContact ?? 0} />
        <StatCard label="Unverified Alumni" value={counts?.unverifiedAlumni ?? 0} />
      </div>
      <div className="bg-white border rounded-lg">
        <div className="px-4 py-3 border-b font-semibold">Recent Notices</div>
        <ul className="divide-y">
          {notices.slice(0, 3).map((n: any) => (
            <li key={n.id} className="px-4 py-2 text-sm flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{new Date(n.date).toLocaleDateString()}</span>
              <span className="text-[10px] uppercase bg-secondary px-2 py-0.5 rounded">{n.category}</span>
              <span className="font-medium">{n.title}</span>
            </li>
          ))}
          {notices.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground text-center">No notices yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function NoticesManager() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const { data: notices = [] } = useQuery({ queryKey: ["notices"], queryFn: () => listNotices() });
  const create = useMutation({
    mutationFn: (d: any) => createNotice({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notices"] }); setOpen(false); },
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteNotice({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notices"] }),
  });
  const filtered = filter === "all" ? notices : notices.filter((n: any) => n.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[color:var(--navy)]">Notices</h2>
        <button onClick={() => setOpen(true)} className="bg-[color:var(--gold)] text-[color:var(--navy)] px-4 py-2 rounded-md font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Notice
        </button>
      </div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-white">
        <option value="all">All categories</option>
        {["general","admission","exam","scholarship","event","placement"].map((c) => (<option key={c} value={c}>{c}</option>))}
      </select>
      <div className="space-y-2">
        {filtered.map((n: any) => (
          <div key={n.id} className="bg-white border rounded-lg p-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-[color:var(--navy)] text-white px-2 py-0.5 rounded">{new Date(n.date).toLocaleDateString()}</span>
                <span className="bg-secondary px-2 py-0.5 rounded uppercase">{n.category}</span>
              </div>
              <p className="font-semibold mt-2">{n.title}</p>
              {n.content && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.content}</p>}
            </div>
            <button onClick={() => confirm("Delete this notice?") && del.mutate(n.id)} className="text-destructive p-2 hover:bg-destructive/10 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {open && (
        <Modal onClose={() => setOpen(false)} title="Add Notice">
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            create.mutate({
              title: fd.get("title"),
              content: fd.get("content") || undefined,
              category: fd.get("category") || "general",
              link: fd.get("link") || undefined,
            });
          }} className="space-y-3">
            <input name="title" required placeholder="Title" className="w-full border rounded px-3 py-2 text-sm" />
            <textarea name="content" rows={4} placeholder="Content" className="w-full border rounded px-3 py-2 text-sm" />
            <select name="category" className="w-full border rounded px-3 py-2 text-sm bg-white">
              {["general","admission","exam","scholarship","event","placement"].map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <input name="link" placeholder="Link (optional)" className="w-full border rounded px-3 py-2 text-sm" />
            <button disabled={create.isPending} className="w-full bg-[color:var(--navy)] text-white py-2 rounded font-semibold disabled:opacity-50">Save</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function MaterialsManager({ me }: any) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("");
  const [dept, setDept] = useState<string>("");
  const [sem, setSem] = useState<string>("");
  const lockDept = ["hod", "faculty"].includes(me.role);

  const { data: materials = [] } = useQuery({
    queryKey: ["materials", type, dept, sem],
    queryFn: () => listMaterials({ data: {
      type: type || undefined,
      department: dept || undefined,
      semester: sem ? Number(sem) : undefined,
    } as any}),
  });
  const create = useMutation({
    mutationFn: (d: any) => createMaterial({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["materials"] }); setOpen(false); },
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteMaterial({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materials"] }),
  });
  const canDel = ["super_admin", "principal", "hod"].includes(me.role);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[color:var(--navy)]">Study Materials</h2>
        <button onClick={() => setOpen(true)} className="bg-[color:var(--gold)] text-[color:var(--navy)] px-4 py-2 rounded-md font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Material
        </button>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {["", "notes", "syllabus", "paper", "form"].map((t) => (
          <button key={t || "all"} onClick={() => setType(t)} className={`px-3 py-1.5 rounded-md border ${type === t ? "bg-[color:var(--navy)] text-white" : "bg-white"}`}>
            {t || "All"}
          </button>
        ))}
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="border rounded-md px-3 py-1.5 bg-white">
          <option value="">All departments</option>
          {["civil","mechanical","applied_science","all"].map((d) => (<option key={d} value={d}>{d}</option>))}
        </select>
        <select value={sem} onChange={(e) => setSem(e.target.value)} className="border rounded-md px-3 py-1.5 bg-white">
          <option value="">All semesters</option>
          {[1,2,3,4,5,6].map((s) => (<option key={s} value={s}>Sem {s}</option>))}
        </select>
      </div>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--navy)] text-white">
            <tr><th className="px-3 py-2 text-left">Title</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Dept</th><th className="px-3 py-2 text-left">Sem</th><th className="px-3 py-2 text-left">Subject</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody className="divide-y">
            {materials.map((m: any) => (
              <tr key={m.id}>
                <td className="px-3 py-2 font-medium">
                  <a href={m.file_url} target="_blank" rel="noreferrer" className="hover:underline">{m.title}</a>
                </td>
                <td className="px-3 py-2"><span className="text-[10px] bg-secondary px-2 py-0.5 rounded uppercase">{m.type}</span></td>
                <td className="px-3 py-2 capitalize">{m.department}</td>
                <td className="px-3 py-2">{m.semester ?? "—"}</td>
                <td className="px-3 py-2">{m.subject ?? "—"}</td>
                <td className="px-3 py-2 text-right">{canDel && (
                  <button onClick={() => confirm("Delete?") && del.mutate(m.id)} className="text-destructive p-1.5 hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4" /></button>
                )}</td>
              </tr>
            ))}
            {materials.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">No materials yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal onClose={() => setOpen(false)} title="Add Material">
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            create.mutate({
              title: fd.get("title"),
              type: fd.get("type"),
              department: fd.get("department"),
              semester: fd.get("semester") ? Number(fd.get("semester")) : null,
              subject: fd.get("subject") || undefined,
              fileUrl: fd.get("fileUrl"),
            });
          }} className="space-y-3">
            <input name="title" required placeholder="Title" className="w-full border rounded px-3 py-2 text-sm" />
            <select name="type" required className="w-full border rounded px-3 py-2 text-sm bg-white">
              <option value="notes">Notes</option><option value="syllabus">Syllabus</option><option value="paper">Previous Paper</option><option value="form">Important Form</option>
            </select>
            <select name="department" required defaultValue={lockDept ? me.department : ""} disabled={lockDept} className="w-full border rounded px-3 py-2 text-sm bg-white disabled:opacity-70">
              <option value="">Select…</option>
              <option value="civil">Civil</option><option value="mechanical">Mechanical</option><option value="applied_science">Applied Science</option><option value="all">All</option>
            </select>
            <select name="semester" className="w-full border rounded px-3 py-2 text-sm bg-white">
              <option value="">— Semester (optional) —</option>
              {[1,2,3,4,5,6].map((s) => (<option key={s} value={s}>Semester {s}</option>))}
            </select>
            <input name="subject" placeholder="Subject" className="w-full border rounded px-3 py-2 text-sm" />
            <input name="fileUrl" required placeholder="File URL (Drive / direct)" className="w-full border rounded px-3 py-2 text-sm" />
            <button disabled={create.isPending} className="w-full bg-[color:var(--navy)] text-white py-2 rounded font-semibold disabled:opacity-50">Save</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ContactInbox() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["contact-inbox"], queryFn: () => listContactSubmissions() });
  const mark = useMutation({
    mutationFn: (id: number) => markContactRead({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contact-inbox"] }),
  });
  const [openRow, setOpenRow] = useState<any | null>(null);
  const unread = data.filter((d: any) => !d.is_read).length;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[color:var(--navy)]">Contact Inbox</h2>
      <div className="flex gap-3 text-sm">
        <span className="bg-white border rounded px-3 py-1">Total: <strong>{data.length}</strong></span>
        <span className="bg-amber-50 border border-amber-200 rounded px-3 py-1 text-amber-800">Unread: <strong>{unread}</strong></span>
      </div>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--navy)] text-white">
            <tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Email</th><th className="px-3 py-2 text-left">Subject</th><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Status</th><th></th></tr>
          </thead>
          <tbody className="divide-y">
            {data.map((c: any) => (
              <tr key={c.id} className={`cursor-pointer ${!c.is_read ? "bg-amber-50" : ""}`} onClick={() => setOpenRow(c)}>
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2">{c.email}</td>
                <td className="px-3 py-2">{c.subject}</td>
                <td className="px-3 py-2 text-xs">{new Date(c.submitted_at).toLocaleString()}</td>
                <td className="px-3 py-2 text-xs">{c.is_read ? "Read" : "Unread"}</td>
                <td className="px-3 py-2 text-right">
                  {!c.is_read && <button onClick={(e) => { e.stopPropagation(); mark.mutate(c.id); }} className="text-xs text-[color:var(--navy)] underline">Mark Read</button>}
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">No messages.</td></tr>}
          </tbody>
        </table>
      </div>
      {openRow && (
        <Modal onClose={() => setOpenRow(null)} title={openRow.subject}>
          <div className="space-y-2 text-sm">
            <p><strong>From:</strong> {openRow.name} ({openRow.email})</p>
            {openRow.phone && <p><strong>Phone:</strong> {openRow.phone}</p>}
            <p className="text-xs text-muted-foreground">{new Date(openRow.submitted_at).toLocaleString()}</p>
            <div className="bg-secondary/50 rounded p-3 whitespace-pre-wrap">{openRow.message}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AlumniRecords({ role }: { role: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["alumni-inbox"], queryFn: () => listAlumniSubmissions() });
  const verify = useMutation({
    mutationFn: (id: number) => verifyAlumni({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alumni-inbox"] }),
  });
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const canVerify = ["super_admin", "principal"].includes(role);

  const filtered = data.filter((a: any) =>
    (!branch || a.branch === branch) && (!year || String(a.batch_year) === year)
  );

  function exportCsv() {
    const headers = ["Name", "Branch", "Batch", "ProfileType", "Company", "Phone", "Email", "Verified", "Date"];
    const rows = filtered.map((a: any) => [a.name, a.branch, a.batch_year, a.profile_type, a.designation_sector, a.phone, a.email, a.is_verified ? "Yes" : "No", a.submitted_at].map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[headers.join(",")].concat(rows).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "alumni.csv"; link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[color:var(--navy)]">Alumni Records</h2>
        <button onClick={exportCsv} className="px-4 py-2 bg-[color:var(--gold)] text-[color:var(--navy)] font-semibold rounded flex items-center gap-2"><Download className="w-4 h-4" /> Export CSV</button>
      </div>
      <div className="flex gap-2 text-sm">
        <select value={branch} onChange={(e) => setBranch(e.target.value)} className="border rounded px-3 py-1.5 bg-white">
          <option value="">All branches</option>
          <option value="Civil Engineering">Civil</option>
          <option value="Mechanical Engineering">Mechanical</option>
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} className="border rounded px-3 py-1.5 bg-white">
          <option value="">All years</option>
          {Array.from({ length: 12 }, (_, i) => 2024 - i).map((y) => (<option key={y} value={y}>{y}</option>))}
        </select>
      </div>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--navy)] text-white">
            <tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Branch</th><th className="px-3 py-2 text-left">Batch</th><th className="px-3 py-2 text-left">Profile</th><th className="px-3 py-2 text-left">Company</th><th className="px-3 py-2 text-left">Status</th><th></th></tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((a: any) => (
              <tr key={a.id}>
                <td className="px-3 py-2 font-medium">{a.name}</td>
                <td className="px-3 py-2">{a.branch}</td>
                <td className="px-3 py-2">{a.batch_year}</td>
                <td className="px-3 py-2">{a.profile_type}</td>
                <td className="px-3 py-2">{a.designation_sector}</td>
                <td className="px-3 py-2">{a.is_verified ? <span className="text-emerald-700">✓ Verified</span> : <span className="text-amber-700">Pending</span>}</td>
                <td className="px-3 py-2 text-right">{!a.is_verified && canVerify && (
                  <button onClick={() => verify.mutate(a.id)} className="text-xs text-[color:var(--navy)] underline">Verify</button>
                )}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">No records.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MyProfile({ me }: any) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const m = useMutation({
    mutationFn: (d: any) => staffChangePassword({ data: d }),
    onSuccess: () => setMsg({ ok: true, text: "Password updated." }),
    onError: (e: any) => setMsg({ ok: false, text: e?.message || "Failed" }),
  });
  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-2xl font-bold text-[color:var(--navy)]">My Profile</h2>
      <div className="bg-white border rounded-lg p-5 grid sm:grid-cols-2 gap-3 text-sm">
        <Row k="Username" v={me.username} />
        <Row k="Role" v={me.role} />
        <Row k="Department" v={me.department || "—"} />
      </div>
      <div className="bg-white border rounded-lg p-5">
        <h3 className="font-bold text-[color:var(--navy)] mb-3">Change Password</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          const fd = new FormData(e.currentTarget);
          if (fd.get("newPassword") !== fd.get("confirm")) { setMsg({ ok: false, text: "New passwords do not match." }); return; }
          if (String(fd.get("newPassword")).length < 8) { setMsg({ ok: false, text: "Minimum 8 characters." }); return; }
          m.mutate({ currentPassword: fd.get("currentPassword"), newPassword: fd.get("newPassword") });
        }} className="space-y-3 max-w-sm">
          <input name="currentPassword" type="password" required placeholder="Current password" className="w-full border rounded px-3 py-2 text-sm" />
          <input name="newPassword" type="password" required placeholder="New password (min 8)" className="w-full border rounded px-3 py-2 text-sm" />
          <input name="confirm" type="password" required placeholder="Confirm new password" className="w-full border rounded px-3 py-2 text-sm" />
          {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-destructive"}`}>{msg.text}</p>}
          <button disabled={m.isPending} className="w-full bg-[color:var(--navy)] text-white py-2 rounded font-semibold disabled:opacity-50">Update Password</button>
        </form>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className="font-medium capitalize">{v}</p>
    </div>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[color:var(--navy)]">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
