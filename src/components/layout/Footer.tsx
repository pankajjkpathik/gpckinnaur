import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/logo.png.asset.json";

const links = [
  { label: "Admissions", to: "/admissions" },
  { label: "Contact", to: "/contact" },
  { label: "Anti-Ragging", to: "/anti-ragging" },
  { label: "Mandatory Disclosure", to: "/mandatory-disclosure" },
  { label: "AICTE Approval", to: "/aicte-approval" },
  { label: "HPTSB Affiliation", to: "/hptsb-affiliation" },
  { label: "RTI", to: "/rti" },
  { label: "Grievance", to: "/grievance" },
];

export function Footer() {
  return (
    <footer className="bg-[color:var(--navy-dark)] text-white/85 mt-12">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="GP Kinnaur logo"
            className="w-10 h-10 rounded-full bg-white/95 p-1 object-contain"
          />
          <div className="text-sm">
            <p className="font-semibold text-white">Government Polytechnic, Kinnaur</p>
            <p className="text-white/60 text-xs">Camp at GP Rohru · Shimla, HP — 171207</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-white/70 hover:text-[color:var(--gold)]">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 py-3 text-center text-[11px] text-white/50">
        © {new Date().getFullYear()} GP Kinnaur · Institute Portal
      </div>
    </footer>
  );
}
