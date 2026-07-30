export interface CorporateCompany {
  id: string; name: string; tradeLicense: string; industry: string;
  contactName: string; contactEmail: string; contactPhone: string;
  address: string; emirate: string; country: string;
  creditLimitAED: number; creditUsedAED: number;
  paymentTermDays: number;
  status: "active"|"suspended"|"inactive";
  joinedAt: string; accountManager: string;
  totalSpend: number; ytdSpend: number;
  services: string[];
  contractExpiry: string;
}

export interface CorporateEmployee {
  id: string; companyId: string; name: string; designation: string;
  email: string; phone: string; nationality: string; passportNo: string;
  travelGrade: "economy"|"business"|"first"; hotelGrade: "3star"|"4star"|"5star";
  approvalRequired: boolean; status: "active"|"inactive";
}

export interface PricingRule {
  id: string; companyId: string; companyName: string;
  service: "flights"|"hotels"|"visa"|"transport"|"insurance"|"tours";
  ruleType: "percentage_discount"|"fixed_discount"|"markup"|"net_rate";
  value: number;
  appliesTo: string;
  validFrom: string; validTo: string; active: boolean;
}

export interface BillingRun {
  id: string; companyId: string; companyName: string;
  period: string; periodStart: string; periodEnd: string;
  itemCount: number; totalAED: number; discountAED: number; netAED: number;
  status: "draft"|"generated"|"sent"|"paid"|"overdue";
  generatedAt?: string; sentAt?: string; dueDate: string; paidAt?: string;
}

export interface CorporateInvoice {
  id: string; ref: string; companyId: string; companyName: string;
  billingRunId?: string; period: string;
  services: { label: string; amount: number }[];
  subtotal: number; discount: number; tax: number; total: number;
  status: "draft"|"sent"|"paid"|"overdue"|"disputed";
  issuedAt: string; dueDate: string; paidAt?: string; method?: string;
}

export interface CorporatePayment {
  id: string; companyId: string; companyName: string;
  invoiceRef: string; amount: number; method: "bank_transfer"|"card"|"cheque"|"cash";
  date: string; receivedBy: string; notes?: string;
}

