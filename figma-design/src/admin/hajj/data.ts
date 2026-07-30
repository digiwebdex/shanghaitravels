export type PilgrimStatus = "registered"|"documents_pending"|"visa_applied"|"visa_approved"|"departed"|"returned"|"cancelled";
export type PackageCategory = "economy"|"standard"|"premium"|"vip";

export interface HajjPackage {
  id: string;
  code: string;
  name: string;
  season: string;
  category: PackageCategory;
  duration: number;
  departureCity: string;
  hotelMakkah: string;
  hotelMadinah: string;
  hotelStarsMakkah: number;
  hotelStarsMadinah: number;
  distanceMakkah: string;
  distanceMadinah: string;
  priceAED: number;
  inclusions: string[];
  status: "active"|"draft"|"full"|"completed";
  capacity: number;
  enrolled: number;
}

export interface Pilgrim {
  id: string;
  groupId: string;
  packageId: string;
  name: string;
  passportNo: string;
  nationality: string;
  dob: string;
  gender: "M"|"F";
  phone: string;
  mahramName?: string;
  mahramRelation?: string;
  status: PilgrimStatus;
  visaNo?: string;
  roomId?: string;
  paidAED: number;
  totalAED: number;
  paymentStatus: "full"|"partial"|"unpaid";
}

export interface HajjGroup {
  id: string;
  packageId: string;
  packageName: string;
  season: string;
  departure: string;
  returnDate: string;
  pilgrims: number;
  guideId?: string;
  guideName?: string;
  status: "forming"|"confirmed"|"departed"|"returned"|"cancelled";
  flightNo?: string;
  airline?: string;
}

export interface Accommodation {
  id: string;
  groupId: string;
  city: "Makkah"|"Madinah"|"Mina"|"Arafat";
  hotelName: string;
  roomType: string;
  totalRooms: number;
  occupancy: number;
  checkIn: string;
  checkOut: string;
}

export interface PaymentRecord {
  id: string;
  pilgrimId: string;
  pilgrimName: string;
  groupId: string;
  packageId: string;
  amount: number;
  method: "cash"|"bank_transfer"|"card"|"cheque";
  date: string;
  receivedBy: string;
  notes?: string;
}

export interface DocumentTracker {
  id: string;
  pilgrimId: string;
  pilgrimName: string;
  groupId: string;
  passport: "received"|"pending"|"expired";
  photo: "received"|"pending";
  meningitis: "received"|"pending"|"expired";
  covidVax: "received"|"pending"|"waived";
  moiForm: "submitted"|"pending";
  visaStatus: "not_applied"|"applied"|"approved"|"rejected";
  mahramProof: "received"|"pending"|"na";
}

export interface OfferLetter {
  id: string;
  ref: string;
  pilgrimName: string;
  packageId: string;
  packageName: string;
  season: string;
  generatedAt: string;
  sentAt?: string;
  status: "draft"|"sent"|"acknowledged";
}

