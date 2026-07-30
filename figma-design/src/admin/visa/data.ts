export type VisaStage = "inquiry"|"ocr"|"checklist"|"documents"|"validation"|"invoice"|"payment"|"assigned"|"submission"|"processing"|"interview"|"approved"|"passport_recv"|"delivery"|"archive";
export type AppPriority = "urgent"|"high"|"normal";
export type AppStatus   = "active"|"on_hold"|"rejected"|"completed";

export interface Embassy {
  id: string; country: string; flag: string; embassyName: string;
  address: string; phone: string; hours: string;
  visaTypes: string[]; status: "operational"|"limited"|"closed";
}
export interface VisaApplication {
  id: string; ref: string; applicantName: string; nationality: string;
  passportNo: string; visaType: string; destination: string;
  stage: VisaStage; priority: AppPriority; assignedTo: string;
  createdAt: string; updatedAt: string; fee: number;
  interviewDate?: string; submittedAt?: string; decision?: "approved"|"rejected";
  documents: { name: string; status: "uploaded"|"verified"|"rejected"|"missing" }[];
}
export interface ChecklistDoc   { name: string; required: boolean; notes: string; }
export interface ChecklistTpl   { id: string; visaType: string; destination: string; documents: ChecklistDoc[]; }
export interface Interview       { id: string; appRef: string; applicantName: string; visaType: string; embassy: string; scheduledAt: string; status: "scheduled"|"completed"|"no_show"|"rescheduled"; }
export interface BiometricEntry  { id: string; appRef: string; applicantName: string; nationality: string; btype: string; appointmentAt: string; location: string; status: "pending"|"completed"|"failed"; }
export interface EmbassySubmission { id: string; ref: string; appRef: string; embassy: string; country: string; visaType: string; submittedAt: string; expectedAt: string; trackingRef: string; status: "submitted"|"acknowledged"|"processing"|"decision_ready"; }
export interface DeliveryRecord  { id: string; appRef: string; ownerName: string; type: "collection"|"delivery"; address?: string; scheduledAt: string; status: "pending"|"dispatched"|"completed"|"failed"; driverName?: string; }

// ── 15 Stages ─────────────────────────────────────────────────────────────────
export const VISA_STAGES: { key: VisaStage; label: string; short: string }[] = [
  { key:"inquiry",      label:"Inquiry Received",    short:"Inquiry"    },
  { key:"ocr",          label:"Passport OCR",         short:"OCR"        },
  { key:"checklist",    label:"Checklist",            short:"Checklist"  },
  { key:"documents",    label:"Document Upload",      short:"Docs"       },
  { key:"validation",   label:"AI Validation",        short:"Validate"   },
  { key:"invoice",      label:"Invoice Raised",       short:"Invoice"    },
  { key:"payment",      label:"Payment Received",     short:"Payment"    },
  { key:"assigned",     label:"Staff Assigned",       short:"Assigned"   },
  { key:"submission",   label:"Embassy Submission",   short:"Submit"     },
  { key:"processing",   label:"Processing",           short:"Processing" },
  { key:"interview",    label:"Interview/Biometric",  short:"Interview"  },
  { key:"approved",     label:"Visa Approved",        short:"Approved"   },
  { key:"passport_recv",label:"Passport Received",    short:"Recv"       },
  { key:"delivery",     label:"Delivery",             short:"Delivery"   },
  { key:"archive",      label:"Archive",              short:"Archive"    },
];

