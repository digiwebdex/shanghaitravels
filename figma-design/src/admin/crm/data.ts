export type LeadStage    = "new"|"contacted"|"qualified"|"proposal"|"negotiation"|"won"|"lost";
export type LeadPriority = "hot"|"warm"|"cold";
export type CommType     = "email"|"call"|"whatsapp"|"note"|"meeting";
export type QuoteStatus  = "draft"|"sent"|"accepted"|"rejected";

export interface Lead {
  id: string; name: string; email: string; phone: string; company?: string;
  nationality: string; source: string; stage: LeadStage; priority: LeadPriority;
  value: number; serviceInterest: string; destination?: string;
  assignedTo: string; assignedAvatar: string;
  createdAt: string; lastContact: string; daysInStage: number;
  tags: string[]; notes?: string;
}
export interface FollowUp  { id: string; leadId: string; type: CommType; title: string; dueDate: string; done: boolean; }
export interface Quotation { id: string; leadId: string; ref: string; service: string; amount: number; status: QuoteStatus; createdAt: string; validUntil: string; }
export interface Deal      { id: string; leadId: string; ref: string; service: string; amount: number; status: "active"|"won"|"lost"; closedAt?: string; }
export interface Campaign  { id: string; name: string; type: "email"|"whatsapp"|"sms"; status: "active"|"completed"|"draft"; sent: number; opened: number; converted: number; createdAt: string; }
export interface CommLog   { id: string; leadId: string; type: CommType; from: string; summary: string; at: string; direction: "in"|"out"; }
export interface Timeline  { id: string; leadId: string; type: "stage_change"|"note"|"task"|"comm"|"quotation"; text: string; by: string; at: string; }
export interface CRMNote   { id: string; leadId: string; text: string; by: string; at: string; pinned: boolean; }

// ── Pipeline stages ───────────────────────────────────────────────────────────
export const PIPELINE_STAGES: { key: LeadStage; label: string; color: string; bg: string; dot: string }[] = [
  { key: "new",         label: "New Lead",    color: "text-slate-600",   bg: "bg-slate-100",   dot: "#94A3B8" },
  { key: "contacted",   label: "Contacted",   color: "text-blue-700",    bg: "bg-blue-100",    dot: "#3B82F6" },
  { key: "qualified",   label: "Qualified",   color: "text-cyan-700",    bg: "bg-cyan-100",    dot: "#06B6D4" },
  { key: "proposal",    label: "Proposal",    color: "text-violet-700",  bg: "bg-violet-100",  dot: "#8B5CF6" },
  { key: "negotiation", label: "Negotiation", color: "text-amber-700",   bg: "bg-amber-100",   dot: "#F59E0B" },
  { key: "won",         label: "Won",         color: "text-emerald-700", bg: "bg-emerald-100", dot: "#10B981" },
  { key: "lost",        label: "Lost",        color: "text-red-700",     bg: "bg-red-100",     dot: "#EF4444" },
];

