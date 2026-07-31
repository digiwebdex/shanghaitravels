import { Link } from "react-router";
import type { DestinationMaster, DestinationShowcaseSettings } from "@/lib/destinations";
import { applyShowcaseLimit, mergeShowcaseSettings } from "@/lib/destinations";
import { DestinationCard, DestinationCardSkeleton } from "@/components/destinations/DestinationCard";

type Props = {
  destinations: DestinationMaster[];
  settings?: Partial<DestinationShowcaseSettings> | null;
  loading?: boolean;
  variant?: "site" | "light";
  title?: string;
  subtitle?: string;
  browseHref?: string;
  browseLabel?: string;
  skeletonCount?: number;
  emptyTitle?: string;
  emptyHint?: string;
};

export function DestinationShowcaseGrid({
  destinations,
  settings: settingsPartial,
  loading = false,
  variant = "site",
  title = "Popular Destinations",
  subtitle,
  browseHref = "/site/destinations",
  browseLabel = "Browse all countries →",
  skeletonCount = 4,
  emptyTitle = "No destinations published yet.",
  emptyHint = "Check back soon for new countries.",
}: Props) {
  const settings = mergeShowcaseSettings(settingsPartial);
  const items = applyShowcaseLimit(destinations, settings);

  if (!settings.enabled && !loading) return null;

  const headingCls =
    variant === "site" ? "text-white text-[18px] font-bold" : "text-slate-900 text-[18px] font-bold";
  const subCls = variant === "site" ? "text-white/55 text-[12px]" : "text-slate-500 text-[12px]";
  const linkCls =
    variant === "site"
      ? "text-[11px] font-semibold text-orange-300 hover:text-orange-200"
      : "text-[11px] font-semibold text-orange-600 hover:text-orange-500";

  return (
    <section aria-label={title} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={headingCls}>{title}</h2>
          {subtitle && <p className={`mt-1 ${subCls}`}>{subtitle}</p>}
        </div>
        {!loading && items.length > 0 && (
          <Link to={browseHref} className={linkCls}>
            {browseLabel}
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <DestinationCardSkeleton key={i} variant={variant} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {items.map((d) => (
            <DestinationCard key={d.id} destination={d} settings={settings} variant={variant} />
          ))}
        </div>
      ) : (
        <div className={`rounded-xl border px-4 py-10 text-center ${variant === "site" ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
          <p className={`text-[13px] font-semibold ${variant === "site" ? "text-white/70" : "text-slate-600"}`}>
            {emptyTitle}
          </p>
          {emptyHint && <p className={`mt-1 text-[11px] ${subCls}`}>{emptyHint}</p>}
        </div>
      )}
    </section>
  );
}
