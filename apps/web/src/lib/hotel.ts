/** Hotel booking detail helpers — manual entry only (no GDS / bed-bank). */

export const ROOM_TYPES = [
  "Standard",
  "Deluxe",
  "Superior",
  "Suite",
  "Family",
  "Twin",
  "Double",
  "Single",
  "Other",
] as const;

export const MEAL_PLANS = ["RO", "BB", "HB", "FB", "AI", "other"] as const;

export const MEAL_PLAN_LABELS: Record<(typeof MEAL_PLANS)[number], string> = {
  RO: "Room only",
  BB: "Bed & breakfast",
  HB: "Half board",
  FB: "Full board",
  AI: "All inclusive",
  other: "Other",
};

export type HotelForm = {
  hotelName: string;
  city: string;
  country: string;
  checkIn: string;
  checkOut: string;
  nights: string;
  roomType: string;
  mealPlan: string;
  rooms: string;
  guests: string;
  confirmationNo: string;
  notes: string;
};

export function emptyHotelForm(): HotelForm {
  return {
    hotelName: "",
    city: "",
    country: "",
    checkIn: "",
    checkOut: "",
    nights: "",
    roomType: "Standard",
    mealPlan: "BB",
    rooms: "1",
    guests: "2",
    confirmationNo: "",
    notes: "",
  };
}

/** Convert API ISO → value for date input (yyyy-mm-dd). */
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

/** Nights between check-in and check-out (date-only). */
export function calcNights(checkIn: string, checkOut: string): number | null {
  if (!checkIn.trim() || !checkOut.trim()) return null;
  const a = new Date(`${checkIn.trim()}T12:00:00`).getTime();
  const b = new Date(`${checkOut.trim()}T12:00:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  const days = Math.round((b - a) / 864e5);
  return days >= 0 ? days : null;
}

export function validateHotelForm(f: HotelForm): string | null {
  if (f.mealPlan && !MEAL_PLANS.includes(f.mealPlan as (typeof MEAL_PLANS)[number])) {
    return "Invalid meal plan";
  }
  if (f.checkIn && f.checkOut) {
    const n = calcNights(f.checkIn, f.checkOut);
    if (n == null || n < 0) return "Check-out must be on or after check-in";
  }
  if (f.rooms.trim()) {
    const r = Number(f.rooms);
    if (!Number.isFinite(r) || r < 1) return "Rooms must be at least 1";
  }
  if (f.guests.trim()) {
    const g = Number(f.guests);
    if (!Number.isFinite(g) || g < 1) return "Guests must be at least 1";
  }
  if (f.nights.trim()) {
    const n = Number(f.nights);
    if (!Number.isFinite(n) || n < 0) return "Nights must be 0 or more";
  }
  return null;
}

export function hotelPayload(f: HotelForm): Record<string, unknown> {
  const nightsCalc = calcNights(f.checkIn, f.checkOut);
  const nights =
    f.nights.trim() !== ""
      ? Number(f.nights)
      : nightsCalc != null
        ? nightsCalc
        : null;
  return {
    hotelName: f.hotelName.trim() || undefined,
    city: f.city.trim() || undefined,
    country: f.country.trim() || undefined,
    roomType: f.roomType.trim() || undefined,
    mealPlan: f.mealPlan.trim() || undefined,
    confirmationNo: f.confirmationNo.trim() || undefined,
    notes: f.notes.trim() || undefined,
    checkIn: fromDateInput(f.checkIn) ?? null,
    checkOut: fromDateInput(f.checkOut) ?? null,
    nights: nights != null && Number.isFinite(nights) ? nights : null,
    rooms: f.rooms.trim() !== "" ? Number(f.rooms) : null,
    guests: f.guests.trim() !== "" ? Number(f.guests) : null,
  };
}
