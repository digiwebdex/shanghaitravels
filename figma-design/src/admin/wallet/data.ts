export type WalletTxType = "top_up" | "commission_credit" | "payout" | "adjustment" | "debit" | "reversal";
export type PayoutStatus = "pending" | "approved" | "processing" | "completed" | "failed" | "cancelled";
export type CommissionRuleType = "percentage" | "fixed_per_booking" | "tiered" | "override";
export type CommissionEntity = "agent" | "supplier" | "both";

export interface AgentWallet {
  id: string; agentId: string; agentName: string; agentCode: string;
  balance: number; pendingBalance: number; creditLimit: number;
  totalTopUps: number; totalPayouts: number; totalCommissions: number;
  lastActivity: string; status: "active" | "suspended" | "inactive";
  accountManager: string;
}

export interface WalletTransaction {
  id: string; walletId: string; agentId: string; agentName: string;
  date: string; type: WalletTxType; ref: string;
  description: string; amount: number; balanceAfter: number;
  processedBy: string; notes?: string;
}

export interface CommissionRule {
  id: string; name: string; service: string;
  ruleType: CommissionRuleType; entity: CommissionEntity;
  value: number; minVolume?: number; maxVolume?: number;
  currency?: string; appliesTo: string;
  validFrom: string; validTo: string; active: boolean; priority: number;
}

export interface AgentCommissionRecord {
  id: string; agentId: string; agentName: string; agentCode: string;
  service: string; transactionRef: string; customerName: string;
  transactionDate: string; grossAmountAED: number;
  commissionPct: number; commissionAED: number;
  status: "pending" | "credited" | "reversed";
  creditedAt?: string;
}

export interface SupplierCommissionRecord {
  id: string; supplierId: string; supplierName: string; supplierType: string;
  service: string; invoiceRef: string; period: string;
  volumeAED: number; commissionPct: number; commissionAED: number;
  status: "accrued" | "invoiced" | "received" | "disputed";
}

export interface PayoutRequest {
  id: string; ref: string;
  entityType: "agent" | "supplier";
  entityId: string; entityName: string;
  amount: number; method: "bank_transfer" | "cheque" | "wallet_credit";
  bankDetails?: string; requestedAt: string; requestedBy: string;
  approvedBy?: string; processedAt?: string;
  status: PayoutStatus; notes?: string;
}

// ── Agent Wallets ─────────────────────────────────────────────────────────────
export const AGENT_WALLETS: AgentWallet[] = [
  { id:"w1", agentId:"agt1", agentName:"Gulf Travels LLC",       agentCode:"AGT-001", balance:128000, pendingBalance:12400, creditLimit:100000, totalTopUps:680000,  totalPayouts:120000,  totalCommissions:48000,  lastActivity:"12 Jan 2025", status:"active",   accountManager:"Ayesha Rahman"   },
  { id:"w2", agentId:"agt2", agentName:"Orient Travel Agency",   agentCode:"AGT-002", balance:44200,  pendingBalance:3200,  creditLimit:50000,  totalTopUps:280000,  totalPayouts:88000,   totalCommissions:22000,  lastActivity:"11 Jan 2025", status:"active",   accountManager:"James Whitfield" },
  { id:"w3", agentId:"agt3", agentName:"Nile Tours Dubai",       agentCode:"AGT-003", balance:8800,   pendingBalance:0,     creditLimit:25000,  totalTopUps:120000,  totalPayouts:48000,   totalCommissions:8800,   lastActivity:"09 Jan 2025", status:"active",   accountManager:"Lina Al-Sayed"   },
  { id:"w4", agentId:"agt4", agentName:"Al-Faris Travel",        agentCode:"AGT-004", balance:3200,   pendingBalance:0,     creditLimit:0,      totalTopUps:88000,   totalPayouts:32000,   totalCommissions:4400,   lastActivity:"06 Jan 2025", status:"active",   accountManager:"Omar Hassan"     },
  { id:"w5", agentId:"agt5", agentName:"Sunrise Travel Agency",  agentCode:"AGT-005", balance:0,      pendingBalance:0,     creditLimit:0,      totalTopUps:44000,   totalPayouts:44000,   totalCommissions:2200,   lastActivity:"01 Dec 2024", status:"suspended",accountManager:"Ayesha Rahman"   },
];

