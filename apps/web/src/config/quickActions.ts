/**
 * Quick actions shared by the header "Create" menu and the dashboard.
 *
 * Each action deep-links to the screen that owns the operation, so no
 * business logic is duplicated here. `perm` matches the permission the
 * destination enforces.
 */
import {
  Building2,
  CreditCard,
  FileCheck,
  Hotel,
  Mail,
  Map,
  MessageCircle,
  Package,
  Plane,
  Receipt,
  ScanLine,
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
    id: "qa-scan",
    label: "Scan Document",
    to: "/operations/document-intelligence?tab=scan",
    icon: ScanLine,
    perm: "ocr:use",
    primary: true,
  },
  { id: "qa-visa", label: "New Visa Case", to: "/visa/new", icon: FileCheck, perm: "application:create", primary: true },
  {
    id: "qa-ticket",
    label: "New Air Ticket",
    to: "/ticketing/new",
    icon: Plane,
    perm: "application:create",
    primary: true,
  },
  { id: "qa-hotel", label: "New Hotel Booking", to: "/hotels/new", icon: Hotel, perm: "application:create" },
  { id: "qa-tour", label: "New Tour Booking", to: "/tours/new", icon: Map, perm: "application:create" },
  {
    id: "qa-customer",
    label: "New Customer",
    to: "/customers",
    icon: UserRoundPlus,
    perm: "customer:create",
    primary: true,
  },
  {
    id: "qa-corporate",
    label: "New Corporate Client",
    to: "/partners/corporate",
    icon: Building2,
    perm: "corporate:manage",
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
    id: "qa-payment",
    label: "Receive Payment",
    to: "/finance/payments",
    icon: CreditCard,
    perm: "payment:record",
    primary: true,
  },
  { id: "qa-pay-supplier", label: "Pay Supplier", to: "/finance/ap", icon: Truck, perm: "ap:manage" },
  { id: "qa-whatsapp", label: "Send WhatsApp", to: "/comms/whatsapp", icon: MessageCircle, perm: "comms:send" },
  { id: "qa-email", label: "Send Email", to: "/comms/email", icon: Mail, perm: "comms:send" },
  { id: "qa-package", label: "Create Package", to: "/products/packages", icon: Package, perm: "application:read" },
];
