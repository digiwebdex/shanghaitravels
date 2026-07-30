export interface Employee {
  id: string; name: string; email: string; department: string;
  role: "employee" | "manager" | "admin"; employeeId: string;
  status: "active" | "inactive"; applications: number; totalSpend: number;
  joinDate: string; nationality: string;
}

export type AppStatus = "pending_approval" | "approved" | "processing" | "completed" | "rejected";
export type Priority  = "high" | "normal" | "low";

export interface CorpApplication {
  id: string; ref: string; employeeId: string; employeeName: string;
  department: string; service: string; destination: string; status: AppStatus;
  amount: number; submittedDate: string; travelDate: string; priority: Priority;
  approver?: string; notes?: string;
}

export interface Transaction {
  id: string; date: string; description: string; ref: string;
  amount: number; type: "debit" | "credit"; balance: number;
}

export interface Invoice {
  id: string; number: string; date: string; period: string;
  description: string;
  amount: number; status: "paid" | "unpaid" | "overdue" | "draft"; applications: number;
}

export const EMPLOYEES: Employee[] = [
  { id: "e01", name: "Fatima Al-Hassan",  email: "fatima@acme.ae",     department: "Executive",  role: "admin",    employeeId: "ACME-001", status: "active",   applications: 12, totalSpend: 68400, joinDate: "Jan 2020", nationality: "UAE" },
  { id: "e02", name: "Omar Shaikh",       email: "omar@acme.ae",       department: "Finance",    role: "manager",  employeeId: "ACME-002", status: "active",   applications: 8,  totalSpend: 38600, joinDate: "Mar 2021", nationality: "Pakistan" },
  { id: "e03", name: "Priya Nair",        email: "priya@acme.ae",      department: "Operations", role: "employee", employeeId: "ACME-003", status: "active",   applications: 5,  totalSpend: 21200, joinDate: "Jun 2022", nationality: "India" },
  { id: "e04", name: "James Thornton",    email: "james@acme.ae",      department: "Sales",      role: "manager",  employeeId: "ACME-004", status: "active",   applications: 14, totalSpend: 72300, joinDate: "Feb 2020", nationality: "UK" },
  { id: "e05", name: "Layla Al-Farsi",    email: "layla@acme.ae",      department: "HR",         role: "employee", employeeId: "ACME-005", status: "active",   applications: 3,  totalSpend: 9800,  joinDate: "Aug 2023", nationality: "UAE" },
  { id: "e06", name: "Mohammed Rashid",   email: "m.rashid@acme.ae",   department: "IT",         role: "employee", employeeId: "ACME-006", status: "active",   applications: 6,  totalSpend: 24100, joinDate: "Nov 2021", nationality: "Egypt" },
  { id: "e07", name: "Sarah Williams",    email: "sarah@acme.ae",      department: "Marketing",  role: "manager",  employeeId: "ACME-007", status: "active",   applications: 9,  totalSpend: 44500, joinDate: "Jan 2022", nationality: "Australia" },
  { id: "e08", name: "Khalid Mahmoud",    email: "khalid@acme.ae",     department: "Operations", role: "employee", employeeId: "ACME-008", status: "inactive", applications: 2,  totalSpend: 8200,  joinDate: "May 2023", nationality: "Jordan" },
  { id: "e09", name: "Ananya Patel",      email: "ananya@acme.ae",     department: "Finance",    role: "employee", employeeId: "ACME-009", status: "active",   applications: 4,  totalSpend: 16700, joinDate: "Sep 2022", nationality: "India" },
  { id: "e10", name: "David Chen",        email: "david@acme.ae",      department: "Executive",  role: "admin",    employeeId: "ACME-010", status: "active",   applications: 10, totalSpend: 57900, joinDate: "Mar 2019", nationality: "China" },
  { id: "e11", name: "Nora Eriksson",     email: "nora@acme.ae",       department: "Sales",      role: "employee", employeeId: "ACME-011", status: "active",   applications: 7,  totalSpend: 29300, joinDate: "Jul 2022", nationality: "Sweden" },
  { id: "e12", name: "Ahmed Al-Zaabi",    email: "ahmed@acme.ae",      department: "Marketing",  role: "employee", employeeId: "ACME-012", status: "active",   applications: 5,  totalSpend: 18900, joinDate: "Dec 2022", nationality: "UAE" },
];

