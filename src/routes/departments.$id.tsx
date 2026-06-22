import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumb, PageLayout } from "@/components/layout/PageLayout";
import { getDepartment } from "@/lib/directory.functions";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/departments/$id")({
  head: ({ params }) => {
    const name = params.id === "1" ? "Civil Engineering" : params.id === "2" ? "Mechanical Engineering" : "Department";
    return pageMeta({
      title: `${name} — GP Kinnaur`,
      description: `Diploma in ${name} at Government Polytechnic, Kinnaur. 3-year AICTE-approved program, 30-seat intake, qualified faculty and well-equipped labs.`,
      path: `/departments/${params.id}`,
    });
  },
  component: DepartmentPage,
});

const CIVIL = {
  about:
    "The Department of Civil Engineering at GP Kinnaur offers a 3-year Diploma program that prepares students for careers in construction, infrastructure, and the public works sector. The curriculum balances theoretical foundations with hands-on practical training.",
  labs: ["Survey Lab", "Concrete Lab", "Soil Testing Lab", "Drawing Hall", "Fluid Mechanics Lab", "Material Testing Lab"],
  careers: ["Government Jobs (PWD, CPWD, Railways)", "Construction Companies", "Real Estate Development", "Urban Planning", "Further Studies (B.Tech)", "Self Employment / Contractor"],
  hod: { initials: "PS", name: "Er. Punit Sharma", title: "HOD, Civil Engineering", qual: "B.Tech Civil Engineering", exp: "13+ Years Experience" },
  highlights: ["Industry-aligned curriculum", "Site visits & internships", "Modern survey & testing equipment", "Strong placement record in PWD/private construction"],
};

const MECH = {
  about:
    "The Department of Mechanical Engineering offers a 3-year Diploma program focused on manufacturing, automotive, fluid power, and workshop technologies. Students gain strong practical exposure through extensive workshop training.",
  labs: ["Workshop", "Fitting Shop", "Welding Lab", "Machine Shop", "Automobile Lab", "Fluid Power Lab"],
  careers: ["Manufacturing Industry", "Automobile Sector", "HVAC Industry", "Government Jobs", "Further Studies (B.Tech)", "Self Employment"],
  hod: { initials: "AR", name: "Er. Akshay Rana", title: "Sr. Lecturer & HOD Mechanical", qual: "B.Tech Mechanical", exp: "13+ Years Experience" },
  highlights: ["Hands-on workshop training", "Modern CNC & welding setup", "Automobile lab tie-ups", "Excellent placement track record"],
};

function DepartmentPage() {
  const { id } = useParams({ from: "/departments/$id" });
  const isCivil = id === "1";
  const meta = isCivil ? CIVIL : MECH;
  const [tab, setTab] = useState(0);
  const tabs = ["About", "Career Options", "HOD Message", "Faculty"];

  const { data: dept } = useQuery({
    queryKey: ["dept", id],
    queryFn: () => getDepartment({ data: { id: Number(id) } }),
  });

  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Departments" }, { label: dept?.name || "Department" }]} />
      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold text-[color:var(--navy)]">{dept?.name || (isCivil ? "Civil Engineering" : "Mechanical Engineering")}</h1>
          <p className="text-muted-foreground mt-2">{dept?.description}</p>

          <div className="mt-6 border-b flex flex-wrap gap-1">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  tab === i ? "border-[color:var(--gold)] text-[color:var(--navy)]" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {tab === 0 && (
              <div className="space-y-6">
                <p className="leading-relaxed">{meta.about}</p>
                <div className="bg-white border rounded-lg p-5">
                  <h3 className="font-bold text-[color:var(--navy)] mb-3">Course at a Glance</h3>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <Spec k="Duration" v="3 Years (6 Semesters)" />
                    <Spec k="Intake" v="30 Students" />
                    <Spec k="Eligibility" v="10th Pass" />
                    <Spec k="Lateral Entry" v="2nd Year for 12th/ITI pass" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[color:var(--navy)] mb-3">Laboratories</h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {meta.labs.map((l) => (
                      <div key={l} className="bg-white border rounded-lg px-4 py-3 text-sm font-medium">
                        🧪 {l}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[color:var(--navy)] mb-3">Programme Highlights</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {meta.highlights.map((h) => (<li key={h}>{h}</li>))}
                  </ul>
                </div>
              </div>
            )}
            {tab === 1 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {meta.careers.map((c) => (
                  <div key={c} className="bg-white border rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[color:var(--accent)] text-[color:var(--navy)] flex items-center justify-center">→</div>
                    <span className="text-sm font-medium">{c}</span>
                  </div>
                ))}
              </div>
            )}
            {tab === 2 && (
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-[color:var(--navy)] text-white flex items-center justify-center font-bold">{meta.hod.initials}</div>
                  <div>
                    <p className="font-semibold text-[color:var(--navy)]">{meta.hod.name}</p>
                    <p className="text-xs text-muted-foreground">{meta.hod.title}</p>
                    <p className="text-xs text-muted-foreground">{meta.hod.qual} · {meta.hod.exp}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our department is committed to producing skilled diploma engineers ready for industry challenges.
                  We emphasise hands-on training, strong theoretical foundations, and industry exposure throughout the program.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                  Students are encouraged to participate in industrial visits, workshops, and continuous skill-development
                  activities to graduate as confident professionals.
                </p>
              </div>
            )}
            {tab === 3 && (
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[color:var(--navy)] text-white">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Designation</th>
                      <th className="px-3 py-2 text-left">Qualification</th>
                      <th className="px-3 py-2 text-left">Experience</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(dept?.faculty ?? []).map((f: any) => (
                      <tr key={f.id} className="hover:bg-secondary/40">
                        <td className="px-3 py-2 font-medium">{f.name}</td>
                        <td className="px-3 py-2">{f.designation}</td>
                        <td className="px-3 py-2">{f.qualification}</td>
                        <td className="px-3 py-2">{f.experience}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <aside>
          <div className="bg-white border rounded-lg overflow-hidden sticky top-24">
            <div className="bg-[color:var(--navy)] text-white px-4 py-2 font-semibold text-sm">Quick Facts</div>
            <ul className="divide-y text-sm">
              <Row k="Department" v={isCivil ? "Civil Engineering" : "Mechanical Engineering"} />
              <Row k="Code" v={isCivil ? "CE" : "ME"} />
              <Row k="Duration" v="3 Years" />
              <Row k="Intake" v="30 Seats" />
              <Row k="HOD" v={meta.hod.name} />
            </ul>
            <div className="p-4">
              <Link to="/admissions" className="block text-center bg-[color:var(--gold)] text-[color:var(--navy)] font-semibold rounded-md px-4 py-2 hover:opacity-90">Apply Now</Link>
            </div>
          </div>
        </aside>
      </div>
    </PageLayout>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className="font-medium">{v}</p>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <li className="px-4 py-2 flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </li>
  );
}
