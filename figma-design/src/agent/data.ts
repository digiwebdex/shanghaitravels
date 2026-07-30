export type BookingType   = "visa" | "ticket" | "hotel" | "transport" | "catering";
export type BookingStatus = "draft" | "submitted" | "processing" | "approved" | "completed" | "cancelled";
export type AgentTier     = "silver" | "gold" | "platinum";

export interface Passenger {
  id: string;
  passportNo: string;
  name: string;
  nationality: string;
  dob: string;
  passportExpiry: string;
  phone: string;
  email: string;
  tags: string[];
  bookings: number;
}

export interface AgentBooking {
  id: string;
  ref: string;
  type: BookingType;
  service: string;
  passengerCount: number;
  passengers: string[];
  status: BookingStatus;
  amount: number;
  commission: number;
  submittedDate: string;
  travelDate: string;
  destination: string;
  clientRef?: string;
}

export interface WalletTx {
  id: string;
  date: string;
  description: string;
  ref: string;
  amount: number;
  type: "credit" | "debit";
  balance: number;
}

export interface AgentInvoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  bookings: number;
  amount: number;
  commission: number;
  status: "paid" | "unpaid" | "overdue";
  description: string;
}

export interface CommissionMonth {
  month: string;
  earned: number;
  pending: number;
}

export interface ServiceCommission {
  type: BookingType;
  label: string;
  bookings: number;
  revenue: number;
  commission: number;
}

export const AGENT_PROFILE = {
  name: "Sunrise Travel & Tourism",
  agentId: "AGT-10042",
  tier: "gold" as AgentTier,
  commissionRate: 10,
  licenseNo: "DED-987654",
  iataCode: "97-4-8821",
  email: "ops@sunrisetravel.ae",
  phone: "+971 4 889 0042",
  address: "Suite 704, Al Manara Tower, Sheikh Zayed Road, Dubai, UAE",
  walletBalance: 28450,
  securityDeposit: 50000,
  securityLimit: 75000,
  creditLimit: 100000,
  accountManager: {
    name: "Nadia Al-Kaabi",
    phone: "+971 50 888 0011",
    email: "nadia@shanghaitravels.com",
  },
};

export const TIER_CFG: Record<AgentTier, { label: string; color: string; bg: string; minBookings: number; rate: number }> = {
  silver:   { label: "Silver",   color: "text-slate-600",  bg: "bg-slate-100",  minBookings: 0,   rate: 7  },
  gold:     { label: "Gold",     color: "text-amber-700",  bg: "bg-amber-100",  minBookings: 50,  rate: 10 },
  platinum: { label: "Platinum", color: "text-purple-700", bg: "bg-purple-100", minBookings: 150, rate: 13 },
};

