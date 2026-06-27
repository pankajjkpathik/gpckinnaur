import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Breadcrumb, PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";
import { facultyPhoto } from "@/lib/faculty-photos";


export const Route = createFileRoute("/departments/$id")({
  head: ({ params }) => {
    const name = params.id === "1" ? "Civil Engineering" : params.id === "2" ? "Mechanical Engineering" : "Department";
    return pageMeta({
      title: `${name} — GP Kinnaur`,
      description: `Diploma in ${name} at Government Polytechnic, Kinnaur. 3-year AICTE-approved program, qualified faculty and well-equipped labs.`,
      path: `/departments/${params.id}`,
    });
  },
  component: DepartmentPage,
});

type Faculty = { name: string; designation: string; qualification: string; experience: string };
type DeptData = {
  name: string;
  about: { overview: string[]; glance: string[] };
  careers: { title: string; desc: string }[];
  hod: { name: string; title: string; message: string };
  faculty: Faculty[];
};

const CIVIL: DeptData = {
  name: "Civil Engineering",
  about: {
    overview: [
      "Diploma in Civil Engineering is a foundational qualification for a career in the design, construction, and maintenance of the physical and naturally built environment. This includes essential infrastructure such as roads, bridges, canals, dams, airports, sewerage systems, pipelines, and buildings. Civil Engineering is a discipline that deals with creating a sustainable and resilient world.",
      "Throughout the three-year program, you will gain a solid foundation in structural analysis, building materials, geotechnical engineering, hydraulics, surveying, and construction management. You will learn to use industry-standard software for drafting and design. The curriculum is designed to provide both theoretical knowledge and practical skills to meet the challenges of the modern construction industry and to develop innovative solutions for a better future.",
    ],
    glance: [
      "The diploma program includes a mandatory 4-week Industrial Training period after the 4th semester, providing you with real-world experience at reputable construction companies or government departments. This practical exposure is a crucial part of the curriculum, helping to deepen your skills and understanding of the industry.",
      "Upon successful completion of the diploma, you are eligible for direct admission into the second year of a Bachelor of Engineering (B.E.) or Bachelor of Technology (B.Tech.) degree program through the Lateral Entry scheme. Furthermore, this diploma is recognized as equivalent to the 10+2 (senior secondary) qualification by the state board of school education, opening up various other educational and career pathways.",
    ],
  },
  careers: [
    { title: "Junior Engineer", desc: "Work in government departments like the Public Works Department (PWD), Irrigation, and Public Health Engineering." },
    { title: "Site Engineer", desc: "Supervise and manage construction projects on-site, ensuring work is completed according to specifications, on time, and within budget." },
    { title: "Structural Design Assistant", desc: "Assist senior engineers in designing and drafting structural components for buildings and other structures." },
    { title: "Surveyor", desc: "Conduct land surveys for construction projects, mapping out land features and boundaries." },
    { title: "AutoCAD Draftsman", desc: "Create detailed technical drawings and plans for civil engineering projects using CAD software." },
    { title: "Construction Supervisor", desc: "Oversee the work of construction crews and ensure safety and quality standards are met." },
    { title: "Higher Education", desc: "Pursue a B.Tech or B.E. in Civil Engineering through lateral entry programs to further enhance career prospects." },
  ],
  hod: {
    name: "Er. Punit Sharma",
    title: "Head of Department, Civil Engineering",
    message:
      "The Civil Engineering Department at Government Polytechnic, Kinnaur is dedicated to producing competent diploma engineers who can contribute effectively to infrastructure development and nation building. Our focus is on strong fundamentals, practical training, field exposure, and the use of modern tools and techniques. We encourage our students to develop technical skills, discipline, teamwork, and ethical responsibility. We strive to prepare our students to face real-world challenges with confidence and professionalism.",
  },
  faculty: [
    { name: "Er. Punit Sharma", designation: "HOD", qualification: "B.Tech. in Civil Engineering", experience: "13+ Years" },
    { name: "Er. Manoj Negi", designation: "Lecturer", qualification: "M.Tech in Civil Engineering", experience: "6+ Years" },
  ],
};

