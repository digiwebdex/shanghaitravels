export type MedicalStage = "inquiry"|"documents"|"invitation_letter"|"visa_applied"|"visa_approved"|"treatment_booked"|"arrived"|"treatment"|"follow_up"|"completed"|"cancelled";
export type TreatmentCategory = "oncology"|"cardiology"|"orthopedics"|"fertility"|"neurology"|"ophthalmology"|"dental"|"cosmetic"|"general";

export interface Hospital {
  id: string;
  name: string;
  country: string;
  city: string;
  category: TreatmentCategory[];
  accreditation: string[];
  bedsCount: number;
  foundedYear: number;
  internationalPatients: boolean;
  languages: string[];
  contactEmail: string;
  contactPhone: string;
  rating: number;
  website: string;
  coordinatorName: string;
  coordinatorPhone: string;
}

export interface Doctor {
  id: string;
  hospitalId: string;
  name: string;
  specialty: TreatmentCategory;
  qualification: string;
  experience: number;
  languages: string[];
  rating: number;
  consultFeeUSD: number;
  availability: string;
}

export interface MedicalCase {
  id: string;
  ref: string;
  stage: MedicalStage;
  patientName: string;
  nationality: string;
  gender: "M"|"F";
  dob: string;
  phone: string;
  email: string;
  passportNo: string;
  medicalCondition: string;
  treatmentCategory: TreatmentCategory;
  targetHospital: string;
  targetDoctor?: string;
  country: string;
  estimatedDuration: string;
  companions: number;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvitationLetter {
  id: string;
  caseId: string;
  patientName: string;
  hospital: string;
  doctor: string;
  treatmentType: string;
  appointmentDate: string;
  letterRef: string;
  generatedAt: string;
  sentAt?: string;
  status: "draft"|"sent"|"acknowledged";
}

export interface MedicalVisa {
  id: string;
  caseId: string;
  patientName: string;
  targetCountry: string;
  visaType: string;
  submittedAt?: string;
  appointmentDate?: string;
  status: "not_started"|"appointment_booked"|"submitted"|"approved"|"refused";
  visaNo?: string;
  validFrom?: string;
  validTo?: string;
  companions: number;
}

export interface TreatmentPlan {
  id: string;
  caseId: string;
  patientName: string;
  hospital: string;
  doctor: string;
  diagnosis: string;
  treatmentProcedures: string[];
  estimatedCostUSD: number;
  estimatedCostAED: number;
  duration: string;
  hospitalizations: string;
  followUpVisits: number;
  status: "draft"|"sent_to_patient"|"approved"|"in_progress"|"completed";
  createdAt: string;
}

export interface MedicalAccommodation {
  id: string;
  caseId: string;
  patientName: string;
  city: string;
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  ratePerNight: number;
  totalAED: number;
  status: "searching"|"booked"|"confirmed"|"completed";
  nearHospital: string;
  distanceKm: number;
}

export interface Translator {
  id: string;
  name: string;
  languages: string[];
  specialization: string;
  city: string;
  country: string;
  ratePerDay: number;
  status: "available"|"assigned"|"unavailable";
}

export interface MedicalPayment {
  id: string;
  caseId: string;
  patientName: string;
  description: string;
  amountUSD: number;
  amountAED: number;
  dueDate: string;
  paidDate?: string;
  method?: "bank_transfer"|"card"|"cash"|"insurance";
  status: "unpaid"|"partial"|"paid"|"overdue";
}

// ── Hospitals ─────────────────────────────────────────────────────────────────
export const HOSPITALS: Hospital[] = [
  {
    id:"h1", name:"Apollo Hospitals",          country:"India",  city:"Chennai",    category:["oncology","cardiology","orthopedics","neurology"],
    accreditation:["JCI","NABH"], bedsCount:2200, foundedYear:1983, internationalPatients:true,
    languages:["English","Hindi","Tamil","Arabic"], contactEmail:"international@apollohospitals.com", contactPhone:"+91 44 2829 0200",
    rating:4.8, website:"apollohospitals.com", coordinatorName:"Priya Rajan", coordinatorPhone:"+91 98400 12345",
  },
  {
    id:"h2", name:"Fortis Hospital",            country:"India",  city:"Gurgaon",    category:["cardiology","oncology","fertility","orthopedics"],
    accreditation:["JCI","NABH"], bedsCount:1000, foundedYear:2001, internationalPatients:true,
    languages:["English","Hindi","Arabic"], contactEmail:"intl@fortishealthcare.com", contactPhone:"+91 124 4921 021",
    rating:4.7, website:"fortishealthcare.com", coordinatorName:"Arjun Sharma", coordinatorPhone:"+91 98111 55667",
  },
  {
    id:"h3", name:"Bangkok Hospital",           country:"Thailand",city:"Bangkok",   category:["general","oncology","cosmetic","orthopedics"],
    accreditation:["JCI","ISO"], bedsCount:800, foundedYear:1972, internationalPatients:true,
    languages:["English","Thai","Arabic","Chinese"], contactEmail:"intl@bangkokhospital.com", contactPhone:"+66 2310 3000",
    rating:4.6, website:"bangkokhospital.com", coordinatorName:"Wichai Tanaka", coordinatorPhone:"+66 89 123 4567",
  },
  {
    id:"h4", name:"Anadolu Medical Center",     country:"Turkey", city:"Istanbul",   category:["oncology","cardiology","fertility","neurology"],
    accreditation:["JCI"], bedsCount:435, foundedYear:2005, internationalPatients:true,
    languages:["English","Turkish","Arabic","Russian"], contactEmail:"international@anadolumedical.com", contactPhone:"+90 216 444 4673",
    rating:4.9, website:"anadolumedical.com", coordinatorName:"Selin Yilmaz", coordinatorPhone:"+90 532 111 2233",
  },
  {
    id:"h5", name:"Cleveland Clinic Abu Dhabi",  country:"UAE",    city:"Abu Dhabi",  category:["cardiology","neurology","oncology","orthopedics"],
    accreditation:["JCI","CCHAPS"], bedsCount:364, foundedYear:2015, internationalPatients:true,
    languages:["English","Arabic"], contactEmail:"intl@clevelandclinicabudhabi.ae", contactPhone:"+971 2 501 9000",
    rating:4.9, website:"clevelandclinicabudhabi.ae", coordinatorName:"Ahmed Al-Sayed", coordinatorPhone:"+971 50 111 2244",
  },
];

// ── Doctors ───────────────────────────────────────────────────────────────────
export const DOCTORS: Doctor[] = [
  { id:"dr1", hospitalId:"h1", name:"Dr. Suresh Raghavan",   specialty:"oncology",     qualification:"MD, FRCS, DNB Oncology",        experience:22, languages:["English","Hindi","Tamil"],    rating:4.9, consultFeeUSD:200, availability:"Mon-Fri 10am-4pm" },
  { id:"dr2", hospitalId:"h1", name:"Dr. Jayashree Menon",   specialty:"cardiology",   qualification:"MD Cardiology, DM, FACC",       experience:18, languages:["English","Hindi"],            rating:4.8, consultFeeUSD:180, availability:"Mon-Thu 9am-3pm"  },
  { id:"dr3", hospitalId:"h4", name:"Dr. Kemal Arslan",      specialty:"oncology",     qualification:"MD, PhD, European Board Cert",  experience:25, languages:["English","Turkish","Arabic"],  rating:5.0, consultFeeUSD:350, availability:"Mon-Fri 9am-5pm"  },
  { id:"dr4", hospitalId:"h4", name:"Prof. Hüseyin Demir",   specialty:"cardiology",   qualification:"Prof. MD, FACC, FESC",          experience:30, languages:["English","Turkish"],           rating:4.9, consultFeeUSD:400, availability:"Tue-Sat 8am-2pm"  },
  { id:"dr5", hospitalId:"h5", name:"Dr. Eric Pennington",   specialty:"cardiology",   qualification:"MD, PhD (Cleveland Clinic OH)", experience:20, languages:["English","Arabic"],            rating:5.0, consultFeeUSD:500, availability:"Mon-Fri 8am-4pm"  },
  { id:"dr6", hospitalId:"h3", name:"Dr. Wichaya Charoenwong",specialty:"cosmetic",    qualification:"MD, MBBS, Thai Board Plastics", experience:15, languages:["English","Thai","Chinese"],    rating:4.7, consultFeeUSD:300, availability:"Mon-Sat 10am-6pm" },
];

// ── Medical Cases ─────────────────────────────────────────────────────────────
export const MEDICAL_CASES: MedicalCase[] = [
  { id:"mc1", ref:"MED-2025-001", stage:"visa_approved",    patientName:"Khalid Al-Rashidi",  nationality:"Emirati",    gender:"M", dob:"12 Mar 1958", phone:"+971 50 112 2334", email:"khalid@email.com", passportNo:"UAE-33221100", medicalCondition:"Lung Cancer (Stage II)",   treatmentCategory:"oncology",    targetHospital:"Anadolu Medical Center",  targetDoctor:"Dr. Kemal Arslan",       country:"Turkey",  estimatedDuration:"3 weeks", companions:2, assignedTo:"Ayesha Rahman",   createdAt:"15 Nov 2024", updatedAt:"07 Jan 2025" },
  { id:"mc2", ref:"MED-2025-002", stage:"treatment",        patientName:"Nadia Farooq",        nationality:"Pakistani",  gender:"F", dob:"04 Sep 1978", phone:"+92 321 5678901",  email:"nadia@email.com",  passportNo:"PK-GH567890", medicalCondition:"IVF Treatment Cycle 2", treatmentCategory:"fertility",   targetHospital:"Fortis Hospital",         targetDoctor:"",                       country:"India",   estimatedDuration:"2 weeks", companions:1, assignedTo:"Lina Al-Sayed",   createdAt:"01 Dec 2024", updatedAt:"09 Jan 2025" },
  { id:"mc3", ref:"MED-2025-003", stage:"invitation_letter",patientName:"Hassan Al-Otaibi",   nationality:"Saudi",      gender:"M", dob:"28 Jun 1965", phone:"+966 50 333 4455", email:"hassan@email.com", passportNo:"SA-A1234567", medicalCondition:"Coronary Artery Disease",treatmentCategory:"cardiology",  targetHospital:"Cleveland Clinic Abu Dhabi",targetDoctor:"Dr. Eric Pennington",   country:"UAE",     estimatedDuration:"1 week",  companions:1, assignedTo:"James Whitfield", createdAt:"05 Jan 2025", updatedAt:"09 Jan 2025" },
  { id:"mc4", ref:"MED-2025-004", stage:"inquiry",           patientName:"Amina Bangura",      nationality:"Sierra Leonean",gender:"F",dob:"15 Jan 1992",phone:"+232 76 123456",   email:"amina@email.com",  passportNo:"SL-P123456",  medicalCondition:"Hip Replacement",       treatmentCategory:"orthopedics", targetHospital:"Apollo Hospitals",       targetDoctor:"",                       country:"India",   estimatedDuration:"2 weeks", companions:1, assignedTo:"Omar Hassan",     createdAt:"08 Jan 2025", updatedAt:"09 Jan 2025" },
  { id:"mc5", ref:"MED-2025-005", stage:"completed",         patientName:"Wei Zhang",           nationality:"Chinese",    gender:"M", dob:"20 Apr 1970", phone:"+86 138 1234 5678",email:"wei@email.com",    passportNo:"CN-G12345678",medicalCondition:"LASIK Eye Surgery",      treatmentCategory:"ophthalmology",targetHospital:"Bangkok Hospital",        targetDoctor:"",                       country:"Thailand",estimatedDuration:"5 days",  companions:0, assignedTo:"Ayesha Rahman",   createdAt:"01 Oct 2024", updatedAt:"05 Jan 2025" },
];

// ── Invitation Letters ────────────────────────────────────────────────────────
export const INVITATION_LETTERS: InvitationLetter[] = [
  { id:"il1", caseId:"mc1", patientName:"Khalid Al-Rashidi", hospital:"Anadolu Medical Center",      doctor:"Dr. Kemal Arslan",    treatmentType:"Lung Cancer Treatment",  appointmentDate:"20 Jan 2025", letterRef:"ANA-IL-2025-001", generatedAt:"28 Dec 2024", sentAt:"28 Dec 2024", status:"acknowledged" },
  { id:"il2", caseId:"mc2", patientName:"Nadia Farooq",       hospital:"Fortis Hospital",              doctor:"Dr. Sunita Gupta",    treatmentType:"IVF Treatment",          appointmentDate:"08 Jan 2025", letterRef:"FRT-IL-2025-001", generatedAt:"20 Dec 2024", sentAt:"21 Dec 2024", status:"acknowledged" },
  { id:"il3", caseId:"mc3", patientName:"Hassan Al-Otaibi",   hospital:"Cleveland Clinic Abu Dhabi",  doctor:"Dr. Eric Pennington", treatmentType:"Cardiac Consultation",   appointmentDate:"20 Jan 2025", letterRef:"CCA-IL-2025-001", generatedAt:"07 Jan 2025", status:"draft" },
];

// ── Medical Visas ─────────────────────────────────────────────────────────────
export const MEDICAL_VISAS: MedicalVisa[] = [
  { id:"mv1", caseId:"mc1", patientName:"Khalid Al-Rashidi", targetCountry:"Turkey",  visaType:"Medical Visa",   submittedAt:"02 Jan 2025", status:"approved", visaNo:"TR-MED-778899", validFrom:"15 Jan 2025", validTo:"15 Apr 2025", companions:2 },
  { id:"mv2", caseId:"mc2", patientName:"Nadia Farooq",       targetCountry:"India",   visaType:"Medical Visa",   submittedAt:"22 Dec 2024", status:"approved", visaNo:"IN-MED-556677", validFrom:"01 Jan 2025", validTo:"01 Apr 2025", companions:1 },
  { id:"mv3", caseId:"mc3", patientName:"Hassan Al-Otaibi",   targetCountry:"UAE",     visaType:"N/A - Resident", status:"approved",                                                   companions:1 },
  { id:"mv4", caseId:"mc4", patientName:"Amina Bangura",       targetCountry:"India",   visaType:"Medical Visa",   status:"not_started", companions:1 },
];

// ── Treatment Plans ───────────────────────────────────────────────────────────
export const TREATMENT_PLANS: TreatmentPlan[] = [
  { id:"tpl1", caseId:"mc1", patientName:"Khalid Al-Rashidi", hospital:"Anadolu Medical Center",     doctor:"Dr. Kemal Arslan",    diagnosis:"Non-Small Cell Lung Cancer Stage II", treatmentProcedures:["PET-CT Scan","VATS Lobectomy","4 cycles Chemotherapy"], estimatedCostUSD:18500, estimatedCostAED:67925, duration:"3 weeks + 4 chemo cycles", hospitalizations:"4 nights post-surgery", followUpVisits:4, status:"in_progress", createdAt:"29 Dec 2024" },
  { id:"tpl2", caseId:"mc2", patientName:"Nadia Farooq",       hospital:"Fortis Hospital",             doctor:"Dr. Sunita Gupta",    diagnosis:"Primary Infertility",                treatmentProcedures:["Hormonal Stimulation","Egg Retrieval","Embryo Transfer"], estimatedCostUSD:4200, estimatedCostAED:15414, duration:"14 days", hospitalizations:"Day procedure",    followUpVisits:2, status:"in_progress", createdAt:"21 Dec 2024" },
  { id:"tpl3", caseId:"mc3", patientName:"Hassan Al-Otaibi",   hospital:"Cleveland Clinic Abu Dhabi", doctor:"Dr. Eric Pennington", diagnosis:"Triple Vessel Coronary Disease",      treatmentProcedures:["Coronary Angiography","CABG Surgery","Cardiac Rehab"],   estimatedCostUSD:35000, estimatedCostAED:128450, duration:"10 days",hospitalization:"7 nights ICU+ward",  followUpVisits:6, status:"sent_to_patient", createdAt:"07 Jan 2025" },
];

// ── Accommodation ─────────────────────────────────────────────────────────────
export const MEDICAL_ACCOMM: MedicalAccommodation[] = [
  { id:"ma1", caseId:"mc1", patientName:"Khalid Al-Rashidi", city:"Istanbul",  hotelName:"DoubleTree Istanbul Bagcilar", roomType:"Family Room", checkIn:"18 Jan 2025", checkOut:"11 Feb 2025", nights:24, ratePerNight:280, totalAED:18816,  status:"confirmed", nearHospital:"Anadolu Medical Center",     distanceKm:2.1 },
  { id:"ma2", caseId:"mc2", patientName:"Nadia Farooq",       city:"Gurgaon",   hotelName:"Courtyard Marriott Gurgaon",  roomType:"Superior",    checkIn:"07 Jan 2025", checkOut:"21 Jan 2025", nights:14, ratePerNight:190, totalAED:7980,   status:"confirmed", nearHospital:"Fortis Hospital",             distanceKm:0.8 },
  { id:"ma3", caseId:"mc3", patientName:"Hassan Al-Otaibi",   city:"Abu Dhabi", hotelName:"Sofitel Abu Dhabi",           roomType:"Deluxe",      checkIn:"20 Jan 2025", checkOut:"28 Jan 2025", nights:8,  ratePerNight:650, totalAED:15600,  status:"booked",    nearHospital:"Cleveland Clinic Abu Dhabi", distanceKm:1.5 },
];

// ── Translators ───────────────────────────────────────────────────────────────
export const TRANSLATORS: Translator[] = [
  { id:"tr1", name:"Yusuf Al-Turki",      languages:["Arabic","Turkish","English"], specialization:"Medical",          city:"Istanbul",   country:"Turkey",  ratePerDay:400, status:"assigned"    },
  { id:"tr2", name:"Praveena Krishnamurti",languages:["Tamil","Hindi","English"],   specialization:"Medical",          city:"Chennai",    country:"India",   ratePerDay:200, status:"available"   },
  { id:"tr3", name:"Wang Fang",            languages:["Chinese","Thai","English"],  specialization:"Medical Tourism",  city:"Bangkok",    country:"Thailand",ratePerDay:250, status:"available"   },
  { id:"tr4", name:"Olga Petrova",         languages:["Russian","English","Arabic"],specialization:"Medical",          city:"Dubai",      country:"UAE",     ratePerDay:350, status:"available"   },
];

// ── Medical Payments ──────────────────────────────────────────────────────────
export const MEDICAL_PAYMENTS: MedicalPayment[] = [
  { id:"mp1", caseId:"mc1", patientName:"Khalid Al-Rashidi", description:"Hospital Deposit — Anadolu",           amountUSD:5000,  amountAED:18350, dueDate:"15 Jan 2025", paidDate:"12 Jan 2025", method:"bank_transfer", status:"paid"    },
  { id:"mp2", caseId:"mc1", patientName:"Khalid Al-Rashidi", description:"Treatment Balance — Anadolu",          amountUSD:13500, amountAED:49545, dueDate:"05 Feb 2025",                                                    status:"unpaid"  },
  { id:"mp3", caseId:"mc2", patientName:"Nadia Farooq",       description:"IVF Full Package — Fortis",           amountUSD:4200,  amountAED:15414, dueDate:"05 Jan 2025", paidDate:"03 Jan 2025", method:"bank_transfer", status:"paid"    },
  { id:"mp4", caseId:"mc3", patientName:"Hassan Al-Otaibi",   description:"Cardiac Treatment Deposit — CC AUH",  amountUSD:10000, amountAED:36700, dueDate:"18 Jan 2025",                                                    status:"unpaid"  },
  { id:"mp5", caseId:"mc5", patientName:"Wei Zhang",           description:"LASIK Surgery — Bangkok Hosp",        amountUSD:2800,  amountAED:10276, dueDate:"15 Nov 2024", paidDate:"13 Nov 2024", method:"card",           status:"paid"    },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
