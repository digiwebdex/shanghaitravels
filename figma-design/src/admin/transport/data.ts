export type PickupStatus   = "scheduled"|"dispatched"|"completed"|"cancelled"|"delayed";
export type VehicleStatus  = "available"|"in_service"|"maintenance"|"inactive";
export type DriverStatus   = "available"|"on_trip"|"off_duty"|"leave";
export type RentalStatus   = "confirmed"|"active"|"completed"|"cancelled";

export interface Pickup {
  id: string; ref: string; passengerName: string; nationality: string;
  flight: string; terminal: string; arrivalAt: string; dropoff: string;
  driverName?: string; vehiclePlate?: string; vehicleType?: string;
  scheduledPickup: string; status: PickupStatus; pax: number; notes?: string;
}
export interface Driver {
  id: string; name: string; phone: string; nationalId: string;
  licenseNo: string; licenseExpiry: string; status: DriverStatus;
  currentVehicle?: string; tripsToday: number; totalTrips: number;
  rating: number; languages: string[];
}
export interface Vehicle {
  id: string; plate: string; make: string; model: string; year: number;
  type: "sedan"|"suv"|"van"|"minibus"|"luxury"; color: string; capacity: number;
  status: VehicleStatus; driverId?: string; insuranceExpiry: string;
  lastService: string; nextService: string; mileage: number;
  gpsLat?: number; gpsLng?: number;
}
export interface RentalBooking {
  id: string; ref: string; vehiclePlate: string; vehicleType: string;
  customerName: string; nationality: string;
  from: string; to: string; days: number; ratePerDay: number;
  totalFare: number; withDriver: boolean; status: RentalStatus;
  issuedBy: string;
}
export interface Route {
  id: string; name: string; origin: string; destination: string;
  stops: string[]; distanceKm: number; durationMin: number;
  type: "airport_transfer"|"city_tour"|"inter_city"|"corporate";
  priceAED: number;
}
export interface TransportInvoice { id: string; ref: string; type: string; customer: string; amount: number; date: string; status: "paid"|"pending"|"overdue"; }

// ── Airport Pickups ───────────────────────────────────────────────────────────
export const PICKUPS: Pickup[] = [
  { id:"p1",  ref:"PKP-2025-001", passengerName:"James Whitmore",      nationality:"British",   flight:"EK-007",  terminal:"T3",  arrivalAt:"09 Jan 2025 05:15", dropoff:"Four Seasons DIFC",          scheduledPickup:"09 Jan 2025 06:00", status:"completed",  pax:1, driverName:"Ahmed Al-Mansoori", vehiclePlate:"DXB-C-123", vehicleType:"Mercedes S-Class" },
  { id:"p2",  ref:"PKP-2025-002", passengerName:"Fatima Al-Rashidi",  nationality:"Emirati",   flight:"QR-1002", terminal:"T1",  arrivalAt:"10 Jan 2025 08:30", dropoff:"Downtown Dubai",              scheduledPickup:"10 Jan 2025 09:00", status:"scheduled",  pax:1, driverName:"Saeed Al-Maktoum", vehiclePlate:"DXB-C-456", vehicleType:"Toyota Camry" },
  { id:"p3",  ref:"PKP-2025-003", passengerName:"Priya Menon + 3",    nationality:"Indian",    flight:"EY-019",  terminal:"T3",  arrivalAt:"10 Jan 2025 10:30", dropoff:"Marriott Abu Dhabi",          scheduledPickup:"10 Jan 2025 11:00", status:"scheduled",  pax:4, driverName:"Omar Al-Hassan",   vehiclePlate:"DXB-V-789", vehicleType:"Toyota Hiace" },
  { id:"p4",  ref:"PKP-2025-004", passengerName:"Wei Zhang",           nationality:"Chinese",   flight:"CZ-365",  terminal:"T1",  arrivalAt:"10 Jan 2025 14:00", dropoff:"Business Bay",                scheduledPickup:"10 Jan 2025 14:30", status:"dispatched", pax:1, driverName:"Ahmed Al-Mansoori", vehiclePlate:"DXB-C-123", vehicleType:"Mercedes S-Class" },
  { id:"p5",  ref:"PKP-2025-005", passengerName:"Elena Petrova",       nationality:"Russian",   flight:"FZ-841",  terminal:"T2",  arrivalAt:"10 Jan 2025 16:45", dropoff:"Palm Jumeirah",               scheduledPickup:"10 Jan 2025 17:15", status:"scheduled",  pax:1, notes:"VIP — Champagne welcome" },
  { id:"p6",  ref:"PKP-2025-006", passengerName:"David Okafor",        nationality:"Nigerian",  flight:"BA-106",  terminal:"T3",  arrivalAt:"10 Jan 2025 20:50", dropoff:"Marriott Abu Dhabi",          scheduledPickup:"10 Jan 2025 21:30", status:"scheduled",  pax:1 },
  { id:"p7",  ref:"PKP-2025-007", passengerName:"Infosys Group (4)",   nationality:"Indian",    flight:"EK-543",  terminal:"T3",  arrivalAt:"11 Jan 2025 09:15", dropoff:"Atlantis The Palm",           scheduledPickup:"11 Jan 2025 10:00", status:"scheduled",  pax:4, driverName:"Khalid Rashid",    vehiclePlate:"DXB-V-012", vehicleType:"Mercedes Sprinter" },
  { id:"p8",  ref:"PKP-2025-008", passengerName:"Mohammed Al-Farsi",  nationality:"Omani",     flight:"WY-108",  terminal:"T1",  arrivalAt:"11 Jan 2025 12:00", dropoff:"Sharjah Hotel",               scheduledPickup:"11 Jan 2025 12:30", status:"scheduled",  pax:2 },
];

