import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import s1Asset from "@/assets/s1.jpg.asset.json";
import s2Asset from "@/assets/s2.jpg.asset.json";
import s3Asset from "@/assets/s3.jpg.asset.json";

const slides = [
  {
    title: "Welcome to GP Kinnaur",
    subtitle: "Empowering youth of Kinnaur through quality technical education.",
    cta: "Explore Courses",
    to: "/departments/1",
    image: s1Asset.url,
  },
  {
    title: "Admissions Open 2025-26",
    subtitle: "Diploma in Civil & Mechanical Engineering — apply now.",
    cta: "Apply Now",
    to: "/admissions",
    image: s2Asset.url,
  },
  {
    title: "Community & Outreach",
    subtitle: "Engaging with society through meaningful initiatives and programmes.",
    cta: "Learn More",
    to: "/about",
    image: s3Asset.url,
  },
];

export function HeroSlider() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);
  const s = slides[i];
  const go = (d: number) => setI((v) => (v + d + slides.length) % slides.length);
  return (
    <div className="relative overflow-hidden bg-[color:var(--navy)] text-white">
      <div
        className="h-[420px] md:h-[520px] bg-cover bg-center transition-[background-image] duration-500"
        style={{ backgroundImage: `url(${s.image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-5xl font-bold text-[color:var(--gold)] drop-shadow-md mb-3">
              {s.title}
            </h2>
            <p className="text-base md:text-lg text-white/90 mb-6">{s.subtitle}</p>
            <Link
              to={s.to}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[color:var(--gold)] text-[color:var(--navy)] font-semibold hover:opacity-90"
            >
              {s.cta} →
            </Link>
          </div>
        </div>
        <button
          onClick={() => go(-1)}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === i ? "w-8 bg-[color:var(--gold)]" : "w-2 bg-white/50"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
