export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done" | "blocked";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type WorkflowStepType = "approval" | "notification" | "condition" | "action";
export type EscalationType = "sla_breach" | "overdue" | "no_response" | "rejection_chain";

export interface Task {
  id: string; ref: string; title: string; description: string;
  status: TaskStatus; priority: TaskPriority;
  assigneeId: string; assigneeName: string; department: string;
  caseRef?: string; caseType?: string;
  dueDate: string; createdAt: string; updatedAt: string;
  tags: string[]; commentCount: number; attachments: number;
  estimatedHours: number; loggedHours: number;
}

export interface StaffWorkload {
  empId: string; name: string; department: string; designation: string;
  activeTasks: number; capacity: number; utilization: number;
  overdueCount: number; avgCompletionDays: number;
}

export interface SLAConfig {
  id: string; priority: TaskPriority; service: string;
  firstResponseHours: number; resolutionHours: number;
  escalationHours: number; breachActionEmail: boolean; breachActionSlack: boolean;
  active: boolean;
}

export interface WorkflowStep {
  id: string; order: number; name: string; type: WorkflowStepType;
  assigneeRole: string; assigneeName?: string;
  timeoutHours: number;
  onApprove: "next_step" | "complete";
  onReject: "terminate" | "previous_step" | "escalate";
  description?: string;
}

export interface WorkflowTemplate {
  id: string; name: string; service: string; description: string;
  steps: WorkflowStep[]; active: boolean; createdAt: string; usageCount: number;
}

export interface EscalationRule {
  id: string; name: string; triggerType: EscalationType;
  conditionHours: number; service: string; priority?: TaskPriority;
  notifyRoles: string[]; escalateTo: string;
  action: "reassign" | "notify" | "auto_approve" | "flag";
  active: boolean; lastTriggered?: string; triggerCount: number;
}