// ── Drivers ───────────────────────────────────────────────────────────────────
export const DRIVERS: Driver[] = [
  { id:"dr1", name:"Ahmed Al-Mansoori", phone:"+971 50 111 2233", nationalId:"784-1985-1234567-1", licenseNo:"DXB-DL-112233", licenseExpiry:"30 Jun 2027", status:"on_trip",   currentVehicle:"DXB-C-123", tripsToday:2, totalTrips:1248, rating:4.9, languages:["Arabic","English"]              },
  { id:"dr2", name:"Saeed Al-Maktoum",  phone:"+971 55 222 3344", nationalId:"784-1978-7654321-2", licenseNo:"DXB-DL-334455", licenseExpiry:"15 Dec 2026", status:"available",                         tripsToday:1, totalTrips:982,  rating:4.8, languages:["Arabic","English","Urdu"]        },
  { id:"dr3", name:"Omar Al-Hassan",    phone:"+971 52 333 4455", nationalId:"784-1990-2345678-3", licenseNo:"DXB-DL-556677", licenseExpiry:"22 Mar 2028", status:"available",                         tripsToday:0, totalTrips:764,  rating:4.7, languages:["Arabic","English","Hindi"]       },
  { id:"dr4", name:"Khalid Rashid",     phone:"+971 56 444 5566", nationalId:"784-1982-3456789-4", licenseNo:"DXB-DL-778899", licenseExpiry:"08 Sep 2027", status:"available",                         tripsToday:0, totalTrips:1502, rating:4.9, languages:["Arabic","English"]              },
  { id:"dr5", name:"Faisal Al-Nuaimi",  phone:"+971 50 555 6677", nationalId:"784-1975-4567890-5", licenseNo:"DXB-DL-990011", licenseExpiry:"14 Feb 2026", status:"off_duty",                          tripsToday:3, totalTrips:2108, rating:4.6, languages:["Arabic","English","Russian"]     },
  { id:"dr6", name:"Hassan Bilal",      phone:"+971 55 666 7788", nationalId:"PK-XB-123456",       licenseNo:"DXB-DL-221133", licenseExpiry:"20 Nov 2027", status:"on_trip",   currentVehicle:"DXB-V-789",tripsToday:2, totalTrips:634,  rating:4.7, languages:["Urdu","English","Arabic"]       },
  { id:"dr7", name:"Suresh Nair",       phone:"+971 58 777 8899", nationalId:"IN-KL-987654",       licenseNo:"DXB-DL-443355", licenseExpiry:"05 Aug 2028", status:"available",                         tripsToday:1, totalTrips:889,  rating:4.8, languages:["Malayalam","Hindi","English"]   },
  { id:"dr8", name:"Mohammed Ismail",   phone:"+971 52 888 9900", nationalId:"EG-CA-654321",       licenseNo:"DXB-DL-665577", licenseExpiry:"01 Apr 2027", status:"leave",                             tripsToday:0, totalTrips:412,  rating:4.5, languages:["Arabic","English"]              },
];

