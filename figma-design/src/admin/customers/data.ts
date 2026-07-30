export interface Customer {
  id: string; name: string; email: string; phone: string;
  nationality: string; passportNo: string; dob: string;
  gender: "M"|"F"; address: string; occupation: string;
  joinedAt: string; status: "active"|"inactive"|"flagged";
  totalSpend: number; applications: number; avatar: string;
  // OCR Scan data
  ocrScanDate?: string; ocrMRZ?: string; ocrConfidence?: number;
}
export interface FamilyMember { id: string; customerId: string; name: string; relation: string; nationality: string; passportNo: string; dob: string; gender: "M"|"F"; }
export interface CustomerDoc  { id: string; customerId: string; name: string; category: "passport"|"visa"|"financial"|"medical"|"photo"|"other"; status: "verified"|"pending"|"rejected"; uploadedAt: string; size: string; }
export interface TravelRecord { id: string; customerId: string; destination: string; visaType: string; departure: string; return: string; status: "completed"|"upcoming"|"cancelled"; }
export interface PaymentRecord{ id: string; customerId: string; ref: string; service: string; amount: number; date: string; method: string; status: "paid"|"pending"|"refunded"; }
export interface VisaRecord   { id: string; customerId: string; ref: string; visaType: string; destination: string; appliedAt: string; decision: string; result: "approved"|"rejected"|"pending"; }
export interface TicketRecord { id: string; customerId: string; ref: string; airline: string; route: string; date: string; cls: string; status: "confirmed"|"cancelled"|"used"; }
export interface CustComm     { id: string; customerId: string; type: "email"|"call"|"whatsapp"|"sms"; summary: string; by: string; at: string; direction: "in"|"out"; }
export interface CustNote     { id: string; customerId: string; text: string; by: string; at: string; reminder?: string; }

