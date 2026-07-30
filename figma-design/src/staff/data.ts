export type SLAStatus   = "ok" | "due_soon" | "overdue";
export type CaseStage   = 0|1|2|3|4|5|6|7|8|9|10|11|12|13|14;
export type CasePriority= "urgent" | "high" | "normal" | "low";
export type CaseStatus  = "active" | "on_hold" | "completed" | "cancelled";
export type DocCategory = "passport" | "visa_form" | "financial" | "medical" | "photo" | "other";

// ── 15-stage workflow ────────────────────────────────
export const STAGES: { label: string; short: string }[] = [
  { label: "Inquiry Received",     short: "Inquiry"      },
  { label: "Passport OCR",         short: "OCR"          },
  { label: "Checklist Review",     short: "Checklist"    },
  { label: "Document Upload",      short: "Doc Upload"   },
  { label: "AI Validation",        short: "AI Check"     },
  { label: "Invoice Generated",    short: "Invoice"      },
  { label: "Payment Received",     short: "Payment"      },
  { label: "Staff Assigned",       short: "Assigned"     },
  { label: "Embassy Submission",   short: "Embassy"      },
  { label: "Embassy Processing",   short: "Processing"   },
  { label: "Interview/Biometric",  short: "Interview"    },
  { label: "Approval Decision",    short: "Approval"     },
  { label: "Passport Received",    short: "Passport Rcv" },
  { label: "Delivery",             short: "Delivery"     },
  { label: "Archived",             short: "Archive"      },
];

export interface StaffMember {
  id: string; name: string; role: string; avatar: string; cases: number; online: boolean;
}
export interface Application {
  id: string; ref: string; applicantName: string; applicantEmail: string; applicantPhone: string;
  passportNo: string; nationality: string; destination: string; visaType: string;
  stage: CaseStage; priority: CasePriority; status: CaseStatus;
  assignedTo: string; createdAt: string; updatedAt: string; travelDate: string;
  slaDue: string; slaStatus: SLAStatus;
  stageHistory: { stage: CaseStage; completedAt: string; by: string; note?: string }[];
  notes: string[];
}
export interface Task {
  id: string; title: string; appRef: string; applicantName: string; type: string;
  assignedTo: string; dueAt: string; slaStatus: SLAStatus; priority: CasePriority;
  done: boolean; description: string;
}
export interface Customer {
  id: string; name: string; email: string; phone: string; nationality: string;
  passportNo: string; totalApps: number; activeApp?: string; lastContact: string;
  tags: string[];
}
export interface CalendarEvent {
  id: string; date: string; time: string; duration: string; title: string;
  type: "interview" | "biometric" | "meeting" | "deadline" | "call";
  applicant?: string; appRef?: string; location: string; notes?: string;
}
export interface ChatThread {
  id: string; participants: string[]; title: string; lastMessage: string;
  lastAt: string; unread: number; type: "direct" | "group";
}
export interface ChatMessage {
  id: string; threadId: string; from: string; text: string; at: string; me?: boolean;
}
export interface StaffDoc {
  id: string; name: string; category: DocCategory; appRef?: string;
  applicant?: string; uploadedBy: string; uploadedAt: string; size: string;
  status: "verified" | "pending" | "rejected";
}

// ── Staff ────────────────────────────────────────────
export const STAFF: StaffMember[] = [
  { id: "s1", name: "Ayesha Rahman",   role: "Senior Visa Officer",  avatar: "AR", cases: 12, online: true  },
  { id: "s2", name: "Omar Hassan",     role: "Visa Officer",         avatar: "OH", cases: 9,  online: true  },
  { id: "s3", name: "Priya Nair",      role: "Document Specialist",  avatar: "PN", cases: 7,  online: false },
  { id: "s4", name: "James Whitfield", role: "Case Manager",         avatar: "JW", cases: 14, online: true  },
  { id: "s5", name: "Lina Al-Sayed",   role: "Visa Officer",         avatar: "LA", cases: 11, online: false },
];

