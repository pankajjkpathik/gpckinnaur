import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Briefcase,
  Factory,
  ClipboardList,
  ArrowLeft,
  Plus,
  Trash2,
  TrendingUp,
  Building2,
  GraduationCap,
  Mic,
  FileText,
  FileSignature,
} from "lucide-react";
import { generateTrainingLetter, generateUndertakings } from "@/lib/training-letter";
import { staffMe, uploadStaffAvatar } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { tpoRoles, hasRole } from "@/lib/roles";
import { BarStats } from "@/components/portal/Charts";
import { HeroBanner } from "@/components/portal/HeroBanner";
import { QuickCard } from "@/components/portal/QuickCard";
import { avatarUrl } from "@/lib/portal-identity";
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

function BackBtn({ onClick }: { onClick?: () => void }) {
  if (!onClick) return null;
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scrollToHash = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (!h) return;
      const el = document.getElementById(h);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <PortalShell
      title="Training & Placement Portal"
      subtitle="Placements · Internships · Guest Lectures"
      me={me as any}
      accent="rose"
    >
      <main className="p-4 md:p-6 space-y-10">
        <section id="home"><HomeView onNav={scrollTo} me={me as any} /></section>
        <section id="placements" className="scroll-mt-6"><PlacementsView /></section>
        <section id="training" className="scroll-mt-6"><TrainingView /></section>
        <section id="lectures" className="scroll-mt-6"><LecturesView /></section>
      </main>
    </PortalShell>
  );
}

