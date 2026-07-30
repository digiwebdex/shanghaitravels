export type BookingStatus   = "confirmed"|"issued"|"pending"|"cancelled"|"refunded";
export type TicketType     = "individual"|"group"|"corporate";
export type RefundStatus   = "eligible"|"partial"|"non_refundable";

export interface FlightOption {
  id: string; airline: string; logo: string; flightNo: string;
  origin: string; originCode: string; destination: string; destinationCode: string;
  departure: string; arrival: string; duration: string; stops: number;
  stopInfo?: string; fareAED: number; fareClass: "economy"|"business"|"first";
  available: number; baggage: string;
}
export interface Passenger     { name: string; passport: string; seat: string; dob: string; nationality: string; fare: number; }
export interface PNRRecord     {
  id: string; pnrCode: string; ticketNo: string; airline: string; flightNo: string;
  route: string; departure: string; arrival: string; fareClass: string;
  passengers: Passenger[]; totalFare: number; status: BookingStatus;
  issuedAt: string; issuedBy: string; type: TicketType;
  corporateRef?: string; groupName?: string;
  refundStatus: RefundStatus;
}
export interface CorporateAccount { id: string; name: string; ref: string; creditLimit: number; used: number; contact: string; }
export interface GroupBooking      { id: string; groupName: string; pax: number; route: string; travelDate: string; airline: string; fareClass: string; totalFare: number; status: BookingStatus; }
export interface InvoiceRecord     { id: string; ref: string; type: TicketType; customer: string; amount: number; date: string; status: "paid"|"pending"|"overdue"; }

// ── Flight Search Results (mock) ──────────────────────────────────────────────
export const FLIGHT_OPTIONS: FlightOption[] = [
  { id:"f1", airline:"Emirates",          logo:"EK", flightNo:"EK-007", origin:"Dubai",   originCode:"DXB", destination:"London", destinationCode:"LHR", departure:"22:30", arrival:"05:15+1", duration:"7h 45m", stops:0, fareAED:4200, fareClass:"economy",  available:45, baggage:"30kg" },
  { id:"f2", airline:"Emirates",          logo:"EK", flightNo:"EK-003", origin:"Dubai",   originCode:"DXB", destination:"London", destinationCode:"LHR", departure:"08:20", arrival:"14:55",   duration:"7h 35m", stops:0, fareAED:12800,fareClass:"business", available:8,  baggage:"40kg" },
  { id:"f3", airline:"British Airways",   logo:"BA", flightNo:"BA-106", origin:"Dubai",   originCode:"DXB", destination:"London", destinationCode:"LHR", departure:"14:15", arrival:"20:50",   duration:"7h 35m", stops:0, fareAED:3900, fareClass:"economy",  available:62, baggage:"23kg" },
  { id:"f4", airline:"Etihad Airways",    logo:"EY", flightNo:"EY-019", origin:"Abu Dhabi",originCode:"AUH",destination:"London", destinationCode:"LHR", departure:"10:50", arrival:"17:30",   duration:"7h 40m", stops:0, fareAED:3750, fareClass:"economy",  available:33, baggage:"25kg" },
  { id:"f5", airline:"flydubai",          logo:"FZ", flightNo:"FZ-711", origin:"Dubai",   originCode:"DXB", destination:"London", destinationCode:"LGW", departure:"06:00", arrival:"12:45",   duration:"8h 45m", stops:1, stopInfo:"Istanbul", fareAED:2100, fareClass:"economy", available:88, baggage:"20kg" },
  { id:"f6", airline:"Qatar Airways",     logo:"QR", flightNo:"QR-008", origin:"Dubai",   originCode:"DXB", destination:"London", destinationCode:"LHR", departure:"19:45", arrival:"03:15+1", duration:"8h 30m", stops:1, stopInfo:"Doha", fareAED:2900, fareClass:"economy", available:41, baggage:"25kg" },
];

