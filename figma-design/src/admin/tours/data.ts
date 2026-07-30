export type TourStatus = "draft"|"active"|"full"|"completed"|"cancelled";
export type TourType = "cultural"|"adventure"|"beach"|"city"|"religious"|"safari";

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  accommodation: string;
  meals: string;
  activities: string[];
}

export interface PricingTier {
  label: string;
  minPax: number;
  maxPax: number;
  pricePerPax: number;
  singleSupp: number;
}

export interface TourPackage {
  id: string;
  code: string;
  name: string;
  type: TourType;
  destination: string;
  duration: string;
  nights: number;
  days: number;
  groupSize: number;
  minPax: number;
  maxPax: number;
  inclusions: string[];
  exclusions: string[];
  status: TourStatus;
  nextDeparture: string;
  itinerary: ItineraryDay[];
  pricingTiers: PricingTier[];
  guideId?: string;
}

export interface TourGuide {
  id: string;
  name: string;
  nationality: string;
  languages: string[];
  specialization: TourType[];
  phone: string;
  email: string;
  rating: number;
  totalTours: number;
  status: "available"|"on_tour"|"off_duty";
  certifications: string[];
}

export interface TourGroup {
  id: string;
  packageId: string;
  packageName: string;
  departure: string;
  returnDate: string;
  pax: number;
  guideId: string;
  guideName: string;
  status: "upcoming"|"ongoing"|"completed"|"cancelled";
  destination: string;
}

export interface TourBooking {
  id: string;
  ref: string;
  packageId: string;
  packageName: string;
  groupId?: string;
  passengerName: string;
  nationality: string;
  pax: number;
  departure: string;
  totalFare: number;
  status: "confirmed"|"pending"|"cancelled"|"completed";
  issuedAt: string;
  issuedBy: string;
  type: "individual"|"group"|"corporate";
}

export interface TourQuotation {
  id: string;
  ref: string;
  clientName: string;
  packageName: string;
  pax: number;
  departure: string;
  totalAED: number;
  validUntil: string;
  status: "draft"|"sent"|"accepted"|"rejected";
  createdAt: string;
}

export interface TourInvoice {
  id: string;
  ref: string;
  customer: string;
  amount: number;
  date: string;
  status: "paid"|"pending"|"overdue";
  type: string;
}

