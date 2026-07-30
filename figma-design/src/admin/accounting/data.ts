export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type AccountCategory =
  | "current_asset" | "non_current_asset"
  | "current_liability" | "non_current_liability"
  | "equity"
  | "revenue" | "cogs" | "operating_expense" | "other_income" | "finance_cost";

export interface Account {
  code: string; name: string; type: AccountType; category: AccountCategory;
  parent?: string; balance: number; isHeader?: boolean;
}

export interface JVLine {
  accountCode: string; accountName: string; debit: number; credit: number; narration?: string;
}

export interface JournalVoucher {
  id: string; ref: string; date: string; type: "general" | "payment" | "receipt" | "adjustment";
  narration: string; lines: JVLine[]; preparedBy: string; status: "draft" | "posted" | "reversed";
  totalDebit: number; totalCredit: number;
}

export interface CashBankEntry {
  id: string; ref: string; date: string;
  type: "receipt" | "payment" | "transfer";
  account: string; description: string;
  debit: number; credit: number; balance: number;
  party?: string; chequeNo?: string;
}

export interface ARInvoice {
  id: string; ref: string; customer: string; customerId: string;
  issuedAt: string; dueDate: string; amount: number; paid: number; outstanding: number;
  status: "current" | "overdue_30" | "overdue_60" | "overdue_90" | "paid" | "disputed";
  service: string;
}

export interface APInvoice {
  id: string; ref: string; vendor: string; vendorType: string;
  issuedAt: string; dueDate: string; amount: number; paid: number; outstanding: number;
  status: "pending" | "approved" | "overdue" | "paid" | "disputed";
}

export interface Expense {
  id: string; ref: string; employee: string; department: string;
  category: string; description: string; amount: number;
  date: string; submittedAt: string; approvedBy?: string;
  status: "draft" | "submitted" | "approved" | "paid" | "rejected";
  receipt: boolean;
}

export interface IncomeRecord {
  id: string; ref: string; source: string; category: string;
  description: string; amount: number; date: string;
  accountCode: string; accountName: string;
  status: "posted" | "draft";
}

export interface VATReturn {
  id: string; period: string; periodStart: string; periodEnd: string;
  standardRatedSales: number; zeroRatedSales: number; exemptSales: number;
  outputVAT: number;
  standardRatedPurchases: number; inputVAT: number;
  netVAT: number; status: "draft" | "filed" | "paid" | "amended";
  filedAt?: string; dueDate: string;
}

export interface BankReconItem {
  id: string; date: string; description: string;
  bankAmount: number; bookAmount: number;
  matched: boolean; type: "deposit" | "withdrawal" | "charge" | "interest";
}

