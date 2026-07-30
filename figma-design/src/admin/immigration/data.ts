export type PermitStage = "inquiry"|"documents"|"employer_approval"|"submitted"|"processing"|"medical"|"biometric"|"approved"|"issued"|"rejected"|"cancelled";
export type VisaStage   = "inquiry"|"documents"|"noc"|"submitted"|"processing"|"approved"|"entry_visa"|"status_change"|"completed"|"rejected";
export type PRStage     = "inquiry"|"eligibility"|"documents"|"filing"|"processing"|"interview"|"decision"|"approved"|"issued"|"rejected";

export interface WorkPermitCase {
  id: string; ref: string; stage: PermitStage;
  holderName: string; nationality: string; passportNo: string; gender: "M"|"F"; dob: string;
  employerId: string; employerName: string;
  jobTitle: string; sector: string;
  permitType: "limited"|"unlimited"|"freelance"|"mission";
  permitNo?: string;
  submittedAt?: string; approvedAt?: string; expiryDate?: string;
  assignedTo: string; createdAt: string; updatedAt: string;
  notes?: string;
}

export interface EmploymentVisaCase {
  id: string; ref: string; stage: VisaStage;
  applicantName: string; nationality: string; passportNo: string; gender: "M"|"F"; dob: string;
  employerId: string; employerName: string;
  jobTitle: string; salary: number;
  visaNo?: string; labourCardNo?: string;
  emiratesId?: string; eidExpiry?: string;
  submittedAt?: string; approvedAt?: string; visaExpiry?: string;
  assignedTo: string; createdAt: string; updatedAt: string;
}

export interface PRCase {
  id: string; ref: string; stage: PRStage;
  applicantName: string; nationality: string; passportNo: string; gender: "M"|"F"; dob: string;
  targetCountry: string; prType: "permanent_residency"|"golden_visa"|"retirement"|"investor";
  yearsInCountry?: number; investmentAED?: number;
  prNo?: string; approvedAt?: string; expiryDate?: string;
  assignedTo: string; createdAt: string; updatedAt: string;
  notes?: string;
}

export interface Employer {
  id: string; name: string; tradeLicense: string; industry: string;
  contactName: string; contactEmail: string; contactPhone: string;
  address: string; emirate: string; activePermits: number; activeVisas: number;
  status: "active"|"suspended"|"inactive"; quota: number; quotaUsed: number;
  establishedYear: number;
}

export interface DocChecklist {
  id: string; caseId: string; caseType: "work_permit"|"employment_visa"|"pr";
  applicantName: string;
  documents: { name: string; status: "received"|"pending"|"expired"|"waived"; notes?: string }[];
}

export interface RenewalReminder {
  id: string; caseId: string; caseType: string;
  holderName: string; permitType: string; permitNo: string;
  expiryDate: string; daysLeft: number;
  status: "active"|"expiring_soon"|"expired"|"renewed";
  assignedTo: string;
}