// ── Tour Packages ─────────────────────────────────────────────────────────────
export const TOUR_PACKAGES: TourPackage[] = [
  {
    id:"tp1", code:"TOUR-EUR-001", name:"European Grand Tour", type:"cultural",
    destination:"Paris · Rome · Barcelona", duration:"14 Nights / 15 Days",
    nights:14, days:15, groupSize:20, minPax:10, maxPax:25,
    inclusions:["4★ Hotels","Daily Breakfast","Guided Tours","Coach Transport","Airport Transfers"],
    exclusions:["Flights","Visa Fees","Travel Insurance","Personal Expenses"],
    status:"active", nextDeparture:"15 Feb 2025",
    itinerary:[
      { day:1, title:"Arrival in Paris", description:"Land at CDG, transfer to hotel, welcome dinner.", accommodation:"Hotel Novotel Paris Centre", meals:"Dinner", activities:["Eiffel Tower evening visit"] },
      { day:2, title:"Paris Sightseeing", description:"Full-day guided tour of central Paris.", accommodation:"Hotel Novotel Paris Centre", meals:"Breakfast", activities:["Louvre Museum","Champs-Élysées","Notre Dame"] },
      { day:3, title:"Versailles Day Trip", description:"Morning coach to Versailles palace.", accommodation:"Hotel Novotel Paris Centre", meals:"Breakfast", activities:["Palace of Versailles","Garden Walk"] },
      { day:4, title:"Paris → Rome", description:"Morning flight to Rome, afternoon arrival.", accommodation:"Hotel Artemide Rome", meals:"Breakfast", activities:["Evening stroll on Via Veneto"] },
      { day:5, title:"Rome Highlights", description:"Vatican, Colosseum, Roman Forum.", accommodation:"Hotel Artemide Rome", meals:"Breakfast", activities:["Vatican Museums","Sistine Chapel","Colosseum"] },
    ],
    pricingTiers:[
      { label:"Solo Traveller",  minPax:1,  maxPax:1,  pricePerPax:9800,  singleSupp:1400 },
      { label:"Small Group",     minPax:2,  maxPax:9,  pricePerPax:7400,  singleSupp:1000 },
      { label:"Group",           minPax:10, maxPax:19, pricePerPax:6200,  singleSupp:800  },
      { label:"Large Group",     minPax:20, maxPax:25, pricePerPax:5600,  singleSupp:700  },
    ],
    guideId:"g2",
  },
  {
    id:"tp2", code:"TOUR-SAF-002", name:"Kenya Safari Experience", type:"safari",
    destination:"Nairobi · Masai Mara · Amboseli", duration:"7 Nights / 8 Days",
    nights:7, days:8, groupSize:12, minPax:4, maxPax:12,
    inclusions:["Safari Lodges","All Meals","Game Drives","Park Fees","Airport Transfers"],
    exclusions:["International Flights","Visa","Tips","Travel Insurance"],
    status:"active", nextDeparture:"22 Feb 2025",
    itinerary:[
      { day:1, title:"Arrival Nairobi", description:"Arrival & hotel check-in.", accommodation:"Nairobi Serena Hotel", meals:"Dinner", activities:["Giraffe Centre","Elephant Orphanage"] },
      { day:2, title:"Fly to Masai Mara", description:"Charter flight to Masai Mara airstrip.", accommodation:"Mara Serena Safari Lodge", meals:"All", activities:["Evening game drive"] },
    ],
    pricingTiers:[
      { label:"Per Person (4-7 pax)", minPax:4, maxPax:7,  pricePerPax:8500, singleSupp:2000 },
      { label:"Per Person (8-12 pax)",minPax:8, maxPax:12, pricePerPax:7200, singleSupp:1600 },
    ],
    guideId:"g1",
  },
  {
    id:"tp3", code:"TOUR-SRI-003", name:"Sri Lanka Highlights", type:"cultural",
    destination:"Colombo · Kandy · Galle", duration:"8 Nights / 9 Days",
    nights:8, days:9, groupSize:16, minPax:6, maxPax:18,
    inclusions:["3★ & 4★ Hotels","Daily Breakfast & Dinner","English Guide","A/C Coach"],
    exclusions:["Flights","Visa","Lunches","Entrance Fees"],
    status:"active", nextDeparture:"10 Mar 2025",
    itinerary:[
      { day:1, title:"Arrival Colombo", description:"Welcome & transfer to hotel.", accommodation:"Cinnamon Grand Colombo", meals:"Dinner", activities:["City drive"] },
    ],
    pricingTiers:[
      { label:"Small Group", minPax:6,  maxPax:10, pricePerPax:3800, singleSupp:600 },
      { label:"Group",       minPax:11, maxPax:18, pricePerPax:3200, singleSupp:500 },
    ],
    guideId:"g3",
  },
  {
    id:"tp4", code:"TOUR-MLD-004", name:"Maldives Luxury Escape", type:"beach",
    destination:"Malé · North Malé Atoll", duration:"5 Nights / 6 Days",
    nights:5, days:6, groupSize:8, minPax:2, maxPax:8,
    inclusions:["Overwater Villa","All Inclusive","Speedboat Transfers","Snorkeling","Spa"],
    exclusions:["International Flights","Visa","Diving Courses"],
    status:"active", nextDeparture:"01 Mar 2025",
    itinerary:[
      { day:1, title:"Arrival Malé", description:"Meet & greet, speedboat to resort.", accommodation:"Anantara Dhigu Resort", meals:"All Inclusive", activities:["Welcome cocktail","Beach stroll"] },
    ],
    pricingTiers:[
      { label:"Couple (2 pax)",       minPax:2, maxPax:2, pricePerPax:7800, singleSupp:3500 },
      { label:"Group (4-8 pax)",      minPax:4, maxPax:8, pricePerPax:6500, singleSupp:2800 },
    ],
  },
];

