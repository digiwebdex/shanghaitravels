/**
 * Dynamic service-detail field specs for the guided booking journey.
 *
 * Every field below maps 1:1 onto a column that already exists on the
 * corresponding *Detail model, and is written through the EXISTING endpoint
 * `PUT /applications/:id/detail/:serviceType`. No new table, no new column, and
 * no second service registry — this file only decides which of the existing
 * fields to SHOW once a service is chosen, so the user never faces one giant
 * form containing every service's fields.
 */

export type FieldKind = "text" | "number" | "date" | "datetime" | "select" | "textarea";

export type ServiceField = {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  /** Half-width on wide screens (default). Set false for full-width. */
  half?: boolean;
};

/**
 * Keyed by the API serviceType (NOT a UI alias): manpower is stored as "work",
 * and hajj/umrah are distinct service types sharing one detail model.
 */
export const SERVICE_FIELDS: Record<string, ServiceField[]> = {
  visa: [
    { name: "visaType", label: "Visa type", kind: "text", required: true, placeholder: "Tourist / Business / Student" },
    { name: "destination", label: "Destination country", kind: "text", required: true },
    { name: "embassy", label: "Embassy / centre", kind: "text" },
    { name: "entryType", label: "Entry type", kind: "select", options: ["single", "multiple", "transit"] },
    { name: "durationDays", label: "Duration (days)", kind: "number" },
    { name: "applicationNo", label: "Application no.", kind: "text" },
    { name: "appointmentAt", label: "Appointment", kind: "datetime" },
    { name: "notes", label: "Notes", kind: "textarea", half: false },
  ],
  air_ticket: [
    { name: "tripType", label: "Trip type", kind: "select", options: ["one_way", "round_trip", "multi_city"], required: true },
    { name: "airline", label: "Airline", kind: "text", required: true },
    { name: "flightNo", label: "Flight no.", kind: "text" },
    { name: "origin", label: "Origin", kind: "text", required: true },
    { name: "destination", label: "Destination", kind: "text", required: true },
    { name: "departAt", label: "Departure", kind: "datetime" },
    { name: "returnAt", label: "Return", kind: "datetime" },
    { name: "cabinClass", label: "Cabin class", kind: "select", options: ["economy", "premium_economy", "business", "first"] },
    { name: "passengerName", label: "Passenger name", kind: "text", placeholder: "Exactly as in the passport" },
    { name: "ticketNo", label: "Ticket no.", kind: "text" },
    { name: "pnr", label: "PNR", kind: "text" },
    { name: "notes", label: "Notes", kind: "textarea", half: false },
  ],
  hotel: [
    { name: "hotelName", label: "Hotel", kind: "text", required: true },
    { name: "country", label: "Country", kind: "text" },
    { name: "city", label: "City", kind: "text" },
    { name: "checkIn", label: "Check-in", kind: "date", required: true },
    { name: "checkOut", label: "Check-out", kind: "date", required: true },
    { name: "nights", label: "Nights", kind: "number" },
    { name: "roomType", label: "Room type", kind: "text" },
    { name: "mealPlan", label: "Meal plan", kind: "select", options: ["room_only", "bed_breakfast", "half_board", "full_board", "all_inclusive"] },
    { name: "rooms", label: "Rooms", kind: "number" },
    { name: "guests", label: "Guests", kind: "number" },
    { name: "confirmationNo", label: "Confirmation no.", kind: "text" },
    { name: "notes", label: "Notes", kind: "textarea", half: false },
  ],
  transport: [
    { name: "serviceKind", label: "Service kind", kind: "select", options: ["airport_transfer", "intercity", "hourly", "tour_transport"], required: true },
    { name: "vehicleType", label: "Vehicle type", kind: "text", required: true },
    { name: "routeName", label: "Route", kind: "text" },
    { name: "pickupLocation", label: "Pickup location", kind: "text", required: true },
    { name: "dropLocation", label: "Drop location", kind: "text", required: true },
    { name: "scheduledAt", label: "Scheduled at", kind: "datetime" },
    { name: "passengers", label: "Passengers", kind: "number" },
    { name: "driverName", label: "Driver", kind: "text" },
    { name: "vehicleNo", label: "Vehicle no.", kind: "text" },
    { name: "confirmationNo", label: "Confirmation no.", kind: "text" },
    { name: "notes", label: "Notes", kind: "textarea", half: false },
  ],
  tour: [
    { name: "packageName", label: "Package", kind: "text", required: true },
    { name: "destination", label: "Destination", kind: "text", required: true },
    { name: "packageType", label: "Package type", kind: "text" },
    { name: "category", label: "Category", kind: "text" },
    { name: "startDate", label: "Start date", kind: "date" },
    { name: "endDate", label: "End date", kind: "date" },
    { name: "pax", label: "Travellers (pax)", kind: "number" },
    { name: "confirmationNo", label: "Confirmation no.", kind: "text" },
    { name: "inclusions", label: "Inclusions", kind: "textarea", half: false },
    { name: "exclusions", label: "Exclusions", kind: "textarea", half: false },
    { name: "itinerary", label: "Itinerary", kind: "textarea", half: false },
    { name: "notes", label: "Notes", kind: "textarea", half: false },
  ],
  // hajj and umrah are separate serviceTypes sharing HajjUmrahDetail.
  hajj: hajjFields(),
  umrah: hajjFields(),
  student: [
    { name: "institution", label: "University / institution", kind: "text", required: true },
    { name: "country", label: "Country", kind: "text", required: true },
    { name: "courseName", label: "Course", kind: "text" },
    { name: "degreeLevel", label: "Degree level", kind: "select", options: ["foundation", "diploma", "bachelor", "master", "phd"] },
    { name: "intakeTerm", label: "Intake term", kind: "text", placeholder: "e.g. Spring 2027" },
    { name: "applicationRef", label: "Application ref.", kind: "text" },
    { name: "notes", label: "Notes", kind: "textarea", half: false },
  ],
  // Manpower is stored as serviceType "work".
  work: [
    { name: "employerName", label: "Employer", kind: "text", required: true },
    { name: "jobTitle", label: "Job title", kind: "text", required: true },
    { name: "country", label: "Country", kind: "text", required: true },
    { name: "visaType", label: "Visa / permit type", kind: "text" },
    { name: "workPermitNo", label: "Work permit no.", kind: "text" },
    { name: "contractMonths", label: "Contract (months)", kind: "number" },
    { name: "departureDate", label: "Departure date", kind: "date" },
    { name: "medicalStatus", label: "Medical status", kind: "select", options: ["pending", "fit", "unfit", "retest"] },
    { name: "bmetClearance", label: "BMET clearance", kind: "select", options: ["pending", "submitted", "cleared", "rejected"] },
    { name: "agencyRef", label: "Agency ref.", kind: "text" },
    { name: "notes", label: "Notes", kind: "textarea", half: false },
  ],
};

