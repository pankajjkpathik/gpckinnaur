import { GraduationCap, Users, Briefcase, TrendingUp } from "lucide-react";
import { BarStats } from "@/components/portal/Charts";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border rounded-lg shadow-sm p-5 ${className}`}>{children}</div>;
}

function StatTile({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white border rounded-lg p-4 flex items-center gap-3">
      <span className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

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
  faculty_details: { id: number; username: string; role: string; department: string | null; load: number }[];
};

/** The exact same Department Overview body used in both HOD and Principal portals. */
export function DepartmentOverviewPanel({ d }: { d: DeptOverviewData }) {
  return (
    <div className="space-y-5">
      {/* Top stat tiles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={GraduationCap} label="Students" value={d.student_count} color="bg-[#7b1f4c]" />
        <StatTile icon={Users} label="Faculty" value={d.faculty_count} color="bg-indigo-500" />
        <StatTile icon={Briefcase} label="In Industrial Training" value={d.training_count} color="bg-orange-500" />
        <StatTile icon={TrendingUp} label="Placements" value={d.placement_count} color="bg-green-600" />
      </div>

      {/* Attendance % per ongoing semester */}
      <Card>
        <p className="font-semibold text-gray-800 mb-3">Attendance % — Ongoing Semesters</p>
        {d.attendance_by_semester.length > 0
          ? <BarStats data={d.attendance_by_semester} color="#7b1f4c" />
          : <p className="text-sm text-gray-400 text-center py-8">No attendance data yet.</p>}
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <p className="font-semibold text-gray-800 mb-3">Faculty Workload (periods/week)</p>
          {d.faculty_workload.length > 0
            ? <BarStats data={d.faculty_workload} color="#6366f1" />
            : <p className="text-sm text-gray-400 text-center py-8">No timetable data yet.</p>}
        </Card>

        <Card>
          <p className="font-semibold text-gray-800 mb-3">Syllabus Coverage (% by subject)</p>
          {d.syllabus_coverage.length > 0
            ? <BarStats data={d.syllabus_coverage} color="#10b981" />
            : <p className="text-sm text-gray-400 text-center py-8">No syllabus/lesson-plan data yet.</p>}
        </Card>

        <Card>
          <p className="font-semibold text-gray-800 mb-3">Class Test Performance (avg %)</p>
          {d.class_test_performance.length > 0
            ? <BarStats data={d.class_test_performance} color="#0ea5e9" />
            : <p className="text-sm text-gray-400 text-center py-8">No class test marks approved yet.</p>}
        </Card>

        <Card>
          <p className="font-semibold text-gray-800 mb-3">House Test Performance (avg %)</p>
          {d.house_test_performance.length > 0
            ? <BarStats data={d.house_test_performance} color="#f59e0b" />
            : <p className="text-sm text-gray-400 text-center py-8">No house test marks approved yet.</p>}
        </Card>
      </div>

      <Card>
        <p className="font-semibold text-gray-800 mb-3">Placements by Company</p>
        {d.placements_by_company.length > 0
          ? <BarStats data={d.placements_by_company} color="#7b1f4c" />
          : <p className="text-sm text-gray-400 text-center py-8">No placement records for this branch yet.</p>}
      </Card>

      <Card>
        <p className="font-semibold text-gray-800 mb-3">Faculty Details</p>
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Department</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Weekly Load</th>
              </tr>
            </thead>
            <tbody>
              {d.faculty_details.map((f) => (
                <tr key={f.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{f.username}</td>
                  <td className="px-4 py-3 capitalize text-gray-500">{f.role}</td>
                  <td className="px-4 py-3">{f.department ?? "—"}</td>
                  <td className="px-4 py-3">{f.load} periods</td>
                </tr>
              ))}
              {d.faculty_details.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No faculty found for this department.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