// ── Companies ─────────────────────────────────────────────────────────────────
export const COMPANIES: CorporateCompany[] = [
  { id:"cc1", name:"PetroAbu Energy",         tradeLicense:"TR-AUH-12345", industry:"Oil & Gas",          contactName:"Rashid Al-Mansoori",    contactEmail:"rashid@petroabu.ae",     contactPhone:"+971 2 555 1234", address:"ADNOC District, Abu Dhabi", emirate:"Abu Dhabi", country:"UAE", creditLimitAED:500000, creditUsedAED:128000,  paymentTermDays:30, status:"active",    joinedAt:"01 Mar 2019", accountManager:"Ayesha Rahman",   totalSpend:4800000, ytdSpend:486000,  services:["Flights","Hotels","Visa","Transport"], contractExpiry:"31 Dec 2025" },
  { id:"cc2", name:"TechCorp Dubai",           tradeLicense:"TR-DXB-56789", industry:"Technology",         contactName:"Sarah Al-Sayed",         contactEmail:"sarah@techcorp.ae",     contactPhone:"+971 4 333 5678", address:"Internet City, Dubai",      emirate:"Dubai",     country:"UAE", creditLimitAED:250000, creditUsedAED:67000,   paymentTermDays:30, status:"active",    joinedAt:"15 Jun 2020", accountManager:"James Whitfield", totalSpend:1200000, ytdSpend:198000,  services:["Flights","Hotels","Insurance"],          contractExpiry:"30 Jun 2025" },
  { id:"cc3", name:"Emirates Group",           tradeLicense:"TR-DXB-11111", industry:"Finance",            contactName:"Omar Al-Mazrouei",       contactEmail:"omar@emirates.ae",     contactPhone:"+971 4 708 1000", address:"DAFZA, Dubai",              emirate:"Dubai",     country:"UAE", creditLimitAED:2000000,creditUsedAED:445000,  paymentTermDays:45, status:"active",    joinedAt:"01 Jan 2015", accountManager:"Ayesha Rahman",   totalSpend:22000000,ytdSpend:2100000, services:["Flights","Hotels","Visa","Transport","Tours"], contractExpiry:"31 Dec 2026" },
  { id:"cc4", name:"Al-Futtaim Group",         tradeLicense:"TR-DXB-22222", industry:"Retail",             contactName:"Mona Al-Futtaim",        contactEmail:"mona@alfuttaim.ae",   contactPhone:"+971 4 294 3000", address:"Festival City, Dubai",      emirate:"Dubai",     country:"UAE", creditLimitAED:800000, creditUsedAED:312000,  paymentTermDays:30, status:"active",    joinedAt:"10 Sep 2018", accountManager:"Lina Al-Sayed",   totalSpend:6200000, ytdSpend:580000,  services:["Flights","Hotels","Transport"],           contractExpiry:"30 Sep 2025" },
  { id:"cc5", name:"Infosys UAE",              tradeLicense:"TR-DXB-33333", industry:"Technology",         contactName:"Arjun Sharma",           contactEmail:"arjun@infosys.ae",    contactPhone:"+971 4 438 1000", address:"DIC, Dubai",                emirate:"Dubai",     country:"UAE", creditLimitAED:150000, creditUsedAED:28000,   paymentTermDays:30, status:"active",    joinedAt:"01 Apr 2021", accountManager:"Omar Hassan",     totalSpend:480000,  ytdSpend:88000,   services:["Flights","Hotels"],                      contractExpiry:"31 Mar 2026" },
  { id:"cc6", name:"Saudi National Bank",      tradeLicense:"TR-KSA-12345", industry:"Banking",            contactName:"Fahad Al-Ghamdi",        contactEmail:"fahad@snb.com.sa",    contactPhone:"+966 11 405 0000",address:"King Fahad Rd, Riyadh",     emirate:"N/A",       country:"KSA",creditLimitAED:350000, creditUsedAED:0,       paymentTermDays:60, status:"inactive",  joinedAt:"01 Jul 2022", accountManager:"James Whitfield", totalSpend:120000,  ytdSpend:0,        services:["Flights","Hotels"],                      contractExpiry:"30 Jun 2024" },
];

// ── Employees ─────────────────────────────────────────────────────────────────
export const CORP_EMPLOYEES: CorporateEmployee[] = [
  { id:"ce1", companyId:"cc1", name:"Rashid Al-Mansoori",    designation:"CEO",                  email:"rashid@petroabu.ae",    phone:"+971 50 111 2233", nationality:"Emirati",  passportNo:"UAE-33221100", travelGrade:"first",   hotelGrade:"5star", approvalRequired:false, status:"active" },
  { id:"ce2", companyId:"cc1", name:"Mohammed Al-Farsi",     designation:"Senior Engineer",       email:"mfarsi@petroabu.ae",    phone:"+971 52 223 3344", nationality:"Omani",    passportNo:"OM-12345678",  travelGrade:"business",hotelGrade:"4star", approvalRequired:true,  status:"active" },
  { id:"ce3", companyId:"cc2", name:"Sarah Al-Sayed",         designation:"HR Director",           email:"sarah@techcorp.ae",     phone:"+971 55 334 4455", nationality:"Emirati",  passportNo:"UAE-55443322", travelGrade:"business",hotelGrade:"4star", approvalRequired:false, status:"active" },
  { id:"ce4", companyId:"cc2", name:"David Okafor",           designation:"Product Manager",       email:"david@techcorp.ae",     phone:"+971 56 445 5566", nationality:"Nigerian", passportNo:"NG-A1234567",  travelGrade:"economy", hotelGrade:"3star", approvalRequired:true,  status:"active" },
  { id:"ce5", companyId:"cc3", name:"Omar Al-Mazrouei",       designation:"CFO",                   email:"omar@emirates.ae",      phone:"+971 50 556 6677", nationality:"Emirati",  passportNo:"UAE-77665544", travelGrade:"first",   hotelGrade:"5star", approvalRequired:false, status:"active" },
  { id:"ce6", companyId:"cc3", name:"Elena Vasquez",          designation:"Regional Director",     email:"elena@emirates.ae",     phone:"+971 55 667 7788", nationality:"Spanish",  passportNo:"ES-ABC12345",  travelGrade:"business",hotelGrade:"5star", approvalRequired:true,  status:"active" },
  { id:"ce7", companyId:"cc4", name:"Mona Al-Futtaim",        designation:"Group Travel Manager",  email:"mona@alfuttaim.ae",     phone:"+971 50 778 8899", nationality:"Emirati",  passportNo:"UAE-99887766", travelGrade:"business",hotelGrade:"4star", approvalRequired:false, status:"active" },
];

