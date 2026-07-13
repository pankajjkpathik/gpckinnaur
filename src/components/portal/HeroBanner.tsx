import { useEffect, useState, type ReactNode } from "react";
import { Sunrise, Sun, Sunset } from "lucide-react";
import {
  HERO_TYPOGRAPHY,
  resolveHeroPalette,
  type HeroPaletteName,
} from "./hero-tokens";
import { initialsOf } from "@/lib/portal-identity";

export type { HeroPalette, HeroPaletteName } from "./hero-tokens";
export { HERO_PALETTE_NAMES, isHeroPaletteName } from "./hero-tokens";
export type HeroStat = { value: ReactNode; label: string };

export function HeroBanner({
  name,
  role,
  subtitle,
  palette,
  stats,
  emoji = "👋",
  avatarSrc,
  onAvatarChange,
  avatarUploading = false,
}: {
  name: string;
  role?: string;
  subtitle?: ReactNode;
  /**
   * Registered palette name. Only the 8 names in `HERO_PALETTE_NAMES`
   * (faculty / principal / hod / tpo / clerk / student / parent / staff)
   * are accepted — add a new entry to `hero-tokens.ts` before using it here.
   */
  palette: HeroPaletteName;
  stats?: HeroStat[];
  emoji?: string;
  /** Optional user photo shown as a circular avatar inside the hero. */
  avatarSrc?: string | null;
  /** When provided, a camera badge appears on the avatar to pick a new image. */
  onAvatarChange?: (file: File) => void;
  avatarUploading?: boolean;
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
  const GreetIcon = hour < 12 ? Sunrise : hour < 17 ? Sun : Sunset;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${p.gradient} text-white shadow-lg`}
    >
      <div className={HERO_TYPOGRAPHY.blobLayer} aria-hidden>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl bg-white dark:bg-white/40" />
        <div className={`absolute -bottom-32 -left-16 w-96 h-96 rounded-full blur-3xl ${p.blob}`} />
      </div>
      <div className="relative p-5 sm:p-8 grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)_auto] items-start sm:items-center gap-4 sm:gap-5">
        <div className="shrink-0 relative">
          <HeroAvatar src={avatarSrc} name={name} />
          {onAvatarChange && (
            <label
              className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-md ring-2 ring-white cursor-pointer hover:bg-slate-100"
              title="Change profile photo"
            >
              {avatarUploading ? (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M22 12a10 10 0 0 1-10 10"/></svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                disabled={avatarUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onAvatarChange(f);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>

        <div className="min-w-0">
          <p className={`${HERO_TYPOGRAPHY.eyebrow} ${p.eyebrowColor}`}>
            {dateLabel}
            {role && <span className="text-white/60"> · {role}</span>}
          </p>
          <h1 className={HERO_TYPOGRAPHY.heading}>
            <span
              className="inline-flex items-center justify-center align-[-0.15em] mr-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-slate-900 shadow-md ring-1 ring-white/70"
              aria-hidden
            >
              <GreetIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2.4} />
            </span>
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
    <div className={HERO_TYPOGRAPHY.statTile}>
      <p className={HERO_TYPOGRAPHY.statValue}>{value}</p>
      <p className={HERO_TYPOGRAPHY.statLabel}>{label}</p>
    </div>
  );
}

function HeroAvatar({ src, name }: { src?: string | null; name: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    src ? "loading" : "loaded",
  );

  useEffect(() => {
    setStatus(src ? "loading" : "loaded");
  }, [src]);

  const showImg = src && status !== "error";
  const showFallback = !src || status === "error";
  const showSkeleton = !!src && status === "loading";

  return (
    <div className="relative w-16 h-16 sm:w-20 sm:h-20">
      {showImg && (
        <img
          src={src!}
          alt={name}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-white/40 shadow-lg bg-white/10 transition-opacity duration-300 ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {showSkeleton && (
        <div
          aria-hidden
          className="absolute inset-0 rounded-full ring-2 ring-white/40 shadow-lg bg-white/20 animate-pulse"
        />
      )}
      {showFallback && (
        <div
          role={status === "error" ? "img" : undefined}
          aria-label={status === "error" ? `${name} (photo failed to load)` : undefined}
          title={status === "error" ? "Profile photo failed to load" : undefined}
          className="absolute inset-0 rounded-full ring-2 ring-white/40 shadow-lg bg-white/15 backdrop-blur flex items-center justify-center text-white font-bold text-xl sm:text-2xl"
        >
          {initialsOf(name)}
        </div>
      )}
    </div>
  );
}
