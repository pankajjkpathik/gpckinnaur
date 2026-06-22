import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/staff/committees")({
  head: () => pageMeta({
    title: "Institutional Committees — GP Kinnaur",
    description: "Statutory and institutional committees at GP Kinnaur including IQAC, anti-ragging, grievance redressal and women's grievance cells.",
    path: "/staff/committees",
  }),
  component: Committees,
});

type C = { title: string; members: { name: string; role?: string }[] };
const committees: C[] = [
  { title: "Internal Quality Cell", members: [
    { name: "Principal", role: "Chairman" }, { name: "HOD Civil" }, { name: "HOD Mechanical" }, { name: "Faculty representative" }, { name: "Student representative" },
  ]},
  { title: "Student Counselling Committee", members: [
    { name: "Principal" }, { name: "All HODs" }, { name: "Sh. Surya Negi", role: "Counsellor" },
  ]},
  { title: "Training & Placement Committee", members: [
    { name: "Principal", role: "Chairman" }, { name: "Er. Akshay Rana", role: "Coordinator" }, { name: "Er. Rohit Tiwari" }, { name: "Er. Manoj Negi" },
  ]},
  { title: "Student Grievance Cell", members: [
    { name: "Principal", role: "Chairman" }, { name: "HOD Civil" }, { name: "HOD Mechanical" }, { name: "Ms. Amonika", role: "Member" },
  ]},
  { title: "Women Grievance / Sexual Harassment Committee", members: [
    { name: "Principal" }, { name: "Ms. Amonika", role: "Presiding Officer" }, { name: "Smt. Neeraj Bala" }, { name: "External Female Member" },
  ]},
  { title: "Institution Purchase Committee", members: [
    { name: "Principal", role: "Chairman" }, { name: "HOD Civil" }, { name: "HOD Mechanical" }, { name: "Senior-most Non-Teaching Staff" },
  ]},
  { title: "SC/ST/OBC Grievance Committee", members: [
    { name: "Principal", role: "Chairman" }, { name: "Sh. Surya Negi" }, { name: "Sh. Ravinder Kumar" }, { name: "Student representative" },
  ]},
];

function Committees() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Staff" }, { label: "Committees" }]} />
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-[color:var(--navy)] mb-6">Institutional Committees</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {committees.map((c) => (
            <div key={c.title} className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-[color:var(--navy)] text-white px-4 py-2 font-semibold text-sm">{c.title}</div>
              <ul className="p-4 space-y-1 text-sm">
                {c.members.map((m, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[color:var(--gold)]">•</span>
                    <span>
                      {m.name}
                      {m.role && <span className="text-[color:var(--gold-dark)] font-semibold"> — {m.role}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