const MECH: DeptData = {
  name: "Mechanical Engineering",
  about: {
    overview: [
      "Diploma in Mechanical Engineering is a comprehensive program designed to provide you with the knowledge and skills to design, manufacture, and maintain mechanical systems. Mechanical Engineering is a broad discipline that involves the application of principles of physics and materials science for the creation of machinery and devices.",
      "During the three-year study period, you will be equipped with a solid foundation in thermodynamics, fluid mechanics, manufacturing processes, machine design, and industrial engineering. You will gain hands-on experience with modern machinery and learn to use computer-aided design (CAD) and computer-aided manufacturing (CAM) software. These skills will empower you to take on the challenges of the ever-evolving manufacturing and technology sectors.",
    ],
    glance: [
      "A key component of the curriculum is a 4-week Industrial Training program after the 4th semester. This training takes place at reputable manufacturing companies and workshops, allowing you to apply your theoretical knowledge in a real-world setting and deepen your practical skills.",
      "Upon completion of the diploma, you are eligible to take direct admission into the second year of a Bachelor of Engineering (B.E.) or Bachelor of Technology (B.Tech.) degree in Mechanical Engineering under the Lateral Entry scheme. This diploma is also considered equivalent to the 10+2 qualification by the state board of school education.",
    ],
  },
  careers: [
    { title: "Junior Engineer", desc: "Opportunities in government departments and Public Sector Undertakings (PSUs) like Railways, BHEL, NTPC, and ordnance factories." },
    { title: "Production Engineer", desc: "Supervise and improve production processes in manufacturing plants." },
    { title: "Design Engineer", desc: "Work with CAD/CAM software to design and develop new products and machinery." },
    { title: "Maintenance Engineer", desc: "Ensure the smooth operation of machinery and equipment in factories and plants." },
    { title: "Quality Control Inspector", desc: "Monitor the quality of products and processes to ensure they meet required standards." },
    { title: "Automobile Engineer", desc: "Work in the automotive industry in roles related to design, manufacturing, and servicing of vehicles." },
    { title: "Higher Education", desc: "Pursue a B.Tech or B.E. in Mechanical Engineering or related fields to advance your career." },
  ],
  hod: {
    name: "Er. Akshay Rana",
    title: "Sr. Lecturer, OIC, Mechanical Engineering",
    message:
      "The Mechanical Engineering Department at Government Polytechnic, Kinnaur aims to develop skilled, innovative, and industry-ready diploma engineers. Through a balanced approach of theory, workshops, laboratories, and hands-on learning, we empower students to understand machines, manufacturing processes, and emerging technologies. Our department emphasizes practical competence, problem-solving ability, and continuous learning to help students build successful careers in engineering and allied sectors.",
  },
  faculty: [
    { name: "Er. Akshay Rana", designation: "Sr. Lecturer", qualification: "B.Tech. in Mechanical Engineering", experience: "13+ Years" },
    { name: "Er. Rohit Tiwari", designation: "Lecturer", qualification: "M.Tech in Manufacturing Technology", experience: "6+ Years" },
    { name: "Er. Pankaj Chatanta", designation: "Lecturer(SWF)", qualification: "B.Tech. in Mechanical Engineering", experience: "10+ Years" },
  ],
};

const SECTIONS = ["About the Department", "Career Options", "HOD Message", "Faculty Details"] as const;

function DepartmentPage() {
  const { id } = useParams({ from: "/departments/$id" });
  const data = id === "2" ? MECH : CIVIL;
  const [tab, setTab] = useState(0);

  return (
    <PageLayout>
      <PageHeader title={data.name} />
      <Breadcrumb items={[{ label: "Home" }]} />
      <div className="bg-secondary/40">
        <div className="container mx-auto px-4 py-10 grid lg:grid-cols-[260px_1fr] gap-6">
          <aside>
            <ul className="bg-white border rounded-lg overflow-hidden">
              {SECTIONS.map((s, i) => (
                <li key={s}>
                  <button
                    onClick={() => setTab(i)}
                    className={`w-full text-left px-5 py-4 text-sm font-semibold border-b last:border-b-0 transition ${
                      tab === i ? "bg-[color:var(--navy)] text-white" : "hover:bg-secondary"
                    }`}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="bg-white border rounded-lg p-6 sm:p-8 min-h-[400px]">
            <h2 className="text-2xl font-bold text-[color:var(--navy)] mb-5">{SECTIONS[tab]}</h2>

            {tab === 0 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-[color:var(--navy)]">Overview</h3>
                {data.about.overview.map((p, i) => (
                  <p key={i} className="leading-relaxed text-muted-foreground">{p}</p>
                ))}
                <h3 className="text-lg font-bold text-[color:var(--navy)] pt-2">Course at a glance</h3>
                {data.about.glance.map((p, i) => (
                  <p key={i} className="leading-relaxed text-muted-foreground">{p}</p>
                ))}
              </div>
            )}

            {tab === 1 && (
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  A Diploma in {data.name} opens up a wide range of career opportunities in both the public and private sectors. Some of the common career paths include:
                </p>
                <ul className="space-y-3">
                  {data.careers.map((c) => (
                    <li key={c.title} className="flex gap-3">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[color:var(--navy)] shrink-0" />
                      <p className="text-muted-foreground leading-relaxed">
                        <span className="font-bold text-foreground">{c.title}:</span> {c.desc}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === 2 && (
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-32 h-32 rounded-full bg-[color:var(--navy)] text-white flex items-center justify-center font-bold text-3xl shrink-0">
                  {data.hod.name.split(" ").slice(-2).map((w) => w[0]).join("")}
                </div>
                <div>
                  <p className="font-bold text-[color:var(--navy)] text-lg">{data.hod.name}</p>
                  <p className="text-sm text-muted-foreground mb-3">{data.hod.title}</p>
                  <p className="leading-relaxed text-muted-foreground">{data.hod.message}</p>
                </div>
              </div>
            )}

            {tab === 3 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">Image</th>
                      <th className="px-4 py-3 text-left font-bold">Name</th>
                      <th className="px-4 py-3 text-left font-bold">Designation</th>
                      <th className="px-4 py-3 text-left font-bold">Qualification</th>
                      <th className="px-4 py-3 text-left font-bold">Experience</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.faculty.map((f) => (
                      <tr key={f.name} className="border-t">
                        <td className="px-4 py-3">
                          <div className="w-12 h-12 rounded-full bg-[color:var(--navy)] text-white flex items-center justify-center font-bold text-xs">
                            {f.name.split(" ").slice(-2).map((w) => w[0]).join("")}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{f.name}</td>
                        <td className="px-4 py-3">{f.designation}</td>
                        <td className="px-4 py-3">{f.qualification}</td>
                        <td className="px-4 py-3">{f.experience}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-6">
                  <Link to="/admissions" className="inline-block bg-[color:var(--gold)] text-[color:var(--navy)] font-semibold rounded-md px-5 py-2 hover:opacity-90">Apply Now</Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
