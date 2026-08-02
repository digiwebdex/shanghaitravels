/**
 * Quick actions — header Create menu + dashboard shortcuts.
 * Context-aware labels live in contextUi.ts; deep-links only (no business logic).
 */
import {
  Building2,
  FileText,
  Package,
  PieChart,
  Receipt,
  ScanLine,
  Search,
  Sparkles,
  Truck,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";

export type QuickAction = {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  perm?: string;
  /** Shown in the compact header menu as well as the dashboard grid. */
  primary?: boolean;
};

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "qa-booking",
    label: "New Booking",
    to: "/bookings/new",
    icon: Sparkles,
    perm: "application:create",
    primary: true,
  },
  {
    id: "qa-customer",
    label: "Add Customer",
    to: "/customers",
    icon: UserRoundPlus,
    perm: "customer:create",
    primary: true,
  },
  {
    id: "qa-lead",
    label: "Create Lead",
    to: "/crm",
    icon: FileText,
    perm: "crm:read",
    primary: true,
  },
  {
    id: "qa-scan",
    label: "Upload Passport",
    to: "/operations/document-intelligence?tab=scan",
    icon: ScanLine,
    perm: "ocr:use",
    primary: true,
  },
  {
    id: "qa-invoice",
    label: "New Invoice",
    to: "/finance/invoices",
    icon: Receipt,
    perm: "invoice:manage",
    primary: true,
  },
  {
    id: "qa-search-booking",
    label: "Search Booking",
    to: "/operations",
    icon: Search,
    perm: "application:read",
    primary: true,
  },
  {
    id: "qa-reports",
    label: "Reports",
    to: "/analytics",
    icon: PieChart,
    perm: "analytics:read",
    primary: true,
  },
  {
    id: "qa-supplier",
    label: "Add Supplier",
    to: "/partners/suppliers",
    icon: Truck,
    perm: "supplier:manage",
  },
  {
    id: "qa-corporate",
    label: "Add Corporate Client",
    to: "/partners/corporate",
    icon: Building2,
    perm: "corporate:manage",
  },
  {
    id: "qa-blog",
    label: "New Blog",
    to: "/cms/content/blog",
    icon: FileText,
    perm: "cms:read",
  },
  {
    id: "qa-user",
    label: "Add User",
    to: "/admin/users",
    icon: UserRoundPlus,
    perm: "user:manage",
  },
  {
    id: "qa-package",
    label: "New Package",
    to: "/products/packages",
    icon: Package,
    perm: "application:read",
  },
];