// ── Wallet Transactions ───────────────────────────────────────────────────────
export const WALLET_TRANSACTIONS: WalletTransaction[] = [
  { id:"wt1",  walletId:"w1", agentId:"agt1", agentName:"Gulf Travels LLC",     date:"12 Jan 2025", type:"commission_credit",ref:"COM-2025-018", description:"Commission credit — EK/QR flights Jan W2",    amount:3800,  balanceAfter:128000, processedBy:"System"          },
  { id:"wt2",  walletId:"w2", agentId:"agt2", agentName:"Orient Travel Agency", date:"11 Jan 2025", type:"top_up",           ref:"TUP-2025-008", description:"Wallet top-up — bank transfer receipt",        amount:20000, balanceAfter:44200,  processedBy:"Ayesha Rahman"   },
  { id:"wt3",  walletId:"w1", agentId:"agt1", agentName:"Gulf Travels LLC",     date:"10 Jan 2025", type:"debit",            ref:"BKG-2025-112", description:"Flight booking debit — PNR ABC123",           amount:-8400, balanceAfter:124200, processedBy:"System"          },
  { id:"wt4",  walletId:"w3", agentId:"agt3", agentName:"Nile Tours Dubai",     date:"09 Jan 2025", type:"commission_credit",ref:"COM-2025-014", description:"Commission credit — hotel bookings Jan W1",    amount:1200,  balanceAfter:8800,   processedBy:"System"          },
  { id:"wt5",  walletId:"w4", agentId:"agt4", agentName:"Al-Faris Travel",      date:"07 Jan 2025", type:"adjustment",       ref:"ADJ-2025-003", description:"Manual adjustment — pricing correction",       amount:-600,  balanceAfter:3200,   processedBy:"James Whitfield", notes:"Overcharge reversal BKG-2025-088" },
  { id:"wt6",  walletId:"w1", agentId:"agt1", agentName:"Gulf Travels LLC",     date:"07 Jan 2025", type:"top_up",           ref:"TUP-2025-005", description:"Wallet top-up — bank transfer receipt",        amount:50000, balanceAfter:132600, processedBy:"Ayesha Rahman"   },
  { id:"wt7",  walletId:"w2", agentId:"agt2", agentName:"Orient Travel Agency", date:"05 Jan 2025", type:"commission_credit",ref:"COM-2025-009", description:"Commission credit — visa services Dec 2024",   amount:2200,  balanceAfter:24200,  processedBy:"System"          },
  { id:"wt8",  walletId:"w1", agentId:"agt1", agentName:"Gulf Travels LLC",     date:"04 Jan 2025", type:"payout",           ref:"PAY-2025-002", description:"Commission payout — bank transfer",            amount:-22000,balanceAfter:82600,  processedBy:"Lina Al-Sayed"   },
  { id:"wt9",  walletId:"w3", agentId:"agt3", agentName:"Nile Tours Dubai",     date:"03 Jan 2025", type:"top_up",           ref:"TUP-2025-003", description:"Wallet top-up — cash deposit",                 amount:10000, balanceAfter:7600,   processedBy:"Omar Hassan"     },
  { id:"wt10", walletId:"w2", agentId:"agt2", agentName:"Orient Travel Agency", date:"02 Jan 2025", type:"debit",            ref:"BKG-2025-088", description:"Hotel booking debit — Marriott Dubai",         amount:-5600, balanceAfter:4200,   processedBy:"System"          },
];

