/** Environment + module liveness config (Phase 0). */

export const ERP = (import.meta.env.VITE_ERP_BASE as string) || "/api2";

/** Modules that are live (no DemoBadge). Phase A set. */
export const LIVE_MODULES = new Set<string>([
  "customers",
  "passports",
  "visa",
  "case-journey",
  "ticketing",
  "hotels",
  "transport",
  "tours",
  "hajj",
  "finance",
  "crm",
  "sales",
  "comms",
  "analytics",
  "cms",
]);

export const APP_NAME = "TravelOS";
export const ORG_NAME = "Shanghai Travels";
