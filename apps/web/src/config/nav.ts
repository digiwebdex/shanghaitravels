/**
 * TravelOS V4.3 — workflow-driven information architecture.
 *
 * Sidebar follows how a travel agency works (acquire → book → documents →
 * operate → partners → finance → report), not feature folders.
 * Unfinished admin screens are omitted (no placeholder menus).
 */
import {
  BarChart3,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  Car,
  ClipboardList,
  CreditCard,
  FileCheck,
  FileText,
  Files,
  Globe,
  Handshake,
  Hotel,
  Image as ImageIcon,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Map,
  MessagesSquare,
  Moon,
  Package,
  PieChart,
  Plane,
  Quote,
  Receipt,
  Route,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  Bell,
  UserCog,
  Zap,
  UserRound,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type NavLeaf = {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  /** Permission the destination API enforces. Omit for always-visible links. */
  perm?: string;
  /** Exact-match active state, for parent paths like `/finance`. */
  end?: boolean;
  /** Extra words the command palette should match on. */
  keywords?: string;
};

export type NavSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Set for single-link sections such as the dashboard. */
  to?: string;
  end?: boolean;
  items?: NavLeaf[];
};

/** Supplier taxonomy. `type` is the value stored on Supplier.type. */
export const SUPPLIER_TYPES = [
  { type: "airline", label: "Airlines", icon: Plane },
  { type: "hotel", label: "Hotel Vendors", icon: Hotel },
  { type: "embassy", label: "Embassies", icon: FileCheck },
  { type: "visa", label: "Visa Partners", icon: FileCheck },
  { type: "tour", label: "Tour Operators", icon: Map },
  { type: "transport", label: "Transport Vendors", icon: Car },
  { type: "insurance", label: "Insurance Partners", icon: Briefcase },
  { type: "courier", label: "Courier Partners", icon: Truck },
  { type: "other", label: "Other Suppliers", icon: Briefcase },
] as const;

export type SupplierType = (typeof SUPPLIER_TYPES)[number]["type"];

export function supplierTypeLabel(type: string): string {
  return SUPPLIER_TYPES.find((t) => t.type === type)?.label ?? "Suppliers";
}

