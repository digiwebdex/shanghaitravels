export type PassportStatus = "in_locker"|"returned"|"processing"|"pending_return";

export interface PassportRecord {
  id: string; ownerName: string; nationality: string;
  passportNo: string; dob: string; expiry: string; gender: "M"|"F";
  mrz1: string; mrz2: string;
  receivedAt: string; lockerId?: string;
  status: PassportStatus; handler: string;
  faceDetected: boolean; duplicateFlag: boolean; mrzValid: boolean;
  returnDue?: string; returnedAt?: string;
  notes?: string;
}

export interface LockerSlot {
  id: string; number: number; row: string; col: number;
  occupied: boolean; passportId?: string;
}

export interface VisaType {
  id: string; country: string; flag: string; visaType: string;
  duration: string; maxStay: string; feeAED: number;
  processingDays: string; validity: string; notes: string;
}

export interface PassportLog {
  id: string; action: "received"|"tagged"|"stored"|"returned"|"flagged";
  passportNo: string; ownerName: string; by: string; at: string; notes?: string;
}

// ── Passport Records ──────────────────────────────────────────────────────────
export const PASSPORTS: PassportRecord[] = [
  {
    id:"pp1", ownerName:"Wei Zhang", nationality:"Chinese", passportNo:"CN7890123",
    dob:"15 Apr 1985", expiry:"31 Dec 2029", gender:"M",
    mrz1:"P<CHNZHANG<<WEI<<<<<<<<<<<<<<<<<<<<<<<<<",
    mrz2:"CN7890123<1CHN8504159M2912319<<<<<<<<<<<<2",
    receivedAt:"09 Jan 2025 10:30", lockerId:"L03", status:"in_locker",
    handler:"Omar Hassan", faceDetected:true, duplicateFlag:false, mrzValid:true,
    returnDue:"15 Jan 2025", notes:"USA B1/B2 visa processing — embassy appointment Feb 3.",
  },
  {
    id:"pp2", ownerName:"Amira Hassan", nationality:"Egyptian", passportNo:"EG9012345",
    dob:"22 Nov 1989", expiry:"15 Mar 2028", gender:"F",
    mrz1:"P<EGYHASSAN<<AMIRA<<<<<<<<<<<<<<<<<<<<<<<<",
    mrz2:"EG901234522EGY8911228F2803153<<<<<<<<<<<<6",
    receivedAt:"08 Jan 2025 14:00", lockerId:"L07", status:"in_locker",
    handler:"Ayesha Rahman", faceDetected:true, duplicateFlag:false, mrzValid:true,
    returnDue:"12 Jan 2025",
  },
  {
    id:"pp3", ownerName:"David Okafor", nationality:"Nigerian", passportNo:"NG3456789",
    dob:"05 Aug 1976", expiry:"20 Jun 2027", gender:"M",
    mrz1:"P<NGAOKAFOR<<DAVID<<<<<<<<<<<<<<<<<<<<<<<<",
    mrz2:"NG345678935NGA7608058M2706208<<<<<<<<<<<<4",
    receivedAt:"07 Jan 2025 09:00", lockerId:"L12", status:"in_locker",
    handler:"Omar Hassan", faceDetected:true, duplicateFlag:false, mrzValid:true,
    returnDue:"13 Jan 2025",
  },
  {
    id:"pp4", ownerName:"Priya Menon", nationality:"Indian", passportNo:"IN5678901",
    dob:"14 Sep 1991", expiry:"09 Oct 2031", gender:"F",
    mrz1:"P<INDMENON<<PRIYA<<<<<<<<<<<<<<<<<<<<<<<<",
    mrz2:"IN567890141IND9109148F3110093<<<<<<<<<<<<8",
    receivedAt:"06 Jan 2025 11:30", lockerId:"L15", status:"in_locker",
    handler:"James Whitfield", faceDetected:true, duplicateFlag:false, mrzValid:true,
    returnDue:"14 Jan 2025",
  },
  {
    id:"pp5", ownerName:"Mustafa Al-Zaabi", nationality:"Emirati", passportNo:"AE7654321",
    dob:"30 Mar 1980", expiry:"12 Sep 2030", gender:"M",
    mrz1:"P<ARAAL-ZAABI<<MUSTAFA<<<<<<<<<<<<<<<<<<<",
    mrz2:"AE765432128UAE8003303M3009128<<<<<<<<<<<<4",
    receivedAt:"05 Jan 2025 15:00", lockerId:"L19", status:"processing",
    handler:"Lina Al-Sayed", faceDetected:true, duplicateFlag:false, mrzValid:true,
    returnDue:"11 Jan 2025",
  },
  {
    id:"pp6", ownerName:"Unknown Person", nationality:"Unknown", passportNo:"XX1234567",
    dob:"01 Jan 1990", expiry:"01 Jan 2025", gender:"M",
    mrz1:"P<XXXUNKNOWN<<PERSON<<<<<<<<<<<<<<<<<<<<<<",
    mrz2:"XX123456798XXX9001018M2501014<<<<<<<<<<<<3",
    receivedAt:"09 Jan 2025 16:00", status:"pending_return",
    handler:"Omar Hassan", faceDetected:false, duplicateFlag:true, mrzValid:false,
    notes:"FLAGGED: Face not detected. Suspected duplicate. Compliance notified.",
  },
  {
    id:"pp7", ownerName:"James Whitmore", nationality:"British", passportNo:"GB5432101",
    dob:"12 Mar 1978", expiry:"22 Aug 2033", gender:"M",
    mrz1:"P<GBKWHITMORE<<JAMES<<<<<<<<<<<<<<<<<<<<<<",
    mrz2:"GB543210115GBR7803123M3308224<<<<<<<<<<<<0",
    receivedAt:"03 Jan 2025 10:00", returnedAt:"07 Jan 2025 14:00", status:"returned",
    handler:"Ayesha Rahman", faceDetected:true, duplicateFlag:false, mrzValid:true,
  },
  {
    id:"pp8", ownerName:"Elena Vasquez", nationality:"Spanish", passportNo:"ES2345678",
    dob:"19 Feb 1982", expiry:"03 Jul 2032", gender:"F",
    mrz1:"P<ESPVASQUEZ<<ELENA<<<<<<<<<<<<<<<<<<<<<<<",
    mrz2:"ES234567828ESP8202199M3207034<<<<<<<<<<<<6",
    receivedAt:"28 Dec 2024 09:30", lockerId:"L22", status:"in_locker",
    handler:"James Whitfield", faceDetected:true, duplicateFlag:false, mrzValid:true,
    returnDue:"10 Jan 2025",
  },
];

