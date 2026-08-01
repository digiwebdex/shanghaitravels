import { Section, SectionHeading } from "./Section";
import type { CmsContent } from "./api";
import { parsePartnerLogos } from "./format";

const FALLBACK_PARTNERS = [
  "Emirates",
  "Qatar Airways",
  "Turkish Airlines",
  "Saudia",
  "Singapore Airlines",
  "British Airways",
  "Malaysia Airlines",
  "Biman Bangladesh",
];

type PartnersProps = {
  gallery?: CmsContent | null;
};

export function Partners({ gallery }: PartnersProps) {
  const logos = gallery ? parsePartnerLogos(gallery) : [];
  const useMarquee = logos.length > 8 || (!logos.length && FALLBACK_PARTNERS.length > 8);

  const cells = logos.length
    ? logos.map((url, i) => <LogoCell key={`${url}-${i}`} url={url} />)
    : FALLBACK_PARTNERS.map((name) => <LogoCell key={name} name={name} />);

  return (
    <Section id="partners">
      <SectionHeading title={gallery?.title || "Our Trusted Partners"} />

      <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_12px_rgba(20,33,61,0.06)] ring-1 ring-[rgba(20,33,61,0.08)]">
        {useMarquee ? (
          <div className="relative overflow-hidden">
            <div className="st-marquee flex w-max items-stretch">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex items-stretch" aria-hidden={copy === 1}>
                  {cells}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex items-stretch divide-x divide-[rgba(20,33,61,0.07)]">
            {cells.map((cell, i) => (
              <li key={i} className="flex-1">
                {cell}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}

function LogoCell({ url, name }: { url?: string; name?: string }) {
  return (
    <div className="grid h-[72px] min-w-[150px] place-items-center px-5">
      {url ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          className="max-h-8 max-w-[130px] object-contain opacity-75 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
        />
      ) : (
        <span className="text-center text-[11px] font-bold uppercase tracking-wide text-primary/45 transition-colors hover:text-primary/75">
          {name}
        </span>
      )}
    </div>
  );
}
