import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Clock, Heart, Star } from "lucide-react";
import { Link } from "react-router";
import { Section, SectionHeader } from "./Section";
import type { PackageRow } from "./api";
import {
  displayPricePoisha,
  formatDuration,
  formatPrice,
  packageBadge,
  packageImage,
  packageRating,
} from "./format";

const WISHLIST_KEY = "st-wishlist";

function readWishlist(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeWishlist(slugs: string[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(slugs));
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
    typeof window !== "undefined" ? readWishlist() : [],
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
      writeWishlist(next);
      return next;
    });
  }

  return (
    <Section className="py-16 md:py-24 bg-white">
      <SectionHeader
        eyebrow="Top Picks"
        title="Featured Tour Packages"
        subtitle="Hand-picked journeys from our Package Engine — updated when you publish in admin."
        action={
          <a
            href="/erp/#/site/search"
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent transition-colors"
          >
            View all packages <ArrowRight size={14} />
          </a>
        }
      />

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-muted animate-pulse" aria-hidden />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12 border border-dashed border-border rounded-2xl">
          No published packages yet. Add packages in admin to populate this carousel.
        </p>
      ) : (
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {packages.map((pkg) => {
                const img = packageImage(pkg);
                const price = displayPricePoisha(pkg);
                const badge = packageBadge(pkg);
                const rating = packageRating(pkg);
                const href = `/erp/#/site/packages/${encodeURIComponent(pkg.slug)}`;
                const bookHref = `/erp/#/site/packages/${encodeURIComponent(pkg.slug)}/book`;
                const wished = wishlist.includes(pkg.slug);
                const dest = pkg.destination || pkg.country || "";

                return (
                  <article
                    key={pkg.id}
                    className="min-w-0 shrink-0 grow-0 basis-full sm:basis-[calc(50%-12px)] lg:basis-[calc(33.333%-16px)]"
                  >
                    <div className="group bg-card rounded-2xl border border-border overflow-hidden shadow-[0_8px_30px_rgba(20,33,61,0.08)] hover:shadow-[0_12px_40px_rgba(20,33,61,0.12)] transition-all duration-300 hover:-translate-y-1">
                      <div className="relative h-52 overflow-hidden">
                        {img ? (
                          <img
                            src={img}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                        {badge && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-wide">
                            {badge}
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                          onClick={() => toggleWishlist(pkg.slug)}
                          className="absolute top-3 right-3 size-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <Heart
                            size={16}
                            className={wished ? "fill-accent text-accent" : "text-muted-foreground"}
                          />
                        </button>
                        {rating != null && (
                          <div className="absolute bottom-3 left-3 flex items-center gap-1">
                            <Star size={11} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-bold text-white">{rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        {dest && <p className="text-xs text-muted-foreground mb-1">{dest}</p>}
                        <h3 className="text-foreground font-bold text-lg mb-3 line-clamp-2">
                          <a href={href} className="hover:text-accent transition-colors">
                            {pkg.name}
                          </a>
                        </h3>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock size={11} />
                            {formatDuration(pkg.durationDays, pkg.durationNights)}
                          </span>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">From</p>
                            <p className="font-bold text-primary">{formatPrice(price)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <a
                            href={href}
                            className="flex-1 text-center py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors"
                          >
                            Details
                          </a>
                          <a
                            href={bookHref}
                            className="flex-1 text-center py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
                          >
                            Book
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {packages.length > 1 && (
            <div className="flex justify-center gap-3 mt-8">
              <button
                type="button"
                aria-label="Previous packages"
                disabled={!canPrev}
                onClick={() => emblaApi?.scrollPrev()}
                className="size-10 rounded-full border border-border bg-white flex items-center justify-center disabled:opacity-40 hover:border-accent hover:text-accent transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next packages"
                disabled={!canNext}
                onClick={() => emblaApi?.scrollNext()}
                className="size-10 rounded-full border border-border bg-white flex items-center justify-center disabled:opacity-40 hover:border-accent hover:text-accent transition-colors"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="text-center mt-8 md:hidden">
        <Link to="/tours" className="text-sm font-semibold text-primary hover:text-accent">
          View all packages →
        </Link>
      </div>
    </Section>
  );
}