// ── Customers ─────────────────────────────────────────────────────────────────
export const CUSTOMERS: Customer[] = [
  { id:"c1", name:"James Whitmore",       email:"james.w@techcorp.com",  phone:"+971 50 123 4567", nationality:"British",    passportNo:"GB5432101", dob:"12 Mar 1978", gender:"M", address:"Dubai Marina, Dubai",    occupation:"Software Engineer",   joinedAt:"15 Jan 2024", status:"active",   totalSpend:28400, applications:4, avatar:"JW", ocrScanDate:"15 Jan 2024", ocrMRZ:"P<GBKWHITMORE<<JAMES<<<<<<<<<<<<<<<<<<<<\nGB543210115GBR7803123M2901317<<<<<<<<<<<<8", ocrConfidence:98 },
  { id:"c2", name:"Fatima Al-Rashidi",    email:"fatima.r@emaar.ae",     phone:"+971 55 234 5678", nationality:"Emirati",    passportNo:"AE8821043", dob:"22 Jun 1990", gender:"F", address:"Downtown Dubai",          occupation:"Marketing Manager",   joinedAt:"03 Mar 2024", status:"active",   totalSpend:14200, applications:3, avatar:"FA", ocrScanDate:"03 Mar 2024", ocrMRZ:"P<ARERAL-RASHIDI<<FATIMA<<<<<<<<<<<<<\nAE882104322UAE9006229F2506299<<<<<<<<<<<<2", ocrConfidence:99 },
  { id:"c3", name:"Rajesh Kumar",         email:"rajesh.k@wipro.com",    phone:"+971 58 345 6789", nationality:"Indian",     passportNo:"IN2341876", dob:"07 Sep 1982", gender:"M", address:"Bur Dubai",               occupation:"IT Consultant",       joinedAt:"28 Feb 2024", status:"active",   totalSpend:9600,  applications:2, avatar:"RK", ocrScanDate:"28 Feb 2024", ocrMRZ:"P<INDKUMAR<<RAJESH<<<<<<<<<<<<<<<<<<\nIN234187628IND8209078M2809078<<<<<<<<<<<<6", ocrConfidence:96 },
  { id:"c4", name:"Wei Zhang",            email:"wei.zhang@alibaba.com", phone:"+86 138 8888 8888",nationality:"Chinese",    passportNo:"CN7890123", dob:"15 Apr 1985", gender:"M", address:"Business Bay, Dubai",     occupation:"Business Executive",  joinedAt:"10 Apr 2024", status:"active",   totalSpend:52000, applications:6, avatar:"WZ", ocrScanDate:"10 Apr 2024", ocrMRZ:"P<CHNZHANG<<WEI<<<<<<<<<<<<<<<<<<<<<<\nCN7890123<1CHN8504159M2912319<<<<<<<<<<<<2", ocrConfidence:100 },
  { id:"c5", name:"Amira El-Sayed",       email:"amira.e@nileair.eg",    phone:"+20 10 1234 5678", nationality:"Egyptian",   passportNo:"EG4457812", dob:"30 Nov 1992", gender:"F", address:"Deira, Dubai",             occupation:"Flight Attendant",    joinedAt:"17 May 2024", status:"active",   totalSpend:6800,  applications:2, avatar:"AE", ocrScanDate:"17 May 2024", ocrMRZ:"P<EGYEL-SAYED<<AMIRA<<<<<<<<<<<<<<\nEG445781217EGY9211307F2511304<<<<<<<<<<<<4", ocrConfidence:95 },
  { id:"c6", name:"Mohammed Al-Farsi",    email:"mfarsi@omantel.om",     phone:"+968 9123 4567",   nationality:"Omani",      passportNo:"OM3312987", dob:"18 Jan 1975", gender:"M", address:"Sharjah, UAE",             occupation:"Business Owner",      joinedAt:"22 Jun 2024", status:"flagged",  totalSpend:33500, applications:5, avatar:"MF", ocrScanDate:"22 Jun 2024", ocrMRZ:"P<OMNAL-FARSI<<MOHAMMED<<<<<<<<<<<\nOM331298618OMN7501189M3001184<<<<<<<<<<<<6", ocrConfidence:91 },
  { id:"c7", name:"Priya Sharma",         email:"priya.s@tcs.com",       phone:"+971 52 456 7890", nationality:"Indian",     passportNo:"IN5678234", dob:"14 Aug 1988", gender:"F", address:"Jumeirah Village Circle", occupation:"Data Analyst",        joinedAt:"05 Aug 2024", status:"active",   totalSpend:11200, applications:2, avatar:"PS" },
  { id:"c8", name:"Elena Petrova",        email:"elena.p@gazprom.ru",    phone:"+7 916 123 4567",  nationality:"Russian",    passportNo:"RU9023456", dob:"03 Mar 1980", gender:"F", address:"Palm Jumeirah, Dubai",     occupation:"Senior Consultant",   joinedAt:"19 Sep 2024", status:"inactive", totalSpend:4700,  applications:1, avatar:"EP" },
];

// ── Family Members ────────────────────────────────────────────────────────────
export const FAMILY_MEMBERS: FamilyMember[] = [
  { id:"fm1", customerId:"c1", name:"Sarah Whitmore",    relation:"Spouse",   nationality:"British",  passportNo:"GB5432200", dob:"22 May 1980", gender:"F" },
  { id:"fm2", customerId:"c1", name:"Oliver Whitmore",   relation:"Son",      nationality:"British",  passportNo:"GB5432301", dob:"10 Feb 2008", gender:"M" },
  { id:"fm3", customerId:"c2", name:"Omar Al-Rashidi",   relation:"Spouse",   nationality:"Emirati",  passportNo:"AE9901234", dob:"14 Jul 1988", gender:"M" },
  { id:"fm4", customerId:"c4", name:"Li Wei",            relation:"Spouse",   nationality:"Chinese",  passportNo:"CN8901234", dob:"03 Sep 1987", gender:"F" },
  { id:"fm5", customerId:"c4", name:"Zhang Wei Jr",      relation:"Son",      nationality:"Chinese",  passportNo:"CN9012345", dob:"22 Dec 2012", gender:"M" },
  { id:"fm6", customerId:"c6", name:"Maryam Al-Farsi",   relation:"Spouse",   nationality:"Omani",    passportNo:"OM4423098", dob:"11 Apr 1978", gender:"F" },
  { id:"fm7", customerId:"c6", name:"Abdullah Al-Farsi", relation:"Son",      nationality:"Omani",    passportNo:"OM5534209", dob:"05 Nov 2000", gender:"M" },
];