// Current logged-in staff (s1)
export const ME = STAFF[0];

// ── Applications ─────────────────────────────────────
export const APPLICATIONS: Application[] = [
  {
    id: "a1", ref: "APP-7701", applicantName: "James Whitmore", applicantEmail: "j.whitmore@email.co.uk",
    applicantPhone: "+44 7911 123456", passportNo: "UK9823441", nationality: "United Kingdom",
    destination: "UAE", visaType: "Tourist Visa", stage: 9, priority: "urgent", status: "active",
    assignedTo: "s1", createdAt: "02 Jan 2025", updatedAt: "09 Jan 2025", travelDate: "20 Jan 2025",
    slaDue: "10 Jan 2025 14:00", slaStatus: "overdue",
    stageHistory: [
      { stage: 0, completedAt: "02 Jan 2025 09:00", by: "Lina Al-Sayed" },
      { stage: 1, completedAt: "02 Jan 2025 11:30", by: "System (OCR)" },
      { stage: 2, completedAt: "03 Jan 2025 10:00", by: "Ayesha Rahman" },
      { stage: 3, completedAt: "04 Jan 2025 14:00", by: "James Whitmore", note: "All docs uploaded" },
      { stage: 4, completedAt: "04 Jan 2025 14:45", by: "System (AI)", note: "2 flags resolved" },
      { stage: 5, completedAt: "05 Jan 2025 09:00", by: "Ayesha Rahman" },
      { stage: 6, completedAt: "05 Jan 2025 11:00", by: "System", note: "AED 850 received" },
      { stage: 7, completedAt: "05 Jan 2025 11:15", by: "Ayesha Rahman" },
      { stage: 8, completedAt: "07 Jan 2025 09:30", by: "Ayesha Rahman", note: "Submitted to UAE Embassy" },
    ],
    notes: ["Urgent — travel date 20 Jan", "Embassy ref: UAE-DXB-8812"],
  },
  {
    id: "a2", ref: "APP-7702", applicantName: "Fatima Al-Rashidi", applicantEmail: "fatima.ar@gmail.com",
    applicantPhone: "+971 50 223 4456", passportNo: "AE4412987", nationality: "UAE",
    destination: "United Kingdom", visaType: "Business Visa", stage: 4, priority: "high", status: "active",
    assignedTo: "s1", createdAt: "05 Jan 2025", updatedAt: "09 Jan 2025", travelDate: "01 Feb 2025",
    slaDue: "10 Jan 2025 17:00", slaStatus: "due_soon",
    stageHistory: [
      { stage: 0, completedAt: "05 Jan 2025 10:00", by: "Omar Hassan" },
      { stage: 1, completedAt: "05 Jan 2025 12:00", by: "System (OCR)" },
      { stage: 2, completedAt: "06 Jan 2025 09:00", by: "Ayesha Rahman" },
      { stage: 3, completedAt: "08 Jan 2025 16:00", by: "Fatima Al-Rashidi" },
    ],
    notes: ["Corporate booking — invoice to company", "Contact: HR Dept"],
  },
  {
    id: "a3", ref: "APP-7703", applicantName: "Rajesh Kumar", applicantEmail: "rajesh.k@tcs.com",
    applicantPhone: "+91 98201 34567", passportNo: "IN8834201", nationality: "India",
    destination: "Germany", visaType: "Schengen Business", stage: 7, priority: "normal", status: "active",
    assignedTo: "s2", createdAt: "28 Dec 2024", updatedAt: "08 Jan 2025", travelDate: "15 Feb 2025",
    slaDue: "12 Jan 2025 12:00", slaStatus: "ok",
    stageHistory: [
      { stage: 0, completedAt: "28 Dec 2024 10:00", by: "Omar Hassan" },
      { stage: 1, completedAt: "28 Dec 2024 11:30", by: "System (OCR)" },
      { stage: 2, completedAt: "29 Dec 2024 14:00", by: "Priya Nair" },
      { stage: 3, completedAt: "31 Dec 2024 10:00", by: "Rajesh Kumar" },
      { stage: 4, completedAt: "31 Dec 2024 11:00", by: "System (AI)" },
      { stage: 5, completedAt: "02 Jan 2025 09:00", by: "Omar Hassan" },
      { stage: 6, completedAt: "02 Jan 2025 15:00", by: "System" },
    ],
    notes: ["Group application — 3 colleagues pending separately"],
  },
  {
    id: "a4", ref: "APP-7704", applicantName: "Sarah Thompson", applicantEmail: "sarah.t@netmail.au",
    applicantPhone: "+61 412 345 678", passportNo: "AU5521893", nationality: "Australia",
    destination: "United States", visaType: "B1/B2 Tourist", stage: 2, priority: "normal", status: "active",
    assignedTo: "s3", createdAt: "07 Jan 2025", updatedAt: "09 Jan 2025", travelDate: "25 Mar 2025",
    slaDue: "14 Jan 2025 17:00", slaStatus: "ok",
    stageHistory: [
      { stage: 0, completedAt: "07 Jan 2025 09:00", by: "Priya Nair" },
      { stage: 1, completedAt: "07 Jan 2025 10:00", by: "System (OCR)" },
    ],
    notes: [],
  },
  {
    id: "a5", ref: "APP-7705", applicantName: "Mohamed Khalil", applicantEmail: "mkhalil@outlook.com",
    applicantPhone: "+20 100 234 5678", passportNo: "EG7712334", nationality: "Egypt",
    destination: "Canada", visaType: "Visitor Visa", stage: 6, priority: "high", status: "active",
    assignedTo: "s1", createdAt: "03 Jan 2025", updatedAt: "08 Jan 2025", travelDate: "10 Feb 2025",
    slaDue: "09 Jan 2025 12:00", slaStatus: "overdue",
    stageHistory: [
      { stage: 0, completedAt: "03 Jan 2025 11:00", by: "Lina Al-Sayed" },
      { stage: 1, completedAt: "03 Jan 2025 13:00", by: "System (OCR)" },
      { stage: 2, completedAt: "04 Jan 2025 10:00", by: "Ayesha Rahman" },
      { stage: 3, completedAt: "05 Jan 2025 15:00", by: "Mohamed Khalil" },
      { stage: 4, completedAt: "06 Jan 2025 09:00", by: "System (AI)", note: "All docs verified" },
      { stage: 5, completedAt: "06 Jan 2025 10:00", by: "Ayesha Rahman" },
    ],
    notes: ["Payment confirmation email sent", "Awaiting payment clearance"],
  },
  {
    id: "a6", ref: "APP-7706", applicantName: "Kenji Tanaka", applicantEmail: "k.tanaka@sony.co.jp",
    applicantPhone: "+81 90 1234 5678", passportNo: "JP8821003", nationality: "Japan",
    destination: "France", visaType: "Schengen Tourist", stage: 11, priority: "normal", status: "active",
    assignedTo: "s4", createdAt: "18 Dec 2024", updatedAt: "07 Jan 2025", travelDate: "20 Jan 2025",
    slaDue: "11 Jan 2025 17:00", slaStatus: "due_soon",
    stageHistory: Array.from({ length: 11 }, (_, i) => ({
      stage: i as CaseStage,
      completedAt: `${18 + i > 31 ? "0" + (18 + i - 31) : 18 + i} ${18 + i > 31 ? "Jan" : "Dec"} 2024`,
      by: ["James Whitfield","System (OCR)","James Whitfield","Kenji Tanaka","System (AI)","James Whitfield","System","James Whitfield","James Whitfield","James Whitfield","System"][i],
    })),
    notes: ["Embassy interview scheduled 11 Jan", "Approval expected 15 Jan"],
  },
  {
    id: "a7", ref: "APP-7707", applicantName: "Giulia Romano", applicantEmail: "giulia.r@gmail.com",
    applicantPhone: "+39 333 123 4567", passportNo: "IT5567234", nationality: "Italy",
    destination: "UAE", visaType: "Tourist Visa", stage: 13, priority: "low", status: "active",
    assignedTo: "s2", createdAt: "10 Dec 2024", updatedAt: "08 Jan 2025", travelDate: "12 Jan 2025",
    slaDue: "12 Jan 2025 12:00", slaStatus: "ok",
    stageHistory: Array.from({ length: 13 }, (_, i) => ({
      stage: i as CaseStage,
      completedAt: `${10 + i} Dec 2024`,
      by: "Omar Hassan",
    })),
    notes: ["Courier arranged — Aramex tracking 1Z999"],
  },
  {
    id: "a8", ref: "APP-7708", applicantName: "Wei Zhang", applicantEmail: "wei.zhang@alibaba.com",
    applicantPhone: "+86 138 0013 8000", passportNo: "CN7890123", nationality: "China",
    destination: "United Kingdom", visaType: "Business Visa", stage: 1, priority: "urgent", status: "active",
    assignedTo: "s1", createdAt: "09 Jan 2025", updatedAt: "09 Jan 2025", travelDate: "25 Jan 2025",
    slaDue: "09 Jan 2025 18:00", slaStatus: "overdue",
    stageHistory: [{ stage: 0, completedAt: "09 Jan 2025 08:00", by: "Ayesha Rahman" }],
    notes: ["URGENT — VIP client, direct CEO contact", "Fast-track requested"],
  },
];

