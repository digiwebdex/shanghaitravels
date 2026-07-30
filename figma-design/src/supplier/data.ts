export type SupplierType = "hotel" | "airline" | "transport";
export type RequestStatus = "pending" | "accepted" | "rejected" | "countered" | "expired";
export type ServiceStatus = "active" | "inactive" | "maintenance";
export type InvoiceStatus = "paid" | "unpaid" | "overdue" | "draft";
export type PaymentStatus = "received" | "scheduled" | "failed" | "processing";
export type ContractStatus = "active" | "expiring" | "expired" | "pending_review";

export interface BookingRequest {
  id: string;
  ref: string;
  agentName: string;
  agentId: string;
  serviceId: string;
  serviceName: string;
  serviceType: SupplierType;
  checkIn: string;
  checkOut: string;
  nights?: number;
  guests: number;
  rooms?: number;
  requestedRate: number;
  ourRate: number;
  totalValue: number;
  status: RequestStatus;
  receivedAt: string;
  expiresAt: string;
  notes?: string;
  priority: "high" | "normal" | "low";
}

export interface Service {
  id: string;
  name: string;
  type: SupplierType;
  category: string;
  baseRate: number;
  currency: string;
  available: boolean;
  status: ServiceStatus;
  capacity: number;
  booked: number;
  description: string;
  amenities: string[];
  lastUpdated: string;
}

export interface SupplierInvoice {
  id: string;
  number: string;
  agentName: string;
  bookingRef: string;
  issuedDate: string;
  dueDate: string;
  amount: number;
  vat: number;
  total: number;
  status: InvoiceStatus;
  serviceName: string;
}

export interface Payment {
  id: string;
  invoiceRef: string;
  agentName: string;
  amount: number;
  date: string;
  method: string;
  status: PaymentStatus;
  ref: string;
}

export interface Contract {
  id: string;
  title: string;
  agentName: string;
  type: string;
  signedDate: string;
  expiryDate: string;
  value: number;
  status: ContractStatus;
  fileSize: string;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookings: number;
}

export interface RatingBreakdown {
  category: string;
  score: number;
  reviews: number;
}

// ── Supplier Profile ──────────────────────────────────
export const SUPPLIER = {
  name: "Grand Meridian Hotels & Resorts",
  supplierId: "SUP-4471",
  type: "hotel" as SupplierType,
  category: "5-Star Luxury Hotel Chain",
  contactName: "Hassan Al-Farouk",
  email: "partnerships@grandmeridian.ae",
  phone: "+971 4 712 8800",
  address: "Sheikh Mohammed Bin Rashid Blvd, Downtown Dubai, UAE",
  licenseNo: "DTCM-DXB-2247",
  vatNo: "100341289700003",
  bankName: "Abu Dhabi Commercial Bank",
  iban: "AE07 0030 0012 3456 7890 001",
  rating: 4.7,
  totalReviews: 312,
  responseRate: 94,
  avgResponseTime: "1.8h",
  acceptanceRate: 88,
  accountManager: { name: "Yasmin Khalil", email: "yasmin@shanghaitravels.com", phone: "+971 50 991 2233" },
};

