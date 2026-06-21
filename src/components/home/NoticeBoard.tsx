import { useQuery } from "@tanstack/react-query";
import { listNotices } from "@/lib/notices.functions";

const categoryColor: Record<string, string> = {
  admission: "bg-emerald-100 text-emerald-800",
  exam: "bg-sky-100 text-sky-800",
  scholarship: "bg-amber-100 text-amber-800",
  event: "bg-purple-100 text-purple-800",
  placement: "bg-rose-100 text-rose-800",
  general: "bg-slate-100 text-slate-700",
};

export function NoticeBoard({ limit = 8 }: { limit?: number }) {
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: () => listNotices(),
  });
  const list = notices.slice(0, limit);
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="px-4 py-3 border-b">
        <h3 className="text-lg font-bold text-[color:var(--navy)] inline-block border-b-2 border-[color:var(--gold)] pb-1">
          Notice Board
        </h3>
      </div>
      <ul className="divide-y max-h-[420px] overflow-y-auto">
        {isLoading && <li className="p-4 text-sm text-muted-foreground">Loading…</li>}
        {!isLoading && list.length === 0 && (
          <li className="p-4 text-sm text-muted-foreground">No notices.</li>
        )}
        {list.map((n: any) => (
          <li key={n.id} className="px-4 py-3 hover:bg-secondary/40">
            <div className="flex items-start gap-3">
              <div className="text-xs bg-[color:var(--navy)] text-white rounded px-2 py-1 text-center shrink-0 min-w-[52px]">
                {new Date(n.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${categoryColor[n.category] ?? categoryColor.general}`}>
                  {n.category}
                </span>
                <p className="text-sm font-medium mt-1 text-[color:var(--navy)]">{n.title}</p>
                {n.link && (
                  <a href={n.link} target="_blank" rel="noreferrer" className="text-xs text-sky-700 underline">
                    View
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="px-4 py-2 border-t bg-secondary/40 text-right">
        <a href="#" className="text-xs font-semibold text-[color:var(--navy)] hover:underline">
          View All →
        </a>
      </div>
    </div>
  );
}
