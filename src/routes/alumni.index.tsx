import { createFileRoute, Link } from "@tanstack/react-router";
import { Breadcrumb, PageLayout } from "@/components/layout/PageLayout";
import { pageMeta } from "@/lib/seo";
import { alumniPhoto } from "@/lib/alumni-photos";

export const Route = createFileRoute("/alumni/")({
  head: () =>
    pageMeta({
      title: "Alumni — GP Kinnaur",
      description:
        "Meet the placed alumni of Government Polytechnic, Kinnaur working across leading manufacturing and engineering companies in India.",
      path: "/alumni",
    }),
  component: AlumniPage,
});

const alumni = [
  ["Rohit Kumar", "Suzuki Motors"],
  ["Manjeet Kumar", "IDMC"],
  ["Sachin", "IDMC"],
  ["Happy", "IDMC"],
  ["Rishav Bharol", "Godrej & Boyce"],
  ["Pradeep Kumar", "Dr. Reddy"],
  ["Pradeep Kumar", "Krishna Maruti"],
  ["Sachet Majtoo", "Krishna Maruti"],
  ["Ankush Sharma", "Krishna Maruti"],
  ["Sachin", "Krishna Maruti"],
  ["Vikas Thakur", "Centum Electronics"],
  ["Dhairya Bragta", "Jayshree Polymer"],
  ["Virender", "Crompton Greaves"],
  ["Sumit Sharma", "Crompton Greaves"],
  ["Manish", "Maruti Suzuki Ltd."],
  ["Nitin Negi", "Lemon Tree Hotels"],
  ["Katik", "Zydus Life Sciences"],
  ["Rohit Kumar", "Sickle Innovation"],
  ["Manish Rana", "Dr. Reddys"],
  ["Akhil Patiyal", "Dr. Reddys"],
  ["Krish", "Dr. Reddys"],
  ["Abinish", "Dr. Reddys"],
];

function AlumniPage() {
  return (
    <PageLayout>
      <Breadcrumb items={[{ label: "Home" }, { label: "Alumni" }, { label: "Our Alumni" }]} />
      <div className="container mx-auto px-4 py-10 space-y-8">
        <div className="bg-[color:var(--navy)] text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Are you a GP Kinnaur Alumni?</h2>
          <p className="text-white/85 mt-2">Register yourself and stay connected with your alma mater</p>
          <Link
            to="/alumni/register"
            className="inline-block mt-4 px-6 py-3 bg-[color:var(--gold)] text-[color:var(--navy)] font-semibold rounded-md"
          >
            Register Now →
          </Link>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-[color:var(--navy)] mb-4">Our Placed Alumni</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alumni.map(([name, co], i) => {
              const photo = alumniPhoto(name, co);
              return (
                <div key={i} className="bg-white border rounded-lg p-4 flex items-center gap-3">
                  {photo ? (
                    <img src={photo} alt={name} className="w-12 h-12 rounded-full object-cover ring-2 ring-[color:var(--gold)]" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[color:var(--gold)] text-[color:var(--navy)] flex items-center justify-center font-bold">
                      {name.split(" ").map((s) => s[0]).join("")}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-[color:var(--navy)] truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{co}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      Mechanical
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
