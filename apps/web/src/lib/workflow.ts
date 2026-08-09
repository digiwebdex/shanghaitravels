/**
 * TravelOS V4.1 — enterprise workflow glue (frontend only).
 * Maps services → routes and defines the master journey stages.
 * Does not change APIs, IDs, finance math, or auth.
 */

export const MASTER_JOURNEY = [
  { id: "lead", label: "Lead" },
  { id: "customer", label: "Customer" },
  { id: "documents", label: "Documents" },
  { id: "ocr", label: "OCR" },
  { id: "booking", label: "Booking" },
  { id: "operations", label: "Operations" },
  { id: "finance", label: "Finance" },
  { id: "travel", label: "Travel" },
  { id: "after_sales", label: "After Sales" },
  { id: "repeat", label: "Repeat" },
] as const;

export type MasterJourneyId = (typeof MASTER_JOURNEY)[number]["id"];

export const BOOKING_TIMELINE = [
  { id: "created", label: "Created" },
  { id: "documents", label: "Documents" },
  { id: "ocr", label: "OCR" },
  { id: "verified", label: "Verified" },
  { id: "visa", label: "Visa" },
  { id: "ticket", label: "Ticket" },
  { id: "hotel", label: "Hotel" },
  { id: "payment", label: "Payment" },
  { id: "completed", label: "Completed" },
] as const;

export type ServiceKind =
  | "visa"
  | "air_ticket"
  | "hotel"
  | "tour"
  | "transport"
  | "hajj"
  | "umrah"
  | "student"
  | "manpower";

export const SERVICE_OPTIONS: {
  value: ServiceKind;
  label: string;
  apiType: string;
  description: string;
  /** HF2 — false = no real vertical yet; not selectable and rejected by the API. */
  supported?: boolean;
}[] = [
  { value: "visa", label: "Visa", apiType: "visa", description: "Embassy / CVASC visa cases" },
  { value: "air_ticket", label: "Air Ticket", apiType: "air_ticket", description: "Flight ticketing" },
  { value: "hotel", label: "Hotel", apiType: "hotel", description: "Hotel bookings" },
  { value: "tour", label: "Tour", apiType: "tour", description: "Tour packages" },
  { value: "transport", label: "Transport", apiType: "transport", description: "Transfers & vehicles" },
  { value: "hajj", label: "Hajj", apiType: "hajj", description: "Hajj packages" },
  { value: "umrah", label: "Umrah", apiType: "umrah", description: "Umrah packages" },
  // V14/V15 verticals — both ARE supported by the API. "student" is accepted
  // as-is; manpower is stored under serviceType "work" (there is no "manpower"
  // ServiceType — the API rejects that literal, which is exactly why apiType
  // maps to "work" here rather than to the UI value).
  {
    value: "student",
    label: "Student Consultancy",
    apiType: "student",
    description: "University applications & student visas",
  },
  {
    value: "manpower",
    label: "Manpower",
    apiType: "work",
    description: "Overseas employment & BMET",
  },
];

export function serviceCaseHref(serviceType: string, id: string): string {
  const map: Record<string, string> = {
    visa: `/visa/${id}`,
    air_ticket: `/ticketing/${id}`,
    hotel: `/hotels/${id}`,
    transport: `/transport/${id}`,
    tour: `/tours/${id}`,
    hajj: `/hajj/${id}`,
    umrah: `/hajj/${id}`,
  };
  return map[serviceType] || `/bookings/${id}`;
}

export function bookingWorkspaceHref(id: string, tab?: string): string {
  return tab ? `/bookings/${id}?tab=${tab}` : `/bookings/${id}`;
}

export function customerWorkspaceHref(id: string, tab?: string): string {
  return tab ? `/customers/${id}?tab=${tab}` : `/customers/${id}`;
}

export function serviceListHref(serviceType: string): string {
  const map: Record<string, string> = {
    visa: "/visa",
    air_ticket: "/ticketing",
    hotel: "/hotels",
    transport: "/transport",
    tour: "/tours",
    hajj: "/hajj",
    umrah: "/hajj",
  };
  return map[serviceType] || "/bookings/new";
}

export function serviceLabel(serviceType: string): string {
  return (
    SERVICE_OPTIONS.find((s) => s.apiType === serviceType || s.value === serviceType)?.label ||
    serviceType.replace(/_/g, " ")
  );
}

/** Infer master-journey progress from application status / stage. */
export function inferMasterStep(app: {
  status?: string;
  currentStage?: number;
  totalStages?: number;
}): MasterJourneyId {
  const st = (app.status || "").toLowerCase();
  if (st === "completed" || st === "archived") return "after_sales";
  if (st === "cancelled") return "booking";
  if (st === "docs_required") return "documents";
  if (st === "in_progress" || st === "approved") {
    const cur = app.currentStage || 0;
    const tot = app.totalStages || 1;
    if (cur / tot >= 0.7) return "travel";
    if (cur / tot >= 0.4) return "operations";
    return "booking";
  }
  return "booking";
}