// ── Leads ─────────────────────────────────────────────────────────────────────
export const LEADS: Lead[] = [
  { id:"l1",  name:"Amira Hassan",         email:"amira.h@outlook.com",      phone:"+971 52 234 5678",  nationality:"Egypt",        source:"Website",        stage:"proposal",    priority:"hot",  value:4500,  serviceInterest:"Schengen Visa",       destination:"Germany",         assignedTo:"Ayesha Rahman",   assignedAvatar:"AR", createdAt:"02 Jan 2025", lastContact:"09 Jan 2025", daysInStage:3, tags:["urgent","corporate"],    notes:"Business visa for tech conference in Berlin. Hard deadline Jan 20." },
  { id:"l2",  name:"David Okafor",         email:"d.okafor@okafor.com",      phone:"+971 55 112 3344",  nationality:"Nigeria",       source:"Agent Referral", stage:"negotiation", priority:"hot",  value:8200,  serviceInterest:"UK Business Visa",    destination:"United Kingdom",  assignedTo:"Omar Hassan",     assignedAvatar:"OH", createdAt:"28 Dec 2024", lastContact:"08 Jan 2025", daysInStage:5, tags:["high-value","vip"],       notes:"CEO of Okafor Imports Ltd. Needs 2-year multiple entry." },
  { id:"l3",  name:"Priya Menon",          email:"priya.m@infosys.com",      phone:"+971 50 887 6655",  nationality:"India",         source:"Corporate",      stage:"qualified",   priority:"warm", value:12000, serviceInterest:"USA B1/B2 Visa",      destination:"United States",   assignedTo:"James Whitfield", assignedAvatar:"JW", createdAt:"05 Jan 2025", lastContact:"08 Jan 2025", daysInStage:2, tags:["corporate","bulk"],       notes:"Group booking for 4 Infosys employees. Conference starts Feb 10." },
  { id:"l4",  name:"Yusuf Al-Mansoori",   email:"yusuf.m@alm.ae",           phone:"+971 56 440 2211",  nationality:"UAE",           source:"Walk-in",        stage:"contacted",   priority:"warm", value:1800,  serviceInterest:"Tourist Visa",        destination:"France",          assignedTo:"Lina Al-Sayed",   assignedAvatar:"LA", createdAt:"07 Jan 2025", lastContact:"07 Jan 2025", daysInStage:2, tags:["tourist","family"]                   },
  { id:"l5",  name:"Sofia Nguyen",         email:"sofia.nguyen@vn.com",      phone:"+84 90 123 4567",   nationality:"Vietnam",       source:"Social Media",   stage:"new",         priority:"cold", value:950,   serviceInterest:"UAE Visit Visa",      destination:"UAE",             assignedTo:"Omar Hassan",     assignedAvatar:"OH", createdAt:"09 Jan 2025", lastContact:"09 Jan 2025", daysInStage:0, tags:["inbound"]                           },
  { id:"l6",  name:"Tariq Bashir",         email:"tariq.b@pak.net",          phone:"+92 300 123 4567",  nationality:"Pakistan",      source:"WhatsApp",       stage:"proposal",    priority:"warm", value:3200,  serviceInterest:"Canada Visitor Visa", destination:"Canada",          assignedTo:"Ayesha Rahman",   assignedAvatar:"AR", createdAt:"03 Jan 2025", lastContact:"08 Jan 2025", daysInStage:6, tags:["family","seasonal"]                  },
  { id:"l7",  name:"Elena Vasquez",        email:"e.vasquez@corp.es",        phone:"+34 91 123 4567",   nationality:"Spain",         source:"Email Campaign", stage:"won",         priority:"hot",  value:15500, serviceInterest:"Golden Visa",         destination:"UAE",             assignedTo:"James Whitfield", assignedAvatar:"JW", createdAt:"15 Dec 2024", lastContact:"06 Jan 2025", daysInStage:0, tags:["won","vip","immigration"],notes:"Investor category. Golden Visa granted." },
  { id:"l8",  name:"Mustafa Al-Zaabi",    email:"mustafa.z@petro.ae",       phone:"+971 55 991 2233",  nationality:"UAE",           source:"Corporate",      stage:"negotiation", priority:"hot",  value:6800,  serviceInterest:"Schengen Multi-entry",destination:"Europe",          assignedTo:"Lina Al-Sayed",   assignedAvatar:"LA", createdAt:"30 Dec 2024", lastContact:"07 Jan 2025", daysInStage:7, tags:["corporate","oil-sector"]             },
  { id:"l9",  name:"Grace Osei",           email:"grace.osei@gcb.gh",        phone:"+233 20 123 4567",  nationality:"Ghana",         source:"Website",        stage:"contacted",   priority:"cold", value:2100,  serviceInterest:"UK Student Visa",     destination:"United Kingdom",  assignedTo:"Omar Hassan",     assignedAvatar:"OH", createdAt:"06 Jan 2025", lastContact:"08 Jan 2025", daysInStage:3, tags:["student","education"]                },
  { id:"l10", name:"Ravi Chandrasekhar",  email:"r.chan@wipro.com",          phone:"+971 58 335 6677",  nationality:"India",         source:"Agent Referral", stage:"lost",        priority:"cold", value:4200,  serviceInterest:"Australia Visitor",   destination:"Australia",       assignedTo:"Ayesha Rahman",   assignedAvatar:"AR", createdAt:"20 Dec 2024", lastContact:"03 Jan 2025", daysInStage:0, tags:["lost","competitor"],     notes:"Lost to competitor on price. Re-engage in 3 months." },
];