// ── Documents ─────────────────────────────────────────────────────────────────
export const CUSTOMER_DOCS: CustomerDoc[] = [
  { id:"doc1",  customerId:"c1", name:"Passport — James Whitmore",           category:"passport",  status:"verified", uploadedAt:"15 Jan 2024", size:"2.1 MB" },
  { id:"doc2",  customerId:"c1", name:"UK Visa Copy",                        category:"visa",      status:"verified", uploadedAt:"15 Jan 2024", size:"1.4 MB" },
  { id:"doc3",  customerId:"c1", name:"Bank Statement (3 months)",           category:"financial", status:"pending",  uploadedAt:"10 Jan 2025", size:"0.8 MB" },
  { id:"doc4",  customerId:"c1", name:"Passport Photo",                      category:"photo",     status:"verified", uploadedAt:"15 Jan 2024", size:"0.2 MB" },
  { id:"doc5",  customerId:"c2", name:"Passport — Fatima Al-Rashidi",        category:"passport",  status:"verified", uploadedAt:"03 Mar 2024", size:"2.3 MB" },
  { id:"doc6",  customerId:"c2", name:"Schengen Visa (France 2024)",         category:"visa",      status:"verified", uploadedAt:"03 Mar 2024", size:"1.1 MB" },
  { id:"doc7",  customerId:"c2", name:"Emirates ID",                         category:"other",     status:"verified", uploadedAt:"03 Mar 2024", size:"0.5 MB" },
  { id:"doc8",  customerId:"c4", name:"Passport — Wei Zhang",                category:"passport",  status:"verified", uploadedAt:"10 Apr 2024", size:"2.0 MB" },
  { id:"doc9",  customerId:"c4", name:"Business Registration Certificate",   category:"financial", status:"verified", uploadedAt:"10 Apr 2024", size:"1.8 MB" },
  { id:"doc10", customerId:"c4", name:"Bank Reference Letter",               category:"financial", status:"rejected", uploadedAt:"09 Jan 2025", size:"0.6 MB" },
  { id:"doc11", customerId:"c6", name:"Passport — Mohammed Al-Farsi",        category:"passport",  status:"verified", uploadedAt:"22 Jun 2024", size:"2.2 MB" },
  { id:"doc12", customerId:"c6", name:"Residence Visa",                      category:"visa",      status:"pending",  uploadedAt:"08 Jan 2025", size:"1.3 MB" },
];