/** Hajj & Umrah — the primary vertical. Muallim is deliberately NOT included. */
function hajjFields(): ServiceField[] {
  return [
    { name: "packageName", label: "Package", kind: "text", required: true },
    { name: "packageType", label: "Package type", kind: "text" },
    { name: "packageCategory", label: "Category", kind: "text" },
    { name: "year", label: "Season / year", kind: "text" },
    { name: "pilgrimName", label: "Pilgrim name", kind: "text", required: true },
    { name: "passportNo", label: "Passport no.", kind: "text" },
    { name: "groupCode", label: "Group code", kind: "text" },
    { name: "groupName", label: "Group name", kind: "text" },
    { name: "leaderName", label: "Group leader", kind: "text" },
    { name: "mahramName", label: "Mahram", kind: "text" },
    { name: "mahramRelation", label: "Mahram relation", kind: "text" },
    { name: "hotelMakkah", label: "Makkah hotel", kind: "text" },
    { name: "hotelMadinah", label: "Madinah hotel", kind: "text" },
    { name: "roomType", label: "Room type", kind: "text" },
    { name: "roomAllocation", label: "Room allocation", kind: "text" },
    { name: "departureDate", label: "Departure", kind: "date" },
    { name: "returnDate", label: "Return", kind: "date" },
    { name: "airline", label: "Airline", kind: "text" },
    { name: "flightNo", label: "Flight no.", kind: "text" },
    { name: "visaStatus", label: "Visa status", kind: "text" },
    { name: "passportStatus", label: "Passport status", kind: "text" },
    { name: "transportNote", label: "Transport", kind: "textarea", half: false },
    { name: "inclusions", label: "Inclusions", kind: "textarea", half: false },
    { name: "exclusions", label: "Exclusions", kind: "textarea", half: false },
    { name: "notes", label: "Notes", kind: "textarea", half: false },
  ];
}

/** Fields the API stores as numbers rather than strings. */
export const NUMERIC_FIELDS = new Set([
  "durationDays", "nights", "rooms", "guests", "passengers", "pax", "contractMonths",
]);

/** Fields the API stores as dates. */
export const DATE_FIELDS = new Set([
  "appointmentAt", "departAt", "returnAt", "checkIn", "checkOut", "scheduledAt",
  "startDate", "endDate", "departureDate", "returnDate",
]);

export function fieldsFor(serviceType: string): ServiceField[] {
  return SERVICE_FIELDS[serviceType] || [];
}

/** Builds the detail payload, dropping blanks and coercing types. */
export function buildDetailPayload(serviceType: string, values: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fieldsFor(serviceType)) {
    const raw = (values[f.name] ?? "").trim();
    if (!raw) continue;
    if (NUMERIC_FIELDS.has(f.name)) {
      const n = Number(raw);
      if (Number.isFinite(n)) out[f.name] = n;
      continue;
    }
    out[f.name] = raw;
  }
  return out;
}

export function missingRequired(serviceType: string, values: Record<string, string>): string[] {
  return fieldsFor(serviceType)
    .filter((f) => f.required && !(values[f.name] ?? "").trim())
    .map((f) => f.label);
}