// ── Work Permit Cases ─────────────────────────────────────────────────────────
export const WORK_PERMITS: WorkPermitCase[] = [
  { id:"wp1",  ref:"WP-2025-001", stage:"approved",        holderName:"Mohammed Al-Farsi",  nationality:"Omani",    passportNo:"OM-12345678", gender:"M", dob:"15 Mar 1982", employerId:"emp1", employerName:"PetroAbu Energy",     jobTitle:"Senior Engineer",     sector:"Oil & Gas",    permitType:"unlimited", permitNo:"WP-UAE-001122",  submittedAt:"01 Dec 2024", approvedAt:"10 Jan 2025", expiryDate:"10 Jan 2027", assignedTo:"Ayesha Rahman",   createdAt:"25 Nov 2024", updatedAt:"10 Jan 2025" },
  { id:"wp2",  ref:"WP-2025-002", stage:"processing",      holderName:"Priya Menon",         nationality:"Indian",   passportNo:"IN-K1234567", gender:"F", dob:"22 Jun 1990", employerId:"emp2", employerName:"TechCorp Dubai",      jobTitle:"Software Engineer",   sector:"Technology",   permitType:"limited",   submittedAt:"15 Dec 2024", assignedTo:"James Whitfield", createdAt:"10 Dec 2024", updatedAt:"07 Jan 2025" },
  { id:"wp3",  ref:"WP-2025-003", stage:"documents",        holderName:"Liam Carter",         nationality:"British",  passportNo:"GB-P1234567", gender:"M", dob:"08 Oct 1985", employerId:"emp3", employerName:"Emirates Group",      jobTitle:"Finance Manager",     sector:"Finance",      permitType:"unlimited", assignedTo:"Omar Hassan",     createdAt:"05 Jan 2025", updatedAt:"08 Jan 2025" },
  { id:"wp4",  ref:"WP-2025-004", stage:"biometric",        holderName:"Fatima Al-Zaabi",    nationality:"Emirati",  passportNo:"UAE-33445566",gender:"F", dob:"14 Jan 1995", employerId:"emp1", employerName:"PetroAbu Energy",     jobTitle:"HR Specialist",       sector:"Oil & Gas",    permitType:"unlimited", submittedAt:"20 Dec 2024", assignedTo:"Lina Al-Sayed",   createdAt:"12 Dec 2024", updatedAt:"06 Jan 2025" },
  { id:"wp5",  ref:"WP-2024-098", stage:"issued",           holderName:"David Okafor",        nationality:"Nigerian", passportNo:"NG-A1234567", gender:"M", dob:"03 Sep 1988", employerId:"emp2", employerName:"TechCorp Dubai",      jobTitle:"Product Manager",     sector:"Technology",   permitType:"limited",   permitNo:"WP-UAE-009988",  submittedAt:"01 Nov 2024", approvedAt:"15 Dec 2024", expiryDate:"15 Dec 2025", assignedTo:"Omar Hassan",     createdAt:"25 Oct 2024", updatedAt:"15 Dec 2024" },
  { id:"wp6",  ref:"WP-2025-005", stage:"submitted",        holderName:"Elena Petrova",       nationality:"Russian",  passportNo:"RU-P7654321", gender:"F", dob:"27 Apr 1992", employerId:"emp3", employerName:"Emirates Group",      jobTitle:"Marketing Executive", sector:"Finance",      permitType:"limited",   submittedAt:"08 Jan 2025", assignedTo:"Lina Al-Sayed",   createdAt:"03 Jan 2025", updatedAt:"08 Jan 2025" },
  { id:"wp7",  ref:"WP-2025-006", stage:"inquiry",          holderName:"Rajan Krishnamurthy", nationality:"Indian",   passportNo:"IN-L9876543", gender:"M", dob:"11 Dec 1987", employerId:"emp4", employerName:"Al-Futtaim Group",    jobTitle:"Project Coordinator", sector:"Retail",       permitType:"unlimited", assignedTo:"Ayesha Rahman",   createdAt:"09 Jan 2025", updatedAt:"09 Jan 2025" },
];

// ── Employment Visa Cases ─────────────────────────────────────────────────────
export const EMPLOYMENT_VISAS: EmploymentVisaCase[] = [
  { id:"ev1", ref:"EV-2025-001", stage:"completed", applicantName:"Mohammed Al-Farsi",  nationality:"Omani",    passportNo:"OM-12345678", gender:"M", dob:"15 Mar 1982", employerId:"emp1", employerName:"PetroAbu Energy",  jobTitle:"Senior Engineer",   salary:22000, visaNo:"UAE-EV-445566", labourCardNo:"LC-112233", emiratesId:"784-1982-1234567-1", eidExpiry:"10 Jan 2027", approvedAt:"08 Jan 2025", visaExpiry:"10 Jan 2027", assignedTo:"Ayesha Rahman",   createdAt:"01 Dec 2024", updatedAt:"08 Jan 2025" },
  { id:"ev2", ref:"EV-2025-002", stage:"processing", applicantName:"Priya Menon",         nationality:"Indian",   passportNo:"IN-K1234567", gender:"F", dob:"22 Jun 1990", employerId:"emp2", employerName:"TechCorp Dubai",   jobTitle:"Software Engineer", salary:15000, submittedAt:"16 Dec 2024",                              assignedTo:"James Whitfield", createdAt:"11 Dec 2024", updatedAt:"07 Jan 2025" },
  { id:"ev3", ref:"EV-2025-003", stage:"entry_visa",  applicantName:"Amira Hassan",        nationality:"Egyptian", passportNo:"EG-A1122334", gender:"F", dob:"09 Aug 1991", employerId:"emp3", employerName:"Emirates Group",   jobTitle:"Accountant",        salary:9000,  visaNo:"UAE-EV-778899", approvedAt:"05 Jan 2025", visaExpiry:"05 Jan 2026", assignedTo:"Omar Hassan",     createdAt:"15 Nov 2024", updatedAt:"05 Jan 2025" },
  { id:"ev4", ref:"EV-2025-004", stage:"submitted",   applicantName:"Carlos Ramirez",      nationality:"Colombian",passportNo:"CO-AB123456", gender:"M", dob:"30 Jul 1989", employerId:"emp4", employerName:"Al-Futtaim Group", jobTitle:"Store Manager",     salary:11000, submittedAt:"07 Jan 2025",                              assignedTo:"Lina Al-Sayed",   createdAt:"02 Jan 2025", updatedAt:"07 Jan 2025" },
];