// ── PNR Records ───────────────────────────────────────────────────────────────
export const PNR_RECORDS: PNRRecord[] = [
  {
    id:"pnr1", pnrCode:"EK7ABC", ticketNo:"176-4321567890", airline:"Emirates", flightNo:"EK-007",
    route:"DXB → LHR", departure:"22 Jan 2025 22:30", arrival:"23 Jan 2025 05:15",
    fareClass:"Economy", totalFare:4200, status:"issued", issuedAt:"09 Jan 2025", issuedBy:"Ayesha Rahman",
    type:"individual", refundStatus:"partial",
    passengers:[{ name:"Amira Hassan", passport:"EG9012345", seat:"24C", dob:"22 Nov 1989", nationality:"Egyptian", fare:4200 }],
  },
  {
    id:"pnr2", pnrCode:"BA9XYZ", ticketNo:"125-8765432109", airline:"British Airways", flightNo:"BA-106",
    route:"DXB → LHR", departure:"15 Feb 2025 14:15", arrival:"15 Feb 2025 20:50",
    fareClass:"Business", totalFare:41600, status:"issued", issuedAt:"07 Jan 2025", issuedBy:"Omar Hassan",
    type:"corporate", corporateRef:"CORP-PETROABU-01", refundStatus:"non_refundable",
    passengers:[
      { name:"Mustafa Al-Zaabi",  passport:"AE8812345", seat:"2A", dob:"30 Mar 1980", nationality:"Emirati",  fare:12800 },
      { name:"Khalid Al-Zaabi",   passport:"AE8812346", seat:"2C", dob:"15 Jun 1982", nationality:"Emirati",  fare:12800 },
      { name:"Fatima Al-Zaabi",   passport:"AE8812347", seat:"4A", dob:"22 Sep 1984", nationality:"Emirati",  fare:8000  },
    ],
  },
  {
    id:"pnr3", pnrCode:"EY4DEF", ticketNo:"607-1234567891", airline:"Etihad Airways", flightNo:"EY-019",
    route:"AUH → LHR", departure:"08 Feb 2025 10:50", arrival:"08 Feb 2025 17:30",
    fareClass:"Business", totalFare:28400, status:"confirmed", issuedAt:"08 Jan 2025", issuedBy:"James Whitfield",
    type:"group", groupName:"Infosys Tech Conference", refundStatus:"eligible",
    passengers:[
      { name:"Priya Menon",     passport:"IN5678901", seat:"3A", dob:"14 Sep 1991", nationality:"Indian", fare:7100 },
      { name:"Rajesh Kumar",    passport:"IN2341876", seat:"3C", dob:"07 Sep 1982", nationality:"Indian", fare:7100 },
      { name:"Anand Krishnan",  passport:"IN6789012", seat:"4A", dob:"22 Mar 1985", nationality:"Indian", fare:7100 },
      { name:"Deepa Sharma",    passport:"IN7890123", seat:"4C", dob:"11 Dec 1990", nationality:"Indian", fare:7100 },
    ],
  },
  {
    id:"pnr4", pnrCode:"FZ2GHI", ticketNo:"141-9876543210", airline:"flydubai", flightNo:"FZ-711",
    route:"DXB → LGW via IST", departure:"20 Jan 2025 06:00", arrival:"20 Jan 2025 12:45",
    fareClass:"Economy", totalFare:2100, status:"pending", issuedAt:"09 Jan 2025", issuedBy:"Lina Al-Sayed",
    type:"individual", refundStatus:"non_refundable",
    passengers:[{ name:"Sofia Nguyen", passport:"VN1234567", seat:"—", dob:"15 May 1992", nationality:"Vietnamese", fare:2100 }],
  },
];

// ── Corporate Accounts ────────────────────────────────────────────────────────
export const CORPORATE_ACCOUNTS: CorporateAccount[] = [
  { id:"ca1", name:"PetroAbu Energy LLC",    ref:"CORP-PETROABU", creditLimit:500000, used:185400, contact:"travel@petroabu.ae"    },
  { id:"ca2", name:"Infosys UAE",            ref:"CORP-INFOSYS",  creditLimit:200000, used:96800,  contact:"travel@infosys.ae"     },
  { id:"ca3", name:"Emirates Group",         ref:"CORP-EMGRP",    creditLimit:1000000,used:412000, contact:"corp.travel@ekgroup.ae"},
  { id:"ca4", name:"Okafor Imports Ltd",     ref:"CORP-OKAFOR",   creditLimit:150000, used:28200,  contact:"d.okafor@okafor.com"   },
];

// ── Group Bookings ────────────────────────────────────────────────────────────
export const GROUP_BOOKINGS: GroupBooking[] = [
  { id:"g1", groupName:"Infosys Tech Conference",    pax:4,  route:"AUH → LHR", travelDate:"08 Feb 2025", airline:"Etihad Airways", fareClass:"Business", totalFare:28400, status:"confirmed" },
  { id:"g2", groupName:"Abu Dhabi Investment Forum", pax:12, route:"DXB → JFK", travelDate:"15 Mar 2025", airline:"Emirates",        fareClass:"Business", totalFare:168000,status:"pending"   },
  { id:"g3", groupName:"GITEX Tech Tour Group",      pax:25, route:"DXB → DXB", travelDate:"14 Oct 2025", airline:"flydubai",        fareClass:"Economy",  totalFare:87500, status:"pending"   },
];

// ── Invoices ──────────────────────────────────────────────────────────────────
export const TICKET_INVOICES: InvoiceRecord[] = [
  { id:"ti1", ref:"TKT-INV-2025-001", type:"individual", customer:"Amira Hassan",      amount:4200,  date:"09 Jan 2025", status:"paid"    },
  { id:"ti2", ref:"TKT-INV-2025-002", type:"corporate",  customer:"PetroAbu Energy",   amount:38400, date:"07 Jan 2025", status:"paid"    },
  { id:"ti3", ref:"TKT-INV-2025-003", type:"group",      customer:"Infosys Tech Conf", amount:28400, date:"08 Jan 2025", status:"pending" },
  { id:"ti4", ref:"TKT-INV-2025-004", type:"individual", customer:"Sofia Nguyen",      amount:2100,  date:"09 Jan 2025", status:"pending" },
  { id:"ti5", ref:"TKT-INV-2024-188", type:"corporate",  customer:"Emirates Group",    amount:44800, date:"20 Dec 2024", status:"paid"    },
  { id:"ti6", ref:"TKT-INV-2024-175", type:"group",      customer:"GITEX Tech Tour",   amount:12500, date:"15 Dec 2024", status:"overdue" },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
