import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Factory, ClipboardList, ArrowLeft, Plus, Trash2, FileText } from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { tpoRoles, hasRole } from "@/lib/roles";
import { BarStats } from "@/components/portal/Charts";
import { HeroBanner } from "@/components/portal/HeroBanner";
import {
  listPlacements,
  upsertPlacement,
  deletePlacement,
  listIndustrialTraining,
  createIndustrialTraining,
  deleteIndustrialTraining,
  listGuestLectures,
  createGuestLecture,
  deleteGuestLecture,
  tpoListStudents,
} from "@/lib/tpo.functions";

export const Route = createFileRoute("/tpo")({
  head: () => portalMeta("Training & Placement Portal"),
  component: TpoPortal,
});

type View = "home" | "placements" | "training" | "lectures";

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

function TpoPortal() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!hasRole(me, tpoRoles)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);

  const [view, setView] = useState<View>("home");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyHash = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (h === "placements" || h === "training" || h === "lectures") setView(h);
      else if (h === "" || h === "home") setView("home");
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);


  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell
      title="Training & Placement Portal"
      subtitle="Placements · Internships · Guest Lectures"
      me={me as any}
      accent="rose"
    >
      <div className="container mx-auto px-4 py-6">
        {view === "home" && <HomeView onNav={setView} me={me as any} />}
        {view === "placements" && <PlacementsView onBack={() => setView("home")} />}
        {view === "training" && <TrainingView onBack={() => setView("home")} />}
        {view === "lectures" && <LecturesView onBack={() => setView("home")} />}
      </div>
    </PortalShell>
  );
}

