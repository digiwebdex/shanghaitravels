import type { DestinationRow, PackageRow } from "./api";

export function formatPrice(poisha?: number | null, currency = "৳"): string {
  if (poisha == null) return "—";
  const major = poisha / 100;
  return `${currency} ${major.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDuration(days?: number | null, nights?: number | null): string {
  if (days == null && nights == null) return "—";
  const parts: string[] = [];
  if (days != null) parts.push(`${days} Day${days === 1 ? "" : "s"}`);
  if (nights != null) parts.push(`${nights} Night${nights === 1 ? "" : "s"}`);
  return parts.join(" · ") || "—";
}

/** Compact "5D / 4N" form used on the package cards. */
export function formatDurationShort(days?: number | null, nights?: number | null): string {
  const parts: string[] = [];
  if (days != null) parts.push(`${days}D`);
  if (nights != null) parts.push(`${nights}N`);
  return parts.join(" / ");
}

export function displayPricePoisha(p: PackageRow): number | null {
  if (p.offerPricePoisha != null) return p.offerPricePoisha;
  return p.pricePoisha ?? p.sellingPricePoisha ?? null;
}

/** Original price, only when an offer price actually undercuts it. */
export function strikePricePoisha(p: PackageRow): number | null {
  const base = p.pricePoisha ?? p.sellingPricePoisha ?? null;
  if (p.offerPricePoisha == null || base == null) return null;
  return p.offerPricePoisha < base ? base : null;
}

export function discountPercent(p: PackageRow): number | null {
  const base = strikePricePoisha(p);
  if (base == null || p.offerPricePoisha == null) return null;
  const pct = Math.round(((base - p.offerPricePoisha) / base) * 100);
  return pct > 0 ? pct : null;
}

export function packageImage(p: PackageRow): string {
  return p.thumbnailUrl || p.bannerUrl || p.coverImageUrl || p.heroImageUrl || "";
}

export type PackageBadge = { label: string; className: string };

/** Reference badge ladder: BEST SELLER / POPULAR / TRENDING / VALUE PACK / SPECIAL. */
export function packageBadge(p: PackageRow): PackageBadge | null {
  if (p.popular) return { label: "Popular", className: "bg-[#22A45D]" };
  if (p.recommended) return { label: "Trending", className: "bg-[#7C3AED]" };
  if (p.homeFeatured) return { label: "Best Seller", className: "bg-[#F97316]" };
  if (discountPercent(p) != null) return { label: "Value Pack", className: "bg-[#2F80ED]" };
  if (p.featured) return { label: "Featured", className: "bg-[#F97316]" };
  return null;
}

export function packageRating(p: PackageRow): number | null {
  return p.ratingAvg ?? p.rating ?? null;
}

export function formatPkgCount(n?: number | null): string {
  const c = Math.max(0, Number(n) || 0);
  return c === 1 ? "1 Package" : `${c} Packages`;
}

/** Circular flag source: explicit asset first, then the ISO code via flagcdn. */
export function flagSrc(d: DestinationRow): string {
  if (d.flagUrl) return d.flagUrl;
  const code = (d.countryCode || "").trim().toLowerCase();
  if (code.length === 2) return `https://flagcdn.com/w80/${code}.png`;
  return "";
}

export function destinationImage(d: DestinationRow): string {
  return d.heroImageUrl || d.coverImageUrl || "";
}

export function parseMetaArray<T>(meta: Record<string, unknown> | null | undefined, key: string): T[] {
  const val = meta?.[key];
  return Array.isArray(val) ? (val as T[]) : [];
}

export function parsePartnerLogos(content: { body?: string | null; meta?: Record<string, unknown> | null }): string[] {
  if (content.meta?.logos && Array.isArray(content.meta.logos)) {
    return (content.meta.logos as unknown[]).filter((x): x is string => typeof x === "string");
  }
  if (content.body) {
    try {
      const parsed = JSON.parse(content.body) as unknown;
      if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === "string");
      if (parsed && typeof parsed === "object" && Array.isArray((parsed as { logos?: unknown }).logos)) {
        return ((parsed as { logos: unknown[] }).logos).filter((x): x is string => typeof x === "string");
      }
    } catch {
      /* ignore */
    }
  }
  return [];
}
