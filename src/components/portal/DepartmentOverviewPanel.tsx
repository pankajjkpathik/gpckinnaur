import { GraduationCap, Users, Briefcase, TrendingUp, BarChart3, ClipboardList, BookOpen, Award, Building2, UserCircle2 } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { BarStats } from "@/components/portal/Charts";
import { facultyPhoto } from "@/lib/faculty-photos";
import { initialsOf } from "@/lib/portal-identity";

/* ─── Presentation primitives ─────────────────────────────────────────────── */

function SectionCard({
  title,
  description,
  icon: Icon,
  accent = "from-[#7b1f4c] to-[#a63a6b]",
  children,
  className = "",
}: {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  accent?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden ${className}`}
    >
      <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          {Icon && (
            <span className={`shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br ${accent} text-white flex items-center justify-center shadow-sm`}>
              <Icon className="w-4.5 h-4.5" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 leading-tight">{title}</h3>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg bg-gray-50/40">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  gradient,
  ring,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  gradient: string;
  ring: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} text-white p-5 shadow-md hover:shadow-lg transition-shadow group`}
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-colors" aria-hidden />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-white/80 font-medium">{label}</p>
          <p className="text-3xl font-extrabold mt-1 leading-none">{value}</p>
        </div>
        <span className={`w-11 h-11 rounded-lg flex items-center justify-center bg-white/15 ring-1 ${ring}`}>
          <Icon className="w-5 h-5 text-white" />
        </span>
      </div>
    </div>
  );
}

/* ─── Types & main panel ──────────────────────────────────────────────────── */

export type DeptOverviewData = {
  student_count: number;
  faculty_count: number;
  training_count: number;
  placement_count: number;
  attendance_by_semester: { label: string; value: number }[];
  faculty_workload: { label: string; value: number }[];
  syllabus_coverage: { label: string; value: number }[];
  class_test_performance: { label: string; value: number }[];
  house_test_performance: { label: string; value: number }[];
  placements_by_company: { label: string; value: number }[];
  faculty_details: { id: number; username: string; name?: string | null; role: string; department: string | null; load: number }[];
};

export function DepartmentOverviewPanel({ d }: { d: DeptOverviewData }) {
  const maxLoad = Math.max(1, ...d.faculty_details.map((f) => f.load || 0));

  return (
    <div className="space-y-6">
      {/* Stat tiles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={GraduationCap} label="Students" value={d.student_count} gradient="from-[#7b1f4c] to-[#b04277]" ring="ring-white/20" />
        <StatTile icon={Users} label="Faculty" value={d.faculty_count} gradient="from-indigo-500 to-violet-500" ring="ring-white/20" />
        <StatTile icon={Briefcase} label="Industrial Training" value={d.training_count} gradient="from-orange-500 to-amber-500" ring="ring-white/20" />
        <StatTile icon={TrendingUp} label="Placements" value={d.placement_count} gradient="from-emerald-500 to-teal-500" ring="ring-white/20" />
      </div>

      {/* Attendance — full width */}
      <SectionCard
        title="Attendance % — Ongoing Semesters"
        description="Aggregated attendance across all classes for the current term."
        icon={ClipboardList}
        accent="from-[#7b1f4c] to-[#a63a6b]"
      >
        {d.attendance_by_semester.length > 0
          ? <BarStats data={d.attendance_by_semester} color="#7b1f4c" />
          : <EmptyState message="No attendance data yet." />}
      </SectionCard>

      {/* Two-column analytics */}
      <div className="grid lg:grid-cols-2 gap-5">
        <SectionCard
          title="Faculty Workload"
          description="Weekly periods assigned per faculty member."
          icon={Users}
          accent="from-indigo-500 to-violet-500"
        >
          {d.faculty_workload.length > 0
            ? <BarStats data={d.faculty_workload} color="#6366f1" />
            : <EmptyState message="No timetable data yet." />}
        </SectionCard>

        <SectionCard
          title="Syllabus Coverage"
          description="Percentage of syllabus completed per subject."
          icon={BookOpen}
          accent="from-emerald-500 to-teal-500"
        >
          {d.syllabus_coverage.length > 0
            ? <BarStats data={d.syllabus_coverage} color="#10b981" />
            : <EmptyState message="No syllabus/lesson-plan data yet." />}
        </SectionCard>

        <SectionCard
          title="Class Test Performance"
          description="Approved class-test averages by subject."
          icon={BarChart3}
          accent="from-sky-500 to-cyan-500"
        >
          {d.class_test_performance.length > 0
            ? <BarStats data={d.class_test_performance} color="#0ea5e9" />
            : <EmptyState message="No class test marks approved yet." />}
        </SectionCard>

        <SectionCard
          title="House Test Performance"
          description="Approved house-test averages by subject."
          icon={Award}
          accent="from-amber-500 to-orange-500"
        >
          {d.house_test_performance.length > 0
            ? <BarStats data={d.house_test_performance} color="#f59e0b" />
            : <EmptyState message="No house test marks approved yet." />}
        </SectionCard>
      </div>

      {/* Placements */}
      <SectionCard
        title="Placements by Company"
        description="Distribution of student placements across recruiters."
        icon={Building2}
        accent="from-rose-500 to-pink-500"
      >
        {d.placements_by_company.length > 0
          ? <BarStats data={d.placements_by_company} color="#7b1f4c" />
          : <EmptyState message="No placement records for this branch yet." />}
      </SectionCard>

      {/* Faculty details */}
      <SectionCard
        title="Faculty Details"
        description={`${d.faculty_details.length} member${d.faculty_details.length === 1 ? "" : "s"} in this department.`}
        icon={UserCircle2}
        accent="from-slate-600 to-slate-800"
      >
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/60">
              <tr>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Name</th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Role</th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Department</th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-gray-500 font-semibold w-64">Weekly Load</th>
              </tr>
            </thead>
            <tbody>
              {d.faculty_details.map((f, idx) => {
                const displayName = (f.name || f.username || "").toUpperCase();
                const photo = facultyPhoto(f.name || f.username);
                const pct = Math.min(100, Math.round(((f.load || 0) / maxLoad) * 100));
                return (
                  <tr
                    key={f.id}
                    className={`border-t border-gray-100 hover:bg-[#7b1f4c]/5 transition-colors ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {photo ? (
                          <img src={photo} alt={displayName} className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
                        ) : (
                          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7b1f4c] to-[#b04277] text-white text-xs font-semibold flex items-center justify-center ring-2 ring-white shadow-sm">
                            {initialsOf(f.name || f.username)}
                          </span>
                        )}
                        <span className="font-medium text-gray-800">{displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 capitalize">
                        {f.role.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{f.department ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#7b1f4c] to-[#b04277] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 tabular-nums w-20 text-right">
                          {f.load} periods
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {d.faculty_details.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                    No faculty found for this department.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