// ── Booking Requests ──────────────────────────────────
export const REQUESTS: BookingRequest[] = [
  { id: "r1",  ref: "REQ-20901", agentName: "Sunrise Travel & Tourism", agentId: "AGT-10042", serviceId: "s1", serviceName: "Deluxe King Room",     serviceType: "hotel",     checkIn: "20 Jan 2025", checkOut: "24 Jan 2025", nights: 4, guests: 2, rooms: 1, requestedRate: 420, ourRate: 480, totalValue: 1920, status: "pending",  receivedAt: "09 Jan 2025 14:32", expiresAt: "10 Jan 2025 14:32", priority: "high",   notes: "Early check-in requested, non-smoking floor" },
  { id: "r2",  ref: "REQ-20902", agentName: "Blue Horizon Travels",     agentId: "AGT-10088", serviceId: "s2", serviceName: "Executive Suite",       serviceType: "hotel",     checkIn: "15 Feb 2025", checkOut: "18 Feb 2025", nights: 3, guests: 2, rooms: 1, requestedRate: 800, ourRate: 850, totalValue: 2550, status: "pending",  receivedAt: "09 Jan 2025 11:15", expiresAt: "10 Jan 2025 11:15", priority: "high",   notes: "Corporate booking, invoice required" },
  { id: "r3",  ref: "REQ-20903", agentName: "Nile Star Tourism",        agentId: "AGT-10031", serviceId: "s3", serviceName: "Superior Twin Room",    serviceType: "hotel",     checkIn: "01 Feb 2025", checkOut: "05 Feb 2025", nights: 4, guests: 4, rooms: 2, requestedRate: 280, ourRate: 320, totalValue: 2560, status: "pending",  receivedAt: "08 Jan 2025 16:44", expiresAt: "10 Jan 2025 16:44", priority: "normal", notes: "" },
  { id: "r4",  ref: "REQ-20904", agentName: "GulfWing Holidays",        agentId: "AGT-10055", serviceId: "s4", serviceName: "Presidential Suite",    serviceType: "hotel",     checkIn: "25 Jan 2025", checkOut: "28 Jan 2025", nights: 3, guests: 4, rooms: 1, requestedRate: 1400, ourRate: 1600, totalValue: 4800, status: "countered", receivedAt: "07 Jan 2025 09:00", expiresAt: "08 Jan 2025 09:00", priority: "high",   notes: "Rate counter sent at AED 1,500/night" },
  { id: "r5",  ref: "REQ-20905", agentName: "Pearl Coast Agency",       agentId: "AGT-10072", serviceId: "s1", serviceName: "Deluxe King Room",     serviceType: "hotel",     checkIn: "10 Mar 2025", checkOut: "12 Mar 2025", nights: 2, guests: 2, rooms: 3, requestedRate: 460, ourRate: 480, totalValue: 2880, status: "accepted",  receivedAt: "07 Jan 2025 10:21", expiresAt: "08 Jan 2025 10:21", priority: "normal", notes: "" },
  { id: "r6",  ref: "REQ-20906", agentName: "Sunrise Travel & Tourism", agentId: "AGT-10042", serviceId: "s2", serviceName: "Executive Suite",       serviceType: "hotel",     checkIn: "05 Feb 2025", checkOut: "08 Feb 2025", nights: 3, guests: 2, rooms: 1, requestedRate: 820, ourRate: 850, totalValue: 2550, status: "accepted",  receivedAt: "06 Jan 2025 14:00", expiresAt: "07 Jan 2025 14:00", priority: "normal", notes: "" },
  { id: "r7",  ref: "REQ-20907", agentName: "Emirates Getaways",        agentId: "AGT-10019", serviceId: "s5", serviceName: "Standard Room",         serviceType: "hotel",     checkIn: "18 Jan 2025", checkOut: "20 Jan 2025", nights: 2, guests: 1, rooms: 1, requestedRate: 200, ourRate: 240, totalValue: 480,  status: "rejected",  receivedAt: "05 Jan 2025 08:30", expiresAt: "06 Jan 2025 08:30", priority: "low",    notes: "Rate too far below minimum threshold" },
  { id: "r8",  ref: "REQ-20908", agentName: "AlMaskan Tours",           agentId: "AGT-10061", serviceId: "s3", serviceName: "Superior Twin Room",    serviceType: "hotel",     checkIn: "14 Feb 2025", checkOut: "16 Feb 2025", nights: 2, guests: 2, rooms: 2, requestedRate: 310, ourRate: 320, totalValue: 1280, status: "expired",   receivedAt: "04 Jan 2025 15:55", expiresAt: "05 Jan 2025 15:55", priority: "normal", notes: "" },
];

// ── Services ──────────────────────────────────────────
export const SERVICES: Service[] = [
  { id: "s1", name: "Deluxe King Room",    type: "hotel", category: "Room",   baseRate: 480,  currency: "AED", available: true,  status: "active",      capacity: 24, booked: 18, description: "Spacious deluxe room with king bed, city or sea view, 45 m².", amenities: ["Free Wi-Fi","Minibar","Smart TV","Rainfall Shower","Room Service"],               lastUpdated: "05 Jan 2025" },
  { id: "s2", name: "Executive Suite",     type: "hotel", category: "Suite",  baseRate: 850,  currency: "AED", available: true,  status: "active",      capacity: 8,  booked: 5,  description: "Separate living area, butler service, panoramic views, 90 m².", amenities: ["Butler Service","Free Wi-Fi","Kitchenette","Jacuzzi","Lounge Access"],          lastUpdated: "05 Jan 2025" },
  { id: "s3", name: "Superior Twin Room",  type: "hotel", category: "Room",   baseRate: 320,  currency: "AED", available: true,  status: "active",      capacity: 30, booked: 22, description: "Twin beds, contemporary décor, garden or pool view, 38 m².", amenities: ["Free Wi-Fi","Minibar","Smart TV","Work Desk","Daily Housekeeping"],              lastUpdated: "06 Jan 2025" },
  { id: "s4", name: "Presidential Suite",  type: "hotel", category: "Suite",  baseRate: 1600, currency: "AED", available: true,  status: "active",      capacity: 2,  booked: 1,  description: "Two-bedroom flagship suite, private terrace, full floor, 320 m².", amenities: ["Private Pool","Personal Chef","Rolls Royce Transfer","24h Butler","Art Collection"], lastUpdated: "04 Jan 2025" },
  { id: "s5", name: "Standard Room",       type: "hotel", category: "Room",   baseRate: 240,  currency: "AED", available: true,  status: "active",      capacity: 40, booked: 28, description: "Well-appointed room, city view, 32 m².",                    amenities: ["Free Wi-Fi","Smart TV","Daily Housekeeping","Work Desk"],                       lastUpdated: "07 Jan 2025" },
  { id: "s6", name: "Meeting Room A",      type: "hotel", category: "Event",  baseRate: 2200, currency: "AED", available: false, status: "maintenance", capacity: 1,  booked: 0,  description: "Boardroom for up to 20 pax, AV equipment, catering available.", amenities: ["AV Equipment","Whiteboard","Catering","High-Speed Wi-Fi","Video Conf"],         lastUpdated: "03 Jan 2025" },
  { id: "s7", name: "Spa Day Package",     type: "hotel", category: "Add-on", baseRate: 380,  currency: "AED", available: true,  status: "active",      capacity: 12, booked: 4,  description: "Full-day spa access, two treatments, healthy lunch included.", amenities: ["Hammam","Massage","Pool Access","Lunch","Refreshments"],                        lastUpdated: "08 Jan 2025" },
];

