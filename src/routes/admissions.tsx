import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageHeader, PageLayout } from "@/components/layout/PageLayout";

export const Route = createFileRoute("/admissions")({
  head: () => ({ meta: [
    { title: "Admissions 2024-25 — GP Kinnaur" },
    { name: "description", content: "Apply for the Diploma in Civil & Mechanical Engineering at Government Polytechnic, Kinnaur. Eligibility, fees and important dates." },
  ] }),
  component: Admissions,
});

const steps = ["Check Eligibility", "Fill Application", "Counselling", "Admission"];
const dates = [
  { label: "Application Start", value: "Jun 2024" },
  { label: "Counselling", value: "Jul 2024" },
  { label: "Last Date", value: "Aug 2024" },
  { label: "Session Start", value: "Sep 2024" },
];

function Admissions() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Admissions" }]} />
      <PageHeader title="Admissions 2024-25" subtitle="Diploma in Civil & Mechanical Engineering" />
      <div className="container mx-auto px-4 py-10 space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-[color:var(--navy)] mb-4">How to Apply</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={s} className="bg-white border rounded-lg p-5 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-[color:var(--gold)] text-[color:var(--navy)] flex items-center justify-center font-bold">{i + 1}</div>
                <p className="mt-3 font-medium">{s}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[color:var(--navy)] mb-4">Eligibility Criteria</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-lg p-5">
              <h3 className="font-semibold text-[color:var(--navy)] mb-2">Direct Entry (1st Year)</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>10th pass with minimum 45% marks (40% for SC/ST)</li>
                <li>Subjects: Science &amp; Mathematics mandatory</li>
              </ul>
            </div>
            <div className="bg-white border rounded-lg p-5">
              <h3 className="font-semibold text-[color:var(--navy)] mb-2">Lateral Entry (2nd Year)</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>12th pass (Science stream) OR ITI pass (relevant trade)</li>
                <li>Minimum 45% marks</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[color:var(--navy)] mb-4">Fee Structure</h2>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y">
                <tr><td className="px-4 py-3 font-medium">Tuition Fee</td><td className="px-4 py-3">Rs. 8,000 per year</td></tr>
                <tr><td className="px-4 py-3 font-medium">Development Fee</td><td className="px-4 py-3">Rs. 2,000 per year</td></tr>
                <tr><td className="px-4 py-3 font-medium">Other Charges</td><td className="px-4 py-3">As per HP Govt norms</td></tr>
                <tr><td className="px-4 py-3 font-medium">Scholarship</td><td className="px-4 py-3">Available for eligible students</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[color:var(--navy)] mb-4">Important Dates</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {dates.map((d) => (
              <div key={d.label} className="bg-white border rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">{d.label}</p>
                <p className="font-bold text-[color:var(--navy)] mt-1">{d.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[color:var(--navy)] text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Need Help?</h2>
          <p className="text-white/80 mb-4">For admission queries call <strong>01781-292440</strong> or email gpkinnaur@rediffmail.com</p>
          <a href="#" className="inline-block px-6 py-3 bg-[color:var(--gold)] text-[color:var(--navy)] font-semibold rounded-md">Download Prospectus</a>
        </section>
      </div>
    </PageLayout>
  );
}
