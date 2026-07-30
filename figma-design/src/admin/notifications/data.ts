export type ChannelType    = "email" | "sms" | "whatsapp" | "push";
export type TmplStatus     = "active" | "draft" | "inactive";
export type ReminderBasis  = "before" | "after";
export type AlertEvent     = "status_change" | "payment_received" | "payment_overdue" | "document_uploaded" | "visa_approved" | "visa_rejected" | "booking_confirmed" | "sla_breach";
export type NotifLogStatus = "sent" | "failed" | "pending" | "bounced";

export interface NotifTemplate {
  id: string; name: string; channel: ChannelType; subject?: string;
  body: string; variables: string[]; status: TmplStatus;
  language: string; lastEdited: string; sentCount: number;
  category: string;
}

export interface ReminderRule {
  id: string; name: string; event: string; offsetDays: number;
  basis: ReminderBasis; channel: ChannelType; templateId: string;
  templateName: string; active: boolean; targetRole: string; lastRan?: string;
}

export interface AlertRule {
  id: string; name: string; triggerEvent: AlertEvent; conditions?: string;
  channels: ChannelType[]; templateIds: Record<ChannelType, string>;
  notifyRoles: string[]; active: boolean; triggeredCount: number; lastTriggered?: string;
}

export interface ScheduledNotif {
  id: string; name: string; channel: ChannelType; templateId: string;
  templateName: string; scheduledAt: string; recipients: string;
  status: "pending" | "sent" | "cancelled"; recipientCount: number;
  sentCount?: number;
}

export interface NotifLog {
  id: string; timestamp: string; channel: ChannelType; recipient: string;
  recipientName?: string; subject?: string; templateName: string;
  triggerEvent: string; status: NotifLogStatus; errorMsg?: string;
  caseRef?: string;
}

// ── Email Templates ───────────────────────────────────────────────────────────
export const EMAIL_TEMPLATES: NotifTemplate[] = [
  { id:"et1", name:"Visa Application Confirmation", channel:"email", subject:"Your Visa Application Has Been Received — {{ref}}", body:`<p>Dear {{customerName}},</p>
<p>Thank you for submitting your visa application. We have received your application for a <strong>{{visaType}}</strong> visa to <strong>{{destination}}</strong>.</p>
<p><strong>Reference:</strong> {{ref}}<br>
<strong>Submitted:</strong> {{submittedDate}}<br>
<strong>Estimated Processing:</strong> {{processingDays}} working days</p>
<p>You will receive updates by email and SMS at each stage of the process.</p>
<p>Best regards,<br>TravelPro Visa Team</p>`, variables:["customerName","ref","visaType","destination","submittedDate","processingDays"], status:"active", language:"en", lastEdited:"10 Jan 2025", sentCount:1842, category:"Visa" },

  { id:"et2", name:"Payment Receipt",               channel:"email", subject:"Payment Received — {{amount}} for {{ref}}", body:`<p>Dear {{customerName}},</p>
<p>We have received your payment of <strong>{{amount}}</strong> for your booking/application reference <strong>{{ref}}</strong>.</p>
<p><strong>Transaction ID:</strong> {{transactionId}}<br>
<strong>Date:</strong> {{paymentDate}}<br>
<strong>Method:</strong> {{paymentMethod}}</p>
<p>Your receipt is attached to this email.</p>
<p>Thank you for choosing TravelPro.</p>`, variables:["customerName","amount","ref","transactionId","paymentDate","paymentMethod"], status:"active", language:"en", lastEdited:"08 Jan 2025", sentCount:3211, category:"Finance" },

  { id:"et3", name:"Visa Approved",                 channel:"email", subject:"Great News — Your Visa Has Been Approved! 🎉", body:`<p>Dear {{customerName}},</p>
<p>Congratulations! Your <strong>{{visaType}}</strong> visa to <strong>{{destination}}</strong> has been <strong>approved</strong>.</p>
<p><strong>Validity:</strong> {{validFrom}} to {{validTo}}<br>
<strong>Entries:</strong> {{entries}}</p>
<p>Please visit our office or collect your passport from:</p>
<p><em>{{officeAddress}}</em></p>
<p>Safe travels!</p>`, variables:["customerName","visaType","destination","validFrom","validTo","entries","officeAddress"], status:"active", language:"en", lastEdited:"10 Jan 2025", sentCount:1204, category:"Visa" },

  { id:"et4", name:"Visa Rejected",                 channel:"email", subject:"Visa Application Update — Ref {{ref}}", body:`<p>Dear {{customerName}},</p>
<p>We regret to inform you that your visa application (Ref: {{ref}}) has been <strong>rejected</strong> by the embassy.</p>
<p><strong>Reason:</strong> {{rejectionReason}}</p>
<p>Our team will contact you within 24 hours to discuss your options including reapplication or refund.</p>
<p>We apologise for any inconvenience caused.</p>`, variables:["customerName","ref","rejectionReason"], status:"active", language:"en", lastEdited:"10 Jan 2025", sentCount:89, category:"Visa" },

  { id:"et5", name:"Document Reminder",             channel:"email", subject:"Action Required — Documents Needed for {{ref}}", body:`<p>Dear {{customerName}},</p>
<p>We need additional documents to process your application <strong>{{ref}}</strong>.</p>
<p><strong>Missing Documents:</strong></p>
<ul>{{#each missingDocs}}<li>{{this}}</li>{{/each}}</ul>
<p>Please upload these documents via your portal or bring them to our office by <strong>{{deadline}}</strong>.</p>`, variables:["customerName","ref","missingDocs","deadline"], status:"active", language:"en", lastEdited:"09 Jan 2025", sentCount:621, category:"Documents" },

  { id:"et6", name:"Corporate Monthly Invoice",     channel:"email", subject:"Monthly Invoice — {{period}} — {{companyName}}", body:`<p>Dear {{contactName}},</p>
<p>Please find attached your monthly invoice for <strong>{{period}}</strong>.</p>
<p><strong>Total Amount:</strong> AED {{amount}}<br>
<strong>Due Date:</strong> {{dueDate}}<br>
<strong>Payment Method:</strong> Bank Transfer to the account below</p>
<p>If you have any queries please contact your account manager {{accountManager}} at {{accountManagerEmail}}.</p>`, variables:["contactName","companyName","period","amount","dueDate","accountManager","accountManagerEmail"], status:"draft", language:"en", lastEdited:"12 Jan 2025", sentCount:0, category:"Corporate" },
];

