/** Transport booking helpers — supplier-based, no fleet management. */

export const VEHICLE_CATEGORIES = ["sedan", "microbus", "coaster", "bus", "other"] as const;

export const SERVICE_KINDS = ["airport_transfer", "city_transfer", "chauffeur", "other"] as const;

export const SERVICE_KIND_LABELS: Record<(typeof SERVICE_KINDS)[number], string> = {
  airport_transfer: "Airport transfer",
  city_transfer: "City transfer",
  chauffeur: "Chauffeur",
  other: "Other",
};

export type TransportForm = {
  serviceKind: string;
  vehicleType: string;
  pickupLocation: string;
  dropLocation: string;
  routeName: string;
  scheduledAt: string;
  passengers: string;
  driverName: string;
  vehicleNo: string;
  confirmationNo: string;
  notes: string;
};

export function emptyTransportForm(): TransportForm {
  return {
    serviceKind: "airport_transfer",
    vehicleType: "sedan",
    pickupLocation: "",
    dropLocation: "",
    routeName: "",
    scheduledAt: "",
    passengers: "1",
    driverName: "",
    vehicleNo: "",
    confirmationNo: "",
    notes: "",
  };
}

export function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(local: string): string | undefined {
  const t = local.trim();
  if (!t) return undefined;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function validateTransportForm(f: TransportForm): string | null {
  if (f.serviceKind && !SERVICE_KINDS.includes(f.serviceKind as (typeof SERVICE_KINDS)[number])) {
    return "Invalid service kind";
  }
  if (f.vehicleType && !VEHICLE_CATEGORIES.includes(f.vehicleType as (typeof VEHICLE_CATEGORIES)[number])) {
    return "Invalid vehicle category";
  }
  if (f.passengers.trim()) {
    const n = Number(f.passengers);
    if (!Number.isFinite(n) || n < 1) return "Passengers must be at least 1";
  }
  if (f.scheduledAt.trim() && !fromLocalInput(f.scheduledAt)) {
    return "Invalid schedule date/time";
  }
  return null;
}

export function transportPayload(f: TransportForm): Record<string, unknown> {
  return {
    serviceKind: f.serviceKind.trim() || undefined,
    vehicleType: f.vehicleType.trim() || undefined,
    pickupLocation: f.pickupLocation.trim() || undefined,
    dropLocation: f.dropLocation.trim() || undefined,
    routeName: f.routeName.trim() || undefined,
    driverName: f.driverName.trim() || undefined,
    vehicleNo: f.vehicleNo.trim() || undefined,
    confirmationNo: f.confirmationNo.trim() || undefined,
    notes: f.notes.trim() || undefined,
    scheduledAt: fromLocalInput(f.scheduledAt) ?? null,
    passengers: f.passengers.trim() !== "" ? Number(f.passengers) : null,
  };
}