// ── Packages ──────────────────────────────────────────────────────────────────
export const HAJJ_PACKAGES: HajjPackage[] = [
  {
    id:"hp1", code:"HAJJ-2025-ECO", name:"Hajj Economy Package 2025",
    season:"Hajj 2025", category:"economy", duration:25, departureCity:"Dubai",
    hotelMakkah:"Makkah Al-Mukaramah Hotel",  hotelStarsMakkah:3, distanceMakkah:"900m from Haram",
    hotelMadinah:"Al-Madinah Al-Munawwarah Hotel", hotelStarsMadinah:3, distanceMadinah:"800m from Nabawi",
    priceAED:12500,
    inclusions:["Visa","Ground Transport","Muzdalifah Camp","Mina Camp","Zamzam Water (5L)","Guide","Ihram"],
    status:"active", capacity:50, enrolled:38,
  },
  {
    id:"hp2", code:"HAJJ-2025-STD", name:"Hajj Standard Package 2025",
    season:"Hajj 2025", category:"standard", duration:25, departureCity:"Dubai",
    hotelMakkah:"Dar Al-Tawhid Intercontinental", hotelStarsMakkah:5, distanceMakkah:"200m from Haram",
    hotelMadinah:"Dar Al-Iman InterContinental",   hotelStarsMadinah:4, distanceMadinah:"300m from Nabawi",
    priceAED:22000,
    inclusions:["Visa","Return Flights","Ground Transport","Mina AC Tent","Muzdalifah","Guide","Zamzam (10L)","Meals"],
    status:"active", capacity:30, enrolled:24,
  },
  {
    id:"hp3", code:"HAJJ-2025-VIP", name:"Hajj VIP Package 2025",
    season:"Hajj 2025", category:"vip", duration:30, departureCity:"Dubai",
    hotelMakkah:"Fairmont Makkah Clock Royal Tower", hotelStarsMakkah:5, distanceMakkah:"Adjacent to Haram",
    hotelMadinah:"Oberoi Madinah",                   hotelStarsMadinah:5, distanceMadinah:"50m from Nabawi",
    priceAED:55000,
    inclusions:["Visa","Business Class Flights","Private Transport","Luxury Mina AC Suite","Personal Guide","All Meals","Zamzam 20L"],
    status:"active", capacity:10, enrolled:6,
  },
  {
    id:"hp4", code:"UMRAH-2025-STD", name:"Umrah Standard Package",
    season:"Umrah 2025", category:"standard", duration:10, departureCity:"Dubai",
    hotelMakkah:"Hilton Suites Makkah",  hotelStarsMakkah:4, distanceMakkah:"500m from Haram",
    hotelMadinah:"Movenpick Hotel Madinah", hotelStarsMadinah:4, distanceMadinah:"400m from Nabawi",
    priceAED:5800,
    inclusions:["Visa","Return Flights","Guide","Ground Transport","Daily Breakfast"],
    status:"active", capacity:80, enrolled:45,
  },
];

// ── Groups ────────────────────────────────────────────────────────────────────
export const HAJJ_GROUPS: HajjGroup[] = [
  { id:"hg1", packageId:"hp1", packageName:"Hajj Economy Package 2025",  season:"Hajj 2025",  departure:"28 May 2025", returnDate:"22 Jun 2025", pilgrims:38, guideId:"g4", guideName:"Khalid Al-Rashidi", status:"forming",   flightNo:"EK-815", airline:"Emirates" },
  { id:"hg2", packageId:"hp2", packageName:"Hajj Standard Package 2025", season:"Hajj 2025",  departure:"25 May 2025", returnDate:"22 Jun 2025", pilgrims:24, guideId:"g4", guideName:"Khalid Al-Rashidi", status:"confirmed",                                        },
  { id:"hg3", packageId:"hp3", packageName:"Hajj VIP Package 2025",      season:"Hajj 2025",  departure:"20 May 2025", returnDate:"25 Jun 2025", pilgrims:6,  guideId:"g4", guideName:"Khalid Al-Rashidi", status:"confirmed", flightNo:"EK-009", airline:"Emirates" },
  { id:"hg4", packageId:"hp4", packageName:"Umrah Standard Package",     season:"Umrah 2025", departure:"15 Feb 2025", returnDate:"25 Feb 2025", pilgrims:45, guideId:"g4", guideName:"Khalid Al-Rashidi", status:"forming"                                           },
];