// ── Embassies ─────────────────────────────────────────────────────────────────
export const EMBASSIES: Embassy[] = [
  { id:"e1",  country:"United Kingdom",  flag:"🇬🇧", embassyName:"British Embassy Abu Dhabi",       address:"Al Hamiyah St, Abu Dhabi",            phone:"+971 2 610 1100", hours:"Mon–Fri 08:00–16:00", visaTypes:["Standard Visitor","Student","Work"],     status:"operational" },
  { id:"e2",  country:"Schengen / Germany",flag:"🇩🇪",embassyName:"German Consulate Dubai",         address:"Jumeirah Rd, Dubai",                  phone:"+971 4 349 8888", hours:"Mon–Fri 09:00–12:00", visaTypes:["Short-Stay C","Airport Transit"],        status:"operational" },
  { id:"e3",  country:"United States",   flag:"🇺🇸", embassyName:"US Consulate Dubai",              address:"Trade Centre Area, Dubai",            phone:"+1 202 501 4444", hours:"Mon–Fri 08:00–11:00", visaTypes:["B1/B2","F1 Student","H1B"],              status:"operational" },
  { id:"e4",  country:"Canada",          flag:"🇨🇦", embassyName:"Canadian Embassy Abu Dhabi",      address:"Al Muneera St, Abu Dhabi",            phone:"+971 2 694 4600", hours:"Mon–Fri 08:30–13:30", visaTypes:["Visitor","Student","Work Permit"],       status:"operational" },
  { id:"e5",  country:"Australia",       flag:"🇦🇺", embassyName:"Australian Consulate Dubai",      address:"Dubai International Financial Ctr",   phone:"+971 4 508 7100", hours:"Mon–Fri 09:00–12:00", visaTypes:["Tourist","Student","Business"],          status:"limited"     },
  { id:"e6",  country:"Schengen / France",flag:"🇫🇷",embassyName:"French Consulate Dubai",          address:"Oud Metha, Dubai",                    phone:"+971 4 508 7300", hours:"Mon–Fri 09:00–12:00", visaTypes:["Short-Stay C","Long-Stay D"],            status:"operational" },
  { id:"e7",  country:"China",           flag:"🇨🇳", embassyName:"Chinese Consulate Dubai",         address:"Jumeirah, Dubai",                     phone:"+971 4 394 4733", hours:"Mon–Fri 09:00–11:30", visaTypes:["L Tourist","M Business","X Student"],   status:"operational" },
  { id:"e8",  country:"India",           flag:"🇮🇳", embassyName:"Indian Consulate Dubai",          address:"Al Hamriya, Dubai",                   phone:"+971 4 397 1222", hours:"Mon–Fri 09:00–13:00", visaTypes:["e-Tourist","Business","Employment"],     status:"operational" },
  { id:"e9",  country:"Schengen / Italy",flag:"🇮🇹", embassyName:"Italian Consulate Dubai",         address:"Al Wasl Rd, Dubai",                   phone:"+971 4 331 4167", hours:"Mon–Fri 09:00–12:00", visaTypes:["Short-Stay C","Long-Stay D"],            status:"operational" },
  { id:"e10", country:"Japan",           flag:"🇯🇵", embassyName:"Japanese Consulate Dubai",        address:"Al Mankhool, Dubai",                  phone:"+971 4 221 4181", hours:"Mon–Fri 09:00–11:30", visaTypes:["Short-Stay Tourist","Business"],         status:"operational" },
];