export interface Comment {
  id: string; caseRef: string; caseType: string;
  authorId: string; authorName: string; authorRole: string;
  text: string; timestamp: string; edited?: boolean;
  attachments?: { name: string; size: string; type: string }[];
  mentions?: string[];
  isInternal: boolean; pinned?: boolean;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const TASKS: Task[] = [
  { id:"t1",  ref:"TSK-2025-001", title:"Process Schengen visa batch — 8 applications",     description:"Review and submit 8 Schengen applications to VFS. All docs received.",             status:"in_progress", priority:"high",     assigneeId:"e4", assigneeName:"Omar Hassan",      department:"Visa",       caseRef:"APP-7701", caseType:"Visa",      dueDate:"15 Jan 2025", createdAt:"08 Jan 2025", updatedAt:"13 Jan 2025", tags:["visa","batch"],      commentCount:4, attachments:8,  estimatedHours:6,  loggedHours:3.5 },
  { id:"t2",  ref:"TSK-2025-002", title:"Issue travel insurance for Emirates Group",          description:"8 pax, Sri Lanka trip 10–18 Mar. Client confirmed premium payment.",               status:"todo",        priority:"medium",   assigneeId:"e1", assigneeName:"Ayesha Rahman",   department:"Operations", caseRef:"INS-2025-022",caseType:"Insurance", dueDate:"17 Jan 2025", createdAt:"09 Jan 2025", updatedAt:"09 Jan 2025", tags:["insurance"],        commentCount:1, attachments:0,  estimatedHours:2,  loggedHours:0   },
  { id:"t3",  ref:"TSK-2025-003", title:"Corporate billing run — January 2025",               description:"Generate and send monthly invoices for all corporate clients.",                     status:"todo",        priority:"high",     assigneeId:"e3", assigneeName:"Lina Al-Sayed",   department:"Finance",    dueDate:"02 Feb 2025", createdAt:"10 Jan 2025", updatedAt:"10 Jan 2025", tags:["billing","corporate"],  commentCount:0, attachments:0,  estimatedHours:4,  loggedHours:0   },
  { id:"t4",  ref:"TSK-2025-004", title:"Follow up on Emirates Group overdue invoice",        description:"CI-2025-003 — AED 400,500 overdue. Send formal reminder and escalate if needed.",  status:"in_progress", priority:"critical", assigneeId:"e2", assigneeName:"James Whitfield", department:"Sales",      caseRef:"CI-2025-003",caseType:"Invoice",   dueDate:"14 Jan 2025", createdAt:"07 Jan 2025", updatedAt:"13 Jan 2025", tags:["AR","urgent"],       commentCount:6, attachments:2,  estimatedHours:3,  loggedHours:2   },
  { id:"t5",  ref:"TSK-2025-005", title:"Renew Omar Hassan visa before expiry",               description:"EID expiring 12 Aug 2025 — initiate renewal process with PRO.",                     status:"backlog",      priority:"medium",   assigneeId:"e1", assigneeName:"Ayesha Rahman",   department:"Operations", caseRef:"EMP-004",    caseType:"HR",        dueDate:"01 Jun 2025", createdAt:"13 Jan 2025", updatedAt:"13 Jan 2025", tags:["visa","hr"],         commentCount:0, attachments:0,  estimatedHours:2,  loggedHours:0   },
  { id:"t6",  ref:"TSK-2025-006", title:"Upload Priya Sharma missing documents",              description:"Emirates ID and education certificate missing. Deadline: end of probation.",        status:"blocked",     priority:"high",     assigneeId:"e5", assigneeName:"Priya Sharma",    department:"Operations", caseRef:"EMP-005",    caseType:"HR",        dueDate:"15 Jan 2025", createdAt:"10 Jan 2025", updatedAt:"13 Jan 2025", tags:["hr","compliance"],   commentCount:3, attachments:0,  estimatedHours:1,  loggedHours:0.5 },
  { id:"t7",  ref:"TSK-2025-007", title:"Set up new accounting module — chart of accounts",   description:"Verify opening balances match trial balance. Post adjustments if needed.",          status:"done",        priority:"medium",   assigneeId:"e3", assigneeName:"Lina Al-Sayed",   department:"Finance",    dueDate:"10 Jan 2025", createdAt:"03 Jan 2025", updatedAt:"10 Jan 2025", tags:["finance","setup"],   commentCount:2, attachments:5,  estimatedHours:8,  loggedHours:7.5 },
  { id:"t8",  ref:"TSK-2025-008", title:"Respond to PetroAbu Energy flight request",         description:"12 pax, Abu Dhabi–London return, March 2025. Quote business class fares.",         status:"review",      priority:"high",     assigneeId:"e2", assigneeName:"James Whitfield", department:"Sales",      caseRef:"CRM-8812",   caseType:"CRM",       dueDate:"14 Jan 2025", createdAt:"12 Jan 2025", updatedAt:"13 Jan 2025", tags:["flights","corporate"],  commentCount:2, attachments:1,  estimatedHours:3,  loggedHours:2.5 },
  { id:"t9",  ref:"TSK-2025-009", title:"Khalid Al-Rashidi overtime — GDS training support",  description:"Support 3 new team members on Amadeus during Khalid's training period.",           status:"todo",        priority:"low",      assigneeId:"e6", assigneeName:"Khalid Al-Rashidi",department:"Ticketing",  dueDate:"20 Jan 2025", createdAt:"11 Jan 2025", updatedAt:"11 Jan 2025", tags:["training"],          commentCount:0, attachments:0,  estimatedHours:12, loggedHours:0   },
  { id:"t10", ref:"TSK-2025-010", title:"VAT return Q4 2024 — FTA filing",                   description:"Prepare and submit VAT return. Net payable AED 26,500. Deadline 28 Jan.",          status:"done",        priority:"critical", assigneeId:"e3", assigneeName:"Lina Al-Sayed",   department:"Finance",    dueDate:"28 Jan 2025", createdAt:"02 Jan 2025", updatedAt:"07 Jan 2025", tags:["tax","compliance"],  commentCount:3, attachments:4,  estimatedHours:5,  loggedHours:4.5 },
];

// ── Staff Workload ─────────────────────────────────────────────────────────────
export const STAFF_WORKLOAD: StaffWorkload[] = [
  { empId:"e1", name:"Ayesha Rahman",    department:"Operations", designation:"Operations Manager",    activeTasks:3,  capacity:10, utilization:62, overdueCount:0, avgCompletionDays:2.1 },
  { empId:"e2", name:"James Whitfield",  department:"Sales",      designation:"Senior Sales Executive", activeTasks:7,  capacity:10, utilization:88, overdueCount:1, avgCompletionDays:3.4 },
  { empId:"e3", name:"Lina Al-Sayed",   department:"Finance",    designation:"Finance Officer",         activeTasks:4,  capacity:8,  utilization:72, overdueCount:0, avgCompletionDays:2.8 },
  { empId:"e4", name:"Omar Hassan",     department:"Visa",       designation:"Visa Consultant",         activeTasks:6,  capacity:10, utilization:78, overdueCount:2, avgCompletionDays:4.1 },
  { empId:"e5", name:"Priya Sharma",    department:"Operations", designation:"Customer Relations",      activeTasks:2,  capacity:8,  utilization:35, overdueCount:1, avgCompletionDays:5.2 },
  { empId:"e6", name:"Khalid Al-Rashidi",department:"Ticketing", designation:"Ticketing Agent",         activeTasks:4,  capacity:10, utilization:55, overdueCount:0, avgCompletionDays:1.8 },
  { empId:"e8", name:"Rashid Al-Mansouri",department:"Technology",designation:"IT Support Engineer",   activeTasks:2,  capacity:8,  utilization:42, overdueCount:0, avgCompletionDays:3.0 },
];

// ── SLA Config ────────────────────────────────────────────────────────────────
export const SLA_CONFIG: SLAConfig[] = [
  { id:"sla1", priority:"critical", service:"All",       firstResponseHours:1,  resolutionHours:4,   escalationHours:2,  breachActionEmail:true,  breachActionSlack:true,  active:true },
  { id:"sla2", priority:"high",     service:"All",       firstResponseHours:2,  resolutionHours:8,   escalationHours:4,  breachActionEmail:true,  breachActionSlack:false, active:true },
  { id:"sla3", priority:"medium",   service:"All",       firstResponseHours:4,  resolutionHours:24,  escalationHours:12, breachActionEmail:true,  breachActionSlack:false, active:true },
  { id:"sla4", priority:"low",      service:"All",       firstResponseHours:8,  resolutionHours:48,  escalationHours:24, breachActionEmail:false, breachActionSlack:false, active:true },
  { id:"sla5", priority:"high",     service:"Visa",      firstResponseHours:1,  resolutionHours:6,   escalationHours:3,  breachActionEmail:true,  breachActionSlack:true,  active:true },
];

// ── Workflow Templates ────────────────────────────────────────────────────────
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id:"wf1", name:"Corporate Booking Approval", service:"Bookings", description:"Multi-level approval for corporate flight/hotel bookings above AED 10,000",
    active:true, createdAt:"01 Jan 2025", usageCount:48,
    steps:[
      { id:"s1", order:1, name:"Requestor Submission",    type:"action",       assigneeRole:"Requestor",          timeoutHours:0,  onApprove:"next_step", onReject:"terminate",     description:"Client or agent submits booking request" },
      { id:"s2", order:2, name:"Sales Officer Review",    type:"approval",     assigneeRole:"Sales Officer",      timeoutHours:4,  onApprove:"next_step", onReject:"terminate",     description:"Verify pricing and availability" },
      { id:"s3", order:3, name:"Operations Check",        type:"approval",     assigneeRole:"Operations Manager", timeoutHours:2,  onApprove:"next_step", onReject:"previous_step", description:"Confirm supplier availability and credit" },
      { id:"s4", order:4, name:"Finance Approval",        type:"condition",    assigneeRole:"Finance Officer",    timeoutHours:4,  onApprove:"next_step", onReject:"terminate",     description:"Credit check if corporate account" },
      { id:"s5", order:5, name:"Confirmation & Booking",  type:"action",       assigneeRole:"Ticketing Agent",    timeoutHours:2,  onApprove:"complete",  onReject:"terminate",     description:"Issue tickets and send confirmation" },
    ],
  },
  {
    id:"wf2", name:"Visa Application Workflow", service:"Visa", description:"Standard visa application processing — from intake to delivery",
    active:true, createdAt:"01 Jan 2025", usageCount:124,
    steps:[
      { id:"s1", order:1, name:"Application Intake",      type:"action",       assigneeRole:"Visa Consultant",    timeoutHours:4,  onApprove:"next_step", onReject:"terminate",     description:"Collect and verify all documents" },
      { id:"s2", order:2, name:"Document Review",         type:"approval",     assigneeRole:"Senior Visa Officer",timeoutHours:8,  onApprove:"next_step", onReject:"previous_step", description:"Quality check all submitted docs" },
      { id:"s3", order:3, name:"Payment Confirmation",    type:"condition",    assigneeRole:"Finance Officer",    timeoutHours:2,  onApprove:"next_step", onReject:"terminate",     description:"Verify visa fee payment received" },
      { id:"s4", order:4, name:"Embassy Submission",      type:"action",       assigneeRole:"Visa Consultant",    timeoutHours:24, onApprove:"next_step", onReject:"escalate",      description:"Submit to embassy / VFS" },
      { id:"s5", order:5, name:"Status Monitoring",       type:"notification", assigneeRole:"System",             timeoutHours:72, onApprove:"next_step", onReject:"escalate",      description:"Auto-check embassy portal" },
      { id:"s6", order:6, name:"Visa Delivery",           type:"action",       assigneeRole:"Visa Consultant",    timeoutHours:4,  onApprove:"complete",  onReject:"terminate",     description:"Collect and deliver to applicant" },
    ],
  },
  {
    id:"wf3", name:"Expense Claim Approval", service:"HR", description:"Employee expense reimbursement — 2-level approval",
    active:true, createdAt:"05 Jan 2025", usageCount:32,
    steps:[
      { id:"s1", order:1, name:"Employee Submission",     type:"action",       assigneeRole:"Employee",           timeoutHours:0,  onApprove:"next_step", onReject:"terminate",     description:"Submit claim with receipts" },
      { id:"s2", order:2, name:"Line Manager Approval",   type:"approval",     assigneeRole:"Line Manager",       timeoutHours:24, onApprove:"next_step", onReject:"terminate",     description:"Review and approve or reject claim" },
      { id:"s3", order:3, name:"Finance Processing",      type:"approval",     assigneeRole:"Finance Officer",    timeoutHours:48, onApprove:"next_step", onReject:"terminate",     description:"Verify receipts and process payment" },
      { id:"s4", order:4, name:"Payment",                 type:"action",       assigneeRole:"Finance Officer",    timeoutHours:24, onApprove:"complete",  onReject:"terminate",     description:"Bank transfer to employee account" },
    ],
  },
];