// ── Chart of Accounts ─────────────────────────────────────────────────────────
export const ACCOUNTS: Account[] = [
  // Assets
  { code:"1000", name:"ASSETS",                       type:"asset",     category:"current_asset",     isHeader:true,  balance:0       },
  { code:"1100", name:"Current Assets",               type:"asset",     category:"current_asset",     isHeader:true,  balance:0       },
  { code:"1110", name:"Cash — Main Account",          type:"asset",     category:"current_asset",     balance:142000  },
  { code:"1120", name:"Cash — Petty Cash",            type:"asset",     category:"current_asset",     balance:3200    },
  { code:"1130", name:"Bank — Emirates NBD",          type:"asset",     category:"current_asset",     balance:285000  },
  { code:"1140", name:"Accounts Receivable",          type:"asset",     category:"current_asset",     balance:445000  },
  { code:"1150", name:"Staff Advances",               type:"asset",     category:"current_asset",     balance:12500   },
  { code:"1160", name:"Prepayments & Deposits",       type:"asset",     category:"current_asset",     balance:32000   },
  { code:"1200", name:"Non-Current Assets",           type:"asset",     category:"non_current_asset", isHeader:true,  balance:0       },
  { code:"1210", name:"Office Equipment (Cost)",      type:"asset",     category:"non_current_asset", balance:95000   },
  { code:"1215", name:"Accum. Depreciation — Equip.", type:"asset",     category:"non_current_asset", balance:-38000  },
  { code:"1220", name:"Furniture & Fixtures (Cost)",  type:"asset",     category:"non_current_asset", balance:45000   },
  { code:"1225", name:"Accum. Depreciation — Furn.",  type:"asset",     category:"non_current_asset", balance:-18000  },
  { code:"1230", name:"Software & Licenses",         type:"asset",     category:"non_current_asset", balance:28000   },
  { code:"1235", name:"Accum. Amortisation",         type:"asset",     category:"non_current_asset", balance:-12000  },
  // Liabilities
  { code:"2000", name:"LIABILITIES",                 type:"liability", category:"current_liability", isHeader:true,  balance:0       },
  { code:"2100", name:"Current Liabilities",         type:"liability", category:"current_liability", isHeader:true,  balance:0       },
  { code:"2110", name:"Accounts Payable",            type:"liability", category:"current_liability", balance:312000  },
  { code:"2120", name:"VAT Payable",                 type:"liability", category:"current_liability", balance:22800   },
  { code:"2130", name:"Accrued Expenses",            type:"liability", category:"current_liability", balance:18500   },
  { code:"2140", name:"Customer Advance Deposits",   type:"liability", category:"current_liability", balance:65000   },
  { code:"2150", name:"Employee Gratuity Provision", type:"liability", category:"non_current_liability", balance:48000 },
  // Equity
  { code:"3000", name:"EQUITY",                      type:"equity",    category:"equity",            isHeader:true,  balance:0       },
  { code:"3100", name:"Share Capital",               type:"equity",    category:"equity",            balance:500000  },
  { code:"3200", name:"Retained Earnings (prior)",   type:"equity",    category:"equity",            balance:1400    },
  { code:"3300", name:"Current Year Profit",         type:"equity",    category:"equity",            balance:87300   },
  // Revenue
  { code:"4000", name:"REVENUE",                     type:"revenue",   category:"revenue",           isHeader:true,  balance:0       },
  { code:"4100", name:"Sales — Flights",             type:"revenue",   category:"revenue",           balance:480000  },
  { code:"4200", name:"Sales — Hotels",              type:"revenue",   category:"revenue",           balance:220000  },
  { code:"4300", name:"Sales — Visa Services",       type:"revenue",   category:"revenue",           balance:85000   },
  { code:"4400", name:"Sales — Tours",               type:"revenue",   category:"revenue",           balance:95000   },
  { code:"4500", name:"Sales — Insurance",           type:"revenue",   category:"revenue",           balance:42000   },
  { code:"4600", name:"Service Fees & Misc.",        type:"revenue",   category:"other_income",      balance:18000   },
  { code:"4700", name:"Commission Income",           type:"revenue",   category:"other_income",      balance:22400   },
  // COGS
  { code:"5000", name:"COST OF SALES",               type:"expense",   category:"cogs",              isHeader:true,  balance:0       },
  { code:"5100", name:"Air Ticket Cost",             type:"expense",   category:"cogs",              balance:380000  },
  { code:"5200", name:"Hotel Net Rates",             type:"expense",   category:"cogs",              balance:165000  },
  { code:"5300", name:"Visa Government Fees",        type:"expense",   category:"cogs",              balance:52000   },
  { code:"5400", name:"Tour Supplier Costs",         type:"expense",   category:"cogs",              balance:68000   },
  { code:"5500", name:"Insurance Premium Remittance",type:"expense",   category:"cogs",              balance:34000   },
  // Operating Expenses
  { code:"6000", name:"OPERATING EXPENSES",          type:"expense",   category:"operating_expense", isHeader:true,  balance:0       },
  { code:"6100", name:"Staff Salaries & Benefits",   type:"expense",   category:"operating_expense", balance:120000  },
  { code:"6200", name:"Office Rent",                 type:"expense",   category:"operating_expense", balance:25000   },
  { code:"6300", name:"Marketing & Advertising",     type:"expense",   category:"operating_expense", balance:18000   },
  { code:"6400", name:"Technology & Software",       type:"expense",   category:"operating_expense", balance:8500    },
  { code:"6500", name:"Utilities & Communications",  type:"expense",   category:"operating_expense", balance:4200    },
  { code:"6600", name:"Admin & General Expenses",    type:"expense",   category:"operating_expense", balance:7800    },
  { code:"6700", name:"Bank Charges",                type:"expense",   category:"operating_expense", balance:1200    },
  { code:"6800", name:"Depreciation & Amortisation", type:"expense",   category:"operating_expense", balance:4200    },
  { code:"6900", name:"Employee Gratuity Charge",    type:"expense",   category:"operating_expense", balance:6000    },
];

