import { Link } from "react-router";
import {
  ArrowRight,
  Building2,
  Globe2,
  Plane,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Section, SectionHeading, ViewAll } from "./Section";
import type { CmsContent } from "./api";
import { CARD, CARD_HOVER, EASE, FOCUS, ICON_TINTS } from "./tokens";

type ServiceItem = {
  key: string;
  title: string;
  summary: string;
  url: string;
  icon: string;
};

const FALLBACK_SERVICES: ServiceItem[] = [
  {
    key: "visa",
    title: "Visa Services",
    summary: "Tourist, business, student & work visas for 100+ countries.",
    url: "/visa",
    icon: "visa",
  },
  {
    key: "air",
    title: "Air Tickets",
    summary: "Domestic & international tickets at the best fares.",
    url: "/flights",
    icon: "air",
  },
  {
    key: "hajj",
    title: "Hajj & Umrah",
    summary: "Complete Hajj & Umrah packages with full guidance.",
    url: "/services",
    icon: "hajj",
  },
  {
    key: "tour",
    title: "Tour Packages",
    summary: "Worldwide tour packages for families & groups.",
    url: "/tours",
    icon: "tour",
  },
  {
    key: "hotel",
    title: "Hotel Booking",
    summary: "800,000+ hotels worldwide at the best rates.",
    url: "/flights",
    icon: "hotel",
  },
  {
    key: "insurance",
    title: "Travel Insurance",
    summary: "Safe journeys without the worry of unexpected costs.",
    url: "/services",
    icon: "insurance",
  },
];

const ICON_MAP: Record<string, typeof Plane> = {
  visa: ScrollText,
  air: Plane,
  hajj: Sparkles,
  tour: Globe2,
  hotel: Building2,
  insurance: ShieldCheck,
};

function fromCms(items: CmsContent[]): ServiceItem[] {
  return items
    .filter((c) => c.status !== "draft")
    .slice(0, 6)
    .map((c, i) => ({
      key: c.id,
      title: c.title,
      summary: c.summary || "",
      url: (c.meta?.url as string) || (c.meta?.href as string) || "/services",
      icon: (c.meta?.icon as string) || FALLBACK_SERVICES[i]?.icon || "tour",
    }));
}

type ServicesGridProps = {
  services?: CmsContent[];
};

export function ServicesGrid({ services = [] }: ServicesGridProps) {
  const cms = fromCms(services);
  const items = cms.length ? cms : FALLBACK_SERVICES;

  return (
    <Section id="services">
      <SectionHeading title="Our Services" action={<ViewAll to="/services">View all services</ViewAll>} />

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-6">
        {items.map((service, i) => {
          const Icon = ICON_MAP[service.icon] || Globe2;
          const isExternal = service.url.startsWith("http") || service.url.startsWith("/erp");

          const body = (
            <>
              <span
                className={`grid size-11 place-items-center rounded-full text-white shadow-[0_3px_10px_rgba(20,33,61,0.18)] transition-all duration-500 ${EASE} group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:shadow-[0_8px_20px_rgba(20,33,61,0.24)] ${
                  ICON_TINTS[i % ICON_TINTS.length]
                }`}
                aria-hidden
              >
                <Icon size={19} />
              </span>
              <h3 className="mt-3.5 text-[13px] font-bold leading-[1.4] tracking-[-0.01em] text-primary">
                {service.title}
              </h3>
              {service.summary && (
                <p className="mt-2 line-clamp-3 text-[11px] leading-[1.65] text-muted-foreground">
                  {service.summary}
                </p>
              )}
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[10px] font-bold tracking-[0.02em] text-accent transition-all duration-300 group-hover:gap-2">
                Learn More
                <ArrowRight size={10} aria-hidden />
              </span>
            </>
          );

          const className = `group flex h-full flex-col items-center p-[18px] text-center ${CARD} ${CARD_HOVER} hover:ring-accent/25 ${FOCUS}`;

          return isExternal ? (
            <a key={service.key} href={service.url} className={className}>
              {body}
            </a>
          ) : (
            <Link key={service.key} to={service.url} className={className}>
              {body}
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
