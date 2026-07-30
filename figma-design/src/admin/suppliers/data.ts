export type SupplierType = "airline"|"hotel"|"transport"|"courier"|"insurance";
export type ContractStatus = "active"|"expired"|"pending_renewal"|"terminated";
export type SupplierStatus = "active"|"inactive"|"suspended";

export interface Supplier {
  id: string; name: string; type: SupplierType; country: string; city: string;
  contactName: string; contactEmail: string; contactPhone: string;
  website: string; accountCode: string;
  creditTermDays: number; creditLimitAED: number;
  commissionPct: number; overrideAED: number;
  status: SupplierStatus; rating: number;
  joinedAt: string; accountManager: string;
  tags: string[];
}

export interface Contract {
  id: string; supplierId: string; supplierName: string; supplierType: SupplierType;
  contractNo: string; description: string;
  startDate: string; endDate: string;
  value: number; currency: string;
  terms: string; discountPct: number; overrideAED: number;
  renewalNotice: number;
  status: ContractStatus;
  signedAt?: string; signedBy?: string;
  documentUrl?: string;
}

export interface PerformanceScore {
  id: string; supplierId: string; supplierName: string; supplierType: SupplierType;
  period: string;
  onTimeDelivery: number;
  responseTime: number;
  disputeRate: number;
  satisfactionScore: number;
  overallScore: number;
  totalTransactions: number;
  totalVolumeAED: number;
  issues: string[];
  trend: "up"|"down"|"stable";
}

export interface SupplierInvoice {
  id: string; ref: string; supplierId: string; supplierName: string; supplierType: SupplierType;
  description: string; amount: number; currency: string; amountAED: number;
  issuedAt: string; dueDate: string; paidAt?: string;
  status: "received"|"approved"|"paid"|"disputed"|"overdue";
}

export interface SupplierPayment {
  id: string; supplierId: string; supplierName: string;
  invoiceRef: string; amountAED: number;
  method: "bank_transfer"|"cheque"|"card"|"cash";
  date: string; processedBy: string; notes?: string;
  bankRef?: string;
}