// ── Journal Vouchers ──────────────────────────────────────────────────────────
export const JOURNAL_VOUCHERS: JournalVoucher[] = [
  {
    id:"jv1", ref:"JV-2025-001", date:"01 Jan 2025", type:"receipt", narration:"Customer payment received — PetroAbu Energy, Invoice CI-2025-001",
    lines:[
      { accountCode:"1130", accountName:"Bank — Emirates NBD",    debit:115200, credit:0,      narration:"Bank receipt" },
      { accountCode:"1140", accountName:"Accounts Receivable",    debit:0,      credit:115200, narration:"Settlement of CI-2025-001" },
    ],
    preparedBy:"Ayesha Rahman", status:"posted", totalDebit:115200, totalCredit:115200,
  },
  {
    id:"jv2", ref:"JV-2025-002", date:"03 Jan 2025", type:"payment", narration:"Marriott International hotel payment — MAR-INV-2024-DEC",
    lines:[
      { accountCode:"2110", accountName:"Accounts Payable",       debit:480000, credit:0,      narration:"AP settlement" },
      { accountCode:"1130", accountName:"Bank — Emirates NBD",    debit:0,      credit:480000, narration:"SWIFT-001122" },
    ],
    preparedBy:"Lina Al-Sayed", status:"posted", totalDebit:480000, totalCredit:480000,
  },
  {
    id:"jv3", ref:"JV-2025-003", date:"05 Jan 2025", type:"general", narration:"Monthly salary accrual — January 2025",
    lines:[
      { accountCode:"6100", accountName:"Staff Salaries & Benefits", debit:120000, credit:0,    narration:"Jan 2025 payroll" },
      { accountCode:"2130", accountName:"Accrued Expenses",          debit:0,      credit:120000,narration:"Payroll accrual" },
    ],
    preparedBy:"Omar Hassan", status:"posted", totalDebit:120000, totalCredit:120000,
  },
  {
    id:"jv4", ref:"JV-2025-004", date:"07 Jan 2025", type:"general", narration:"VAT return filing Q4 2024 — net payable",
    lines:[
      { accountCode:"2120", accountName:"VAT Payable",             debit:22800,  credit:0,      narration:"Q4 2024 VAT liability" },
      { accountCode:"1130", accountName:"Bank — Emirates NBD",    debit:0,      credit:22800,  narration:"FTA payment reference" },
    ],
    preparedBy:"Ayesha Rahman", status:"posted", totalDebit:22800, totalCredit:22800,
  },
  {
    id:"jv5", ref:"JV-2025-005", date:"09 Jan 2025", type:"adjustment", narration:"Monthly depreciation charge — office equipment & furniture",
    lines:[
      { accountCode:"6800", accountName:"Depreciation & Amortisation", debit:4200, credit:0,   narration:"Jan 2025" },
      { accountCode:"1215", accountName:"Accum. Depreciation — Equip.",debit:0,    credit:2800, narration:"Equipment" },
      { accountCode:"1225", accountName:"Accum. Depreciation — Furn.", debit:0,    credit:1400, narration:"Furniture" },
    ],
    preparedBy:"Lina Al-Sayed", status:"posted", totalDebit:4200, totalCredit:4200,
  },
];

// ── Cash & Bank ───────────────────────────────────────────────────────────────
export const CASH_BANK_ENTRIES: CashBankEntry[] = [
  { id:"cb1",  ref:"RCP-001", date:"02 Jan 2025", type:"receipt",  account:"Bank — Emirates NBD", description:"PetroAbu Energy — Invoice CI-2025-001",       debit:115200,  credit:0,      balance:285000, party:"PetroAbu Energy"   },
  { id:"cb2",  ref:"RCP-002", date:"03 Jan 2025", type:"receipt",  account:"Bank — Emirates NBD", description:"TechCorp Dubai — Invoice CI-2025-002",         debit:39900,   credit:0,      balance:324900, party:"TechCorp Dubai"    },
  { id:"cb3",  ref:"PMT-001", date:"03 Jan 2025", type:"payment",  account:"Bank — Emirates NBD", description:"Marriott — MAR-INV-2024-DEC (SWIFT-001122)",   debit:0,       credit:480000, balance:324900, party:"Marriott International", chequeNo:"SWIFT-001122" },
  { id:"cb4",  ref:"PMT-002", date:"05 Jan 2025", type:"payment",  account:"Bank — Emirates NBD", description:"Office rent — January 2025",                   debit:0,       credit:25000,  balance:299900, party:"Al-Barsha Properties" },
  { id:"cb5",  ref:"RCP-003", date:"07 Jan 2025", type:"receipt",  account:"Bank — Emirates NBD", description:"Agent wallet top-up — Gulf Travels",            debit:50000,   credit:0,      balance:349900, party:"Gulf Travels LLC"  },
  { id:"cb6",  ref:"PMT-003", date:"07 Jan 2025", type:"payment",  account:"Bank — Emirates NBD", description:"FTA — VAT Q4 2024 payment",                    debit:0,       credit:22800,  balance:327100, party:"Federal Tax Authority" },
  { id:"cb7",  ref:"PMT-004", date:"08 Jan 2025", type:"payment",  account:"Bank — Emirates NBD", description:"AIG Insurance — AIG-INV-2024-Q4 (SWIFT-003344)",debit:0,       credit:320000, balance:7100,  party:"AIG Insurance UAE", chequeNo:"SWIFT-003344" },
  { id:"cb8",  ref:"RCP-004", date:"10 Jan 2025", type:"receipt",  account:"Bank — Emirates NBD", description:"Emirates Group — partial advance deposit",       debit:100000,  credit:0,      balance:107100, party:"Emirates Group"    },
  { id:"cb9",  ref:"PMT-005", date:"10 Jan 2025", type:"payment",  account:"Bank — Emirates NBD", description:"Careem Business — CR-INV-2024-Q4",              debit:0,       credit:88000,  balance:19100,  party:"Careem Business"   },
  { id:"cb10", ref:"RCP-005", date:"12 Jan 2025", type:"receipt",  account:"Bank — Emirates NBD", description:"Al-Futtaim Group — Invoice CI-2024-098",        debit:118800,  credit:0,      balance:137900, party:"Al-Futtaim Group"  },
];