export const NAV: NavSection[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/", end: true },

  {
    id: "crm",
    label: "CRM & Sales",
    icon: Target,
    items: [
      { id: "crm-dashboard", label: "Dashboard", to: "/crm/directory", icon: LayoutDashboard, perm: "crm:read", keywords: "crm home acquire" },
      { id: "crm-leads", label: "Leads", to: "/crm", icon: Sparkles, perm: "crm:read", end: true },
      { id: "customers", label: "Customers", to: "/customers", icon: Users, perm: "customer:read", keywords: "client passenger customer 360" },
      { id: "crm-opps", label: "Opportunities", to: "/crm/opportunities", icon: TrendingUp, perm: "crm:read" },
      { id: "sales-pipeline", label: "Pipeline", to: "/sales", icon: BarChart3, perm: "opportunity:read", end: true },
      { id: "sales-quotes", label: "Quotations", to: "/sales/quotations", icon: Quote, perm: "quote:read" },
      { id: "sales-tasks", label: "Tasks", to: "/sales/tasks", icon: ListChecks, perm: "task:read" },
      { id: "comms", label: "Communications", to: "/comms", icon: MessagesSquare, perm: "comms:read" },
    ],
  },

  {
    id: "bookings",
    label: "Bookings",
    icon: ClipboardList,
    items: [
      { id: "bookings-all", label: "All Bookings", to: "/operations", icon: ClipboardList, perm: "application:read", end: true },
      { id: "booking-wizard", label: "New Booking", to: "/bookings/new", icon: Sparkles, perm: "application:create" },
      // Operations is the work queue; its per-service filters live ON the page,
      // so they are no longer duplicated as menu entries.
      { id: "ops-queue", label: "Operations", to: "/operations", icon: Workflow, perm: "application:read", keywords: "queue today pending workload" },
      { id: "ops-timeline", label: "Workflow Timeline", to: "/case-journey", icon: Route, perm: "application:read" },
    ],
  },

  {
    id: "services",
    label: "Services",
    icon: Globe,
    items: [
      { id: "visa", label: "Visa", to: "/visa", icon: FileCheck, perm: "application:read" },
      { id: "ticketing", label: "Air Ticketing", to: "/ticketing", icon: Plane, perm: "application:read" },
      { id: "hotels", label: "Hotel", to: "/hotels", icon: Hotel, perm: "application:read" },
      { id: "transport", label: "Transport", to: "/transport", icon: Car, perm: "application:read" },
      { id: "tours", label: "Tour Packages", to: "/tours", icon: Map, perm: "application:read" },
      { id: "hajj", label: "Hajj & Umrah", to: "/hajj", icon: Moon, perm: "application:read" },
      { id: "students", label: "Student Consultancy", to: "/students", icon: BookOpen, perm: "application:read", keywords: "student university admission study abroad" },
      { id: "manpower", label: "Manpower", to: "/manpower", icon: Briefcase, perm: "application:read", keywords: "work overseas employment bmet recruitment" },
      { id: "package-mgmt", label: "Package Catalogue", to: "/products/packages", icon: Package, perm: "application:read" },
    ],
  },

  {
    id: "doc-intel",
    label: "Documents & OCR",
    icon: Brain,
    items: [
      { id: "di-dashboard", label: "Dashboard", to: "/operations/document-intelligence", icon: LayoutDashboard, perm: "ocr:use", end: true },
      { id: "di-passport", label: "Passport OCR", to: "/passports", icon: FileCheck, perm: "customer:read" },
      // One scanner handles passport / NID / visa / ticket, so it is one entry
      // instead of four links to the same screen.
      { id: "di-scan", label: "Scan Document", to: "/operations/document-intelligence?tab=scan", icon: Files, perm: "ocr:use", keywords: "nid visa ticket scan ocr national id" },
      { id: "di-queue", label: "Verification Queue", to: "/operations/document-intelligence?tab=queue", icon: ListChecks, perm: "ocr:use" },
      { id: "di-other", label: "Documents", to: "/operations/documents", icon: FileText, perm: "document:read-passport" },
    ],
  },

  {
    id: "partners",
    label: "Business Partners",
    icon: Handshake,
    items: [
      { id: "agents", label: "Agents", to: "/partners/agents", icon: UserRound, perm: "commission:read", keywords: "b2b agent wallet commission" },
      { id: "corporate", label: "Corporate Clients", to: "/partners/corporate", icon: Building2, perm: "customer:read" },
      { id: "suppliers", label: "Suppliers", to: "/partners/suppliers", icon: Truck, perm: "supplier:read", keywords: "vendor airline hotel embassy payable" },
    ],
  },

  {
    id: "finance",
    label: "Finance",
    icon: Landmark,
    items: [
      { id: "fin-dashboard", label: "Dashboard", to: "/finance/dashboard", icon: LayoutDashboard, perm: "financial-report:read", end: true },
      { id: "fin-invoices", label: "Invoices", to: "/finance/invoices", icon: Receipt, perm: "invoice:amount:read" },
      { id: "fin-collections", label: "Collections", to: "/finance/ar", icon: TrendingUp, perm: "ar:read", keywords: "receivable ar due outstanding" },
      { id: "fin-customer-payments", label: "Customer Payments", to: "/finance/payments", icon: CreditCard, perm: "ar:read", keywords: "receive account cash bank bkash nagad" },
      { id: "fin-supplier-payables", label: "Supplier Payables", to: "/finance/ap", icon: Truck, perm: "ap:read", keywords: "supplier due ap vendor payment" },
      { id: "fin-commission", label: "Agent Commission", to: "/finance/commission-rules", icon: Wallet, perm: "commission:read", keywords: "commission rule agent wallet payout" },
      { id: "fin-expenses", label: "Expenses", to: "/finance/expenses", icon: FileText, perm: "expense:manage" },
      { id: "fin-accounts", label: "Accounting", to: "/finance/accounting", icon: Landmark, perm: "gl:read" },
      { id: "fin-reports", label: "Reports", to: "/finance/reports", icon: PieChart, perm: "financial-report:read" },
    ],
  },

  {
    id: "analytics",
    label: "Reports & Analytics",
    icon: PieChart,
    items: [
      { id: "an-dashboard", label: "Dashboard", to: "/analytics", icon: LayoutDashboard, perm: "analytics:read", end: true },
      { id: "an-bookings", label: "Booking Reports", to: "/analytics/sales", icon: ClipboardList, perm: "analytics:read" },
      // One service-report screen; it was previously listed twice.
      { id: "an-service", label: "Service Reports", to: "/analytics/reports", icon: Globe, perm: "analytics:read", keywords: "visa ticket hotel transport tour hajj student manpower report" },
      // Shanghai Travels Owner Requirement — Delivery Report.
      { id: "an-delivery", label: "Delivery Report", to: "/analytics/delivery", icon: ClipboardList, perm: "report:read", keywords: "passport submit delivery embassy handover register" },
      { id: "an-finance", label: "Finance Reports", to: "/analytics/finance", icon: Landmark, perm: "analytics:read" },
      { id: "an-customers", label: "Customer Reports", to: "/analytics/customers", icon: Users, perm: "analytics:read" },
      { id: "an-supplier", label: "Supplier Reports", to: "/finance/ar-ap-reports", icon: Truck, perm: "financial-report:read" },
      { id: "an-crm", label: "CRM Reports", to: "/crm/reports", icon: Target, perm: "crm:read" },
      { id: "an-sales", label: "Sales Reports", to: "/sales/reports", icon: BarChart3, perm: "opportunity:read" },
      { id: "fin-commercial-reports", label: "Commercial Reports", to: "/finance/commercial-reports", icon: FileText, perm: "financial-report:read" },
    ],
  },

  {
    id: "cms",
    label: "Website CMS",
    icon: Globe,
    items: [
      { id: "cms-dashboard", label: "Dashboard", to: "/cms", icon: LayoutDashboard, perm: "cms:read", end: true },
      { id: "cms-home", label: "Homepage", to: "/cms/setup", icon: LayoutDashboard, perm: "cms:read" },
      { id: "cms-banners", label: "Hero Banner", to: "/cms/banners", icon: ImageIcon, perm: "cms:read" },
      { id: "cms-packages", label: "Packages", to: "/cms/packages", icon: Package, perm: "cms:read" },
      { id: "cms-destinations", label: "Destinations", to: "/cms/destinations", icon: Map, perm: "cms:read" },
      { id: "cms-blog", label: "Blog", to: "/cms/content/blog", icon: FileText, perm: "cms:read" },
      { id: "cms-faq", label: "FAQ", to: "/cms/content/faq", icon: FileText, perm: "cms:read" },
      { id: "cms-testimonials", label: "Testimonials", to: "/cms/content/testimonials", icon: Quote, perm: "cms:read" },
      { id: "cms-forms", label: "Forms", to: "/cms/forms", icon: Files, perm: "cms:read" },
      { id: "cms-seo", label: "SEO", to: "/cms/seo", icon: Globe, perm: "cms:read" },
      { id: "cms-library", label: "Content Library", to: "/cms/media", icon: ImageIcon, perm: "cms:read" },
    ],
  },

  {
    id: "administration",
    label: "Settings",
    icon: Settings,
    items: [
      { id: "adm-users", label: "Users", to: "/admin/users", icon: UserCog, perm: "user:manage" },
      { id: "adm-roles", label: "Roles & Permissions", to: "/admin/roles", icon: UserCog, perm: "role:manage" },
      { id: "adm-workflow", label: "Workflow", to: "/operations/workflow", icon: Workflow, perm: "application:read", keywords: "stages template process" },
      { id: "adm-automation", label: "Automation", to: "/admin/automation", icon: Zap, perm: "settings:manage" },
      { id: "adm-notifications", label: "Notifications", to: "/admin/notifications", icon: Bell, perm: "communication:manage" },
      { id: "adm-settings", label: "System Settings", to: "/admin/settings", icon: Settings, perm: "settings:manage", keywords: "company setup branch organization" },
    ],
  },

  // V17 — guidance. No `perm`: every signed-in user may read the guide, and the
  // articles themselves hide any action their role cannot perform.
  {
    id: "help",
    label: "Help & Guide",
    icon: LifeBuoy,
    items: [
      { id: "help-center", label: "ERP Assistant", to: "/help", icon: LifeBuoy, end: true, keywords: "help guide assistant how to support documentation faq" },
      { id: "help-flow", label: "Master Workflow", to: "/help/flow/master-journey", icon: Workflow, keywords: "flow flowchart journey lifecycle lead to completion process map" },
    ],
  },
];