// ── Tasks ────────────────────────────────────────────
export const TASKS: Task[] = [
  { id: "t1", title: "Review AI validation flags",    appRef: "APP-7702", applicantName: "Fatima Al-Rashidi", type: "Document Review", assignedTo: "s1", dueAt: "10 Jan 14:00", slaStatus: "due_soon", priority: "high",   done: false, description: "Two document flags raised by AI. Review bank statement and photo quality." },
  { id: "t2", title: "Process payment clearance",     appRef: "APP-7705", applicantName: "Mohamed Khalil",   type: "Payment",         assignedTo: "s1", dueAt: "09 Jan 12:00", slaStatus: "overdue",  priority: "high",   done: false, description: "Payment of AED 920 awaiting manual clearance confirmation." },
  { id: "t3", title: "OCR passport upload",           appRef: "APP-7708", applicantName: "Wei Zhang",        type: "OCR",             assignedTo: "s1", dueAt: "09 Jan 18:00", slaStatus: "overdue",  priority: "urgent", done: false, description: "Initiate OCR scan on uploaded passport scans. VIP client." },
  { id: "t4", title: "Schedule embassy appointment",  appRef: "APP-7703", applicantName: "Rajesh Kumar",    type: "Embassy",         assignedTo: "s1", dueAt: "12 Jan 12:00", slaStatus: "ok",       priority: "normal", done: false, description: "Book Schengen embassy appointment for 15 Feb or earlier." },
  { id: "t5", title: "Send checklist to applicant",  appRef: "APP-7704", applicantName: "Sarah Thompson",   type: "Communication",   assignedTo: "s1", dueAt: "11 Jan 17:00", slaStatus: "ok",       priority: "normal", done: false, description: "Send the standard B1/B2 document checklist email." },
  { id: "t6", title: "Follow up on overdue payment", appRef: "APP-7701", applicantName: "James Whitmore",   type: "Follow-up",       assignedTo: "s1", dueAt: "10 Jan 10:00", slaStatus: "overdue",  priority: "urgent", done: false, description: "Embassy submission on hold — confirm payment of AED 1,200." },
  { id: "t7", title: "Verify interview slot",        appRef: "APP-7706", applicantName: "Kenji Tanaka",     type: "Interview",       assignedTo: "s1", dueAt: "11 Jan 09:00", slaStatus: "due_soon", priority: "high",   done: false, description: "Confirm French embassy interview at 11:00 AM on 11 Jan." },
  { id: "t8", title: "Update delivery tracking",     appRef: "APP-7707", applicantName: "Giulia Romano",    type: "Delivery",        assignedTo: "s1", dueAt: "12 Jan 17:00", slaStatus: "ok",       priority: "low",    done: true,  description: "Aramex tracking updated. Estimated delivery 12 Jan." },
];