export const APPLICATIONS: CorpApplication[] = [
  { id: "a01", ref: "TRV-38501", employeeId: "e04", employeeName: "James Thornton",  department: "Sales",      service: "UK Business Visa",       destination: "United Kingdom", status: "pending_approval", amount: 1800, submittedDate: "09 Jan 2025", travelDate: "01 Feb 2025", priority: "high",   approver: "Fatima Al-Hassan" },
  { id: "a02", ref: "TRV-38490", employeeId: "e07", employeeName: "Sarah Williams",  department: "Marketing",  service: "Schengen Visa",          destination: "Germany",        status: "pending_approval", amount: 1200, submittedDate: "08 Jan 2025", travelDate: "25 Jan 2025", priority: "normal", approver: "Fatima Al-Hassan" },
  { id: "a03", ref: "TRV-38477", employeeId: "e01", employeeName: "Fatima Al-Hassan",department: "Executive",  service: "US Business Visa",       destination: "United States",  status: "processing",       amount: 2400, submittedDate: "05 Jan 2025", travelDate: "15 Feb 2025", priority: "high" },
  { id: "a04", ref: "TRV-38460", employeeId: "e02", employeeName: "Omar Shaikh",     department: "Finance",    service: "Flight DXB–RUH",         destination: "Riyadh, KSA",    status: "approved",         amount: 3200, submittedDate: "03 Jan 2025", travelDate: "20 Jan 2025", priority: "normal" },
  { id: "a05", ref: "TRV-38441", employeeId: "e10", employeeName: "David Chen",      department: "Executive",  service: "Hotel — London 4 nights",destination: "London, UK",     status: "approved",         amount: 5600, submittedDate: "02 Jan 2025", travelDate: "18 Jan 2025", priority: "high" },
  { id: "a06", ref: "TRV-38420", employeeId: "e11", employeeName: "Nora Eriksson",   department: "Sales",      service: "Schengen Visa",          destination: "France",         status: "completed",        amount: 1100, submittedDate: "28 Dec 2024", travelDate: "10 Jan 2025", priority: "normal" },
  { id: "a07", ref: "TRV-38410", employeeId: "e03", employeeName: "Priya Nair",      department: "Operations", service: "UK Visit Visa",          destination: "United Kingdom", status: "rejected",         amount: 1400, submittedDate: "26 Dec 2024", travelDate: "05 Jan 2025", priority: "low",    notes: "Insufficient bank statements" },
  { id: "a08", ref: "TRV-38398", employeeId: "e06", employeeName: "Mohammed Rashid", department: "IT",         service: "Flight DXB–CAI",         destination: "Cairo, Egypt",   status: "completed",        amount: 2100, submittedDate: "22 Dec 2024", travelDate: "30 Dec 2024", priority: "normal" },
  { id: "a09", ref: "TRV-38380", employeeId: "e12", employeeName: "Ahmed Al-Zaabi",  department: "Marketing",  service: "UAE Visa Assistance",    destination: "UAE",            status: "completed",        amount: 800,  submittedDate: "18 Dec 2024", travelDate: "28 Dec 2024", priority: "low" },
  { id: "a10", ref: "TRV-38365", employeeId: "e09", employeeName: "Ananya Patel",    department: "Finance",    service: "Schengen Visa",          destination: "Netherlands",    status: "processing",       amount: 1300, submittedDate: "15 Dec 2024", travelDate: "28 Jan 2025", priority: "normal" },
  { id: "a11", ref: "TRV-38350", employeeId: "e04", employeeName: "James Thornton",  department: "Sales",      service: "Flight + Hotel New York", destination: "New York, USA",  status: "pending_approval", amount: 7800, submittedDate: "10 Jan 2025", travelDate: "05 Feb 2025", priority: "high",   approver: "Fatima Al-Hassan" },
  { id: "a12", ref: "TRV-38340", employeeId: "e07", employeeName: "Sarah Williams",  department: "Marketing",  service: "Tour Package",           destination: "Singapore",      status: "approved",         amount: 4200, submittedDate: "07 Jan 2025", travelDate: "30 Jan 2025", priority: "normal" },
];

