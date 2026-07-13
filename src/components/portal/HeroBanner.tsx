import type { ReactNode } from "react";

export type HeroPalette = {
  /** Tailwind gradient classes for background, e.g. "from-[#3730a3] via-[#2e1065] to-[#1e1b4b]" */
  gradient: string;
  /** Tailwind color class for the highlighted name, e.g. "text-amber-300" */
  nameColor: string;
  /** Tailwind color class for the uppercase date/eyebrow, e.g. "text-amber-200/90" */
  eyebrowColor: string;
  /** Tailwind color class for the small highlighted meta word, e.g. "text-amber-200" */
  metaColor: string;
  /** Tailwind class for decorative blur blobs (accent), e.g. "bg-amber-300" */
  blob?: string;
};

export type HeroStat = { value: ReactNode; label: string };

const DEFAULT_BLOB = "bg-white";

export function HeroBanner({
  name,
  role,
  subtitle,
  palette,
  stats,
  emoji = "👋",
}: {
  name: string;
  role?: string;
  subtitle?: ReactNode;
  palette: HeroPalette;
  stats?: HeroStat[];
  emoji?: string;
}) {
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${palette.gradient} text-white shadow-lg`}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden>
        <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl ${DEFAULT_BLOB}`} />
        <div className={`absolute -bottom-32 -left-16 w-96 h-96 rounded-full blur-3xl ${palette.blob ?? "bg-white"}`} />
      </div>
      <div className="relative p-5 sm:p-8 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-start sm:items-center gap-5">
        <div className="min-w-0">
          <p
            className={`text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.22em] font-semibold truncate ${palette.eyebrowColor}`}
          >
            {dateLabel}
            {role && <span className="text-white/60"> · {role}</span>}
          </p>
          <h1 className="mt-1.5 font-extrabold text-white leading-tight tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] text-[clamp(1.35rem,4.5vw,2rem)] sm:text-3xl break-words">
            {greeting}, <span className={palette.nameColor}>{name}</span>{" "}
            <span className="inline-block">{emoji}</span>
          </h1>
          {subtitle && (
            <p className="mt-2 text-[13px] sm:text-sm text-white/95 leading-relaxed">
              {typeof subtitle === "string" ? (
                <span className={palette.metaColor}>{subtitle}</span>
              ) : (
                subtitle
              )}
            </p>
          )}
        </div>
        {stats && stats.length > 0 && (
          <div className={`grid gap-2 sm:gap-4 w-full sm:w-auto shrink-0`} style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
            {stats.map((s, i) => (
              <HeroStatTile key={i} value={s.value} label={s.label} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function HeroStatTile({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 sm:px-4 sm:py-3 border border-white/15 text-center min-w-[70px]">
      <p className="text-lg sm:text-2xl font-bold text-white leading-none">{value}</p>
      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/80 mt-1">{label}</p>
    </div>
  );
}