// ── Visa Applications ─────────────────────────────────────────────────────────
export const VISA_APPS: VisaApplication[] = [
  { id:"va1",  ref:"VA-2025-001", applicantName:"Amira Hassan",       nationality:"Egyptian",  passportNo:"EG9012345", visaType:"Schengen Tourist", destination:"Germany",  stage:"interview",    priority:"urgent", assignedTo:"Ayesha Rahman",   createdAt:"02 Jan 2025", updatedAt:"09 Jan 2025", fee:4500, interviewDate:"12 Jan 2025", submittedAt:"06 Jan 2025", documents:[{name:"Passport",status:"verified"},{name:"Bank Statement",status:"verified"},{name:"Travel Insurance",status:"verified"},{name:"Hotel Booking",status:"verified"}] },
  { id:"va2",  ref:"VA-2025-002", applicantName:"David Okafor",       nationality:"Nigerian",  passportNo:"NG3456789", visaType:"UK Business",      destination:"UK",       stage:"processing",   priority:"high",   assignedTo:"Omar Hassan",     createdAt:"28 Dec 2024", updatedAt:"08 Jan 2025", fee:8200, submittedAt:"03 Jan 2025", documents:[{name:"Passport",status:"verified"},{name:"Business Invite",status:"verified"},{name:"Bank Statement",status:"verified"},{name:"Company Profile",status:"uploaded"}] },
  { id:"va3",  ref:"VA-2025-003", applicantName:"Priya Menon",        nationality:"Indian",    passportNo:"IN5678901", visaType:"USA B1/B2",        destination:"USA",      stage:"documents",    priority:"high",   assignedTo:"James Whitfield", createdAt:"05 Jan 2025", updatedAt:"08 Jan 2025", fee:12000, documents:[{name:"DS-160",status:"uploaded"},{name:"Passport",status:"verified"},{name:"Bank Statement",status:"missing"},{name:"Employment Letter",status:"missing"}] },
  { id:"va4",  ref:"VA-2025-004", applicantName:"Yusuf Al-Mansoori", nationality:"Emirati",   passportNo:"AE7654321", visaType:"Tourist",          destination:"France",   stage:"payment",      priority:"normal", assignedTo:"Lina Al-Sayed",   createdAt:"07 Jan 2025", updatedAt:"07 Jan 2025", fee:1800, documents:[{name:"Passport",status:"verified"},{name:"Hotel Booking",status:"verified"},{name:"Flight Ticket",status:"verified"}] },
  { id:"va5",  ref:"VA-2025-005", applicantName:"Sofia Nguyen",       nationality:"Vietnamese",passportNo:"VN1234567", visaType:"UAE Visit",        destination:"UAE",      stage:"inquiry",      priority:"normal", assignedTo:"Omar Hassan",     createdAt:"09 Jan 2025", updatedAt:"09 Jan 2025", fee:950, documents:[] },
  { id:"va6",  ref:"VA-2025-006", applicantName:"Tariq Bashir",       nationality:"Pakistani", passportNo:"PK9876543", visaType:"Canada Visitor",   destination:"Canada",   stage:"validation",   priority:"normal", assignedTo:"Ayesha Rahman",   createdAt:"03 Jan 2025", updatedAt:"08 Jan 2025", fee:3200, documents:[{name:"Passport",status:"verified"},{name:"Bank Statement",status:"uploaded"},{name:"Employment Letter",status:"uploaded"},{name:"Photos",status:"verified"}] },
  { id:"va7",  ref:"VA-2025-007", applicantName:"Elena Vasquez",      nationality:"Spanish",   passportNo:"ES2345678", visaType:"Golden Visa",      destination:"UAE",      stage:"approved",     priority:"high",   assignedTo:"James Whitfield", createdAt:"15 Dec 2024", updatedAt:"06 Jan 2025", fee:15500, submittedAt:"20 Dec 2024", decision:"approved", documents:[{name:"Passport",status:"verified"},{name:"Investment Proof",status:"verified"},{name:"MOU",status:"verified"}] },
  { id:"va8",  ref:"VA-2025-008", applicantName:"Mustafa Al-Zaabi", nationality:"Emirati",   passportNo:"AE8812345", visaType:"Schengen Multi",   destination:"Europe",   stage:"submission",   priority:"high",   assignedTo:"Lina Al-Sayed",   createdAt:"30 Dec 2024", updatedAt:"07 Jan 2025", fee:6800, documents:[{name:"Passport",status:"verified"},{name:"Bank Statement",status:"verified"},{name:"Travel Insurance",status:"verified"},{name:"Cover Letter",status:"verified"}] },
  { id:"va9",  ref:"VA-2025-009", applicantName:"Grace Osei",         nationality:"Ghanaian",  passportNo:"GH4567890", visaType:"UK Student",       destination:"UK",       stage:"ocr",          priority:"normal", assignedTo:"Omar Hassan",     createdAt:"06 Jan 2025", updatedAt:"08 Jan 2025", fee:2100, documents:[] },
  { id:"va10", ref:"VA-2025-010", applicantName:"Wei Zhang",          nationality:"Chinese",   passportNo:"CN7890123", visaType:"USA B1/B2",        destination:"USA",      stage:"assigned",     priority:"high",   assignedTo:"James Whitfield", createdAt:"10 Dec 2024", updatedAt:"05 Jan 2025", fee:8400, documents:[{name:"DS-160",status:"verified"},{name:"Passport",status:"verified"},{name:"Bank Statement",status:"verified"},{name:"Employer Letter",status:"verified"}] },
  { id:"va11", ref:"VA-2025-011", applicantName:"Rajesh Kumar",       nationality:"Indian",    passportNo:"IN2341876", visaType:"Schengen Tourist", destination:"Italy",    stage:"passport_recv",priority:"normal", assignedTo:"Ayesha Rahman",   createdAt:"15 Dec 2024", updatedAt:"08 Jan 2025", fee:2800, decision:"approved", documents:[{name:"Passport",status:"verified"},{name:"Bank Statement",status:"verified"},{name:"Travel Insurance",status:"verified"}] },
  { id:"va12", ref:"VA-2025-012", applicantName:"Fatima Al-Rashidi", nationality:"Emirati",   passportNo:"AE8821043", visaType:"Schengen Tourist", destination:"France",   stage:"delivery",     priority:"normal", assignedTo:"Lina Al-Sayed",   createdAt:"10 Dec 2024", updatedAt:"09 Jan 2025", fee:2200, decision:"approved", documents:[{name:"Passport",status:"verified"}] },
  { id:"va13", ref:"VA-2025-013", applicantName:"Mohammed Al-Farsi", nationality:"Omani",     passportNo:"OM3312987", visaType:"UK Visitor",       destination:"UK",       stage:"checklist",    priority:"high",   assignedTo:"Omar Hassan",     createdAt:"08 Jan 2025", updatedAt:"09 Jan 2025", fee:4800, documents:[{name:"Passport",status:"uploaded"}] },
  { id:"va14", ref:"VA-2025-014", applicantName:"Elena Petrova",      nationality:"Russian",   passportNo:"RU9023456", visaType:"UAE Visit",        destination:"UAE",      stage:"invoice",      priority:"normal", assignedTo:"Ayesha Rahman",   createdAt:"07 Jan 2025", updatedAt:"08 Jan 2025", fee:1200, documents:[{name:"Passport",status:"verified"},{name:"Hotel Booking",status:"verified"}] },
  { id:"va15", ref:"VA-2025-015", applicantName:"James Whitmore",     nationality:"British",   passportNo:"GB5432101", visaType:"USA B1/B2",        destination:"USA",      stage:"archive",      priority:"normal", assignedTo:"James Whitfield", createdAt:"01 Dec 2024", updatedAt:"05 Jan 2025", fee:6500, decision:"approved", documents:[{name:"Passport",status:"verified"},{name:"DS-160",status:"verified"},{name:"Bank Statement",status:"verified"}] },
];

