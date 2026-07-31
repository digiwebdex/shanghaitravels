import { Link } from "react-router";
import {
  ArrowRight,
  Building2,
  FileText,
  Globe,
  Map,
  Plane,
  Shield,
  Star,
} from "lucide-react";
import { Section, SectionHeader } from "./Section";
import type { CmsContent } from "./api";

type ServiceItem = {
  title: string;
  summary?: string;
  coverUrl?: string | null;
  url?: string;
  icon?: string;
};

const FALLBACK_SERVICES: ServiceItem[] = [
  {
    title: "Visa Services",
    summary: "Tourist, business, student & work visas for 100+ countries from Dhaka.",
    url: "/visa",
    icon: "visa",
  },
  {
    title: "Air Ticketing",
    summary: "Best fares on 500+ airlines — domestic and international routes.",
    url: "/flights",
    icon: "air",
  },
  {
    title: "Hotel Booking",
    summary: "4 & 5-star hotels, resorts and serviced apartments worldwide.",
    url: "/flights",
    icon: "hotel",
  },
  {
    title: "Tour Packages",
    summary: "Curated group and custom itineraries with full ground support.",
    url: "/tours",
    icon: "tour",
  },
  {
    title: "Hajj & Umrah",
    summary: "VIP and economy pilgrimage packages with complete guidance.",
    url: "/services",
    icon: "hajj",
  },
  {
    title: "Travel Insurance",
    summary: "Comprehensive coverage for medical, trip cancellation & baggage.",
    url: "/services",
    icon: "insurance",
  },
];

const ICON_MAP: Record<string, typeof Plane> = {
  visa: FileText,
  air: Plane,
  hotel: Building2,
  tour: Map,
  hajj: Star,
  insurance: Shield,
  globe: Globe,
};

function parseHeroServices(items: CmsContent[]): ServiceItem[] {
  return items
    .filter((c) => c.status !== "draft")
    .map((c) => ({
      title: c.title,
      summary: c.summary || undefined,
      coverUrl: c.coverUrl,
      url: (c.meta?.url as string) || (c.meta?.href as string) || "/services",
      icon: (c.meta?.icon as string) || undefined,
    }));
}

type ServicesGridProps = {
  heroServices?: CmsContent[];
};

export function ServicesGrid({ heroServices = [] }: ServicesGridProps) {
  const fromApi = parseHeroServices(heroServices);
  const services = fromApi.length ? fromApi.slice(0, 6) : FALLBACK_SERVICES;

  return (
    <Section className="py-16 md:py-24 bg-background">
      <SectionHeader
        eyebrow="What We Offer"
        title="Complete Travel Solutions"
        subtitle="From a single visa to a full pilgrimage programme — all under one roof in Vatara, Dhaka."
        centered
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((s) => {
          const Icon = (s.icon && ICON_MAP[s.icon]) || Globe;
          const href = s.url || "/services";
          const isExternal = href.startsWith("http") || href.startsWith("/erp");

          const inner = (
            <>
              <div className="size-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/15 transition-colors">
                <Icon size={20} className="text-accent" />
              </div>
              <h3 className="text-foreground font-bold mb-2">{s.title}</h3>
              {s.summary && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{s.summary}</p>
              )}
              <span className="text-xs font-semibold text-accent inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Learn more <ArrowRight size={12} />
              </span>
            </>
          );

          return isExternal ? (
            <a
              key={s.title}
              href={href}
              className="group bg-card rounded-2xl border border-border p-6 shadow-[0_8px_30px_rgba(20,33,61,0.05)] hover:border-accent/30 hover:shadow-md transition-all"
            >
              {inner}
            </a>
          ) : (
            <Link
              key={s.title}
              to={href}
              className="group bg-card rounded-2xl border border-border p-6 shadow-[0_8px_30px_rgba(20,33,61,0.05)] hover:border-accent/30 hover:shadow-md transition-all"
            >
              {inner}
            </Link>
          );
        })}
      </div>

      <div className="text-center mt-10">
        <Link
          to="/services"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors"
        >
          View All Services <ArrowRight size={14} />
        </Link>
      </div>
    </Section>
  );
}
