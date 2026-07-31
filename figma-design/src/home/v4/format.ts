import type { PackageRow } from "./api";

export function formatPrice(poisha?: number | null, currency = "৳"): string {
  if (poisha == null) return "—";
  const major = poisha / 100;
  return `${currency}${major.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDuration(days?: number | null, nights?: number | null): string {
  if (days == null && nights == null) return "—";
  const parts: string[] = [];
  if (days != null) parts.push(`${days} Day${days === 1 ? "" : "s"}`);
  if (nights != null) parts.push(`${nights} Night${nights === 1 ? "" : "s"}`);
  return parts.join(" · ") || "—";
}

export function displayPricePoisha(p: PackageRow): number | null {
  if (p.offerPricePoisha != null) return p.offerPricePoisha;
  return p.pricePoisha ?? p.sellingPricePoisha ?? null;
}

export function packageImage(p: PackageRow): string {
  return p.thumbnailUrl || p.bannerUrl || p.coverImageUrl || p.heroImageUrl || "";
}

export function packageBadge(p: PackageRow): string | null {
  if (p.homeFeatured) return "Featured";
  if (p.featured) return "Featured";
  if (p.recommended) return "Recommended";
  if (p.popular) return "Popular";
  return null;
}

export function packageRating(p: PackageRow): number | null {
  return p.ratingAvg ?? p.rating ?? null;
}

export function formatPkgCount(n?: number | null): string {
  const c = Math.max(0, Number(n) || 0);
  return c === 1 ? "1 Package" : `${c} Packages`;
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