// ── Checklists ────────────────────────────────────────────────────────────────
export const CHECKLISTS: ChecklistTpl[] = [
  { id:"cl1", visaType:"Schengen Tourist", destination:"Germany / France / Italy", documents:[
    { name:"Original passport + 2 copies", required:true,  notes:"Valid for 6+ months beyond travel" },
    { name:"Passport-size photos (2)",      required:true,  notes:"White background, 35×45mm"         },
    { name:"Completed Schengen form",       required:true,  notes:"Signed by applicant"               },
    { name:"Travel insurance",              required:true,  notes:"Min EUR 30,000 coverage"           },
    { name:"Hotel/accommodation proof",     required:true,  notes:"Booking confirmation"              },
    { name:"Return flight ticket",          required:true,  notes:"Confirmed booking"                 },
    { name:"Bank statement (3 months)",     required:true,  notes:"Min AED 10,000 balance"            },
    { name:"Employment/NOC letter",         required:true,  notes:"On company letterhead"             },
    { name:"Cover letter",                  required:false, notes:"Recommended for multiple entries"  },
  ]},
  { id:"cl2", visaType:"UK Visitor", destination:"United Kingdom", documents:[
    { name:"Passport (original)",           required:true,  notes:"Valid 6+ months"                   },
    { name:"UK visa application form",      required:true,  notes:"Online submission via UKVI"        },
    { name:"Biometric appointment proof",   required:true,  notes:"VFS appointment confirmation"      },
    { name:"Bank statements (6 months)",    required:true,  notes:"Min AED 15,000 recommended"        },
    { name:"Proof of employment",           required:true,  notes:"Salary slips or contract"          },
    { name:"Travel itinerary",              required:true,  notes:"Hotel + return flight"             },
    { name:"Invitation letter",             required:false, notes:"For visiting family/friends"       },
  ]},
  { id:"cl3", visaType:"USA B1/B2", destination:"United States", documents:[
    { name:"DS-160 confirmation",           required:true,  notes:"Completed online at ceac.state.gov"},
    { name:"Passport (original)",           required:true,  notes:"Valid for duration of stay"        },
    { name:"Interview appointment letter",  required:true,  notes:"Printed MRV fee receipt"          },
    { name:"Photo 5×5cm",                   required:true,  notes:"White background within 6 months" },
    { name:"MRV fee receipt",               required:true,  notes:"USD 160 non-refundable"            },
    { name:"Bank statements (3 months)",    required:true,  notes:"Showing financial stability"       },
    { name:"Employer letter",               required:true,  notes:"Purpose of travel, salary, dates" },
    { name:"Property/asset proof",          required:false, notes:"Ties to home country"              },
  ]},
];

