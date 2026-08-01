/**
 * Context-aware Create menu ordering and search placeholders.
 * Keeps the shell feeling like a product, not a developer console.
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
    createFirst: ["qa-visa", "qa-ticket", "qa-customer", "qa-invoice", "qa-payment"],
    searchPlaceholder: "Search bookings, partners, finance…",
  },
  {
    match: (p) => p.startsWith("/visa"),
    createFirst: ["qa-visa", "qa-customer"],
    searchPlaceholder: "Search visa cases, customers…",
  },
  {
    match: (p) => p.startsWith("/ticketing"),
    createFirst: ["qa-ticket", "qa-customer"],
    searchPlaceholder: "Search tickets, PNRs, customers…",
  },
  {
    match: (p) => p.startsWith("/hotels"),
    createFirst: ["qa-hotel", "qa-customer"],
    searchPlaceholder: "Search hotel bookings…",
  },
  {
    match: (p) => p.startsWith("/transport"),
    createFirst: ["qa-customer"],
    searchPlaceholder: "Search transport bookings…",
  },
  {
    match: (p) => p.startsWith("/tours"),
    createFirst: ["qa-tour", "qa-customer"],
    searchPlaceholder: "Search tour bookings…",
  },
  {
    match: (p) => p.startsWith("/hajj"),
    createFirst: ["qa-customer"],
    searchPlaceholder: "Search Hajj & Umrah cases…",
  },
  {
    match: (p) => p.startsWith("/products"),
    createFirst: ["qa-package"],
    searchPlaceholder: "Search packages and destinations…",
  },
  {
    match: (p) => p.startsWith("/customers") || p.startsWith("/partners"),
    createFirst: ["qa-customer", "qa-corporate"],
    searchPlaceholder: "Search customers, agents, suppliers…",
  },
  {
    match: (p) => p.startsWith("/crm") || p.startsWith("/sales"),
    createFirst: ["qa-customer", "qa-visa"],
    searchPlaceholder: "Search leads, opportunities, quotations…",
  },
  {
    match: (p) => p.startsWith("/finance"),
    createFirst: ["qa-invoice", "qa-payment", "qa-pay-supplier"],
    searchPlaceholder: "Search invoices, payments, accounts…",
  },
  {
    match: (p) => p.startsWith("/operations") || p.startsWith("/passports") || p.startsWith("/case-journey"),
    createFirst: ["qa-visa", "qa-customer"],
    searchPlaceholder: "Search passports, documents, cases…",
  },
  {
    match: (p) => p.startsWith("/comms"),
    createFirst: ["qa-whatsapp", "qa-email"],
    searchPlaceholder: "Search conversations and messages…",
  },
  {
    match: (p) => p.startsWith("/analytics"),
    createFirst: ["qa-invoice", "qa-visa"],
    searchPlaceholder: "Search reports and dashboards…",
  },
  {
    match: (p) => p.startsWith("/cms"),
    createFirst: ["qa-package"],
    searchPlaceholder: "Search pages, media, website content…",
  },
  {
    match: (p) => p.startsWith("/admin"),
    createFirst: ["qa-customer"],
    searchPlaceholder: "Search users and settings…",
  },
];

const DEFAULT_SEARCH = "Search…";

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
  // Cap the header menu so it stays scannable.
  return [...pinned, ...rest].slice(0, 8);
}

/** Header Create button label — primary action for the current workspace. */
export function createLabelForPath(
  pathname: string,
  can: (perm: string) => boolean,
): string {
  const actions = createActionsForPath(pathname, can);
  const primary = actions[0];
  if (!primary) return "Create";
  // Prefer a short verb for the button; full labels stay in the menu.
  if (primary.label.startsWith("New ")) return primary.label;
  if (primary.label.startsWith("Create ")) return primary.label;
  return primary.label;
}
