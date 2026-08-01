/**
 * Enterprise navigation model.
 *
 * Single source of truth for the sidebar, the command palette and the
 * breadcrumb trail. Every leaf points at a route that exists in the router;
 * `soon` marks the handful of screens whose backend endpoints are not built
 * yet, so they render an explanatory page instead of a dead link.
 *
 * `perm` mirrors the permission the underlying API actually enforces, so a
 * user never sees a link that would 403 on arrival.
 */
import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  Bell,
  Blocks,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  Car,
  ClipboardList,
  Contact,
  CreditCard,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Files,
  Globe,
  Handshake,
  Hotel,
  Image as ImageIcon,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  ListChecks,
  Mail,
  Map,
  Megaphone,
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
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Ship,
  Sparkles,
  Tags,
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
  /** Backend endpoint not available yet — renders a roadmap page. */
  soon?: boolean;
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
        keywords: "vendor directory",
      },
      ...SUPPLIER_TYPES.filter((t) => t.type !== "other" && t.type !== "embassy" && t.type !== "courier").map(
        (t) => ({
          id: `suppliers-${t.type}`,
          label: t.label,
          to: `/partners/suppliers/${t.type}`,
          icon: t.icon,
          perm: "supplier:read",
          keywords: "supplier vendor",
        }),
      ),
    ],
  },

  {
    id: "crm",
    label: "CRM & Sales",
    icon: Target,
    items: [
      { id: "crm-leads", label: "Leads", to: "/crm", icon: Sparkles, perm: "crm:read", end: true },
      { id: "crm-contacts", label: "Contacts", to: "/crm/contacts", icon: Contact, perm: "crm:read" },
      {
        id: "crm-orgs",
        label: "Organizations",
        to: "/crm/organizations",
        icon: Building2,
        perm: "crm:read",
      },
      {
        id: "crm-opps",
        label: "Opportunities",
        to: "/crm/opportunities",
        icon: TrendingUp,
        perm: "crm:read",
      },
      { id: "crm-activities", label: "Activities", to: "/crm/activities", icon: Activity, perm: "crm:read" },
      {
        id: "sales-pipeline",
        label: "Pipeline",
        to: "/sales",
        icon: BarChart3,
        perm: "opportunity:read",
        end: true,
      },
      { id: "sales-quotes", label: "Quotations", to: "/sales/quotations", icon: Quote, perm: "quote:read" },
      { id: "sales-pricing", label: "Pricing", to: "/sales/pricing", icon: Tags, perm: "sales:pricing" },
      { id: "sales-tasks", label: "Tasks", to: "/sales/tasks", icon: ListChecks, perm: "task:read" },
      { id: "comms", label: "Communications", to: "/comms", icon: MessagesSquare, perm: "comms:read" },
      { id: "crm-reports", label: "CRM Reports", to: "/crm/reports", icon: FileSpreadsheet, perm: "crm:read" },
      {
        id: "sales-reports",
        label: "Sales Reports",
        to: "/sales/reports",
        icon: FileSpreadsheet,
        perm: "opportunity:read",
      },
    ],
  },

  {
    id: "finance",
    label: "Finance ERP",
    icon: Landmark,
    items: [
      {
        id: "fin-dashboard",
        label: "Finance Dashboard",
        to: "/finance/dashboard",
        icon: LayoutDashboard,
        perm: "financial-report:read",
      },
      { id: "fin-coa", label: "Chart of Accounts", to: "/finance", icon: ScrollText, perm: "gl:read", end: true },
      { id: "fin-groups", label: "Account Groups", to: "/finance/groups", icon: Blocks, perm: "gl:read" },
      { id: "fin-periods", label: "Fiscal Periods", to: "/finance/periods", icon: CalendarDays, perm: "gl:read" },
      { id: "fin-cc", label: "Cost Centers", to: "/finance/cost-centers", icon: Target, perm: "gl:read" },
      {
        id: "fin-currencies",
        label: "Currencies",
        to: "/finance/currencies",
        icon: BadgeDollarSign,
        perm: "gl:read",
      },
      { id: "fin-journals", label: "Journals", to: "/finance/journals", icon: FileText, perm: "gl:read" },
      { id: "fin-banking", label: "Banking", to: "/finance/banking", icon: Landmark, perm: "banking:read", end: true },
      {
        id: "fin-movements",
        label: "Bank Movements",
        to: "/finance/banking/movements",
        icon: Activity,
        perm: "banking:read",
      },
      { id: "fin-cheques", label: "Cheques", to: "/finance/banking/cheques", icon: Receipt, perm: "banking:read" },
      {
        id: "fin-recon",
        label: "Reconciliation",
        to: "/finance/banking/reconciliation",
        icon: ListChecks,
        perm: "banking:reconcile",
      },
      { id: "fin-cash", label: "Cash & Bank Accounts", to: "/finance/cash", icon: Wallet, perm: "bank:read" },
      {
        id: "fin-invoices",
        label: "Invoices",
        to: "/finance/invoices",
        icon: Receipt,
        perm: "invoice:amount:read",
      },
      { id: "fin-payments", label: "Payments", to: "/finance/payments", icon: CreditCard, perm: "ar:read" },
      { id: "fin-expenses", label: "Expenses", to: "/finance/expenses", icon: Wallet, perm: "expense:manage" },
      { id: "fin-ar", label: "Accounts Receivable", to: "/finance/ar", icon: TrendingUp, perm: "ar:read", end: true },
      { id: "fin-ap", label: "Accounts Payable", to: "/finance/ap", icon: Truck, perm: "ap:read", end: true },
      {
        id: "fin-cust-ledger",
        label: "Customer Ledger",
        to: "/finance/customer-ledger",
        icon: UserRound,
        perm: "financial-report:read",
      },
      {
        id: "fin-supp-ledger",
        label: "Supplier Ledger",
        to: "/finance/supplier-ledger",
        icon: Truck,
        perm: "financial-report:read",
      },
      { id: "fin-ledger", label: "General Ledger", to: "/finance/ledger", icon: BookOpen, perm: "gl:read" },
      {
        id: "fin-statements",
        label: "Financial Statements",
        to: "/finance/statements",
        icon: FileSpreadsheet,
        perm: "financial-report:read",
      },
      {
        id: "fin-arap-reports",
        label: "AR / AP Reports",
        to: "/finance/ar-ap-reports",
        icon: FileSpreadsheet,
        perm: "financial-report:read",
      },
      {
        id: "fin-bank-reports",
        label: "Bank Reports",
        to: "/finance/banking/reports",
        icon: FileSpreadsheet,
        perm: "financial-report:read",
      },
      {
        id: "fin-gl-reports",
        label: "GL Reports",
        to: "/finance/reports",
        icon: FileSpreadsheet,
        perm: "financial-report:read",
      },
      { id: "fin-analysis", label: "Analysis", to: "/finance/analysis", icon: PieChart, perm: "gl:read" },
      { id: "fin-closing", label: "Period Closing", to: "/finance/closing", icon: ShieldCheck, perm: "period:close" },
    ],
  },

  {
    id: "operations",
    label: "Operations",
    icon: ClipboardList,
    items: [
      { id: "passports", label: "Passport Management", to: "/passports", icon: BookOpen, perm: "customer:read" },
      {
        id: "ops-documents",
        label: "Documents",
        to: "/operations/documents",
        icon: Files,
        perm: "document:read-passport",
      },
      { id: "case-journey", label: "Case Journey", to: "/case-journey", icon: Route, perm: "application:read" },
      {
        id: "ops-workflow",
        label: "Workflow",
        to: "/operations/workflow",
        icon: Workflow,
        perm: "settings:manage",
      },
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
        label: "Executive Dashboard",
        to: "/analytics",
        icon: LayoutDashboard,
        perm: "analytics:read",
        end: true,
      },
      { id: "an-sales", label: "Sales Analytics", to: "/analytics/sales", icon: TrendingUp, perm: "analytics:read" },
      {
        id: "an-customers",
        label: "Customer Analytics",
        to: "/analytics/customers",
        icon: UserRound,
        perm: "analytics:read",
      },
      {
        id: "an-finance",
        label: "Finance Analytics",
        to: "/analytics/finance",
        icon: Landmark,
        perm: "analytics:read",
      },
      {
        id: "an-comms",
        label: "Communications Analytics",
        to: "/analytics/comms",
        icon: MessagesSquare,
        perm: "analytics:read",
      },
      { id: "an-exports", label: "Exports", to: "/analytics/reports", icon: FileSpreadsheet, perm: "analytics:read" },
    ],
  },

  {
    id: "cms",
    label: "Website & CMS",
    icon: Globe,
    items: [
      { id: "cms-pages", label: "Pages", to: "/cms", icon: FileText, perm: "cms:read", end: true },
      { id: "cms-menus", label: "Menus", to: "/cms/menus", icon: ListChecks, perm: "cms:read" },
      { id: "cms-media", label: "Media", to: "/cms/media", icon: ImageIcon, perm: "cms:read" },
      { id: "cms-banners", label: "Banners", to: "/cms/banners", icon: Megaphone, perm: "cms:read" },
      { id: "cms-hero", label: "Hero Services", to: "/cms/hero-services", icon: Sparkles, perm: "cms:read" },
      { id: "cms-packages", label: "Packages", to: "/cms/packages", icon: Package, perm: "cms:read" },
      { id: "cms-destinations", label: "Destinations", to: "/cms/destinations", icon: Map, perm: "cms:read" },
      { id: "cms-blog", label: "Blog", to: "/cms/content/blog", icon: Newspaper, perm: "cms:read" },
      { id: "cms-faq", label: "FAQ", to: "/cms/content/faq", icon: LifeBuoy, perm: "cms:read" },
      { id: "cms-testimonials", label: "Testimonials", to: "/cms/content/testimonial", icon: Quote, perm: "cms:read" },
      { id: "cms-content", label: "Content Library", to: "/cms/content", icon: Files, perm: "cms:read", end: true },
      { id: "cms-travel", label: "Travel Content", to: "/cms/travel", icon: Plane, perm: "cms:read" },
      { id: "cms-forms", label: "Forms", to: "/cms/forms", icon: Mail, perm: "cms:read" },
      { id: "cms-seo", label: "SEO", to: "/cms/seo", icon: Search, perm: "cms:read" },
      { id: "cms-reports", label: "Reports", to: "/cms/reports", icon: FileSpreadsheet, perm: "cms:read" },
    ],
  },

  {
    id: "administration",
    label: "Administration",
    icon: Settings,
    items: [
      { id: "adm-users", label: "Users", to: "/admin/users", icon: UserCog, perm: "user:manage" },
      { id: "adm-roles", label: "Roles", to: "/admin/roles", icon: Shield, perm: "user:manage", soon: true },
      {
        id: "adm-permissions",
        label: "Permissions",
        to: "/admin/permissions",
        icon: ShieldCheck,
        perm: "user:manage",
        soon: true,
      },
      { id: "adm-audit", label: "Audit Logs", to: "/admin/audit", icon: ScrollText, perm: "user:manage", soon: true },
      { id: "adm-settings", label: "System Settings", to: "/admin/settings", icon: Settings, perm: "settings:manage" },
      {
        id: "adm-keys",
        label: "API Keys",
        to: "/admin/api-keys",
        icon: KeyRound,
        perm: "settings:manage",
        soon: true,
      },
      {
        id: "adm-integrations",
        label: "Integrations",
        to: "/admin/integrations",
        icon: Link2,
        perm: "settings:manage",
        soon: true,
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
  }
  return best?.id ?? null;
}
