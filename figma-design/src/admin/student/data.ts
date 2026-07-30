export type AdmissionStage = "inquiry"|"applied"|"offer"|"cas_i20"|"visa"|"accommodation"|"tuition_paid"|"enrolled"|"rejected"|"withdrawn";
export type VisaType = "student_uk"|"student_us"|"student_schengen"|"student_au"|"student_ca"|"student_nz";

export interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  ranking: number;
  type: "public"|"private";
  tuitionRange: string;
  acceptanceRate: string;
  popularCourses: string[];
  requirementsIELTS: string;
  requirementsTOEFL: string;
  intakes: string[];
  website: string;
  consultFee: number;
}

export interface StudentCase {
  id: string;
  ref: string;
  stage: AdmissionStage;
  studentName: string;
  nationality: string;
  phone: string;
  email: string;
  dob: string;
  passportNo: string;
  targetCountry: string;
  targetUniversity: string;
  course: string;
  intake: string;
  gpaScore: string;
  ieltsScore?: string;
  toeflScore?: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface OfferLetter {
  id: string;
  caseId: string;
  studentName: string;
  university: string;
  course: string;
  intake: string;
  receivedDate?: string;
  expiryDate?: string;
  status: "awaited"|"received"|"accepted"|"declined"|"expired";
  conditionalOrUnconditional: "conditional"|"unconditional";
  conditions?: string;
}

export interface CASTracker {
  id: string;
  caseId: string;
  studentName: string;
  university: string;
  casNumber?: string;
  casStatus: "not_requested"|"requested"|"issued"|"expired";
  i20Status?: "not_requested"|"requested"|"issued";
  type: "CAS"|"I-20"|"CoE"|"CAQ";
  issuedDate?: string;
  expiryDate?: string;
}

export interface VisaStatus {
  id: string;
  caseId: string;
  studentName: string;
  visaType: VisaType;
  appointmentDate?: string;
  biometricDate?: string;
  submittedAt?: string;
  status: "not_started"|"documents_gathering"|"appointment_booked"|"submitted"|"approved"|"refused"|"reapplying";
  visaNo?: string;
  validFrom?: string;
  validTo?: string;
  refusalReason?: string;
}

export interface AccommodationBooking {
  id: string;
  caseId: string;
  studentName: string;
  university: string;
  type: "university_halls"|"private_student"|"homestay"|"shared_flat";
  providerName: string;
  city: string;
  roomType: string;
  moveInDate: string;
  contractEnd: string;
  weeklyRent: number;
  status: "searching"|"shortlisted"|"booked"|"confirmed";
}

export interface TuitionPayment {
  id: string;
  caseId: string;
  studentName: string;
  university: string;
  semester: string;
  amountDue: number;
  currency: string;
  amountAED: number;
  dueDate: string;
  paidDate?: string;
  method?: "bank_transfer"|"flywire"|"card"|"cheque";
  status: "unpaid"|"processing"|"paid"|"overdue";
}

// ── Universities ──────────────────────────────────────────────────────────────
export const UNIVERSITIES: University[] = [
  { id:"u1",  name:"University of Manchester",       country:"UK",        city:"Manchester",   ranking:28,  type:"public",  tuitionRange:"£18,000–£26,000/yr",  acceptanceRate:"46%", popularCourses:["Business","Engineering","Medicine","Law"],         requirementsIELTS:"6.5", requirementsTOEFL:"90",  intakes:["Sep 2025","Jan 2026"], website:"manchester.ac.uk",    consultFee:1500 },
  { id:"u2",  name:"University of Toronto",          country:"Canada",    city:"Toronto",      ranking:21,  type:"public",  tuitionRange:"CAD 25,000–45,000/yr",acceptanceRate:"43%", popularCourses:["Computer Science","Engineering","Business","Arts"], requirementsIELTS:"6.5", requirementsTOEFL:"100", intakes:["Sep 2025"],            website:"utoronto.ca",         consultFee:1800 },
  { id:"u3",  name:"Macquarie University",           country:"Australia", city:"Sydney",       ranking:195, type:"public",  tuitionRange:"AUD 30,000–42,000/yr",acceptanceRate:"60%", popularCourses:["Business","IT","Psychology","Law"],                requirementsIELTS:"6.5", requirementsTOEFL:"83",  intakes:["Feb 2025","Jul 2025"], website:"mq.edu.au",           consultFee:1200 },
  { id:"u4",  name:"Northeastern University",        country:"USA",       city:"Boston",       ranking:49,  type:"private", tuitionRange:"USD 55,000/yr",        acceptanceRate:"20%", popularCourses:["Engineering","Business","CS","Data Science"],      requirementsIELTS:"7.0", requirementsTOEFL:"100", intakes:["Sep 2025","Jan 2026"], website:"northeastern.edu",    consultFee:2000 },
  { id:"u5",  name:"TU Munich",                     country:"Germany",   city:"Munich",       ranking:37,  type:"public",  tuitionRange:"€0–€3,000/yr",          acceptanceRate:"8%",  popularCourses:["Engineering","Physics","CS","Architecture"],       requirementsIELTS:"6.5", requirementsTOEFL:"88",  intakes:["Oct 2025","Apr 2026"], website:"tum.de",              consultFee:1000 },
  { id:"u6",  name:"University of British Columbia", country:"Canada",    city:"Vancouver",    ranking:34,  type:"public",  tuitionRange:"CAD 28,000–48,000/yr",acceptanceRate:"52%", popularCourses:["Business","Forestry","Medicine","CS"],             requirementsIELTS:"6.5", requirementsTOEFL:"90",  intakes:["Sep 2025"],            website:"ubc.ca",              consultFee:1800 },
  { id:"u7",  name:"University of Auckland",         country:"New Zealand",city:"Auckland",    ranking:87,  type:"public",  tuitionRange:"NZD 26,000–38,000/yr",acceptanceRate:"65%", popularCourses:["Engineering","Business","Health Sciences"],        requirementsIELTS:"6.0", requirementsTOEFL:"80",  intakes:["Feb 2025","Jul 2025"], website:"auckland.ac.nz",      consultFee:1100 },
  { id:"u8",  name:"IE Business School",             country:"Spain",     city:"Madrid",       ranking:4,   type:"private", tuitionRange:"€32,000–€56,000/yr",   acceptanceRate:"25%", popularCourses:["MBA","Finance","Marketing","Entrepreneurship"],    requirementsIELTS:"7.0", requirementsTOEFL:"100", intakes:["Sep 2025","Jan 2026"], website:"ie.edu",              consultFee:2200 },
];

// ── Student Cases ─────────────────────────────────────────────────────────────
export const STUDENT_CASES: StudentCase[] = [
  { id:"sc1", ref:"STU-2025-001", stage:"visa",          studentName:"Ayesha Tariq",      nationality:"Pakistani", phone:"+92 333 1122334", email:"ayesha@email.com", dob:"14 Apr 2001", passportNo:"PK-AB789012", targetCountry:"UK",        targetUniversity:"University of Manchester", course:"MSc International Business",   intake:"Sep 2025", gpaScore:"3.6/4.0", ieltsScore:"7.0", assignedTo:"Lina Al-Sayed",   createdAt:"01 Nov 2024", updatedAt:"06 Jan 2025" },
  { id:"sc2", ref:"STU-2025-002", stage:"offer",         studentName:"Omar Shaikh",        nationality:"Emirati",   phone:"+971 55 223 3445", email:"omar@email.com",  dob:"22 Jul 2002", passportNo:"UAE-55443322", targetCountry:"Canada",    targetUniversity:"University of Toronto",    course:"BEng Computer Engineering",    intake:"Sep 2025", gpaScore:"3.8/4.0", ieltsScore:"7.5", assignedTo:"James Whitfield", createdAt:"15 Nov 2024", updatedAt:"08 Jan 2025" },
  { id:"sc3", ref:"STU-2025-003", stage:"accommodation",  studentName:"Priya Nair",         nationality:"Indian",    phone:"+91 98765 43210",  email:"priya@email.com", dob:"03 Feb 2000", passportNo:"IN-L1234567", targetCountry:"Australia", targetUniversity:"Macquarie University",      course:"Master of Business Administration",intake:"Feb 2025",gpaScore:"3.4/4.0", ieltsScore:"7.0", assignedTo:"Ayesha Rahman",   createdAt:"01 Oct 2024", updatedAt:"07 Jan 2025" },
  { id:"sc4", ref:"STU-2025-004", stage:"applied",        studentName:"Liam O'Connor",      nationality:"Irish",     phone:"+353 87 123 4567", email:"liam@email.com",  dob:"11 Dec 2001", passportNo:"IE-P1234567", targetCountry:"USA",       targetUniversity:"Northeastern University",   course:"MS Data Science",              intake:"Sep 2025", gpaScore:"3.7/4.0", toeflScore:"108",  assignedTo:"Lina Al-Sayed",   createdAt:"05 Dec 2024", updatedAt:"07 Jan 2025" },
  { id:"sc5", ref:"STU-2025-005", stage:"tuition_paid",   studentName:"Fatima Malik",       nationality:"Pakistani", phone:"+92 300 9876543",  email:"fatima@email.com",dob:"18 Aug 1999", passportNo:"PK-DF345678", targetCountry:"Australia", targetUniversity:"Macquarie University",      course:"Graduate Diploma IT",          intake:"Feb 2025", gpaScore:"3.2/4.0", ieltsScore:"6.5", assignedTo:"Omar Hassan",     createdAt:"15 Sep 2024", updatedAt:"09 Jan 2025" },
  { id:"sc6", ref:"STU-2025-006", stage:"inquiry",        studentName:"Rania Hassan",        nationality:"Egyptian",  phone:"+20 111 2233445",  email:"rania@email.com", dob:"29 May 2003", passportNo:"EG-A1122334", targetCountry:"Germany",   targetUniversity:"TU Munich",                course:"MSc Mechanical Engineering",   intake:"Oct 2025", gpaScore:"3.9/4.0", ieltsScore:"7.0", assignedTo:"James Whitfield", createdAt:"08 Jan 2025", updatedAt:"09 Jan 2025" },
  { id:"sc7", ref:"STU-2024-089", stage:"enrolled",       studentName:"Bader Al-Kuwari",    nationality:"Qatari",    phone:"+974 5011 2233",   email:"bader@email.com", dob:"06 Jan 2001", passportNo:"QA-12345678", targetCountry:"Canada",    targetUniversity:"Univ. of British Columbia",course:"BSc Computer Science",        intake:"Sep 2024", gpaScore:"3.5/4.0", ieltsScore:"7.0", assignedTo:"Lina Al-Sayed",   createdAt:"10 Jun 2024", updatedAt:"01 Sep 2024" },
  { id:"sc8", ref:"STU-2024-090", stage:"rejected",       studentName:"Hina Shah",           nationality:"Pakistani", phone:"+92 321 4567890",  email:"hina@email.com",  dob:"14 Mar 2002", passportNo:"PK-CD890123", targetCountry:"UK",        targetUniversity:"University of Manchester", course:"BA Economics",                 intake:"Sep 2025", gpaScore:"3.1/4.0", ieltsScore:"6.0", assignedTo:"Ayesha Rahman",   createdAt:"01 Dec 2024", updatedAt:"05 Jan 2025", notes:"Conditional offer — IELTS retake required" },
];

// ── Offer Letters ─────────────────────────────────────────────────────────────
export const STUDENT_OFFERS: OfferLetter[] = [
  { id:"so1", caseId:"sc1", studentName:"Ayesha Tariq",  university:"University of Manchester", course:"MSc International Business",   intake:"Sep 2025", receivedDate:"15 Dec 2024", expiryDate:"28 Feb 2025", status:"accepted", conditionalOrUnconditional:"unconditional" },
  { id:"so2", caseId:"sc2", studentName:"Omar Shaikh",    university:"University of Toronto",    course:"BEng Computer Engineering",    intake:"Sep 2025", receivedDate:"08 Jan 2025", expiryDate:"30 Apr 2025", status:"received", conditionalOrUnconditional:"conditional",   conditions:"Final IELTS score ≥7.5" },
  { id:"so3", caseId:"sc3", studentName:"Priya Nair",     university:"Macquarie University",     course:"Master of Business Administration",intake:"Feb 2025",receivedDate:"10 Nov 2024",expiryDate:"15 Jan 2025",status:"accepted",conditionalOrUnconditional:"unconditional" },
  { id:"so4", caseId:"sc4", studentName:"Liam O'Connor",  university:"Northeastern University",  course:"MS Data Science",              intake:"Sep 2025", status:"awaited",  conditionalOrUnconditional:"conditional" },
  { id:"so5", caseId:"sc5", studentName:"Fatima Malik",   university:"Macquarie University",     course:"Graduate Diploma IT",          intake:"Feb 2025", receivedDate:"01 Oct 2024", expiryDate:"15 Jan 2025", status:"accepted", conditionalOrUnconditional:"unconditional" },
];

// ── CAS / I-20 Tracker ────────────────────────────────────────────────────────
export const CAS_TRACKER: CASTracker[] = [
  { id:"cas1", caseId:"sc1", studentName:"Ayesha Tariq", university:"University of Manchester", type:"CAS", casNumber:"K4YWWXQ25CXHTYTP", casStatus:"issued",       issuedDate:"20 Dec 2024", expiryDate:"31 Aug 2025" },
  { id:"cas2", caseId:"sc3", studentName:"Priya Nair",    university:"Macquarie University",     type:"CoE", casStatus:"issued",       casNumber:"AUS-COE-123456", issuedDate:"20 Nov 2024", expiryDate:"31 Jul 2025" },
  { id:"cas3", caseId:"sc4", studentName:"Liam O'Connor", university:"Northeastern University",  type:"I-20",casStatus:"not_requested",i20Status:"not_requested"  },
  { id:"cas4", caseId:"sc5", studentName:"Fatima Malik",  university:"Macquarie University",     type:"CoE", casStatus:"issued",       casNumber:"AUS-COE-789012", issuedDate:"15 Oct 2024", expiryDate:"31 Jul 2025" },
];

// ── Visa Status ───────────────────────────────────────────────────────────────
export const VISA_STATUSES: VisaStatus[] = [
  { id:"vs1", caseId:"sc1", studentName:"Ayesha Tariq", visaType:"student_uk",     appointmentDate:"10 Jan 2025", biometricDate:"12 Jan 2025", submittedAt:"15 Jan 2025", status:"submitted" },
  { id:"vs2", caseId:"sc3", studentName:"Priya Nair",   visaType:"student_au",     status:"approved", visaNo:"AUS-SVP-778899", validFrom:"01 Jan 2025", validTo:"30 Nov 2025" },
  { id:"vs3", caseId:"sc5", studentName:"Fatima Malik", visaType:"student_au",     status:"approved", visaNo:"AUS-SVP-556677", validFrom:"25 Nov 2024", validTo:"30 Nov 2025" },
  { id:"vs4", caseId:"sc4", studentName:"Liam O'Connor",visaType:"student_us",     status:"not_started" },
];

// ── Accommodation ─────────────────────────────────────────────────────────────
export const STUDENT_ACCOMM: AccommodationBooking[] = [
  { id:"sa1", caseId:"sc3", studentName:"Priya Nair",   university:"Macquarie University",   type:"university_halls", providerName:"Macquarie UniLodge",   city:"Sydney",      roomType:"Studio",     moveInDate:"25 Jan 2025", contractEnd:"30 Nov 2025", weeklyRent:350, status:"confirmed" },
  { id:"sa2", caseId:"sc5", studentName:"Fatima Malik", university:"Macquarie University",   type:"private_student",  providerName:"Unilodge Parramatta",  city:"Sydney",      roomType:"Shared Twin", moveInDate:"25 Jan 2025", contractEnd:"30 Nov 2025", weeklyRent:210, status:"confirmed" },
  { id:"sa3", caseId:"sc1", studentName:"Ayesha Tariq", university:"Univ. of Manchester",   type:"private_student",  providerName:"Student Roost Manchester",city:"Manchester", roomType:"En-Suite",  moveInDate:"15 Sep 2025", contractEnd:"30 Jun 2026", weeklyRent:195, status:"shortlisted"},
];

// ── Tuition Payments ──────────────────────────────────────────────────────────
export const TUITION_PAYMENTS: TuitionPayment[] = [
  { id:"tp1", caseId:"sc3", studentName:"Priya Nair",   university:"Macquarie University", semester:"Session 1 2025", amountDue:12500, currency:"AUD", amountAED:31250, dueDate:"20 Jan 2025", paidDate:"12 Jan 2025", method:"flywire",       status:"paid"    },
  { id:"tp2", caseId:"sc5", studentName:"Fatima Malik", university:"Macquarie University", semester:"Session 1 2025", amountDue:8000,  currency:"AUD", amountAED:20000, dueDate:"20 Jan 2025", paidDate:"10 Jan 2025", method:"bank_transfer",  status:"paid"    },
  { id:"tp3", caseId:"sc1", studentName:"Ayesha Tariq", university:"Univ. of Manchester",  semester:"Year 1 2025-26", amountDue:22000, currency:"GBP", amountAED:104500,dueDate:"01 Sep 2025", status:"unpaid"                                              },
  { id:"tp4", caseId:"sc2", studentName:"Omar Shaikh",   university:"Univ. of Toronto",    semester:"Year 1 2025-26", amountDue:35000, currency:"CAD", amountAED:95000, dueDate:"01 Sep 2025", status:"unpaid"                                              },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