export const FOLLOW_UPS: FollowUp[] = [
  { id:"f1", leadId:"l1", type:"call",     title:"Follow up on Germany visa documents",       dueDate:"10 Jan 2025", done:false },
  { id:"f2", leadId:"l1", type:"email",    title:"Send Schengen appointment slot options",    dueDate:"11 Jan 2025", done:false },
  { id:"f3", leadId:"l2", type:"meeting",  title:"UK visa eligibility call with CEO",         dueDate:"10 Jan 2025", done:false },
  { id:"f4", leadId:"l2", type:"call",     title:"Confirm passport copies received",          dueDate:"09 Jan 2025", done:true  },
  { id:"f5", leadId:"l3", type:"email",    title:"Send group visa checklist to Infosys HR",  dueDate:"11 Jan 2025", done:false },
  { id:"f6", leadId:"l6", type:"call",     title:"Canada visa application timeline update",  dueDate:"12 Jan 2025", done:false },
  { id:"f7", leadId:"l8", type:"whatsapp", title:"Schengen appointment confirmation",         dueDate:"09 Jan 2025", done:true  },
  { id:"f8", leadId:"l5", type:"email",    title:"Send UAE visit visa requirements",          dueDate:"13 Jan 2025", done:false },
];

export const QUOTATIONS: Quotation[] = [
  { id:"q1", leadId:"l1", ref:"QT-2025-001", service:"Schengen Visa (Germany)", amount:4500,  status:"sent",     createdAt:"06 Jan 2025", validUntil:"20 Jan 2025" },
  { id:"q2", leadId:"l2", ref:"QT-2025-002", service:"UK Business Visa 2-Year", amount:8200,  status:"accepted", createdAt:"04 Jan 2025", validUntil:"18 Jan 2025" },
  { id:"q3", leadId:"l3", ref:"QT-2025-003", service:"USA B1/B2 Group (4 pax)", amount:12000, status:"draft",    createdAt:"08 Jan 2025", validUntil:"22 Jan 2025" },
  { id:"q4", leadId:"l6", ref:"QT-2025-004", service:"Canada Visitor Visa",     amount:3200,  status:"sent",     createdAt:"05 Jan 2025", validUntil:"19 Jan 2025" },
  { id:"q5", leadId:"l7", ref:"QT-2025-005", service:"UAE Golden Visa Investor",amount:15500, status:"accepted", createdAt:"28 Dec 2024", validUntil:"11 Jan 2025" },
  { id:"q6", leadId:"l8", ref:"QT-2025-006", service:"Schengen Multi-Entry",    amount:6800,  status:"sent",     createdAt:"07 Jan 2025", validUntil:"21 Jan 2025" },
];

export const DEALS: Deal[] = [
  { id:"d1", leadId:"l7", ref:"DL-2024-019", service:"UAE Golden Visa Investor",   amount:15500, status:"won",    closedAt:"06 Jan 2025" },
  { id:"d2", leadId:"l2", ref:"DL-2025-001", service:"UK Business Visa 2-Year",    amount:8200,  status:"active"                         },
];

export const CAMPAIGNS: Campaign[] = [
  { id:"c1", name:"Schengen Season 2025",   type:"email",    status:"active",    sent:2840, opened:1120, converted:48, createdAt:"01 Jan 2025" },
  { id:"c2", name:"UK Visa Offer — Q1",     type:"whatsapp", status:"active",    sent:892,  opened:654,  converted:22, createdAt:"03 Jan 2025" },
  { id:"c3", name:"Golden Visa Investors",  type:"email",    status:"completed", sent:340,  opened:198,  converted:12, createdAt:"15 Dec 2024" },
  { id:"c4", name:"Canada Promo SMS",       type:"sms",      status:"draft",     sent:0,    opened:0,    converted:0,  createdAt:"08 Jan 2025" },
];

