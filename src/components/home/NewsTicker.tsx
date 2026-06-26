import { useQuery } from "@tanstack/react-query";
import { listAnnouncements } from "@/lib/admin-extras.functions";

const DEFAULT_TEXT =
  "📢 Admissions Open 2026-27  •  New Session will start from August,2026  •  Anti-Ragging Helpline: 1800-180-5522";

export function NewsTicker() {
  const { data } = useQuery({
    queryKey: ["announcements-public"],
    queryFn: () => listAnnouncements(),
    staleTime: 60_000,
  });

  const items = (data ?? []).map((a: any) => a.content).filter(Boolean);
  const text = items.length > 0 ? items.join("  •  ") : DEFAULT_TEXT;

  return (
    <div className="bg-[color:var(--gold)] text-[color:var(--navy)] font-medium overflow-hidden">
      <div className="flex items-center">
        <span className="bg-[color:var(--navy)] text-white px-4 py-2 text-sm font-bold shrink-0">LATEST</span>
        <div className="overflow-hidden flex-1 py-2">
          <span className="marquee-track text-sm">
            {text} • {text}
          </span>
        </div>
      </div>
    </div>
  );
}
