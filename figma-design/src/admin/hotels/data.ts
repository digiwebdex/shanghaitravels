export type HotelBookingStatus = "confirmed"|"checked_in"|"checked_out"|"cancelled"|"no_show";
export type MealPlan           = "RO"|"BB"|"HB"|"FB"|"AI";

export interface Hotel {
  id: string; name: string; city: string; country: string; stars: number;
  category: string; priceFrom: number; amenities: string[];
  address: string; rating: number; rooms: number;
}
export interface HotelBooking {
  id: string; ref: string; hotel: string; hotelCity: string;
  guestName: string; nationality: string;
  checkIn: string; checkOut: string; nights: number;
  rooms: number; roomType: string; mealPlan: MealPlan;
  totalFare: number; status: HotelBookingStatus;
  voucherNo?: string; issuedAt: string; issuedBy: string;
  type: "individual"|"group"|"corporate"; corporateRef?: string; groupName?: string;
}
export interface RateEntry {
  id: string; hotel: string; supplier: string; roomType: string;
  mealPlan: MealPlan; rateAED: number; validFrom: string; validTo: string;
  status: "active"|"expired"|"negotiating"; rooms: number;
}
export interface CheckRecord {
  id: string; bookingRef: string; guestName: string; hotel: string;
  checkInDate: string; checkOutDate: string; nights: number;
  roomType: string; rooms: number; status: "arriving_today"|"in_house"|"departing_today"|"checked_out";
}
export interface CancellationRecord {
  id: string; bookingRef: string; guestName: string; hotel: string;
  cancelledAt: string; reason: string; penalty: number; refundAED: number;
  status: "processed"|"pending";
}
export interface HotelInvoice { id: string; ref: string; type: string; customer: string; amount: number; date: string; status: "paid"|"pending"|"overdue"; }

const MEAL_PLAN_LABELS: Record<MealPlan, string> = { RO:"Room Only", BB:"Bed & Breakfast", HB:"Half Board", FB:"Full Board", AI:"All Inclusive" };
export { MEAL_PLAN_LABELS };

// ── Hotels Catalog ────────────────────────────────────────────────────────────
export const HOTELS: Hotel[] = [
  { id:"h1", name:"Atlantis The Palm",        city:"Dubai",     country:"UAE", stars:5, category:"Resort",         priceFrom:2800, amenities:["Pool","Waterpark","Beach","Spa","Kids Club"],        address:"Palm Jumeirah, Dubai",           rating:9.2, rooms:1548 },
  { id:"h2", name:"Burj Al Arab",             city:"Dubai",     country:"UAE", stars:7, category:"Ultra-Luxury",   priceFrom:8500, amenities:["Butler","Private Beach","Helipad","Michelin"],      address:"Jumeirah Beach Rd, Dubai",       rating:9.8, rooms:202  },
  { id:"h3", name:"Four Seasons DIFC",        city:"Dubai",     country:"UAE", stars:5, category:"Urban Luxury",   priceFrom:2200, amenities:["Pool","Spa","Business Center","Restaurant"],        address:"DIFC, Dubai",                    rating:9.4, rooms:106  },
  { id:"h4", name:"Marriott Abu Dhabi",       city:"Abu Dhabi", country:"UAE", stars:5, category:"Business",       priceFrom:1400, amenities:["Pool","Gym","Business Center","Parking"],          address:"Al Markaziyah, Abu Dhabi",       rating:8.9, rooms:374  },
  { id:"h5", name:"Ritz-Carlton London",      city:"London",    country:"UK",  stars:5, category:"Urban Luxury",   priceFrom:4800, amenities:["Spa","Concierge","Restaurant","Rooftop"],          address:"150 Piccadilly, London W1J 9BR", rating:9.6, rooms:136  },
  { id:"h6", name:"Hilton Frankfurt",         city:"Frankfurt", country:"DE",  stars:4, category:"Business",       priceFrom:900,  amenities:["Pool","Gym","Business Center","Airport Shuttle"],   address:"Hochstraße 4, Frankfurt",        rating:8.5, rooms:342  },
  { id:"h7", name:"New York Marriott Marquis",city:"New York",  country:"US",  stars:4, category:"Urban Business",  priceFrom:3200, amenities:["Rooftop Bar","Gym","Business Center","Concierge"], address:"1535 Broadway, New York NY",     rating:8.8, rooms:1966 },
  { id:"h8", name:"Fairmont Toronto",         city:"Toronto",   country:"CA",  stars:5, category:"Heritage Luxury",priceFrom:2100, amenities:["Spa","Pool","Business Center","Restaurant"],       address:"1 Front St W, Toronto ON",       rating:9.1, rooms:598  },
];

