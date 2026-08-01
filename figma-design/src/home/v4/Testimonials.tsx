import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Section, SectionHeading } from "./Section";
import type { CmsContent } from "./api";
import { CARD, FOCUS } from "./tokens";

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
      className={`grid size-8 place-items-center rounded-full bg-white text-primary ring-1 ring-[rgba(20,33,61,0.12)] transition-colors hover:bg-accent hover:text-white hover:ring-accent disabled:opacity-35 disabled:hover:bg-white disabled:hover:text-primary ${FOCUS}`}
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
    <article className={`flex h-full flex-col p-5 ${CARD}`}>
      <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} size={13} className="fill-accent text-accent" aria-hidden />
        ))}
      </div>

      <p className="mt-3 line-clamp-3 text-[13px] leading-[1.6] text-primary">{quote}</p>

      <div className="mt-auto flex items-center gap-3 pt-4">
        {avatar ? (
          <img src={avatar} alt="" loading="lazy" className="size-9 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-[12px] font-bold text-white">
            {item.title.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-bold text-primary">{item.title}</span>
          {role && <span className="block truncate text-[11px] text-muted-foreground">{role}</span>}
        </span>
      </div>
    </article>
  );
}
