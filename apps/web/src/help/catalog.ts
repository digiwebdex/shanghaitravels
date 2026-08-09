/**
 * V17 — categories, role labels and quick actions.
 *
 * Quick-action routes and permissions are copied from the audited router
 * (`app/routes.tsx`) and API guards, so a user is never offered a shortcut the
 * server would reject.
 */
import type { Category, CategoryId } from "./types";

export const CATEGORIES: Category[] = [
  { id: "getting-started", label: "Getting Started", bn: "শুরু করুন", icon: "Compass", blurb: "Log in, read the dashboard, find your way around." },
  { id: "leads", label: "Leads", bn: "লিড", icon: "Sparkles", blurb: "Capture an enquiry, follow up, qualify and convert." },
  { id: "customers", label: "Customers", bn: "কাস্টমার", icon: "Users", blurb: "Create customers, Customer 360, history and health." },
  { id: "agents", label: "Agents & Ownership", bn: "এজেন্ট", icon: "Handshake", blurb: "B2B agents, customer ownership, commission and wallet." },
  { id: "documents", label: "Documents & OCR", bn: "ডকুমেন্ট ও OCR", icon: "FileCheck", blurb: "Upload, scan, verify passports and other documents." },
  { id: "bookings", label: "Bookings", bn: "বুকিং", icon: "ClipboardList", blurb: "Create a booking and work it in Booking 360." },
  { id: "visa", label: "Visa", bn: "ভিসা", icon: "FileCheck", blurb: "The 11-stage visa case workflow." },
  { id: "ticketing", label: "Air Ticket", bn: "এয়ার টিকিট", icon: "Plane", blurb: "Fare search to ticket issue and travel." },
  { id: "hotel", label: "Hotel", bn: "হোটেল", icon: "Hotel", blurb: "Room reservation, voucher, check-in and check-out." },
  { id: "transport", label: "Transport", bn: "ট্রান্সপোর্ট", icon: "Car", blurb: "Vehicle, driver and trip completion." },
  { id: "tour", label: "Tour Packages", bn: "ট্যুর প্যাকেজ", icon: "Map", blurb: "Itinerary, departure, travel and feedback." },
  { id: "hajj", label: "Hajj & Umrah", bn: "হজ ও ওমরাহ", icon: "Moon", blurb: "Pilgrim packages, visa, ticketing and on-ground service." },
  { id: "student", label: "Student Consultancy", bn: "স্টুডেন্ট", icon: "BookOpen", blurb: "Counseling, university application, offer and student visa." },
  { id: "manpower", label: "Manpower", bn: "জনশক্তি", icon: "Briefcase", blurb: "Employer, medical, BMET clearance and deployment." },
  { id: "suppliers", label: "Suppliers", bn: "সাপ্লায়ার", icon: "Truck", blurb: "Vendors, supplier cost and payables." },
  { id: "finance", label: "Finance", bn: "ফিন্যান্স", icon: "Landmark", blurb: "How money moves: cost, price, AR, AP and profit." },
  { id: "invoices", label: "Invoices", bn: "ইনভয়েস", icon: "Receipt", blurb: "Raise, approve, send and track an invoice." },
  { id: "payments", label: "Payments", bn: "পেমেন্ট", icon: "CreditCard", blurb: "Record customer money, refunds and receipts." },
  { id: "operations", label: "Operations", bn: "অপারেশন্স", icon: "Workflow", blurb: "The queue, stage advance and daily processing." },
  { id: "reports", label: "Reports", bn: "রিপোর্ট", icon: "PieChart", blurb: "Executive, finance, sales and service reporting." },
  { id: "notifications", label: "Notifications", bn: "নোটিফিকেশন", icon: "Bell", blurb: "Email delivery, outbox and channel status." },
  { id: "troubleshooting", label: "Troubleshooting", bn: "সমস্যা সমাধান", icon: "LifeBuoy", blurb: "Duplicates, mismatches, rejections and refunds." },
];

export const CATEGORY_BY_ID: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;

/** Real role names from the Role table (7 rows). */
export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  general_manager: "General Manager",
  office_incharge: "Office In-charge",
  accounts_manager: "Accounts Manager",
  marketing_manager: "Marketing Manager",
  visa_consultant: "Visa Consultant",
  visa_executive: "Visa Executive",
};

/**
 * Help Center shortcuts. `perm` is the guard the destination API enforces —
 * the UI hides any action the signed-in user cannot perform.
 */
export const QUICK_ACTIONS: { label: string; bn: string; to: string; perm?: string; icon: string }[] = [
  { label: "Add Lead", bn: "নতুন লিড", to: "/crm", perm: "lead:manage", icon: "Sparkles" },
  { label: "Add Customer", bn: "নতুন কাস্টমার", to: "/customers", perm: "customer:create", icon: "Users" },
  { label: "New Booking", bn: "নতুন বুকিং", to: "/bookings/new", perm: "application:create", icon: "ClipboardList" },
  { label: "Scan Document", bn: "ডকুমেন্ট স্ক্যান", to: "/operations/document-intelligence", perm: "ocr:use", icon: "FileCheck" },
  { label: "View Customers", bn: "কাস্টমার তালিকা", to: "/customers", perm: "customer:read", icon: "Users" },
  { label: "View Operations", bn: "অপারেশন্স", to: "/operations", perm: "application:read", icon: "Workflow" },
  { label: "View Invoices", bn: "ইনভয়েস", to: "/finance/invoices", perm: "invoice:amount:read", icon: "Receipt" },
  { label: "View Payments", bn: "পেমেন্ট", to: "/finance/payments", perm: "payment:amount:read", icon: "CreditCard" },
  { label: "View Agents", bn: "এজেন্ট", to: "/partners/agents", perm: "commission:read", icon: "Handshake" },
  { label: "View Suppliers", bn: "সাপ্লায়ার", to: "/partners/suppliers", perm: "supplier:read", icon: "Truck" },
];