// ── AR Invoices ───────────────────────────────────────────────────────────────
export const AR_INVOICES: ARInvoice[] = [
  { id:"ar1", ref:"CI-2025-003", customer:"Emirates Group",   customerId:"cc3", issuedAt:"03 Jan 2025", dueDate:"02 Feb 2025", amount:400500, paid:0,      outstanding:400500, status:"overdue_30", service:"Flights / Hotels / Visa"  },
  { id:"ar2", ref:"CI-2025-004", customer:"Al-Futtaim Group", customerId:"cc4", issuedAt:"04 Jan 2025", dueDate:"02 Feb 2025", amount:77440,  paid:0,      outstanding:77440,  status:"current",    service:"Flights / Hotels / Transport" },
  { id:"ar3", ref:"INV-2025-010",customer:"Gulf Travels LLC",  customerId:"agt1",issuedAt:"08 Jan 2025", dueDate:"22 Jan 2025", amount:28000,  paid:28000,  outstanding:0,      status:"paid",       service:"Flights"                   },
  { id:"ar4", ref:"INV-2025-011",customer:"Orient Travel",     customerId:"agt2",issuedAt:"09 Jan 2025", dueDate:"23 Jan 2025", amount:12500,  paid:0,      outstanding:12500,  status:"overdue_60", service:"Visa Services"             },
  { id:"ar5", ref:"INV-2025-012",customer:"Infosys UAE",       customerId:"cc5", issuedAt:"10 Jan 2025", dueDate:"09 Feb 2025", amount:22000,  paid:0,      outstanding:22000,  status:"current",    service:"Flights / Hotels"          },
  { id:"ar6", ref:"INV-2024-099",customer:"Saudi National Bank",customerId:"cc6",issuedAt:"01 Dec 2024", dueDate:"30 Dec 2024", amount:18000,  paid:0,      outstanding:18000,  status:"overdue_90", service:"Flights"                   },
];

// ── AP Invoices ───────────────────────────────────────────────────────────────
export const AP_INVOICES: APInvoice[] = [
  { id:"ap1", ref:"EK-INV-2024-1201",  vendor:"Emirates Airlines",      vendorType:"Airline",   issuedAt:"05 Jan 2025", dueDate:"04 Feb 2025", amount:6800000, paid:0,       outstanding:6800000, status:"approved" },
  { id:"ap2", ref:"QR-INV-2024-1201",  vendor:"Qatar Airways",           vendorType:"Airline",   issuedAt:"06 Jan 2025", dueDate:"05 Feb 2025", amount:1850000, paid:0,       outstanding:1850000, status:"pending"  },
  { id:"ap3", ref:"CR-INV-2024-Q4",    vendor:"Careem Business",          vendorType:"Transport", issuedAt:"04 Jan 2025", dueDate:"03 Feb 2025", amount:88000,   paid:88000,   outstanding:0,       status:"paid"     },
  { id:"ap4", ref:"DHL-INV-2024-DEC",  vendor:"DHL Express UAE",          vendorType:"Courier",   issuedAt:"07 Jan 2025", dueDate:"06 Feb 2025", amount:12400,   paid:0,       outstanding:12400,   status:"pending"  },
  { id:"ap5", ref:"BUPA-INV-2024-Q4",  vendor:"Bupa Arabia",              vendorType:"Insurance", issuedAt:"03 Jan 2025", dueDate:"02 Feb 2025", amount:98000,   paid:0,       outstanding:98000,   status:"approved" },
];