// ── Escalation Rules ──────────────────────────────────────────────────────────
export const ESCALATION_RULES: EscalationRule[] = [
  { id:"er1", name:"Critical SLA Breach Alert",      triggerType:"sla_breach",     conditionHours:2,  service:"All",    priority:"critical", notifyRoles:["Operations Manager","Director"],      escalateTo:"Director",           action:"notify",      active:true, lastTriggered:"12 Jan 2025", triggerCount:3  },
  { id:"er2", name:"Overdue Visa Application",        triggerType:"overdue",        conditionHours:48, service:"Visa",                         notifyRoles:["Senior Visa Officer","Ops Manager"],  escalateTo:"Operations Manager", action:"reassign",    active:true, lastTriggered:"10 Jan 2025", triggerCount:12 },
  { id:"er3", name:"Unanswered Corporate Inquiry",    triggerType:"no_response",    conditionHours:4,  service:"CRM",    priority:"high",     notifyRoles:["Sales Manager","Operations Manager"], escalateTo:"Sales Manager",      action:"notify",      active:true, lastTriggered:"09 Jan 2025", triggerCount:7  },
  { id:"er4", name:"Invoice Overdue 30+ Days",        triggerType:"overdue",        conditionHours:720,service:"Finance",                      notifyRoles:["Finance Officer","Director"],          escalateTo:"Director",           action:"flag",        active:true, lastTriggered:"07 Jan 2025", triggerCount:2  },
];