function HomeView({ onNav, me }: { onNav: (id: string) => void; me: any }) {
  const qc = useQueryClient();
  const uploadFn = useServerFn(uploadStaffAvatar);
  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller");
      const b64: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onerror = () => reject(new Error("Failed to read file"));
        r.onload = () => {
          const s = String(r.result || "");
          const i = s.indexOf(",");
          resolve(i >= 0 ? s.slice(i + 1) : s);
        };
        r.readAsDataURL(file);
      });
      return uploadFn({ data: { filename: file.name, contentType: file.type || "image/png", contentBase64: b64 } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-me"] });
      qc.invalidateQueries({ queryKey: ["staff-me-profile"] });
    },
  });

  const placementsQ = useQuery({ queryKey: ["tpo-placements"], queryFn: () => listPlacements({ data: {} }) });
  const trainingsQ = useQuery({ queryKey: ["tpo-training"], queryFn: () => listIndustrialTraining({ data: {} }) });
  const lecturesQ = useQuery({ queryKey: ["tpo-lectures"], queryFn: () => listGuestLectures() });

  const placements = placementsQ.data ?? [];
  const trainings = trainingsQ.data ?? [];
  const lectures = lecturesQ.data ?? [];

  const currentYear = new Date().getFullYear();
  const placementsThisYear = placements.filter((r: any) => r.year === currentYear).length;
  const avgPackage = useMemo(() => {
    const withPkg = placements.filter((r: any) => r.year === currentYear && r.package_lpa);
    if (!withPkg.length) return null;
    const total = withPkg.reduce((s: number, r: any) => s + Number(r.package_lpa), 0);
    return (total / withPkg.length).toFixed(1);
  }, [placements, currentYear]);
  const topCompanies = useMemo(() => {
    const agg = new Map<string, number>();
    placements
      .filter((r: any) => r.year === currentYear)
      .forEach((r: any) => agg.set(r.company, (agg.get(r.company) ?? 0) + 1));
    return Array.from(agg.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [placements, currentYear]);
  // Filter state for Recent Placements & Guest Lectures panels
  const [placeCompany, setPlaceCompany] = useState<string>("");
  const [placeYear, setPlaceYear] = useState<string>("");
  const [lectureDept, setLectureDept] = useState<string>("");

  const companyOptions = useMemo(
    () => Array.from(new Set(placements.map((r: any) => r.company).filter(Boolean))).sort(),
    [placements],
  );
  const yearOptions = useMemo(
    () =>
      Array.from(new Set(placements.map((r: any) => r.year).filter(Boolean)))
        .sort((a: any, b: any) => b - a),
    [placements],
  );
  const deptOptions = useMemo(
    () => Array.from(new Set(lectures.map((r: any) => r.department).filter(Boolean))).sort(),
    [lectures],
  );

  const recentPlacements = useMemo(
    () =>
      [...placements]
        .filter((r: any) => (placeCompany ? r.company === placeCompany : true))
        .filter((r: any) => (placeYear ? String(r.year) === placeYear : true))
        .sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0))
        .slice(0, 5),
    [placements, placeCompany, placeYear],
  );
  const recentLectures = useMemo(
    () =>
      [...lectures]
        .filter((r: any) => (lectureDept ? r.department === lectureDept : true))
        .sort((a: any, b: any) => (b.lecture_date ?? "").localeCompare(a.lecture_date ?? ""))
        .slice(0, 4),
    [lectures, lectureDept],
  );

  const quickActions: { view: View; icon: any; label: string; desc: string; color: string; border: string; stat: number; statLabel: string }[] = [
    {
      view: "placements",
      icon: Briefcase,
      label: "Placements",
      desc: "Track student job offers & CTC",
      color: "bg-[#7b1f4c]",
      border: "border-[#7b1f4c]",
      stat: placementsThisYear,
      statLabel: `Placed in ${currentYear}`,
    },
    {
      view: "training",
      icon: Factory,
      label: "Industrial Training",
      desc: "Assign & document internships",
      color: "bg-orange-500",
      border: "border-orange-500",
      stat: trainings.length,
      statLabel: "Training records",
    },
    {
      view: "lectures",
      icon: ClipboardList,
      label: "Guest Lectures",
      desc: "Log expert talks & seminars",
      color: "bg-cyan-600",
      border: "border-cyan-600",
      stat: lectures.length,
      statLabel: "Lectures logged",
    },
  ];

  return (
    <div className="space-y-6">
      <HeroBanner
        name={me?.name || me?.username || "TPO"}
        role="Training & Placement Officer"
        avatarSrc={avatarUrl(me)}
        onAvatarChange={(f) => uploadAvatar.mutate(f)}
        avatarUploading={uploadAvatar.isPending}
        palette="tpo"
        subtitle={
          <>
            Placement Year <span className="font-semibold text-cyan-200">{currentYear}</span>
            <span className="text-white/70"> · Use the left panel to jump into any module.</span>
          </>
        }
        stats={[
          { value: placementsThisYear, label: "Placed" },
          { value: trainings.length, label: "Trainings" },
          { value: avgPackage ? `${avgPackage}L` : "—", label: "Avg CTC" },
        ]}
      />

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gradient-to-r from-cyan-50 to-white border-b">
          <p className="font-semibold text-gray-800">Quick Actions</p>
          <p className="text-[11px] text-gray-500">Jump straight into placements, internships, or lectures.</p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((q) => (
            <QuickCard
              key={q.view}
              icon={q.icon}
              label={q.label}
              desc={q.desc}
              color={q.color}
              border={q.border}
              stat={q.stat}
              statLabel={q.statLabel}
              onClick={() => onNav(q.view)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile icon={TrendingUp} label="Total Placements" value={placements.length} tone="from-fuchsia-500 to-rose-500" />
        <KpiTile icon={GraduationCap} label={`Placed in ${currentYear}`} value={placementsThisYear} tone="from-cyan-500 to-sky-600" />
        <KpiTile icon={Building2} label="Unique Companies" value={new Set(placements.map((p: any) => p.company)).size} tone="from-amber-500 to-orange-600" />
        <KpiTile icon={Mic} label="Guest Lectures" value={lectures.length} tone="from-emerald-500 to-teal-600" />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">Top Recruiters ({currentYear})</p>
              <p className="text-[11px] text-gray-500">Placement count by company this year.</p>
            </div>
            <button onClick={() => onNav("placements")} className="text-[11px] text-cyan-700 hover:underline">
              View all →
            </button>
          </div>
          <div className="p-5">
            {topCompanies.length > 0 ? (
              <BarStats data={topCompanies} color="#0e7490" />
            ) : (
              <p className="text-xs text-gray-400 py-8 text-center">
                No placements recorded for {currentYear} yet. Add one to see the chart.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800">Recent Placements</p>
                <p className="text-[11px] text-gray-500">Latest offers on record.</p>
              </div>
              {(placeCompany || placeYear) && (
                <button
                  onClick={() => { setPlaceCompany(""); setPlaceYear(""); }}
                  className="text-[10px] text-gray-500 hover:text-cyan-700 underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={placeCompany}
                onChange={(e) => setPlaceCompany(e.target.value)}
                className="flex-1 min-w-0 border rounded px-2 py-1 text-[11px] bg-white"
              >
                <option value="">All companies</option>
                {companyOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={placeYear}
                onChange={(e) => setPlaceYear(e.target.value)}
                className="w-24 border rounded px-2 py-1 text-[11px] bg-white"
              >
                <option value="">All years</option>
                {yearOptions.map((y: any) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <ul className="divide-y">
            {recentPlacements.length === 0 ? (
              <li className="p-5 text-xs text-gray-400 text-center">No placements yet.</li>
            ) : (
              recentPlacements.map((r: any) => (
                <li key={r.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white flex items-center justify-center text-xs font-bold shadow">
                    {(r.student_name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.student_name}</p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {r.company} · {r.year}
                    </p>
                  </div>
                  {r.package_lpa != null && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                      ₹{r.package_lpa}L
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-800 flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-700" /> Recent Guest Lectures
              </p>
              <p className="text-[11px] text-gray-500">Latest expert sessions organised.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={lectureDept}
                onChange={(e) => setLectureDept(e.target.value)}
                className="border rounded px-2 py-1 text-[11px] bg-white"
              >
                <option value="">All departments</option>
                {deptOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <button onClick={() => onNav("lectures")} className="text-[11px] text-cyan-700 hover:underline whitespace-nowrap">
                All lectures →
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recentLectures.length === 0 ? (
            <p className="col-span-full text-xs text-gray-400 py-6 text-center">
              No guest lectures logged yet.
            </p>
          ) : (
            recentLectures.map((l: any) => (
              <div key={l.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                <p className="text-sm font-semibold text-gray-800 truncate">{l.topic}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  <span className="text-gray-700 font-medium">{l.speaker}</span>
                  {l.department ? ` · ${l.department}` : ""}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                  {l.lecture_date ?? "Date TBD"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white border shadow-sm p-4">
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${tone} opacity-15 blur-2xl`} />
      <div className="relative flex items-center gap-3">
        <span className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tone} text-white flex items-center justify-center shadow`}>
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ─── PLACEMENTS ───────────────────────────────────────────────────────────────
function PlacementsView({ onBack }: { onBack?: () => void }) {
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
function TrainingView({ onBack }: { onBack?: () => void }) {
  const qc = useQueryClient();
  const listQ = useQuery({ queryKey: ["tpo-training"], queryFn: () => listIndustrialTraining({ data: {} }) });
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{ url: string; filename: string; title: string } | null>(null);
  const openPreview = async (title: string, builder: Promise<{ url: string; filename: string }>) => {
    const { url, filename } = await builder;
    setPreview((p) => { if (p) URL.revokeObjectURL(p.url); return { url, filename, title }; });
  };
  const closePreview = () => setPreview((p) => { if (p) URL.revokeObjectURL(p.url); return null; });
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openPreview("Industrial Training Letter", generateTrainingLetter(r))}
                        title="Preview Training Letter"
                        className="inline-flex items-center gap-1 text-xs text-cyan-700 border border-cyan-200 hover:bg-cyan-50 rounded px-2 py-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> Letter
                      </button>
                      <button
                        onClick={() => openPreview("Student & Parent Undertakings", generateUndertakings(r))}
                        title="Preview Student & Parent Undertakings"
                        className="inline-flex items-center gap-1 text-xs text-amber-700 border border-amber-200 hover:bg-amber-50 rounded px-2 py-1"
                      >
                        <FileSignature className="w-3.5 h-3.5" /> Undertakings
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete training record?")) del.mutate(r.id);
                        }}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
                <p className="text-[11px] text-gray-500 mr-auto">
                  After saving, download the Training Letter and Undertakings from the table below.
                </p>
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
function LecturesView({ onBack }: { onBack?: () => void }) {
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