// ── Pricing Rules ─────────────────────────────────────────────────────────────
export const PRICING_RULES: PricingRule[] = [
  { id:"pr1", companyId:"cc1", companyName:"PetroAbu Energy",  service:"flights",   ruleType:"percentage_discount", value:8,  appliesTo:"All business/first class fares",      validFrom:"01 Jan 2025", validTo:"31 Dec 2025", active:true  },
  { id:"pr2", companyId:"cc1", companyName:"PetroAbu Energy",  service:"hotels",    ruleType:"percentage_discount", value:15, appliesTo:"All 4★ and 5★ hotels",               validFrom:"01 Jan 2025", validTo:"31 Dec 2025", active:true  },
  { id:"pr3", companyId:"cc2", companyName:"TechCorp Dubai",   service:"flights",   ruleType:"percentage_discount", value:5,  appliesTo:"Economy class, domestic routes",      validFrom:"01 Jan 2025", validTo:"30 Jun 2025", active:true  },
  { id:"pr4", companyId:"cc3", companyName:"Emirates Group",   service:"flights",   ruleType:"net_rate",            value:0,  appliesTo:"All EK/FZ fares (direct contract)",   validFrom:"01 Jan 2025", validTo:"31 Dec 2026", active:true  },
  { id:"pr5", companyId:"cc3", companyName:"Emirates Group",   service:"visa",      ruleType:"fixed_discount",      value:200,appliesTo:"All visa types",                      validFrom:"01 Jan 2025", validTo:"31 Dec 2026", active:true  },
  { id:"pr6", companyId:"cc4", companyName:"Al-Futtaim Group", service:"transport", ruleType:"percentage_discount", value:10, appliesTo:"All airport transfers",               validFrom:"01 Jan 2025", validTo:"30 Sep 2025", active:true  },
  { id:"pr7", companyId:"cc4", companyName:"Al-Futtaim Group", service:"hotels",    ruleType:"percentage_discount", value:12, appliesTo:"All properties in UAE",               validFrom:"01 Jan 2025", validTo:"30 Sep 2025", active:true  },
];

// ── Billing Runs ──────────────────────────────────────────────────────────────
export const BILLING_RUNS: BillingRun[] = [
  { id:"br1", companyId:"cc1", companyName:"PetroAbu Energy", period:"Dec 2024", periodStart:"01 Dec 2024", periodEnd:"31 Dec 2024", itemCount:24, totalAED:128000, discountAED:12800, netAED:115200, status:"paid",      generatedAt:"02 Jan 2025", sentAt:"03 Jan 2025", dueDate:"02 Feb 2025", paidAt:"15 Jan 2025" },
  { id:"br2", companyId:"cc2", companyName:"TechCorp Dubai",  period:"Dec 2024", periodStart:"01 Dec 2024", periodEnd:"31 Dec 2024", itemCount:12, totalAED:42000,  discountAED:2100,  netAED:39900,  status:"paid",      generatedAt:"02 Jan 2025", sentAt:"03 Jan 2025", dueDate:"02 Feb 2025", paidAt:"20 Jan 2025" },
  { id:"br3", companyId:"cc3", companyName:"Emirates Group",  period:"Dec 2024", periodStart:"01 Dec 2024", periodEnd:"31 Dec 2024", itemCount:98, totalAED:445000, discountAED:44500, netAED:400500, status:"overdue",   generatedAt:"02 Jan 2025", sentAt:"03 Jan 2025", dueDate:"02 Feb 2025" },
  { id:"br4", companyId:"cc4", companyName:"Al-Futtaim Group",period:"Dec 2024", periodStart:"01 Dec 2024", periodEnd:"31 Dec 2024", itemCount:38, totalAED:88000,  discountAED:10560, netAED:77440,  status:"sent",      generatedAt:"02 Jan 2025", sentAt:"04 Jan 2025", dueDate:"02 Feb 2025" },
  { id:"br5", companyId:"cc1", companyName:"PetroAbu Energy", period:"Jan 2025", periodStart:"01 Jan 2025", periodEnd:"31 Jan 2025", itemCount:0,  totalAED:0,      discountAED:0,     netAED:0,      status:"draft",     dueDate:"02 Mar 2025" },
];