// ── Travel History ────────────────────────────────────────────────────────────
export const TRAVEL_HISTORY: TravelRecord[] = [
  { id:"tr1", customerId:"c1", destination:"London, UK",      visaType:"UK Citizen Return",   departure:"12 Dec 2024", return:"26 Dec 2024", status:"completed" },
  { id:"tr2", customerId:"c1", destination:"Berlin, Germany", visaType:"Schengen Tourist",    departure:"14 Mar 2024", return:"21 Mar 2024", status:"completed" },
  { id:"tr3", customerId:"c1", destination:"Paris, France",   visaType:"Schengen Business",   departure:"20 Jan 2025", return:"25 Jan 2025", status:"upcoming"  },
  { id:"tr4", customerId:"c2", destination:"Paris, France",   visaType:"Schengen Tourist",    departure:"10 May 2024", return:"18 May 2024", status:"completed" },
  { id:"tr5", customerId:"c2", destination:"Istanbul, Turkey",visaType:"Turkey e-Visa",       departure:"15 Aug 2024", return:"22 Aug 2024", status:"completed" },
  { id:"tr6", customerId:"c4", destination:"Shanghai, China", visaType:"Chinese Passport",    departure:"20 Oct 2024", return:"05 Nov 2024", status:"completed" },
  { id:"tr7", customerId:"c4", destination:"New York, USA",   visaType:"USA B1/B2",           departure:"08 Feb 2025", return:"15 Feb 2025", status:"upcoming"  },
  { id:"tr8", customerId:"c6", destination:"Muscat, Oman",    visaType:"Omani Passport",      departure:"25 Nov 2024", return:"05 Dec 2024", status:"completed" },
  { id:"tr9", customerId:"c6", destination:"London, UK",      visaType:"UK Visitor Visa",     departure:"01 Mar 2025", return:"10 Mar 2025", status:"upcoming"  },
];

// ── Payment History ───────────────────────────────────────────────────────────
export const PAYMENT_HISTORY: PaymentRecord[] = [
  { id:"p1", customerId:"c1", ref:"INV-2025-0012", service:"Schengen Visa (France)",   amount:2800, date:"09 Jan 2025", method:"Credit Card", status:"paid"     },
  { id:"p2", customerId:"c1", ref:"INV-2024-0234", service:"Schengen Visa (Germany)",  amount:3100, date:"10 Mar 2024", method:"Bank Transfer",status:"paid"     },
  { id:"p3", customerId:"c2", ref:"INV-2024-0145", service:"Turkey e-Visa + Handling", amount:900,  date:"05 Aug 2024", method:"Cash",         status:"paid"     },
  { id:"p4", customerId:"c4", ref:"INV-2024-0389", service:"USA B1/B2 Group Visa",     amount:8400, date:"28 Dec 2024", method:"Wire Transfer", status:"pending"  },
  { id:"p5", customerId:"c6", ref:"INV-2024-0201", service:"UK Visitor Visa + Service",amount:5200, date:"15 Oct 2024", method:"Credit Card",   status:"paid"     },
  { id:"p6", customerId:"c6", ref:"INV-2024-0089", service:"Schengen Annual Multi",    amount:7800, date:"22 Jun 2024", method:"Bank Transfer", status:"paid"     },
];

// ── Visa History ──────────────────────────────────────────────────────────────
export const VISA_HISTORY: VisaRecord[] = [
  { id:"v1", customerId:"c1", ref:"APP-2024-0122", visaType:"Schengen Tourist",  destination:"Germany",   appliedAt:"01 Mar 2024", decision:"Approved 08 Mar 2024",  result:"approved" },
  { id:"v2", customerId:"c1", ref:"APP-2025-0008", visaType:"Schengen Business", destination:"France",    appliedAt:"05 Jan 2025", decision:"Pending",                result:"pending"  },
  { id:"v3", customerId:"c2", ref:"APP-2024-0078", visaType:"Schengen Tourist",  destination:"France",    appliedAt:"20 Apr 2024", decision:"Approved 28 Apr 2024",   result:"approved" },
  { id:"v4", customerId:"c4", ref:"APP-2024-0389", visaType:"USA B1/B2",         destination:"USA",       appliedAt:"28 Dec 2024", decision:"Interview Feb 2025",     result:"pending"  },
  { id:"v5", customerId:"c6", ref:"APP-2024-0192", visaType:"UK Visitor",        destination:"UK",        appliedAt:"15 Sep 2024", decision:"Approved 25 Sep 2024",   result:"approved" },
  { id:"v6", customerId:"c3", ref:"APP-2024-0310", visaType:"Schengen Tourist",  destination:"Italy",     appliedAt:"10 Aug 2024", decision:"Rejected 18 Aug 2024",   result:"rejected" },
];