export const PASSENGERS: Passenger[] = [
  { id: "p1",  passportNo: "UK9823441", name: "James Whitmore",       nationality: "United Kingdom", dob: "12 Mar 1979", passportExpiry: "18 Nov 2026", phone: "+44 7911 123456", email: "j.whitmore@email.co.uk",    tags: ["VIP","Corporate"],  bookings: 14 },
  { id: "p2",  passportNo: "AE4412987", name: "Fatima Al-Rashidi",    nationality: "UAE",            dob: "05 Jul 1990", passportExpiry: "22 Feb 2025", phone: "+971 50 223 4456", email: "fatima.ar@gmail.com",      tags: ["Corporate"],         bookings: 8  },
  { id: "p3",  passportNo: "IN8834201", name: "Rajesh Kumar",         nationality: "India",          dob: "28 Sep 1985", passportExpiry: "10 Aug 2028", phone: "+91 98201 34567",  email: "rajesh.k@tcs.com",         tags: ["Corporate"],         bookings: 22 },
  { id: "p4",  passportNo: "EG7712334", name: "Mohamed Khalil",       nationality: "Egypt",          dob: "15 Jan 1982", passportExpiry: "03 Jun 2027", phone: "+20 100 234 5678", email: "mkhalil@outlook.com",      tags: [],                    bookings: 5  },
  { id: "p5",  passportNo: "AU5521893", name: "Sarah Thompson",       nationality: "Australia",      dob: "02 Dec 1994", passportExpiry: "14 Mar 2029", phone: "+61 412 345 678",  email: "sarah.t@netmail.au",       tags: ["VIP"],               bookings: 11 },
  { id: "p6",  passportNo: "US3398712", name: "Michael Chen",         nationality: "United States",  dob: "19 Aug 1988", passportExpiry: "07 Jan 2026", phone: "+1 917 234 5678",  email: "mchen@gmail.com",          tags: ["VIP","Corporate"],   bookings: 18 },
  { id: "p7",  passportNo: "FR2241098", name: "Claire Beaumont",      nationality: "France",         dob: "31 May 1991", passportExpiry: "25 Apr 2028", phone: "+33 6 12 34 56 78","email": "c.beaumont@orange.fr",   tags: [],                    bookings: 3  },
  { id: "p8",  passportNo: "PK6673421", name: "Asif Mahmood",         nationality: "Pakistan",       dob: "08 Oct 1980", passportExpiry: "11 Dec 2024", phone: "+92 300 123 4567", email: "asif.m@yahoo.com",         tags: ["Corporate"],         bookings: 7  },
  { id: "p9",  passportNo: "JO4412009", name: "Hana Nasser",          nationality: "Jordan",         dob: "22 Feb 1996", passportExpiry: "30 Sep 2027", phone: "+962 79 123 4567", email: "hana.n@gmail.com",         tags: [],                    bookings: 2  },
  { id: "p10", passportNo: "JP8821003", name: "Kenji Tanaka",         nationality: "Japan",          dob: "14 Nov 1987", passportExpiry: "19 Jul 2029", phone: "+81 90 1234 5678", email: "k.tanaka@sony.co.jp",      tags: ["VIP"],               bookings: 9  },
  { id: "p11", passportNo: "PH3312789", name: "Maria Santos",         nationality: "Philippines",    dob: "07 Apr 1993", passportExpiry: "02 Feb 2027", phone: "+63 917 123 4567", email: "msantos@email.ph",         tags: [],                    bookings: 6  },
  { id: "p12", passportNo: "CN7890123", name: "Wei Zhang",            nationality: "China",          dob: "25 Jun 1984", passportExpiry: "15 Aug 2026", phone: "+86 138 0013 8000", email: "wei.zhang@alibaba.com",   tags: ["VIP","Corporate"],   bookings: 20 },
  { id: "p13", passportNo: "SE1123445", name: "Erik Lindqvist",       nationality: "Sweden",         dob: "11 Mar 1978", passportExpiry: "08 Nov 2028", phone: "+46 70 123 45 67", email: "erik.l@volvo.com",         tags: ["Corporate"],         bookings: 12 },
  { id: "p14", passportNo: "BD9934112", name: "Karim Hossain",        nationality: "Bangladesh",     dob: "18 Dec 1989", passportExpiry: "27 Mar 2027", phone: "+880 1711 123456", email: "karim.h@gmail.com",        tags: [],                    bookings: 4  },
  { id: "p15", passportNo: "IT5567234", name: "Giulia Romano",        nationality: "Italy",          dob: "03 Sep 1995", passportExpiry: "12 Oct 2029", phone: "+39 333 123 4567", email: "giulia.r@gmail.com",       tags: ["VIP"],               bookings: 7  },
  { id: "p16", passportNo: "TR8812001", name: "Ahmet Yilmaz",         nationality: "Turkey",         dob: "29 Jan 1986", passportExpiry: "04 May 2025", phone: "+90 532 123 45 67","email": "a.yilmaz@hotmail.com",   tags: [],                    bookings: 3  },
  { id: "p17", passportNo: "IE2234501", name: "Ciara O'Sullivan",     nationality: "Ireland",        dob: "16 Jul 1992", passportExpiry: "21 Jun 2028", phone: "+353 87 123 4567", email: "ciara.os@gmail.com",       tags: [],                    bookings: 1  },
  { id: "p18", passportNo: "CA9901234", name: "David Tremblay",       nationality: "Canada",         dob: "04 Feb 1983", passportExpiry: "09 Jan 2027", phone: "+1 514 123 4567",  email: "d.tremblay@bell.ca",       tags: ["Corporate"],         bookings: 10 },
  { id: "p19", passportNo: "SG6634521", name: "Li Wei Tan",           nationality: "Singapore",      dob: "20 Aug 1991", passportExpiry: "16 Sep 2026", phone: "+65 9123 4567",    email: "liwei.t@singtel.com",      tags: ["VIP","Corporate"],   bookings: 15 },
  { id: "p20", passportNo: "TH4412098", name: "Priya Patel",          nationality: "Thailand",       dob: "13 May 1997", passportExpiry: "28 Dec 2028", phone: "+66 81 234 5678",  email: "priya.p@gmail.com",        tags: [],                    bookings: 2  },
];

