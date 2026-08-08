/**
 * Workspace registry — V4.3 fixed tab kinds:
 * Overview · Work · Reports · Calendar · Settings
 *
 * Sidebar lists workflow leaves; each domain workspace uses the same five groups.
 */
import {
  Briefcase,
  Brain,
  Car,
  ClipboardList,
  Globe,
  Hotel,
  Landmark,
  Map,
  MessagesSquare,
  Moon,
  Package,
  PieChart,
  Settings,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Workspace } from "./types";

/** Service desks under Bookings — same five tab kinds, no parallel IA. */
const serviceDesk = (
  id: string,
  label: string,
  description: string,
  icon: Workspace["icon"],
  basePath: string,
  workExtras: Workspace["tabs"],
): Workspace => ({
  id,
  label,
  description,
  icon,
  basePath,
  perm: "application:read",
  tabs: [
    { kind: "overview", label: "Overview", to: basePath, end: true, perm: "application:read" },
    { kind: "work", label: "Work", to: basePath, end: true, perm: "application:read" },
    ...workExtras,
    { kind: "reports", label: "Reports", to: `${basePath}/reports`, perm: "application:read" },
    { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
    { kind: "settings", label: "Settings", to: "/bookings/new", perm: "application:create" },
  ],
});

export const WORKSPACES: Workspace[] = [
  {
    id: "crm",
    label: "CRM & Sales",
    description: "Acquire customers — Lead → Opportunity → Quotation → Customer.",
    icon: Target,
    basePath: "/crm",
    perm: "crm:read",
    tabs: [
      { kind: "overview", label: "Overview", to: "/crm/directory", perm: "crm:read" },
      { kind: "work", label: "Leads", to: "/crm", end: true, perm: "crm:read" },
      { kind: "work", label: "Opportunities", to: "/crm/opportunities", perm: "crm:read" },
      { kind: "work", label: "Pipeline", to: "/sales", end: true, perm: "opportunity:read" },
      { kind: "work", label: "Quotations", to: "/sales/quotations", perm: "quote:read" },
      { kind: "work", label: "Tasks", to: "/sales/tasks", perm: "task:read" },
      { kind: "work", label: "Communications", to: "/comms", end: true, perm: "comms:read" },
      { kind: "reports", label: "Reports", to: "/crm/reports", perm: "crm:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Settings", to: "/crm/directory", perm: "crm:read" },
    ],
  },
  {
    id: "bookings",
    label: "Bookings",
    description: "Create and manage bookings — one Unified Booking Wizard for every service.",
    icon: Briefcase,
    basePath: "/visa",
    perm: "application:read",
    tabs: [
      { kind: "overview", label: "Overview", to: "/operations", end: true, perm: "application:read" },
      { kind: "work", label: "Visa", to: "/visa", end: true, perm: "application:read" },
      { kind: "work", label: "Air Ticketing", to: "/ticketing", end: true, perm: "application:read" },
      { kind: "work", label: "Hotels", to: "/hotels", end: true, perm: "application:read" },
      { kind: "work", label: "Tours", to: "/tours", end: true, perm: "application:read" },
      { kind: "work", label: "Transport", to: "/transport", end: true, perm: "application:read" },
      { kind: "work", label: "Hajj & Umrah", to: "/hajj", end: true, perm: "application:read" },
      { kind: "work", label: "Students", to: "/students", end: true, perm: "application:read" },
      { kind: "work", label: "Manpower", to: "/manpower", end: true, perm: "application:read" },
      { kind: "work", label: "Packages", to: "/products/packages", perm: "application:read" },
      { kind: "reports", label: "Reports", to: "/analytics/sales", perm: "analytics:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Settings", to: "/bookings/new", perm: "application:create" },
    ],
  },
  {
    id: "doc-intel",
    label: "Document Intelligence",
    description: "Central OCR management — also embedded in Customer, Booking and portals.",
    icon: Brain,
    basePath: "/operations/document-intelligence",
    perm: "ocr:use",
    tabs: [
      { kind: "overview", label: "Overview", to: "/operations/document-intelligence", end: true, perm: "ocr:use" },
      { kind: "work", label: "Passports", to: "/passports", perm: "customer:read" },
      { kind: "work", label: "Scan", to: "/operations/document-intelligence?tab=scan", perm: "ocr:use" },
      { kind: "work", label: "Documents", to: "/operations/documents", perm: "document:read-passport" },
      { kind: "work", label: "Queue", to: "/operations/document-intelligence?tab=queue", perm: "ocr:use" },
      { kind: "reports", label: "Reports", to: "/operations/document-intelligence?tab=dashboard", perm: "ocr:use" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Settings", to: "/operations/document-intelligence?tab=settings", perm: "ocr:use" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    description: "Execution after booking — queues by service, not CRM.",
    icon: ClipboardList,
    basePath: "/operations",
    perm: "application:read",
    tabs: [
      { kind: "overview", label: "Overview", to: "/operations", end: true, perm: "application:read" },
      { kind: "work", label: "Today", to: "/operations?tab=today", perm: "application:read" },
      { kind: "work", label: "Visa", to: "/operations?tab=visa", perm: "application:read" },
      { kind: "work", label: "Tickets", to: "/operations?tab=ticket", perm: "application:read" },
      { kind: "work", label: "Hotels", to: "/operations?tab=hotel", perm: "application:read" },
      { kind: "work", label: "Transport", to: "/operations?tab=transport", perm: "application:read" },
      { kind: "work", label: "Hajj", to: "/operations?tab=hajj", perm: "application:read" },
      { kind: "work", label: "Timeline", to: "/case-journey", perm: "application:read" },
      { kind: "reports", label: "Reports", to: "/analytics", end: true, perm: "analytics:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Settings", to: "/operations/workflow", perm: "settings:manage" },
    ],
  },
  {
    id: "partners",
    label: "Business Partners",
    description: "Customers, agents, corporate clients and suppliers.",
    icon: Users,
    basePath: "/partners",
    perm: "customer:read",
    tabs: [
      { kind: "overview", label: "Overview", to: "/partners", end: true, perm: "customer:read" },
      { kind: "work", label: "Customers", to: "/customers", perm: "customer:read" },
      { kind: "work", label: "Agents", to: "/partners/agents", perm: "commission:read" },
      { kind: "work", label: "Corporate", to: "/partners/corporate", perm: "customer:read" },
      { kind: "work", label: "Suppliers", to: "/partners/suppliers", end: true, perm: "supplier:read" },
      { kind: "reports", label: "Reports", to: "/analytics/customers", perm: "analytics:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Settings", to: "/partners", end: true, perm: "customer:read" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    description: "Invoice → Collection → Supplier Payment → Expense → Ledger → Profit.",
    icon: Landmark,
    basePath: "/finance",
    perm: "gl:read",
    tabs: [
      { kind: "overview", label: "Overview", to: "/finance/dashboard", perm: "financial-report:read" },
      { kind: "work", label: "Invoices", to: "/finance/invoices", perm: "invoice:amount:read" },
      { kind: "work", label: "Collections", to: "/finance/ar", end: true, perm: "ar:read" },
      { kind: "work", label: "Customer Payments", to: "/finance/payments", perm: "ar:read" },
      { kind: "work", label: "Supplier Payments", to: "/finance/ap", end: true, perm: "ap:read" },
      { kind: "work", label: "Expenses", to: "/finance/expenses", perm: "expense:manage" },
      { kind: "work", label: "Accounts", to: "/finance/accounting", perm: "gl:read" },
      { kind: "reports", label: "Reports", to: "/finance/reports", perm: "financial-report:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Settings", to: "/finance/cash", perm: "bank:read" },
    ],
  },
  {
    id: "analytics",
    label: "Reports & Analytics",
    description: "One reporting center — no duplicate report menus in modules.",
    icon: PieChart,
    basePath: "/analytics",
    perm: "analytics:read",
    tabs: [
      { kind: "overview", label: "Overview", to: "/analytics", end: true, perm: "analytics:read" },
      { kind: "work", label: "CRM", to: "/crm/reports", perm: "crm:read" },
      { kind: "work", label: "Sales", to: "/sales/reports", perm: "opportunity:read" },
      { kind: "work", label: "Bookings", to: "/analytics/sales", perm: "analytics:read" },
      { kind: "work", label: "Finance", to: "/analytics/finance", perm: "analytics:read" },
      { kind: "work", label: "Customers", to: "/analytics/customers", perm: "analytics:read" },
      { kind: "reports", label: "Exports", to: "/analytics/reports", perm: "analytics:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Settings", to: "/analytics", end: true, perm: "analytics:read" },
    ],
  },
  {
    id: "cms",
    label: "Website CMS",
    description: "Website content — packages here are marketing content only.",
    icon: Globe,
    basePath: "/cms",
    perm: "cms:read",
    tabs: [
      { kind: "overview", label: "Overview", to: "/cms", end: true, perm: "cms:read" },
      { kind: "work", label: "Homepage", to: "/cms/setup", perm: "cms:read" },
      { kind: "work", label: "Banners", to: "/cms/banners", perm: "cms:read" },
      { kind: "work", label: "Packages", to: "/cms/packages", perm: "cms:read" },
      { kind: "work", label: "Destinations", to: "/cms/destinations", perm: "cms:read" },
      { kind: "work", label: "Forms", to: "/cms/forms", perm: "cms:read" },
      { kind: "work", label: "SEO", to: "/cms/seo", perm: "cms:read" },
      { kind: "work", label: "Media", to: "/cms/media", perm: "cms:read" },
      { kind: "reports", label: "Reports", to: "/cms/reports", perm: "cms:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Settings", to: "/cms/setup", perm: "cms:read" },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    description: "Company setup, users and system settings.",
    icon: Settings,
    basePath: "/admin",
    perm: "user:manage",
    tabs: [
      { kind: "overview", label: "Overview", to: "/admin/users", perm: "user:manage" },
      { kind: "work", label: "Users", to: "/admin/users", perm: "user:manage" },
      { kind: "reports", label: "Reports", to: "/analytics", end: true, perm: "analytics:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Settings", to: "/admin/settings", perm: "settings:manage" },
    ],
  },

  // --- Service desks (Bookings) — keep ModuleNav working, same five kinds ---
  serviceDesk("hotels", "Hotel Booking", "Hotel bookings and property master.", Hotel, "/hotels", [
    { kind: "work", label: "Catalog", to: "/hotels/catalog", perm: "application:read" },
    { kind: "work", label: "Suppliers", to: "/hotels/suppliers", perm: "supplier:read" },
  ]),
  serviceDesk("transport", "Transport", "Transport bookings, vehicles and routes.", Car, "/transport", [
    { kind: "work", label: "Vehicles", to: "/transport/vehicles", perm: "application:read" },
    { kind: "work", label: "Routes", to: "/transport/routes", perm: "application:read" },
  ]),
  serviceDesk("tours", "Tour Packages", "Tour bookings, packages and departures.", Map, "/tours", [
    { kind: "work", label: "Packages", to: "/tours/packages", perm: "application:read" },
    { kind: "work", label: "Departures", to: "/tours/departures", perm: "application:read" },
  ]),
  serviceDesk("hajj", "Hajj & Umrah", "Hajj/Umrah bookings, pilgrims and groups.", Moon, "/hajj", [
    { kind: "work", label: "Packages", to: "/hajj/packages", perm: "application:read" },
    { kind: "work", label: "Pilgrims", to: "/hajj/pilgrims", perm: "application:read" },
    { kind: "work", label: "Groups", to: "/hajj/groups", perm: "application:read" },
  ]),
  {
    id: "products",
    label: "Package Management",
    description: "Operational package catalog for bookings and portals.",
    icon: Package,
    basePath: "/products",
    perm: "application:read",
    tabs: [
      { kind: "overview", label: "Overview", to: "/products/packages", end: true, perm: "application:read" },
      { kind: "work", label: "Packages", to: "/products/packages", end: true, perm: "application:read" },
      { kind: "work", label: "Destinations", to: "/products/destinations", perm: "application:read" },
      { kind: "work", label: "Categories", to: "/products/categories", perm: "application:read" },
      { kind: "work", label: "Availability", to: "/products/availability", perm: "application:read" },
      { kind: "reports", label: "Reports", to: "/products/reports", perm: "application:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Settings", to: "/cms/packages", perm: "cms:read" },
    ],
  },
  {
    id: "sales",
    label: "CRM & Sales",
    description: "Pipeline and quotations (CRM workspace).",
    icon: TrendingUp,
    basePath: "/sales",
    perm: "opportunity:read",
    tabs: [
      { kind: "overview", label: "Overview", to: "/sales", end: true, perm: "opportunity:read" },
      { kind: "work", label: "Pipeline", to: "/sales", end: true, perm: "opportunity:read" },
      { kind: "work", label: "Quotations", to: "/sales/quotations", perm: "quote:read" },
      { kind: "work", label: "Tasks", to: "/sales/tasks", perm: "task:read" },
      { kind: "reports", label: "Reports", to: "/sales/reports", perm: "opportunity:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Settings", to: "/crm", end: true, perm: "crm:read" },
    ],
  },
  {
    id: "comms",
    label: "Communications",
    description: "Channels under CRM & Sales.",
    icon: MessagesSquare,
    basePath: "/comms",
    perm: "comms:read",
    tabs: [
      { kind: "overview", label: "Overview", to: "/comms", end: true, perm: "comms:read" },
      { kind: "work", label: "Email", to: "/comms/email", perm: "comms:read" },
      { kind: "work", label: "WhatsApp", to: "/comms/whatsapp", perm: "comms:read" },
      { kind: "work", label: "SMS", to: "/comms/sms", perm: "comms:read" },
      { kind: "reports", label: "Reports", to: "/comms/reports", perm: "comms:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Settings", to: "/crm", end: true, perm: "crm:read" },
    ],
  },
];

export function workspaceById(id: string): Workspace | undefined {
  return WORKSPACES.find((w) => w.id === id);
}

/** Longest basePath / tab match for a pathname. */
export function workspaceForPath(pathname: string): Workspace | undefined {
  if (pathname.startsWith("/operations/document-intelligence") || pathname.startsWith("/passports")) {
    return workspaceById("doc-intel");
  }
  if (pathname === "/case-journey") return workspaceById("operations");
  if (pathname.startsWith("/operations")) return workspaceById("operations");
  if (pathname.startsWith("/crm") || pathname.startsWith("/sales") || pathname.startsWith("/comms")) {
    return workspaceById("crm");
  }
  if (pathname.startsWith("/customers") || pathname.startsWith("/partners")) {
    return workspaceById("partners");
  }
  if (pathname.startsWith("/finance")) return workspaceById("finance");
  if (pathname.startsWith("/analytics")) return workspaceById("analytics");
  if (pathname.startsWith("/cms") || pathname.startsWith("/site")) return workspaceById("cms");
  if (pathname.startsWith("/admin")) return workspaceById("admin");
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
    return workspaceById("bookings");
  }

  let best: Workspace | undefined;
  for (const w of WORKSPACES) {
    if (
      pathname === w.basePath ||
      pathname.startsWith(`${w.basePath}/`) ||
      w.tabs.some((t) => {
        const base = t.to.split("?")[0];
        return pathname === base || pathname.startsWith(`${base}/`);
      })
    ) {
      if (!best || w.basePath.length > best.basePath.length) best = w;
    }
  }
  return best;
}
