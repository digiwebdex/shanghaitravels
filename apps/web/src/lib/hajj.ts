/** Hajj & Umrah helpers — operator packages/pilgrims/groups, not an OTA marketplace. */

export const HAJJ_KINDS = ["hajj", "umrah"] as const;
export const PACKAGE_CATEGORIES = ["economy", "standard", "premium", "vip"] as const;
export const ROOM_TYPES = ["quad", "triple", "double", "economy"] as const;
export const VISA_STATUSES = ["not_applied", "applied", "approved", "rejected"] as const;
export const PASSPORT_STATUSES = ["received", "pending", "expired"] as const;
export const GROUP_STATUSES = ["forming", "confirmed", "departed", "returned", "cancelled"] as const;

export type HajjForm = {
  packageType: string;
  year: string;
  pilgrimName: string;
  passportNo: string;
  mahramName: string;
  packageName: string;
  packageCode: string;
  packageCategory: string;
  groupCode: string;
  groupName: string;
  leaderName: string;
  nationality: string;
  gender: string;
  dob: string;
  phone: string;
  mahramRelation: string;
  healthNotes: string;
  emergencyContact: string;
  emergencyPhone: string;
  visaStatus: string;
  visaNo: string;
  passportStatus: string;
  flightNo: string;
  airline: string;
  transportNote: string;
  roomAllocation: string;
  occupancyNote: string;
  inclusions: string;
  exclusions: string;
  paymentPlanNote: string;
  supplierCostBdt: string;
  sellingPriceBdt: string;
  paidBdt: string;
  confirmationNo: string;
  departureDate: string;
  returnDate: string;
  hotelMakkah: string;
  hotelMadinah: string;
  roomType: string;
  notes: string;
};

export function emptyHajjForm(kind: "hajj" | "umrah" = "hajj"): HajjForm {
  return {
    packageType: kind,
    year: String(new Date().getFullYear()),
    pilgrimName: "",
    passportNo: "",
    mahramName: "",
    packageName: "",
    packageCode: "",
    packageCategory: "standard",
    groupCode: "",
    groupName: "",
    leaderName: "",
    nationality: "Bangladeshi",
    gender: "",
    dob: "",
    phone: "",
    mahramRelation: "",
    healthNotes: "",
    emergencyContact: "",
    emergencyPhone: "",
    visaStatus: "not_applied",
    visaNo: "",
    passportStatus: "pending",
    flightNo: "",
    airline: "",
    transportNote: "",
    roomAllocation: "",
    occupancyNote: "",
    inclusions: "",
    exclusions: "",
    paymentPlanNote: "",
    supplierCostBdt: "",
    sellingPriceBdt: "",
    paidBdt: "",
    confirmationNo: "",
    departureDate: "",
    returnDate: "",
    hotelMakkah: "",
    hotelMadinah: "",
    roomType: "quad",
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

export function calcBalancePoisha(selling?: number | null, paid?: number | null): number | null {
  if (selling == null) return null;
  return selling - (paid || 0);
}

export function validateHajjForm(f: HajjForm): string | null {
  if (f.packageType && !HAJJ_KINDS.includes(f.packageType as (typeof HAJJ_KINDS)[number])) {
    return "Invalid package type (hajj|umrah)";
  }
  if (f.packageCategory && !PACKAGE_CATEGORIES.includes(f.packageCategory as (typeof PACKAGE_CATEGORIES)[number])) {
    return "Invalid package category";
  }
  if (f.visaStatus && !VISA_STATUSES.includes(f.visaStatus as (typeof VISA_STATUSES)[number])) {
    return "Invalid visa status";
  }
  if (f.passportStatus && !PASSPORT_STATUSES.includes(f.passportStatus as (typeof PASSPORT_STATUSES)[number])) {
    return "Invalid passport status";
  }
  if (f.departureDate && f.returnDate) {
    const a = new Date(`${f.departureDate}T12:00:00`).getTime();
    const b = new Date(`${f.returnDate}T12:00:00`).getTime();
    if (!Number.isNaN(a) && !Number.isNaN(b) && b < a) return "Return date must be on or after departure";
  }
  if (f.supplierCostBdt.trim() && toPoisha(f.supplierCostBdt) == null) return "Invalid supplier cost";
  if (f.sellingPriceBdt.trim() && toPoisha(f.sellingPriceBdt) == null) return "Invalid selling price";
  if (f.paidBdt.trim() && toPoisha(f.paidBdt) == null) return "Invalid paid amount";
  return null;
}

export function hajjPayload(f: HajjForm): Record<string, unknown> {
  return {
    packageType: f.packageType.trim() || undefined,
    year: f.year.trim() || undefined,
    pilgrimName: f.pilgrimName.trim() || undefined,
    passportNo: f.passportNo.trim() || undefined,
    mahramName: f.mahramName.trim() || undefined,
    packageName: f.packageName.trim() || undefined,
    packageCode: f.packageCode.trim() || undefined,
    packageCategory: f.packageCategory.trim() || undefined,
    groupCode: f.groupCode.trim() || undefined,
    groupName: f.groupName.trim() || undefined,
    leaderName: f.leaderName.trim() || undefined,
    nationality: f.nationality.trim() || undefined,
    gender: f.gender.trim() || undefined,
    dob: f.dob.trim() || undefined,
    phone: f.phone.trim() || undefined,
    mahramRelation: f.mahramRelation.trim() || undefined,
    healthNotes: f.healthNotes.trim() || undefined,
    emergencyContact: f.emergencyContact.trim() || undefined,
    emergencyPhone: f.emergencyPhone.trim() || undefined,
    visaStatus: f.visaStatus.trim() || undefined,
    visaNo: f.visaNo.trim() || undefined,
    passportStatus: f.passportStatus.trim() || undefined,
    flightNo: f.flightNo.trim() || undefined,
    airline: f.airline.trim() || undefined,
    transportNote: f.transportNote.trim() || undefined,
    roomAllocation: f.roomAllocation.trim() || undefined,
    occupancyNote: f.occupancyNote.trim() || undefined,
    inclusions: f.inclusions.trim() || undefined,
    exclusions: f.exclusions.trim() || undefined,
    paymentPlanNote: f.paymentPlanNote.trim() || undefined,
    confirmationNo: f.confirmationNo.trim() || undefined,
    hotelMakkah: f.hotelMakkah.trim() || undefined,
    hotelMadinah: f.hotelMadinah.trim() || undefined,
    roomType: f.roomType.trim() || undefined,
    notes: f.notes.trim() || undefined,
    departureDate: fromDateInput(f.departureDate) ?? null,
    returnDate: fromDateInput(f.returnDate) ?? null,
    supplierCostPoisha: toPoisha(f.supplierCostBdt),
    sellingPricePoisha: toPoisha(f.sellingPriceBdt),
    paidPoisha: toPoisha(f.paidBdt),
  };
}
