/**
 * Enterprise navigation — commercial information architecture.
 *
 * Daily-use leaves stay at the section root. Infrequent setup screens are
 * nested under hub pages (e.g. Website Setup). Unfinished features are omitted
 * from the menu entirely — no "Soon" placeholders in production.
 */
import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  Car,
  ClipboardList,
  Contact,
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
  Newspaper,
  Package,
  PieChart,
  Plane,
  Quote,
  Receipt,
  Route,
  ScrollText,
  Settings,
  ShieldCheck,
  Ship,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  UserCog,
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
  { type: "embassy", label: "Embassies", icon: ShieldCheck },
  { type: "visa", label: "Visa Partners", icon: FileCheck },
  { type: "tour", label: "Tour Operators", icon: Map },
  { type: "transport", label: "Transport Vendors", icon: Car },
  { type: "insurance", label: "Insurance Partners", icon: LifeBuoy },
  { type: "courier", label: "Courier Partners", icon: Ship },
  { type: "other", label: "Other Suppliers", icon: Briefcase },
] as const;

export type SupplierType = (typeof SUPPLIER_TYPES)[number]["type"];

export function supplierTypeLabel(type: string): string {
  return SUPPLIER_TYPES.find((t) => t.type === type)?.label ?? "Suppliers";
}

export const NAV: NavSection[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/", end: true },

  {
    id: "bookings",
    label: "Bookings & Services",
    icon: Briefcase,
    items: [
      { id: "visa", label: "Visa Services", to: "/visa", icon: FileCheck, perm: "application:read" },
      { id: "ticketing", label: "Air Ticketing", to: "/ticketing", icon: Plane, perm: "application:read" },
      { id: "hotels", label: "Hotels", to: "/hotels", icon: Hotel, perm: "application:read" },
      { id: "transport", label: "Transport", to: "/transport", icon: Car, perm: "application:read" },
      { id: "tours", label: "Tour Packages", to: "/tours", icon: Map, perm: "application:read" },
      { id: "hajj", label: "Hajj & Umrah", to: "/hajj", icon: Moon, perm: "application:read" },
      {
        id: "products",
        label: "Products & Packages",
        to: "/products/packages",
        icon: Package,
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
    id: "crm",
    label: "CRM & Sales",
    icon: Target,
    items: [
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
      {
        id: "crm-directory",
        label: "Directory",
        to: "/crm/directory",
        icon: Contact,
        perm: "crm:read",
        keywords: "contacts organizations",
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
      { id: "fin-payments", label: "Payments", to: "/finance/payments", icon: CreditCard, perm: "ar:read" },
      { id: "fin-expenses", label: "Expenses", to: "/finance/expenses", icon: Wallet, perm: "expense:manage" },
      { id: "fin-ar", label: "Receivables", to: "/finance/ar", icon: TrendingUp, perm: "ar:read", end: true },
      { id: "fin-ap", label: "Payables", to: "/finance/ap", icon: Truck, perm: "ap:read", end: true },
      { id: "fin-cash", label: "Cash & Bank", to: "/finance/cash", icon: Wallet, perm: "bank:read" },
      { id: "fin-banking", label: "Banking", to: "/finance/banking", icon: Landmark, perm: "banking:read", end: true },
      {
        id: "fin-accounting",
        label: "Accounting",
        to: "/finance/accounting",
        icon: ScrollText,
        perm: "gl:read",
        keywords: "chart of accounts journals statements period closing ledger",
      },
    ],
  },

  {
    id: "operations",
    label: "Operations",
    icon: ClipboardList,
    items: [
      { id: "passports", label: "Passports", to: "/passports", icon: BookOpen, perm: "customer:read" },
      {
        id: "ops-documents",
        label: "Documents",
        to: "/operations/documents",
        icon: Files,
        perm: "document:read-passport",
      },
      { id: "case-journey", label: "Case Journey", to: "/case-journey", icon: Route, perm: "application:read" },
      { id: "ops-calendar", label: "Calendar", to: "/operations/calendar", icon: CalendarDays, perm: "task:read" },
      {
        id: "ops-notifications",
        label: "Notifications",
        to: "/operations/notifications",
        icon: Bell,
        perm: "communication:manage",
      },
    ],
  },

  {
    id: "analytics",
    label: "Analytics",
    icon: PieChart,
    items: [
      {
        id: "an-exec",
        label: "Executive",
        to: "/analytics",
        icon: LayoutDashboard,
        perm: "analytics:read",
        end: true,
      },
      { id: "an-sales", label: "Sales", to: "/analytics/sales", icon: TrendingUp, perm: "analytics:read" },
      {
        id: "an-customers",
        label: "Customers",
        to: "/analytics/customers",
        icon: UserRound,
        perm: "analytics:read",
      },
      {
        id: "an-finance",
        label: "Finance",
        to: "/analytics/finance",
        icon: Landmark,
        perm: "analytics:read",
      },
    ],
  },

  {
    id: "cms",
    label: "Website CMS",
    icon: Globe,
    items: [
      { id: "cms-pages", label: "Pages", to: "/cms", icon: FileText, perm: "cms:read", end: true },
      { id: "cms-menus", label: "Menus", to: "/cms/menus", icon: ListChecks, perm: "cms:read" },
      { id: "cms-media", label: "Media", to: "/cms/media", icon: ImageIcon, perm: "cms:read" },
      { id: "cms-packages", label: "Packages", to: "/cms/packages", icon: Package, perm: "cms:read" },
      { id: "cms-destinations", label: "Destinations", to: "/cms/destinations", icon: Map, perm: "cms:read" },
      { id: "cms-blog", label: "Blog", to: "/cms/content/blog", icon: Newspaper, perm: "cms:read" },
      { id: "cms-faq", label: "FAQ", to: "/cms/content/faq", icon: LifeBuoy, perm: "cms:read" },
      { id: "cms-testimonials", label: "Testimonials", to: "/cms/content/testimonial", icon: Quote, perm: "cms:read" },
      {
        id: "cms-setup",
        label: "Website Setup",
        to: "/cms/setup",
        icon: Settings,
        perm: "cms:read",
        keywords: "banners hero forms seo content library",
      },
    ],
  },

  {
    id: "administration",
    label: "Administration",
    icon: Settings,
    items: [
      { id: "adm-users", label: "Users", to: "/admin/users", icon: UserCog, perm: "user:manage" },
      { id: "adm-settings", label: "System Settings", to: "/admin/settings", icon: Settings, perm: "settings:manage" },
      {
        id: "adm-workflow",
        label: "Workflow",
        to: "/operations/workflow",
        icon: Workflow,
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

/** The section a pathname belongs to — used to auto-expand the sidebar. */
export function sectionForPath(pathname: string): string | null {
  let best: { id: string; len: number } | null = null;
  for (const section of NAV) {
    for (const item of section.items ?? []) {
      if (
        (pathname === item.to || pathname.startsWith(`${item.to}/`)) &&
        (!best || item.to.length > best.len)
      ) {
        best = { id: section.id, len: item.to.length };
      }
    }
    // CMS setup children still belong to Website CMS
    if (section.id === "cms" && pathname.startsWith("/cms/")) {
      if (!best || best.id !== "cms") best = { id: "cms", len: 4 };
    }
    if (section.id === "finance" && pathname.startsWith("/finance")) {
      if (!best || (best.id !== "finance" && best.len < 8)) best = { id: "finance", len: 8 };
    }
  }
  return best?.id ?? null;
}