// ── Expenses ──────────────────────────────────────────────────────────────────
export const EXPENSES: Expense[] = [
  { id:"ex1", ref:"EXP-2025-001", employee:"James Whitfield",  department:"Sales",      category:"Client Entertainment", description:"Client dinner — Emirates Group deal close",          amount:3200,  date:"05 Jan 2025", submittedAt:"06 Jan 2025", approvedBy:"Ayesha Rahman", status:"approved", receipt:true  },
  { id:"ex2", ref:"EXP-2025-002", employee:"Lina Al-Sayed",    department:"Operations", category:"Office Supplies",      description:"Printer cartridges & stationery — Jan 2025",        amount:480,   date:"06 Jan 2025", submittedAt:"06 Jan 2025",                             status:"submitted",receipt:true  },
  { id:"ex3", ref:"EXP-2025-003", employee:"Omar Hassan",       department:"Technology", category:"Software Subscription",description:"Annual Canva Pro renewal (prorated)",                amount:1200,  date:"07 Jan 2025", submittedAt:"07 Jan 2025", approvedBy:"James Whitfield",status:"paid",    receipt:true  },
  { id:"ex4", ref:"EXP-2025-004", employee:"Sarah Mitchell",    department:"Sales",      category:"Travel — Local",       description:"Taxi to Abu Dhabi client visit",                     amount:280,   date:"08 Jan 2025", submittedAt:"09 Jan 2025",                             status:"draft",   receipt:false },
  { id:"ex5", ref:"EXP-2025-005", employee:"Rashid Al-Mansoori",department:"Management", category:"Marketing",            description:"LinkedIn ads — January campaign (agency invoice)",   amount:8500,  date:"09 Jan 2025", submittedAt:"09 Jan 2025", approvedBy:"Director",       status:"paid",    receipt:true  },
  { id:"ex6", ref:"EXP-2025-006", employee:"Priya Sharma",      department:"Operations", category:"Staff Welfare",        description:"Team lunch — operations dept.",                      amount:620,   date:"10 Jan 2025", submittedAt:"10 Jan 2025",                             status:"submitted",receipt:true  },
];

// ── Income Records ────────────────────────────────────────────────────────────
export const INCOME_RECORDS: IncomeRecord[] = [
  { id:"ir1", ref:"INC-2025-001", source:"Flights",   category:"Sales Revenue", description:"EK/QR/EY flight bookings — Jan W1",     amount:142000, date:"07 Jan 2025", accountCode:"4100", accountName:"Sales — Flights",       status:"posted" },
  { id:"ir2", ref:"INC-2025-002", source:"Hotels",    category:"Sales Revenue", description:"Marriott / Hilton bookings — Jan W1",    amount:58000,  date:"07 Jan 2025", accountCode:"4200", accountName:"Sales — Hotels",        status:"posted" },
  { id:"ir3", ref:"INC-2025-003", source:"Visa",      category:"Sales Revenue", description:"Schengen & UK visa applications — Jan", amount:22400,  date:"07 Jan 2025", accountCode:"4300", accountName:"Sales — Visa Services", status:"posted" },
  { id:"ir4", ref:"INC-2025-004", source:"Insurance", category:"Sales Revenue", description:"Travel insurance policies issued — W1",  amount:12800,  date:"07 Jan 2025", accountCode:"4500", accountName:"Sales — Insurance",     status:"posted" },
  { id:"ir5", ref:"INC-2025-005", source:"Commission",category:"Commission",    description:"AIG override commission — Q4 2024",      amount:22400,  date:"09 Jan 2025", accountCode:"4700", accountName:"Commission Income",     status:"posted" },
];

// ── VAT Returns ───────────────────────────────────────────────────────────────
export const VAT_RETURNS: VATReturn[] = [
  { id:"vat1", period:"Q4 2024", periodStart:"01 Oct 2024", periodEnd:"31 Dec 2024", standardRatedSales:3420000, zeroRatedSales:0, exemptSales:0, outputVAT:171000, standardRatedPurchases:2890000, inputVAT:144500, netVAT:26500, status:"paid",  filedAt:"28 Jan 2025", dueDate:"28 Jan 2025" },
  { id:"vat2", period:"Q3 2024", periodStart:"01 Jul 2024", periodEnd:"30 Sep 2024", standardRatedSales:2980000, zeroRatedSales:0, exemptSales:0, outputVAT:149000, standardRatedPurchases:2510000, inputVAT:125500, netVAT:23500, status:"filed", filedAt:"28 Oct 2024", dueDate:"28 Oct 2024" },
  { id:"vat3", period:"Q2 2024", periodStart:"01 Apr 2024", periodEnd:"30 Jun 2024", standardRatedSales:2660000, zeroRatedSales:0, exemptSales:0, outputVAT:133000, standardRatedPurchases:2240000, inputVAT:112000, netVAT:21000, status:"paid",  filedAt:"28 Jul 2024", dueDate:"28 Jul 2024"  },
];