function HomeView({ onNav, me }: { onNav: (v: View) => void; me: any }) {
  const cards: { icon: any; label: string; desc: string; color: string; border: string; view: View }[] = [
    {
      icon: Briefcase,
      label: "Manage Placements",
      desc: "Record and manage student job placements.",
      color: "bg-[#7b1f4c]",
      border: "border-[#7b1f4c]",
      view: "placements",
    },
    {
      icon: Factory,
      label: "Industrial Training",
      desc: "Assign and document student internships.",
      color: "bg-orange-500",
      border: "border-orange-500",
      view: "training",
    },
    {
      icon: ClipboardList,
      label: "Guest Lectures",
      desc: "Keep a record of all expert talks.",
      color: "bg-gray-500",
      border: "border-gray-500",
      view: "lectures",
    },
  ];
  return (
    <div className="space-y-6">
      <HeroBanner
        name={me?.name || "TPO"}
        role="Training & Placement"
        palette="tpo"
        subtitle={<span className="text-white/80">Placements · Internships · Guest Lectures</span>}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <button
            key={c.view}
            onClick={() => onNav(c.view)}
            className={`flex items-center gap-4 p-4 bg-white rounded border-t-4 ${c.border} shadow-sm hover:shadow-md transition-shadow text-left w-full`}
          >
            <span className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${c.color}`}>
              <c.icon className="w-6 h-6 text-white" />
            </span>
            <span>
              <p className="font-semibold text-gray-800 text-sm">{c.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── PLACEMENTS ───────────────────────────────────────────────────────────────
function PlacementsView({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const listQ = useQuery({ queryKey: ["tpo-placements"], queryFn: () => listPlacements({ data: {} }) });
  const [open, setOpen] = useState(false);
  const create = useMutation({
    mutationFn: (d: any) => upsertPlacement({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tpo-placements"] });
      setOpen(false);
    },
  });
  const del = useMutation({
    mutationFn: (id: number) => deletePlacement({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tpo-placements"] }),
  });

  const rows = listQ.data ?? [];
  const latestYear = rows.length ? Math.max(...rows.map((r: any) => r.year)) : new Date().getFullYear();
  const byCompany = useMemo(() => {
    const agg = new Map<string, number>();
    rows
      .filter((r: any) => r.year === latestYear)
      .forEach((r: any) => agg.set(r.company, (agg.get(r.company) ?? 0) + 1));
    return Array.from(agg.entries()).map(([label, value]) => ({ label, value }));
  }, [rows, latestYear]);

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Placement Data</h1>
          <p className="text-xs text-gray-400">View and analyze student placement records.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-[#7b1f4c] text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Placement
        </button>
      </div>

      {byCompany.length > 0 && (
        <Card>
          <p className="font-semibold text-gray-800 mb-3">Placements by Company ({latestYear})</p>
          <BarStats data={byCompany} color="#7b1f4c" />
        </Card>
      )}

      <Card>
        <p className="font-semibold text-gray-800 mb-4">All Placement Records</p>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Student Name</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Roll Number</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Company</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Year</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Package (LPA)</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.student_name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.roll_number ?? "—"}</td>
                  <td className="px-4 py-3">{r.company}</td>
                  <td className="px-4 py-3">{r.year}</td>
                  <td className="px-4 py-3">{r.package_lpa != null ? r.package_lpa : "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm("Delete record?")) del.mutate(r.id);
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
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No placement records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="bg-white rounded-lg p-5 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">Add Placement Record</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                create.mutate({
                  student_name: fd.get("student_name"),
                  roll_number: fd.get("roll_number") || null,
                  branch: fd.get("branch") || null,
                  company: fd.get("company"),
                  package_lpa: fd.get("package_lpa") ? Number(fd.get("package_lpa")) : null,
                  year: Number(fd.get("year")),
                });
              }}
              className="space-y-3 text-sm"
            >
              <div className="grid grid-cols-2 gap-3">
                <input name="student_name" required placeholder="Student Name" className="border rounded px-3 py-2" />
                <input name="roll_number" placeholder="Roll Number" className="border rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input name="company" required placeholder="Company" className="border rounded px-3 py-2" />
                <input name="branch" placeholder="Branch (e.g. civil)" className="border rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="year"
                  type="number"
                  required
                  defaultValue={new Date().getFullYear()}
                  placeholder="Year"
                  className="border rounded px-3 py-2"
                />
                <input
                  name="package_lpa"
                  type="number"
                  step="0.1"
                  placeholder="Package (LPA)"
                  className="border rounded px-3 py-2"
                />
              </div>
              {create.error && <p className="text-xs text-rose-700">{(create.error as Error).message}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="border px-3 py-1.5 rounded">
                  Cancel
                </button>
                <button
                  disabled={create.isPending}
                  className="bg-[#7b1f4c] text-white px-4 py-1.5 rounded disabled:opacity-50"
                >
                  {create.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INDUSTRIAL TRAINING ──────────────────────────────────────────────────────
function TrainingView({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const listQ = useQuery({ queryKey: ["tpo-training"], queryFn: () => listIndustrialTraining({ data: {} }) });
  const [open, setOpen] = useState(false);
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState<number | "">("");
  const [picked, setPicked] = useState<Record<number, string>>({});

  const studentsQ = useQuery({
    enabled: open,
    queryKey: ["tpo-students", branch, semester],
    queryFn: () => tpoListStudents({ data: { branch: branch || undefined, semester: semester || undefined } }),
  });

  const create = useMutation({
    mutationFn: (d: any) => createIndustrialTraining({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tpo-training"] });
      setOpen(false);
      setPicked({});
    },
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteIndustrialTraining({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tpo-training"] }),
  });

  const rows = listQ.data ?? [];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Industrial Training</h1>
          <p className="text-xs text-gray-400">Assign and document student internships.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-[#7b1f4c] text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Assign Training
        </button>
      </div>

      <Card>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Training Type</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Students</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Company</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Period</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.training_type}</td>
                  <td className="px-4 py-3">
                    {Array.isArray(r.student_names) ? (r.student_names as string[]).join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3">{r.company ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {r.start_date ?? "—"}
                    {r.end_date ? ` → ${r.end_date}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm("Delete training record?")) del.mutate(r.id);
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
                    No training records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-5 w-full max-w-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-4">Assign New Industrial Training</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const ids = Object.keys(picked).map(Number);
                create.mutate({
                  training_type: fd.get("training_type"),
                  branch: branch || null,
                  semester: semester || null,
                  student_ids: ids,
                  student_names: ids.map((id) => picked[id]),
                  company: fd.get("company") || null,
                  start_date: fd.get("start_date") || null,
                  end_date: fd.get("end_date") || null,
                });
              }}
              className="space-y-4 text-sm"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Training Type</label>
                  <input
                    name="training_type"
                    required
                    placeholder="e.g. Internship II (5th Sem)"
                    className="border rounded w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Class</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="Branch"
                      className="border rounded px-2 py-2"
                    />
                    <input
                      value={semester}
                      onChange={(e) => setSemester(e.target.value ? Number(e.target.value) : "")}
                      type="number"
                      placeholder="Sem"
                      className="border rounded px-2 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded p-3">
                <p className="font-semibold text-gray-700 mb-2">Select Students</p>
                {studentsQ.isLoading ? (
                  <p className="text-xs text-gray-400">Loading…</p>
                ) : (studentsQ.data ?? []).length === 0 ? (
                  <p className="text-xs text-gray-400">Enter a branch/semester above to list students.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {(studentsQ.data ?? []).map((s: any) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!picked[s.id]}
                          onChange={(e) => {
                            const next = { ...picked };
                            if (e.target.checked) next[s.id] = s.name;
                            else delete next[s.id];
                            setPicked(next);
                          }}
                          className="accent-[#7b1f4c]"
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Company / Organization</label>
                <input
                  name="company"
                  placeholder="e.g. Tech Solutions Co., Chandigarh"
                  className="border rounded w-full px-3 py-2 bg-blue-50/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                  <input name="start_date" type="date" className="border rounded w-full px-3 py-2" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                  <input name="end_date" type="date" className="border rounded w-full px-3 py-2" />
                </div>
              </div>
              {create.error && <p className="text-xs text-rose-700">{(create.error as Error).message}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" className="border px-4 py-1.5 rounded text-gray-600">
                  Generate Training Letter
                </button>
                <button type="button" onClick={() => setOpen(false)} className="border px-4 py-1.5 rounded">
                  Cancel
                </button>
                <button
                  disabled={create.isPending}
                  className="bg-[#7b1f4c] text-white px-4 py-1.5 rounded disabled:opacity-50"
                >
                  {create.isPending ? "Saving…" : "Assign Training"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GUEST LECTURES ───────────────────────────────────────────────────────────
function LecturesView({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const listQ = useQuery({ queryKey: ["tpo-lectures"], queryFn: () => listGuestLectures() });
  const [open, setOpen] = useState(false);
  const create = useMutation({
    mutationFn: (d: any) => createGuestLecture({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tpo-lectures"] });
      setOpen(false);
    },
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteGuestLecture({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tpo-lectures"] }),
  });
  const rows = listQ.data ?? [];

  return (
    <div className="space-y-4">
      <BackBtn onClick={onBack} />
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Guest Lectures</h1>
            <p className="text-xs text-gray-400">Record and manage guest lectures, expert talks, and seminars.</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="bg-[#7b1f4c] text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </div>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Topic</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Speaker</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Department</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.topic}</td>
                  <td className="px-4 py-3">{r.speaker}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.lecture_date ?? "—"}</td>
                  <td className="px-4 py-3">{r.department ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm("Delete record?")) del.mutate(r.id);
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
                    No guest lectures recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="bg-white rounded-lg p-5 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">Add New Lecture Record</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                create.mutate({
                  topic: fd.get("topic"),
                  speaker: fd.get("speaker"),
                  lecture_date: fd.get("lecture_date") || null,
                  department: fd.get("department") || null,
                  detail: fd.get("detail") || null,
                });
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Topic</label>
                <input name="topic" required className="border rounded w-full px-3 py-2" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Speaker</label>
                <input name="speaker" required className="border rounded w-full px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Date</label>
                  <input name="lecture_date" type="date" className="border rounded w-full px-3 py-2" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Department</label>
                  <input name="department" className="border rounded w-full px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Details (Optional)</label>
                <textarea name="detail" rows={3} className="border rounded w-full px-3 py-2 resize-y" />
              </div>
              {create.error && <p className="text-xs text-rose-700">{(create.error as Error).message}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="border px-3 py-1.5 rounded">
                  Cancel
                </button>
                <button
                  disabled={create.isPending}
                  className="bg-[#7b1f4c] text-white px-4 py-1.5 rounded disabled:opacity-50"
                >
                  {create.isPending ? "Saving…" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
