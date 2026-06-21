import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Hammer,
  Newspaper,
  TrendingUp,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { HeroSlider } from "@/components/home/HeroSlider";
import { NewsTicker } from "@/components/home/NewsTicker";
import { NoticeBoard } from "@/components/home/NoticeBoard";
import { PhotoGallery } from "@/components/home/PhotoGallery";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Government Polytechnic, Kinnaur — Diploma in Civil & Mechanical Engineering" },
      {
        name: "description",
        content:
          "Government Polytechnic, Kinnaur (HP) — affiliated to HPTSB, approved by AICTE. Diploma programs in Civil and Mechanical Engineering.",
      },
      { property: "og:title", content: "Government Polytechnic, Kinnaur" },
      {
        property: "og:description",
        content: "Empowering youth of Kinnaur through quality technical education.",
      },
    ],
  }),
  component: Home,
});

const events = [
  {
    day: "15",
    month: "OCT",
    title: "Annual Sports Meet 2025",
    desc: "Inter-departmental sports competition to be held on the main ground.",
    venue: "Main Ground",
  },
  {
    day: "22",
    month: "OCT",
    title: "Industrial Visit — Cement Plant",
    desc: "Civil Engineering 3rd-semester field visit to a local cement facility.",
    venue: "Kinnaur",
  },
  {
    day: "05",
    month: "NOV",
    title: "AutoCAD Skill Workshop",
    desc: "5-day workshop conducted by the Civil Engineering department.",
    venue: "Drawing Hall",
  },
];

const news = [
  {
    tag: "ADMISSIONS",
    source: "Daily Tribune",
    date: "12 Jun 2026",
    title: "GP Kinnaur students secure top ranks in HPTSB Diploma exams",
  },
  {
    tag: "ADMISSIONS",
    source: "Himachal Weekly",
    date: "05 May 2026",
    title: "New batch of Diploma in Civil Engineering students inducted at GP Kinnaur",
  },
  {
    tag: "CAMPUS",
    source: "HP Express",
    date: "18 Apr 2026",
    title: "GP Kinnaur holds Anti-Ragging awareness drive for students",
  },
  {
    tag: "SPORTS",
    source: "Times of HP",
    date: "10 Feb 2026",
    title: "Annual Sports Meet 2025 organised at GP Kinnaur; Civil Dept wins overall trophy",
  },
];

const programs = [
  {
    title: "Department of Civil Engineering",
    blurb: "3-year AICTE-approved diploma in surveying, structures and construction technology.",
    image:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=70",
    accent: "var(--gold)",
    icon: Building2,
    to: "/departments/1",
  },
  {
    title: "Department of Mechanical Engineering",
    blurb: "3-year AICTE-approved diploma in design, manufacturing and thermal systems.",
    image:
      "https://images.unsplash.com/photo-1581091870622-1c6b6e2b5b2d?auto=format&fit=crop&w=1200&q=70",
    accent: "#3b82f6",
    icon: Hammer,
    to: "/departments/2",
  },
];