// ── Locker Grid (30 slots: 5 rows × 6 cols) ───────────────────────────────────
const OCCUPIED_IDS: Record<string, string> = {
  "L03":"pp1","L07":"pp2","L12":"pp3","L15":"pp4","L19":"pp5","L22":"pp8",
};
export const LOCKER_SLOTS: LockerSlot[] = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  const id = `L${String(n).padStart(2, "0")}`;
  const ppId = OCCUPIED_IDS[id];
  return { id, number: n, row: "ABCDE"[Math.floor(i / 6)], col: (i % 6) + 1, occupied: !!ppId, passportId: ppId };
});

// ── Visa Types Reference ──────────────────────────────────────────────────────
export const VISA_TYPES: VisaType[] = [
  { id:"vt1",  country:"United Kingdom",     flag:"🇬🇧", visaType:"Standard Visitor",     duration:"6 months",  maxStay:"6 months",  feeAED:735,  processingDays:"15-21", validity:"6 months", notes:"Bank statements 3 months, ITR" },
  { id:"vt2",  country:"Schengen Area",      flag:"🇪🇺", visaType:"Short Stay C Visa",    duration:"90 days",   maxStay:"90 days",   feeAED:330,  processingDays:"10-15", validity:"Single/Multiple", notes:"Travel insurance mandatory" },
  { id:"vt3",  country:"United States",      flag:"🇺🇸", visaType:"B1/B2 Visitor",        duration:"10 years",  maxStay:"6 months",  feeAED:600,  processingDays:"30-90", validity:"10 years", notes:"DS-160, interview required" },
  { id:"vt4",  country:"Canada",             flag:"🇨🇦", visaType:"Temporary Resident",   duration:"10 years",  maxStay:"6 months",  feeAED:420,  processingDays:"14-21", validity:"10 years", notes:"Biometrics required, online filing" },
  { id:"vt5",  country:"Australia",          flag:"🇦🇺", visaType:"Tourist (subclass 600)",duration:"12 months",maxStay:"3 months",  feeAED:505,  processingDays:"20-40", validity:"12 months",notes:"Health insurance recommended" },
  { id:"vt6",  country:"UAE",               flag:"🇦🇪", visaType:"Visit Visa (60 days)",  duration:"60 days",   maxStay:"60 days",   feeAED:400,  processingDays:"3-5",   validity:"60 days",  notes:"Sponsor required or hotel booking" },
  { id:"vt7",  country:"Turkey",            flag:"🇹🇷", visaType:"e-Visa",               duration:"180 days",  maxStay:"90 days",   feeAED:150,  processingDays:"1-3",   validity:"Multiple", notes:"Online application only" },
  { id:"vt8",  country:"China",             flag:"🇨🇳", visaType:"L — Tourism",          duration:"10 years",  maxStay:"30 days",   feeAED:440,  processingDays:"7-10",  validity:"Multiple", notes:"Invitation letter or hotel proof" },
  { id:"vt9",  country:"Singapore",         flag:"🇸🇬", visaType:"Short-term visit",     duration:"30 days",   maxStay:"30 days",   feeAED:170,  processingDays:"3-5",   validity:"Single",   notes:"Bank statements, employment letter" },
  { id:"vt10", country:"South Korea",       flag:"🇰🇷", visaType:"C-3 Tourist",          duration:"90 days",   maxStay:"60 days",   feeAED:310,  processingDays:"5-7",   validity:"Multiple", notes:"Return ticket + hotel booking" },
  { id:"vt11", country:"Japan",             flag:"🇯🇵", visaType:"Short-stay Tourist",   duration:"5 years",   maxStay:"90 days",   feeAED:330,  processingDays:"5-10",  validity:"Multiple", notes:"Detailed itinerary required" },
  { id:"vt12", country:"New Zealand",       flag:"🇳🇿", visaType:"Visitor (9)",          duration:"9 months",  maxStay:"3 months",  feeAED:520,  processingDays:"14-25", validity:"9 months", notes:"Online eVisa available for some nationalities" },
  { id:"vt13", country:"Saudi Arabia",      flag:"🇸🇦", visaType:"Tourist",              duration:"1 year",    maxStay:"90 days",   feeAED:540,  processingDays:"3-7",   validity:"Multiple", notes:"e-Visa for many nationalities" },
  { id:"vt14", country:"India",             flag:"🇮🇳", visaType:"e-Tourist Visa",       duration:"1 year",    maxStay:"60 days",   feeAED:255,  processingDays:"3-5",   validity:"Double",   notes:"Online only. Photo + passport required." },
  { id:"vt15", country:"Thailand",          flag:"🇹🇭", visaType:"Tourist Visa",         duration:"60 days",   maxStay:"60 days",   feeAED:185,  processingDays:"5-7",   validity:"Single",   notes:"Extendable for 30 days on arrival" },
];

