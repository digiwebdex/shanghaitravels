/**
 * Workspace registry — single source of truth for domain tabs.
 *
 * Sidebar navigation (config/nav.ts) lists leaves; each leaf's workspace
 * (if any) is looked up here for the Overview/Work/Reports/Calendar/Settings bar.
 */
import {
  Briefcase,
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

export const WORKSPACES: Workspace[] = [
  {
    id: "products",
    label: "Products & Packages",
    description: "Package Engine — master catalog for website, portals and bookings.",
    icon: Package,
    basePath: "/products",
    perm: "application:read",
    tabs: [
      { kind: "overview", label: "Packages", to: "/products/packages", end: true, perm: "application:read" },
      { kind: "work", label: "Destinations", to: "/products/destinations", perm: "application:read" },
      { kind: "work", label: "Categories", to: "/products/categories", perm: "application:read" },
      { kind: "work", label: "Pricing", to: "/products/packages/pricing", perm: "application:read" },
      { kind: "work", label: "Gallery", to: "/products/gallery", perm: "application:read" },
      { kind: "work", label: "Availability", to: "/products/availability", perm: "application:read" },
      { kind: "reports", label: "Reports", to: "/products/reports", perm: "application:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "CMS Packages", to: "/cms/packages", perm: "cms:read" },
    ],
  },
  {
    id: "hotels",
    label: "Hotels",
    description: "Hotel bookings, property master and hotel suppliers.",
    icon: Hotel,
    basePath: "/hotels",
    perm: "application:read",
    tabs: [
      { kind: "overview", label: "Bookings", to: "/hotels", end: true, perm: "application:read" },
      { kind: "work", label: "Hotel master", to: "/hotels/catalog", perm: "application:read" },
      { kind: "work", label: "Suppliers", to: "/hotels/suppliers", perm: "supplier:read" },
      { kind: "reports", label: "Reports", to: "/hotels/reports", perm: "application:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "All suppliers", to: "/partners/suppliers/hotel", perm: "supplier:read" },
    ],
  },
  {
    id: "transport",
    label: "Transport",
    description: "Transport bookings, vehicles, routes and suppliers.",
    icon: Car,
    basePath: "/transport",
    perm: "application:read",
    tabs: [
      { kind: "overview", label: "Bookings", to: "/transport", end: true, perm: "application:read" },
      { kind: "work", label: "Vehicles", to: "/transport/vehicles", perm: "application:read" },
      { kind: "work", label: "Routes", to: "/transport/routes", perm: "application:read" },
      { kind: "work", label: "Suppliers", to: "/transport/suppliers", perm: "supplier:read" },
      { kind: "reports", label: "Reports", to: "/transport/reports", perm: "application:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "All suppliers", to: "/partners/suppliers/transport", perm: "supplier:read" },
    ],
  },
  {
    id: "tours",
    label: "Tour Packages",
    description: "Tour bookings, packages, departures and destinations.",
    icon: Map,
    basePath: "/tours",
    perm: "application:read",
    tabs: [
      { kind: "overview", label: "Bookings", to: "/tours", end: true, perm: "application:read" },
      { kind: "work", label: "Packages", to: "/tours/packages", perm: "application:read" },
      { kind: "work", label: "Departures", to: "/tours/departures", perm: "application:read" },
      { kind: "work", label: "Destinations", to: "/tours/destinations", perm: "application:read" },
      { kind: "reports", label: "Reports", to: "/tours/reports", perm: "application:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Package Engine", to: "/products/packages", perm: "application:read" },
    ],
  },
  {
    id: "hajj",
    label: "Hajj & Umrah",
    description: "Hajj/Umrah bookings, packages, pilgrims and groups.",
    icon: Moon,
    basePath: "/hajj",
    perm: "application:read",
    tabs: [
      { kind: "overview", label: "Bookings", to: "/hajj", end: true, perm: "application:read" },
      { kind: "work", label: "Packages", to: "/hajj/packages", perm: "application:read" },
      { kind: "work", label: "Pilgrims", to: "/hajj/pilgrims", perm: "application:read" },
      { kind: "work", label: "Groups", to: "/hajj/groups", perm: "application:read" },
      { kind: "reports", label: "Reports", to: "/hajj/reports", perm: "application:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Package Engine", to: "/products/packages", perm: "application:read" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    description: "Pipeline, quotations, pricing and tasks.",
    icon: TrendingUp,
    basePath: "/sales",
    perm: "opportunity:read",
    tabs: [
      { kind: "overview", label: "Pipeline", to: "/sales", end: true, perm: "opportunity:read" },
      { kind: "work", label: "Quotations", to: "/sales/quotations", perm: "quote:read" },
      { kind: "work", label: "Pricing", to: "/sales/pricing", perm: "sales:pricing" },
      { kind: "work", label: "Tasks", to: "/sales/tasks", perm: "task:read" },
      { kind: "reports", label: "Reports", to: "/sales/reports", perm: "opportunity:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "CRM", to: "/crm", end: true, perm: "crm:read" },
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
      { kind: "reports", label: "AP Aging", to: "/finance/ar-ap-reports", perm: "financial-report:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
    ],
  },
  {
    id: "bookings",
    label: "Bookings & Services",
    description: "Visa, ticketing, hotels, transport, tours, Hajj and packages.",
    icon: Briefcase,
    basePath: "/visa",
    perm: "application:read",
    tabs: [
      { kind: "overview", label: "Overview", to: "/", end: true },
      { kind: "work", label: "Visa", to: "/visa", end: true, perm: "application:read" },
      { kind: "work", label: "Air Ticketing", to: "/ticketing", end: true, perm: "application:read" },
      { kind: "work", label: "Hotels", to: "/hotels", end: true, perm: "application:read" },
      { kind: "work", label: "Transport", to: "/transport", end: true, perm: "application:read" },
      { kind: "work", label: "Tours", to: "/tours", end: true, perm: "application:read" },
      { kind: "work", label: "Hajj & Umrah", to: "/hajj", end: true, perm: "application:read" },
      { kind: "work", label: "Packages", to: "/products/packages", perm: "application:read" },
      { kind: "reports", label: "Operational", to: "/analytics", end: true, perm: "analytics:read" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
      { kind: "settings", label: "Workflow", to: "/operations/workflow", perm: "settings:manage" },
    ],
  },
  {
    id: "crm",
    label: "CRM & Sales",
    description: "Leads, pipeline, quotations, pricing and tasks.",
    icon: Target,
    basePath: "/crm",
    perm: "crm:read",
    tabs: [
      { kind: "overview", label: "Overview", to: "/crm", end: true, perm: "crm:read" },
      { kind: "work", label: "Opportunities", to: "/crm/opportunities", perm: "crm:read" },
      { kind: "work", label: "Pipeline", to: "/sales", end: true, perm: "opportunity:read" },
      { kind: "work", label: "Quotations", to: "/sales/quotations", perm: "quote:read" },
      { kind: "work", label: "Tasks", to: "/sales/tasks", perm: "task:read" },
      { kind: "settings", label: "Directory", to: "/crm/directory", perm: "crm:read" },
      { kind: "reports", label: "CRM Reports", to: "/crm/reports", perm: "crm:read" },
      { kind: "reports", label: "Sales Reports", to: "/sales/reports", perm: "opportunity:read" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    description: "Invoices, payments, banking, AR/AP and statements.",
    icon: Landmark,
    basePath: "/finance",
    perm: "gl:read",
    tabs: [
      { kind: "overview", label: "Overview", to: "/finance/dashboard", perm: "financial-report:read" },
      { kind: "work", label: "Invoices", to: "/finance/invoices", perm: "invoice:amount:read" },
      { kind: "work", label: "Payments", to: "/finance/payments", perm: "ar:read" },
      { kind: "work", label: "Expenses", to: "/finance/expenses", perm: "expense:manage" },
      { kind: "work", label: "Receivables", to: "/finance/ar", end: true, perm: "ar:read" },
      { kind: "work", label: "Payables", to: "/finance/ap", end: true, perm: "ap:read" },
      { kind: "work", label: "Cash & Bank", to: "/finance/cash", perm: "bank:read" },
      { kind: "work", label: "Banking", to: "/finance/banking", end: true, perm: "banking:read" },
      { kind: "settings", label: "Accounting", to: "/finance/accounting", perm: "gl:read" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    description: "Passports, documents, case journey and notifications.",
    icon: ClipboardList,
    basePath: "/operations",
    perm: "application:read",
    tabs: [
      { kind: "overview", label: "Overview", to: "/operations", end: true, perm: "application:read" },
      { kind: "work", label: "Passports", to: "/passports", perm: "customer:read" },
      { kind: "work", label: "Documents", to: "/operations/documents", perm: "document:read-passport" },
      { kind: "work", label: "Case Journey", to: "/case-journey", perm: "application:read" },
      { kind: "work", label: "Notifications", to: "/operations/notifications", perm: "communication:manage" },
      { kind: "calendar", label: "Calendar", to: "/operations/calendar", perm: "task:read" },
    ],
  },
  {
    id: "comms",
    label: "Communications",
    description: "Email, WhatsApp, SMS and activity timeline.",
    icon: MessagesSquare,
    basePath: "/comms",
    perm: "comms:read",
    tabs: [
      { kind: "overview", label: "Timeline", to: "/comms", end: true, perm: "comms:read" },
      { kind: "work", label: "Email", to: "/comms/email", perm: "comms:read" },
      { kind: "work", label: "WhatsApp", to: "/comms/whatsapp", perm: "comms:read" },
      { kind: "work", label: "SMS", to: "/comms/sms", perm: "comms:read" },
      { kind: "work", label: "Activities", to: "/comms/activities", perm: "comms:read" },
      { kind: "reports", label: "Reports", to: "/comms/reports", perm: "comms:read" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Executive, sales, customer and finance analytics.",
    icon: PieChart,
    basePath: "/analytics",
    perm: "analytics:read",
    tabs: [
      { kind: "overview", label: "Executive", to: "/analytics", end: true, perm: "analytics:read" },
      { kind: "work", label: "Sales", to: "/analytics/sales", perm: "analytics:read" },
      { kind: "work", label: "Customers", to: "/analytics/customers", perm: "analytics:read" },
      { kind: "work", label: "Finance", to: "/analytics/finance", perm: "analytics:read" },
      { kind: "reports", label: "Exports", to: "/analytics/reports", perm: "analytics:read" },
    ],
  },
  {
    id: "cms",
    label: "Website CMS",
    description: "Pages, media, packages and website content.",
    icon: Globe,
    basePath: "/cms",
    perm: "cms:read",
    tabs: [
      { kind: "overview", label: "Pages", to: "/cms", end: true, perm: "cms:read" },
      { kind: "work", label: "Menus", to: "/cms/menus", perm: "cms:read" },
      { kind: "work", label: "Media", to: "/cms/media", perm: "cms:read" },
      { kind: "work", label: "Packages", to: "/cms/packages", perm: "cms:read" },
      { kind: "work", label: "Destinations", to: "/cms/destinations", perm: "cms:read" },
      { kind: "work", label: "Blog", to: "/cms/content/blog", perm: "cms:read" },
      { kind: "work", label: "FAQ", to: "/cms/content/faq", perm: "cms:read" },
      { kind: "work", label: "Testimonials", to: "/cms/content/testimonial", perm: "cms:read" },
      { kind: "settings", label: "Website Setup", to: "/cms/setup", perm: "cms:read" },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    description: "Users and system settings.",
    icon: Settings,
    basePath: "/admin",
    perm: "user:manage",
    tabs: [
      { kind: "overview", label: "Users", to: "/admin/users", perm: "user:manage" },
      { kind: "settings", label: "System Settings", to: "/admin/settings", perm: "settings:manage" },
      { kind: "settings", label: "Workflow", to: "/operations/workflow", perm: "settings:manage" },
    ],
  },
];

export function workspaceById(id: string): Workspace | undefined {
  return WORKSPACES.find((w) => w.id === id);
}

/** Longest basePath match for a pathname. */
export function workspaceForPath(pathname: string): Workspace | undefined {
  let best: Workspace | undefined;
  for (const w of WORKSPACES) {
    if (
      pathname === w.basePath ||
      pathname.startsWith(`${w.basePath}/`) ||
      w.tabs.some((t) => pathname === t.to || pathname.startsWith(`${t.to}/`))
    ) {
      if (!best || w.basePath.length > best.basePath.length) best = w;
    }
  }
  if (pathname === "/customers" || pathname.startsWith("/customers/")) {
    return workspaceById("partners");
  }
  if (pathname === "/passports" || pathname === "/case-journey") {
    return workspaceById("operations");
  }
  if (pathname.startsWith("/products")) return workspaceById("products");
  if (pathname.startsWith("/hotels")) return workspaceById("hotels");
  if (pathname.startsWith("/transport")) return workspaceById("transport");
  if (pathname.startsWith("/tours")) return workspaceById("tours");
  if (pathname.startsWith("/hajj")) return workspaceById("hajj");
  if (pathname.startsWith("/sales")) return workspaceById("sales");
  return best;
}