// ── Invoices ──────────────────────────────────────────
export const INVOICES: SupplierInvoice[] = [
  { id: "i1", number: "SINV-2025-001", agentName: "Sunrise Travel & Tourism", bookingRef: "REQ-20906", issuedDate: "06 Jan 2025", dueDate: "20 Jan 2025", amount: 2550,  vat: 127.5, total: 2677.5, status: "unpaid",  serviceName: "Executive Suite" },
  { id: "i2", number: "SINV-2025-002", agentName: "Pearl Coast Agency",       bookingRef: "REQ-20905", issuedDate: "07 Jan 2025", dueDate: "21 Jan 2025", amount: 2880,  vat: 144,   total: 3024,   status: "unpaid",  serviceName: "Deluxe King Room" },
  { id: "i3", number: "SINV-2024-048", agentName: "Blue Horizon Travels",     bookingRef: "REQ-20871", issuedDate: "18 Dec 2024", dueDate: "01 Jan 2025", amount: 4080,  vat: 204,   total: 4284,   status: "paid",    serviceName: "Executive Suite" },
  { id: "i4", number: "SINV-2024-047", agentName: "GulfWing Holidays",        bookingRef: "REQ-20869", issuedDate: "15 Dec 2024", dueDate: "29 Dec 2024", amount: 1440,  vat: 72,    total: 1512,   status: "paid",    serviceName: "Deluxe King Room" },
  { id: "i5", number: "SINV-2024-046", agentName: "Nile Star Tourism",        bookingRef: "REQ-20855", issuedDate: "05 Dec 2024", dueDate: "19 Dec 2024", amount: 1920,  vat: 96,    total: 2016,   status: "overdue", serviceName: "Superior Twin Room" },
  { id: "i6", number: "SINV-2024-045", agentName: "Emirates Getaways",        bookingRef: "REQ-20840", issuedDate: "01 Dec 2024", dueDate: "15 Dec 2024", amount: 3200,  vat: 160,   total: 3360,   status: "paid",    serviceName: "Presidential Suite" },
];

// ── Payments ──────────────────────────────────────────
export const PAYMENTS: Payment[] = [
  { id: "p1", invoiceRef: "SINV-2024-048", agentName: "Blue Horizon Travels", amount: 4284,   date: "02 Jan 2025", method: "Bank Transfer", status: "received",   ref: "TXN-BHT-8821" },
  { id: "p2", invoiceRef: "SINV-2024-047", agentName: "GulfWing Holidays",    amount: 1512,   date: "28 Dec 2024", method: "Bank Transfer", status: "received",   ref: "TXN-GWH-7743" },
  { id: "p3", invoiceRef: "SINV-2024-046", agentName: "Nile Star Tourism",    amount: 2016,   date: "18 Jan 2025", method: "Bank Transfer", status: "scheduled",  ref: "TXN-NST-PEND" },
  { id: "p4", invoiceRef: "SINV-2024-045", agentName: "Emirates Getaways",    amount: 3360,   date: "14 Dec 2024", method: "Bank Transfer", status: "received",   ref: "TXN-EG-6612" },
  { id: "p5", invoiceRef: "SINV-2025-001", agentName: "Sunrise Travel",       amount: 2677.5, date: "20 Jan 2025", method: "Bank Transfer", status: "scheduled",  ref: "TXN-SUN-PEND" },
  { id: "p6", invoiceRef: "SINV-2025-002", agentName: "Pearl Coast Agency",   amount: 3024,   date: "21 Jan 2025", method: "Bank Transfer", status: "scheduled",  ref: "TXN-PCA-PEND" },
];