export const COMM_LOG: CommLog[] = [
  { id:"m1", leadId:"l1", type:"call",     from:"Ayesha Rahman",    summary:"Discussed Germany visa requirements. Client ready to proceed.", at:"09 Jan 2025 11:30", direction:"out" },
  { id:"m2", leadId:"l1", type:"email",    from:"amira.h@outlook",  summary:"Client sent passport scan + supporting documents via email.",    at:"08 Jan 2025 16:00", direction:"in"  },
  { id:"m3", leadId:"l1", type:"whatsapp", from:"Ayesha Rahman",    summary:"Sent quotation QT-2025-001 via WhatsApp.",                     at:"06 Jan 2025 14:00", direction:"out" },
  { id:"m4", leadId:"l2", type:"call",     from:"Omar Hassan",      summary:"CEO confirmed 2-year multiple entry needed. Budget approved.",   at:"08 Jan 2025 10:00", direction:"out" },
  { id:"m5", leadId:"l2", type:"email",    from:"d.okafor@okafor",  summary:"Signed quotation QT-2025-002 returned. Awaiting payment.",      at:"05 Jan 2025 09:00", direction:"in"  },
  { id:"m6", leadId:"l3", type:"meeting",  from:"James Whitfield",  summary:"Video call with Infosys HR. Confirmed 4 employees, Indian passports.", at:"08 Jan 2025 15:00", direction:"out" },
  { id:"m7", leadId:"l6", type:"call",     from:"Ayesha Rahman",    summary:"Canada application timeline: 6-8 weeks. Client agreed.",        at:"08 Jan 2025 14:00", direction:"out" },
  { id:"m8", leadId:"l8", type:"whatsapp", from:"Lina Al-Sayed",    summary:"Sent Schengen multi-entry requirements checklist.",             at:"07 Jan 2025 10:00", direction:"out" },
];

export const TIMELINE_EVENTS: Timeline[] = [
  { id:"te1", leadId:"l1", type:"stage_change", text:"Stage: Qualified → Proposal",                   by:"Ayesha Rahman",   at:"06 Jan 2025 09:00" },
  { id:"te2", leadId:"l1", type:"comm",         text:"Call logged: Germany visa requirements",         by:"Ayesha Rahman",   at:"09 Jan 2025 11:30" },
  { id:"te3", leadId:"l1", type:"quotation",    text:"Quotation QT-2025-001 sent (AED 4,500)",         by:"Ayesha Rahman",   at:"06 Jan 2025 14:00" },
  { id:"te4", leadId:"l2", type:"stage_change", text:"Stage: Proposal → Negotiation",                  by:"Omar Hassan",     at:"07 Jan 2025 09:30" },
  { id:"te5", leadId:"l2", type:"comm",         text:"CEO call — confirmed budget approval",           by:"Omar Hassan",     at:"08 Jan 2025 10:00" },
  { id:"te6", leadId:"l2", type:"task",         text:"Follow-up call completed — passport confirmed",  by:"Omar Hassan",     at:"09 Jan 2025 11:00" },
  { id:"te7", leadId:"l7", type:"stage_change", text:"Stage: Negotiation → Won",                      by:"James Whitfield", at:"06 Jan 2025 16:00" },
  { id:"te8", leadId:"l7", type:"note",         text:"Golden Visa investor category confirmed",        by:"James Whitfield", at:"03 Jan 2025 11:00" },
];

export const CRM_NOTES: CRMNote[] = [
  { id:"cn1", leadId:"l1", text:"Urgent — travel Jan 20. Schengen appointment must be before Jan 14. Amira has all docs ready.", by:"Ayesha Rahman", at:"09 Jan 2025", pinned:true  },
  { id:"cn2", leadId:"l2", text:"VIP client. CEO of Okafor Imports Ltd. Handle with absolute priority. Director has been briefed.", by:"Omar Hassan",   at:"28 Dec 2024", pinned:true  },
  { id:"cn3", leadId:"l3", text:"Group of 4 — all Infosys Bangalore engineers. Need US consulate appointment. Conference Feb 10.", by:"James Whitfield",at:"05 Jan 2025", pinned:false },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
