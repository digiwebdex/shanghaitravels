import { Section, SectionHeading } from "./Section";
import type { CmsContent } from "./api";
import { parsePartnerLogos } from "./format";
import { DEFAULT_PARTNER_LOGOS } from "./partnerLogos";
import { EASE } from "./tokens";

type PartnersProps = {
  gallery?: CmsContent | null;
};

export function Partners({ gallery }: PartnersProps) {
  const cmsLogos = gallery ? parsePartnerLogos(gallery) : [];
  const count = cmsLogos.length || DEFAULT_PARTNER_LOGOS.length;
  const useMarquee = count > 8;

  // The marquee lays cells out intrinsically so they need a width of their own;
  // in the grid the column sets the width and a minimum would force overflow.
  const cellWidth = useMarquee ? "min-w-[150px]" : "w-full min-w-0";
  const cells = cmsLogos.length
    ? cmsLogos.map((url, i) => <LogoCell key={`${url}-${i}`} src={url} width={cellWidth} />)
    : DEFAULT_PARTNER_LOGOS.map((logo) => (
        <LogoCell
          key={logo.name}
          src={logo.src}
          name={logo.name}
          height={logo.height}
          width={cellWidth}
        />
      ));

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
          // Wraps rather than sitting in one row: eight cells at their minimum
          // width overflow a phone, and the clipped logos would be unreachable.
          // The 1px gap over a tinted backdrop draws the hairlines between
          // cells, so they stay correct however the grid reflows.
          <ul className="grid grid-cols-2 gap-px bg-[rgba(20,33,61,0.07)] sm:grid-cols-4 lg:grid-cols-8">
            {cells.map((cell, i) => (
              <li key={i} className="bg-white">
                {cell}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}

function LogoCell({
  src,
  name,
  height = "h-8",
  width = "min-w-[150px]",
}: {
  src: string;
  name?: string;
  height?: string;
  width?: string;
}) {
  return (
    <div className={`group grid h-[76px] place-items-center px-4 sm:px-5 ${width}`}>
      <img
        src={src}
        alt={name ? `${name} logo` : ""}
        loading="lazy"
        className={`w-auto max-w-full object-contain opacity-90 transition-all duration-500 ${EASE} group-hover:scale-[1.06] group-hover:opacity-100 sm:max-w-[128px] ${height}`}
      />
    </div>
  );
}
