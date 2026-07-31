import { Link } from "react-router";
import { Clock, MapPin, Star, Users } from "lucide-react";
import type { PackageMaster } from "@/lib/packages";
import {
  displayPricePoisha,
  formatDuration,
  formatPrice,
  hasOffer,
  seatsLeft,
} from "@/lib/packages";

type Props = {
  pkg: PackageMaster;
  detailPath?: string;
  bookPath?: string;
  onQuickView?: (pkg: PackageMaster) => void;
  showCommission?: boolean;
  variant?: "site" | "portal" | "admin";
};

export function PackageCard({
  pkg,
  detailPath,
  bookPath,
  onQuickView,
  showCommission,
  variant = "site",
}: Props) {
  const price = displayPricePoisha(pkg);
  const offer = hasOffer(pkg);
  const seats = seatsLeft(pkg);
  const img = pkg.coverImageUrl || pkg.heroImageUrl || "";
  const to = detailPath ?? `/site/packages/${pkg.slug}`;

  const cardCls =
    variant === "site"
      ? "group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-white shadow-lg transition-all hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-amber-500/10"
      : "group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-all hover:border-amber-300 hover:shadow-md";

  const mutedCls = variant === "site" ? "text-white/60" : "text-slate-500";
  const btnCls =
    variant === "site"
      ? "rounded-lg border border-white/20 px-3 py-1.5 text-[11px] font-semibold hover:bg-white/10"
      : "rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-50";

  return (
    <article className={cardCls} aria-label={`${pkg.name} travel package`}>
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
        {img ? (
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-white/40">No image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {pkg.homeFeatured && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
            Featured
          </span>
        )}
        {offer && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
            Offer
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {pkg.country && (
              <p className="flex items-center gap-1 text-[10px] text-white/80">
                <MapPin size={10} aria-hidden /> {pkg.country}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-black/60 px-2 py-1 text-right backdrop-blur-sm">
            <p className="text-[9px] uppercase tracking-wide text-white/60">From</p>
            <p className="text-[13px] font-bold text-amber-300">{formatPrice(price)}</p>
            {offer && pkg.sellingPricePoisha != null && (
              <p className="text-[10px] text-white/50 line-through">{formatPrice(pkg.sellingPricePoisha)}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[14px] font-bold leading-snug line-clamp-2">{pkg.name}</h3>
        {pkg.summary && <p className={`mt-1 text-[11px] line-clamp-2 ${mutedCls}`}>{pkg.summary}</p>}
        <div className={`mt-3 flex flex-wrap items-center gap-3 text-[10px] ${mutedCls}`}>
          <span className="inline-flex items-center gap-1">
            <Clock size={11} aria-hidden />
            {formatDuration(pkg.durationDays, pkg.durationNights)}
          </span>
          {pkg.rating != null && (
            <span className="inline-flex items-center gap-1">
              <Star size={11} className="text-amber-400 fill-amber-400" aria-hidden />
              {pkg.rating.toFixed(1)}
              {pkg.reviewCount != null && <span>({pkg.reviewCount})</span>}
            </span>
          )}
          {seats != null && (
            <span className="inline-flex items-center gap-1">
              <Users size={11} aria-hidden />
              {seats} seats left
            </span>
          )}
        </div>
        {showCommission && pkg.agentCommissionPoisha != null && (
          <p className="mt-2 text-[10px] font-semibold text-emerald-600">
            Commission: {formatPrice(pkg.agentCommissionPoisha)}
          </p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(pkg)}
              className={btnCls}
              aria-label={`Quick view ${pkg.name}`}
            >
              Quick View
            </button>
          )}
          <Link to={to} className={btnCls}>
            View Details
          </Link>
          {bookPath && (
            <Link
              to={bookPath}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-amber-400"
            >
              Book Now
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
