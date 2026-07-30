export type PolicyStatus  = "active"|"expiring_soon"|"expired"|"cancelled"|"pending";
export type ClaimStatus   = "submitted"|"under_review"|"approved"|"settled"|"rejected"|"closed";
export type PolicyType    = "travel"|"medical";

export interface TravelPolicy {
  id: string; ref: string; policyNo?: string;
  insuredName: string; nationality: string; passportNo: string;
  destination: string; departureDate: string; returnDate: string; days: number;
  coverageType: "basic"|"standard"|"premium"|"group";
  pax: number; premiumAED: number;
  providerId: string; providerName: string;
  coverageLimitUSD: number;
  status: PolicyStatus;
  issuedAt: string; issuedBy: string; expiryDate: string;
}

export interface MedicalPolicy {
  id: string; ref: string; policyNo?: string;
  insuredName: string; nationality: string; passportNo?: string; dob: string;
  employerId?: string; employerName?: string;
  plan: "basic"|"enhanced"|"comprehensive"|"family";
  pax: number; annualPremiumAED: number;
  providerId: string; providerName: string;
  networkType: "local"|"regional"|"international";
  coverageLimitAED: number; inPatient: boolean; outPatient: boolean; dental: boolean; maternity: boolean;
  status: PolicyStatus;
  startDate: string; expiryDate: string; issuedAt: string; issuedBy: string;
}

export interface InsuranceClaim {
  id: string; ref: string; policyId: string; policyRef: string; policyType: PolicyType;
  insuredName: string; claimDate: string; incidentDate: string;
  description: string; claimAmountAED: number; approvedAmountAED?: number;
  providerId: string; providerName: string;
  documents: string[];
  status: ClaimStatus;
  submittedAt: string; settledAt?: string; assignedTo: string;
}

export interface InsuranceProvider {
  id: string; name: string; country: string; types: PolicyType[]; contactName: string;
  contactEmail: string; contactPhone: string; commissionPct: number;
  activePolicies: number; rating: number; status: "active"|"inactive";
}

// ── Travel Policies ───────────────────────────────────────────────────────────
export const TRAVEL_POLICIES: TravelPolicy[] = [
  { id:"tp1", ref:"TRV-POL-2025-001", policyNo:"AIG-TRV-112233", insuredName:"James Whitmore",   nationality:"British",   passportNo:"GB-P1234567", destination:"France, Italy", departureDate:"15 Feb 2025", returnDate:"01 Mar 2025", days:14, coverageType:"premium",  pax:1, premiumAED:420,  providerId:"ip1", providerName:"AIG Insurance UAE", coverageLimitUSD:250000, status:"active",  issuedAt:"05 Jan 2025", issuedBy:"Ayesha Rahman",   expiryDate:"01 Mar 2025" },
  { id:"tp2", ref:"TRV-POL-2025-002", policyNo:"RSA-TRV-445566", insuredName:"Nadia Al-Farhan",  nationality:"Emirati",   passportNo:"UAE-55443322",destination:"Kenya",         departureDate:"22 Feb 2025", returnDate:"01 Mar 2025", days:7,  coverageType:"standard", pax:4, premiumAED:680,  providerId:"ip2", providerName:"RSA Insurance",     coverageLimitUSD:150000, status:"active",  issuedAt:"07 Jan 2025", issuedBy:"Lina Al-Sayed",   expiryDate:"01 Mar 2025" },
  { id:"tp3", ref:"TRV-POL-2025-003",                             insuredName:"Raj Mehta",         nationality:"Indian",    passportNo:"IN-L1234567", destination:"Europe",        departureDate:"15 Mar 2025", returnDate:"01 Apr 2025", days:17, coverageType:"basic",    pax:1, premiumAED:180,  providerId:"ip3", providerName:"Orient Insurance",  coverageLimitUSD:50000,  status:"pending", issuedAt:"08 Jan 2025", issuedBy:"Omar Hassan",     expiryDate:"01 Apr 2025" },
  { id:"tp4", ref:"TRV-POL-2024-098", policyNo:"AIG-TRV-009988", insuredName:"David Okafor",      nationality:"Nigerian",  passportNo:"NG-A1234567", destination:"UK",            departureDate:"01 Dec 2024", returnDate:"15 Dec 2024", days:14, coverageType:"premium",  pax:1, premiumAED:390,  providerId:"ip1", providerName:"AIG Insurance UAE", coverageLimitUSD:250000, status:"expired", issuedAt:"25 Nov 2024", issuedBy:"James Whitfield", expiryDate:"15 Dec 2024" },
  { id:"tp5", ref:"TRV-POL-2025-004", policyNo:"OR-TRV-776655",  insuredName:"Corporate Group",   nationality:"Various",   passportNo:"",            destination:"Sri Lanka",     departureDate:"10 Mar 2025", returnDate:"18 Mar 2025", days:8,  coverageType:"group",    pax:8, premiumAED:1200, providerId:"ip3", providerName:"Orient Insurance",  coverageLimitUSD:100000, status:"active",  issuedAt:"09 Jan 2025", issuedBy:"Ayesha Rahman",   expiryDate:"18 Mar 2025" },
];