/** Flattened leaves, for the command palette and breadcrumbs. */
export const NAV_LEAVES: (NavLeaf & { section: string })[] = NAV.flatMap((s) =>
  s.items
    ? s.items.map((i) => ({ ...i, section: s.label }))
    : [{ id: s.id, label: s.label, to: s.to!, icon: s.icon, end: s.end, section: "" }],
);

/** Strip query/hash for path matching. */
function pathOnly(to: string): string {
  return to.split("?")[0] || to;
}

/** The section a pathname belongs to — used to auto-expand the sidebar. */
export function sectionForPath(pathname: string): string | null {
  let best: { id: string; len: number } | null = null;
  for (const section of NAV) {
    if (section.to && (pathname === section.to || (section.end && pathname === section.to))) {
      return section.id;
    }
    for (const item of section.items ?? []) {
      const base = pathOnly(item.to);
      if (
        (pathname === base || pathname.startsWith(`${base}/`)) &&
        (!best || base.length > best.len)
      ) {
        best = { id: section.id, len: base.length };
      }
    }
  }
  // Domain fallbacks when multiple sections share a path prefix
  if (pathname.startsWith("/operations/document-intelligence") || pathname.startsWith("/passports")) {
    return "doc-intel";
  }
  if (pathname.startsWith("/operations") || pathname === "/case-journey") {
    return "operations";
  }
  if (pathname.startsWith("/crm") || pathname.startsWith("/sales") || pathname.startsWith("/comms")) {
    return "crm";
  }
  if (
    pathname.startsWith("/visa") ||
    pathname.startsWith("/ticketing") ||
    pathname.startsWith("/hotels") ||
    pathname.startsWith("/tours") ||
    pathname.startsWith("/transport") ||
    pathname.startsWith("/hajj") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/bookings")
  ) {
    return "bookings";
  }
  if (pathname.startsWith("/finance")) return "finance";
  if (pathname.startsWith("/analytics")) return "analytics";
  if (pathname.startsWith("/cms") || pathname.startsWith("/site")) return "cms";
  if (pathname.startsWith("/admin")) return "administration";
  if (pathname.startsWith("/customers") || pathname.startsWith("/partners")) return "partners";
  return best?.id ?? null;
}

