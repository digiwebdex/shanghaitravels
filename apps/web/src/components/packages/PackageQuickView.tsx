import { X } from "lucide-react";
import type { PackageMaster } from "@/lib/packages";
import { displayPricePoisha, formatDuration, formatPrice, hasOffer } from "@/lib/packages";
import { Link } from "react-router";

type Props = {
  pkg: PackageMaster | null;
  onClose: () => void;
  detailPath?: string;
  bookPath?: string;
};

export function PackageQuickView({ pkg, onClose, detailPath, bookPath }: Props) {
  if (!pkg) return null;
  const price = displayPricePoisha(pkg);
  const offer = hasOffer(pkg);
  const to = detailPath ?? `/site/packages/${pkg.slug}`;
  const book = bookPath ?? `/site/packages/${pkg.slug}/book`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pkg-quickview-title"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
          aria-label="Close quick view"
        >
          <X size={16} />
        </button>
        {(pkg.coverImageUrl || pkg.heroImageUrl) && (
          <img
            src={pkg.coverImageUrl || pkg.heroImageUrl || ""}
            alt=""
            className="h-48 w-full object-cover"
          />
        )}
        <div className="p-5 space-y-3">
          <h2 id="pkg-quickview-title" className="text-[18px] font-bold text-slate-900 pr-8">
            {pkg.name}
          </h2>
          <p className="text-[12px] text-slate-500">
            {[pkg.destination, pkg.country].filter(Boolean).join(" · ")} ·{" "}
            {formatDuration(pkg.durationDays, pkg.durationNights)}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-[20px] font-bold text-amber-700">{formatPrice(price)}</span>
            {offer && pkg.sellingPricePoisha != null && (
              <span className="text-[13px] text-slate-400 line-through">{formatPrice(pkg.sellingPricePoisha)}</span>
            )}
          </div>
          {pkg.summary && <p className="text-[12px] text-slate-600 leading-relaxed">{pkg.summary}</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              to={to}
              className="rounded-lg border border-slate-200 px-4 py-2 text-[12px] font-semibold hover:bg-slate-50"
              onClick={onClose}
            >
              View Details
            </Link>
            <Link
              to={book}
              className="rounded-lg bg-amber-500 px-4 py-2 text-[12px] font-bold text-slate-950 hover:bg-amber-400"
              onClick={onClose}
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