export const BOOKINGS: AgentBooking[] = [
  { id: "b1",  ref: "AGT-38801", type: "visa",      service: "UK Tourist Visa — 10 PAX",       passengerCount: 10, passengers: ["p1","p2","p3","p4","p5","p6","p7","p8","p9","p10"], status: "approved",    amount: 12000, commission: 1200, submittedDate: "02 Jan 2025", travelDate: "15 Feb 2025", destination: "United Kingdom",  clientRef: "CL-881" },
  { id: "b2",  ref: "AGT-38802", type: "ticket",    service: "EK Economy DXB→LHR Return",      passengerCount: 4,  passengers: ["p1","p5","p11","p14"],                               status: "completed",   amount: 8400,  commission: 840,  submittedDate: "28 Dec 2024", travelDate: "10 Jan 2025", destination: "United Kingdom",  clientRef: "CL-879" },
  { id: "b3",  ref: "AGT-38803", type: "hotel",     service: "Marriott London Mayfair — 7N",   passengerCount: 2,  passengers: ["p6","p12"],                                          status: "completed",   amount: 5600,  commission: 560,  submittedDate: "22 Dec 2024", travelDate: "05 Jan 2025", destination: "United Kingdom",  clientRef: "CL-870" },
  { id: "b4",  ref: "AGT-38804", type: "visa",      service: "Schengen Business Visa — 3 PAX", passengerCount: 3,  passengers: ["p13","p18","p19"],                                   status: "processing",  amount: 3600,  commission: 360,  submittedDate: "05 Jan 2025", travelDate: "20 Feb 2025", destination: "Germany",         clientRef: "CL-883" },
  { id: "b5",  ref: "AGT-38805", type: "transport", service: "Airport Transfers DXB — 20 PAX", passengerCount: 20, passengers: [],                                                    status: "submitted",   amount: 2800,  commission: 280,  submittedDate: "07 Jan 2025", travelDate: "14 Jan 2025", destination: "Dubai, UAE",      clientRef: "CL-884" },
  { id: "b6",  ref: "AGT-38806", type: "catering",  service: "Halal In-flight Meals — 45 PAX", passengerCount: 45, passengers: [],                                                   status: "approved",    amount: 4050,  commission: 405,  submittedDate: "03 Jan 2025", travelDate: "18 Jan 2025", destination: "Bangkok, Thailand", clientRef: "CL-882" },
  { id: "b7",  ref: "AGT-38807", type: "visa",      service: "UAE Tourist Visa — 6 PAX",       passengerCount: 6,  passengers: ["p7","p9","p16","p17","p20","p4"],                    status: "completed",   amount: 1800,  commission: 180,  submittedDate: "18 Dec 2024", travelDate: "28 Dec 2024", destination: "UAE",             clientRef: "CL-868" },
  { id: "b8",  ref: "AGT-38808", type: "ticket",    service: "GF Business BHR→DXB→JFK",        passengerCount: 2,  passengers: ["p10","p15"],                                         status: "processing",  amount: 14200, commission: 1420, submittedDate: "06 Jan 2025", travelDate: "22 Jan 2025", destination: "United States",   clientRef: "CL-885" },
  { id: "b9",  ref: "AGT-38809", type: "hotel",     service: "Jumeirah Beach Hotel — 4N",      passengerCount: 2,  passengers: ["p3","p6"],                                           status: "submitted",   amount: 3200,  commission: 320,  submittedDate: "08 Jan 2025", travelDate: "20 Jan 2025", destination: "Dubai, UAE",      clientRef: "CL-886" },
  { id: "b10", ref: "AGT-38810", type: "visa",      service: "Australia ETA — 8 PAX",          passengerCount: 8,  passengers: ["p2","p4","p8","p11","p14","p16","p17","p20"],        status: "draft",       amount: 2400,  commission: 240,  submittedDate: "09 Jan 2025", travelDate: "01 Mar 2025", destination: "Australia",       clientRef: "CL-887" },
  { id: "b11", ref: "AGT-38811", type: "transport", service: "Coach Transfer CDG — 30 PAX",    passengerCount: 30, passengers: [],                                                   status: "cancelled",   amount: 1800,  commission: 0,    submittedDate: "15 Dec 2024", travelDate: "10 Jan 2025", destination: "France",          clientRef: "CL-865" },
  { id: "b12", ref: "AGT-38812", type: "ticket",    service: "EK Economy DXB→SIN Return",      passengerCount: 5,  passengers: ["p3","p10","p12","p19","p5"],                         status: "approved",    amount: 6250,  commission: 625,  submittedDate: "01 Jan 2025", travelDate: "25 Jan 2025", destination: "Singapore",       clientRef: "CL-880" },
];

