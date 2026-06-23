export function UtilityBar() {
  return (
    <div className="bg-[color:var(--navy-dark)] text-white text-xs">
      <div className="container mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <span>📞 01781-292440</span>
          <span>✉ gpkinnaur@rediffmail.com</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a className="px-3 py-1 rounded-full bg-orange-500 hover:bg-orange-400" href="/training-placement">
            Placements
          </a>
          <a className="px-3 py-1 rounded-full bg-sky-600 hover:bg-sky-500" href="/grievance">
            Student Grievance
          </a>
          <a className="px-3 py-1 rounded-full border border-white/40 hover:bg-white/10" href="/mandatory-disclosure">
            Mandatory Disclosure
          </a>
        </div>
      </div>
    </div>
  );
}
