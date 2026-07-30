export type PortalHealth  = "operational" | "degraded" | "down";
export type ActivityType  = "application" | "payment" | "sla" | "approval" | "booking" | "system" | "verification";
export type NotifType     = "breach" | "approval" | "payment" | "system" | "alert";

export interface AdminModule { id: string; label: string; route: string; color: string; }
export interface Branch      { id: string; name: string; country: string; }
export interface AdminNotif  { id: string; type: NotifType; text: string; ref?: string; at: string; read: boolean; }
export interface FunnelStage { stage: string; short: string; count: number; }
export interface RevenueMonth{ month: string; revenue: number; target: number; }
export interface ActivityItem{ id: string; type: ActivityType; text: string; ref?: string; portal: "customer"|"agent"|"corporate"|"supplier"|"staff"|"admin"; at: string; }
export interface PortalStat  { id: string; label: string; sessions: number; actions: number; health: PortalHealth; }

// ── Modules ──────────────────────────────────────────────────────────────────
export const SERVICE_MODULES: AdminModule[] = [
  { id: "crm",         label: "CRM",                  route: "/admin/crm",         color: "#06B6D4" },
  { id: "customers",   label: "Customer Management",   route: "/admin/customers",   color: "#3B82F6" },
  { id: "passports",   label: "Passport Management",   route: "/admin/passports",   color: "#6366F1" },
  { id: "visa",        label: "Visa Management",       route: "/admin/visa",        color: "#8B5CF6" },
  { id: "ticketing",   label: "Air Ticketing",         route: "/admin/ticketing",   color: "#0EA5E9" },
  { id: "hotels",      label: "Hotel Management",      route: "/admin/hotels",      color: "#10B981" },
  { id: "transport",   label: "Transport Management",  route: "/admin/transport",   color: "#F97316" },
  { id: "tours",       label: "Tour Packages",         route: "/admin/tours",       color: "#F59E0B" },
  { id: "hajj",        label: "Hajj & Umrah",          route: "/admin/hajj",        color: "#22C55E" },
  { id: "student",     label: "Student Consultancy",   route: "/admin/student",     color: "#EC4899" },
  { id: "medical",     label: "Medical Tourism",       route: "/admin/medical",     color: "#EF4444" },
  { id: "immigration", label: "Immigration",           route: "/admin/immigration", color: "#64748B" },
  { id: "insurance",   label: "Insurance",             route: "/admin/insurance",   color: "#A855F7" },
  { id: "corporate",   label: "Corporate Clients",     route: "/admin/corporate",   color: "#4F46E5" },
  { id: "suppliers",   label: "Supplier Management",   route: "/admin/suppliers",   color: "#14B8A6" },
];

export const OPS_MODULES: AdminModule[] = [
  { id: "case-journey", label: "Case Journey Map",      route: "/admin/case-journey", color: "#F59E0B" },
  { id: "finance",      label: "Accounting & Finance",  route: "/admin/finance",      color: "#10B981" },
  { id: "wallet",   label: "Wallet & Commission",  route: "/admin/wallet",   color: "#F59E0B" },
  { id: "hr",       label: "HR & Payroll",         route: "/admin/hr",       color: "#3B82F6" },
  { id: "tasks",    label: "Tasks & Workflow",      route: "/admin/tasks",    color: "#8B5CF6" },
  { id: "reports",  label: "Reports & BI",         route: "/admin/reports",  color: "#8B5CF6" },
  { id: "cms",           label: "CMS",                  route: "/admin/cms",           color: "#94A3B8" },
  { id: "notifications", label: "Notification Engine", route: "/admin/notifications", color: "#06B6D4" },
  { id: "downloads",     label: "Download Center",     route: "/admin/downloads",     color: "#8B5CF6" },
  { id: "settings",         label: "Settings",            route: "/admin/settings",     color: "#6B7280" },
  { id: "tablet-showcase",   label: "Tablet Layouts",      route: "/admin/tablet",       color: "#3B82F6" },
  { id: "project-overview",  label: "Project Overview",    route: "/admin/overview",     color: "#10B981" },
  { id: "pwa",               label: "PWA & Responsive",    route: "/admin/pwa",          color: "#06B6D4" },
];

// ── Supporting data ────────────────────────────────────────────────────────────
export const BRANCHES: Branch[] = [
  { id: "dxb", name: "Dubai HQ",  country: "UAE"   },
  { id: "auh", name: "Abu Dhabi", country: "UAE"   },
  { id: "shj", name: "Sharjah",   country: "UAE"   },
  { id: "lhr", name: "London",    country: "UK"    },
  { id: "bom", name: "Mumbai",    country: "India" },
];