// ── Customers ────────────────────────────────────────
export const CUSTOMERS: Customer[] = [
  { id: "cu1", name: "James Whitmore",    email: "j.whitmore@email.co.uk", phone: "+44 7911 123456", nationality: "United Kingdom", passportNo: "UK9823441", totalApps: 3, activeApp: "APP-7701", lastContact: "09 Jan 2025", tags: ["VIP","Corporate"] },
  { id: "cu2", name: "Fatima Al-Rashidi", email: "fatima.ar@gmail.com",    phone: "+971 50 223 4456", nationality: "UAE",            passportNo: "AE4412987", totalApps: 2, activeApp: "APP-7702", lastContact: "08 Jan 2025", tags: ["Corporate"] },
  { id: "cu3", name: "Rajesh Kumar",      email: "rajesh.k@tcs.com",       phone: "+91 98201 34567",  nationality: "India",          passportNo: "IN8834201", totalApps: 4, activeApp: "APP-7703", lastContact: "08 Jan 2025", tags: ["Corporate"] },
  { id: "cu4", name: "Sarah Thompson",    email: "sarah.t@netmail.au",     phone: "+61 412 345 678",  nationality: "Australia",      passportNo: "AU5521893", totalApps: 1, activeApp: "APP-7704", lastContact: "07 Jan 2025", tags: [] },
  { id: "cu5", name: "Mohamed Khalil",    email: "mkhalil@outlook.com",    phone: "+20 100 234 5678", nationality: "Egypt",          passportNo: "EG7712334", totalApps: 2, activeApp: "APP-7705", lastContact: "06 Jan 2025", tags: [] },
  { id: "cu6", name: "Kenji Tanaka",      email: "k.tanaka@sony.co.jp",    phone: "+81 90 1234 5678", nationality: "Japan",          passportNo: "JP8821003", totalApps: 5, activeApp: "APP-7706", lastContact: "07 Jan 2025", tags: ["VIP"] },
  { id: "cu7", name: "Giulia Romano",     email: "giulia.r@gmail.com",     phone: "+39 333 123 4567", nationality: "Italy",          passportNo: "IT5567234", totalApps: 1, activeApp: "APP-7707", lastContact: "08 Jan 2025", tags: [] },
  { id: "cu8", name: "Wei Zhang",         email: "wei.zhang@alibaba.com",  phone: "+86 138 0013 8000",nationality: "China",          passportNo: "CN7890123", totalApps: 7, activeApp: "APP-7708", lastContact: "09 Jan 2025", tags: ["VIP","Corporate"] },
  { id: "cu9", name: "Li Wei Tan",        email: "liwei.t@singtel.com",    phone: "+65 9123 4567",    nationality: "Singapore",      passportNo: "SG6634521", totalApps: 3, lastContact: "05 Jan 2025", tags: ["Corporate"] },
  { id: "cu10",name: "David Tremblay",    email: "d.tremblay@bell.ca",     phone: "+1 514 123 4567",  nationality: "Canada",         passportNo: "CA9901234", totalApps: 2, lastContact: "03 Jan 2025", tags: [] },
];

