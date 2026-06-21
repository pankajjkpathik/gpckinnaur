import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const slides = [
  {
    title: "Welcome to Government Polytechnic, Kinnaur",
    subtitle: "Empowering Youth of Kinnaur Through Technical Education",
    cta: "Explore Courses",
    to: "/departments/1",
  },
  {
    title: "Admissions Open 2024-25",
    subtitle: "Diploma in Civil & Mechanical Engineering — Apply Now",
    cta: "Apply Now",
    to: "/admissions",
  },
  {
    title: "Affiliated to HPTSB · Approved by AICTE",
    subtitle: "Government Institute under HP Government",
    cta: "Know More",
    to: "/about",
  },
];

export function HeroSlider() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);
  const s = slides[i];
  return (
    <div className="relative overflow-hidden bg-[color:var(--navy)] text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--navy)] via-[color:var(--navy-dark)] to-black opacity-95" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,white_0,transparent_50%)]" />
      <div className="relative container mx-auto px-4 py-20 md:py-28 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{s.title}</h2>
        <p className="text-lg md:text-xl text-white/85 mb-8 max-w-2xl mx-auto">{s.subtitle}</p>
        <Link
          to={s.to}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[color:var(--gold)] text-[color:var(--navy)] font-semibold hover:opacity-90"
        >
          {s.cta} →
        </Link>
        <div className="mt-10 flex justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === i ? "w-8 bg-[color:var(--gold)]" : "w-2 bg-white/40"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