// ── Fleet / Vehicles ──────────────────────────────────────────────────────────
export const VEHICLES: Vehicle[] = [
  { id:"v1",  plate:"DXB-C-123", make:"Mercedes-Benz", model:"S-Class",   year:2023, type:"luxury",   color:"Black", capacity:4, status:"in_service", driverId:"dr1", insuranceExpiry:"31 Dec 2025", lastService:"01 Dec 2024", nextService:"01 Mar 2025", mileage:28400,  gpsLat:25.197, gpsLng:55.274 },
  { id:"v2",  plate:"DXB-C-456", make:"Toyota",        model:"Camry",     year:2022, type:"sedan",    color:"White", capacity:4, status:"available",  driverId:"dr2", insuranceExpiry:"15 Jun 2025", lastService:"15 Nov 2024", nextService:"15 Feb 2025", mileage:61200                                 },
  { id:"v3",  plate:"DXB-S-789", make:"BMW",           model:"X5",        year:2023, type:"suv",      color:"Silver",capacity:5, status:"available",  driverId:"dr3", insuranceExpiry:"28 Feb 2026", lastService:"20 Dec 2024", nextService:"20 Mar 2025", mileage:14800                                 },
  { id:"v4",  plate:"DXB-V-789", make:"Toyota",        model:"Hiace",     year:2021, type:"van",      color:"White", capacity:10,status:"in_service", driverId:"dr6", insuranceExpiry:"30 Sep 2025", lastService:"10 Dec 2024", nextService:"10 Mar 2025", mileage:98700,  gpsLat:24.453, gpsLng:54.377 },
  { id:"v5",  plate:"DXB-V-012", make:"Mercedes-Benz", model:"Sprinter",  year:2022, type:"minibus",  color:"White", capacity:16,status:"available",  driverId:"dr4", insuranceExpiry:"20 Aug 2025", lastService:"05 Jan 2025", nextService:"05 Apr 2025", mileage:52300                                 },
  { id:"v6",  plate:"DXB-L-345", make:"Cadillac",      model:"Escalade",  year:2024, type:"luxury",   color:"Black", capacity:6, status:"available",              insuranceExpiry:"31 Dec 2026", lastService:"15 Dec 2024", nextService:"15 Mar 2025", mileage:4200                                  },
  { id:"v7",  plate:"DXB-C-678", make:"Lexus",         model:"ES350",     year:2022, type:"sedan",    color:"Champagne",capacity:4,status:"maintenance",           insuranceExpiry:"30 Jun 2025", lastService:"08 Jan 2025", nextService:"08 Apr 2025", mileage:44600                                 },
  { id:"v8",  plate:"DXB-S-901", make:"Range Rover",   model:"Vogue",     year:2023, type:"suv",      color:"Santorini Black",capacity:5,status:"available",        insuranceExpiry:"15 Nov 2025", lastService:"20 Dec 2024", nextService:"20 Mar 2025", mileage:19200                                 },
  { id:"v9",  plate:"SHJ-V-234", make:"Toyota",        model:"Coaster",   year:2020, type:"minibus",  color:"White", capacity:22,status:"in_service",             insuranceExpiry:"28 Feb 2025", lastService:"01 Nov 2024", nextService:"01 Feb 2025", mileage:134800, gpsLat:25.335, gpsLng:55.412 },
  { id:"v10", plate:"AUH-C-567", make:"Toyota",        model:"Camry",     year:2023, type:"sedan",    color:"White", capacity:4, status:"available",              insuranceExpiry:"30 Sep 2025", lastService:"10 Jan 2025", nextService:"10 Apr 2025", mileage:22100                                 },
];