// ── Calendar ─────────────────────────────────────────
export const EVENTS: CalendarEvent[] = [
  { id: "e1", date: "2025-01-09", time: "10:00", duration: "30m", title: "Team Standup",                 type: "meeting",   location: "Conf Room A"             },
  { id: "e2", date: "2025-01-10", time: "11:00", duration: "1h",  title: "Interview — Fatima Al-Rashidi",type: "interview", applicant: "Fatima Al-Rashidi", appRef: "APP-7702", location: "UK Embassy, Abu Dhabi" },
  { id: "e3", date: "2025-01-10", time: "14:00", duration: "45m", title: "SLA Review Meeting",           type: "meeting",   location: "Conf Room B"             },
  { id: "e4", date: "2025-01-11", time: "11:00", duration: "1h",  title: "Interview — Kenji Tanaka",     type: "interview", applicant: "Kenji Tanaka",     appRef: "APP-7706", location: "French Embassy, Dubai" },
  { id: "e5", date: "2025-01-11", time: "14:30", duration: "30m", title: "Call — Wei Zhang",             type: "call",      applicant: "Wei Zhang",        appRef: "APP-7708", location: "Video Call"            },
  { id: "e6", date: "2025-01-12", time: "09:00", duration: "2h",  title: "Biometric — Rajesh Kumar",     type: "biometric", applicant: "Rajesh Kumar",     appRef: "APP-7703", location: "German Consulate"      },
  { id: "e7", date: "2025-01-12", time: "17:00", duration: "0m",  title: "Deadline — APP-7701 Embassy",  type: "deadline",  appRef: "APP-7701",            location: "—"                     },
  { id: "e8", date: "2025-01-13", time: "10:00", duration: "1h",  title: "Case Review — All Active",     type: "meeting",   location: "Conf Room A"             },
];