// ── Commission Rules ──────────────────────────────────────────────────────────
export const COMMISSION_RULES: CommissionRule[] = [
  { id:"cr1",  name:"Agent — EK/FZ Flights Base",    service:"Flights",   ruleType:"percentage",       entity:"agent",    value:2,    appliesTo:"All agents — EK/FZ fares",          validFrom:"01 Jan 2025", validTo:"31 Dec 2025", active:true,  priority:1 },
  { id:"cr2",  name:"Agent — QR/EY Flights Base",    service:"Flights",   ruleType:"percentage",       entity:"agent",    value:1.5,  appliesTo:"All agents — QR/EY fares",          validFrom:"01 Jan 2025", validTo:"31 Dec 2025", active:true,  priority:2 },
  { id:"cr3",  name:"Agent — Hotel Bookings",         service:"Hotels",    ruleType:"percentage",       entity:"agent",    value:5,    appliesTo:"All agents — hotel bookings",       validFrom:"01 Jan 2025", validTo:"31 Dec 2025", active:true,  priority:1 },
  { id:"cr4",  name:"Agent — Visa Services",          service:"Visa",      ruleType:"fixed_per_booking",entity:"agent",    value:50,   appliesTo:"Per application processed",         validFrom:"01 Jan 2025", validTo:"31 Dec 2025", active:true,  priority:1 },
  { id:"cr5",  name:"Agent — Insurance",              service:"Insurance", ruleType:"percentage",       entity:"agent",    value:8,    appliesTo:"All agents — insurance policies",   validFrom:"01 Jan 2025", validTo:"31 Dec 2025", active:true,  priority:1 },
  { id:"cr6",  name:"Supplier — AIG Travel Override", service:"Insurance", ruleType:"override",         entity:"supplier", value:12,   appliesTo:"AIG Insurance UAE",                 validFrom:"01 Jan 2025", validTo:"31 Dec 2025", active:true,  priority:1 },
  { id:"cr7",  name:"Supplier — EK Direct Override",  service:"Flights",   ruleType:"override",         entity:"supplier", value:7,    appliesTo:"Emirates Airlines direct contract", validFrom:"01 Jan 2025", validTo:"31 Dec 2025", active:true,  priority:1 },
  { id:"cr8",  name:"Agent Tier — Gold (>AED 500K)",  service:"All",       ruleType:"tiered",           entity:"agent",    value:0.5,  appliesTo:"Agents with annual volume > AED 500K", validFrom:"01 Jan 2025", validTo:"31 Dec 2025", active:true, priority:5 },
];

// ── Agent Commission Records ──────────────────────────────────────────────────
export const AGENT_COMMISSIONS: AgentCommissionRecord[] = [
  { id:"ac1", agentId:"agt1", agentName:"Gulf Travels LLC",     agentCode:"AGT-001", service:"Flights",  transactionRef:"BKG-2025-108", customerName:"Mohammed Al-Farsi",  transactionDate:"10 Jan 2025", grossAmountAED:18400, commissionPct:2,   commissionAED:368,  status:"credited",  creditedAt:"11 Jan 2025" },
  { id:"ac2", agentId:"agt1", agentName:"Gulf Travels LLC",     agentCode:"AGT-001", service:"Hotels",   transactionRef:"BKG-2025-109", customerName:"Elena Vasquez",       transactionDate:"10 Jan 2025", grossAmountAED:12000, commissionPct:5,   commissionAED:600,  status:"credited",  creditedAt:"11 Jan 2025" },
  { id:"ac3", agentId:"agt2", agentName:"Orient Travel Agency", agentCode:"AGT-002", service:"Visa",     transactionRef:"VIS-2025-044", customerName:"Raj Mehta",            transactionDate:"09 Jan 2025", grossAmountAED:850,   commissionPct:0,   commissionAED:50,   status:"credited",  creditedAt:"10 Jan 2025" },
  { id:"ac4", agentId:"agt2", agentName:"Orient Travel Agency", agentCode:"AGT-002", service:"Insurance",transactionRef:"INS-2025-022", customerName:"Corporate Group",     transactionDate:"09 Jan 2025", grossAmountAED:1200,  commissionPct:8,   commissionAED:96,   status:"credited",  creditedAt:"10 Jan 2025" },
  { id:"ac5", agentId:"agt3", agentName:"Nile Tours Dubai",     agentCode:"AGT-003", service:"Hotels",   transactionRef:"BKG-2025-095", customerName:"Amira Hassan",         transactionDate:"08 Jan 2025", grossAmountAED:8400,  commissionPct:5,   commissionAED:420,  status:"credited",  creditedAt:"09 Jan 2025" },
  { id:"ac6", agentId:"agt1", agentName:"Gulf Travels LLC",     agentCode:"AGT-001", service:"Flights",  transactionRef:"BKG-2025-088", customerName:"David Okafor",         transactionDate:"07 Jan 2025", grossAmountAED:22000, commissionPct:1.5, commissionAED:330,  status:"pending"   },
];

