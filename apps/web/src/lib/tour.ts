/** Tour package helpers — supplier-curated products, not an OTA marketplace. */

export const PACKAGE_TYPES = [
  "group",
  "private",
  "corporate",
  "honeymoon",
  "family",
  "educational",
  "religious",
  "other",
] as const;

export const PACKAGE_CATEGORIES = ["domestic", "international"] as const;

export const SEASONS = ["peak", "shoulder", "off", "all_year"] as const;

export const PACKAGE_TYPE_LABELS: Record<(typeof PACKAGE_TYPES)[number], string> = {
  group: "Group tour",
  private: "Private tour",
  corporate: "Corporate tour",
  honeymoon: "Honeymoon",
  family: "Family",
  educational: "Educational",
  religious: "Religious (non-Hajj/Umrah)",
  other: "Other",
};

export type TourForm = {
  packageName: string;
  packageCode: string;
  packageType: string;
  category: string;
  destination: string;
  season: string;
  startDate: string;
  endDate: string;
  pax: string;
  itinerary: string;
  inclusions: string;
  exclusions: string;
  activities: string;
  hotelsNote: string;
  transportNote: string;
  flightsNote: string;
  visaRequirements: string;
  insuranceNote: string;
  occupancyNote: string;
  childPolicy: string;
  seasonalPricingNote: string;
  costBreakdown: string;
  supplierCostBdt: string;
  sellingPriceBdt: string;
  confirmationNo: string;
  notes: string;
};

export function emptyTourForm(): TourForm {
  return {
    packageName: "",
    packageCode: "",
    packageType: "group",
    category: "international",
    destination: "",
    season: "all_year",
    startDate: "",
    endDate: "",
    pax: "2",
    itinerary: "",
    inclusions: "",
    exclusions: "",
    activities: "",
    hotelsNote: "",
    transportNote: "",
    flightsNote: "",
    visaRequirements: "",
    insuranceNote: "",
    occupancyNote: "",
    childPolicy: "",
    seasonalPricingNote: "",
    costBreakdown: "",
    supplierCostBdt: "",
    sellingPriceBdt: "",
    confirmationNo: "",
    notes: "",
  };
}

export function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateInput(local: string): string | undefined {
  const t = local.trim();
  if (!t) return undefined;
  const d = new Date(`${t}T12:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

/** BDT major units → poisha */
export function toPoisha(bdt: string): number | null {
  const t = bdt.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function fromPoisha(poisha?: number | null): string {
  if (poisha == null) return "";
  return (poisha / 100).toFixed(2);
}

export function calcMarginPoisha(supplier?: number | null, selling?: number | null): number | null {
  if (supplier == null || selling == null) return null;
  return selling - supplier;
}

export function validateTourForm(f: TourForm): string | null {
  if (f.packageType && !PACKAGE_TYPES.includes(f.packageType as (typeof PACKAGE_TYPES)[number])) {
    return "Invalid package type";
  }
  if (f.category && !PACKAGE_CATEGORIES.includes(f.category as (typeof PACKAGE_CATEGORIES)[number])) {
    return "Invalid category";
  }
  if (f.season && !SEASONS.includes(f.season as (typeof SEASONS)[number])) {
    return "Invalid season";
  }
  if (f.startDate && f.endDate) {
    const a = new Date(`${f.startDate}T12:00:00`).getTime();
    const b = new Date(`${f.endDate}T12:00:00`).getTime();
    if (!Number.isNaN(a) && !Number.isNaN(b) && b < a) return "End date must be on or after start date";
  }
  if (f.pax.trim()) {
    const n = Number(f.pax);
    if (!Number.isFinite(n) || n < 1) return "Pax must be at least 1";
  }
  if (f.supplierCostBdt.trim() && toPoisha(f.supplierCostBdt) == null) return "Invalid supplier cost";
  if (f.sellingPriceBdt.trim() && toPoisha(f.sellingPriceBdt) == null) return "Invalid selling price";
  return null;
}

export function tourPayload(f: TourForm): Record<string, unknown> {
  return {
    packageName: f.packageName.trim() || undefined,
    packageCode: f.packageCode.trim() || undefined,
    packageType: f.packageType.trim() || undefined,
    category: f.category.trim() || undefined,
    destination: f.destination.trim() || undefined,
    season: f.season.trim() || undefined,
    itinerary: f.itinerary.trim() || undefined,
    inclusions: f.inclusions.trim() || undefined,
    exclusions: f.exclusions.trim() || undefined,
    activities: f.activities.trim() || undefined,
    hotelsNote: f.hotelsNote.trim() || undefined,
    transportNote: f.transportNote.trim() || undefined,
    flightsNote: f.flightsNote.trim() || undefined,
    visaRequirements: f.visaRequirements.trim() || undefined,
    insuranceNote: f.insuranceNote.trim() || undefined,
    occupancyNote: f.occupancyNote.trim() || undefined,
    childPolicy: f.childPolicy.trim() || undefined,
    seasonalPricingNote: f.seasonalPricingNote.trim() || undefined,
    costBreakdown: f.costBreakdown.trim() || undefined,
    confirmationNo: f.confirmationNo.trim() || undefined,
    notes: f.notes.trim() || undefined,
    startDate: fromDateInput(f.startDate) ?? null,
    endDate: fromDateInput(f.endDate) ?? null,
    pax: f.pax.trim() !== "" ? Number(f.pax) : null,
    supplierCostPoisha: toPoisha(f.supplierCostBdt),
    sellingPricePoisha: toPoisha(f.sellingPriceBdt),
  };
}

/** Serialize day rows → itinerary text for storage. */
export function serializeItineraryDays(days: { day: number; title: string; body: string }[]): string {
  return days
    .filter((d) => d.title.trim() || d.body.trim())
    .map((d) => `Day ${d.day}: ${d.title.trim()}\n${d.body.trim()}`)
    .join("\n\n");
}

export function parseItineraryDays(text: string): { day: number; title: string; body: string }[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (!blocks.length) return [{ day: 1, title: "", body: "" }];
  return blocks.map((b, i) => {
    const m = /^Day\s+(\d+)\s*:\s*(.*)$/im.exec(b);
    if (!m) return { day: i + 1, title: "", body: b };
    const rest = b.slice(m[0].length).trim();
    return { day: Number(m[1]) || i + 1, title: m[2] || "", body: rest };
  });
}
