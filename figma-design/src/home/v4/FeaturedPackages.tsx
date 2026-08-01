import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Clock, Heart, MapPin, Star, Users } from "lucide-react";
import { CoverImage } from "./CoverImage";
import { Section, SectionHeading, ViewAll } from "./Section";
import type { PackageRow } from "./api";
import { CARD, CARD_HOVER, EASE, FOCUS } from "./tokens";
import {
  discountPercent,
  displayPricePoisha,
  formatDurationShort,
  formatPrice,
  packageBadge,
  packageFallbackImage,
  packageImage,
  packageRating,
  strikePricePoisha,
} from "./format";

const WISHLIST_KEY = "st-wishlist";

const XL_COLS: Record<number, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
};

function readWishlist(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

type FeaturedPackagesProps = {
  packages: PackageRow[];
  loading?: boolean;
};

export function FeaturedPackages({ packages, loading }: FeaturedPackagesProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false, slidesToScroll: 1 });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readWishlist(),
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  function toggleWishlist(slug: string) {
    setWishlist((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <Section id="featured-packages">
      <SectionHeading
        title="Featured Packages"
        action={<ViewAll href="/erp/#/site/search">View all packages</ViewAll>}
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="st-shimmer h-[336px] rounded-xl" aria-hidden />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          No published packages yet. Publish packages in the Package Engine to fill this carousel.
        </p>
      ) : packages.length <= 5 ? (
        // Fewer than a full row: lay out as a grid so the track never ends in a gap.
        <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 ${XL_COLS[packages.length]}`}>
          {packages.map((pkg, i) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              index={i}
              wished={wishlist.includes(pkg.slug)}
              onToggleWishlist={() => toggleWishlist(pkg.slug)}
            />
          ))}
        </div>
      ) : (
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="-ml-5 flex touch-pan-y">
              {packages.map((pkg, i) => (
                <div
                  key={pkg.id}
                  className="min-w-0 shrink-0 grow-0 basis-full pl-5 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
                >
                  <PackageCard
                    pkg={pkg}
                    index={i}
                    wished={wishlist.includes(pkg.slug)}
                    onToggleWishlist={() => toggleWishlist(pkg.slug)}
                  />
                </div>
              ))}
            </div>
          </div>

          <CarouselButton side="left" disabled={!canPrev} onClick={() => emblaApi?.scrollPrev()} />
          <CarouselButton side="right" disabled={!canNext} onClick={() => emblaApi?.scrollNext()} />
        </div>
      )}
    </Section>
  );
}

function CarouselButton({
  side,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous packages" : "Next packages"}
      disabled={disabled}
      onClick={onClick}
      className={`absolute top-[88px] z-10 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-white text-primary shadow-[0_2px_6px_rgba(20,33,61,0.08),0_10px_24px_rgba(20,33,61,0.18)] ring-1 ring-black/[0.06] transition-all duration-300 hover:scale-110 hover:bg-accent hover:text-white hover:ring-accent disabled:pointer-events-none disabled:opacity-0 md:grid ${
        side === "left" ? "-left-3" : "-right-3"
      } ${FOCUS}`}
    >
      <Icon size={17} aria-hidden />
    </button>
  );
}

function PackageCard({
  pkg,
  index,
  wished,
  onToggleWishlist,
}: {
  pkg: PackageRow;
  index: number;
  wished: boolean;
  onToggleWishlist: () => void;
}) {
  const img = packageImage(pkg);
  const fallbackImg = packageFallbackImage(pkg, index);
  const badge = packageBadge(pkg);
  const rating = packageRating(pkg);
  const price = displayPricePoisha(pkg);
  const strike = strikePricePoisha(pkg);
  const discount = discountPercent(pkg);
  const duration = formatDurationShort(pkg.durationDays, pkg.durationNights);
  const place = pkg.destination || pkg.country || "";
  const href = `/erp/#/site/packages/${encodeURIComponent(pkg.slug)}`;
  const bookHref = `${href}/book`;

  return (
    <article className={`group flex h-full flex-col overflow-hidden ${CARD} ${CARD_HOVER}`}>
      <div className="relative h-[176px] shrink-0 overflow-hidden bg-[#E8EDF5]">
        <CoverImage
          src={img}
          fallbackSrc={fallbackImg}
          className={`size-full object-cover transition-transform duration-[900ms] ${EASE} group-hover:scale-[1.09]`}
        />

        {/* Anchors the overlay chips so they never float on a bright sky. */}
        <div
          className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(180deg,rgba(20,33,61,0)_0%,rgba(20,33,61,0.42)_100%)] opacity-90"
          aria-hidden
        />

        {badge && (
          <span
            className={`absolute left-3 top-3 rounded-md px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.06em] text-white shadow-[0_2px_8px_rgba(20,33,61,0.28)] ${badge.className}`}
          >
            {badge.label}
          </span>
        )}

        {discount != null && (
          <span className="absolute right-3 top-3 rounded-md bg-white/95 px-1.5 py-1 text-[9px] font-extrabold tracking-[0.02em] text-accent shadow-[0_2px_8px_rgba(20,33,61,0.2)] backdrop-blur-sm">
            -{discount}%
          </span>
        )}

        {rating != null && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-primary shadow-[0_2px_8px_rgba(20,33,61,0.2)] backdrop-blur-sm">
            <Star size={10} className="fill-amber-400 text-amber-400" aria-hidden />
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-[18px]">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[14px] font-bold leading-[1.35] tracking-[-0.01em] text-primary">
            <a href={href} className="transition-colors duration-300 hover:text-accent">
              {pkg.name}
            </a>
          </h3>
          <button
            type="button"
            aria-label={wished ? `Remove ${pkg.name} from wishlist` : `Save ${pkg.name} to wishlist`}
            aria-pressed={wished}
            onClick={onToggleWishlist}
            className={`-mr-1 -mt-0.5 grid size-6 shrink-0 place-items-center rounded-full transition-colors hover:bg-muted ${FOCUS}`}
          >
            <Heart
              size={13}
              className={wished ? "fill-accent text-accent" : "text-muted-foreground"}
              aria-hidden
            />
          </button>
        </div>

        {duration && (
          <p className="mt-1.5 text-[11px] font-medium tracking-[0.02em] text-muted-foreground">{duration}</p>
        )}

        <ul className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          {place && (
            <li className="flex min-w-0 items-center gap-1">
              <MapPin size={10} className="shrink-0" aria-hidden />
              <span className="truncate">{place}</span>
            </li>
          )}
          {pkg.durationDays != null && (
            <>
              <li className="h-2.5 w-px bg-border" aria-hidden />
              <li className="flex items-center gap-1">
                <Clock size={10} aria-hidden />
                {pkg.durationDays}D
              </li>
            </>
          )}
          {pkg.reviewCount != null && pkg.reviewCount > 0 && (
            <>
              <li className="h-2.5 w-px bg-border" aria-hidden />
              <li className="flex items-center gap-1">
                <Users size={10} aria-hidden />
                {pkg.reviewCount}
              </li>
            </>
          )}
        </ul>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[rgba(20,33,61,0.06)] pt-4">
          <div className="min-w-0">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">From</p>
            <p className="mt-1 truncate text-[17px] font-extrabold leading-none tracking-[-0.02em] text-primary">
              {formatPrice(price)}
            </p>
            {strike != null && (
              <p className="mt-1 text-[10px] text-muted-foreground line-through">{formatPrice(strike)}</p>
            )}
          </div>
          <a
            href={bookHref}
            className={`shrink-0 rounded-lg bg-accent px-3.5 py-2 text-[11px] font-bold tracking-[0.01em] text-white shadow-[0_2px_8px_rgba(249,115,22,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-[0_8px_18px_rgba(249,115,22,0.38)] ${FOCUS}`}
          >
            Book Now
          </a>
        </div>
      </div>
    </article>
  );
}
