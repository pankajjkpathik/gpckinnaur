import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageHeader, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/training-placement")({
  head: () => pageMeta({
    title: "Training & Placement — GP Kinnaur",
    description: "Training and Placement Cell of Government Polytechnic, Kinnaur — placement data and statistics for recent academic sessions.",
    path: "/training-placement",
  }),
  component: Placement,
});

type Row = { dept: string; adm: number | string; pass: number | string; placed: number | string; higher: number | string };
const sessions: { year: string; rows: Row[] }[] = [
  { year: "2024-25", rows: [
    { dept: "Civil Engineering", adm: 45, pass: "—", placed: "00", higher: "06" },
    { dept: "Mechanical Engineering", adm: 13, pass: 13, placed: 12, higher: "01" },
  ] },
  { year: "2023-24", rows: [
    { dept: "Civil Engineering", adm: 42, pass: "—", placed: "01", higher: "05" },
    { dept: "Mechanical Engineering", adm: "03", pass: "02", placed: "02", higher: "00" },
  ] },
  { year: "2022-23", rows: [
    { dept: "Civil Engineering", adm: 23, pass: "—", placed: "04", higher: "08" },
    { dept: "Mechanical Engineering", adm: 7, pass: 1, placed: 1, higher: 0 },
  ] },
];

function Placement() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Training & Placement" }]} />
      <PageHeader title="Training & Placement" />
      <div className="container mx-auto px-4 py-10 space-y-10">
        <div className="text-sm text-muted-foreground leading-relaxed max-w-4xl">
          <p>
            The Training and Placement Cell at Government Polytechnic, Kinnaur is a dedicated team that works
            towards providing students with the best career opportunities. The cell strives to bridge the gap
            between industry and academia, ensuring that students are well-prepared for the professional world.
          </p>
          <p className="mt-3">
            Our placement process is transparent and aims to provide a level playing field for all students. We
            have a consistent track record of placing our students in reputable companies. The following tables
            provide a summary of our placement data for recent academic sessions.
          </p>
        </div>

        {sessions.map((s) => (
          <section key={s.year}>
            <h2 className="text-xl font-bold text-[color:var(--navy)] text-center mb-4">
              Placement Data for the session {s.year}
            </h2>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--navy-dark)] text-white text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">S.No</th>
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-center">Total Admissions</th>
                    <th className="px-4 py-3 text-center">Total Passouts</th>
                    <th className="px-4 py-3 text-center">Total Placed</th>
                    <th className="px-4 py-3 text-center">Higher Education</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {s.rows.map((r, i) => (
                    <tr key={r.dept}>
                      <td className="px-4 py-3">{i + 1}.</td>
                      <td className="px-4 py-3 font-medium text-[color:var(--navy)]">{r.dept}</td>
                      <td className="px-4 py-3 text-center">{r.adm}</td>
                      <td className="px-4 py-3 text-center">{r.pass}</td>
                      <td className="px-4 py-3 text-center">{r.placed}</td>
                      <td className="px-4 py-3 text-center">{r.higher}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </PageLayout>
  );
}