// ── Hotel Bookings ────────────────────────────────────────────────────────────
export const HOTEL_BOOKINGS: HotelBooking[] = [
  { id:"hb1",  ref:"HTL-2025-001", hotel:"Atlantis The Palm",    hotelCity:"Dubai",     guestName:"James Whitmore",      nationality:"British",  checkIn:"20 Jan 2025", checkOut:"25 Jan 2025", nights:5, rooms:1, roomType:"Deluxe King",     mealPlan:"BB", totalFare:14000, status:"confirmed",  voucherNo:"VCH-001", issuedAt:"09 Jan 2025", issuedBy:"Ayesha Rahman",   type:"corporate", corporateRef:"CORP-TECHCORP" },
  { id:"hb2",  ref:"HTL-2025-002", hotel:"Ritz-Carlton London",  hotelCity:"London",    guestName:"Mustafa Al-Zaabi",   nationality:"Emirati",  checkIn:"15 Feb 2025", checkOut:"20 Feb 2025", nights:5, rooms:2, roomType:"Superior Suite",   mealPlan:"BB", totalFare:48000, status:"confirmed",               issuedAt:"07 Jan 2025", issuedBy:"Lina Al-Sayed",   type:"corporate", corporateRef:"CORP-PETROABU" },
  { id:"hb3",  ref:"HTL-2025-003", hotel:"Hilton Frankfurt",     hotelCity:"Frankfurt", guestName:"Amira Hassan",        nationality:"Egyptian", checkIn:"22 Jan 2025", checkOut:"27 Jan 2025", nights:5, rooms:1, roomType:"Standard Double",  mealPlan:"BB", totalFare:4500,  status:"confirmed",  voucherNo:"VCH-003", issuedAt:"09 Jan 2025", issuedBy:"Ayesha Rahman",   type:"individual" },
  { id:"hb4",  ref:"HTL-2025-004", hotel:"Marriott Abu Dhabi",   hotelCity:"Abu Dhabi", guestName:"David Okafor",        nationality:"Nigerian", checkIn:"12 Jan 2025", checkOut:"15 Jan 2025", nights:3, rooms:1, roomType:"Executive King",   mealPlan:"BB", totalFare:4200,  status:"confirmed",               issuedAt:"07 Jan 2025", issuedBy:"Omar Hassan",     type:"individual" },
  { id:"hb5",  ref:"HTL-2025-005", hotel:"New York Marriott Marquis",hotelCity:"New York",guestName:"Wei Zhang",          nationality:"Chinese",  checkIn:"08 Feb 2025", checkOut:"15 Feb 2025", nights:7, rooms:1, roomType:"Times Sq View King",mealPlan:"RO", totalFare:22400, status:"confirmed",  voucherNo:"VCH-005", issuedAt:"08 Jan 2025", issuedBy:"James Whitfield", type:"corporate", corporateRef:"CORP-ALIBABA" },
  { id:"hb6",  ref:"HTL-2025-006", hotel:"Fairmont Toronto",     hotelCity:"Toronto",   guestName:"Tariq Bashir",        nationality:"Pakistani",checkIn:"20 Jan 2025", checkOut:"27 Jan 2025", nights:7, rooms:1, roomType:"Deluxe Room",      mealPlan:"BB", totalFare:14700, status:"confirmed",               issuedAt:"08 Jan 2025", issuedBy:"Ayesha Rahman",   type:"individual" },
  { id:"hb7",  ref:"HTL-2024-198", hotel:"Four Seasons DIFC",    hotelCity:"Dubai",     guestName:"Elena Vasquez",       nationality:"Spanish",  checkIn:"10 Jan 2025", checkOut:"12 Jan 2025", nights:2, rooms:1, roomType:"Deluxe City View",  mealPlan:"BB", totalFare:4400,  status:"checked_in", voucherNo:"VCH-007", issuedAt:"06 Jan 2025", issuedBy:"James Whitfield", type:"individual" },
  { id:"hb8",  ref:"HTL-2025-008", hotel:"Hilton Frankfurt",     hotelCity:"Frankfurt", guestName:"Infosys Group",       nationality:"Indian",   checkIn:"08 Feb 2025", checkOut:"10 Feb 2025", nights:2, rooms:4, roomType:"Standard Double",  mealPlan:"BB", totalFare:7200,  status:"confirmed",               issuedAt:"08 Jan 2025", issuedBy:"James Whitfield", type:"group", groupName:"Infosys Tech Conference" },
  { id:"hb9",  ref:"HTL-2024-188", hotel:"Burj Al Arab",         hotelCity:"Dubai",     guestName:"Sheikh Investment",   nationality:"Emirati",  checkIn:"09 Jan 2025", checkOut:"11 Jan 2025", nights:2, rooms:1, roomType:"Panoramic Suite",  mealPlan:"FB", totalFare:34000, status:"checked_in", voucherNo:"VCH-009", issuedAt:"01 Jan 2025", issuedBy:"Director",        type:"corporate", corporateRef:"CORP-VIP" },
  { id:"hb10", ref:"HTL-2024-180", hotel:"Atlantis The Palm",    hotelCity:"Dubai",     guestName:"Rajesh Kumar",        nationality:"Indian",   checkIn:"05 Jan 2025", checkOut:"09 Jan 2025", nights:4, rooms:1, roomType:"Deluxe King",     mealPlan:"HB", totalFare:8800,  status:"checked_out",voucherNo:"VCH-010", issuedAt:"02 Jan 2025", issuedBy:"Ayesha Rahman",   type:"individual" },
];