// ── Tour Guides ───────────────────────────────────────────────────────────────
export const TOUR_GUIDES: TourGuide[] = [
  { id:"g1", name:"Amara Oyelaran",    nationality:"Kenyan",   languages:["English","Swahili","French"],         specialization:["safari","adventure"],  phone:"+254 700 112233", email:"amara@globetours.ae",    rating:4.9, totalTours:148, status:"available", certifications:["Kenya Safari Guide License","First Aid"] },
  { id:"g2", name:"Marco Ferretti",    nationality:"Italian",  languages:["English","Italian","Spanish","French"],specialization:["cultural","city"],     phone:"+39 345 567890",  email:"marco@globetours.ae",    rating:4.8, totalTours:213, status:"on_tour",   certifications:["WFTGA Certified","Italy Tourism Board"] },
  { id:"g3", name:"Priya Amarasinghe", nationality:"Sri Lankan",languages:["English","Sinhala","Tamil"],          specialization:["cultural","beach"],    phone:"+94 77 8812345",  email:"priya@globetours.ae",    rating:4.7, totalTours:89,  status:"available", certifications:["SLTDA Licensed Guide"] },
  { id:"g4", name:"Khalid Al-Rashidi", nationality:"Emirati",  languages:["Arabic","English","Urdu"],             specialization:["religious","cultural"],phone:"+971 50 334 4556",email:"khalid@globetours.ae",   rating:4.9, totalTours:312, status:"available", certifications:["Hajj Guide Licensed","First Aid","CPR"] },
  { id:"g5", name:"Elena Papadopoulos",nationality:"Greek",    languages:["English","Greek","German","Russian"],  specialization:["cultural","city"],     phone:"+30 694 5678901", email:"elena@globetours.ae",    rating:4.8, totalTours:176, status:"available", certifications:["WFTGA Certified","Greek National Guide"] },
];

// ── Tour Groups ───────────────────────────────────────────────────────────────
export const TOUR_GROUPS: TourGroup[] = [
  { id:"tg1", packageId:"tp1", packageName:"European Grand Tour",     departure:"15 Feb 2025", returnDate:"01 Mar 2025", pax:18, guideId:"g2", guideName:"Marco Ferretti",    status:"upcoming",   destination:"Paris·Rome·Barcelona" },
  { id:"tg2", packageId:"tp2", packageName:"Kenya Safari Experience", departure:"22 Feb 2025", returnDate:"01 Mar 2025", pax:10, guideId:"g1", guideName:"Amara Oyelaran",   status:"upcoming",   destination:"Nairobi·Masai Mara"   },
  { id:"tg3", packageId:"tp3", packageName:"Sri Lanka Highlights",    departure:"10 Mar 2025", returnDate:"18 Mar 2025", pax:14, guideId:"g3", guideName:"Priya Amarasinghe",status:"upcoming",   destination:"Colombo·Kandy·Galle"  },
  { id:"tg4", packageId:"tp1", packageName:"European Grand Tour",     departure:"05 Jan 2025", returnDate:"20 Jan 2025", pax:22, guideId:"g2", guideName:"Marco Ferretti",    status:"completed",  destination:"Paris·Rome·Barcelona" },
];

