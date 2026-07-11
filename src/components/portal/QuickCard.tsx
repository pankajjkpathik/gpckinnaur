import { ArrowUpRight, type LucideIcon } from "lucide-react";

export type QuickCardProps = {
  icon: LucideIcon;
  label: string;
  desc: string;
  /** Tailwind bg-* class for the icon tile (e.g. "bg-orange-500" or "bg-[#7b1f4c]"). */
  color: string;
  /** Tailwind border-* class matching the color, used for the top accent bar. */
  border: string;
  onClick?: () => void;
  badge?: number | string;
  /** Optional stat rendered on the right side (e.g. "12" or "78%"). */
  stat?: string | number;
  statLabel?: string;
  disabled?: boolean;
};

/**
 * Polished quick-action card used across all portal home grids.
 * Keeps the existing color / border prop API so callers don't need to change.
 */
export function QuickCard({
  icon: Icon,
  label,
  desc,
  color,
  border,
  onClick,
  badge,
  stat,
  statLabel,
  disabled,
}: QuickCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative overflow-hidden text-left w-full rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {/* top accent bar */}
      <span className={`absolute inset-x-0 top-0 h-1 ${color}`} aria-hidden />
      {/* soft corner glow */}
      <span
        className={`pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full ${color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}
        aria-hidden
      />

      <div className="relative flex items-start gap-4 p-4 pt-5">
        <span
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color} shadow-md ring-4 ring-white group-hover:scale-105 transition-transform`}
        >
          <Icon className="w-6 h-6 text-white" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 text-sm leading-tight">{label}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{desc}</p>
          {stat !== undefined && (
            <p className="mt-2 text-[11px] uppercase tracking-wider text-gray-400">
              <span className="text-base font-bold text-gray-800 mr-1">{stat}</span>
              {statLabel}
            </p>
          )}
        </div>

        <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
      </div>

      {badge ? (
        <span className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
          {badge}
        </span>
      ) : null}

      {/* Ensure border color class is retained by the class scanner */}
      <span className={`hidden ${border}`} aria-hidden />
    </button>
  );
}

export default QuickCard;