// ── SMS Templates ─────────────────────────────────────────────────────────────
export const SMS_TEMPLATES: NotifTemplate[] = [
  { id:"st1", name:"Application Received SMS",  channel:"sms", body:"TravelPro: Your visa application {{ref}} received. Processing: {{days}} working days. Track via portal. Call +97141234567 for queries.", variables:["ref","days"], status:"active", language:"en", lastEdited:"10 Jan 2025", sentCount:1842, category:"Visa" },
  { id:"st2", name:"Payment Confirmation SMS",   channel:"sms", body:"TravelPro: Payment AED {{amount}} confirmed for ref {{ref}}. Txn: {{txnId}}. Thank you.", variables:["amount","ref","txnId"], status:"active", language:"en", lastEdited:"08 Jan 2025", sentCount:3211, category:"Finance" },
  { id:"st3", name:"Visa Approved SMS",          channel:"sms", body:"TravelPro: Great news! Your {{visaType}} visa to {{destination}} is APPROVED. Valid: {{validFrom}}–{{validTo}}. Collect passport from our office.", variables:["visaType","destination","validFrom","validTo"], status:"active", language:"en", lastEdited:"10 Jan 2025", sentCount:1204, category:"Visa" },
  { id:"st4", name:"OTP Verification",           channel:"sms", body:"TravelPro: Your one-time password is {{otp}}. Valid for 5 minutes. Do not share this code.", variables:["otp"], status:"active", language:"en", lastEdited:"01 Jan 2025", sentCount:8841, category:"Security" },
  { id:"st5", name:"Document Reminder SMS",      channel:"sms", body:"TravelPro: Action needed for {{ref}}. Missing documents required by {{deadline}}. Upload via portal or call +97141234567.", variables:["ref","deadline"], status:"active", language:"en", lastEdited:"09 Jan 2025", sentCount:621, category:"Documents" },
  { id:"st6", name:"Arabic Payment Confirm",     channel:"sms", body:"TravelPro: تم استلام دفعتك بمبلغ {{amount}} درهم للمرجع {{ref}}. شكراً لك.", variables:["amount","ref"], status:"draft", language:"ar", lastEdited:"11 Jan 2025", sentCount:0, category:"Finance" },
];

