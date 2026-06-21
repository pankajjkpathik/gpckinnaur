import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-[color:var(--navy-dark)] text-white/90 mt-12">
      <div className="container mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[color:var(--gold)] text-[color:var(--navy)] flex items-center justify-center font-bold">GPK</div>
            <h3 className="text-white font-bold">GP Kinnaur</h3>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Government Polytechnic, Kinnaur — empowering youth through quality
            technical education. Affiliated to HPTSB and approved by AICTE.
          </p>
        </div>
        <div>
          <h4 className="text-[color:var(--gold)] font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-[color:var(--gold)]">Home</Link></li>
            <li><Link to="/about" className="hover:text-[color:var(--gold)]">About</Link></li>
            <li><Link to="/departments/1" className="hover:text-[color:var(--gold)]">Departments</Link></li>
            <li><Link to="/admissions" className="hover:text-[color:var(--gold)]">Admissions</Link></li>
            <li><Link to="/anti-ragging" className="hover:text-[color:var(--gold)]">Anti-Ragging</Link></li>
            <li><Link to="/contact" className="hover:text-[color:var(--gold)]">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[color:var(--gold)] font-semibold mb-3">Courses</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/departments/1" className="hover:text-[color:var(--gold)]">Diploma in Civil Engineering</Link></li>
            <li><Link to="/departments/2" className="hover:text-[color:var(--gold)]">Diploma in Mechanical Engineering</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[color:var(--gold)] font-semibold mb-3">Contact Us</h4>
          <address className="not-italic text-sm space-y-1 text-white/80">
            <p>GP Kinnaur, Camp at GP Rohru</p>
            <p>Distt. Shimla, HP — 171207</p>
            <p>📞 01781-292440</p>
            <p>✉ gpkinnaur@rediffmail.com</p>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        Copyright © 2024 GP Kinnaur · Designed &amp; Developed following NIC/GIGW Guidelines
      </div>
    </footer>
  );
}
