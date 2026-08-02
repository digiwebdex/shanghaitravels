/**
 * Context-aware Create menu ordering and search placeholders (V4.3 IA).
 */
import { QUICK_ACTIONS, type QuickAction } from "./quickActions";

type Ctx = {
  match: (pathname: string) => boolean;
  /** Quick-action ids to pin first (in order). */
  createFirst: string[];
  searchPlaceholder: string;
};

const CONTEXTS: Ctx[] = [
  {
    match: (p) => p === "/" || p === "",
    createFirst: ["qa-booking", "qa-customer", "qa-scan", "qa-invoice", "qa-search-booking", "qa-reports"],
    searchPlaceholder: "Search customers, bookings, passport, visa, invoices…",
  },
  {
    match: (p) => p.startsWith("/crm") || p.startsWith("/sales") || p.startsWith("/comms"),
    createFirst: ["qa-lead", "qa-customer", "qa-booking"],
    searchPlaceholder: "Search leads, opportunities, quotations…",
  },
  {
    match: (p) =>
      p.startsWith("/visa") ||
      p.startsWith("/ticketing") ||
      p.startsWith("/hotels") ||
      p.startsWith("/transport") ||
      p.startsWith("/tours") ||
      p.startsWith("/hajj") ||
      p.startsWith("/products") ||
      p.startsWith("/bookings"),
    createFirst: ["qa-booking", "qa-customer", "qa-scan"],
    searchPlaceholder: "Search bookings, packages, travelers…",
  },
  {
    match: (p) =>
      p.startsWith("/operations/document-intelligence") ||
      p.startsWith("/passports") ||
      p.startsWith("/operations/documents"),
    createFirst: ["qa-scan", "qa-customer", "qa-booking"],
    searchPlaceholder: "Search passport, NID, visa, MRZ, OCR…",
  },
  {
    match: (p) => p.startsWith("/operations") || p === "/case-journey",
    createFirst: ["qa-booking", "qa-scan", "qa-search-booking"],
    searchPlaceholder: "Search operations queues and cases…",
  },
  {
    match: (p) => p.startsWith("/customers") || p.startsWith("/partners"),
    createFirst: ["qa-customer", "qa-supplier", "qa-corporate", "qa-booking"],
    searchPlaceholder: "Search customers, agents, suppliers…",
  },
  {
    match: (p) => p.startsWith("/finance"),
    createFirst: ["qa-invoice", "qa-booking", "qa-customer"],
    searchPlaceholder: "Search invoices, payments, accounts…",
  },
  {
    match: (p) => p.startsWith("/analytics"),
    createFirst: ["qa-reports", "qa-booking", "qa-invoice"],
    searchPlaceholder: "Search reports and dashboards…",
  },
  {
    match: (p) => p.startsWith("/cms") || p.startsWith("/site"),
    createFirst: ["qa-blog", "qa-package"],
    searchPlaceholder: "Search pages, media, website content…",
  },
  {
    match: (p) => p.startsWith("/admin"),
    createFirst: ["qa-user"],
    searchPlaceholder: "Search users and settings…",
  },
];

const DEFAULT_SEARCH = "Search customers, bookings, packages…";

function ctxFor(pathname: string): Ctx | undefined {
  return CONTEXTS.find((c) => c.match(pathname));
}

export function searchPlaceholderForPath(pathname: string): string {
  return ctxFor(pathname)?.searchPlaceholder ?? DEFAULT_SEARCH;
}

/** Permission-filtered Create actions, ordered for the current workspace. */
export function createActionsForPath(
  pathname: string,
  can: (perm: string) => boolean,
): QuickAction[] {
  const allowed = QUICK_ACTIONS.filter((a) => !a.perm || can(a.perm));
  const first = ctxFor(pathname)?.createFirst ?? [];
  const pinned: QuickAction[] = [];
  const rest: QuickAction[] = [];
  for (const id of first) {
    const hit = allowed.find((a) => a.id === id);
    if (hit) pinned.push(hit);
  }
  for (const a of allowed) {
    if (!pinned.some((p) => p.id === a.id)) rest.push(a);
  }
  return [...pinned, ...rest].slice(0, 8);
}

/** Header Create button label — never generic "Create". */
export function createLabelForPath(
  pathname: string,
  can: (perm: string) => boolean,
): string {
  const actions = createActionsForPath(pathname, can);
  const primary = actions[0];
  if (!primary) return "New Booking";
  return primary.label;
}
