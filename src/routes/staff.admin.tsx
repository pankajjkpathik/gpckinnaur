import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/staff/admin")({
  head: () => pageMeta({
    title: "Administrative Staff — GP Kinnaur",
    description: "Administrative team of Government Polytechnic, Kinnaur, including office clerks, junior assistants and supporting administrative roles.",
    path: "/staff/admin",
  }),
  component: AdminStaff,
});

const rows = [
  ["Ms. Draupadi", "Clerk"],
  ["Smt. Anjali", "Junior Office Assistant"],
  ["Sh. Sunil Kumar", "Peon (SWF)"],
  ["Ms. Laxmi", "Peon (SWF)"],
];

function AdminStaff() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Staff" }, { label: "Admin Staff" }]} />
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-[color:var(--navy)] mb-6">Admin Staff</h1>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--navy)] text-white">
              <tr>
                <th className="px-3 py-2 text-left">S.No</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Designation</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r, i) => (
                <tr key={i} className={i % 2 ? "bg-secondary/30" : ""}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2 font-medium">{r[0]}</td>
                  <td className="px-3 py-2">{r[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
