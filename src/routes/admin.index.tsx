import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  Megaphone,
  CreditCard,
  CalendarCheck,
  Mail,
  Download,
  BookMarked,
  ArrowLeft,
  FileText,
  Video,
  Pencil,
  Trash2,
  Plus,
  FileSpreadsheet,
} from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles, hasRole } from "@/lib/roles";
import { adminListStaff, adminListStudents } from "@/lib/admin.functions";
import {
  listClasses,
  upsertClass,
  deleteClass,
  listAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getPTM,
  upsertPTM,
  listParentMessages,
  markParentMessageRead,
  deleteParentMessage,
} from "@/lib/admin-extras.functions";
import { adminListFees } from "@/lib/assignments.functions";
import { exportCSV } from "@/lib/report-export";

export const Route = createFileRoute("/admin/")({
  head: () => portalMeta("Admin Console"),
  component: AdminHub,
});

type View = "home" | "classes" | "faculty" | "students" | "announcements" | "fees" | "ptm" | "messages";

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border rounded-lg shadow-sm p-5 ${className}`}>{children}</div>;
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-gray-600 border rounded px-3 py-1.5 mb-5 hover:bg-gray-50"
    >
      <ArrowLeft className="w-4 h-4" /> Back to Dashboard
    </button>
  );
}

// ─── Card grid item ───────────────────────────────────────────────────────────
function QuickCard({
  icon: Icon,
  label,
  desc,
  color,
  border,
  onClick,
}: {
  icon: any;
  label: string;
  desc: string;
  color: string;
  border: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 p-4 bg-white rounded border-t-4 ${border} shadow-sm hover:shadow-md transition-shadow text-left w-full`}
    >
      <span className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </span>
      <span>
        <p className="font-semibold text-gray-800 text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </span>
    </button>
  );
}

