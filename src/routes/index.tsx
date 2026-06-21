import { createFileRoute } from "@tanstack/react-router";
import { PageLayout } from "@/components/layout/PageLayout";
import { HeroSlider } from "@/components/home/HeroSlider";
import { NewsTicker } from "@/components/home/NewsTicker";
import { NoticeBoard } from "@/components/home/NoticeBoard";
import { PhotoGallery } from "@/components/home/PhotoGallery";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Government Polytechnic, Kinnaur — Diploma in Civil & Mechanical Engineering" },
      { name: "description", content: "Government Polytechnic, Kinnaur (HP) — affiliated to HPTSB, approved by AICTE. Diploma programs in Civil and Mechanical Engineering." },
      { property: "og:title", content: "Government Polytechnic, Kinnaur" },
      { property: "og:description", content: "Empowering youth of Kinnaur through quality technical education." },
    ],
  }),
  component: Home,
});

const news = [
  {
    date: "20 Nov 2024",
    title: "Annual Sports Meet Concluded Successfully",
    excerpt: "Three days of athletic events celebrating campus spirit and teamwork across departments.",
  },
  {
    date: "12 Nov 2024",
    title: "Industrial Visit to Cement Plant",
    excerpt: "Civil Engineering 3rd-semester students visited a local cement manufacturing facility.",
  },
  {
    date: "01 Nov 2024",
    title: "Workshop on Auto-CAD for Civil Students",
    excerpt: "5-day skill-development workshop conducted by the Civil Engineering department.",
  },
];

function Home() {
  return (
    <PageLayout>
      <HeroSlider />
      <NewsTicker />
      <section className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          <PhotoGallery />
          <div>
            <h3 className="text-2xl font-bold text-[color:var(--navy)] mb-4">Latest News</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {news.map((n) => (
                <article key={n.title} className="bg-white rounded-lg border p-4 hover:shadow-md transition">
                  <p className="text-xs text-[color:var(--gold-dark)] font-semibold">{n.date}</p>
                  <h4 className="font-semibold mt-2 text-[color:var(--navy)] leading-snug">{n.title}</h4>
                  <p className="text-sm text-muted-foreground mt-2">{n.excerpt}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
        <aside>
          <NoticeBoard />
        </aside>
      </section>
    </PageLayout>
  );
}