export const NOTIFICATIONS: AdminNotif[] = [
  { id: "n1", type: "breach",   text: "SLA breach — APP-7705 overdue by 6 hours",           ref: "APP-7705", at: "5m ago",  read: false },
  { id: "n2", type: "approval", text: "Corporate booking pending CEO approval — TCS Ltd",     ref: "BKG-4421", at: "12m ago", read: false },
  { id: "n3", type: "breach",   text: "SLA breach — APP-7701 embassy deadline missed",        ref: "APP-7701", at: "38m ago", read: false },
  { id: "n4", type: "payment",  text: "Agent deposit received — Sunrise Travel AED 50,000",   ref: "TXN-8812", at: "1h ago",  read: false },
  { id: "n5", type: "system",   text: "AI Validation service degraded — elevated latency",                    at: "2h ago",  read: false },
  { id: "n6", type: "approval", text: "3 visa applications awaiting senior officer review",                   at: "3h ago",  read: true  },
  { id: "n7", type: "alert",    text: "Agent wallet low — Gulf Travels below AED 5,000",      ref: "AGT-8891", at: "4h ago",  read: true  },
];

export const FUNNEL_DATA: FunnelStage[] = [
  { stage: "Inquiry Received",    short: "Inquiry",      count: 847 },
  { stage: "Passport OCR",        short: "OCR",          count: 712 },
  { stage: "Checklist Review",    short: "Checklist",    count: 634 },
  { stage: "Document Upload",     short: "Doc Upload",   count: 581 },
  { stage: "AI Validation",       short: "AI Check",     count: 524 },
  { stage: "Invoice Generated",   short: "Invoice",      count: 487 },
  { stage: "Payment Received",    short: "Payment",      count: 441 },
  { stage: "Staff Assigned",      short: "Assigned",     count: 398 },
  { stage: "Embassy Submission",  short: "Embassy Sub",  count: 312 },
  { stage: "Embassy Processing",  short: "Processing",   count: 267 },
  { stage: "Interview/Biometric", short: "Interview",    count: 189 },
  { stage: "Approval Decision",   short: "Approval",     count: 156 },
  { stage: "Passport Received",   short: "Passport Rcv", count: 134 },
  { stage: "Delivery",            short: "Delivery",     count: 98  },
  { stage: "Archived",            short: "Archive",      count: 76  },
];

export const REVENUE_DATA: RevenueMonth[] = [
  { month: "Aug", revenue: 1_240_000, target: 1_200_000 },
  { month: "Sep", revenue: 1_440_000, target: 1_400_000 },
  { month: "Oct", revenue: 1_820_000, target: 1_600_000 },
  { month: "Nov", revenue: 2_100_000, target: 2_000_000 },
  { month: "Dec", revenue: 2_380_000, target: 2_200_000 },
  { month: "Jan", revenue: 1_920_000, target: 2_400_000 },
];

export const ACTIVITY: ActivityItem[] = [
  { id: "a1",  type: "application",  text: "New application submitted",        ref: "APP-7708", portal: "customer",  at: "5m ago"   },
  { id: "a2",  type: "sla",          text: "SLA breach detected",              ref: "APP-7705", portal: "staff",     at: "8m ago"   },
  { id: "a3",  type: "payment",      text: "Agent wallet top-up AED 50,000",   ref: "TXN-8812", portal: "agent",     at: "12m ago"  },
  { id: "a4",  type: "approval",     text: "Visa approved by officer",          ref: "APP-7706", portal: "staff",     at: "28m ago"  },
  { id: "a5",  type: "booking",      text: "Corporate flight booking confirmed",ref: "BKG-4421", portal: "corporate", at: "41m ago"  },
  { id: "a6",  type: "verification", text: "Documents verified — 3 flags resolved",ref: "APP-7702", portal: "staff",  at: "1h ago"   },
  { id: "a7",  type: "payment",      text: "Invoice paid by customer",          ref: "INV-2023", portal: "customer",  at: "2h ago"   },
  { id: "a8",  type: "booking",      text: "Supplier request accepted",         ref: "REQ-0391", portal: "supplier",  at: "2.5h ago" },
  { id: "a9",  type: "application",  text: "Embassy submission confirmed",      ref: "APP-7701", portal: "staff",     at: "3h ago"   },
  { id: "a10", type: "system",       text: "Weekly SLA report auto-generated",                   portal: "admin",     at: "3.5h ago" },
];

export const PORTAL_STATUS: PortalStat[] = [
  { id: "customer",  label: "Customer Portal",  sessions: 48,  actions: 124, health: "operational" },
  { id: "agent",     label: "Agent Portal",     sessions: 12,  actions: 87,  health: "operational" },
  { id: "corporate", label: "Corporate Portal", sessions: 7,   actions: 43,  health: "operational" },
  { id: "supplier",  label: "Supplier Portal",  sessions: 5,   actions: 21,  health: "operational" },
  { id: "staff",     label: "Staff Portal",     sessions: 9,   actions: 312, health: "degraded"    },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
export const fmtM   = (n: number) => `AED ${(n / 1_000_000).toFixed(2)}M`;