// ── Bank Reconciliation ───────────────────────────────────────────────────────
export const BANK_STATEMENT_ITEMS: BankReconItem[] = [
  { id:"br1",  date:"02 Jan 2025", description:"Credit — PetroAbu Energy",           bankAmount:115200,  bookAmount:115200,  matched:true,  type:"deposit"    },
  { id:"br2",  date:"03 Jan 2025", description:"Credit — TechCorp Dubai",             bankAmount:39900,   bookAmount:39900,   matched:true,  type:"deposit"    },
  { id:"br3",  date:"03 Jan 2025", description:"Debit — SWIFT Marriott",              bankAmount:-480000, bookAmount:-480000, matched:true,  type:"withdrawal" },
  { id:"br4",  date:"05 Jan 2025", description:"Debit — Office rent",                 bankAmount:-25000,  bookAmount:-25000,  matched:true,  type:"withdrawal" },
  { id:"br5",  date:"07 Jan 2025", description:"Credit — Gulf Travels top-up",        bankAmount:50000,   bookAmount:50000,   matched:true,  type:"deposit"    },
  { id:"br6",  date:"07 Jan 2025", description:"Debit — FTA VAT Q4",                  bankAmount:-22800,  bookAmount:-22800,  matched:true,  type:"withdrawal" },
  { id:"br7",  date:"08 Jan 2025", description:"Debit — AIG SWIFT",                   bankAmount:-320000, bookAmount:-320000, matched:true,  type:"withdrawal" },
  { id:"br8",  date:"09 Jan 2025", description:"Bank charges — Jan 2025",             bankAmount:-850,    bookAmount:0,       matched:false, type:"charge"     },
  { id:"br9",  date:"10 Jan 2025", description:"Credit — Emirates Group advance",     bankAmount:100000,  bookAmount:100000,  matched:true,  type:"deposit"    },
  { id:"br10", date:"11 Jan 2025", description:"Interest earned — Jan",               bankAmount:320,     bookAmount:0,       matched:false, type:"interest"   },
];

// ── Financial Statements (static data for Jan 2025) ───────────────────────────
export interface FLine {
  label: string; amount?: number;
  indent?: number; isBold?: boolean; isTotal?: boolean;
  isSection?: boolean; separator?: boolean; negative?: boolean;
}

export const PNL_LINES: FLine[] = [
  { label:"REVENUE",                             isSection:true },
  { label:"Sales — Flights",                     amount:480000,  indent:1 },
  { label:"Sales — Hotels",                      amount:220000,  indent:1 },
  { label:"Sales — Visa Services",               amount:85000,   indent:1 },
  { label:"Sales — Tours",                       amount:95000,   indent:1 },
  { label:"Sales — Insurance",                   amount:42000,   indent:1 },
  { label:"Service Fees & Miscellaneous",        amount:18000,   indent:1 },
  { label:"Commission Income",                   amount:22400,   indent:1 },
  { label:"Total Revenue",                       amount:962400,  isTotal:true, isBold:true },
  { label:"", separator:true },
  { label:"COST OF SALES",                       isSection:true },
  { label:"Air Ticket Cost",                     amount:380000,  indent:1, negative:true },
  { label:"Hotel Net Rates",                     amount:165000,  indent:1, negative:true },
  { label:"Visa Government Fees",                amount:52000,   indent:1, negative:true },
  { label:"Tour Supplier Costs",                 amount:68000,   indent:1, negative:true },
  { label:"Insurance Premium Remittance",        amount:34000,   indent:1, negative:true },
  { label:"Total Cost of Sales",                 amount:699000,  isTotal:true, isBold:true, negative:true },
  { label:"", separator:true },
  { label:"GROSS PROFIT",                        amount:263400,  isTotal:true, isBold:true },
  { label:"Gross Margin",                        amount:27,      isTotal:true },
  { label:"", separator:true },
  { label:"OPERATING EXPENSES",                  isSection:true },
  { label:"Staff Salaries & Benefits",           amount:120000,  indent:1, negative:true },
  { label:"Office Rent",                         amount:25000,   indent:1, negative:true },
  { label:"Marketing & Advertising",             amount:18000,   indent:1, negative:true },
  { label:"Technology & Software",               amount:8500,    indent:1, negative:true },
  { label:"Utilities & Communications",          amount:4200,    indent:1, negative:true },
  { label:"Admin & General Expenses",            amount:7800,    indent:1, negative:true },
  { label:"Bank Charges",                        amount:1200,    indent:1, negative:true },
  { label:"Depreciation & Amortisation",         amount:4200,    indent:1, negative:true },
  { label:"Employee Gratuity Charge",            amount:6000,    indent:1, negative:true },
  { label:"Total Operating Expenses",            amount:194900,  isTotal:true, isBold:true, negative:true },
  { label:"", separator:true },
  { label:"NET PROFIT BEFORE TAX",               amount:68500,   isTotal:true, isBold:true },
  { label:"Corporate Tax (0% UAE FZ)",           amount:0,       indent:1 },
  { label:"NET PROFIT FOR THE PERIOD",           amount:68500,   isTotal:true, isBold:true },
];

