import { createFileRoute, Link } from "@tanstack/react-router";
import { Breadcrumb, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/anti-ragging")({
  head: () => pageMeta({
    title: "Anti-Ragging — GP Kinnaur",
    description: "GP Kinnaur's anti-ragging policy, prohibited acts, committee members, and UGC anti-ragging helpline details for students and parents.",
    path: "/anti-ragging",
  }),
  component: AntiRagging,
});

const acts = [
  "Abusing, humiliating, teasing, insulting students",
  "Indulging in rowdy or undisciplined activities",
  "Asking students to do acts against their will",
  "Causing mental stress or physical harm",
  "Violating dignity of students",
  "Depriving students of basic necessities",
  "Encouraging others to indulge in ragging",
  "Physical assault or use of criminal force",
  "Sexual abuse or molestation",
  "Any other act deemed as ragging by the institution",
];

function AntiRagging() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Anti-Ragging" }]} />
      <div className="bg-destructive text-destructive-foreground">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-2xl">🚫</p>
          <h1 className="text-2xl font-bold text-white">ZERO TOLERANCE FOR RAGGING</h1>
          <p className="text-white/90 mt-1">Anti-Ragging Helpline: <strong>1800-180-5522</strong> (Toll Free, 24×7)</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10 space-y-8">
        <section className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold text-[color:var(--navy)] mb-2">What is Ragging?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ragging is any disorderly conduct (by words or by an act) that has the effect of teasing,
            treating or handling with rudeness any student, or that causes physical or psychological
            harm or raises apprehension or fear or shame in a fresher. GP Kinnaur enforces zero
            tolerance and follows the HP Educational Institution (Prohibition of Ragging) Act 2009
            and AICTE Anti-Ragging Regulations.
          </p>
        </section>

        <section className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold text-[color:var(--navy)] mb-3">Acts Constituting Ragging</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            {acts.map((a) => (<li key={a}>{a}</li>))}
          </ol>
        </section>

        <section className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold text-[color:var(--navy)] mb-3">Punishment</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Suspension / Expulsion from the institution</li>
            <li>FIR under the Indian Penal Code (IPC)</li>
            <li>Loss of scholarship / fellowship</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[color:var(--navy)] mb-3">Important Links</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <a href="#" className="bg-white border rounded-lg p-4 text-center text-sm font-medium hover:border-[color:var(--gold)]">AICTE Anti-Ragging Regulations</a>
            <a href="#" className="bg-white border rounded-lg p-4 text-center text-sm font-medium hover:border-[color:var(--gold)]">HP Act 2009 Full Text</a>
            <Link to="/staff/committees" className="bg-white border rounded-lg p-4 text-center text-sm font-medium hover:border-[color:var(--gold)]">Anti-Ragging Committee</Link>
            <a href="#" className="bg-white border rounded-lg p-4 text-center text-sm font-medium hover:border-[color:var(--gold)]">Anti-Ragging Squad</a>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