// ── WhatsApp Templates ────────────────────────────────────────────────────────
export const WHATSAPP_TEMPLATES: NotifTemplate[] = [
  { id:"wt1", name:"Application Status Update", channel:"whatsapp", body:"Hello *{{customerName}}* 👋\n\nYour visa application *({{ref}})* status has been updated:\n\n📋 *Status:* {{status}}\n📅 *Updated:* {{date}}\n\nFor queries, reply to this message or call +971 4 123 4567.\n\n_TravelPro Team_", variables:["customerName","ref","status","date"], status:"active", language:"en", lastEdited:"10 Jan 2025", sentCount:2841, category:"Visa" },
  { id:"wt2", name:"Payment Reminder",          channel:"whatsapp", body:"Hello *{{customerName}}*,\n\nThis is a friendly reminder that your payment of *AED {{amount}}* for ref *{{ref}}* is due on *{{dueDate}}*.\n\n💳 Pay securely via: {{paymentLink}}\n\nNeed help? Reply here anytime.\n\n_TravelPro Finance Team_", variables:["customerName","amount","ref","dueDate","paymentLink"], status:"active", language:"en", lastEdited:"09 Jan 2025", sentCount:1122, category:"Finance" },
  { id:"wt3", name:"Document Collection Notice",channel:"whatsapp", body:"Dear *{{customerName}}*,\n\n✅ Your passport/documents are ready for collection!\n\n📍 *Location:* {{officeAddress}}\n🕐 *Hours:* 8am–10pm daily\n🆔 Please bring your Emirates ID.\n\nRef: {{ref}}\n\n_TravelPro Visa Team_", variables:["customerName","officeAddress","ref"], status:"active", language:"en", lastEdited:"10 Jan 2025", sentCount:892, category:"Visa" },
  { id:"wt4", name:"Hajj Package Confirmation", channel:"whatsapp", body:"🕌 *Hajj Package Confirmed!*\n\nDear *{{customerName}}*,\n\nYour Hajj 2025 package has been confirmed.\n\n📅 *Departure:* {{departureDate}}\n✈ *Flight:* {{flightDetails}}\n🏨 *Hotel:* {{hotelName}}\n\nPlease bring all documents to our office by {{docDeadline}}.\n\nMay Allah accept your worship. _Ameen._\n\n_TravelPro Hajj Team_", variables:["customerName","departureDate","flightDetails","hotelName","docDeadline"], status:"active", language:"en", lastEdited:"07 Jan 2025", sentCount:441, category:"Hajj" },
];

// ── Auto Reminder Rules ───────────────────────────────────────────────────────
export const REMINDER_RULES: ReminderRule[] = [
  { id:"rr1", name:"Visa Expiry Reminder — 30 Days",        event:"visa_expiry_date",    offsetDays:30, basis:"before", channel:"email",    templateId:"et5", templateName:"Document Reminder",     active:true, targetRole:"Customer",      lastRan:"13 Jan 2025" },
  { id:"rr2", name:"Visa Expiry Reminder — 7 Days",         event:"visa_expiry_date",    offsetDays:7,  basis:"before", channel:"whatsapp", templateId:"wt1", templateName:"Application Status Update", active:true, targetRole:"Customer",   lastRan:"13 Jan 2025" },
  { id:"rr3", name:"Visa Expiry Reminder — 3 Days SMS",     event:"visa_expiry_date",    offsetDays:3,  basis:"before", channel:"sms",      templateId:"st5", templateName:"Document Reminder SMS", active:true,  targetRole:"Customer",     lastRan:"12 Jan 2025" },
  { id:"rr4", name:"Payment Due Reminder — 3 Days",         event:"invoice_due_date",    offsetDays:3,  basis:"before", channel:"whatsapp", templateId:"wt2", templateName:"Payment Reminder",      active:true,  targetRole:"Customer",     lastRan:"12 Jan 2025" },
  { id:"rr5", name:"Payment Due Reminder — 1 Day",          event:"invoice_due_date",    offsetDays:1,  basis:"before", channel:"sms",      templateId:"st2", templateName:"Payment Confirmation SMS",active:true, targetRole:"Customer",     lastRan:"13 Jan 2025" },
  { id:"rr6", name:"Overdue Invoice Follow-Up",             event:"invoice_due_date",    offsetDays:3,  basis:"after",  channel:"email",    templateId:"et2", templateName:"Payment Receipt",       active:true,  targetRole:"Customer",     lastRan:"11 Jan 2025" },
  { id:"rr7", name:"Emirates ID Expiry — 60 Days",          event:"emirates_id_expiry",  offsetDays:60, basis:"before", channel:"email",    templateId:"et5", templateName:"Document Reminder",     active:true,  targetRole:"Employee",     lastRan:"10 Jan 2025" },
  { id:"rr8", name:"Contract Renewal — 30 Days",            event:"contract_expiry_date",offsetDays:30, basis:"before", channel:"email",    templateId:"et5", templateName:"Document Reminder",     active:false, targetRole:"Staff/Manager" },
];

