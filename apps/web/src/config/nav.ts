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
  CalendarDays,
  Car,
  ClipboardList,
  CreditCard,
  FileCheck,
  FileText,
  Files,
  Globe,
  GraduationCap,
  Handshake,
  Hotel,
  Image as ImageIcon,
  Landmark,
  LayoutDashboard,
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
      {
        id: "crm-dashboard",
        label: "Dashboard",
        to: "/crm/directory",
        icon: LayoutDashboard,
        perm: "crm:read",
        keywords: "crm home acquire",
      },
      { id: "crm-leads", label: "Leads", to: "/crm", icon: Sparkles, perm: "crm:read", end: true },
      {
        id: "crm-opps",
        label: "Opportunities",
        to: "/crm/opportunities",
        icon: TrendingUp,
        perm: "crm:read",
      },
      {
        id: "sales-pipeline",
        label: "Pipeline",
        to: "/sales",
        icon: BarChart3,
        perm: "opportunity:read",
        end: true,
      },
      { id: "sales-quotes", label: "Quotations", to: "/sales/quotations", icon: Quote, perm: "quote:read" },
      { id: "sales-tasks", label: "Tasks", to: "/sales/tasks", icon: ListChecks, perm: "task:read" },
      { id: "comms", label: "Communications", to: "/comms", icon: MessagesSquare, perm: "comms:read" },
    ],
  },

  {
    id: "bookings",
    label: "Bookings",
    icon: Briefcase,
    items: [
      {
        id: "bookings-all",
        label: "All Bookings",
        to: "/operations",
        icon: ClipboardList,
        perm: "application:read",
        end: true,
        keywords: "queue applications cases",
      },
      {
        id: "booking-wizard",
        label: "New Booking",
        to: "/bookings/new",
        icon: Sparkles,
        perm: "application:create",
        keywords: "unified wizard create booking",
      },
      { id: "visa", label: "Visa Services", to: "/visa", icon: FileCheck, perm: "application:read" },
      { id: "ticketing", label: "Air Ticketing", to: "/ticketing", icon: Plane, perm: "application:read" },
      { id: "hotels", label: "Hotel Booking", to: "/hotels", icon: Hotel, perm: "application:read" },
      { id: "tours", label: "Tour Packages", to: "/tours", icon: Map, perm: "application:read" },
      { id: "transport", label: "Transport", to: "/transport", icon: Car, perm: "application:read" },
      { id: "hajj", label: "Hajj & Umrah", to: "/hajj", icon: Moon, perm: "application:read" },
      {
        id: "student",
        label: "Student Consultancy",
        to: "/bookings/new?service=student",
        icon: GraduationCap,
        perm: "application:create",
        keywords: "education consultancy visa",
      },
      {
        id: "manpower",
        label: "Manpower & Overseas Employment",
        to: "/bookings/new?service=manpower",
        icon: Users,
        perm: "application:create",
        keywords: "overseas employment recruitment",
      },
      {
        id: "package-mgmt",
        label: "Package Management",
        to: "/products/packages",
        icon: Package,
        perm: "application:read",
        keywords: "catalog products package engine",
      },
    ],
  },

  {
    id: "doc-intel",
    label: "Document Intelligence",
    icon: Brain,
    items: [
      {
        id: "di-dashboard",
        label: "Dashboard",
        to: "/operations/document-intelligence",
        icon: LayoutDashboard,
        perm: "ocr:use",
        end: true,
      },
      {
        id: "di-passport",
        label: "Passport OCR",
        to: "/passports",
        icon: BookOpen,
        perm: "customer:read",
        keywords: "mrz scan passport",
      },
      {
        id: "di-nid",
        label: "NID OCR",
        to: "/operations/document-intelligence?tab=scan",
        icon: FileCheck,
        perm: "ocr:use",
        keywords: "national id bangladesh",
      },
      {
        id: "di-visa",
        label: "Visa OCR",
        to: "/operations/document-intelligence?tab=scan",
        icon: FileText,
        perm: "ocr:use",
      },
      {
        id: "di-ticket",
        label: "Ticket OCR",
        to: "/operations/document-intelligence?tab=scan",
        icon: Plane,
        perm: "ocr:use",
        keywords: "air ticket pnr",
      },
      {
        id: "di-other",
        label: "Other Documents",
        to: "/operations/documents",
        icon: Files,
        perm: "document:read-passport",
      },
      {
        id: "di-queue",
        label: "Verification Queue",
        to: "/operations/document-intelligence?tab=queue",
        icon: ListChecks,
        perm: "ocr:use",
        keywords: "failed review verify",
      },
    ],
  },

  {
    id: "operations",
    label: "Operations",
    icon: Workflow,
    items: [
      {
        id: "ops-dashboard",
        label: "Dashboard",
        to: "/operations",
        icon: LayoutDashboard,
        perm: "application:read",
        end: true,
      },
      {
        id: "ops-today",
        label: "Today's Tasks",
        to: "/operations?tab=today",
        icon: CalendarDays,
        perm: "application:read",
      },
      {
        id: "ops-visa",
        label: "Visa Processing",
        to: "/operations?tab=visa",
        icon: FileCheck,
        perm: "application:read",
      },
      {
        id: "ops-ticket",
        label: "Ticket Queue",
        to: "/operations?tab=ticket",
        icon: Plane,
        perm: "application:read",
      },
      {
        id: "ops-hotel",
        label: "Hotel Reservations",
        to: "/operations?tab=hotel",
        icon: Hotel,
        perm: "application:read",
      },
      {
        id: "ops-transport",
        label: "Transport Queue",
        to: "/operations?tab=transport",
        icon: Car,
        perm: "application:read",
      },
      {
        id: "ops-tour",
        label: "Tour Operations",
        to: "/tours",
        icon: Map,
        perm: "application:read",
      },
      {
        id: "ops-hajj",
        label: "Hajj Operations",
        to: "/operations?tab=hajj",
        icon: Moon,
        perm: "application:read",
      },
      {
        id: "ops-timeline",
        label: "Workflow Timeline",
        to: "/case-journey",
        icon: Route,
        perm: "application:read",
      },
    ],
  },

  {
    id: "partners",
    label: "Business Partners",
    icon: Users,
    items: [
      { id: "customers", label: "Customers", to: "/customers", icon: UserRound, perm: "customer:read" },
      { id: "agents", label: "Agents", to: "/partners/agents", icon: Handshake, perm: "commission:read" },
      {
        id: "corporate",
        label: "Corporate Clients",
        to: "/partners/corporate",
        icon: Building2,
        perm: "customer:read",
      },
      {
        id: "suppliers",
        label: "Suppliers",
        to: "/partners/suppliers",
        icon: Truck,
        perm: "supplier:read",
        end: true,
        keywords: "vendor airline hotel",
      },
    ],
  },

  {
    id: "finance",
    label: "Finance",
    icon: Landmark,
    items: [
      {
        id: "fin-dashboard",
        label: "Dashboard",
        to: "/finance/dashboard",
        icon: LayoutDashboard,
        perm: "financial-report:read",
      },
      {
        id: "fin-invoices",
        label: "Invoices",
        to: "/finance/invoices",
        icon: Receipt,
        perm: "invoice:amount:read",
      },
      {
        id: "fin-commercial-reports",
        label: "Commercial Reports",
        to: "/finance/commercial-reports",
        icon: Receipt,
        perm: "financial-report:read",
      },
      {
        id: "fin-commission-rules",
        label: "Commission Rules",
        to: "/finance/commission-rules",
        icon: Receipt,
        perm: "commission:read",
      },
      {
        id: "fin-collections",
        label: "Collections",
        to: "/finance/ar",
        icon: TrendingUp,
        perm: "ar:read",
        end: true,
        keywords: "receivables outstanding",
      },
      {
        id: "fin-customer-payments",
        label: "Customer Payments",
        to: "/finance/payments",
        icon: CreditCard,
        perm: "ar:read",
      },
      {
        id: "fin-supplier-payments",
        label: "Supplier Payments",
        to: "/finance/ap",
        icon: Truck,
        perm: "ap:read",
        end: true,
        keywords: "payables ap",
      },
      { id: "fin-expenses", label: "Expenses", to: "/finance/expenses", icon: Wallet, perm: "expense:manage" },
      {
        id: "fin-accounts",
        label: "Accounts",
        to: "/finance/accounting",
        icon: BookOpen,
        perm: "gl:read",
        keywords: "ledger cash bank gl",
      },
      {
        id: "fin-reports",
        label: "Reports",
        to: "/finance/reports",
        icon: PieChart,
        perm: "financial-report:read",
      },
    ],
  },

  {
    id: "analytics",
    label: "Reports & Analytics",
    icon: PieChart,
    items: [
      {
        id: "an-dashboard",
        label: "Dashboard",
        to: "/analytics",
        icon: LayoutDashboard,
        perm: "analytics:read",
        end: true,
      },
      {
        id: "an-crm",
        label: "CRM Reports",
        to: "/crm/reports",
        icon: Target,
        perm: "crm:read",
      },
      {
        id: "an-sales",
        label: "Sales Reports",
        to: "/sales/reports",
        icon: TrendingUp,
        perm: "opportunity:read",
      },
      {
        id: "an-bookings",
        label: "Booking Reports",
        to: "/analytics/sales",
        icon: Briefcase,
        perm: "analytics:read",
      },
      {
        id: "an-visa",
        label: "Visa Reports",
        to: "/analytics/reports",
        icon: FileCheck,
        perm: "analytics:read",
        keywords: "visa export",
      },
      {
        id: "an-ticket",
        label: "Ticket Reports",
        to: "/analytics/reports",
        icon: Plane,
        perm: "analytics:read",
      },
      {
        id: "an-finance",
        label: "Finance Reports",
        to: "/analytics/finance",
        icon: Landmark,
        perm: "analytics:read",
      },
      {
        id: "an-supplier",
        label: "Supplier Reports",
        to: "/finance/ar-ap-reports",
        icon: Truck,
        perm: "financial-report:read",
      },
      {
        id: "an-customers",
        label: "Customer Reports",
        to: "/analytics/customers",
        icon: UserRound,
        perm: "analytics:read",
      },
    ],
  },

  {
    id: "cms",
    label: "Website CMS",
    icon: Globe,
    items: [
      { id: "cms-dashboard", label: "Dashboard", to: "/cms", icon: LayoutDashboard, perm: "cms:read", end: true },
      { id: "cms-home", label: "Homepage", to: "/cms/setup", icon: Globe, perm: "cms:read" },
      { id: "cms-banners", label: "Hero Banner", to: "/cms/banners", icon: ImageIcon, perm: "cms:read" },
      { id: "cms-packages", label: "Packages", to: "/cms/packages", icon: Package, perm: "cms:read" },
      { id: "cms-destinations", label: "Destinations", to: "/cms/destinations", icon: Map, perm: "cms:read" },
      {
        id: "cms-blog",
        label: "Blog",
        to: "/cms/content/blog",
        icon: FileText,
        perm: "cms:read",
      },
      {
        id: "cms-faq",
        label: "FAQ",
        to: "/cms/content/faq",
        icon: MessagesSquare,
        perm: "cms:read",
      },
      {
        id: "cms-testimonials",
        label: "Testimonials",
        to: "/cms/content/testimonials",
        icon: Quote,
        perm: "cms:read",
      },
      { id: "cms-forms", label: "Forms", to: "/cms/forms", icon: ListChecks, perm: "cms:read" },
      { id: "cms-seo", label: "SEO", to: "/cms/seo", icon: Target, perm: "cms:read" },
      {
        id: "cms-library",
        label: "Content Library",
        to: "/cms/media",
        icon: Files,
        perm: "cms:read",
        keywords: "media library assets",
      },
    ],
  },

  {
    id: "administration",
    label: "Administration",
    icon: Settings,
    items: [
      {
        id: "adm-company",
        label: "Company Setup",
        to: "/admin/settings",
        icon: Building2,
        perm: "settings:manage",
      },
      { id: "adm-users", label: "Users", to: "/admin/users", icon: UserCog, perm: "user:manage" },
      { id: "adm-automation", label: "Automation", to: "/admin/automation", icon: Zap, perm: "settings:manage" },
      { id: "adm-notifications", label: "Notifications", to: "/admin/notifications", icon: Bell, perm: "communication:manage" },
      {
        id: "adm-settings",
        label: "Settings",
        to: "/admin/settings",
        icon: Settings,
        perm: "settings:manage",
      },
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