function Home() {
  return (
    <PageLayout>
      <HeroSlider />
      <NewsTicker />

      {/* About snippet */}
      <section className="container mx-auto px-4 py-14 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs font-bold tracking-widest text-[color:var(--gold-dark)]">
            ABOUT OUR INSTITUTE
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[color:var(--navy)] mt-2 mb-4">
            Building Tomorrow's Engineers in the Hills of Kinnaur
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Government Polytechnic, Kinnaur is a premier technical institute affiliated to HPTSB and
            approved by AICTE, offering diploma programs with modern, well-equipped facilities and a
            conducive learning environment.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-5">
            Our institution creates skilled professionals ready to meet the challenges of the modern
            industrial landscape through rigorous academic curriculum and practical exposure.
          </p>
          <ul className="grid sm:grid-cols-2 gap-2 mb-6">
            {["AICTE Approved", "Highly Qualified Faculty", "Modern Laboratories", "Industry Oriented Curriculum"].map(
              (f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[color:var(--gold-dark)]" />
                  {f}
                </li>
              ),
            )}
          </ul>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[color:var(--navy)] text-white font-semibold hover:opacity-90"
          >
            Read More About Us →
          </Link>
        </div>
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?auto=format&fit=crop&w=1200&q=70"
            alt="GP Kinnaur campus"
            className="rounded-xl shadow-lg w-full h-[340px] object-cover"
          />
          <div className="absolute -bottom-6 -left-4 md:left-6 bg-white rounded-lg shadow-lg p-4 w-64 border">
            <div className="flex items-center gap-3 mb-3">
              <Award className="w-8 h-8 text-[color:var(--gold-dark)]" />
              <div>
                <p className="text-xs text-muted-foreground">Excellence</p>
                <p className="font-bold text-[color:var(--navy)] text-sm">Top Rated Institute</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-[color:var(--gold-dark)]" />
              <div>
                <p className="text-xs text-muted-foreground">Success</p>
                <p className="font-bold text-[color:var(--navy)] text-sm">High Placement Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Programs */}
      <section className="bg-secondary/40 py-14 border-y">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-[color:var(--navy)]">
              Our Academic Programs
            </h2>
            <div className="w-16 h-1 bg-[color:var(--gold)] mx-auto mt-2 mb-3" />
            <p className="text-muted-foreground">
              Offering diploma courses designed to build strong technical foundations.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {programs.map((p) => (
              <Link
                key={p.title}
                to={p.to}
                className="group relative overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-xl transition"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, rgba(11,33,71,0.85), rgba(11,33,71,0.3))`,
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-6 text-center">
                    <p className="text-xs tracking-widest opacity-90">DEPARTMENT OF</p>
                    <h3 className="text-2xl md:text-3xl font-extrabold mt-1" style={{ color: p.accent }}>
                      {p.title.replace("Department of ", "").toUpperCase()}
                    </h3>
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs">
                      <GraduationCap className="w-4 h-4" /> Diploma Program
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-muted-foreground">{p.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Events + Notices */}
      <section className="container mx-auto px-4 py-14 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-5 h-5 text-[color:var(--gold-dark)]" />
            <h2 className="text-2xl font-bold text-[color:var(--navy)]">Upcoming Events</h2>
          </div>
          <div className="space-y-3">
            {events.map((e) => (
              <article
                key={e.title}
                className="flex gap-4 bg-white border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex-shrink-0 w-16 text-center bg-[color:var(--navy)] text-white rounded-md py-2">
                  <p className="text-xs font-semibold text-[color:var(--gold)]">{e.month}</p>
                  <p className="text-2xl font-bold leading-none">{e.day}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[color:var(--navy)]">{e.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{e.desc}</p>
                  <p className="text-xs text-[color:var(--gold-dark)] mt-1">📍 {e.venue}</p>
                </div>
              </article>
            ))}
          </div>
          <Link
            to="/about"
            className="inline-block mt-4 text-sm font-semibold text-[color:var(--navy)] hover:text-[color:var(--gold-dark)]"
          >
            View All Events →
          </Link>
        </div>
        <aside>
          <NoticeBoard />
        </aside>
      </section>

      {/* Photo Gallery */}
      <section className="bg-secondary/40 py-14 border-y">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[color:var(--navy)]">Photo Gallery</h2>
            <div className="w-16 h-1 bg-[color:var(--gold)] mx-auto mt-2 mb-3" />
            <p className="text-muted-foreground">
              Glimpses of campus life, labs, and events at GP Kinnaur.
            </p>
          </div>
          <PhotoGallery />
        </div>
      </section>

      {/* News Clippings */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-center gap-2 mb-2">
          <Newspaper className="w-5 h-5 text-[color:var(--gold-dark)]" />
          <h2 className="text-2xl md:text-3xl font-bold text-[color:var(--navy)]">News Clippings</h2>
        </div>
        <p className="text-muted-foreground mb-6">GP Kinnaur in the news — recent media coverage.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {news.map((n) => (
            <article
              key={n.title}
              className="flex gap-3 bg-white border rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-md bg-[color:var(--navy)]/10 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-[color:var(--navy)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-bold mb-1">
                  <span className="px-2 py-0.5 rounded bg-[color:var(--gold)]/20 text-[color:var(--gold-dark)]">
                    {n.tag}
                  </span>
                  <span className="text-muted-foreground">· {n.source}</span>
                </div>
                <h3 className="font-semibold text-[color:var(--navy)] leading-snug">{n.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{n.date}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-[color:var(--navy)] text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg md:text-xl mb-5 max-w-2xl mx-auto">
            Applications are now open for the academic session 2025-2026. Secure your future with
            technical excellence.
          </p>
          <Link
            to="/admissions"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-md bg-[color:var(--gold)] text-[color:var(--navy)] font-bold hover:opacity-90"
          >
            Admission Process →
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
