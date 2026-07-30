export type DocCategory = "visa_forms" | "embassy_forms" | "templates" | "guidelines" | "checklists" | "links";
export type DocFileType = "pdf" | "docx" | "xlsx" | "jpg" | "url";

export interface DownloadDoc {
  id: string; category: DocCategory; title: string; description: string;
  fileType: DocFileType; fileSize?: string; language: string;
  country?: string; service?: string; tags: string[];
  uploadedAt: string; updatedAt: string; downloads: number;
  active: boolean; featured?: boolean;
  url?: string;
}

export interface UsefulLink {
  id: string; title: string; description: string; url: string;
  category: string; country?: string; tags: string[];
  addedAt: string; active: boolean;
}

export const DOCUMENTS: DownloadDoc[] = [
  // ── Visa Forms ──────────────────────────────────────────────────────────────
  { id:"d1",  category:"visa_forms", title:"Schengen Visa Application Form (Uniform Format)", description:"Official uniform Schengen visa application form — required for all Schengen area embassies.", fileType:"pdf", fileSize:"284 KB", language:"en", country:"Schengen", service:"Visa", tags:["schengen","visa","application"], uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:1821, active:true, featured:true },
  { id:"d2",  category:"visa_forms", title:"UK Visa Application Form VAF1A",                   description:"UK Standard Visitor Visa application form. For tourism, family visits, business.",             fileType:"pdf", fileSize:"312 KB", language:"en", country:"UK",      service:"Visa", tags:["uk","visitor","visa"],          uploadedAt:"01 Jan 2025", updatedAt:"05 Jan 2025", downloads:2104, active:true, featured:true },
  { id:"d3",  category:"visa_forms", title:"US DS-160 Nonimmigrant Visa Application Guide",    description:"Guide to completing DS-160 online application. Step-by-step instructions.",                    fileType:"pdf", fileSize:"421 KB", language:"en", country:"USA",     service:"Visa", tags:["usa","ds160","guide"],          uploadedAt:"01 Jan 2025", updatedAt:"10 Jan 2025", downloads:3412, active:true, featured:true },
  { id:"d4",  category:"visa_forms", title:"Canada Visitor Visa Application Guide (IMM 5257)", description:"Instructions and guide for Canada Visitor Record / Temporary Resident Visa.",                  fileType:"pdf", fileSize:"398 KB", language:"en", country:"Canada",  service:"Visa", tags:["canada","visitor","imm5257"],   uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:1244, active:true },
  { id:"d5",  category:"visa_forms", title:"Australia Tourist Visa (Subclass 600) Checklist",  description:"Document checklist for Australian Tourist visa Subclass 600 applications.",                    fileType:"pdf", fileSize:"198 KB", language:"en", country:"Australia",service:"Visa", tags:["australia","tourist","checklist"],uploadedAt:"01 Jan 2025", updatedAt:"08 Jan 2025", downloads:988,  active:true },
  { id:"d6",  category:"visa_forms", title:"استمارة طلب تأشيرة الزيارة — الإمارات",           description:"نموذج طلب تأشيرة السياحة والزيارة الإمارات العربية المتحدة — باللغة العربية.",                fileType:"pdf", fileSize:"245 KB", language:"ar", country:"UAE",     service:"Visa", tags:["uae","visa","arabic"],          uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:612,  active:true },

  // ── Embassy Forms ────────────────────────────────────────────────────────────
  { id:"d7",  category:"embassy_forms", title:"French Embassy — Visa Appointment Booking Guide",  description:"How to book VFS France visa appointment in UAE. Updated Jan 2025.",                      fileType:"pdf", fileSize:"312 KB", language:"en", country:"France",  service:"Visa", tags:["france","embassy","appointment"],uploadedAt:"10 Jan 2025", updatedAt:"10 Jan 2025", downloads:821, active:true, featured:true },
  { id:"d8",  category:"embassy_forms", title:"German Embassy — Accepted Document List 2025",     description:"Complete list of documents accepted by German Embassy Abu Dhabi for Schengen visa.",     fileType:"pdf", fileSize:"198 KB", language:"en", country:"Germany", service:"Visa", tags:["germany","embassy","documents"], uploadedAt:"05 Jan 2025", updatedAt:"05 Jan 2025", downloads:1102,active:true },
  { id:"d9",  category:"embassy_forms", title:"US Embassy Abu Dhabi — Interview Guide",           description:"What to expect at your US visa interview. Tips, required documents, process.",            fileType:"pdf", fileSize:"244 KB", language:"en", country:"USA",     service:"Visa", tags:["usa","interview","embassy"],     uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:2841,active:true, featured:true },
  { id:"d10", category:"embassy_forms", title:"UK Visa Biometric Appointment Guide (VFS Dubai)",  description:"Step-by-step guide for UK visa biometric appointment at VFS Dubai.",                     fileType:"pdf", fileSize:"178 KB", language:"en", country:"UK",      service:"Visa", tags:["uk","vfs","biometric"],          uploadedAt:"01 Jan 2025", updatedAt:"08 Jan 2025", downloads:1544,active:true },
  { id:"d11", category:"embassy_forms", title:"Canadian Embassy — Financial Proof Requirements",  description:"Acceptable forms of financial evidence for Canada visa applications.",                     fileType:"pdf", fileSize:"156 KB", language:"en", country:"Canada",  service:"Visa", tags:["canada","financial","proof"],    uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:944, active:true },

  // ── Templates ────────────────────────────────────────────────────────────────
  { id:"d12", category:"templates", title:"Cover Letter Template — Visa Application",           description:"Professional cover letter template for visa applications. Editable DOCX format.",          fileType:"docx",fileSize:"48 KB",  language:"en", service:"Visa",     tags:["cover letter","template","visa"],  uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:4812, active:true, featured:true },
  { id:"d13", category:"templates", title:"Bank Statement Letter — Employer Confirmation",      description:"Template for employer letter confirming salary and leave approval.",                        fileType:"docx",fileSize:"42 KB",  language:"en", service:"Visa",     tags:["employer letter","template"],     uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:3214, active:true, featured:true },
  { id:"d14", category:"templates", title:"No Objection Certificate (NOC) Template",            description:"Standard NOC template from employer for visa applications.",                               fileType:"docx",fileSize:"38 KB",  language:"en", service:"Visa",     tags:["noc","template","employer"],      uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:5812, active:true, featured:true },
  { id:"d15", category:"templates", title:"Hotel Booking Confirmation Template",                 description:"Template for confirming hotel bookings for visa applications.",                             fileType:"docx",fileSize:"35 KB",  language:"en", service:"Hotels",   tags:["hotel","booking","confirmation"], uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:1841, active:true },
  { id:"d16", category:"templates", title:"Itinerary Template — Multi-Country Travel",          description:"Comprehensive travel itinerary template for visa applications.",                            fileType:"xlsx",fileSize:"58 KB",  language:"en", service:"Tours",    tags:["itinerary","travel","template"],  uploadedAt:"01 Jan 2025", updatedAt:"08 Jan 2025", downloads:2204, active:true },

  // ── Guidelines ───────────────────────────────────────────────────────────────
  { id:"d17", category:"guidelines", title:"UAE Residency Visa — Complete 2025 Guide",          description:"Everything you need to know about UAE residency visas — types, requirements, process.",   fileType:"pdf", fileSize:"1.2 MB", language:"en", country:"UAE",    service:"Visa",         tags:["uae","residency","guide"],       uploadedAt:"01 Jan 2025", updatedAt:"10 Jan 2025", downloads:8841, active:true, featured:true },
  { id:"d18", category:"guidelines", title:"Hajj 2025 — Pilgrim Preparation Guide",             description:"Official TravelPro Hajj preparation guide — what to bring, health, procedures.",          fileType:"pdf", fileSize:"2.1 MB", language:"en", country:"Saudi Arabia",service:"Hajj",    tags:["hajj","preparation","guide"],    uploadedAt:"01 Jan 2025", updatedAt:"07 Jan 2025", downloads:3212, active:true, featured:true },
  { id:"d19", category:"guidelines", title:"Schengen Countries & Entry Requirements 2025",      description:"Complete guide to all Schengen member countries, entry requirements, and tips.",           fileType:"pdf", fileSize:"892 KB", language:"en", country:"Schengen",service:"Visa",        tags:["schengen","europe","guide"],     uploadedAt:"01 Jan 2025", updatedAt:"05 Jan 2025", downloads:6441, active:true, featured:true },
  { id:"d20", category:"guidelines", title:"Medical Tourism — Process & Documentation Guide",   description:"Step-by-step guide to medical visa applications and treatment coordination.",              fileType:"pdf", fileSize:"744 KB", language:"en", service:"Medical",      tags:["medical","tourism","guide"],     uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:1122, active:true },

  // ── Checklists ───────────────────────────────────────────────────────────────
  { id:"d21", category:"checklists", title:"Schengen Visa Document Checklist",                  description:"Complete checklist of required documents for Schengen visa application.",                   fileType:"pdf", fileSize:"156 KB", language:"en", country:"Schengen", service:"Visa",    tags:["schengen","checklist","documents"],uploadedAt:"01 Jan 2025", updatedAt:"10 Jan 2025", downloads:9241, active:true, featured:true },
  { id:"d22", category:"checklists", title:"UK Visitor Visa Document Checklist",                description:"Documents required for UK Standard Visitor Visa application from UAE.",                     fileType:"pdf", fileSize:"144 KB", language:"en", country:"UK",       service:"Visa",    tags:["uk","checklist","documents"],    uploadedAt:"01 Jan 2025", updatedAt:"05 Jan 2025", downloads:8102, active:true, featured:true },
  { id:"d23", category:"checklists", title:"US Tourist Visa (B1/B2) Document Checklist",       description:"Complete document checklist for US B1/B2 tourist/business visa.",                          fileType:"pdf", fileSize:"168 KB", language:"en", country:"USA",      service:"Visa",    tags:["usa","b1b2","checklist"],        uploadedAt:"01 Jan 2025", updatedAt:"08 Jan 2025", downloads:10841,active:true, featured:true },
  { id:"d24", category:"checklists", title:"Hajj Packing Checklist",                            description:"Essential items to pack for your Hajj pilgrimage. Reviewed by Hajj scholars.",            fileType:"pdf", fileSize:"198 KB", language:"en", country:"Saudi Arabia",service:"Hajj", tags:["hajj","packing","checklist"],    uploadedAt:"01 Jan 2025", updatedAt:"07 Jan 2025", downloads:2841, active:true },
  { id:"d25", category:"checklists", title:"Immigration Work Permit — Document Checklist",      description:"Required documents for UAE work permit and employment visa application.",                   fileType:"pdf", fileSize:"134 KB", language:"en", country:"UAE",      service:"Immigration",tags:["work permit","immigration","checklist"],uploadedAt:"01 Jan 2025", updatedAt:"09 Jan 2025", downloads:4102, active:true },

  // ── Useful Links (as docs with type "url") ────────────────────────────────────
  { id:"d26", category:"links", title:"VFS Global UAE — Appointment Booking",                  description:"Official VFS Global UAE portal for Schengen, UK, US visa appointment booking.",           fileType:"url", language:"en", tags:["vfs","appointment"],  url:"https://www.vfsglobal.com/en/consumers/index.html",                             uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:0, active:true },
  { id:"d27", category:"links", title:"UAE Federal Authority for Identity & Citizenship (ICA)",description:"Official ICA portal for UAE visa, entry, and residency services.",                         fileType:"url", language:"en", tags:["ica","uae","residency"],url:"https://icp.gov.ae",                                                                uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:0, active:true },
  { id:"d28", category:"links", title:"UK UKVI — Visa & Immigration Official Portal",          description:"Official UK government visa and immigration application portal.",                            fileType:"url", language:"en", tags:["uk","ukvi","visa"],    url:"https://www.gov.uk/apply-uk-visa",                                             uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:0, active:true },
  { id:"d29", category:"links", title:"US Travel State — Visa Information",                    description:"Official US State Department visa information and DS-160 portal.",                          fileType:"url", language:"en", tags:["usa","state dept"],    url:"https://travel.state.gov",                                                     uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:0, active:true },
  { id:"d30", category:"links", title:"IATA Travel Centre",                                    description:"IATA travel centre for airline ticket, passport, and visa requirements.",                   fileType:"url", language:"en", tags:["iata","airline"],      url:"https://www.iatatravelcentre.com",                                             uploadedAt:"01 Jan 2025", updatedAt:"01 Jan 2025", downloads:0, active:true },
];

