/** Phase E3 — Package Engine helpers. PackageID is the system-of-truth for bookings/leads. */

import { fromPoisha, toPoisha } from "@/lib/tour";

export { toPoisha, fromPoisha } from "@/lib/tour";
export {
  parseItineraryDays,
  serializeItineraryDays,
  PACKAGE_TYPES,
  PACKAGE_TYPE_LABELS,
} from "@/lib/tour";

export type PackageStatus = "draft" | "published" | "scheduled" | "archived";

export type PackageCategory = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PackageMaster = {
  id: string;
  code: string;
  name: string;
  slug: string;
  categoryId?: string | null;
  category?: PackageCategory | null;
  packageType?: string | null;
  country?: string | null;
  destination?: string | null;
  cities?: string[] | null;
  durationDays?: number | null;
  durationNights?: number | null;
  supplierId?: string | null;
  supplier?: { id: string; code: string; name: string; type?: string | null } | null;
  supplierCostPoisha?: number | null;
  sellingPricePoisha?: number | null;
  offerPricePoisha?: number | null;
  agentCommissionPoisha?: number | null;
  totalSeats?: number | null;
  seatsAvailable?: number | null;
  status: PackageStatus;
  homeFeatured?: boolean;
  popular?: boolean;
  recommended?: boolean;
  agentEnabled?: boolean;
  corporateEnabled?: boolean;
  tags?: string[] | null;
  coverImageUrl?: string | null;
  heroImageUrl?: string | null;
  videoUrl?: string | null;
  summary?: string | null;
  description?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
  itinerary?: string | null;
  mapEmbedUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  scheduledPublishAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PackageGalleryItem = {
  id: string;
  packageId: string;
  url: string;
  caption?: string | null;
  sortOrder?: number;
  isCover?: boolean;
  createdAt?: string;
};

export type PackageAvailability = {
  id: string;
  packageId: string;
  departDate: string;
  returnDate?: string | null;
  totalSeats: number;
  seatsBooked?: number;
  seatsAvailable?: number;
  pricePoisha?: number | null;
  status?: "open" | "closed" | "sold_out";
  notes?: string | null;
};

export type PackageFaq = {
  id: string;
  packageId: string;
  question: string;
  answer: string;
  sortOrder?: number;
};

export type PackageReportSummary = {
  totalPackages: number;
  published: number;
  draft: number;
  scheduled: number;
  archived: number;
  homeFeatured: number;
  popular: number;
  recommended: number;
  totalEnquiries: number;
  totalBookings: number;
  revenuePoisha: number;
  byCategory: { categoryId: string; categoryName: string; count: number }[];
  byDestination: { destination: string; count: number }[];
  topPackages: { id: string; name: string; slug: string; enquiries: number; bookings: number }[];
};

export const PACKAGE_STATUSES: PackageStatus[] = ["draft", "published", "scheduled", "archived"];

export const PACKAGE_COLLECTIONS = [
  "home",
  "featured",
  "popular",
  "recommended",
  "agent",
  "corporate",
] as const;

export type PackageCollection = (typeof PACKAGE_COLLECTIONS)[number];

export const DEFAULT_COLLECTIONS: Record<PackageCollection, string> = {
  home: "Homepage carousel",
  featured: "Featured packages",
  popular: "Popular picks",
  recommended: "Staff recommended",
  agent: "Agent portal catalogue",
  corporate: "Corporate approved packages",
};

export type PackageForm = {
  code: string;
  name: string;
  slug: string;
  categoryId: string;
  packageType: string;
  country: string;
  destination: string;
  cities: string;
  durationDays: string;
  durationNights: string;
  supplierId: string;
  supplierCostBdt: string;
  sellingPriceBdt: string;
  offerPriceBdt: string;
  agentCommissionBdt: string;
  totalSeats: string;
  homeFeatured: boolean;
  popular: boolean;
  recommended: boolean;
  agentEnabled: boolean;
  corporateEnabled: boolean;
  tags: string;
  coverImageUrl: string;
  heroImageUrl: string;
  videoUrl: string;
  summary: string;
  description: string;
  inclusions: string;
  exclusions: string;
  itinerary: string;
  mapEmbedUrl: string;
};

export function emptyPackageForm(): PackageForm {
  return {
    code: "",
    name: "",
    slug: "",
    categoryId: "",
    packageType: "group",
    country: "",
    destination: "",
    cities: "",
    durationDays: "",
    durationNights: "",
    supplierId: "",
    supplierCostBdt: "",
    sellingPriceBdt: "",
    offerPriceBdt: "",
    agentCommissionBdt: "",
    totalSeats: "",
    homeFeatured: false,
    popular: false,
    recommended: false,
    agentEnabled: false,
    corporateEnabled: false,
    tags: "",
    coverImageUrl: "",
    heroImageUrl: "",
    videoUrl: "",
    summary: "",
    description: "",
    inclusions: "",
    exclusions: "",
    itinerary: "",
    mapEmbedUrl: "",
  };
}

export function slugifyPackage(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatPrice(poisha?: number | null, opts?: { currency?: string }): string {
  if (poisha == null) return "—";
  const major = poisha / 100;
  const cur = opts?.currency ?? "৳";
  return `${cur}${major.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDuration(days?: number | null, nights?: number | null): string {
  if (days == null && nights == null) return "—";
  const d = days != null ? `${days}D` : "";
  const n = nights != null ? `${nights}N` : "";
  return [d, n].filter(Boolean).join(" / ") || "—";
}

export function parseTags(raw: string): string[] {
  return raw
    .split(/[,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function parseCities(raw: string): string[] {
  return raw
    .split(/[,;]+/)
    .map((c) => c.trim())
    .filter(Boolean);
}

export type PackageListFilters = {
  q?: string;
  status?: PackageStatus;
  categoryId?: string;
  destination?: string;
  country?: string;
  packageType?: string;
  homeFeatured?: boolean;
  popular?: boolean;
  recommended?: boolean;
  agentEnabled?: boolean;
  corporateEnabled?: boolean;
  collection?: PackageCollection;
  page?: number;
  limit?: number;
};

export type PackageSearchFilters = {
  q?: string;
  destination?: string;
  category?: string;
  categoryId?: string;
  durationMin?: number;
  durationMax?: number;
  budgetMaxPoisha?: number;
  travelMonth?: string;
  packageType?: string;
  page?: number;
  limit?: number;
};

export function buildPackageListQuery(q: PackageListFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.status) p.set("status", q.status);
  if (q.categoryId) p.set("categoryId", q.categoryId);
  if (q.destination) p.set("destination", q.destination);
  if (q.country) p.set("country", q.country);
  if (q.packageType) p.set("packageType", q.packageType);
  if (q.homeFeatured) p.set("homeFeatured", "true");
  if (q.popular) p.set("popular", "true");
  if (q.recommended) p.set("recommended", "true");
  if (q.agentEnabled) p.set("agentEnabled", "true");
  if (q.corporateEnabled) p.set("corporateEnabled", "true");
  if (q.collection) p.set("collection", q.collection);
  if (q.page) p.set("page", String(q.page));
  if (q.limit) p.set("limit", String(q.limit));
  return p;
}

export function buildPackageSearchQuery(q: PackageSearchFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.destination) p.set("destination", q.destination);
  if (q.category) p.set("category", q.category);
  if (q.categoryId) p.set("categoryId", q.categoryId);
  if (q.durationMin != null) p.set("durationMin", String(q.durationMin));
  if (q.durationMax != null) p.set("durationMax", String(q.durationMax));
  if (q.budgetMaxPoisha != null) p.set("budgetMaxPoisha", String(q.budgetMaxPoisha));
  if (q.travelMonth) p.set("travelMonth", q.travelMonth);
  if (q.packageType) p.set("packageType", q.packageType);
  if (q.page) p.set("page", String(q.page));
  if (q.limit) p.set("limit", String(q.limit));
  return p;
}

export function validatePackageForm(f: PackageForm): string | null {
  if (!f.code.trim()) return "Package code is required";
  if (!f.name.trim()) return "Package name is required";
  if (f.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug.trim())) {
    return "Slug must be lowercase letters, numbers, and hyphens";
  }
  if (f.durationDays.trim()) {
    const n = Number(f.durationDays);
    if (!Number.isFinite(n) || n < 1) return "Duration days must be at least 1";
  }
  if (f.durationNights.trim()) {
    const n = Number(f.durationNights);
    if (!Number.isFinite(n) || n < 0) return "Duration nights cannot be negative";
  }
  if (f.totalSeats.trim()) {
    const n = Number(f.totalSeats);
    if (!Number.isFinite(n) || n < 0) return "Total seats must be zero or more";
  }
  if (f.supplierCostBdt.trim() && toPoisha(f.supplierCostBdt) == null) return "Invalid supplier cost";
  if (f.sellingPriceBdt.trim() && toPoisha(f.sellingPriceBdt) == null) return "Invalid selling price";
  if (f.offerPriceBdt.trim() && toPoisha(f.offerPriceBdt) == null) return "Invalid offer price";
  if (f.agentCommissionBdt.trim() && toPoisha(f.agentCommissionBdt) == null) return "Invalid agent commission";
  return null;
}

export function packageFormPayload(f: PackageForm): Record<string, unknown> {
  return {
    code: f.code.trim(),
    name: f.name.trim(),
    slug: f.slug.trim() || slugifyPackage(f.name),
    categoryId: f.categoryId.trim() || undefined,
    packageType: f.packageType.trim() || undefined,
    country: f.country.trim() || undefined,
    destination: f.destination.trim() || undefined,
    cities: parseCities(f.cities),
    durationDays: f.durationDays.trim() ? Number(f.durationDays) : undefined,
    durationNights: f.durationNights.trim() ? Number(f.durationNights) : undefined,
    supplierId: f.supplierId.trim() || null,
    supplierCostPoisha: toPoisha(f.supplierCostBdt),
    sellingPricePoisha: toPoisha(f.sellingPriceBdt),
    offerPricePoisha: toPoisha(f.offerPriceBdt),
    agentCommissionPoisha: toPoisha(f.agentCommissionBdt),
    totalSeats: f.totalSeats.trim() ? Number(f.totalSeats) : undefined,
    homeFeatured: f.homeFeatured,
    popular: f.popular,
    recommended: f.recommended,
    agentEnabled: f.agentEnabled,
    corporateEnabled: f.corporateEnabled,
    tags: parseTags(f.tags),
    coverImageUrl: f.coverImageUrl.trim() || undefined,
    heroImageUrl: f.heroImageUrl.trim() || undefined,
    videoUrl: f.videoUrl.trim() || undefined,
    summary: f.summary.trim() || undefined,
    description: f.description.trim() || undefined,
    inclusions: f.inclusions.trim() || undefined,
    exclusions: f.exclusions.trim() || undefined,
    itinerary: f.itinerary.trim() || undefined,
    mapEmbedUrl: f.mapEmbedUrl.trim() || undefined,
  };
}

export function packageToForm(p: PackageMaster): PackageForm {
  return {
    code: p.code,
    name: p.name,
    slug: p.slug,
    categoryId: p.categoryId || "",
    packageType: p.packageType || "group",
    country: p.country || "",
    destination: p.destination || "",
    cities: (p.cities || []).join(", "),
    durationDays: p.durationDays != null ? String(p.durationDays) : "",
    durationNights: p.durationNights != null ? String(p.durationNights) : "",
    supplierId: p.supplierId || "",
    supplierCostBdt: fromPoisha(p.supplierCostPoisha),
    sellingPriceBdt: fromPoisha(p.sellingPricePoisha),
    offerPriceBdt: fromPoisha(p.offerPricePoisha),
    agentCommissionBdt: fromPoisha(p.agentCommissionPoisha),
    totalSeats: p.totalSeats != null ? String(p.totalSeats) : "",
    homeFeatured: !!p.homeFeatured,
    popular: !!p.popular,
    recommended: !!p.recommended,
    agentEnabled: !!p.agentEnabled,
    corporateEnabled: !!p.corporateEnabled,
    tags: (p.tags || []).join(", "),
    coverImageUrl: p.coverImageUrl || "",
    heroImageUrl: p.heroImageUrl || "",
    videoUrl: p.videoUrl || "",
    summary: p.summary || "",
    description: p.description || "",
    inclusions: p.inclusions || "",
    exclusions: p.exclusions || "",
    itinerary: p.itinerary || "",
    mapEmbedUrl: p.mapEmbedUrl || "",
  };
}

export function hasOffer(p: PackageMaster): boolean {
  return (
    p.offerPricePoisha != null &&
    p.sellingPricePoisha != null &&
    p.offerPricePoisha < p.sellingPricePoisha
  );
}

export function displayPricePoisha(p: PackageMaster): number | null {
  if (p.offerPricePoisha != null) return p.offerPricePoisha;
  return p.sellingPricePoisha ?? null;
}

export function seatsLeft(p: PackageMaster): number | null {
  if (p.seatsAvailable != null) return p.seatsAvailable;
  if (p.totalSeats != null) return p.totalSeats;
  return null;
}
