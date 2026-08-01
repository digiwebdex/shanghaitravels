import { Section, SectionHeading } from "./Section";
import type { CmsContent } from "./api";
import { parsePartnerLogos } from "./format";
import { EASE } from "./tokens";

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

      <div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(20,33,61,0.05),0_6px_20px_rgba(20,33,61,0.06)] ring-1 ring-[rgba(20,33,61,0.07)]">
        {useMarquee ? (
          // Feathered edges so the loop reads as continuous rather than clipped.
          <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent_0,#000_7%,#000_93%,transparent_100%)]">
            <div className="st-marquee flex w-max items-stretch">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex items-stretch" aria-hidden={copy === 1}>
                  {cells}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex items-stretch divide-x divide-[rgba(20,33,61,0.06)]">
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
    <div className="group grid h-[76px] min-w-[150px] place-items-center px-5">
      {url ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          className={`max-h-9 max-w-[132px] object-contain opacity-70 grayscale transition-all duration-500 ${EASE} group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0`}
        />
      ) : (
        // Partners without an uploaded mark render as a set wordmark so the row
        // still reads as a deliberate logo lockup rather than leftover label text.
        <span
          className={`text-center text-[11.5px] font-extrabold uppercase leading-[1.3] tracking-[0.14em] text-primary/45 transition-all duration-500 ${EASE} group-hover:-translate-y-0.5 group-hover:text-primary/85`}
        >
          {name}
        </span>
      )}
    </div>
  );
}