// ── Alert Rules ───────────────────────────────────────────────────────────────
export const ALERT_RULES: AlertRule[] = [
  { id:"ar1", name:"Visa Approved Alert",        triggerEvent:"visa_approved",       channels:["email","sms","whatsapp"], templateIds:{email:"et3",sms:"st3",whatsapp:"wt1",push:""}, notifyRoles:["Customer","Visa Officer"],    active:true,  triggeredCount:1204, lastTriggered:"13 Jan 2025" },
  { id:"ar2", name:"Visa Rejected Alert",        triggerEvent:"visa_rejected",       channels:["email","sms"],            templateIds:{email:"et4",sms:"st1",whatsapp:"",push:""},  notifyRoles:["Customer","Visa Manager"],    active:true,  triggeredCount:89,   lastTriggered:"12 Jan 2025" },
  { id:"ar3", name:"Payment Received Alert",     triggerEvent:"payment_received",    channels:["email","sms"],            templateIds:{email:"et2",sms:"st2",whatsapp:"",push:""},  notifyRoles:["Customer","Finance"],        active:true,  triggeredCount:3211, lastTriggered:"13 Jan 2025" },
  { id:"ar4", name:"SLA Breach Alert",           triggerEvent:"sla_breach",          channels:["email"],                  templateIds:{email:"et1",sms:"",whatsapp:"",push:""},     notifyRoles:["Operations Manager","Director"],active:true, triggeredCount:14,   lastTriggered:"12 Jan 2025" },
  { id:"ar5", name:"Document Uploaded Alert",    triggerEvent:"document_uploaded",   channels:["email"],                  templateIds:{email:"et5",sms:"",whatsapp:"",push:""},     notifyRoles:["Visa Officer"],              active:true,  triggeredCount:841,  lastTriggered:"13 Jan 2025" },
  { id:"ar6", name:"Payment Overdue Alert",      triggerEvent:"payment_overdue",     channels:["email","whatsapp"],       templateIds:{email:"et2",sms:"",whatsapp:"wt2",push:""},  notifyRoles:["Finance","Account Manager"], active:true, triggeredCount:28,   lastTriggered:"11 Jan 2025" },
];