// ── Contracts ─────────────────────────────────────────
export const CONTRACTS: Contract[] = [
  { id: "c1", title: "Preferred Partner Agreement",    agentName: "Sunrise Travel & Tourism", type: "Partnership",     signedDate: "12 Apr 2024", expiryDate: "11 Apr 2026", value: 250000, status: "active",         fileSize: "1.2 MB" },
  { id: "c2", title: "Rate Agreement FY2025",          agentName: "Blue Horizon Travels",     type: "Rate Contract",   signedDate: "01 Jan 2025", expiryDate: "31 Dec 2025", value: 180000, status: "active",         fileSize: "820 KB" },
  { id: "c3", title: "Corporate Account Agreement",    agentName: "GulfWing Holidays",        type: "Corporate",       signedDate: "15 Mar 2023", expiryDate: "14 Mar 2025", value: 120000, status: "expiring",       fileSize: "950 KB" },
  { id: "c4", title: "Bulk Booking MOU",               agentName: "Nile Star Tourism",        type: "MOU",             signedDate: "01 Jun 2024", expiryDate: "31 May 2025", value: 85000,  status: "active",         fileSize: "650 KB" },
  { id: "c5", title: "Allocation Agreement",           agentName: "Pearl Coast Agency",       type: "Allocation",      signedDate: "10 Jan 2024", expiryDate: "09 Jan 2025", value: 60000,  status: "pending_review", fileSize: "780 KB" },
  { id: "c6", title: "Service Level Agreement 2023",   agentName: "Emirates Getaways",        type: "SLA",             signedDate: "01 Apr 2022", expiryDate: "31 Mar 2024", value: 40000,  status: "expired",        fileSize: "540 KB" },
];

// ── Analytics ─────────────────────────────────────────
export const MONTHLY_REVENUE: MonthlyRevenue[] = [
  { month: "Aug", revenue: 82400,  bookings: 48 },
  { month: "Sep", revenue: 71200,  bookings: 41 },
  { month: "Oct", revenue: 94800,  bookings: 57 },
  { month: "Nov", revenue: 118600, bookings: 72 },
  { month: "Dec", revenue: 143200, bookings: 89 },
  { month: "Jan", revenue: 62100,  bookings: 34 },
];

export const RATING_BREAKDOWN: RatingBreakdown[] = [
  { category: "Cleanliness",    score: 4.9, reviews: 312 },
  { category: "Comfort",        score: 4.8, reviews: 312 },
  { category: "Location",       score: 4.7, reviews: 289 },
  { category: "Facilities",     score: 4.6, reviews: 301 },
  { category: "Value",          score: 4.4, reviews: 312 },
  { category: "Staff Service",  score: 4.9, reviews: 298 },
];

// ── Helpers ───────────────────────────────────────────
export const fmtAED = (n: number) =>
  "AED " + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const STATUS_CFG: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "text-amber-700",   bg: "bg-amber-100"   },
  accepted:  { label: "Accepted",  color: "text-emerald-700", bg: "bg-emerald-100" },
  rejected:  { label: "Rejected",  color: "text-red-700",     bg: "bg-red-100"     },
  countered: { label: "Countered", color: "text-violet-700",  bg: "bg-violet-100"  },
  expired:   { label: "Expired",   color: "text-slate-500",   bg: "bg-slate-100"   },
};

export const INV_STATUS: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  paid:    { label: "Paid",    color: "text-emerald-700", bg: "bg-emerald-100" },
  unpaid:  { label: "Unpaid",  color: "text-blue-700",    bg: "bg-blue-100"    },
  overdue: { label: "Overdue", color: "text-red-700",     bg: "bg-red-100"     },
  draft:   { label: "Draft",   color: "text-slate-500",   bg: "bg-slate-100"   },
};

export const PAY_STATUS: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  received:   { label: "Received",   color: "text-emerald-700", bg: "bg-emerald-100" },
  scheduled:  { label: "Scheduled",  color: "text-blue-700",    bg: "bg-blue-100"    },
  failed:     { label: "Failed",     color: "text-red-700",     bg: "bg-red-100"     },
  processing: { label: "Processing", color: "text-amber-700",   bg: "bg-amber-100"   },
};

export const CONTRACT_STATUS: Record<ContractStatus, { label: string; color: string; bg: string }> = {
  active:         { label: "Active",         color: "text-emerald-700", bg: "bg-emerald-100" },
  expiring:       { label: "Expiring Soon",  color: "text-amber-700",   bg: "bg-amber-100"   },
  expired:        { label: "Expired",        color: "text-red-700",     bg: "bg-red-100"     },
  pending_review: { label: "Pending Review", color: "text-violet-700",  bg: "bg-violet-100"  },
};