// ── Passport Activity Log ─────────────────────────────────────────────────────
export const PASSPORT_LOG: PassportLog[] = [
  { id:"pl1",  action:"received", passportNo:"CN7890123", ownerName:"Wei Zhang",         by:"Omar Hassan",    at:"09 Jan 2025 10:30", notes:"UAE visa processing intake" },
  { id:"pl2",  action:"tagged",   passportNo:"CN7890123", ownerName:"Wei Zhang",         by:"Omar Hassan",    at:"09 Jan 2025 10:32"                                     },
  { id:"pl3",  action:"stored",   passportNo:"CN7890123", ownerName:"Wei Zhang",         by:"Omar Hassan",    at:"09 Jan 2025 10:35", notes:"Assigned locker L03"        },
  { id:"pl4",  action:"received", passportNo:"EG9012345", ownerName:"Amira Hassan",      by:"Ayesha Rahman",  at:"08 Jan 2025 14:00"                                     },
  { id:"pl5",  action:"stored",   passportNo:"EG9012345", ownerName:"Amira Hassan",      by:"Ayesha Rahman",  at:"08 Jan 2025 14:10", notes:"Assigned locker L07"        },
  { id:"pl6",  action:"returned", passportNo:"GB5432101", ownerName:"James Whitmore",    by:"Ayesha Rahman",  at:"07 Jan 2025 14:00", notes:"Visa approved and stamped"  },
  { id:"pl7",  action:"flagged",  passportNo:"XX1234567", ownerName:"Unknown Person",    by:"Omar Hassan",    at:"09 Jan 2025 16:05", notes:"Duplicate risk — compliance notified" },
  { id:"pl8",  action:"received", passportNo:"NG3456789", ownerName:"David Okafor",      by:"Omar Hassan",    at:"07 Jan 2025 09:00"                                     },
  { id:"pl9",  action:"stored",   passportNo:"NG3456789", ownerName:"David Okafor",      by:"Omar Hassan",    at:"07 Jan 2025 09:15", notes:"Assigned locker L12"        },
  { id:"pl10", action:"received", passportNo:"IN5678901", ownerName:"Priya Menon",       by:"James Whitfield",at:"06 Jan 2025 11:30"                                     },
  { id:"pl11", action:"stored",   passportNo:"IN5678901", ownerName:"Priya Menon",       by:"James Whitfield",at:"06 Jan 2025 11:45", notes:"Assigned locker L15"        },
  { id:"pl12", action:"received", passportNo:"AE7654321", ownerName:"Mustafa Al-Zaabi", by:"Lina Al-Sayed",  at:"05 Jan 2025 15:00"                                     },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