// ── Scheduled Notifications ───────────────────────────────────────────────────
export const SCHEDULED_NOTIFS: ScheduledNotif[] = [
  { id:"sn1", name:"January Newsletter",           channel:"email",    templateId:"et1", templateName:"Visa Application Confirmation", scheduledAt:"20 Jan 2025 10:00", recipients:"All Customers (Newsletter)",  status:"pending",   recipientCount:8841  },
  { id:"sn2", name:"Eid Promotion Blast",          channel:"whatsapp", templateId:"wt4", templateName:"Hajj Package Confirmation",     scheduledAt:"18 Jan 2025 09:00", recipients:"Active Customers 2024",      status:"pending",   recipientCount:2204  },
  { id:"sn3", name:"Hajj Pre-Season Campaign",     channel:"email",    templateId:"et1", templateName:"Visa Application Confirmation", scheduledAt:"15 Jan 2025 08:00", recipients:"Hajj Inquiry Segment",       status:"sent",      recipientCount:1241, sentCount:1238 },
  { id:"sn4", name:"December Visa Reminders",      channel:"sms",      templateId:"st1", templateName:"Application Received SMS",      scheduledAt:"10 Jan 2025 09:00", recipients:"Visa Expiry — Dec/Jan",      status:"sent",      recipientCount:344,  sentCount:344  },
  { id:"sn5", name:"Corporate Jan Invoices",       channel:"email",    templateId:"et6", templateName:"Corporate Monthly Invoice",     scheduledAt:"01 Feb 2025 08:00", recipients:"All Corporate Accounts",     status:"pending",   recipientCount:24   },
];

// ── Notification Log ──────────────────────────────────────────────────────────
export const NOTIF_LOGS: NotifLog[] = [
  { id:"l1",  timestamp:"13 Jan 2025 16:44", channel:"email",    recipient:"customer@gmail.com",  recipientName:"Ahmed Al-Rashidi",  subject:"Your Visa Application Has Been Received — APP-7708", templateName:"Visa Application Confirmation", triggerEvent:"application_submitted", status:"sent",    caseRef:"APP-7708" },
  { id:"l2",  timestamp:"13 Jan 2025 16:44", channel:"sms",      recipient:"+971501234567",        recipientName:"Ahmed Al-Rashidi",                                                                  templateName:"Application Received SMS",      triggerEvent:"application_submitted", status:"sent",    caseRef:"APP-7708" },
  { id:"l3",  timestamp:"13 Jan 2025 16:22", channel:"whatsapp", recipient:"+971509876543",        recipientName:"Sara Al-Farsi",                                                                     templateName:"Application Status Update",     triggerEvent:"status_change",         status:"sent",    caseRef:"APP-7705" },
  { id:"l4",  timestamp:"13 Jan 2025 15:10", channel:"email",    recipient:"corp@emiratesgroup.ae",recipientName:"Emirates Group",  subject:"Payment Received — AED 400,500 for CI-2025-001",      templateName:"Payment Receipt",               triggerEvent:"payment_received",      status:"sent",    caseRef:"CI-2025-001" },
  { id:"l5",  timestamp:"13 Jan 2025 14:55", channel:"email",    recipient:"bad@badomain.xyz",    recipientName:"Unknown",          subject:"Great News — Your Visa Has Been Approved!",            templateName:"Visa Approved",                 triggerEvent:"visa_approved",         status:"bounced", errorMsg:"550 Mailbox not found" },
  { id:"l6",  timestamp:"13 Jan 2025 14:30", channel:"sms",      recipient:"+971551234567",        recipientName:"Omar Khalid",                                                                       templateName:"Payment Confirmation SMS",      triggerEvent:"payment_received",      status:"failed",  errorMsg:"Invalid number", caseRef:"APP-7702" },
  { id:"l7",  timestamp:"13 Jan 2025 12:00", channel:"whatsapp", recipient:"+971521234567",        recipientName:"Lina Mansoor",                                                                      templateName:"Document Collection Notice",    triggerEvent:"visa_approved",         status:"sent",    caseRef:"APP-7701" },
  { id:"l8",  timestamp:"13 Jan 2025 09:00", channel:"email",    recipient:"hr@company.ae",       recipientName:"HR Manager",       subject:"Action Required — Documents Needed",                   templateName:"Document Reminder",             triggerEvent:"auto_reminder",         status:"sent" },
];

export const CHANNEL_COLOR: Record<string, string> = {
  email:    "bg-blue-500/15 text-blue-400",
  sms:      "bg-green-500/15 text-green-400",
  whatsapp: "bg-emerald-500/15 text-emerald-400",
  push:     "bg-purple-500/15 text-purple-400",
};
export const LOG_STATUS_COLOR: Record<string, string> = {
  sent:    "bg-emerald-500/15 text-emerald-400",
  failed:  "bg-red-500/15 text-red-400",
  pending: "bg-amber-500/15 text-amber-400",
  bounced: "bg-orange-500/15 text-orange-400",
};
