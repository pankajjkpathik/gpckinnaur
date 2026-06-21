export function NewsTicker() {
  const text =
    "📢 Admissions Open 2024-25  •  Scholarship Forms Available  •  Practical Exam Schedule Released  •  Annual Function on 20 Jan 2025  •  Anti-Ragging Helpline: 1800-180-5522";
  return (
    <div className="bg-[color:var(--gold)] text-[color:var(--navy)] font-medium overflow-hidden">
      <div className="flex items-center">
        <span className="bg-[color:var(--navy)] text-white px-4 py-2 text-sm font-bold shrink-0">
          LATEST
        </span>
        <div className="overflow-hidden flex-1 py-2">
          <span className="marquee-track text-sm">{text}  •  {text}</span>
        </div>
      </div>
    </div>
  );
}