// ── Pilgrims ──────────────────────────────────────────────────────────────────
export const PILGRIMS: Pilgrim[] = [
  { id:"pl1", groupId:"hg1", packageId:"hp1", name:"Mohammed Al-Farsi",   passportNo:"OM-12345678", nationality:"Omani",    dob:"15 Mar 1975", gender:"M", phone:"+968 9811 2233", status:"visa_approved",       visaNo:"SA-VIS-001", roomId:"MK-101", paidAED:12500, totalAED:12500, paymentStatus:"full"    },
  { id:"pl2", groupId:"hg1", packageId:"hp1", name:"Fatima Al-Farsi",     passportNo:"OM-12345679", nationality:"Omani",    dob:"20 Jun 1978", gender:"F", phone:"+968 9811 2234", mahramName:"Mohammed Al-Farsi", mahramRelation:"Husband", status:"visa_approved", visaNo:"SA-VIS-002", roomId:"MK-101", paidAED:12500, totalAED:12500, paymentStatus:"full" },
  { id:"pl3", groupId:"hg2", packageId:"hp2", name:"Rashid Al-Mansoori",  passportNo:"UAE-88776655",nationality:"Emirati",  dob:"04 Jul 1968", gender:"M", phone:"+971 50 445 5667", status:"documents_pending", paidAED:11000, totalAED:22000, paymentStatus:"partial" },
  { id:"pl4", groupId:"hg2", packageId:"hp2", name:"Noor Al-Hassan",      passportNo:"UAE-99887766",nationality:"Emirati",  dob:"12 Nov 1985", gender:"F", phone:"+971 55 556 7788", mahramName:"Hassan Al-Noor", mahramRelation:"Son",  status:"registered", paidAED:5000, totalAED:22000, paymentStatus:"partial" },
  { id:"pl5", groupId:"hg3", packageId:"hp3", name:"Sheikh Hamad",        passportNo:"UAE-11223344",nationality:"Emirati",  dob:"01 Jan 1960", gender:"M", phone:"+971 56 667 8899", status:"visa_approved",     visaNo:"SA-VIS-005", roomId:"MK-201", paidAED:55000, totalAED:55000, paymentStatus:"full"  },
  { id:"pl6", groupId:"hg4", packageId:"hp4", name:"Tariq Bashir",        passportNo:"PK-AB123456", nationality:"Pakistani",dob:"08 Sep 1982", gender:"M", phone:"+92 300 1234567", status:"visa_applied",                              paidAED:5800, totalAED:5800, paymentStatus:"full"    },
];

// ── Document Tracker ──────────────────────────────────────────────────────────
export const DOCUMENT_TRACKER: DocumentTracker[] = [
  { id:"dt1", pilgrimId:"pl1", pilgrimName:"Mohammed Al-Farsi",  groupId:"hg1", passport:"received", photo:"received", meningitis:"received", covidVax:"received", moiForm:"submitted", visaStatus:"approved", mahramProof:"na"       },
  { id:"dt2", pilgrimId:"pl2", pilgrimName:"Fatima Al-Farsi",    groupId:"hg1", passport:"received", photo:"received", meningitis:"received", covidVax:"received", moiForm:"submitted", visaStatus:"approved", mahramProof:"received" },
  { id:"dt3", pilgrimId:"pl3", pilgrimName:"Rashid Al-Mansoori", groupId:"hg2", passport:"received", photo:"pending",  meningitis:"pending",  covidVax:"pending",  moiForm:"pending",   visaStatus:"not_applied", mahramProof:"na"   },
  { id:"dt4", pilgrimId:"pl4", pilgrimName:"Noor Al-Hassan",     groupId:"hg2", passport:"received", photo:"received", meningitis:"received", covidVax:"received", moiForm:"pending",   visaStatus:"not_applied", mahramProof:"pending" },
  { id:"dt5", pilgrimId:"pl5", pilgrimName:"Sheikh Hamad",       groupId:"hg3", passport:"received", photo:"received", meningitis:"received", covidVax:"received", moiForm:"submitted", visaStatus:"approved", mahramProof:"na"       },
  { id:"dt6", pilgrimId:"pl6", pilgrimName:"Tariq Bashir",       groupId:"hg4", passport:"received", photo:"received", meningitis:"received", covidVax:"received", moiForm:"submitted", visaStatus:"applied",  mahramProof:"na"       },
];