// ── Ticket History ────────────────────────────────────────────────────────────
export const TICKET_HISTORY: TicketRecord[] = [
  { id:"tk1", customerId:"c1", ref:"TKT-2025-001", airline:"Emirates",  route:"DXB → LHR → DXB",  date:"20 Jan 2025", cls:"Business",  status:"confirmed" },
  { id:"tk2", customerId:"c1", ref:"TKT-2024-089", airline:"Lufthansa", route:"DXB → FRA → DXB",  date:"14 Mar 2024", cls:"Economy",   status:"used"      },
  { id:"tk3", customerId:"c4", ref:"TKT-2025-012", airline:"Etihad",    route:"AUH → JFK → AUH",  date:"08 Feb 2025", cls:"Business",  status:"confirmed" },
  { id:"tk4", customerId:"c6", ref:"TKT-2025-003", airline:"British Airways", route:"DXB → LHR → DXB", date:"01 Mar 2025", cls:"Economy", status:"confirmed" },
  { id:"tk5", customerId:"c2", ref:"TKT-2024-102", airline:"Air Arabia", route:"SHJ → IST → SHJ", date:"15 Aug 2024", cls:"Economy",   status:"used"      },
];

// ── Communications ────────────────────────────────────────────────────────────
export const CUST_COMMS: CustComm[] = [
  { id:"cc1", customerId:"c1", type:"email",    summary:"Sent Schengen appointment confirmation and packing list.", by:"Lina Al-Sayed",  at:"09 Jan 2025 14:00", direction:"out" },
  { id:"cc2", customerId:"c1", type:"call",     summary:"Client confirmed travel dates. Passport submitted.",       by:"Ayesha Rahman",  at:"08 Jan 2025 11:00", direction:"out" },
  { id:"cc3", customerId:"c2", type:"whatsapp", summary:"Sent France visa sticker delivery tracking number.",       by:"Omar Hassan",    at:"30 Apr 2024 10:00", direction:"out" },
  { id:"cc4", customerId:"c4", type:"email",    summary:"Requested additional bank reference letter for USA visa.", by:"James Whitfield",at:"07 Jan 2025 09:00", direction:"out" },
  { id:"cc5", customerId:"c4", type:"call",     summary:"Client disputes bank letter rejection. Escalated to senior.", by:"James Whitfield",at:"09 Jan 2025 16:00", direction:"out" },
  { id:"cc6", customerId:"c6", type:"email",    summary:"UK visa approval notification sent to client.",            by:"Lina Al-Sayed",  at:"25 Sep 2024 12:00", direction:"out" },
];

// ── Notes & Reminders ─────────────────────────────────────────────────────────
export const CUST_NOTES: CustNote[] = [
  { id:"cn1", customerId:"c1", text:"Client prefers email communication. Always CC his PA (pa@techcorp.com) on all correspondence.", by:"Ayesha Rahman",   at:"15 Jan 2024"                          },
  { id:"cn2", customerId:"c1", text:"Schengen appointment booked Jan 14. Client needs to bring originals + 2 copies.", by:"Lina Al-Sayed", at:"09 Jan 2025", reminder:"14 Jan 2025"           },
  { id:"cn3", customerId:"c4", text:"VIP corporate account. CEO level. Approve expedited processing without additional authorization.", by:"Director",      at:"10 Apr 2024"                          },
  { id:"cn4", customerId:"c4", text:"Bank reference letter rejected — insufficient funds shown. Client has alternative bank. Follow up.", by:"James Whitfield",at:"09 Jan 2025", reminder:"12 Jan 2025" },
  { id:"cn5", customerId:"c6", text:"Account flagged for unusual pattern — 5 applications in 6 months. Compliance review pending.", by:"Compliance",     at:"22 Nov 2024"                          },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