export const TRANSACTIONS: Transaction[] = [
  { id: "tx01", date: "09 Jan 2025", description: "UK Business Visa — James Thornton",       ref: "TRV-38501",   amount: 1800,  type: "debit",  balance: 348200 },
  { id: "tx02", date: "08 Jan 2025", description: "Schengen Visa — Sarah Williams",           ref: "TRV-38490",   amount: 1200,  type: "debit",  balance: 350000 },
  { id: "tx03", date: "05 Jan 2025", description: "US Business Visa — Fatima Al-Hassan",      ref: "TRV-38477",   amount: 2400,  type: "debit",  balance: 351200 },
  { id: "tx04", date: "03 Jan 2025", description: "Flight DXB–RUH — Omar Shaikh",            ref: "TRV-38460",   amount: 3200,  type: "debit",  balance: 353600 },
  { id: "tx05", date: "02 Jan 2025", description: "Hotel London 4n — David Chen",             ref: "TRV-38441",   amount: 5600,  type: "debit",  balance: 356800 },
  { id: "tx06", date: "01 Jan 2025", description: "Credit top-up — Invoice INV-2024-12",      ref: "INV-2024-12", amount: 50000, type: "credit", balance: 362400 },
  { id: "tx07", date: "28 Dec 2024", description: "Schengen Visa — Nora Eriksson",            ref: "TRV-38420",   amount: 1100,  type: "debit",  balance: 312400 },
  { id: "tx08", date: "22 Dec 2024", description: "Flight DXB–CAI — Mohammed Rashid",        ref: "TRV-38398",   amount: 2100,  type: "debit",  balance: 313500 },
  { id: "tx09", date: "18 Dec 2024", description: "UAE Visa — Ahmed Al-Zaabi",                ref: "TRV-38380",   amount: 800,   type: "debit",  balance: 315600 },
  { id: "tx10", date: "01 Dec 2024", description: "Credit top-up — Invoice INV-2024-11",      ref: "INV-2024-11", amount: 75000, type: "credit", balance: 316400 },
];

export const INVOICES: Invoice[] = [
  { id: "inv01", number: "INV-2025-02", date: "31 Jan 2025", period: "Jan 2025", description: "Travel services — January 2025",  amount: 47800, status: "unpaid", applications: 15 },
  { id: "inv02", number: "INV-2025-01", date: "01 Jan 2025", period: "Dec 2024", description: "Travel services — December 2024", amount: 28700, status: "paid",   applications: 9  },
  { id: "inv03", number: "INV-2024-12", date: "01 Dec 2024", period: "Nov 2024", description: "Travel services — November 2024", amount: 41200, status: "paid",   applications: 13 },
  { id: "inv04", number: "INV-2024-11", date: "01 Nov 2024", period: "Oct 2024", description: "Travel services — October 2024",  amount: 35800, status: "paid",   applications: 11 },
  { id: "inv05", number: "INV-2024-10", date: "01 Oct 2024", period: "Sep 2024", description: "Travel services — September 2024",amount: 22300, status: "paid",   applications: 7  },
  { id: "inv06", number: "INV-2024-09", date: "01 Sep 2024", period: "Aug 2024", description: "Travel services — August 2024",   amount: 19600, status: "paid",   applications: 6  },
];

export const MONTHLY_SPEND = [
  { month: "Aug", spend: 22100, budget: 45000 },
  { month: "Sep", spend: 19600, budget: 45000 },
  { month: "Oct", spend: 31200, budget: 45000 },
  { month: "Nov", spend: 38700, budget: 50000 },
  { month: "Dec", spend: 28700, budget: 50000 },
  { month: "Jan", spend: 24200, budget: 50000 },
];

export const DEPT_SPEND = [
  { dept: "Executive",  spend: 126300, pct: 36 },
  { dept: "Sales",      spend: 101600, pct: 29 },
  { dept: "Marketing",  spend: 63400,  pct: 18 },
  { dept: "Finance",    spend: 55300,  pct: 16 },
  { dept: "Operations", spend: 29400,  pct: 8  },
  { dept: "IT",         spend: 24100,  pct: 7  },
  { dept: "HR",         spend: 9800,   pct: 3  },
];

export const CREDIT_LIMIT = 500000;
export const CREDIT_USED  = 347200;

export const STATUS_CFG: Record<AppStatus, { label: string; color: string; bg: string }> = {
  pending_approval: { label: "Pending Approval", color: "text-orange-700", bg: "bg-orange-100"  },
  approved:         { label: "Approved",          color: "text-blue-700",   bg: "bg-blue-100"    },
  processing:       { label: "Processing",        color: "text-sky-700",    bg: "bg-sky-100"     },
  completed:        { label: "Completed",         color: "text-green-700",  bg: "bg-green-100"  },
  rejected:         { label: "Rejected",          color: "text-red-700",    bg: "bg-red-100"     },
};

export const PRIORITY_CFG: Record<Priority, { label: string; dot: string }> = {
  high:   { label: "High",   dot: "bg-red-500"  },
  normal: { label: "Normal", dot: "bg-slate-400" },
  low:    { label: "Low",    dot: "bg-slate-300" },
};

export const fmtAED = (n: number) =>
  "AED " + n.toLocaleString("en-US");
