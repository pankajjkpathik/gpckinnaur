import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";
import pankajpathik from "@/assets/faculty/pankajpathik.png.asset.json";

export const Route = createFileRoute("/about")({
  head: () => pageMeta({
    title: "About — Government Polytechnic, Kinnaur",
    description: "Established in 2013, GP Kinnaur offers AICTE-approved diploma programs in Civil and Mechanical Engineering, affiliated to HPTSB.",
    path: "/about",
  }),
  component: About,
});

const features = [
  "Government Institute under HP Government",
  "Affiliated to HP Takniki Shiksha Board (HPTSB)",
  "Approved by All India Council for Technical Education (AICTE)",
  "Diploma programs in Civil and Mechanical Engineering",
  "Experienced and qualified faculty",
  "Well-equipped laboratories and workshops",
  "Scholarship facilities for eligible students",
  "Placement assistance for students",
  "Anti-ragging committee for safe campus environment",
  "Student grievance redressal system",
];

function About() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "About" }, { label: "Institute" }]} />
      <div className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h1 className="text-3xl font-bold text-[color:var(--navy)] mb-3">About the Institute</h1>
            <p className="text-muted-foreground leading-relaxed">
              Government Polytechnic, Kinnaur was established in 2013 under the
              Himachal Pradesh government to provide quality technical education
              to the youth of Kinnaur district. The institute currently operates
              from its camp campus at Government Polytechnic Rohru, Distt. Shimla.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-l-4 border-l-[color:var(--gold)] rounded-lg p-5">
              <h3 className="font-bold text-[color:var(--navy)] mb-2">Our Vision</h3>
              <p className="italic text-sm text-muted-foreground">
                To be a premier technical institution providing world-class education
                and producing skilled engineers who contribute to the development of
                Himachal Pradesh and the nation.
              </p>
            </div>
            <div className="bg-white border border-l-4 border-l-[color:var(--gold)] rounded-lg p-5">
              <h3 className="font-bold text-[color:var(--navy)] mb-2">Our Mission</h3>
              <p className="italic text-sm text-muted-foreground">
                To impart quality technical education, develop practical skills,
                foster innovation, and produce industry-ready diploma engineers with
                strong ethical values.
              </p>
            </div>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--navy)] mb-3">Key Features</h2>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white border rounded-lg p-6">
            <h2 className="text-2xl font-bold text-[color:var(--navy)] mb-4">Principal&apos;s Message</h2>
            <div className="flex items-start gap-4">
              <img src={pankajpathik.url} alt="Sh. Pankaj K. Pathik" className="w-16 h-16 rounded-full object-cover border-2 border-[color:var(--gold)] shrink-0" />
              <div>
                <p className="font-semibold text-[color:var(--navy)]">Sh. Pankaj K. Pathik</p>
                <p className="text-xs text-muted-foreground mb-3">Principal · MCA, CCNA</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  It gives me immense pleasure to welcome you to Government Polytechnic,
                  Kinnaur. Our institute is committed to providing quality diploma
                  education, building practical engineering skills, and shaping
                  industry-ready professionals from the youth of our region.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                  We continue to invest in modern laboratories, qualified faculty, and
                  student welfare initiatives so that every student leaves the campus
                  with confidence, character, and a strong technical foundation.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <InfoCard
            title="Quick Information"
            rows={[
              ["Established", "2013"],
              ["Type", "Government"],
              ["Affiliation", "HPTSB"],
              ["Approval", "AICTE"],
              ["Courses", "2 Diploma Programs"],
              ["Location", "Kinnaur, HP"],
              ["Campus", "GP Rohru, Shimla"],
            ]}
          />
          <InfoCard
            title="Administration"
            rows={[
              ["Principal", "Sh. Pankaj K. Pathik"],
              ["HOD Civil", "Er. Punit Sharma"],
              ["HOD Mechanical", "Er. Akshay Rana"],
            ]}
          />
          <InfoCard
            title="Contact"
            rows={[
              ["Phone", "01781-292440"],
              ["Email", "gpkinnaur@rediffmail.com"],
            ]}
          />
        </aside>
      </div>
    </PageLayout>
  );
}

function InfoCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="bg-[color:var(--navy)] text-white px-4 py-2 font-semibold text-sm">{title}</div>
      <ul className="divide-y text-sm">
        {rows.map(([k, v]) => (
          <li key={k} className="px-4 py-2 flex justify-between gap-3">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-medium text-right">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