// ── Chat ─────────────────────────────────────────────
export const THREADS: ChatThread[] = [
  { id: "th1", participants: ["s1","s2"], title: "Omar Hassan",     lastMessage: "I'll handle the Rajesh case today",  lastAt: "09 Jan 14:22", unread: 2, type: "direct" },
  { id: "th2", participants: ["s1","s4"], title: "James Whitfield", lastMessage: "The Tanaka interview is confirmed",   lastAt: "09 Jan 11:05", unread: 0, type: "direct" },
  { id: "th3", participants: ["s1","s3"], title: "Priya Nair",      lastMessage: "Documents uploaded for APP-7704",    lastAt: "08 Jan 17:30", unread: 1, type: "direct" },
  { id: "th4", participants: ["s1","s2","s3","s4","s5"], title: "Visa Ops Team", lastMessage: "SLA report shared",     lastAt: "09 Jan 09:00", unread: 5, type: "group"  },
];
export const MESSAGES: Record<string, ChatMessage[]> = {
  th1: [
    { id: "m1", threadId: "th1", from: "s2", text: "Hey Ayesha, who is handling APP-7703?",           at: "09 Jan 13:55", me: false },
    { id: "m2", threadId: "th1", from: "s1", text: "That's yours, Omar. Check your task list.",        at: "09 Jan 13:58", me: true  },
    { id: "m3", threadId: "th1", from: "s2", text: "Ah right. Embassy appointment needed by 12 Jan.",  at: "09 Jan 14:10", me: false },
    { id: "m4", threadId: "th1", from: "s2", text: "I'll handle the Rajesh case today",               at: "09 Jan 14:22", me: false },
  ],
  th4: [
    { id: "m5", threadId: "th4", from: "s4", text: "Morning all — 3 overdue cases today. Please prioritise.", at: "09 Jan 09:00", me: false },
    { id: "m6", threadId: "th4", from: "s5", text: "On it. Working APP-7701 first.",                         at: "09 Jan 09:05", me: false },
    { id: "m7", threadId: "th4", from: "s1", text: "Wei Zhang is urgent — VIP. I'm starting OCR now.",       at: "09 Jan 09:15", me: true  },
    { id: "m8", threadId: "th4", from: "s3", text: "SLA report shared in Files channel",                     at: "09 Jan 09:00", me: false },
  ],
};