// ── Comments (reusable across modules) ────────────────────────────────────────
export const DEMO_COMMENTS: Comment[] = [
  { id:"c1",  caseRef:"TSK-2025-004", caseType:"Task",    authorId:"e2", authorName:"James Whitfield", authorRole:"Sales Executive", text:"Called the CFO — he confirmed the invoice is on his desk. Promised payment by Wednesday.",                                                timestamp:"13 Jan 2025 14:22", isInternal:false, commentCount:undefined as any },
  { id:"c2",  caseRef:"TSK-2025-004", caseType:"Task",    authorId:"e1", authorName:"Ayesha Rahman",   authorRole:"Operations Manager",text:"James — please send a formal written notice as well. If not settled by Friday, we escalate to legal.",                               timestamp:"13 Jan 2025 15:05", isInternal:true,  pinned:true },
  { id:"c3",  caseRef:"TSK-2025-004", caseType:"Task",    authorId:"e3", authorName:"Lina Al-Sayed",   authorRole:"Finance Officer",   text:"I've placed the invoice on hold in the system. Credit limit will be frozen if not settled.",                                          timestamp:"13 Jan 2025 16:30", isInternal:true,  attachments:[{name:"Credit_Hold_Notice.pdf", size:"84 KB", type:"pdf"}] },
  { id:"c4",  caseRef:"APP-7701",     caseType:"Visa",    authorId:"e4", authorName:"Omar Hassan",     authorRole:"Visa Consultant",   text:"All 8 Schengen applications submitted to VFS this morning. Processing time is 10 working days.",                                       timestamp:"13 Jan 2025 10:15", isInternal:false, attachments:[{name:"VFS_Receipt_Batch.pdf", size:"122 KB", type:"pdf"}] },
  { id:"c5",  caseRef:"APP-7701",     caseType:"Visa",    authorId:"e1", authorName:"Ayesha Rahman",   authorRole:"Operations Manager",text:"Good. Please track daily and update the client tracker. Flag any issues immediately.",                                                  timestamp:"13 Jan 2025 10:45", isInternal:true  },
  { id:"c6",  caseRef:"TSK-2025-001", caseType:"Task",    authorId:"e4", authorName:"Omar Hassan",     authorRole:"Visa Consultant",   text:"Started reviewing documents for applicant 1–4. Two are missing bank statements. Will follow up with clients today.",                   timestamp:"12 Jan 2025 11:00", isInternal:false },
  { id:"c7",  caseRef:"TSK-2025-001", caseType:"Task",    authorId:"e1", authorName:"Ayesha Rahman",   authorRole:"Operations Manager",text:"@Omar Hassan — set the deadline clearly to clients: docs by 5pm today or we cannot guarantee the submission date.",                   timestamp:"12 Jan 2025 11:30", isInternal:true,  mentions:["e4"] },
  { id:"c8",  caseRef:"TSK-2025-006", caseType:"Task",    authorId:"e5", authorName:"Priya Sharma",    authorRole:"Customer Relations", text:"My Emirates ID application is in process at the typing centre. Should receive in 3–5 working days.",                                  timestamp:"13 Jan 2025 09:00", isInternal:false, attachments:[{name:"EID_Application_Receipt.jpg", size:"210 KB", type:"image"}] },
];

export const fmtHours = (h: number) => h === 1 ? "1h" : `${h}h`;