// ── PR / Residency Cases ──────────────────────────────────────────────────────
export const PR_CASES: PRCase[] = [
  { id:"pr1", ref:"PR-2025-001", stage:"approved",    applicantName:"Hassan Al-Rashidi",  nationality:"Emirati",  passportNo:"UAE-11223344",gender:"M", dob:"01 Jan 1978", targetCountry:"UAE",    prType:"golden_visa",        investmentAED:3500000, prNo:"GV-UAE-001122", approvedAt:"05 Jan 2025", expiryDate:"05 Jan 2035", assignedTo:"Ayesha Rahman",   createdAt:"01 Oct 2024", updatedAt:"05 Jan 2025" },
  { id:"pr2", ref:"PR-2025-002", stage:"processing",   applicantName:"Mei Lin",             nationality:"Chinese",  passportNo:"CN-G12345678",gender:"F", dob:"14 Apr 1985", targetCountry:"Canada", prType:"permanent_residency", yearsInCountry:3,      assignedTo:"James Whitfield", createdAt:"15 Nov 2024", updatedAt:"08 Jan 2025" },
  { id:"pr3", ref:"PR-2025-003", stage:"documents",    applicantName:"Tariq Bashir",        nationality:"Pakistani",passportNo:"PK-AB789012", gender:"M", dob:"08 Sep 1980", targetCountry:"UK",     prType:"permanent_residency", yearsInCountry:5,      assignedTo:"Omar Hassan",     createdAt:"20 Dec 2024", updatedAt:"07 Jan 2025" },
  { id:"pr4", ref:"PR-2024-089", stage:"issued",       applicantName:"Nadia Farooq",        nationality:"Pakistani",passportNo:"PK-GH567890", gender:"F", dob:"04 Sep 1982", targetCountry:"UAE",    prType:"golden_visa",        investmentAED:2000000, prNo:"GV-UAE-009988", approvedAt:"20 Dec 2024", expiryDate:"20 Dec 2034", assignedTo:"Lina Al-Sayed",   createdAt:"01 Aug 2024", updatedAt:"20 Dec 2024" },
  { id:"pr5", ref:"PR-2025-004", stage:"eligibility",  applicantName:"James Whitmore",      nationality:"British",  passportNo:"GB-P1234567", gender:"M", dob:"12 Mar 1975", targetCountry:"UAE",    prType:"investor",           investmentAED:5000000, assignedTo:"Ayesha Rahman",   createdAt:"06 Jan 2025", updatedAt:"09 Jan 2025" },
];

// ── Employers ─────────────────────────────────────────────────────────────────
export const EMPLOYERS: Employer[] = [
  { id:"emp1", name:"PetroAbu Energy",     tradeLicense:"TR-AUH-12345", industry:"Oil & Gas",    contactName:"Rashid Al-Mansoori",    contactEmail:"hr@petroabu.ae",     contactPhone:"+971 2 555 1234", address:"ADNOC District, Abu Dhabi", emirate:"Abu Dhabi", activePermits:45, activeVisas:42, status:"active", quota:60, quotaUsed:45, establishedYear:1998 },
  { id:"emp2", name:"TechCorp Dubai",      tradeLicense:"TR-DXB-56789", industry:"Technology",   contactName:"Sarah Al-Sayed",         contactEmail:"hr@techcorp.ae",     contactPhone:"+971 4 333 5678", address:"Internet City, Dubai",      emirate:"Dubai",     activePermits:28, activeVisas:26, status:"active", quota:40, quotaUsed:28, establishedYear:2010 },
  { id:"emp3", name:"Emirates Group",      tradeLicense:"TR-DXB-11111", industry:"Finance",      contactName:"Omar Al-Mazrouei",       contactEmail:"hr@emirates.ae",     contactPhone:"+971 4 708 1000", address:"DAFZA, Dubai",              emirate:"Dubai",     activePermits:312,activeVisas:298,status:"active", quota:400,quotaUsed:312,establishedYear:1985 },
  { id:"emp4", name:"Al-Futtaim Group",    tradeLicense:"TR-DXB-22222", industry:"Retail",       contactName:"Mona Al-Futtaim",        contactEmail:"hr@alfuttaim.ae",    contactPhone:"+971 4 294 3000", address:"Festival City, Dubai",      emirate:"Dubai",     activePermits:189,activeVisas:175,status:"active", quota:250,quotaUsed:189,establishedYear:1930 },
  { id:"emp5", name:"Abu Dhabi Hospitals", tradeLicense:"TR-AUH-33333", industry:"Healthcare",   contactName:"Dr. Khalid Al-Zaabi",    contactEmail:"hr@adh.ae",          contactPhone:"+971 2 419 4000", address:"Corniche Rd, Abu Dhabi",    emirate:"Abu Dhabi", activePermits:88, activeVisas:80, status:"active", quota:120,quotaUsed:88, establishedYear:2001 },
];

