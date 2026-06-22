import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/staff/non-teaching")({
  head: () => pageMeta({
    title: "Non-Teaching Staff — GP Kinnaur",
    description: "Non-teaching staff at GP Kinnaur — workshop instructors, lab assistants, librarian and support personnel across departments.",
    path: "/staff/non-teaching",
  }),
  component: NonTeaching,
});

const rows = [
  ["Sh. Hari Singh", "Workshop Instructor", "Fitting"],
  ["Smt. Neeraj Bala", "Assistant Librarian", "Library"],
  ["Sh. Dhian Singh", "Lab Assistant", "—"],
  ["Sh. Dinesh Kumar", "Lab Assistant", "—"],
  ["Sh. Raj Kumar", "Workshop Attendant", "—"],
];

function NonTeaching() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Staff" }, { label: "Non-Teaching Staff" }]} />
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-[color:var(--navy)] mb-6">Non-Teaching Staff</h1>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--navy)] text-white">
              <tr>
                <th className="px-3 py-2 text-left">S.No</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Designation</th>
                <th className="px-3 py-2 text-left">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r, i) => (
                <tr key={i} className={i % 2 ? "bg-secondary/30" : ""}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2 font-medium">{r[0]}</td>
                  <td className="px-3 py-2">{r[1]}</td>
                  <td className="px-3 py-2">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
