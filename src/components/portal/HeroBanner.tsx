import type { ReactNode } from "react";
import {
  HERO_TYPOGRAPHY,
  resolveHeroPalette,
  type HeroPalette,
  type HeroPaletteName,
} from "./hero-tokens";

export type { HeroPalette, HeroPaletteName } from "./hero-tokens";
export type HeroStat = { value: ReactNode; label: string };

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
  /** Named token (recommended) or an inline palette override. */
  palette: HeroPaletteName | HeroPalette;
  stats?: HeroStat[];
  emoji?: string;
}) {
  const p = resolveHeroPalette(palette);
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
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${p.gradient} text-white shadow-lg`}
    >
      <div className={HERO_TYPOGRAPHY.blobLayer} aria-hidden>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl bg-white dark:bg-white/40" />
        <div className={`absolute -bottom-32 -left-16 w-96 h-96 rounded-full blur-3xl ${p.blob}`} />
      </div>
      <div className="relative p-5 sm:p-8 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-start sm:items-center gap-5">
        <div className="min-w-0">
          <p className={`${HERO_TYPOGRAPHY.eyebrow} ${p.eyebrowColor}`}>
            {dateLabel}
            {role && <span className="text-white/60"> · {role}</span>}
          </p>
          <h1 className={HERO_TYPOGRAPHY.heading}>
            {greeting}, <span className={p.nameColor}>{name}</span>{" "}
            <span className="inline-block">{emoji}</span>
          </h1>
          {subtitle && (
            <p className={HERO_TYPOGRAPHY.subtitle}>
              {typeof subtitle === "string" ? <span className={p.metaColor}>{subtitle}</span> : subtitle}
            </p>
          )}
        </div>
        {stats && stats.length > 0 && (
          <div
            className="grid gap-2 sm:gap-4 w-full sm:w-auto shrink-0"
            style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
          >
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
      <p className={HERO_TYPOGRAPHY.statValue}>{value}</p>
      <p className={HERO_TYPOGRAPHY.statLabel}>{label}</p>
    </div>
  );
}