export const BS_LINES: FLine[] = [
  { label:"ASSETS",                              isSection:true },
  { label:"Current Assets",                      isSection:true, indent:0, isBold:true },
  { label:"Cash — Main Account",                 amount:142000,  indent:1 },
  { label:"Cash — Petty Cash",                   amount:3200,    indent:1 },
  { label:"Bank — Emirates NBD",                 amount:285000,  indent:1 },
  { label:"Accounts Receivable",                 amount:445000,  indent:1 },
  { label:"Staff Advances",                      amount:12500,   indent:1 },
  { label:"Prepayments & Deposits",              amount:32000,   indent:1 },
  { label:"Total Current Assets",                amount:919700,  isTotal:true, isBold:true },
  { label:"", separator:true },
  { label:"Non-Current Assets",                  isSection:true, indent:0, isBold:true },
  { label:"Office Equipment (net)",              amount:57000,   indent:1 },
  { label:"Furniture & Fixtures (net)",          amount:27000,   indent:1 },
  { label:"Software & Licenses (net)",           amount:16000,   indent:1 },
  { label:"Total Non-Current Assets",            amount:100000,  isTotal:true, isBold:true },
  { label:"TOTAL ASSETS",                        amount:1019700, isTotal:true, isBold:true },
  { label:"", separator:true },
  { label:"LIABILITIES",                         isSection:true },
  { label:"Current Liabilities",                 isSection:true, indent:0, isBold:true },
  { label:"Accounts Payable",                    amount:312000,  indent:1 },
  { label:"VAT Payable",                         amount:22800,   indent:1 },
  { label:"Accrued Expenses",                    amount:18500,   indent:1 },
  { label:"Customer Advance Deposits",           amount:65000,   indent:1 },
  { label:"Total Current Liabilities",           amount:418300,  isTotal:true, isBold:true },
  { label:"", separator:true },
  { label:"Non-Current Liabilities",             isSection:true, indent:0, isBold:true },
  { label:"Employee Gratuity Provision",         amount:48000,   indent:1 },
  { label:"Total Non-Current Liabilities",       amount:48000,   isTotal:true, isBold:true },
  { label:"TOTAL LIABILITIES",                   amount:466300,  isTotal:true, isBold:true },
  { label:"", separator:true },
  { label:"EQUITY",                              isSection:true },
  { label:"Share Capital",                       amount:500000,  indent:1 },
  { label:"Retained Earnings (prior years)",     amount:1400,    indent:1 },
  { label:"Current Year Profit",                 amount:68500,   indent:1 },
  { label:"TOTAL EQUITY",                        amount:569900,  isTotal:true, isBold:true },
  { label:"", separator:true },
  { label:"TOTAL LIABILITIES & EQUITY",          amount:1036200, isTotal:true, isBold:true },
];