// ── Medical Policies ──────────────────────────────────────────────────────────
export const MEDICAL_POLICIES: MedicalPolicy[] = [
  { id:"mp1", ref:"MED-POL-2025-001", policyNo:"BUPA-MED-001122", insuredName:"Mohammed Al-Farsi",  nationality:"Omani",    dob:"15 Mar 1982", employerId:"emp1", employerName:"PetroAbu Energy", plan:"comprehensive",  pax:1,  annualPremiumAED:12000, providerId:"ip4", providerName:"Bupa Arabia",      networkType:"regional",       coverageLimitAED:500000, inPatient:true, outPatient:true, dental:true,  maternity:false, status:"active",        startDate:"01 Jan 2025", expiryDate:"31 Dec 2025", issuedAt:"27 Dec 2024", issuedBy:"Ayesha Rahman"   },
  { id:"mp2", ref:"MED-POL-2025-002", policyNo:"DAMAN-MED-334455",insuredName:"TechCorp Group",      nationality:"Various",  dob:"",            employerId:"emp2", employerName:"TechCorp Dubai",  plan:"enhanced",       pax:28, annualPremiumAED:98000, providerId:"ip5", providerName:"Daman Insurance",  networkType:"regional",       coverageLimitAED:300000, inPatient:true, outPatient:true, dental:false, maternity:false, status:"active",        startDate:"01 Jan 2025", expiryDate:"31 Dec 2025", issuedAt:"28 Dec 2024", issuedBy:"James Whitfield" },
  { id:"mp3", ref:"MED-POL-2025-003",                              insuredName:"Amira Hassan",        nationality:"Egyptian", dob:"09 Aug 1991", plan:"basic",          pax:1,  annualPremiumAED:3200,  providerId:"ip5", providerName:"Daman Insurance",  networkType:"local",          coverageLimitAED:100000, inPatient:true, outPatient:false,dental:false, maternity:false, status:"pending",       startDate:"15 Jan 2025", expiryDate:"14 Jan 2026", issuedAt:"09 Jan 2025", issuedBy:"Omar Hassan"     },
  { id:"mp4", ref:"MED-POL-2024-088", policyNo:"BUPA-MED-889977", insuredName:"Elena Vasquez",       nationality:"Spanish",  dob:"12 Apr 1989", plan:"comprehensive",  pax:1,  annualPremiumAED:11500, providerId:"ip4", providerName:"Bupa Arabia",      networkType:"international",  coverageLimitAED:500000, inPatient:true, outPatient:true, dental:true,  maternity:true,  status:"expiring_soon", startDate:"01 Feb 2024", expiryDate:"31 Jan 2025", issuedAt:"25 Jan 2024", issuedBy:"Lina Al-Sayed"   },
];