/** Best matching nav leaf for breadcrumbs / create context. */
export function leafForPath(pathname: string): (NavLeaf & { section: string }) | null {
  let best: (NavLeaf & { section: string; len: number }) | null = null;
  for (const leaf of NAV_LEAVES) {
    const base = pathOnly(leaf.to);
    if (pathname === base || pathname.startsWith(`${base}/`)) {
      if (!best || base.length > best.len) {
        best = { ...leaf, len: base.length };
      }
    }
  }
  return best;
}

/**
 * Dashboard › Module › Submodule › Current
 * Merges nav hierarchy with page-provided trail (deduped by label).
 */
export function buildNavBreadcrumb(
  pathname: string,
  trail?: { label: string; to?: string }[],
): { label: string; to?: string }[] {
  const crumbs: { label: string; to?: string }[] = [{ label: "Dashboard", to: "/" }];
  if (pathname === "/" || pathname === "") return crumbs;

  const sectionId = sectionForPath(pathname);
  const section = NAV.find((s) => s.id === sectionId);
  if (section && section.id !== "dashboard") {
    const sectionTo = section.to || section.items?.[0]?.to;
    crumbs.push({ label: section.label, to: sectionTo ? pathOnly(sectionTo) : undefined });
  }

  const leaf = leafForPath(pathname);
  if (leaf && leaf.label !== section?.label) {
    const leafBase = pathOnly(leaf.to);
    if (!crumbs.some((c) => c.label === leaf.label)) {
      crumbs.push({ label: leaf.label, to: leafBase });
    }
  }

  for (const t of trail || []) {
    if (!t.label) continue;
    if (crumbs.some((c) => c.label === t.label)) continue;
    crumbs.push(t);
  }

  // Last crumb is current page — drop link when same as previous
  if (crumbs.length > 1) {
    const last = crumbs[crumbs.length - 1];
    crumbs[crumbs.length - 1] = { label: last.label };
  }
  return crumbs;
}