export const CATEGORY_META: Record<DocCategory, { label: string; icon: string; description: string; color: string }> = {
  visa_forms:    { label:"Visa Forms",     icon:"FileText",  description:"Official visa application forms by country",              color:"text-blue-400"   },
  embassy_forms: { label:"Embassy Forms",  icon:"Building2", description:"Embassy-specific guides, checklists, and documents",      color:"text-violet-400" },
  templates:     { label:"Templates",      icon:"Layout",    description:"Editable cover letters, NOCs, and document templates",    color:"text-amber-400"  },
  guidelines:    { label:"Guidelines",     icon:"BookOpen",  description:"Comprehensive guides for visa and travel processes",      color:"text-emerald-400"},
  checklists:    { label:"Checklists",     icon:"CheckSquare",description:"Country-specific document requirement checklists",       color:"text-teal-400"   },
  links:         { label:"Useful Links",   icon:"Link",      description:"Official government portals and authoritative websites",  color:"text-rose-400"   },
};

export const FILE_TYPE_COLOR: Record<DocFileType, string> = {
  pdf:  "bg-red-500/20 text-red-400",
  docx: "bg-blue-500/20 text-blue-400",
  xlsx: "bg-emerald-500/20 text-emerald-400",
  jpg:  "bg-amber-500/20 text-amber-400",
  url:  "bg-purple-500/20 text-purple-400",
};
