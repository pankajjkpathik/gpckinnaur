import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Hammer,
  Newspaper,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { HeroSlider } from "@/components/home/HeroSlider";
import { NewsTicker } from "@/components/home/NewsTicker";
import { NoticeBoard } from "@/components/home/NoticeBoard";
import { PhotoGallery } from "@/components/home/PhotoGallery";
import civilAsset from "@/assets/civil.png.asset.json";
import mechAsset from "@/assets/mech.png.asset.json";
import s6Asset from "@/assets/s6.jpg.asset.json";
import news1Asset from "@/assets/news/news1.jpg.asset.json";
import news2Asset from "@/assets/news/news2.jpg.asset.json";
import news3Asset from "@/assets/news/news3.jpg.asset.json";
import news4Asset from "@/assets/news/news4.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GP Kinnaur — Diploma in Civil & Mechanical Engineering" },
      {
        name: "description",
        content:
          "Government Polytechnic, Kinnaur (HP) — AICTE-approved, HPTSB-affiliated. 3-year diploma programs in Civil and Mechanical Engineering with modern labs.",
      },
      { property: "og:title", content: "GP Kinnaur — Diploma in Civil & Mechanical Engineering" },
      {
        property: "og:description",
        content: "Empowering youth of Kinnaur through quality technical education.",
      },
      { property: "og:url", content: "https://gpckinnaur.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://gpckinnaur.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "Government Polytechnic, Kinnaur",
          url: "https://gpckinnaur.lovable.app",
          department: [
            { "@type": "EducationalOrganization", name: "Department of Civil Engineering" },
            { "@type": "EducationalOrganization", name: "Department of Mechanical Engineering" },
          ],
        }),
      },
    ],
  }),
  component: Home,
});