// ── Accommodation ─────────────────────────────────────────────────────────────
export const ACCOMMODATIONS: Accommodation[] = [
  { id:"acc1", groupId:"hg1", city:"Makkah",  hotelName:"Makkah Al-Mukaramah Hotel",        roomType:"Quad",    totalRooms:10, occupancy:38, checkIn:"28 May 2025", checkOut:"10 Jun 2025" },
  { id:"acc2", groupId:"hg1", city:"Madinah", hotelName:"Al-Madinah Al-Munawwarah Hotel",    roomType:"Quad",    totalRooms:10, occupancy:38, checkIn:"10 Jun 2025", checkOut:"17 Jun 2025" },
  { id:"acc3", groupId:"hg2", city:"Makkah",  hotelName:"Dar Al-Tawhid Intercontinental",    roomType:"Double",  totalRooms:12, occupancy:24, checkIn:"25 May 2025", checkOut:"10 Jun 2025" },
  { id:"acc4", groupId:"hg2", city:"Madinah", hotelName:"Dar Al-Iman InterContinental",       roomType:"Double",  totalRooms:12, occupancy:24, checkIn:"10 Jun 2025", checkOut:"17 Jun 2025" },
  { id:"acc5", groupId:"hg3", city:"Makkah",  hotelName:"Fairmont Makkah Clock Royal Tower",  roomType:"Suite",   totalRooms:3,  occupancy:6,  checkIn:"20 May 2025", checkOut:"12 Jun 2025" },
];

// ── Payments ──────────────────────────────────────────────────────────────────
export const HAJJ_PAYMENTS: PaymentRecord[] = [
  { id:"hpay1", pilgrimId:"pl1", pilgrimName:"Mohammed Al-Farsi",  groupId:"hg1", packageId:"hp1", amount:12500, method:"bank_transfer", date:"15 Dec 2024", receivedBy:"Ayesha Rahman" },
  { id:"hpay2", pilgrimId:"pl2", pilgrimName:"Fatima Al-Farsi",    groupId:"hg1", packageId:"hp1", amount:12500, method:"bank_transfer", date:"15 Dec 2024", receivedBy:"Ayesha Rahman" },
  { id:"hpay3", pilgrimId:"pl3", pilgrimName:"Rashid Al-Mansoori", groupId:"hg2", packageId:"hp2", amount:11000, method:"cash",          date:"20 Dec 2024", receivedBy:"Omar Hassan" },
  { id:"hpay4", pilgrimId:"pl4", pilgrimName:"Noor Al-Hassan",     groupId:"hg2", packageId:"hp2", amount:5000,  method:"cheque",         date:"22 Dec 2024", receivedBy:"Omar Hassan" },
  { id:"hpay5", pilgrimId:"pl5", pilgrimName:"Sheikh Hamad",       groupId:"hg3", packageId:"hp3", amount:55000, method:"bank_transfer", date:"01 Dec 2024", receivedBy:"Director" },
  { id:"hpay6", pilgrimId:"pl6", pilgrimName:"Tariq Bashir",       groupId:"hg4", packageId:"hp4", amount:5800,  method:"card",           date:"05 Jan 2025", receivedBy:"James Whitfield" },
];

// ── Offer Letters ─────────────────────────────────────────────────────────────
export const OFFER_LETTERS: OfferLetter[] = [
  { id:"ol1", ref:"OL-HAJJ-2025-001", pilgrimName:"Mohammed Al-Farsi",  packageId:"hp1", packageName:"Hajj Economy Package 2025",  season:"Hajj 2025",  generatedAt:"16 Dec 2024", sentAt:"16 Dec 2024", status:"acknowledged" },
  { id:"ol2", ref:"OL-HAJJ-2025-002", pilgrimName:"Fatima Al-Farsi",    packageId:"hp1", packageName:"Hajj Economy Package 2025",  season:"Hajj 2025",  generatedAt:"16 Dec 2024", sentAt:"16 Dec 2024", status:"acknowledged" },
  { id:"ol3", ref:"OL-HAJJ-2025-003", pilgrimName:"Rashid Al-Mansoori", packageId:"hp2", packageName:"Hajj Standard Package 2025", season:"Hajj 2025",  generatedAt:"21 Dec 2024", status:"draft" },
  { id:"ol4", ref:"OL-HAJJ-2025-004", pilgrimName:"Sheikh Hamad",       packageId:"hp3", packageName:"Hajj VIP Package 2025",      season:"Hajj 2025",  generatedAt:"02 Dec 2024", sentAt:"02 Dec 2024", status:"acknowledged" },
  { id:"ol5", ref:"OL-UMR-2025-001",  pilgrimName:"Tariq Bashir",       packageId:"hp4", packageName:"Umrah Standard Package",     season:"Umrah 2025", generatedAt:"06 Jan 2025", sentAt:"06 Jan 2025", status:"sent" },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
