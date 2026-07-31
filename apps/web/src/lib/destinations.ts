/** Phase E3 — Destination Master helpers. Destinations group packages for homepage showcase & browse. */

export type DestinationStatus = "draft" | "published" | "archived";

export type DestinationCategory = "visa" | "tour" | "hajj" | "air_ticket";

export type DestinationGalleryItem = {
  id: string;
  destinationId: string;
  url: string;
  caption?: string | null;
  sortOrder?: number;
};

export type DestinationMaster = {
  id: string;
  code: string;
  name: string;
  slug: string;
  countryCode?: string | null;
  countryName?: string | null;
  /** Alias some APIs may use */
  country?: string | null;
  region?: string | null;
  flagEmoji?: string | null;
  flagUrl?: string | null;
  heroImageUrl?: string | null;
  coverImageUrl?: string | null;
  summary?: string | null;
  description?: string | null;
  mapEmbedUrl?: string | null;
  categories?: DestinationCategory[] | null;
  status: DestinationStatus;
  homepageFeatured?: boolean;
  popular?: boolean;
  featured?: boolean;
  sortOrder?: number | null;
  displayOrder?: number | null;
  packageCount?: number | null;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DestinationShowcaseSettings = {
  enabled: boolean;
  maxCards: number;
  showPackageCount: boolean;
  showRegion: boolean;
  showFlag: boolean;
  showHeroImage: boolean;
  showCta: boolean;
  ctaLabel: string;
};

export const DEFAULT_SHOWCASE_SETTINGS: DestinationShowcaseSettings = {
  enabled: true,
  maxCards: 8,
  showPackageCount: true,
  showRegion: true,
  showFlag: true,
  showHeroImage: true,
  showCta: true,
  ctaLabel: "Explore Destination →",
};

export const DESTINATION_STATUSES: DestinationStatus[] = ["draft", "published", "archived"];

export const DESTINATION_CATEGORIES: DestinationCategory[] = ["visa", "tour", "hajj", "air_ticket"];

export const DESTINATION_CATEGORY_LABELS: Record<DestinationCategory, string> = {
  visa: "Visa",
  tour: "Tour",
  hajj: "Hajj & Umrah",
  air_ticket: "Air Ticket",
};

export const DESTINATION_REGIONS = [
  "Asia",
  "Europe",
  "Middle East",
  "Africa",
  "North America",
  "South America",
  "Oceania",
] as const;

export type DestinationListFilters = {
  q?: string;
  status?: DestinationStatus | string;
  region?: string;
  country?: string;
  homepageFeatured?: boolean;
  popular?: boolean;
  featured?: boolean;
  collection?: string;
  limit?: number;
  page?: number;
};

export type DestinationBrowseFilters = {
  q?: string;
  region?: string;
  country?: string;
  category?: DestinationCategory | string;
  budgetMaxPoisha?: number;
  limit?: number;
  page?: number;
};

export function formatPackageCount(count: number | null | undefined): string {
  const n = Math.max(0, Number(count) || 0);
  if (n === 1) return "1 Package";
  return `${n} Packages`;
}

export function destinationCountry(d: DestinationMaster): string {
  return d.countryName || d.country || d.name;
}

export function destinationOrder(d: DestinationMaster): number {
  return d.displayOrder ?? d.sortOrder ?? 9999;
}

export function mergeShowcaseSettings(
  partial?: Partial<DestinationShowcaseSettings> | null,
): DestinationShowcaseSettings {
  return { ...DEFAULT_SHOWCASE_SETTINGS, ...(partial || {}) };
}

export function buildDestinationListQuery(q: DestinationListFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.status) p.set("status", q.status);
  if (q.region) p.set("region", q.region);
  if (q.country) p.set("country", q.country);
  if (q.collection) p.set("collection", q.collection);
  if (q.homepageFeatured) p.set("homepageFeatured", "true");
  if (q.popular) p.set("popular", "true");
  if (q.featured) p.set("featured", "true");
  if (q.limit != null) p.set("limit", String(q.limit));
  if (q.page != null) p.set("page", String(q.page));
  return p;
}

export function buildDestinationBrowseQuery(q: DestinationBrowseFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.region) p.set("region", q.region);
  if (q.country) p.set("country", q.country);
  if (q.category) p.set("category", q.category);
  if (q.budgetMaxPoisha != null) p.set("budgetMaxPoisha", String(q.budgetMaxPoisha));
  if (q.limit != null) p.set("limit", String(q.limit));
  if (q.page != null) p.set("page", String(q.page));
  return p;
}

export function slugifyDestination(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type DestinationFormState = {
  code: string;
  name: string;
  slug: string;
  countryCode: string;
  countryName: string;
  region: string;
  flagEmoji: string;
  flagUrl: string;
  heroImageUrl: string;
  summary: string;
  description: string;
  mapEmbedUrl: string;
  categories: DestinationCategory[];
};

export function emptyDestinationForm(): DestinationFormState {
  return {
    code: "",
    name: "",
    slug: "",
    countryCode: "",
    countryName: "",
    region: "",
    flagEmoji: "",
    flagUrl: "",
    heroImageUrl: "",
    summary: "",
    description: "",
    mapEmbedUrl: "",
    categories: [],
  };
}

export function destinationToForm(d: DestinationMaster): DestinationFormState {
  return {
    code: d.code,
    name: d.name,
    slug: d.slug,
    countryCode: d.countryCode || "",
    countryName: d.countryName || d.country || "",
    region: d.region || "",
    flagEmoji: d.flagEmoji || "",
    flagUrl: d.flagUrl || "",
    heroImageUrl: d.heroImageUrl || d.coverImageUrl || "",
    summary: d.summary || "",
    description: d.description || "",
    mapEmbedUrl: d.mapEmbedUrl || "",
    categories: (d.categories || []) as DestinationCategory[],
  };
}

export function validateDestinationForm(f: DestinationFormState): string | null {
  if (!f.name.trim()) return "Name is required";
  if (!(f.countryName || "").trim()) return "Country is required";
  if (!f.slug.trim()) return "Slug is required";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug.trim())) return "Slug must be lowercase letters, numbers, and hyphens";
  return null;
}

export function destinationFormPayload(f: DestinationFormState): Record<string, unknown> {
  const country = f.countryName.trim();
  return {
    name: f.name.trim(),
    slug: f.slug.trim(),
    country,
    countryCode: f.countryCode.trim() || undefined,
    isoCode: f.countryCode.trim() || undefined,
    region: f.region.trim() || undefined,
    flagEmoji: f.flagEmoji.trim() || undefined,
    flagUrl: f.flagUrl.trim() || undefined,
    heroImageUrl: f.heroImageUrl.trim() || undefined,
    description: (f.description || f.summary).trim() || undefined,
    mapEmbedUrl: f.mapEmbedUrl.trim() || undefined,
  };
}

export function applyShowcaseLimit(
  items: DestinationMaster[],
  settings: DestinationShowcaseSettings,
): DestinationMaster[] {
  const sorted = [...items].sort((a, b) => destinationOrder(a) - destinationOrder(b));
  const max = Math.max(1, settings.maxCards || DEFAULT_SHOWCASE_SETTINGS.maxCards);
  return sorted.slice(0, max);
}
