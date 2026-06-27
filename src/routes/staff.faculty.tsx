import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumb, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";
import { facultyPhoto } from "@/lib/faculty-photos";

export const Route = createFileRoute("/staff/faculty")({
  head: () =>
    pageMeta({
      title: "Faculty — GP Kinnaur",
      description:
        "Profiles of teaching faculty members at Government Polytechnic, Kinnaur — qualifications, designations and departments.",
      path: "/staff/faculty",
    }),
  component: FacultyPage,
});

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function Card({ name, designation, qual, exp }: { name: string; designation: string; qual: string; exp?: string }) {
  const photo = facultyPhoto(name);
  return (
    <div className="bg-white border rounded-lg p-4 flex items-start gap-3">
      {photo ? (
        <img src={photo} alt={name} className="w-14 h-14 rounded-full object-cover shrink-0 border" />
      ) : (
        <div className="w-14 h-14 rounded-full bg-[color:var(--navy)] text-white flex items-center justify-center font-bold shrink-0">
          {initials(name)}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-semibold text-[color:var(--navy)]">{name}</p>
        <p className="text-xs text-muted-foreground">{designation}</p>
        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
          {qual}
        </span>
        {exp && <p className="text-xs text-muted-foreground mt-1">{exp}</p>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-[color:var(--navy)] mb-3 border-b-2 border-[color:var(--gold)] inline-block pb-1">
        {title}
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">{children}</div>
    </div>
  );
}

function FacultyPage() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Staff" }, { label: "Our Faculty" }]} />
      <div className="container mx-auto px-4 py-10 space-y-10">
        <div className="bg-[color:var(--navy)] text-white rounded-lg p-6 flex items-center gap-4">
          <img
            src={facultyPhoto("Pankaj Pathik") ?? ""}
            alt="Principal"
            className="w-20 h-20 rounded-full object-cover border-2 border-[color:var(--gold)]"
          />
          <div>
            <p className="text-[color:var(--gold)] text-xs uppercase font-semibold tracking-wider">Principal</p>
            <p className="font-bold text-white text-lg">Sh. Pankaj K. Pathik</p>
            <p className="text-white/80 text-sm">MCA, CCNA · 15+ Years</p>
          </div>
        </div>
        <Section title="Civil Engineering">
          <Card name="Er. Punit Sharma" designation="HOD" qual="B.Tech Civil" exp="13+ yrs" />
          <Card name="Er. Manoj Negi" designation="Lecturer" qual="M.Tech Civil" exp="6+ yrs" />
        </Section>
        <Section title="Mechanical Engineering">
          <Card name="Er. Akshay Rana" designation="Sr. Lecturer & HOD" qual="B.Tech Mech" exp="13+ yrs" />
          <Card name="Er. Rohit Tiwari" designation="Lecturer" qual="M.Tech Manufacturing" exp="6+ yrs" />
          <Card name="Er. Pankaj Chatanta" designation="Lecturer (SWF)" qual="B.Tech Mech" exp="10+ yrs" />
        </Section>
        <Section title="Workshop">
          <Card name="Workshop Superintendent" designation="Er. Harnem Dadhwal" qual="—" />
        </Section>
        <Section title="Applied Science & Humanities">
          <Card name="HOD-ASH" designation="Vacant" qual="—" />
          <Card name="Sh. Surya Negi" designation="Lecturer" qual="M.Sc Chemistry" exp="8+ yrs" />
          <Card name="Sh. Ravinder Kumar" designation="Lecturer" qual="M.Sc Mathematics" exp="8+ yrs" />
          <Card name="Ms. Amonika" designation="Lecturer" qual="M.Phil English" exp="5+ yrs" />
        </Section>
      </div>
    </PageLayout>
  );
}