// ── Suppliers ─────────────────────────────────────────────────────────────────
export const SUPPLIERS: Supplier[] = [
  // Airlines
  { id:"s1",  name:"Emirates Airlines",      type:"airline",    country:"UAE",    city:"Dubai",     contactName:"Tariq Al-Rashidi",    contactEmail:"b2b@emirates.com",      contactPhone:"+971 4 708 1111", website:"emirates.com",     accountCode:"EK-B2B-001", creditTermDays:30, creditLimitAED:2000000, commissionPct:7,  overrideAED:0,   status:"active", rating:4.9, joinedAt:"01 Jan 2015", accountManager:"Ayesha Rahman",   tags:["GDS","Direct","NDC"]          },
  { id:"s2",  name:"flydubai",               type:"airline",    country:"UAE",    city:"Dubai",     contactName:"Omar Hassan",         contactEmail:"agents@flydubai.com",   contactPhone:"+971 4 301 0800", website:"flydubai.com",     accountCode:"FZ-B2B-001", creditTermDays:14, creditLimitAED:500000,  commissionPct:5,  overrideAED:0,   status:"active", rating:4.6, joinedAt:"15 Mar 2018", accountManager:"Ayesha Rahman",   tags:["GDS","Direct"]                },
  { id:"s3",  name:"Qatar Airways",          type:"airline",    country:"Qatar",  city:"Doha",      contactName:"Hamad Al-Kuwari",    contactEmail:"b2b@qatarairways.com",  contactPhone:"+974 4023 0000", website:"qatarairways.com", accountCode:"QR-B2B-001", creditTermDays:30, creditLimitAED:1000000, commissionPct:6,  overrideAED:50,  status:"active", rating:4.8, joinedAt:"01 Jun 2016", accountManager:"James Whitfield", tags:["GDS","IATA"]                  },
  { id:"s4",  name:"Etihad Airways",         type:"airline",    country:"UAE",    city:"Abu Dhabi", contactName:"Fatima Al-Mansoori", contactEmail:"agents@etihad.ae",      contactPhone:"+971 2 599 0000", website:"etihad.com",       accountCode:"EY-B2B-001", creditTermDays:30, creditLimitAED:800000,  commissionPct:6,  overrideAED:30,  status:"active", rating:4.7, joinedAt:"01 Jan 2016", accountManager:"James Whitfield", tags:["GDS","NDC"]                   },
  // Hotels
  { id:"s5",  name:"Marriott International", type:"hotel",      country:"USA",    city:"Bethesda",  contactName:"Jason Miller",        contactEmail:"gsa@marriott.com",      contactPhone:"+1 301 380 3000",website:"marriott.com",     accountCode:"MAR-B2B-001",creditTermDays:30, creditLimitAED:500000,  commissionPct:10, overrideAED:0,   status:"active", rating:4.7, joinedAt:"01 Apr 2017", accountManager:"Lina Al-Sayed",   tags:["GDS","Direct","Extranet"]     },
  { id:"s6",  name:"Hilton Hotels & Resorts",type:"hotel",      country:"USA",    city:"McLean",    contactName:"Lisa Chen",            contactEmail:"gsa@hilton.com",        contactPhone:"+1 703 883 1000",website:"hilton.com",       accountCode:"HH-B2B-001", creditTermDays:30, creditLimitAED:400000,  commissionPct:10, overrideAED:0,   status:"active", rating:4.6, joinedAt:"15 May 2017", accountManager:"Lina Al-Sayed",   tags:["GDS","Direct"]                },
  { id:"s7",  name:"HotelsPro Bed Bank",     type:"hotel",      country:"UK",     city:"London",    contactName:"George Reynolds",     contactEmail:"suppliers@hotelspro.com",contactPhone:"+44 20 3540 6900",website:"hotelspro.com",   accountCode:"HPR-B2B-001",creditTermDays:21, creditLimitAED:200000,  commissionPct:12, overrideAED:0,   status:"active", rating:4.4, joinedAt:"01 Jan 2020", accountManager:"Omar Hassan",     tags:["Bed Bank","Wholesale"]        },
  // Transport
  { id:"s8",  name:"Careem Business",        type:"transport",  country:"UAE",    city:"Dubai",     contactName:"Priya Sharma",        contactEmail:"b2b@careem.com",        contactPhone:"+971 4 222 0500", website:"careem.com",       accountCode:"CR-B2B-001", creditTermDays:30, creditLimitAED:100000,  commissionPct:8,  overrideAED:0,   status:"active", rating:4.5, joinedAt:"01 Jan 2021", accountManager:"Omar Hassan",     tags:["App-based","Aggregator"]      },
  { id:"s9",  name:"National Rent A Car",    type:"transport",  country:"UAE",    city:"Dubai",     contactName:"Ahmed Al-Mahrami",    contactEmail:"fleet@nationalrentacar.ae",contactPhone:"+971 4 288 1111",website:"nationalrentacar.ae",accountCode:"NRC-B2B-001",creditTermDays:30,creditLimitAED:150000,commissionPct:10,overrideAED:0,status:"active",rating:4.6,joinedAt:"01 Jun 2019",accountManager:"Lina Al-Sayed",tags:["Rental","B2B"] },
  // Courier
  { id:"s10", name:"DHL Express UAE",        type:"courier",    country:"UAE",    city:"Dubai",     contactName:"Klaus Weber",          contactEmail:"express.uae@dhl.com",   contactPhone:"+971 600 567 567",website:"dhl.com",          accountCode:"DHL-B2B-001",creditTermDays:30, creditLimitAED:50000,   commissionPct:0,  overrideAED:0,   status:"active", rating:4.8, joinedAt:"01 Jan 2018", accountManager:"James Whitfield", tags:["Express","International"]     },
  { id:"s11", name:"FedEx UAE",              type:"courier",    country:"UAE",    city:"Dubai",     contactName:"Maria Santos",         contactEmail:"uae@fedex.com",          contactPhone:"+971 4 220 4800", website:"fedex.com",        accountCode:"FX-B2B-001", creditTermDays:30, creditLimitAED:40000,   commissionPct:0,  overrideAED:0,   status:"active", rating:4.7, joinedAt:"15 Feb 2019", accountManager:"James Whitfield", tags:["Express","International"]     },
  // Insurance
  { id:"s12", name:"AIG Insurance UAE",      type:"insurance",  country:"UAE",    city:"Dubai",     contactName:"Ahmed Al-Sayed",      contactEmail:"partners@aig.ae",       contactPhone:"+971 4 232 5000", website:"aig.ae",           accountCode:"AIG-B2B-001",creditTermDays:30, creditLimitAED:0,       commissionPct:12, overrideAED:0,   status:"active", rating:4.7, joinedAt:"01 Mar 2019", accountManager:"Ayesha Rahman",   tags:["Travel","Medical","Corporate"]},
  { id:"s13", name:"Daman Insurance",        type:"insurance",  country:"UAE",    city:"Abu Dhabi", contactName:"Mariam Al-Zaabi",     contactEmail:"brokers@damanhealth.ae",contactPhone:"+971 2 614 6666", website:"damanhealth.ae",   accountCode:"DAM-B2B-001",creditTermDays:30, creditLimitAED:0,       commissionPct:9,  overrideAED:0,   status:"active", rating:4.7, joinedAt:"01 Jun 2020", accountManager:"Lina Al-Sayed",   tags:["Medical","Group"]             },
];