// ── Rate Sheet ────────────────────────────────────────────────────────────────
export const RATE_SHEET: RateEntry[] = [
  { id:"r1",  hotel:"Atlantis The Palm",    supplier:"Direct Contract",   roomType:"Deluxe King",     mealPlan:"BB", rateAED:2400, validFrom:"01 Jan 2025", validTo:"31 Mar 2025", status:"active",      rooms:20 },
  { id:"r2",  hotel:"Atlantis The Palm",    supplier:"Expedia Business",  roomType:"Deluxe King",     mealPlan:"BB", rateAED:2600, validFrom:"01 Jan 2025", validTo:"31 Mar 2025", status:"active",      rooms:10 },
  { id:"r3",  hotel:"Burj Al Arab",         supplier:"Direct Contract",   roomType:"Deluxe Suite",    mealPlan:"HB", rateAED:7200, validFrom:"01 Jan 2025", validTo:"30 Jun 2025", status:"active",      rooms:5  },
  { id:"r4",  hotel:"Four Seasons DIFC",    supplier:"Direct Contract",   roomType:"Deluxe City View",mealPlan:"BB", rateAED:1950, validFrom:"01 Jan 2025", validTo:"31 Mar 2025", status:"active",      rooms:15 },
  { id:"r5",  hotel:"Ritz-Carlton London",  supplier:"GDS Amadeus",       roomType:"Superior Room",   mealPlan:"BB", rateAED:4200, validFrom:"01 Jan 2025", validTo:"31 Dec 2025", status:"active",      rooms:8  },
  { id:"r6",  hotel:"Hilton Frankfurt",     supplier:"Direct Contract",   roomType:"Standard Double", mealPlan:"BB", rateAED:780,  validFrom:"01 Jan 2025", validTo:"31 Mar 2025", status:"active",      rooms:30 },
  { id:"r7",  hotel:"New York Marriott Marquis",supplier:"Sabre GDS",     roomType:"Standard King",   mealPlan:"RO", rateAED:2900, validFrom:"01 Jan 2025", validTo:"30 Jun 2025", status:"active",      rooms:20 },
  { id:"r8",  hotel:"Fairmont Toronto",     supplier:"Direct Contract",   roomType:"Deluxe Room",     mealPlan:"BB", rateAED:1800, validFrom:"01 Jan 2025", validTo:"31 Mar 2025", status:"active",      rooms:12 },
  { id:"r9",  hotel:"Marriott Abu Dhabi",   supplier:"Direct Contract",   roomType:"Executive King",  mealPlan:"BB", rateAED:1200, validFrom:"01 Jan 2025", validTo:"31 Dec 2025", status:"active",      rooms:25 },
  { id:"r10", hotel:"Atlantis The Palm",    supplier:"Bed Bank HotelsPro",roomType:"Suite",            mealPlan:"HB", rateAED:5800, validFrom:"01 Oct 2024", validTo:"31 Dec 2024", status:"expired",     rooms:4  },
];

