import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, Clock, GraduationCap, Calendar, LayoutGrid, UserCheck, Award, Users, ScrollText, MessageSquare, FileSpreadsheet,
} from "lucide-react";
import { staffMe } from "@/lib/auth.functions";
import { PortalShell, portalMeta } from "@/components/portal/PortalShell";
import { adminRoles } from "@/lib/roles";

export const Route = createFileRoute("/admin")({
  head: () => portalMeta("Admin Console"),
  component: AdminHub,
});

const tiles = [
  { to: "/admin/subjects", icon: BookOpen, title: "Subjects", desc: "Course catalog by branch & semester" },
  { to: "/admin/periods", icon: Clock, title: "Periods Master", desc: "Daily bell schedule" },
  { to: "/admin/grading", icon: Award, title: "Grading Scheme", desc: "Grade boundaries & pass marks" },
  { to: "/admin/syllabus", icon: GraduationCap, title: "Syllabus", desc: "Unit & topic breakdown per subject" },
  { to: "/admin/calendar", icon: Calendar, title: "Academic Calendar", desc: "Semester dates, exams, holidays" },
  { to: "/admin/timetable", icon: LayoutGrid, title: "Timetable Builder", desc: "Class-wise weekly schedule" },
  { to: "/admin/assignments", icon: UserCheck, title: "Faculty Assignments", desc: "Map faculty to subjects & classes" },
  { to: "/admin/report-templates", icon: FileSpreadsheet, title: "Report Templates", desc: "Upload .xlsx for Attendance, Sessionals, Practicals" },
  { to: "/admin-users", icon: Users, title: "User Management", desc: "Staff & student accounts" },
  { to: "/admin/audit", icon: ScrollText, title: "Audit Log", desc: "System actions & login trail" },
  { to: "/messages", icon: MessageSquare, title: "Messages", desc: "Direct messages to staff & students" },
];

function AdminHub() {
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["staff-me"], queryFn: () => staffMe() });
  useEffect(() => {
    if (isLoading) return;
    if (!me) nav({ to: "/staff-login" });
    else if (!adminRoles.includes(me.role as any)) nav({ to: "/staff-dashboard" });
  }, [me, isLoading, nav]);
  if (isLoading || !me) return <div className="min-h-screen flex items-center justify-center text-sm">Loading…</div>;

  return (
    <PortalShell title="Admin Console" subtitle="System Configuration" me={me as any} accent="rose">
      <div className="container mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground mb-4">
          Set up master data and academic structure. All staff and student views read from these tables.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tiles.map((t) => (
            <Link key={t.to} to={t.to} className="bg-white border rounded-lg p-4 hover:shadow-md transition flex gap-3 items-start">
              <div className="w-10 h-10 rounded bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <t.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-[color:var(--navy)]">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
