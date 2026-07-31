/** Homepage Hero Services — CMS type `hero_service` helpers */

export const HERO_SERVICE_TYPE = "hero_service";
export const HERO_SERVICE_MAX = 6;

export const HERO_ICON_OPTIONS = [
  { key: "passport", label: "Visa / Passport" },
  { key: "kaaba", label: "Hajj & Umrah" },
  { key: "plane", label: "Air Ticket" },
  { key: "globe", label: "Tours" },
  { key: "hotel", label: "Hotel" },
  { key: "bus", label: "Transport" },
] as const;

export type HeroIconKey = (typeof HERO_ICON_OPTIONS)[number]["key"];

export type HeroServiceItem = {
  id?: string;
  slug?: string;
  enabled: boolean;
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  url: string;
  sortOrder: number;
};

export const DEFAULT_HERO_SERVICES: HeroServiceItem[] = [
  {
    enabled: true,
    icon: "passport",
    title: "Visa Services",
    description: "Tourist, business, student and family visas — prepared carefully for destinations worldwide.",
    buttonText: "Apply Now",
    url: "/inquiry?service=visa",
    sortOrder: 10,
    slug: "visa-services",
  },
  {
    enabled: true,
    icon: "kaaba",
    title: "Hajj & Umrah",
    description: "Complete pilgrimage packages with flights, hotels, transport and on-ground guidance.",
    buttonText: "View Packages",
    url: "/tours",
    sortOrder: 20,
    slug: "hajj-umrah",
  },
  {
    enabled: true,
    icon: "plane",
    title: "Air Ticket",
    description: "Domestic and international tickets for individuals, families and groups.",
    buttonText: "Book Now",
    url: "/inquiry?service=air_ticket",
    sortOrder: 30,
    slug: "air-ticket",
  },
  {
    enabled: true,
    icon: "globe",
    title: "Tour Packages",
    description: "Curated itineraries for families, honeymoons and groups — built around you.",
    buttonText: "Explore Tours",
    url: "/tours",
    sortOrder: 40,
    slug: "tour-packages",
  },
];

export function parseHeroServiceFromCms(row: {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  coverUrl?: string | null;
  meta?: unknown;
  status: string;
  sortOrder?: number;
}): HeroServiceItem {
  const meta = (row.meta && typeof row.meta === "object" ? row.meta : {}) as Record<string, unknown>;
  return {
    id: row.id,
    slug: row.slug,
    enabled: row.status === "published",
    icon: String(row.coverUrl || meta.icon || "globe"),
    title: row.title,
    description: String(row.summary || ""),
    buttonText: String(row.body || meta.buttonText || "Learn more"),
    url: String(meta.url || meta.href || "/inquiry"),
    sortOrder: Number(row.sortOrder) || 0,
  };
}
