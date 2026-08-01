/** Environment + module liveness config (Phase 0). */

export const ERP = (import.meta.env.VITE_ERP_BASE as string) || "/api2";

/** Modules considered live for Phase A rollout tracking. */
export const LIVE_MODULES = new Set<string>([
  "customers",
  "passports",
  "visa",
  "case-journey",
  "ticketing",
  "hotels",
  "transport",
  "tours",
  "products",
  "hajj",
  "finance",
  "crm",
  "sales",
  "comms",
  "analytics",
  "cms",
  "agents",
  "corporate",
  "suppliers",
  "partners",
  "operations",
  "administration",
]);

export const APP_NAME = "TravelOS";
export const ORG_NAME = "Shanghai Travels";
