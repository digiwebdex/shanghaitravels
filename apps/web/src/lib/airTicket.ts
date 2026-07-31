/** Air ticket detail helpers — manual entry only (no GDS). */

export const TRIP_TYPES = ["one_way", "round_trip", "multi_city"] as const;
export const CABIN_CLASSES = ["economy", "premium", "business", "first"] as const;

export type AirTicketForm = {
  pnr: string;
  airline: string;
  flightNo: string;
  origin: string;
  destination: string;
  tripType: string;
  cabinClass: string;
  passengerName: string;
  ticketNo: string;
  departAt: string;
  returnAt: string;
  notes: string;
};

export function emptyAirTicketForm(): AirTicketForm {
  return {
    pnr: "",
    airline: "",
    flightNo: "",
    origin: "",
    destination: "",
    tripType: "one_way",
    cabinClass: "economy",
    passengerName: "",
    ticketNo: "",
    departAt: "",
    returnAt: "",
    notes: "",
  };
}

/** Convert API ISO / Date string → value for datetime-local. */
export function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local → ISO for Nest, or undefined if empty. */
export function fromLocalInput(local: string): string | undefined {
  const t = local.trim();
  if (!t) return undefined;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function validateAirTicketForm(f: AirTicketForm): string | null {
  if (f.tripType && !TRIP_TYPES.includes(f.tripType as (typeof TRIP_TYPES)[number])) {
    return "Invalid trip type";
  }
  if (f.cabinClass && !CABIN_CLASSES.includes(f.cabinClass as (typeof CABIN_CLASSES)[number])) {
    return "Invalid cabin class";
  }
  if (f.departAt && f.returnAt) {
    const a = new Date(f.departAt).getTime();
    const b = new Date(f.returnAt).getTime();
    if (!Number.isNaN(a) && !Number.isNaN(b) && b < a) {
      return "Return must be on or after departure";
    }
  }
  return null;
}

export function airTicketPayload(f: AirTicketForm): Record<string, unknown> {
  return {
    pnr: f.pnr.trim() || undefined,
    airline: f.airline.trim() || undefined,
    flightNo: f.flightNo.trim() || undefined,
    origin: f.origin.trim() || undefined,
    destination: f.destination.trim() || undefined,
    tripType: f.tripType || undefined,
    cabinClass: f.cabinClass || undefined,
    passengerName: f.passengerName.trim() || undefined,
    ticketNo: f.ticketNo.trim() || undefined,
    notes: f.notes.trim() || undefined,
    departAt: fromLocalInput(f.departAt) ?? null,
    returnAt: fromLocalInput(f.returnAt) ?? null,
  };
}