// ── Tour Bookings ─────────────────────────────────────────────────────────────
export const TOUR_BOOKINGS: TourBooking[] = [
  { id:"tb1",  ref:"TBK-2025-001", packageId:"tp1", packageName:"European Grand Tour",     groupId:"tg1", passengerName:"James Whitmore",   nationality:"British",   pax:2, departure:"15 Feb 2025", totalFare:14800, status:"confirmed", issuedAt:"05 Jan 2025", issuedBy:"Ayesha Rahman",   type:"individual" },
  { id:"tb2",  ref:"TBK-2025-002", packageId:"tp2", packageName:"Kenya Safari Experience", groupId:"tg2", passengerName:"Nadia Al-Farhan",  nationality:"Emirati",   pax:4, departure:"22 Feb 2025", totalFare:34000, status:"confirmed", issuedAt:"07 Jan 2025", issuedBy:"Lina Al-Sayed",   type:"group"      },
  { id:"tb3",  ref:"TBK-2025-003", packageId:"tp1", packageName:"European Grand Tour",     groupId:"tg1", passengerName:"Raj Mehta",         nationality:"Indian",    pax:1, departure:"15 Feb 2025", totalFare:9800,  status:"confirmed", issuedAt:"06 Jan 2025", issuedBy:"Omar Hassan",     type:"individual" },
  { id:"tb4",  ref:"TBK-2025-004", packageId:"tp4", packageName:"Maldives Luxury Escape",              passengerName:"Elena Vasquez",     nationality:"Spanish",   pax:2, departure:"01 Mar 2025", totalFare:15600, status:"confirmed", issuedAt:"08 Jan 2025", issuedBy:"James Whitfield", type:"individual" },
  { id:"tb5",  ref:"TBK-2025-005", packageId:"tp3", packageName:"Sri Lanka Highlights",    groupId:"tg3", passengerName:"Corporate Group",  nationality:"Various",   pax:8, departure:"10 Mar 2025", totalFare:25600, status:"confirmed", issuedAt:"09 Jan 2025", issuedBy:"Ayesha Rahman",   type:"corporate"  },
];

// ── Quotations ────────────────────────────────────────────────────────────────
export const TOUR_QUOTATIONS: TourQuotation[] = [
  { id:"q1", ref:"QT-2025-001", clientName:"Hamad Al-Kuwari",  packageName:"European Grand Tour",     pax:6,  departure:"15 Mar 2025", totalAED:44400, validUntil:"20 Jan 2025", status:"sent",     createdAt:"08 Jan 2025" },
  { id:"q2", ref:"QT-2025-002", clientName:"Priya Nair",        packageName:"Kenya Safari Experience", pax:4,  departure:"22 Mar 2025", totalAED:34000, validUntil:"25 Jan 2025", status:"draft",    createdAt:"09 Jan 2025" },
  { id:"q3", ref:"QT-2025-003", clientName:"Emirates Group",    packageName:"Maldives Luxury Escape",  pax:10, departure:"20 Apr 2025", totalAED:65000, validUntil:"15 Jan 2025", status:"accepted", createdAt:"06 Jan 2025" },
  { id:"q4", ref:"QT-2024-098", clientName:"Tariq Bashir",      packageName:"Sri Lanka Highlights",    pax:2,  departure:"10 Jan 2025", totalAED:7600,  validUntil:"30 Dec 2024", status:"rejected", createdAt:"22 Dec 2024" },
];

// ── Invoices ──────────────────────────────────────────────────────────────────
export const TOUR_INVOICES: TourInvoice[] = [
  { id:"ti1", ref:"TOUR-INV-2025-001", customer:"James Whitmore",  amount:14800, date:"05 Jan 2025", status:"paid",    type:"individual" },
  { id:"ti2", ref:"TOUR-INV-2025-002", customer:"Nadia Al-Farhan", amount:34000, date:"07 Jan 2025", status:"pending", type:"group"      },
  { id:"ti3", ref:"TOUR-INV-2025-003", customer:"Raj Mehta",        amount:9800,  date:"06 Jan 2025", status:"paid",    type:"individual" },
  { id:"ti4", ref:"TOUR-INV-2025-004", customer:"Elena Vasquez",    amount:15600, date:"08 Jan 2025", status:"pending", type:"individual" },
  { id:"ti5", ref:"TOUR-INV-2025-005", customer:"Corporate Group",  amount:25600, date:"09 Jan 2025", status:"pending", type:"corporate"  },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