// ── Contracts ─────────────────────────────────────────────────────────────────
export const CONTRACTS: Contract[] = [
  { id:"con1", supplierId:"s1",  supplierName:"Emirates Airlines",       supplierType:"airline",   contractNo:"EK-2025-001", description:"Annual Preferred Carrier Agreement",     startDate:"01 Jan 2025", endDate:"31 Dec 2025", value:12000000, currency:"AED", terms:"7% base commission + AED 0 override per sector. Full NDC access.", discountPct:7,  overrideAED:0,   renewalNotice:90, status:"active",           signedAt:"28 Dec 2024", signedBy:"Director" },
  { id:"con2", supplierId:"s3",  supplierName:"Qatar Airways",           supplierType:"airline",   contractNo:"QR-2025-001", description:"Annual Agency Agreement",                startDate:"01 Jan 2025", endDate:"31 Dec 2025", value:4000000,  currency:"AED", terms:"6% commission + AED 50 override per booking.",                       discountPct:6,  overrideAED:50,  renewalNotice:60, status:"active",           signedAt:"29 Dec 2024", signedBy:"Director" },
  { id:"con3", supplierId:"s5",  supplierName:"Marriott International",  supplierType:"hotel",     contractNo:"MAR-2025-001",description:"Global Hotel Programme Agreement",        startDate:"01 Jan 2025", endDate:"31 Dec 2025", value:3500000,  currency:"AED", terms:"10% commission on net rates. Preferred property list included.",     discountPct:10, overrideAED:0,   renewalNotice:90, status:"active",           signedAt:"27 Dec 2024", signedBy:"Ayesha Rahman" },
  { id:"con4", supplierId:"s8",  supplierName:"Careem Business",         supplierType:"transport", contractNo:"CR-2025-001", description:"Corporate Ground Transport SLA",          startDate:"01 Jan 2025", endDate:"31 Dec 2025", value:800000,   currency:"AED", terms:"8% discount on corporate dashboard rates. Priority dispatch.",       discountPct:8,  overrideAED:0,   renewalNotice:30, status:"active",           signedAt:"30 Dec 2024", signedBy:"James Whitfield" },
  { id:"con5", supplierId:"s12", supplierName:"AIG Insurance UAE",       supplierType:"insurance", contractNo:"AIG-2025-001",description:"Insurance Brokerage Agreement",           startDate:"01 Jan 2025", endDate:"31 Dec 2025", value:500000,   currency:"AED", terms:"12% commission on all travel policies. 8% medical.",                discountPct:12, overrideAED:0,   renewalNotice:60, status:"active",           signedAt:"28 Dec 2024", signedBy:"Ayesha Rahman" },
  { id:"con6", supplierId:"s7",  supplierName:"HotelsPro Bed Bank",      supplierType:"hotel",     contractNo:"HPR-2024-001",description:"Wholesale Bed Bank Agreement",             startDate:"01 Jan 2024", endDate:"31 Dec 2024", value:1200000,  currency:"AED", terms:"Net rate access, 12% markup allowed. No commission model.",         discountPct:0,  overrideAED:0,   renewalNotice:60, status:"expired",          signedAt:"28 Dec 2023", signedBy:"Director" },
];

