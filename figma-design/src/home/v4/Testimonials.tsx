import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Section, SectionHeading } from "./Section";
import type { CmsContent } from "./api";
import { CARD, CARD_HOVER, EASE, FOCUS } from "./tokens";

type TestimonialsProps = {
  items: CmsContent[];
};

export function Testimonials({ items }: TestimonialsProps) {
  const published = items.filter((t) => t.status !== "draft");
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

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

  if (!published.length) return null;

  return (
    <Section id="testimonials">
      <SectionHeading
        title="What Our Travelers Say"
        action={
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <ArrowButton dir="prev" disabled={!canPrev} onClick={() => emblaApi?.scrollPrev()} />
            <ArrowButton dir="next" disabled={!canNext} onClick={() => emblaApi?.scrollNext()} />
          </div>
        }
      />

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-6 flex touch-pan-y">
          {published.map((t) => (
            <div key={t.id} className="min-w-0 shrink-0 grow-0 basis-full pl-6 md:basis-1/2 lg:basis-1/3">
              <TestimonialCard item={t} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function ArrowButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "Previous reviews" : "Next reviews"}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-full bg-white text-primary shadow-[0_1px_3px_rgba(20,33,61,0.06)] ring-1 ring-[rgba(20,33,61,0.12)] transition-all duration-300 hover:scale-110 hover:bg-accent hover:text-white hover:ring-accent disabled:opacity-35 disabled:hover:scale-100 disabled:hover:bg-white disabled:hover:text-primary ${FOCUS}`}
    >
      <Icon size={15} aria-hidden />
    </button>
  );
}

function TestimonialCard({ item }: { item: CmsContent }) {
  const rating = typeof item.meta?.rating === "number" ? Math.min(5, Math.round(item.meta.rating)) : 5;
  const role = (item.meta?.role as string) || (item.meta?.service as string) || item.body || "";
  const quote = item.summary || item.body || "";
  const avatar = item.coverUrl;

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden p-[22px] ${CARD} ${CARD_HOVER}`}>
      {/* Oversized quote glyph, kept faint so it sits behind the review copy. */}
      <span
        className="pointer-events-none absolute -top-3 right-4 select-none font-serif text-[86px] leading-none text-primary/[0.05]"
        aria-hidden
      >
        &rdquo;
      </span>

      <div className="relative flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} size={13} className="fill-accent text-accent" aria-hidden />
        ))}
      </div>

      <p className="relative mt-3.5 line-clamp-3 text-[13px] leading-[1.7] tracking-[-0.005em] text-primary">
        {quote}
      </p>

      <div className="relative mt-auto flex items-center gap-3 border-t border-[rgba(20,33,61,0.06)] pt-4">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            loading="lazy"
            className={`size-9 shrink-0 rounded-full object-cover ring-2 ring-white shadow-[0_2px_8px_rgba(20,33,61,0.16)] transition-transform duration-500 ${EASE} group-hover:scale-105`}
          />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-[12px] font-bold text-white shadow-[0_2px_8px_rgba(20,33,61,0.2)]">
            {item.title.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-bold tracking-[-0.01em] text-primary">
            {item.title}
          </span>
          {role && <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{role}</span>}
        </span>
      </div>
    </article>
  );
}