// ── Interviews ────────────────────────────────────────────────────────────────
export const INTERVIEWS: Interview[] = [
  { id:"i1", appRef:"VA-2025-001", applicantName:"Amira Hassan",      visaType:"Schengen",   embassy:"German Consulate Dubai",    scheduledAt:"12 Jan 2025 10:00", status:"scheduled"   },
  { id:"i2", appRef:"VA-2025-002", applicantName:"David Okafor",      visaType:"UK Business",embassy:"British Embassy Abu Dhabi", scheduledAt:"11 Jan 2025 09:30", status:"scheduled"   },
  { id:"i3", appRef:"VA-2025-010", applicantName:"Wei Zhang",         visaType:"USA B1/B2",  embassy:"US Consulate Dubai",        scheduledAt:"10 Jan 2025 08:00", status:"completed"   },
  { id:"i4", appRef:"VA-2025-013", applicantName:"Mohammed Al-Farsi",visaType:"UK Visitor", embassy:"British Embassy Abu Dhabi", scheduledAt:"15 Jan 2025 10:30", status:"scheduled"   },
  { id:"i5", appRef:"VA-2024-198", applicantName:"Layla Mubarak",     visaType:"USA B1/B2",  embassy:"US Consulate Dubai",        scheduledAt:"08 Jan 2025 09:00", status:"no_show"     },
  { id:"i6", appRef:"VA-2024-210", applicantName:"Anand Krishnan",    visaType:"USA B1/B2",  embassy:"US Consulate Dubai",        scheduledAt:"09 Jan 2025 08:30", status:"completed"   },
  { id:"i7", appRef:"VA-2025-003", applicantName:"Priya Menon",       visaType:"USA B1/B2",  embassy:"US Consulate Dubai",        scheduledAt:"20 Jan 2025 09:00", status:"scheduled"   },
  { id:"i8", appRef:"VA-2024-188", applicantName:"Huang Wei",         visaType:"Schengen",   embassy:"French Consulate Dubai",    scheduledAt:"14 Jan 2025 11:00", status:"rescheduled" },
];

// ── Biometrics ────────────────────────────────────────────────────────────────
export const BIOMETRIC_LOG: BiometricEntry[] = [
  { id:"b1", appRef:"VA-2025-002", applicantName:"David Okafor",      nationality:"Nigerian",  btype:"Fingerprint + Photo", appointmentAt:"07 Jan 2025 10:00", location:"VFS UK Dubai",        status:"completed" },
  { id:"b2", appRef:"VA-2025-013", applicantName:"Mohammed Al-Farsi",nationality:"Omani",     btype:"Fingerprint + Photo", appointmentAt:"13 Jan 2025 11:00", location:"VFS UK Dubai",        status:"pending"   },
  { id:"b3", appRef:"VA-2025-001", applicantName:"Amira Hassan",      nationality:"Egyptian",  btype:"Fingerprint",         appointmentAt:"10 Jan 2025 09:30", location:"VFS Schengen Dubai",  status:"pending"   },
  { id:"b4", appRef:"VA-2025-010", applicantName:"Wei Zhang",         nationality:"Chinese",   btype:"Fingerprint + Photo", appointmentAt:"08 Jan 2025 08:00", location:"US Consulate Dubai",  status:"completed" },
  { id:"b5", appRef:"VA-2025-003", applicantName:"Priya Menon",       nationality:"Indian",    btype:"Fingerprint + Photo", appointmentAt:"18 Jan 2025 08:30", location:"US Consulate Dubai",  status:"pending"   },
  { id:"b6", appRef:"VA-2024-198", applicantName:"Layla Mubarak",     nationality:"Emirati",   btype:"Fingerprint + Photo", appointmentAt:"06 Jan 2025 10:00", location:"US Consulate Dubai",  status:"failed"    },
  { id:"b7", appRef:"VA-2025-004", applicantName:"Yusuf Al-Mansoori",nationality:"Emirati",   btype:"Fingerprint",         appointmentAt:"11 Jan 2025 09:00", location:"VFS Schengen Dubai",  status:"pending"   },
  { id:"b8", appRef:"VA-2024-210", applicantName:"Anand Krishnan",    nationality:"Indian",    btype:"Fingerprint + Photo", appointmentAt:"07 Jan 2025 08:30", location:"US Consulate Dubai",  status:"completed" },
];