// ── Performance Scorecards ────────────────────────────────────────────────────
export const SCORECARDS: PerformanceScore[] = [
  { id:"ps1", supplierId:"s1",  supplierName:"Emirates Airlines",      supplierType:"airline",   period:"Q4 2024", onTimeDelivery:94, responseTime:98, disputeRate:1,  satisfactionScore:96, overallScore:96, totalTransactions:1248, totalVolumeAED:8400000, issues:[],                                        trend:"stable" },
  { id:"ps2", supplierId:"s3",  supplierName:"Qatar Airways",          supplierType:"airline",   period:"Q4 2024", onTimeDelivery:88, responseTime:92, disputeRate:3,  satisfactionScore:89, overallScore:88, totalTransactions:412,  totalVolumeAED:2100000, issues:["3 PNR reissue disputes"],                trend:"down"   },
  { id:"ps3", supplierId:"s5",  supplierName:"Marriott International", supplierType:"hotel",     period:"Q4 2024", onTimeDelivery:98, responseTime:95, disputeRate:0.5,satisfactionScore:97, overallScore:97, totalTransactions:224,  totalVolumeAED:1800000, issues:[],                                        trend:"up"     },
  { id:"ps4", supplierId:"s8",  supplierName:"Careem Business",        supplierType:"transport", period:"Q4 2024", onTimeDelivery:91, responseTime:99, disputeRate:2,  satisfactionScore:88, overallScore:90, totalTransactions:886,  totalVolumeAED:320000,  issues:["2 late pick-up complaints Q4"],          trend:"stable" },
  { id:"ps5", supplierId:"s10", supplierName:"DHL Express UAE",        supplierType:"courier",   period:"Q4 2024", onTimeDelivery:97, responseTime:96, disputeRate:0.5,satisfactionScore:95, overallScore:96, totalTransactions:312,  totalVolumeAED:180000,  issues:[],                                        trend:"up"     },
  { id:"ps6", supplierId:"s12", supplierName:"AIG Insurance UAE",      supplierType:"insurance", period:"Q4 2024", onTimeDelivery:99, responseTime:94, disputeRate:4,  satisfactionScore:85, overallScore:89, totalTransactions:98,   totalVolumeAED:420000,  issues:["Slow claims processing Nov–Dec","1 disputed travel claim"], trend:"down" },
];

// ── Supplier Invoices ─────────────────────────────────────────────────────────
export const SUPPLIER_INVOICES: SupplierInvoice[] = [
  { id:"si1", ref:"EK-INV-2024-1201", supplierId:"s1",  supplierName:"Emirates Airlines",      supplierType:"airline",   description:"BSP Reconciliation Dec 2024",      amount:6800000, currency:"AED", amountAED:6800000, issuedAt:"05 Jan 2025", dueDate:"04 Feb 2025", status:"approved" },
  { id:"si2", ref:"QR-INV-2024-1201", supplierId:"s3",  supplierName:"Qatar Airways",          supplierType:"airline",   description:"BSP Reconciliation Dec 2024",      amount:1850000, currency:"AED", amountAED:1850000, issuedAt:"06 Jan 2025", dueDate:"05 Feb 2025", status:"received" },
  { id:"si3", ref:"MAR-INV-2024-DEC", supplierId:"s5",  supplierName:"Marriott International", supplierType:"hotel",     description:"Hotel Net Rates Dec 2024",          amount:480000,  currency:"AED", amountAED:480000,  issuedAt:"03 Jan 2025", dueDate:"02 Feb 2025", paidAt:"15 Jan 2025", status:"paid"     },
  { id:"si4", ref:"CR-INV-2024-Q4",   supplierId:"s8",  supplierName:"Careem Business",        supplierType:"transport", description:"Ground Transport Q4 2024 invoice",  amount:88000,   currency:"AED", amountAED:88000,   issuedAt:"04 Jan 2025", dueDate:"03 Feb 2025", status:"approved" },
  { id:"si5", ref:"DHL-INV-2024-DEC", supplierId:"s10", supplierName:"DHL Express UAE",        supplierType:"courier",   description:"Courier services Dec 2024",         amount:12400,   currency:"AED", amountAED:12400,   issuedAt:"07 Jan 2025", dueDate:"06 Feb 2025", status:"received" },
  { id:"si6", ref:"AIG-INV-2024-Q4",  supplierId:"s12", supplierName:"AIG Insurance UAE",      supplierType:"insurance", description:"Policy premium remittance Q4 2024", amount:320000,  currency:"AED", amountAED:320000,  issuedAt:"02 Jan 2025", dueDate:"01 Feb 2025", paidAt:"10 Jan 2025", status:"paid"     },
];

// ── Supplier Payments ─────────────────────────────────────────────────────────
export const SUPPLIER_PAYMENTS: SupplierPayment[] = [
  { id:"sp1", supplierId:"s5",  supplierName:"Marriott International", invoiceRef:"MAR-INV-2024-DEC", amountAED:480000, method:"bank_transfer", date:"15 Jan 2025", processedBy:"Ayesha Rahman",   bankRef:"SWIFT-001122" },
  { id:"sp2", supplierId:"s12", supplierName:"AIG Insurance UAE",      invoiceRef:"AIG-INV-2024-Q4",  amountAED:320000, method:"bank_transfer", date:"10 Jan 2025", processedBy:"Lina Al-Sayed",   bankRef:"SWIFT-003344" },
  { id:"sp3", supplierId:"s1",  supplierName:"Emirates Airlines",      invoiceRef:"EK-INV-NOV-2024",  amountAED:7200000,method:"bank_transfer", date:"10 Dec 2024", processedBy:"Director",         bankRef:"SWIFT-005566" },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