// ── Check-in/Check-out Records ────────────────────────────────────────────────
export const CHECK_RECORDS: CheckRecord[] = [
  { id:"cr1", bookingRef:"HTL-2024-198", guestName:"Elena Vasquez",      hotel:"Four Seasons DIFC",    checkInDate:"10 Jan 2025", checkOutDate:"12 Jan 2025", nights:2, roomType:"Deluxe City View", rooms:1, status:"in_house"        },
  { id:"cr2", bookingRef:"HTL-2024-188", guestName:"Sheikh Investment",   hotel:"Burj Al Arab",         checkInDate:"09 Jan 2025", checkOutDate:"11 Jan 2025", nights:2, roomType:"Panoramic Suite",  rooms:1, status:"in_house"        },
  { id:"cr3", bookingRef:"HTL-2025-001", guestName:"James Whitmore",      hotel:"Atlantis The Palm",    checkInDate:"20 Jan 2025", checkOutDate:"25 Jan 2025", nights:5, roomType:"Deluxe King",     rooms:1, status:"arriving_today"  },
  { id:"cr4", bookingRef:"HTL-2025-003", guestName:"Amira Hassan",        hotel:"Hilton Frankfurt",     checkInDate:"22 Jan 2025", checkOutDate:"27 Jan 2025", nights:5, roomType:"Standard Double", rooms:1, status:"arriving_today"  },
  { id:"cr5", bookingRef:"HTL-2024-180", guestName:"Rajesh Kumar",        hotel:"Atlantis The Palm",    checkInDate:"05 Jan 2025", checkOutDate:"09 Jan 2025", nights:4, roomType:"Deluxe King",     rooms:1, status:"checked_out"     },
  { id:"cr6", bookingRef:"HTL-2024-175", guestName:"Priya Menon",         hotel:"Marriott Abu Dhabi",   checkInDate:"07 Jan 2025", checkOutDate:"10 Jan 2025", nights:3, roomType:"Superior Room",   rooms:1, status:"departing_today" },
];

// ── Cancellations ─────────────────────────────────────────────────────────────
export const CANCELLATIONS: CancellationRecord[] = [
  { id:"can1", bookingRef:"HTL-2024-165", guestName:"Ravi Chandrasekhar", hotel:"Ritz-Carlton London",   cancelledAt:"05 Jan 2025", reason:"Travel plans changed",   penalty:4800, refundAED:0,    status:"processed" },
  { id:"can2", bookingRef:"HTL-2024-172", guestName:"Grace Osei",          hotel:"Hilton Frankfurt",      cancelledAt:"08 Jan 2025", reason:"Visa not approved",       penalty:780,  refundAED:1560, status:"pending"   },
  { id:"can3", bookingRef:"HTL-2024-158", guestName:"Lina Mohammed",        hotel:"Marriott Abu Dhabi",    cancelledAt:"03 Jan 2025", reason:"Medical emergency",       penalty:0,    refundAED:3600, status:"processed" },
];

// ── Invoices ──────────────────────────────────────────────────────────────────
export const HOTEL_INVOICES: HotelInvoice[] = [
  { id:"hi1", ref:"HTL-INV-2025-001", type:"corporate",  customer:"TechCorp",            amount:14000, date:"09 Jan 2025", status:"pending" },
  { id:"hi2", ref:"HTL-INV-2025-002", type:"corporate",  customer:"PetroAbu Energy",     amount:48000, date:"07 Jan 2025", status:"pending" },
  { id:"hi3", ref:"HTL-INV-2025-003", type:"individual", customer:"Amira Hassan",         amount:4500,  date:"09 Jan 2025", status:"pending" },
  { id:"hi4", ref:"HTL-INV-2024-198", type:"individual", customer:"Rajesh Kumar",         amount:8800,  date:"02 Jan 2025", status:"paid"    },
  { id:"hi5", ref:"HTL-INV-2024-188", type:"corporate",  customer:"Sheikh Investment",    amount:34000, date:"01 Jan 2025", status:"paid"    },
  { id:"hi6", ref:"HTL-INV-2024-172", type:"individual", customer:"Grace Osei",           amount:2340,  date:"08 Jan 2025", status:"pending" },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