// ── Embassy Submissions ───────────────────────────────────────────────────────
export const SUBMISSIONS: EmbassySubmission[] = [
  { id:"es1", ref:"SUB-2025-001", appRef:"VA-2025-002", embassy:"British Embassy",   country:"UK",      visaType:"UK Business",   submittedAt:"03 Jan 2025", expectedAt:"17 Jan 2025", trackingRef:"UKV-789012", status:"processing"     },
  { id:"es2", ref:"SUB-2025-002", appRef:"VA-2025-008", embassy:"German Consulate",  country:"Germany", visaType:"Schengen Multi",submittedAt:"05 Jan 2025", expectedAt:"19 Jan 2025", trackingRef:"SCH-234567", status:"acknowledged"   },
  { id:"es3", ref:"SUB-2025-003", appRef:"VA-2025-001", embassy:"German Consulate",  country:"Germany", visaType:"Schengen",      submittedAt:"06 Jan 2025", expectedAt:"20 Jan 2025", trackingRef:"SCH-234891", status:"processing"     },
  { id:"es4", ref:"SUB-2025-004", appRef:"VA-2025-010", embassy:"US Consulate",      country:"USA",     visaType:"USA B1/B2",     submittedAt:"02 Jan 2025", expectedAt:"10 Feb 2025", trackingRef:"USC-890123", status:"decision_ready" },
  { id:"es5", ref:"SUB-2025-005", appRef:"VA-2025-007", embassy:"UAE Immigration",   country:"UAE",     visaType:"Golden Visa",   submittedAt:"20 Dec 2024", expectedAt:"10 Jan 2025", trackingRef:"UAE-GV-445", status:"decision_ready" },
  { id:"es6", ref:"SUB-2025-006", appRef:"VA-2025-011", embassy:"Italian Consulate", country:"Italy",   visaType:"Schengen",      submittedAt:"28 Dec 2024", expectedAt:"11 Jan 2025", trackingRef:"SCH-102345", status:"decision_ready" },
  { id:"es7", ref:"SUB-2025-007", appRef:"VA-2025-015", embassy:"US Consulate",      country:"USA",     visaType:"USA B1/B2",     submittedAt:"10 Dec 2024", expectedAt:"10 Jan 2025", trackingRef:"USC-778821", status:"decision_ready" },
];

// ── Deliveries ────────────────────────────────────────────────────────────────
export const DELIVERIES: DeliveryRecord[] = [
  { id:"d1", appRef:"VA-2025-011", ownerName:"Rajesh Kumar",       type:"collection", scheduledAt:"10 Jan 2025 10:00", status:"pending"   },
  { id:"d2", appRef:"VA-2025-012", ownerName:"Fatima Al-Rashidi", type:"delivery",   address:"Downtown Dubai",          scheduledAt:"10 Jan 2025 14:00", status:"dispatched", driverName:"Ahmed Al-Mansoori" },
  { id:"d3", appRef:"VA-2025-007", ownerName:"Elena Vasquez",      type:"delivery",   address:"Dubai Marina",            scheduledAt:"08 Jan 2025 12:00", status:"completed",  driverName:"Saeed Al-Maktoum" },
  { id:"d4", appRef:"VA-2025-015", ownerName:"James Whitmore",     type:"collection", scheduledAt:"09 Jan 2025 11:00", status:"completed" },
  { id:"d5", appRef:"VA-2025-004", ownerName:"Yusuf Al-Mansoori", type:"delivery",   address:"Sharjah",                 scheduledAt:"13 Jan 2025 10:00", status:"pending"   },
  { id:"d6", appRef:"VA-2025-010", ownerName:"Wei Zhang",          type:"collection", scheduledAt:"12 Jan 2025 09:00", status:"pending"   },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