const events = [
  {
    day: "06",
    month: "JUL",
    title: "First Round of Admission — PAT",
    desc: "First counselling round for Polytechnic Admission Test (PAT) candidates.",
    venue: "GP Kinnaur (Camp Rohru)",
  },
  {
    day: "08",
    month: "JUL",
    title: "First Round of Admission — LEET",
    desc: "First counselling round for Lateral Entry Entrance Test (LEET) candidates.",
    venue: "GP Kinnaur (Camp Rohru)",
  },
  {
    day: "25",
    month: "JUL",
    title: "Second Round of Admission — PAT",
    desc: "Second counselling round for Polytechnic Admission Test (PAT) candidates.",
    venue: "GP Kinnaur (Camp Rohru)",
  },
  {
    day: "27",
    month: "JUL",
    title: "Second Round of Admission — LEET",
    desc: "Second counselling round for Lateral Entry Entrance Test (LEET) candidates.",
    venue: "GP Kinnaur (Camp Rohru)",
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
    image: civilAsset.url,
    accent: "var(--gold)",
    icon: Building2,
    to: "/departments/1",
  },
  {
    title: "Department of Mechanical Engineering",
    blurb: "3-year AICTE-approved diploma in design, manufacturing and thermal systems.",
    image: mechAsset.url,
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
          <p className="text-xs font-bold tracking-widest text-[color:var(--gold-dark)]">ABOUT OUR INSTITUTE</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[color:var(--navy)] mt-2 mb-4">
            Building Tomorrow's Engineers in the Hills of Kinnaur
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Government Polytechnic, Kinnaur is a premier technical institute affiliated to HPTSB and approved by AICTE,
            offering diploma programs with modern, well-equipped facilities and a conducive learning environment.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-5">
            Our institution creates skilled professionals ready to meet the challenges of the modern industrial
            landscape through rigorous academic curriculum and practical exposure.
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
            src={s6Asset.url}
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
            <h2 className="text-3xl md:text-4xl font-bold text-[color:var(--navy)]">Our Academic Programs</h2>
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
      {/* Fees Payment block */}
      <section className="relative py-14 overflow-hidden bg-[color:var(--navy)]">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(245,179,66,0.35), transparent 45%), radial-gradient(circle at 80% 70%, rgba(59,130,246,0.35), transparent 50%)",
          }}
        />
        <div className="relative container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-widest text-[color:var(--gold)]">PAY ONLINE — SECURE & INSTANT</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Fees Payment Portal</h2>
            <div className="w-16 h-1 bg-[color:var(--gold)] mx-auto mt-3" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Online Fees Payment",
                subtitle: "For Existing Students",
                desc: "Semester fees, tuition and other dues for currently enrolled students.",
                icon: CreditCard,
                href: "https://paydirect.eduqfix.com/app/VVCO30lzy1+8f9Cwn903U0k6styIKc5RHS16JRoA/10880/32805",
                accent: "from-emerald-500 to-emerald-700",
                cta: "Pay Semester Fee",
              },
              {
                title: "New Admission Fees",
                subtitle: "For Freshly Admitted Students",
                desc: "Complete your admission by paying the prescribed first-year fees online.",
                icon: GraduationCap,
                href: "https://form.qfixonline.com/gpckaf",
                accent: "from-amber-500 to-orange-600",
                cta: "Pay Admission Fee",
              },
              {
                title: "Fine Payment",
                subtitle: "Library / Hostel / Misc.",
                desc: "Clear outstanding fines such as library, hostel or other miscellaneous dues.",
                icon: Receipt,
                href: "https://paydirect.eduqfix.com/app/VVCO30lzy1+8f9Cwn903U0k6styIKc5RHS16JRoA/10880/32805",
                accent: "from-rose-500 to-red-700",
                cta: "Pay Fine",
              },
            ].map((c) => (
              <a
                key={c.title}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-2xl bg-white/95 backdrop-blur p-6 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition border border-white/40"
              >
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${c.accent} text-white shadow-md mb-4`}
                >
                  <c.icon className="w-7 h-7" />
                </div>
                <p className="text-[10px] tracking-widest font-bold text-[color:var(--gold-dark)]">
                  {c.subtitle.toUpperCase()}
                </p>
                <h3 className="text-xl font-bold text-[color:var(--navy)] mt-1">{c.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{c.desc}</p>
                <span
                  className={`mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${c.accent} text-white text-sm font-semibold group-hover:opacity-90`}
                >
                  <Wallet className="w-4 h-4" /> {c.cta} →
                </span>
              </a>
            ))}
          </div>
          <p className="text-center text-xs text-white/70 mt-6">
            Payments are processed securely via Eduqfix PayDirect. Keep your receipt for records.
          </p>
        </div>
      </section>

      {/* Combined: News Clippings + Upcoming Events + Notice Board */}
      <section className="container mx-auto px-4 py-14">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* News Clippings (Images only) */}
          <div className="bg-white rounded-lg border shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[color:var(--gold-dark)]" />
              <h3 className="text-lg font-bold text-[color:var(--navy)] border-b-2 border-[color:var(--gold)] pb-1">
                News Clippings
              </h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto">
              {[
                { src: news1Asset.url, alt: "News clipping — Nitin Negi selected at Lemon Tree Hotels" },
                { src: news2Asset.url, alt: "News clipping — 10 students placed at GP Kinnaur" },
                { src: news3Asset.url, alt: "News clipping — Himachal Aas Paas placement coverage" },
                { src: news4Asset.url, alt: "News clipping — Digital Media News placement coverage" },
              ].map((img) => (
                <a
                  key={img.src}
                  href={img.src}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-[4/5] rounded-md overflow-hidden border hover:shadow-md transition group"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
            <div className="px-4 py-2 border-t bg-secondary/40 text-right">
              <a href="#" className="text-xs font-semibold text-[color:var(--navy)] hover:underline">
                View All →
              </a>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg border shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[color:var(--gold-dark)]" />
              <h3 className="text-lg font-bold text-[color:var(--navy)] border-b-2 border-[color:var(--gold)] pb-1">
                Upcoming Events
              </h3>
            </div>
            <ul className="divide-y max-h-[420px] overflow-y-auto">
              {events.map((e) => (
                <li key={e.title} className="px-4 py-3 hover:bg-secondary/40">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-14 text-center bg-[color:var(--navy)] text-white rounded-md py-1.5">
                      <p className="text-[10px] font-semibold text-[color:var(--gold)]">{e.month}</p>
                      <p className="text-xl font-bold leading-none">{e.day}</p>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-[color:var(--navy)]">{e.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{e.desc}</p>
                      <p className="text-[11px] text-[color:var(--gold-dark)] mt-1">📍 {e.venue}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-4 py-2 border-t bg-secondary/40 text-right">
              <Link to="/about" className="text-xs font-semibold text-[color:var(--navy)] hover:underline">
                View All →
              </Link>
            </div>
          </div>

          {/* Notice Board */}
          <NoticeBoard />
        </div>
      </section>

      {/* Important Links */}
      <section className="w-full bg-gradient-to-r from-[color:var(--navy-dark)] via-[color:var(--navy)] to-[color:var(--navy-dark)] py-10 border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <p className="text-xs font-bold tracking-widest text-[color:var(--gold)]">EXTERNAL RESOURCES</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">Important Links</h2>
            <div className="w-16 h-1 bg-[color:var(--gold)] mx-auto mt-3" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Directorate of Technical Education", href: "https://techedu.hp.gov.in/", icon: "🏛️" },
              { label: "HP Takniki Shiksha Board", href: "https://www.hptechboard.com/", icon: "📜" },
              { label: "AICTE", href: "https://www.aicte.gov.in/", icon: "🎓" },
              { label: "Digilocker NAD", href: "https://nad.digilocker.gov.in/", icon: "🗂️" },
              { label: "Himachal Government", href: "https://himachal.nic.in/", icon: "🏔️" },
              { label: "SHEBOX Portal", href: "https://shebox.wcd.gov.in/", icon: "🛡️" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center text-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 hover:border-[color:var(--gold)] backdrop-blur px-3 py-4 transition"
              >
                <span className="text-2xl" aria-hidden>{l.icon}</span>
                <span className="text-xs font-semibold text-white leading-tight">{l.label}</span>
                <span className="text-[10px] text-[color:var(--gold)] opacity-0 group-hover:opacity-100 transition">Visit →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="bg-secondary/40 py-14 border-y">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[color:var(--navy)]">Photo Gallery</h2>
            <div className="w-16 h-1 bg-[color:var(--gold)] mx-auto mt-2 mb-3" />
            <p className="text-muted-foreground">Glimpses of campus life, labs, and events at GP Kinnaur.</p>

          </div>
          <PhotoGallery />
        </div>
      </section>
    </PageLayout>
  );
}