// ── Car Rentals ───────────────────────────────────────────────────────────────
export const RENTALS: RentalBooking[] = [
  { id:"ren1", ref:"RNT-2025-001", vehiclePlate:"DXB-S-789", vehicleType:"BMW X5",         customerName:"Wei Zhang",           nationality:"Chinese",  from:"10 Jan 2025", to:"15 Jan 2025", days:5, ratePerDay:1200, totalFare:6000,  withDriver:false, status:"confirmed", issuedBy:"Lina Al-Sayed"   },
  { id:"ren2", ref:"RNT-2025-002", vehiclePlate:"DXB-L-345", vehicleType:"Cadillac Escalade",customerName:"Elena Vasquez",      nationality:"Spanish",  from:"10 Jan 2025", to:"12 Jan 2025", days:2, ratePerDay:2500, totalFare:5000,  withDriver:true,  status:"active",    issuedBy:"James Whitfield" },
  { id:"ren3", ref:"RNT-2025-003", vehiclePlate:"DXB-C-456", vehicleType:"Toyota Camry",   customerName:"Tariq Bashir",         nationality:"Pakistani",from:"12 Jan 2025", to:"19 Jan 2025", days:7, ratePerDay:350,  totalFare:2450,  withDriver:false, status:"confirmed", issuedBy:"Ayesha Rahman"  },
  { id:"ren4", ref:"RNT-2024-198", vehiclePlate:"DXB-S-901", vehicleType:"Range Rover Vogue",customerName:"James Whitmore",    nationality:"British",  from:"05 Jan 2025", to:"09 Jan 2025", days:4, ratePerDay:1800, totalFare:7200,  withDriver:true,  status:"completed", issuedBy:"Lina Al-Sayed"  },
  { id:"ren5", ref:"RNT-2024-195", vehiclePlate:"AUH-C-567", vehicleType:"Toyota Camry",   customerName:"Mohammed Al-Farsi",  nationality:"Omani",    from:"08 Jan 2025", to:"10 Jan 2025", days:2, ratePerDay:380,  totalFare:760,   withDriver:false, status:"cancelled", issuedBy:"Omar Hassan"    },
];

// ── Routes ────────────────────────────────────────────────────────────────────
export const ROUTES: Route[] = [
  { id:"rt1", name:"DXB Airport Transfer",         origin:"Dubai Intl Airport (T3)",    destination:"Dubai Marina",       stops:[],                               distanceKm:35,  durationMin:40,  type:"airport_transfer", priceAED:250  },
  { id:"rt2", name:"AUH Airport Transfer",          origin:"Abu Dhabi Intl Airport",     destination:"Abu Dhabi City",     stops:[],                               distanceKm:28,  durationMin:35,  type:"airport_transfer", priceAED:200  },
  { id:"rt3", name:"Dubai City Tour (Half Day)",    origin:"Downtown Dubai",             destination:"Downtown Dubai",     stops:["JBR Beach","Palm Jumeirah","Old Souk"], distanceKm:60, durationMin:240, type:"city_tour", priceAED:600 },
  { id:"rt4", name:"Dubai–Abu Dhabi Express",       origin:"Dubai",                      destination:"Abu Dhabi",          stops:[],                               distanceKm:140, durationMin:90,  type:"inter_city",      priceAED:450  },
  { id:"rt5", name:"Corporate Daily Shuttle",       origin:"Sharjah Residential Zone",   destination:"DIFC Dubai",         stops:["Deira","Bur Dubai"],            distanceKm:45,  durationMin:60,  type:"corporate",        priceAED:180  },
  { id:"rt6", name:"Desert Safari Transfer",        origin:"Dubai Hotel Zone",           destination:"Al Khayma Desert Camp",stops:["Dubai Safari Park"],          distanceKm:65,  durationMin:75,  type:"city_tour",        priceAED:350  },
];

// ── Invoices ──────────────────────────────────────────────────────────────────
export const TRANSPORT_INVOICES: TransportInvoice[] = [
  { id:"tri1", ref:"TRP-INV-2025-001", type:"corporate",  customer:"PetroAbu Energy",    amount:8400,  date:"09 Jan 2025", status:"pending" },
  { id:"tri2", ref:"TRP-INV-2025-002", type:"rental",     customer:"Wei Zhang",           amount:6000,  date:"10 Jan 2025", status:"pending" },
  { id:"tri3", ref:"TRP-INV-2025-003", type:"pickup",     customer:"Infosys Group",       amount:1800,  date:"07 Jan 2025", status:"paid"    },
  { id:"tri4", ref:"TRP-INV-2024-198", type:"rental",     customer:"James Whitmore",      amount:7200,  date:"05 Jan 2025", status:"paid"    },
  { id:"tri5", ref:"TRP-INV-2024-185", type:"corporate",  customer:"Emirates Group",      amount:28000, date:"01 Jan 2025", status:"paid"    },
  { id:"tri6", ref:"TRP-INV-2024-179", type:"city_tour",  customer:"GITEX Tour Group",    amount:4500,  date:"22 Dec 2024", status:"overdue" },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