// ── Supplier Commission Records ───────────────────────────────────────────────
export const SUPPLIER_COMMISSIONS: SupplierCommissionRecord[] = [
  { id:"sc1", supplierId:"s1",  supplierName:"Emirates Airlines",     supplierType:"Airline",   service:"Flights",   invoiceRef:"EK-INV-2024-1201",  period:"Dec 2024", volumeAED:6800000, commissionPct:7,  commissionAED:476000, status:"invoiced"  },
  { id:"sc2", supplierId:"s3",  supplierName:"Qatar Airways",          supplierType:"Airline",   service:"Flights",   invoiceRef:"QR-INV-2024-1201",  period:"Dec 2024", volumeAED:1850000, commissionPct:6,  commissionAED:111000, status:"accrued"   },
  { id:"sc3", supplierId:"s5",  supplierName:"Marriott International", supplierType:"Hotel",     service:"Hotels",    invoiceRef:"MAR-INV-2024-DEC",  period:"Dec 2024", volumeAED:480000,  commissionPct:10, commissionAED:48000,  status:"received"  },
  { id:"sc4", supplierId:"s12", supplierName:"AIG Insurance UAE",      supplierType:"Insurance", service:"Insurance", invoiceRef:"AIG-INV-2024-Q4",   period:"Q4 2024",  volumeAED:320000,  commissionPct:12, commissionAED:38400,  status:"received"  },
  { id:"sc5", supplierId:"s8",  supplierName:"Careem Business",        supplierType:"Transport", service:"Transport", invoiceRef:"CR-INV-2024-Q4",    period:"Q4 2024",  volumeAED:88000,   commissionPct:8,  commissionAED:7040,   status:"invoiced"  },
];

// ── Payout Requests ───────────────────────────────────────────────────────────
export const PAYOUT_REQUESTS: PayoutRequest[] = [
  { id:"py1", ref:"PAY-2025-006", entityType:"agent",    entityId:"agt1", entityName:"Gulf Travels LLC",       amount:22000,  method:"bank_transfer", bankDetails:"ENBD •••4421", requestedAt:"12 Jan 2025", requestedBy:"Gulf Travels LLC",      status:"pending",   notes:"Monthly commission payout Jan W2" },
  { id:"py2", ref:"PAY-2025-005", entityType:"agent",    entityId:"agt2", entityName:"Orient Travel Agency",   amount:5000,   method:"bank_transfer", bankDetails:"FAB •••8812",  requestedAt:"11 Jan 2025", requestedBy:"Orient Travel Agency",  status:"approved",  approvedBy:"James Whitfield", notes:"Commission drawdown" },
  { id:"py3", ref:"PAY-2025-004", entityType:"supplier", entityId:"s3",   entityName:"Qatar Airways",          amount:111000, method:"bank_transfer", bankDetails:"Doha Bank",    requestedAt:"10 Jan 2025", requestedBy:"Lina Al-Sayed",         status:"pending",   notes:"QR commission Q4 2024"            },
  { id:"py4", ref:"PAY-2025-003", entityType:"agent",    entityId:"agt3", entityName:"Nile Tours Dubai",       amount:2800,   method:"wallet_credit",                             requestedAt:"09 Jan 2025", requestedBy:"Nile Tours Dubai",      status:"completed", processedAt:"10 Jan 2025", notes:"Commission credited to wallet"  },
  { id:"py5", ref:"PAY-2025-002", entityType:"agent",    entityId:"agt1", entityName:"Gulf Travels LLC",       amount:15000,  method:"bank_transfer", bankDetails:"ENBD •••4421", requestedAt:"07 Jan 2025", requestedBy:"Gulf Travels LLC",      status:"completed", processedAt:"08 Jan 2025"                },
  { id:"py6", ref:"PAY-2025-001", entityType:"supplier", entityId:"s5",   entityName:"Marriott International", amount:48000,  method:"bank_transfer", bankDetails:"Citibank UAE", requestedAt:"05 Jan 2025", requestedBy:"Ayesha Rahman",         status:"completed", processedAt:"06 Jan 2025"                },
];

export const fmtAED = (n: number) => "AED " + Math.abs(n).toLocaleString("en-US");