export const WALLET_TXS: WalletTx[] = [
  { id: "w1",  date: "09 Jan 2025", description: "Booking submission — AGT-38809",     ref: "AGT-38809", amount: 3200,  type: "debit",  balance: 28450 },
  { id: "w2",  date: "08 Jan 2025", description: "Commission credit — AGT-38801",      ref: "AGT-38801", amount: 1200,  type: "credit", balance: 31650 },
  { id: "w3",  date: "07 Jan 2025", description: "Booking submission — AGT-38805",     ref: "AGT-38805", amount: 2800,  type: "debit",  balance: 30450 },
  { id: "w4",  date: "06 Jan 2025", description: "Booking submission — AGT-38808",     ref: "AGT-38808", amount: 14200, type: "debit",  balance: 33250 },
  { id: "w5",  date: "05 Jan 2025", description: "Wallet top-up via bank transfer",    ref: "TOPUP-0105",amount: 20000, type: "credit", balance: 47450 },
  { id: "w6",  date: "03 Jan 2025", description: "Booking submission — AGT-38806",     ref: "AGT-38806", amount: 4050,  type: "debit",  balance: 27450 },
  { id: "w7",  date: "02 Jan 2025", description: "Booking submission — AGT-38801",     ref: "AGT-38801", amount: 12000, type: "debit",  balance: 31500 },
  { id: "w8",  date: "01 Jan 2025", description: "Commission credit — AGT-38802",      ref: "AGT-38802", amount: 840,   type: "credit", balance: 43500 },
  { id: "w9",  date: "28 Dec 2024", description: "Booking submission — AGT-38802",     ref: "AGT-38802", amount: 8400,  type: "debit",  balance: 42660 },
  { id: "w10", date: "22 Dec 2024", description: "Commission credit — AGT-38807",      ref: "AGT-38807", amount: 180,   type: "credit", balance: 51060 },
];

