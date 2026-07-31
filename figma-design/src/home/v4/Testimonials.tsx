import { Quote, Star } from "lucide-react";
import { Section, SectionHeader } from "./Section";
import type { CmsContent } from "./api";

type TestimonialsProps = {
  items: CmsContent[];
};

export function Testimonials({ items }: TestimonialsProps) {
  const published = items.filter((t) => t.status !== "draft").slice(0, 6);
  if (!published.length) return null;

  return (
    <Section className="py-16 md:py-24 bg-muted/50">
      <SectionHeader
        eyebrow="Testimonials"
        title="What Our Clients Say"
        subtitle="Real feedback from travellers who trusted Shanghai Travels in Dhaka."
        centered
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {published.map((t) => {
          const rating = typeof t.meta?.rating === "number" ? t.meta.rating : 5;
          const role = (t.meta?.role as string) || t.body || "Traveller";
          const avatar = t.coverUrl;
          const initial = t.title.charAt(0).toUpperCase();

          return (
            <article
              key={t.id}
              className="bg-card rounded-2xl border border-border p-6 shadow-[0_8px_30px_rgba(20,33,61,0.06)]"
            >
              <Quote size={24} className="text-accent/30 mb-4" aria-hidden />
              <p className="text-sm text-foreground leading-relaxed mb-5">{t.summary || t.body}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {avatar ? (
                    <img src={avatar} alt="" className="size-9 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <div className="size-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                      {initial}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5" aria-label={`${rating} stars`}>
                  {[...Array(Math.min(5, Math.round(rating)))].map((_, i) => (
                    <Star key={i} size={11} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