// ── Invoices ──────────────────────────────────────────────────────────────────
export const CORP_INVOICES: CorporateInvoice[] = [
  { id:"ci1", ref:"CI-2025-001", companyId:"cc1", companyName:"PetroAbu Energy", billingRunId:"br1", period:"Dec 2024", services:[{label:"Flights",amount:68000},{label:"Hotels",amount:38000},{label:"Visas",amount:12000},{label:"Transport",amount:10000}], subtotal:128000, discount:12800, tax:0, total:115200, status:"paid",    issuedAt:"03 Jan 2025", dueDate:"02 Feb 2025", paidAt:"15 Jan 2025", method:"bank_transfer" },
  { id:"ci2", ref:"CI-2025-002", companyId:"cc2", companyName:"TechCorp Dubai",  billingRunId:"br2", period:"Dec 2024", services:[{label:"Flights",amount:28000},{label:"Hotels",amount:12000},{label:"Insurance",amount:2000}],                                 subtotal:42000,  discount:2100,  tax:0, total:39900,  status:"paid",    issuedAt:"03 Jan 2025", dueDate:"02 Feb 2025", paidAt:"20 Jan 2025", method:"bank_transfer" },
  { id:"ci3", ref:"CI-2025-003", companyId:"cc3", companyName:"Emirates Group",  billingRunId:"br3", period:"Dec 2024", services:[{label:"Flights",amount:280000},{label:"Hotels",amount:120000},{label:"Visas",amount:45000}],                                  subtotal:445000, discount:44500, tax:0, total:400500, status:"overdue",  issuedAt:"03 Jan 2025", dueDate:"02 Feb 2025" },
  { id:"ci4", ref:"CI-2025-004", companyId:"cc4", companyName:"Al-Futtaim Group",billingRunId:"br4", period:"Dec 2024", services:[{label:"Flights",amount:52000},{label:"Hotels",amount:28000},{label:"Transport",amount:8000}],                                  subtotal:88000,  discount:10560, tax:0, total:77440,  status:"sent",    issuedAt:"04 Jan 2025", dueDate:"02 Feb 2025" },
  { id:"ci5", ref:"CI-2024-098", companyId:"cc1", companyName:"PetroAbu Energy", period:"Nov 2024",  services:[{label:"Flights",amount:98000},{label:"Hotels",amount:34000}],                                                                                     subtotal:132000, discount:13200, tax:0, total:118800, status:"paid",    issuedAt:"02 Dec 2024", dueDate:"01 Jan 2025", paidAt:"22 Dec 2024" },
];

// ── Payments ──────────────────────────────────────────────────────────────────
export const CORP_PAYMENTS: CorporatePayment[] = [
  { id:"cp1", companyId:"cc1", companyName:"PetroAbu Energy", invoiceRef:"CI-2025-001", amount:115200, method:"bank_transfer", date:"15 Jan 2025", receivedBy:"Ayesha Rahman"   },
  { id:"cp2", companyId:"cc2", companyName:"TechCorp Dubai",  invoiceRef:"CI-2025-002", amount:39900,  method:"bank_transfer", date:"20 Jan 2025", receivedBy:"James Whitfield" },
  { id:"cp3", companyId:"cc1", companyName:"PetroAbu Energy", invoiceRef:"CI-2024-098", amount:118800, method:"bank_transfer", date:"22 Dec 2024", receivedBy:"Ayesha Rahman"   },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