export const AGENT_INVOICES: AgentInvoice[] = [
  { id: "i1", number: "INV-2025-001", date: "01 Jan 2025", dueDate: "15 Jan 2025", bookings: 4,  amount: 31450, commission: 3145, status: "unpaid",  description: "January 2025 — Visa & Ticket bookings" },
  { id: "i2", number: "INV-2024-012", date: "01 Dec 2024", dueDate: "15 Dec 2024", bookings: 3,  amount: 15800, commission: 1580, status: "paid",    description: "December 2024 — Hotel & Transport bookings" },
  { id: "i3", number: "INV-2024-011", date: "01 Nov 2024", dueDate: "15 Nov 2024", bookings: 5,  amount: 22400, commission: 2240, status: "paid",    description: "November 2024 — Mixed service bookings" },
  { id: "i4", number: "INV-2024-010", date: "01 Oct 2024", dueDate: "15 Oct 2024", bookings: 2,  amount: 9100,  commission: 910,  status: "paid",    description: "October 2024 — Visa applications" },
  { id: "i5", number: "INV-2024-009", date: "01 Sep 2024", dueDate: "15 Sep 2024", bookings: 6,  amount: 18700, commission: 1870, status: "overdue", description: "September 2024 — Group tour services" },
  { id: "i6", number: "INV-2024-008", date: "01 Aug 2024", dueDate: "15 Aug 2024", bookings: 3,  amount: 7600,  commission: 760,  status: "paid",    description: "August 2024 — Ticket & Catering services" },
];

export const COMMISSION_MONTHS: CommissionMonth[] = [
  { month: "Aug",  earned: 3200, pending: 400  },
  { month: "Sep",  earned: 1870, pending: 0    },
  { month: "Oct",  earned: 910,  pending: 200  },
  { month: "Nov",  earned: 2240, pending: 300  },
  { month: "Dec",  earned: 1580, pending: 180  },
  { month: "Jan",  earned: 2430, pending: 3145 },
];

export const SERVICE_COMMISSION: ServiceCommission[] = [
  { type: "visa",      label: "Visa",      bookings: 4,  revenue: 19800, commission: 1980 },
  { type: "ticket",    label: "Ticket",    bookings: 3,  revenue: 28850, commission: 2885 },
  { type: "hotel",     label: "Hotel",     bookings: 2,  revenue: 8800,  commission: 880  },
  { type: "transport", label: "Transport", bookings: 2,  revenue: 4600,  commission: 280  },
  { type: "catering",  label: "Catering",  bookings: 1,  revenue: 4050,  commission: 405  },
];

export const STATUS_CFG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  draft:      { label: "Draft",      color: "text-slate-600",  bg: "bg-slate-100"   },
  submitted:  { label: "Submitted",  color: "text-blue-700",   bg: "bg-blue-100"    },
  processing: { label: "Processing", color: "text-amber-700",  bg: "bg-amber-100"   },
  approved:   { label: "Approved",   color: "text-emerald-700",bg: "bg-emerald-100" },
  completed:  { label: "Completed",  color: "text-purple-700", bg: "bg-purple-100"  },
  cancelled:  { label: "Cancelled",  color: "text-red-700",    bg: "bg-red-100"     },
};

export const TYPE_CFG: Record<BookingType, { label: string; color: string; bg: string }> = {
  visa:      { label: "Visa",      color: "text-blue-700",   bg: "bg-blue-50"    },
  ticket:    { label: "Ticket",    color: "text-purple-700", bg: "bg-purple-50"  },
  hotel:     { label: "Hotel",     color: "text-teal-700",   bg: "bg-teal-50"    },
  transport: { label: "Transport", color: "text-orange-700", bg: "bg-orange-50"  },
  catering:  { label: "Catering",  color: "text-pink-700",   bg: "bg-pink-50"    },
};

export const fmtAED = (n: number) =>
  "AED " + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** Returns "expired" | "soon" (within 6 months) | "ok" */
export const isPassportExpiringSoon = (expiry: string): "expired" | "soon" | "ok" => {
  const months: Record<string,number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  const parts = expiry.split(" ");
  if (parts.length < 3) return "ok";
  const d = parseInt(parts[0]), m = months[parts[1]], y = parseInt(parts[2]);
  if (isNaN(d) || m === undefined || isNaN(y)) return "ok";
  const exp = new Date(y, m, d);
  const now = new Date();
  const sixMonths = new Date(); sixMonths.setMonth(sixMonths.getMonth() + 6);
  if (exp <= now) return "expired";
  if (exp <= sixMonths) return "soon";
  return "ok";
};