// ── Documents ────────────────────────────────────────
export const STAFF_DOCS: StaffDoc[] = [
  { id: "sd1", name: "James Whitmore — Passport Scan",   category: "passport",   appRef: "APP-7701", applicant: "James Whitmore",    uploadedBy: "System (OCR)",  uploadedAt: "02 Jan 2025", size: "2.1 MB", status: "verified" },
  { id: "sd2", name: "Fatima Al-Rashidi — Bank Statement",category: "financial",  appRef: "APP-7702", applicant: "Fatima Al-Rashidi", uploadedBy: "Fatima Al-Rashidi", uploadedAt: "08 Jan 2025", size: "880 KB", status: "pending"  },
  { id: "sd3", name: "Fatima — Visa Application Form",   category: "visa_form",  appRef: "APP-7702", applicant: "Fatima Al-Rashidi", uploadedBy: "Fatima Al-Rashidi", uploadedAt: "05 Jan 2025", size: "340 KB", status: "verified" },
  { id: "sd4", name: "Rajesh Kumar — Passport",          category: "passport",   appRef: "APP-7703", applicant: "Rajesh Kumar",     uploadedBy: "System (OCR)",  uploadedAt: "28 Dec 2024", size: "1.8 MB", status: "verified" },
  { id: "sd5", name: "Rajesh — Company Letter",          category: "other",      appRef: "APP-7703", applicant: "Rajesh Kumar",     uploadedBy: "Rajesh Kumar",  uploadedAt: "31 Dec 2024", size: "220 KB", status: "verified" },
  { id: "sd6", name: "Wei Zhang — Passport (VIP)",       category: "passport",   appRef: "APP-7708", applicant: "Wei Zhang",        uploadedBy: "System (OCR)",  uploadedAt: "09 Jan 2025", size: "2.4 MB", status: "pending"  },
  { id: "sd7", name: "Wei Zhang — Business Card",        category: "other",      appRef: "APP-7708", applicant: "Wei Zhang",        uploadedBy: "Wei Zhang",     uploadedAt: "09 Jan 2025", size: "180 KB", status: "pending"  },
  { id: "sd8", name: "SLA Report — Week 1 Jan 2025",     category: "other",      uploadedBy: "James Whitfield",               uploadedAt: "06 Jan 2025", size: "420 KB", status: "verified" },
  { id: "sd9", name: "Kenji Tanaka — Embassy Receipt",   category: "other",      appRef: "APP-7706", applicant: "Kenji Tanaka",    uploadedBy: "James Whitfield",uploadedAt: "07 Jan 2025", size: "310 KB", status: "verified" },
];

// ── Helpers ───────────────────────────────────────────
export const SLA_CFG: Record<SLAStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
  ok:       { label: "On Track",  color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", icon: "check"     },
  due_soon: { label: "Due Soon",  color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   icon: "clock"     },
  overdue:  { label: "Overdue",   color: "text-red-700",     bg: "bg-red-50",      border: "border-red-300",     icon: "alert"     },
};
export const PRIORITY_CFG: Record<CasePriority, { label: string; color: string; dot: string }> = {
  urgent: { label: "Urgent", color: "text-red-600",    dot: "bg-red-500"    },
  high:   { label: "High",   color: "text-amber-600",  dot: "bg-amber-400"  },
  normal: { label: "Normal", color: "text-slate-500",  dot: "bg-slate-400"  },
  low:    { label: "Low",    color: "text-slate-400",  dot: "bg-slate-300"  },
};
export const TYPE_COLOR: Record<string, string> = {
  "interview":   "bg-purple-100 text-purple-700",
  "biometric":   "bg-blue-100 text-blue-700",
  "meeting":     "bg-slate-100 text-slate-600",
  "deadline":    "bg-red-100 text-red-700",
  "call":        "bg-teal-100 text-teal-700",
};
export const DOC_CAT: Record<DocCategory, string> = {
  passport: "Passport", visa_form: "Visa Form", financial: "Financial",
  medical: "Medical", photo: "Photo", other: "Other",
};
