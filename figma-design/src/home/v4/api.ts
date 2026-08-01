/** V4 homepage — public site API helpers (raw fetch, no ERP client). */

export type PackageRow = {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  coverImageUrl?: string | null;
  heroImageUrl?: string | null;
  country?: string | null;
  destination?: string | null;
  durationDays?: number | null;
  durationNights?: number | null;
  pricePoisha?: number | null;
  offerPricePoisha?: number | null;
  sellingPricePoisha?: number | null;
  ratingAvg?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  featured?: boolean;
  popular?: boolean;
  recommended?: boolean;
  homeFeatured?: boolean;
};

export type DestinationRow = {
  id: string;
  slug: string;
  name: string;
  country?: string | null;
  countryName?: string | null;
  countryCode?: string | null;
  flagEmoji?: string | null;
  flagUrl?: string | null;
  heroImageUrl?: string | null;
  coverImageUrl?: string | null;
  packageCount?: number | null;
  region?: string | null;
  displayOrder?: number | null;
  sortOrder?: number | null;
};

export type DestinationSettings = {
  enabled?: boolean;
  maxCards?: number;
  showPackageCount?: boolean;
  showRegion?: boolean;
  showFlag?: boolean;
  showHeroImage?: boolean;
  showCta?: boolean;
  ctaLabel?: string;
};

export type CmsContent = {
  id: string;
  type: string;
  slug: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  coverUrl?: string | null;
  meta?: Record<string, unknown> | null;
  publishedAt?: string | null;
  status?: string;
  sortOrder?: number;
};

export type CmsBanner = {
  id?: string;
  code?: string | null;
  imageUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
};

/** Code of the banner that owns the homepage hero. */
export const HERO_BANNER_CODE = "home-hero";

/**
 * Resolves which banner drives the hero. Every hero banner is free to share
 * `sortOrder`, so "whichever the API listed first" is not a stable choice —
 * API smoke runs write their own hero banners into the same table, and one of
 * those held the headline until it was retired. Key off the known code and
 * only fall back to list order if it is missing.
 */
export function pickHeroBanner(banners: CmsBanner[]): CmsBanner | null {
  return banners.find((b) => b.code === HERO_BANNER_CODE) ?? banners[0] ?? null;
}

export function listOf<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: T[] }).data;
  }
  return [];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchJsonSafe<T>(url: string, fallback: T): Promise<T> {
  try {
    return await fetchJson<T>(url);
  } catch {
    return fallback;
  }
}

export async function fetchPackages(limit = 8): Promise<PackageRow[]> {
  const urls = [
    `/api2/site/packages?collection=home&limit=${limit}`,
    `/api2/site/packages?collection=featured&limit=${limit}`,
    `/api2/site/packages?homeFeatured=true&limit=${limit}`,
    `/api2/site/packages?popular=true&limit=${limit}`,
    `/api2/site/packages?limit=${limit}`,
  ];
  for (const url of urls) {
    const items = listOf<PackageRow>(await fetchJsonSafe(url, { data: [] }));
    if (items.length) return items;
  }
  return [];
}

export async function fetchDestinations(): Promise<{ rows: DestinationRow[]; settings: DestinationSettings }> {
  const [listRaw, settings] = await Promise.all([
    fetchJsonSafe<unknown>("/api2/site/destinations?collection=home", { data: [] }),
    fetchJsonSafe<DestinationSettings>("/api2/site/destinations/settings", {}),
  ]);
  let rows = listOf<DestinationRow>(listRaw);
  if (!rows.length) {
    rows = listOf<DestinationRow>(
      await fetchJsonSafe("/api2/site/destinations?homepageFeatured=true", { data: [] }),
    );
  }
  if (!rows.length) {
    rows = listOf<DestinationRow>(
      await fetchJsonSafe("/api2/site/destinations?popular=true", { data: [] }),
    );
  }
  return { rows, settings };
}

export async function fetchContent(type?: string): Promise<CmsContent[]> {
  const qs = type ? `?type=${encodeURIComponent(type)}` : "";
  return listOf<CmsContent>(await fetchJsonSafe(`/api2/site/content${qs}`, []));
}

export async function fetchContentBySlug(type: string, slug: string): Promise<CmsContent | null> {
  const items = await fetchContent(type);
  return items.find((c) => c.slug === slug) ?? null;
}

export async function fetchBanners(placement = "hero"): Promise<CmsBanner[]> {
  return listOf<CmsBanner>(
    await fetchJsonSafe(`/api2/site/banners?placement=${encodeURIComponent(placement)}`, []),
  );
}

export type FormPayload = {
  formType: string;
  name?: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
};

export async function submitForm(body: FormPayload): Promise<void> {
  const res = await fetch("/api2/site/forms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to submit form");
}