export const TB_LINES: { code: string; name: string; debit: number; credit: number }[] = [
  { code:"1110", name:"Cash — Main Account",             debit:142000,   credit:0        },
  { code:"1120", name:"Cash — Petty Cash",               debit:3200,     credit:0        },
  { code:"1130", name:"Bank — Emirates NBD",             debit:285000,   credit:0        },
  { code:"1140", name:"Accounts Receivable",             debit:445000,   credit:0        },
  { code:"1150", name:"Staff Advances",                  debit:12500,    credit:0        },
  { code:"1160", name:"Prepayments & Deposits",          debit:32000,    credit:0        },
  { code:"1210", name:"Office Equipment (Cost)",         debit:95000,    credit:0        },
  { code:"1215", name:"Accum. Depreciation — Equip.",    debit:0,        credit:38000    },
  { code:"1220", name:"Furniture & Fixtures (Cost)",     debit:45000,    credit:0        },
  { code:"1225", name:"Accum. Depreciation — Furn.",     debit:0,        credit:18000    },
  { code:"1230", name:"Software & Licenses",             debit:28000,    credit:0        },
  { code:"1235", name:"Accum. Amortisation",             debit:0,        credit:12000    },
  { code:"2110", name:"Accounts Payable",                debit:0,        credit:312000   },
  { code:"2120", name:"VAT Payable",                     debit:0,        credit:22800    },
  { code:"2130", name:"Accrued Expenses",                debit:0,        credit:18500    },
  { code:"2140", name:"Customer Advance Deposits",       debit:0,        credit:65000    },
  { code:"2150", name:"Employee Gratuity Provision",     debit:0,        credit:48000    },
  { code:"3100", name:"Share Capital",                   debit:0,        credit:500000   },
  { code:"3200", name:"Retained Earnings (prior)",       debit:0,        credit:1400     },
  { code:"4100", name:"Sales — Flights",                 debit:0,        credit:480000   },
  { code:"4200", name:"Sales — Hotels",                  debit:0,        credit:220000   },
  { code:"4300", name:"Sales — Visa Services",           debit:0,        credit:85000    },
  { code:"4400", name:"Sales — Tours",                   debit:0,        credit:95000    },
  { code:"4500", name:"Sales — Insurance",               debit:0,        credit:42000    },
  { code:"4600", name:"Service Fees & Misc.",            debit:0,        credit:18000    },
  { code:"4700", name:"Commission Income",               debit:0,        credit:22400    },
  { code:"5100", name:"Air Ticket Cost",                 debit:380000,   credit:0        },
  { code:"5200", name:"Hotel Net Rates",                 debit:165000,   credit:0        },
  { code:"5300", name:"Visa Government Fees",            debit:52000,    credit:0        },
  { code:"5400", name:"Tour Supplier Costs",             debit:68000,    credit:0        },
  { code:"5500", name:"Insurance Premium Remittance",    debit:34000,    credit:0        },
  { code:"6100", name:"Staff Salaries & Benefits",       debit:120000,   credit:0        },
  { code:"6200", name:"Office Rent",                     debit:25000,    credit:0        },
  { code:"6300", name:"Marketing & Advertising",         debit:18000,    credit:0        },
  { code:"6400", name:"Technology & Software",           debit:8500,     credit:0        },
  { code:"6500", name:"Utilities & Communications",      debit:4200,     credit:0        },
  { code:"6600", name:"Admin & General Expenses",        debit:7800,     credit:0        },
  { code:"6700", name:"Bank Charges",                    debit:1200,     credit:0        },
  { code:"6800", name:"Depreciation & Amortisation",     debit:4200,     credit:0        },
  { code:"6900", name:"Employee Gratuity Charge",        debit:6000,     credit:0        },
];

export const CF_LINES: FLine[] = [
  { label:"OPERATING ACTIVITIES",                isSection:true },
  { label:"Net Profit for the Period",           amount:68500,   indent:1 },
  { label:"Add: Depreciation & Amortisation",    amount:4200,    indent:1 },
  { label:"Add: Gratuity Provision",             amount:6000,    indent:1 },
  { label:"Changes in Working Capital:",         isSection:true, indent:1 },
  { label:"(Increase)/Decrease in Receivables",  amount:-45000,  indent:2, negative:true },
  { label:"(Increase)/Decrease in Prepayments",  amount:-8000,   indent:2, negative:true },
  { label:"Increase/(Decrease) in Payables",     amount:38000,   indent:2 },
  { label:"Increase/(Decrease) in Accruals",     amount:5500,    indent:2 },
  { label:"Increase/(Decrease) in Advances",     amount:12000,   indent:2 },
  { label:"Net Cash from Operating Activities",  amount:81200,   isTotal:true, isBold:true },
  { label:"", separator:true },
  { label:"INVESTING ACTIVITIES",                isSection:true },
  { label:"Purchase of Office Equipment",        amount:-8500,   indent:1, negative:true },
  { label:"Purchase of Software",                amount:-3000,   indent:1, negative:true },
  { label:"Net Cash from Investing Activities",  amount:-11500,  isTotal:true, isBold:true, negative:true },
  { label:"", separator:true },
  { label:"FINANCING ACTIVITIES",                isSection:true },
  { label:"No financing activities",             indent:1 },
  { label:"Net Cash from Financing Activities",  amount:0,       isTotal:true, isBold:true },
  { label:"", separator:true },
  { label:"NET INCREASE IN CASH",                amount:69700,   isTotal:true, isBold:true },
  { label:"Opening Cash & Bank Balance",         amount:215300,  indent:1 },
  { label:"CLOSING CASH & BANK BALANCE",         amount:285000,  isTotal:true, isBold:true },
];

export const fmtAED = (n: number) => "AED " + Math.abs(n).toLocaleString("en-US");
export const fmt = (n: number) => Math.abs(n).toLocaleString("en-US");