// ─── Main hub ─────────────────────────────────────────────────────────────────
function AdminHub() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!hasRole(me, adminRoles)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const [view, setView] = useState<View>("home");

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell title="Admin Console" subtitle="System Configuration" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6">
        {view === "home" && <HomeView me={me as any} onNav={setView} />}
        {view === "classes" && <ClassesView onBack={() => setView("home")} />}
        {view === "faculty" && <FacultyView onBack={() => setView("home")} />}
        {view === "students" && <StudentsView onBack={() => setView("home")} />}
        {view === "announcements" && <AnnouncementsView onBack={() => setView("home")} />}
        {view === "fees" && <FeesView onBack={() => setView("home")} />}
        {view === "ptm" && <PTMView onBack={() => setView("home")} />}
        {view === "messages" && <MessagesView onBack={() => setView("home")} />}
      </div>
    </PortalShell>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeView({ me, onNav }: { me: any; onNav: (v: View) => void }) {
  // One unified card grid. Every destination appears exactly once.
  // `action` starting with "/" navigates to a route; otherwise switches in-page view.
  const cards: { icon: any; label: string; desc: string; color: string; border: string; action: View | string }[] = [
    {
      icon: LayoutGrid,
      label: "Manage Classes",
      desc: "Define academic structure",
      color: "bg-[#7b1f4c]",
      border: "border-[#7b1f4c]",
      action: "classes",
    },
    {
      icon: BookOpen,
      label: "Manage Subjects",
      desc: "Create and manage subjects",
      color: "bg-orange-500",
      border: "border-orange-500",
      action: "/admin/subjects",
    },
    {
      icon: Users,
      label: "Manage Faculty",
      desc: "View and edit faculty members",
      color: "bg-gray-500",
      border: "border-gray-500",
      action: "/admin/faculty",
    },
    {
      icon: GraduationCap,
      label: "Manage Students",
      desc: "View and edit student records",
      color: "bg-green-600",
      border: "border-green-600",
      action: "/admin/students",
    },
    {
      icon: Calendar,
      label: "Manage Timetable",
      desc: "Set weekly schedules",
      color: "bg-purple-600",
      border: "border-purple-600",
      action: "/admin/timetable",
    },
    {
      icon: Megaphone,
      label: "Manage Announcements",
      desc: "Control marquee text",
      color: "bg-gray-400",
      border: "border-gray-400",
      action: "announcements",
    },
    {
      icon: CreditCard,
      label: "Manage Fees",
      desc: "Handle student fee status",
      color: "bg-rose-600",
      border: "border-rose-600",
      action: "fees",
    },
    {
      icon: CalendarCheck,
      label: "Manage PTM",
      desc: "Organize parent-teacher meetings",
      color: "bg-cyan-500",
      border: "border-cyan-500",
      action: "ptm",
    },
    {
      icon: Mail,
      label: "Parents Messages",
      desc: "View messages from parents",
      color: "bg-[#4a0e2e]",
      border: "border-[#4a0e2e]",
      action: "messages",
    },
    {
      icon: BookMarked,
      label: "Periods Master",
      desc: "Define daily period slots",
      color: "bg-indigo-500",
      border: "border-indigo-500",
      action: "/admin/periods",
    },
    {
      icon: BookOpen,
      label: "Grading Scheme",
      desc: "Configure grade boundaries",
      color: "bg-teal-600",
      border: "border-teal-600",
      action: "/admin/grading",
    },
    {
      icon: BookMarked,
      label: "Syllabus",
      desc: "Upload syllabus PDFs",
      color: "bg-amber-500",
      border: "border-amber-500",
      action: "/admin/syllabus",
    },
    {
      icon: BookOpen,
      label: "Planned Unit Hours",
      desc: "Set unit hours for coverage %",
      color: "bg-lime-600",
      border: "border-lime-600",
      action: "/admin/syllabus-units",
    },

    {
      icon: Calendar,
      label: "Academic Calendar",
      desc: "Upload calendar PDFs",
      color: "bg-sky-500",
      border: "border-sky-500",
      action: "/admin/calendar",
    },
    {
      icon: BookOpen,
      label: "Faculty Assignments",
      desc: "Assign subjects to faculty",
      color: "bg-fuchsia-600",
      border: "border-fuchsia-600",
      action: "/admin/assignments",
    },
    {
      icon: Download,
      label: "Report Templates",
      desc: "Manage report templates",
      color: "bg-slate-500",
      border: "border-slate-500",
      action: "/admin/report-templates",
    },
    {
      icon: Users,
      label: "User Management",
      desc: "Staff & student accounts",
      color: "bg-gray-600",
      border: "border-gray-600",
      action: "/admin-users",
    },
    {
      icon: Users,
      label: "Parent Accounts",
      desc: "Reset parent portal logins",
      color: "bg-emerald-700",
      border: "border-emerald-700",
      action: "/admin/parent-accounts",
    },
    {
      icon: BookMarked,
      label: "Audit Log",
      desc: "Review system activity",
      color: "bg-stone-500",
      border: "border-stone-500",
      action: "/admin/audit",
    },
    {
      icon: FileText,
      label: "Institute Settings",
      desc: "Address shown on official PDFs",
      color: "bg-neutral-700",
      border: "border-neutral-700",
      action: "/admin/settings",
    },
  ];


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Welcome, Administrator</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <QuickCard
            key={c.label}
            icon={c.icon}
            label={c.label}
            desc={c.desc}
            color={c.color}
            border={c.border}
            onClick={() => {
              if ((c.action as string).startsWith("/")) {
                window.location.href = c.action as string;
              } else {
                onNav(c.action as View);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── CLASSES ──────────────────────────────────────────────────────────────────
function ClassesView({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const classesQ = useQuery({ queryKey: ["admin-classes"], queryFn: () => listClasses() });
  const [form, setForm] = useState({ name: "", classId: "", dept: "", semester: "" });
  const [editingId, setEditingId] = useState<number | null>(null);

  const save = useMutation({
    mutationFn: (d: any) => upsertClass({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-classes"] });
      setForm({ name: "", classId: "", dept: "", semester: "" });
      setEditingId(null);
    },
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteClass({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-classes"] }),
  });

  const submit = () => {
    if (!form.name || !form.classId) return;
    save.mutate({
      id: editingId ?? undefined,
      name: form.name,
      class_id: form.classId,
      department: form.dept || null,
      semester: form.semester ? Number(form.semester) : null,
    });
  };

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      classId: c.class_id,
      dept: c.department ?? "",
      semester: c.semester != null ? String(c.semester) : "",
    });
  };

  const rows = classesQ.data ?? [];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">Manage Classes</h1>
      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <p className="font-semibold text-gray-800 mb-4">{editingId ? "Edit Class" : "Add New Class"}</p>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Class Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Computer Science - 1st Year"
                className="border rounded w-full px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Class ID</label>
              <input
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                placeholder="e.g., CS1"
                className="border rounded w-full px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Department</label>
              <input
                value={form.dept}
                onChange={(e) => setForm({ ...form, dept: e.target.value })}
                placeholder="e.g., Computer Science"
                className="border rounded w-full px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Semester</label>
              <input
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                placeholder="e.g., 1"
                type="number"
                className="border rounded w-full px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={save.isPending}
                className="bg-[#7b1f4c] text-white flex-1 py-2 rounded font-semibold disabled:opacity-50"
              >
                {save.isPending ? "Saving…" : editingId ? "Update Class" : "Add Class"}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setForm({ name: "", classId: "", dept: "", semester: "" });
                  }}
                  className="border px-4 py-2 rounded text-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
            {save.error && <p className="text-xs text-rose-700">{(save.error as Error).message}</p>}
          </div>
        </Card>

        <Card>
          <p className="font-semibold text-gray-800 mb-4">Existing Classes</p>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Class Name</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Class ID</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Department</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Semester</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c: any) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.class_id}</td>
                    <td className="px-4 py-3">{c.department ?? "—"}</td>
                    <td className="px-4 py-3">{c.semester ?? "—"}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => startEdit(c)} className="text-gray-500 hover:text-gray-700">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${c.name}?`)) del.mutate(c.id);
                        }}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No classes yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="text-sm text-gray-500">
        To manage subjects, go to{" "}
        <Link to="/admin/subjects" className="text-[#7b1f4c] underline">
          Subjects Master →
        </Link>
      </div>
    </div>
  );
}

// ─── FACULTY ──────────────────────────────────────────────────────────────────
function FacultyView({ onBack }: { onBack: () => void }) {
  const staffQ = useQuery({ queryKey: ["admin-staff"], queryFn: () => adminListStaff() });
  const rows = staffQ.data ?? [];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">Existing Faculty Members</h1>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8 px-4 py-3">
                  <input type="checkbox" />
                </th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Image</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Faculty ID</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Designation</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Department</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Phone</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r: any) => ["faculty", "hod", "principal"].includes(r.role))
                .map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">
                      <input type="checkbox" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                        {(r.username || "?")[0].toUpperCase()}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-3 font-medium">{r.username}</td>
                    <td className="px-4 py-3 capitalize text-gray-500">{r.role}</td>
                    <td className="px-4 py-3">{r.department ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{r.username}@gpkinnaur.app</td>
                    <td className="px-4 py-3 text-xs text-gray-400">—</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button className="text-gray-500 hover:text-gray-700">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="text-rose-500 hover:text-rose-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    No faculty found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-sm text-gray-500">
        To add or manage staff accounts, go to{" "}
        <Link to="/admin-users" className="text-[#7b1f4c] underline">
          User Management →
        </Link>
      </p>
    </div>
  );
}

// ─── STUDENTS ────────────────────────────────────────────────────────────────
function StudentsView({ onBack }: { onBack: () => void }) {
  const studentQ = useQuery({ queryKey: ["admin-students"], queryFn: () => adminListStudents() });
  const rows = studentQ.data ?? [];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <h1 className="text-2xl font-bold text-gray-800">Manage Students</h1>
      <p className="text-sm text-gray-500">View, edit, and manage student records.</p>
      <p className="text-xs text-gray-400 bg-gray-50 border rounded px-3 py-2">
        New students can be added on the dedicated Student Management page, which also creates their login accounts.
      </p>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8 px-4 py-3">
                  <input type="checkbox" />
                </th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Student</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Student ID</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Roll No.</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Class ID</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Contact Info</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">
                    <input type="checkbox" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                        {(r.name || "?")[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.enrollment_no}</td>
                  <td className="px-4 py-3 text-xs">{r.enrollment_no}</td>
                  <td className="px-4 py-3 text-xs">
                    {r.branch?.toUpperCase()}
                    {r.semester}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p>{r.enrollment_no?.toLowerCase()}@gpkinnaur.app</p>
                    <p className="text-gray-400">Parent: parent.{r.enrollment_no?.toLowerCase()}@example.com</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-lg">…</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
function AnnouncementsView({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const listQ = useQuery({ queryKey: ["admin-announcements"], queryFn: () => listAnnouncements() });
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  const create = useMutation({
    mutationFn: (content: string) => createAnnouncement({ data: { content } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      setText("");
      setAdding(false);
    },
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteAnnouncement({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-announcements"] }),
  });

  const items = listQ.data ?? [];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Manage Announcements</h1>
            <p className="text-xs text-gray-400 mt-0.5">Control the scrolling text marquee on the login page.</p>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="bg-[#7b1f4c] text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Announcement
          </button>
        </div>

        {adding && (
          <div className="border rounded p-3 bg-gray-50 flex gap-2 mb-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Announcement text…"
              className="border rounded px-3 py-2 text-sm flex-1"
            />
            <button
              onClick={() => text.trim() && create.mutate(text.trim())}
              disabled={create.isPending}
              className="bg-[#7b1f4c] text-white px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              {create.isPending ? "Adding…" : "Add"}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setText("");
              }}
              className="border px-3 py-2 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8 px-4 py-3">
                  <input type="checkbox" />
                </th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Announcement Content</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Date Added</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3">
                    <input type="checkbox" />
                  </td>
                  <td className="px-4 py-3">{item.content}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    <button
                      onClick={() => {
                        if (confirm("Delete announcement?")) del.mutate(item.id);
                      }}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No announcements.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── FEES ────────────────────────────────────────────────────────────────────
function FeesView({ onBack }: { onBack: () => void }) {
  const feesQ = useQuery({ queryKey: ["admin-fees"], queryFn: () => adminListFees() });
  const rows = feesQ.data ?? [];
  const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Manage Fees</h1>
        <p className="text-xs text-gray-400 mb-4">Manage the fee status of every student.</p>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Student ID</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Student Name</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Class ID</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Due Date</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No fee records found.
                  </td>
                </tr>
              )}
              {rows.map((r: any) => {
                const tone =
                  r.status === "paid"
                    ? "bg-green-100 text-green-700"
                    : r.status === "partial"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-700";
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">{r.students?.enrollment_no ?? r.student_id}</td>
                    <td className="px-4 py-3">{r.students?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      {r.students?.branch?.toUpperCase()}
                      {r.students?.semester}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded capitalize ${tone}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.due_date ?? "—"}</td>
                    <td className="px-4 py-3">{inr(r.total_amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Fee records are created via bulk import or the student fee API. Detailed per-student editing can be added on
          request.
        </p>
      </Card>
    </div>
  );
}

// ─── PTM ────────────────────────────────────────────────────────────────────
function PTMView({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const ptmQ = useQuery({ queryKey: ["admin-ptm"], queryFn: () => getPTM() });
  const [activeTab, setActiveTab] = useState<"view" | "edit">("view");
  const [editForm, setEditForm] = useState({ date: "", time: "", agenda: [] as string[], meetLink: "" });

  const ptm = ptmQ.data;

  useEffect(() => {
    if (ptm) {
      setEditForm({
        date: ptm.meeting_date ?? "",
        time: ptm.meeting_time ?? "",
        agenda: Array.isArray(ptm.agenda) ? (ptm.agenda as string[]) : [],
        meetLink: ptm.meet_link ?? "",
      });
    }
  }, [ptm]);

  const save = useMutation({
    mutationFn: () =>
      upsertPTM({
        data: {
          id: ptm?.id,
          meeting_date: editForm.date || null,
          meeting_time: editForm.time || null,
          agenda: editForm.agenda.filter((a) => a.trim()),
          meet_link: editForm.meetLink || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ptm"] });
      setActiveTab("view");
    },
  });

  const agenda = Array.isArray(ptm?.agenda) ? (ptm!.agenda as string[]) : [];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Manage PTM</h1>
        <p className="text-xs text-gray-400 mb-4">Set and view details for the next upcoming Parent-Teacher Meeting.</p>

        <div className="flex border rounded overflow-hidden mb-5">
          <button
            onClick={() => setActiveTab("view")}
            className={`flex-1 py-2 text-sm font-medium ${activeTab === "view" ? "bg-white" : "bg-gray-50 text-gray-500"}`}
          >
            View Information
          </button>
          <button
            onClick={() => setActiveTab("edit")}
            className={`flex-1 py-2 text-sm font-medium ${activeTab === "edit" ? "bg-white" : "bg-gray-50 text-gray-500"}`}
          >
            Edit Information
          </button>
        </div>

        {activeTab === "view" ? (
          <div className="space-y-5">
            <div className="flex gap-8 bg-gray-50 border rounded p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#7b1f4c]" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-semibold">{ptm?.meeting_date ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarCheck className="w-5 h-5 text-[#7b1f4c]" />
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="font-semibold">{ptm?.meeting_time ?? "—"}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#7b1f4c]" /> Agenda
              </p>
              {agenda.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {agenda.map((item, i) => (
                    <li key={i}>
                      {i + 1}. {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No agenda set.</p>
              )}
            </div>
            <div className="text-center">
              {ptm?.meet_link ? (
                <a
                  href={ptm.meet_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#7b1f4c] text-white px-6 py-2 rounded font-semibold"
                >
                  <Video className="w-4 h-4" /> Join Virtual Meeting
                </a>
              ) : (
                <button className="inline-flex items-center gap-2 bg-[#7b1f4c] text-white px-6 py-2 rounded font-semibold opacity-60 cursor-not-allowed">
                  <Video className="w-4 h-4" /> Join Virtual Meeting
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="border rounded w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Time</label>
                <input
                  value={editForm.time}
                  onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                  placeholder="e.g. 10:00 AM"
                  className="border rounded w-full px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Meet Link (optional)</label>
              <input
                value={editForm.meetLink}
                onChange={(e) => setEditForm({ ...editForm, meetLink: e.target.value })}
                placeholder="https://meet.google.com/..."
                className="border rounded w-full px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Agenda (one item per line)</label>
              <textarea
                rows={4}
                value={editForm.agenda.join("\n")}
                onChange={(e) => setEditForm({ ...editForm, agenda: e.target.value.split("\n") })}
                className="border rounded w-full px-3 py-2 resize-y"
              />
            </div>
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="bg-[#7b1f4c] text-white px-5 py-2 rounded font-semibold disabled:opacity-50"
            >
              {save.isPending ? "Saving…" : "Save Changes"}
            </button>
            {save.error && <p className="text-xs text-rose-700">{(save.error as Error).message}</p>}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── MESSAGES ────────────────────────────────────────────────────────────────
function MessagesView({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const msgsQ = useQuery({ queryKey: ["admin-parent-messages"], queryFn: () => listParentMessages() });
  const markRead = useMutation({
    mutationFn: (id: number) => markParentMessageRead({ data: { id, status: "read" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-parent-messages"] }),
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteParentMessage({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-parent-messages"] }),
  });

  const msgs = msgsQ.data ?? [];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Parents Messages</h1>
        <p className="text-xs text-gray-400 mb-4">Inbox for all messages sent by parents.</p>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8 px-4 py-3">
                  <input type="checkbox" />
                </th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">From</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Subject</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {msgs.map((m: any) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3">
                    <input type="checkbox" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.from_name}</p>
                    {m.student_name && <p className="text-xs text-gray-400">{m.student_name}</p>}
                  </td>
                  <td className="px-4 py-3">{m.subject ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {m.created_at ? new Date(m.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {m.status === "new" ? (
                      <span className="text-xs px-2.5 py-1 bg-[#7b1f4c] text-white rounded-full font-semibold">
                        New
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 border rounded-full text-gray-500">Read</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 items-center">
                      {m.status === "new" && (
                        <button
                          onClick={() => markRead.mutate(m.id)}
                          className="text-xs text-[#7b1f4c] hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("Delete message?")) del.mutate(m.id);
                        }}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {msgs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No messages from parents yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