// ── Claims ────────────────────────────────────────────────────────────────────
export const INSURANCE_CLAIMS: InsuranceClaim[] = [
  { id:"cl1", ref:"CLM-2025-001", policyId:"tp2", policyRef:"TRV-POL-2025-002", policyType:"travel",  insuredName:"Nadia Al-Farhan", claimDate:"25 Feb 2025", incidentDate:"24 Feb 2025", description:"Medical emergency — appendicitis, hospitalized in Nairobi",            claimAmountAED:28000,                   providerId:"ip2", providerName:"RSA Insurance",    documents:["Hospital bill","Discharge summary","Passport copy"],                     status:"submitted",    submittedAt:"25 Feb 2025",                    assignedTo:"Ayesha Rahman"   },
  { id:"cl2", ref:"CLM-2025-002", policyId:"mp1", policyRef:"MED-POL-2025-001", policyType:"medical", insuredName:"Mohammed Al-Farsi",claimDate:"05 Jan 2025", incidentDate:"03 Jan 2025", description:"Cardiac consultation + echocardiogram at Cleveland Clinic Abu Dhabi",   claimAmountAED:4500, approvedAmountAED:4200, providerId:"ip4", providerName:"Bupa Arabia",      documents:["Medical report","Prescription","Receipt"],                               status:"approved",     submittedAt:"06 Jan 2025",                    assignedTo:"James Whitfield" },
  { id:"cl3", ref:"CLM-2025-003", policyId:"mp2", policyRef:"MED-POL-2025-002", policyType:"medical", insuredName:"Priya Menon",      claimDate:"08 Jan 2025", incidentDate:"07 Jan 2025", description:"Emergency room visit — severe allergic reaction, Rashid Hospital",      claimAmountAED:2800, approvedAmountAED:2800, providerId:"ip5", providerName:"Daman Insurance",  documents:["ER report","Pharmacy receipt"],                                          status:"settled",      submittedAt:"08 Jan 2025", settledAt:"09 Jan 2025", assignedTo:"Omar Hassan"     },
  { id:"cl4", ref:"CLM-2024-097", policyId:"tp4", policyRef:"TRV-POL-2024-098", policyType:"travel",  insuredName:"David Okafor",     claimDate:"12 Dec 2024", incidentDate:"10 Dec 2024", description:"Baggage lost by airline — claimed for belongings",                       claimAmountAED:3500,                   providerId:"ip1", providerName:"AIG Insurance UAE", documents:["PIR report","Boarding pass","Purchase receipts"],                        status:"under_review", submittedAt:"14 Dec 2024",                    assignedTo:"Lina Al-Sayed"   },
  { id:"cl5", ref:"CLM-2024-090", policyId:"tp3", policyRef:"TRV-POL-2025-003", policyType:"travel",  insuredName:"Fatima Malik",     claimDate:"15 Dec 2024", incidentDate:"14 Dec 2024", description:"Trip cancellation — medical grounds (surgery)",                         claimAmountAED:12000,                  providerId:"ip3", providerName:"Orient Insurance",  documents:["Medical certificate","Booking receipts","Doctor letter"],                status:"rejected",     submittedAt:"16 Dec 2024",                    assignedTo:"Ayesha Rahman",  },
];

// ── Providers ─────────────────────────────────────────────────────────────────
export const INSURANCE_PROVIDERS: InsuranceProvider[] = [
  { id:"ip1", name:"AIG Insurance UAE",   country:"UAE",         types:["travel","medical"], contactName:"Ahmed Al-Sayed",    contactEmail:"partners@aig.ae",     contactPhone:"+971 4 232 5000", commissionPct:12, activePolicies:48, rating:4.7, status:"active" },
  { id:"ip2", name:"RSA Insurance",        country:"UAE",         types:["travel"],           contactName:"Sarah Mitchell",    contactEmail:"partners@rsagroup.ae",contactPhone:"+971 4 232 6000", commissionPct:10, activePolicies:32, rating:4.5, status:"active" },
  { id:"ip3", name:"Orient Insurance",     country:"UAE",         types:["travel","medical"], contactName:"Walid Al-Nuaimi",   contactEmail:"b2b@orient.ae",       contactPhone:"+971 4 311 8888", commissionPct:11, activePolicies:65, rating:4.6, status:"active" },
  { id:"ip4", name:"Bupa Arabia",          country:"Saudi Arabia",types:["medical"],          contactName:"Dr. Faisal Qureshi",contactEmail:"partners@bupa.ae",    contactPhone:"+966 11 4622 222",commissionPct:8,  activePolicies:124,rating:4.8, status:"active" },
  { id:"ip5", name:"Daman Insurance",      country:"UAE",         types:["medical"],          contactName:"Mariam Al-Zaabi",   contactEmail:"brokers@damanhealth.ae",contactPhone:"+971 2 614 6666",commissionPct:9,  activePolicies:89, rating:4.7, status:"active" },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