// ── Document Checklists ───────────────────────────────────────────────────────
export const DOC_CHECKLISTS: DocChecklist[] = [
  {
    id:"dc1", caseId:"wp1", caseType:"work_permit", applicantName:"Mohammed Al-Farsi",
    documents:[
      { name:"Passport (valid 6+ months)",    status:"received" },
      { name:"Passport-size photos (x4)",      status:"received" },
      { name:"Educational certificate (attested)", status:"received" },
      { name:"Experience certificate",         status:"received" },
      { name:"Employer NOC letter",            status:"received" },
      { name:"Medical fitness certificate",    status:"received" },
      { name:"Police clearance certificate",   status:"received" },
      { name:"Labour contract (MOHRE stamped)",status:"received" },
    ],
  },
  {
    id:"dc2", caseId:"wp2", caseType:"work_permit", applicantName:"Priya Menon",
    documents:[
      { name:"Passport (valid 6+ months)",    status:"received" },
      { name:"Passport-size photos (x4)",      status:"received" },
      { name:"Educational certificate (attested)", status:"pending", notes:"Needs MOFA attestation" },
      { name:"Experience certificate",         status:"received" },
      { name:"Employer NOC letter",            status:"received" },
      { name:"Medical fitness certificate",    status:"pending" },
      { name:"Police clearance certificate",   status:"pending" },
      { name:"Labour contract (MOHRE stamped)",status:"pending" },
    ],
  },
  {
    id:"dc3", caseId:"pr1", caseType:"pr", applicantName:"Hassan Al-Rashidi",
    documents:[
      { name:"Passport copy (all pages)",     status:"received" },
      { name:"Investment proof (title deed)",  status:"received" },
      { name:"Bank statements (6 months)",     status:"received" },
      { name:"Health insurance certificate",   status:"received" },
      { name:"Character certificate",          status:"received" },
    ],
  },
];

// ── Renewal Reminders ─────────────────────────────────────────────────────────
export const RENEWAL_REMINDERS: RenewalReminder[] = [
  { id:"rr1", caseId:"ev1", caseType:"Employment Visa",    holderName:"Mohammed Al-Farsi", permitType:"Employment Visa",   permitNo:"UAE-EV-445566", expiryDate:"10 Jan 2027", daysLeft:362, status:"active",         assignedTo:"Ayesha Rahman"   },
  { id:"rr2", caseId:"wp5", caseType:"Work Permit",        holderName:"David Okafor",       permitType:"Work Permit",        permitNo:"WP-UAE-009988", expiryDate:"15 Dec 2025", daysLeft:340, status:"active",         assignedTo:"Omar Hassan"     },
  { id:"rr3", caseId:"pr4", caseType:"Golden Visa",        holderName:"Nadia Farooq",        permitType:"Golden Visa",        permitNo:"GV-UAE-009988", expiryDate:"20 Dec 2034", daysLeft:3632,status:"active",         assignedTo:"Lina Al-Sayed"   },
  { id:"rr4", caseId:"xx1", caseType:"Emirates ID",        holderName:"Tariq Bashir",        permitType:"Emirates ID",        permitNo:"784-1980-1111111",expiryDate:"25 Jan 2025", daysLeft:15,  status:"expiring_soon",  assignedTo:"James Whitfield" },
  { id:"rr5", caseId:"xx2", caseType:"Employment Visa",    holderName:"Amira Hassan",        permitType:"Employment Visa",   permitNo:"UAE-EV-778899", expiryDate:"05 Jan 2026", daysLeft:361, status:"active",         assignedTo:"Omar Hassan"     },
  { id:"rr6", caseId:"xx3", caseType:"Work Permit",        holderName:"Grace Osei",          permitType:"Work Permit",        permitNo:"WP-UAE-556677", expiryDate:"10 Jan 2025", daysLeft:-1,  status:"expired",        assignedTo:"Ayesha Rahman"   },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
