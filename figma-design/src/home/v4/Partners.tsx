import { Section, SectionHeader } from "./Section";
import type { CmsContent } from "./api";
import { parsePartnerLogos } from "./format";

const FALLBACK_PARTNERS = [
  "Biman Bangladesh",
  "Emirates",
  "Qatar Airways",
  "Singapore Airlines",
  "Turkish Airlines",
  "Saudi Airlines",
];

type PartnersProps = {
  gallery?: CmsContent | null;
};

export function Partners({ gallery }: PartnersProps) {
  const logos = gallery ? parsePartnerLogos(gallery) : [];
  const names = logos.length
    ? logos.map((url) => ({ type: "image" as const, url }))
    : FALLBACK_PARTNERS.map((name) => ({ type: "text" as const, name }));

  return (
    <Section className="py-12 md:py-16 bg-card border-y border-border">
      <SectionHeader
        eyebrow="Trusted By"
        title={gallery?.title || "Accreditations & Partners"}
        subtitle={gallery?.summary || "Airlines, hotels and pilgrimage partners we work with daily."}
        centered
        className="mb-8"
      />

      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
        {names.map((item, i) =>
          item.type === "image" ? (
            <div
              key={item.url + i}
              className="h-12 px-4 flex items-center justify-center rounded-xl border border-border bg-white"
            >
              <img src={item.url} alt="" className="max-h-8 max-w-[120px] object-contain" loading="lazy" />
            </div>
          ) : (
            <div
              key={item.name}
              className="px-5 py-2.5 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
            >
              {item.name}
            </div>
          ),
        )}
      </div>
    </Section>
  );
}
