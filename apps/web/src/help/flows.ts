/**
 * V17 — clickable workflow maps.
 *
 * These are DATA, rendered as real HTML by FlowChart.tsx — never an image — so
 * every node can link to its guide and to the live module.
 */
import type { Flow } from "./types";
import {
  HAJJ_STAGES, HOTEL_STAGES, MANPOWER_STAGES, STUDENT_STAGES,
  TICKET_STAGES, TOUR_STAGES, TRANSPORT_STAGES, VISA_STAGES,
} from "./articles.services";

/** Turns a real stage list into flow nodes for a service map. */
const stageNodes = (stages: string[], article: string, route: string) =>
  stages.map((label, i) => ({
    id: `s${i + 1}`,
    label: `${i + 1}. ${label}`,
    kind: (i === 0 ? "start" : i === stages.length - 1 ? "end" : "step") as "start" | "step" | "end",
    article,
    route: i === 0 ? route : undefined,
  }));

export const MASTER_FLOW: Flow = {
  slug: "master-journey",
  title: "ERP Master Workflow",
  bn: "সম্পূর্ণ কর্মপ্রবাহ",
  subtitle: "The complete business lifecycle — click any step to open its guide.",
  category: "getting-started",
  nodes: [
    { id: "lead", label: "Lead", bn: "লিড", kind: "start", article: "create-lead", route: "/crm", perm: "lead:read", note: "An enquiry arrives — walk-in, phone, web, WhatsApp, Facebook or referral." },
    { id: "qualify", label: "Lead Qualification", bn: "কোয়ালিফিকেশন", article: "qualify-lead", route: "/crm/opportunities", perm: "opportunity:read" },
    {
      id: "converted", label: "Lead converted?", kind: "decision", article: "convert-lead",
      branches: [
        { label: "No", outcome: "Close with a lost reason → follow up later", article: "qualify-lead" },
        { label: "Yes", outcome: "Continue to Customer", article: "convert-lead" },
      ],
    },
    { id: "customer", label: "Customer", bn: "কাস্টমার", article: "create-customer", route: "/customers", perm: "customer:read", note: "Individual, corporate or agent-owned." },
    {
      id: "ownership", label: "Agent ownership?", kind: "decision", article: "assign-agent-ownership",
      branches: [
        { label: "No", outcome: "House customer — owned by the agency", article: "assign-agent-ownership" },
        { label: "Yes", outcome: "Agent-owned — drives portal visibility and commission", article: "agent-commission" },
      ],
    },
    { id: "profile", label: "Customer 360", bn: "কাস্টমার ৩৬০", article: "customer-360", route: "/customers", perm: "customer:read" },
    { id: "docs", label: "Documents", bn: "ডকুমেন্ট", article: "upload-document", route: "/operations/documents", perm: "document:upload" },
    { id: "ocr", label: "OCR", article: "scan-passport", route: "/operations/document-intelligence", perm: "ocr:use" },
    { id: "verify", label: "OCR Verification", bn: "যাচাই", article: "verify-document", route: "/operations/document-intelligence", perm: "document:verify" },
    { id: "booking", label: "Booking", bn: "বুকিং", article: "create-booking", route: "/bookings/new", perm: "application:create" },
    { id: "b360", label: "Booking 360", article: "booking-360", route: "/operations", perm: "application:read" },
    { id: "svc", label: "Service Workflow (11 stages)", article: "workflow-templates", route: "/operations/workflow", perm: "application:read" },
    { id: "supplier", label: "Supplier / Vendor", bn: "সাপ্লায়ার", article: "supplier-cost", route: "/partners/suppliers", perm: "supplier:read" },
    { id: "cost", label: "Supplier Cost → Payable", article: "supplier-payment", route: "/finance/ap", perm: "ap:read" },
    { id: "price", label: "Customer Price", article: "finance-overview", route: "/finance/dashboard", perm: "financial-report:read" },
    { id: "quote", label: "Quotation (if required)", article: "create-quotation", route: "/sales/quotations", perm: "quote:read" },
    { id: "invoice", label: "Invoice", bn: "ইনভয়েস", article: "create-invoice", route: "/finance/invoices", perm: "invoice:amount:read" },
    {
      id: "payment", label: "Payment", bn: "পেমেন্ট", kind: "decision", article: "record-payment",
      branches: [
        { label: "Paid", outcome: "Invoice becomes paid", article: "record-payment" },
        { label: "Partial", outcome: "partially_paid — balance stays in receivables", article: "payment-overdue" },
        { label: "Due", outcome: "Receivable — chase before delivering more", article: "receivables" },
      ],
    },
    { id: "ops", label: "Operations", bn: "অপারেশন্স", article: "operations-queue", route: "/operations", perm: "application:read" },
    { id: "delivery", label: "Service Delivery", article: "advance-stage", route: "/operations", perm: "application:advance-stage" },
    { id: "complete", label: "Completion", article: "advance-stage" },
    { id: "finaldocs", label: "Final Documents", article: "upload-document", route: "/operations/documents", perm: "document:read" },
    { id: "comms", label: "Customer Communication", article: "notifications", route: "/comms", perm: "comms:read" },
    { id: "after", label: "After Sales → Repeat Customer", kind: "end", article: "customer-360", route: "/customers", perm: "customer:read" },
  ],
};

export const LEAD_FLOW: Flow = {
  slug: "lead-flow",
  title: "Lead workflow",
  bn: "লিড প্রবাহ",
  subtitle: "From first enquiry to a converted customer.",
  category: "leads",
  nodes: [
    { id: "new", label: "New Lead", kind: "start", article: "create-lead", route: "/crm", perm: "lead:manage" },
    { id: "source", label: "Capture source", article: "create-lead", note: "web · walkin · phone · whatsapp · facebook · referral" },
    { id: "info", label: "Lead information & contact", article: "create-lead", note: "Name is mandatory. Phone or email needed to follow up." },
    { id: "req", label: "Travel / service requirement", article: "create-lead" },
    { id: "assign", label: "Assigned executive", article: "create-lead", note: "Unassigned leads go cold." },
    { id: "follow", label: "Follow-up activities", article: "qualify-lead", route: "/crm/activities", perm: "crm:read", note: "call · meeting · email · whatsapp · task · follow_up" },
    {
      id: "qualified", label: "Qualified?", kind: "decision", article: "qualify-lead",
      branches: [
        { label: "No", outcome: "Record a lost reason and close", article: "qualify-lead" },
        { label: "Yes", outcome: "Convert to customer", article: "convert-lead" },
      ],
    },
    { id: "convert", label: "Convert", article: "convert-lead", perm: "crm:convert", note: "Accepts visa, air_ticket, hotel, tour, hajj, umrah only." },
    { id: "created", label: "Customer created", article: "create-customer", route: "/customers", perm: "customer:read" },
    { id: "book", label: "Continue to booking", kind: "end", article: "create-booking", route: "/bookings/new", perm: "application:create" },
  ],
};

export const CUSTOMER_FLOW: Flow = {
  slug: "customer-flow",
  title: "Customer creation",
  bn: "কাস্টমার তৈরি",
  subtitle: "Never create a duplicate — always search first.",
  category: "customers",
  nodes: [
    { id: "start", label: "Lead converted / walk-in", kind: "start", article: "convert-lead" },
    { id: "check", label: "Search existing customer", article: "create-customer", route: "/customers", perm: "customer:read", note: "Search by phone and passport number." },
    {
      id: "exists", label: "Already exists?", kind: "decision", article: "duplicate-customer",
      branches: [
        { label: "Yes", outcome: "Open the existing Customer 360", article: "customer-360", route: "/customers" },
        { label: "No", outcome: "Create the customer", article: "create-customer" },
      ],
    },
    { id: "type", label: "Individual / Corporate / Agent-owned", article: "assign-agent-ownership" },
    { id: "fields", label: "Name · Mobile · Email · Nationality · Address", article: "create-customer", note: "Full name (min 2) and phone (min 6) are mandatory." },
    { id: "owner", label: "Agent ownership", article: "assign-agent-ownership", route: "/partners/agents", perm: "agent:manage" },
    { id: "save", label: "Save → CUS- code generated", article: "create-customer" },
    { id: "c360", label: "Customer 360", kind: "end", article: "customer-360", route: "/customers", perm: "customer:read" },
  ],
};

export const OWNERSHIP_FLOW: Flow = {
  slug: "ownership-flow",
  title: "Agent ownership",
  bn: "এজেন্ট ওনারশিপ",
  subtitle: "Who owns the customer decides portal visibility and commission.",
  category: "agents",
  nodes: [
    { id: "cust", label: "Customer", kind: "start", article: "customer-360", route: "/customers", perm: "customer:read" },
    {
      id: "owned", label: "Is the customer agent-owned?", kind: "decision", article: "assign-agent-ownership",
      branches: [
        { label: "No", outcome: "House customer — belongs to the agency", article: "assign-agent-ownership" },
        { label: "Yes", outcome: "Select and verify the agent", article: "assign-agent-ownership" },
      ],
    },
    { id: "select", label: "Select agent", article: "assign-agent-ownership", route: "/partners/agents", perm: "commission:read" },
    { id: "verify", label: "Verify agent is approved & active", article: "assign-agent-ownership", perm: "agent:manage" },
    { id: "assign", label: "Assign primary ownership", article: "assign-agent-ownership", perm: "agent:manage" },
    { id: "co", label: "Add co-agent (secondary)", article: "assign-agent-ownership", perm: "agent:manage", note: "Optional — where two parties share the deal." },
    { id: "audit", label: "Ownership change recorded", article: "assign-agent-ownership", perm: "customer:read" },
    { id: "shows", label: "Customer 360 shows Agent-Owned", article: "customer-360", route: "/customers", perm: "customer:read" },
    { id: "money", label: "Commission & wallet relationship", kind: "end", article: "agent-commission", route: "/finance/commission-rules", perm: "commission:read" },
  ],
};

export const DOCUMENT_FLOW: Flow = {
  slug: "document-flow",
  title: "Document & OCR workflow",
  bn: "ডকুমেন্ট ও OCR",
  subtitle: "OCR assists — the person who applies the data is accountable for it.",
  category: "documents",
  nodes: [
    { id: "cust", label: "Customer", kind: "start", article: "customer-360", route: "/customers", perm: "customer:read" },
    { id: "type", label: "Select document type", article: "upload-document", note: "passport · national_id · visa · air_ticket · driving_license · birth_certificate · trade_license · bank_statement · photo · other · auto" },
    { id: "upload", label: "Upload / Scan", article: "upload-document", route: "/operations/document-intelligence", perm: "document:upload", note: "Maximum 20 MB." },
    { id: "ocr", label: "OCR extraction", article: "scan-passport", perm: "ocr:use" },
    { id: "fields", label: "Passport No · Name · DOB · Nationality · Issue · Expiry", article: "scan-passport" },
    { id: "review", label: "Review against the original", article: "scan-passport" },
    {
      id: "match", label: "Does it match?", kind: "decision", article: "ocr-mismatch",
      branches: [
        { label: "No", outcome: "Correct or re-scan before applying", article: "ocr-mismatch" },
        { label: "Yes", outcome: "Check for duplicates, then apply", article: "duplicate-passport" },
      ],
    },
    { id: "dup", label: "Duplicate check", article: "duplicate-passport", perm: "ocr:use", note: "Compares passport, NID and visa numbers." },
    { id: "apply", label: "Apply to customer", article: "scan-passport", perm: "ocr:apply" },
    { id: "verify", label: "Verify", article: "verify-document", perm: "document:verify" },
    { id: "stored", label: "Stored → Customer 360 updated", article: "customer-360", route: "/customers", perm: "customer:read" },
    { id: "cont", label: "Booking can continue", kind: "end", article: "create-booking", route: "/bookings/new", perm: "application:create" },
  ],
};

export const BOOKING_FLOW: Flow = {
  slug: "booking-flow",
  title: "Booking creation",
  bn: "বুকিং তৈরি",
  subtitle: "The 10-step unified wizard.",
  category: "bookings",
  nodes: [
    { id: "s1", label: "1 · Service", kind: "start", article: "create-booking", route: "/bookings/new", perm: "application:create", note: "Student and Manpower are not selectable here — use their own modules." },
    { id: "s2", label: "2 · Package", article: "create-booking" },
    { id: "s3", label: "3 · Customer", article: "create-customer", perm: "customer:create", note: "A new customer needs name and phone." },
    { id: "s4", label: "4 · Documents", article: "upload-document", perm: "document:upload" },
    { id: "s5", label: "5 · Traveller", article: "create-booking", note: "Name must match the passport exactly." },
    { id: "s6", label: "6 · Supplier & cost", article: "supplier-cost", perm: "supplier:read" },
    { id: "s7", label: "7 · Review", article: "create-booking" },
    { id: "s8", label: "8 · Invoice", article: "create-invoice", perm: "invoice:manage" },
    {
      id: "s9", label: "9 · Payment", kind: "decision", article: "record-payment",
      branches: [
        { label: "Full", outcome: "Invoice paid", article: "record-payment" },
        { label: "Partial", outcome: "Balance stays in receivables", article: "payment-overdue" },
        { label: "None", outcome: "Full amount is a receivable", article: "receivables" },
      ],
    },
    { id: "s10", label: "10 · Done → APP- reference", article: "booking-360" },
    { id: "b360", label: "Booking 360 → Operations Queue", kind: "end", article: "operations-queue", route: "/operations", perm: "application:read" },
  ],
};

export const SUPPLIER_FLOW: Flow = {
  slug: "supplier-flow",
  title: "Supplier workflow",
  bn: "সাপ্লায়ার প্রবাহ",
  subtitle: "Cost in, payable out.",
  category: "suppliers",
  nodes: [
    { id: "b", label: "Booking", kind: "start", article: "booking-360", route: "/operations", perm: "application:read" },
    {
      id: "need", label: "Supplier required?", kind: "decision", article: "supplier-cost",
      branches: [
        { label: "No", outcome: "Continue — agency delivers directly", article: "booking-360" },
        { label: "Yes", outcome: "Select the supplier", article: "supplier-cost" },
      ],
    },
    { id: "sel", label: "Select supplier", article: "supplier-cost", route: "/partners/suppliers", perm: "supplier:read" },
    { id: "cost", label: "Record supplier cost", article: "supplier-cost", perm: "vendorcost:read" },
    { id: "conf", label: "Supplier confirmation", article: "supplier-unavailable", note: "Do not advance the case before the supplier confirms." },
    { id: "ap", label: "AP / supplier due", article: "supplier-payment", route: "/finance/ap", perm: "ap:read" },
    { id: "pay", label: "Supplier payment", article: "supplier-payment", perm: "ap:manage" },
    { id: "settled", label: "Payable settled", kind: "end", article: "supplier-payment", route: "/finance/supplier-ledger", perm: "ap:read" },
  ],
};

export const FINANCE_FLOW: Flow = {
  slug: "finance-flow",
  title: "Finance workflow",
  bn: "ফিন্যান্স প্রবাহ",
  subtitle: "Customer side, supplier side, and what is left.",
  category: "finance",
  nodes: [
    { id: "b", label: "Booking", kind: "start", article: "booking-360", route: "/operations", perm: "application:read" },
    { id: "cost", label: "Supplier cost", article: "supplier-cost", perm: "vendorcost:read" },
    { id: "price", label: "Selling price", article: "finance-overview" },
    { id: "quote", label: "Quotation (optional)", article: "create-quotation", route: "/sales/quotations", perm: "quote:read" },
    { id: "approve", label: "Customer approval", article: "create-quotation" },
    { id: "inv", label: "Invoice", article: "create-invoice", route: "/finance/invoices", perm: "invoice:manage" },
    {
      id: "pay", label: "Payment", kind: "decision", article: "record-payment",
      branches: [
        { label: "Full", outcome: "paid", article: "record-payment" },
        { label: "Partial", outcome: "partially_paid", article: "payment-overdue" },
        { label: "Due", outcome: "receivable / overdue", article: "receivables" },
      ],
    },
    { id: "ar", label: "Receivable (AR)", article: "receivables", route: "/finance/ar", perm: "ar:read" },
    { id: "receipt", label: "Payment receipt", article: "record-payment", route: "/finance/payments", perm: "payment:amount:read" },
    { id: "ap", label: "Supplier payable (AP) → settlement", article: "supplier-payment", route: "/finance/ap", perm: "ap:read" },
    { id: "profit", label: "Revenue − Cost − Expense = Profit", article: "finance-overview", route: "/finance/dashboard", perm: "financial-report:read" },
    { id: "comm", label: "Commission → Agent wallet", article: "agent-commission", route: "/finance/commission-rules", perm: "commission:read" },
    { id: "gl", label: "Accounting (GL, period, fiscal year)", kind: "end", article: "finance-overview", route: "/finance/accounting", perm: "gl:read" },
  ],
};

export const OPERATIONS_FLOW: Flow = {
  slug: "operations-flow",
  title: "Operations workflow",
  bn: "অপারেশন্স প্রবাহ",
  subtitle: "Queue → assign → advance → notify → complete.",
  category: "operations",
  nodes: [
    { id: "created", label: "Booking created", kind: "start", article: "create-booking", route: "/bookings/new", perm: "application:create" },
    { id: "queue", label: "Operations queue", article: "operations-queue", route: "/operations", perm: "application:read" },
    { id: "assign", label: "Assigned staff", article: "operations-queue", perm: "application:assign" },
    { id: "stage", label: "Current stage", article: "workflow-templates", route: "/operations/workflow", perm: "application:read" },
    { id: "docs", label: "Required documents", article: "upload-document", perm: "document:upload" },
    { id: "process", label: "Service processing (workspace)", article: "booking-360", perm: "application:read" },
    { id: "adv", label: "Stage advance", article: "advance-stage", perm: "application:advance-stage" },
    { id: "notify", label: "Notification to customer", article: "notifications", route: "/comms", perm: "comms:read", note: "Email is live; WhatsApp and SMS are not configured." },
    { id: "next", label: "Next stage", article: "advance-stage" },
    { id: "done", label: "Completion", article: "advance-stage" },
    { id: "final", label: "Final documents", article: "upload-document", route: "/operations/documents", perm: "document:read" },
    { id: "after", label: "Customer communication → after sales", kind: "end", article: "notifications", route: "/comms", perm: "comms:read" },
  ],
};

export const NOTIFICATION_FLOW: Flow = {
  slug: "notification-flow",
  title: "Notification workflow",
  bn: "নোটিফিকেশন প্রবাহ",
  subtitle: "Email is LIVE. WhatsApp and SMS are NOT CONFIGURED.",
  category: "notifications",
  nodes: [
    { id: "event", label: "Business event", kind: "start", article: "notifications", note: "Stage advanced · invoice sent · payment received" },
    { id: "notif", label: "Notification event raised", article: "notifications" },
    { id: "outbox", label: "Notification outbox", article: "notifications", route: "/comms", perm: "comms:read" },
    { id: "sched", label: "Scheduler picks it up", article: "notifications" },
    {
      id: "channel", label: "Channel", kind: "decision", article: "notifications",
      branches: [
        { label: "Email", outcome: "LIVE — delivered to the customer", article: "notifications" },
        { label: "WhatsApp", outcome: "NOT CONFIGURED — nothing is sent", article: "failed-notification" },
        { label: "SMS", outcome: "NOT CONFIGURED — nothing is sent", article: "failed-notification" },
      ],
    },
    { id: "cust", label: "Customer / Agent receives it", kind: "end", article: "failed-notification", route: "/comms", perm: "comms:read" },
  ],
};

export const ADMIN_FLOW: Flow = {
  slug: "admin-flow",
  title: "Admin daily workflow",
  bn: "অ্যাডমিনের দিন",
  subtitle: "A fixed order so nothing waits a week to be noticed.",
  category: "getting-started",
  nodes: [
    { id: "login", label: "Login", kind: "start", article: "getting-started" },
    { id: "dash", label: "Dashboard", article: "admin-daily-flow", route: "/", perm: "application:read" },
    { id: "leads", label: "Leads", article: "create-lead", route: "/crm", perm: "lead:read" },
    { id: "cust", label: "Customers", article: "customer-360", route: "/customers", perm: "customer:read" },
    { id: "new", label: "New bookings", article: "create-booking", route: "/operations", perm: "application:read" },
    { id: "queue", label: "Operations queue", article: "operations-queue", route: "/operations", perm: "application:read" },
    { id: "docs", label: "Documents needing attention", article: "verify-document", route: "/operations/document-intelligence", perm: "ocr:use" },
    { id: "inv", label: "Pending invoices", article: "create-invoice", route: "/finance/invoices", perm: "invoice:amount:read" },
    { id: "ar", label: "Receivables", article: "receivables", route: "/finance/ar", perm: "ar:read" },
    { id: "ap", label: "Payables", article: "supplier-payment", route: "/finance/ap", perm: "ap:read" },
    { id: "comms", label: "Communications", article: "notifications", route: "/comms", perm: "comms:read" },
    { id: "assign", label: "Review priorities & assign staff", article: "operations-queue", perm: "application:assign" },
    { id: "reports", label: "Reports", article: "reports", route: "/analytics", perm: "analytics:read" },
    { id: "eod", label: "End-of-day review", kind: "end", article: "admin-daily-flow" },
  ],
};

export const AGENT_FLOW: Flow = {
  slug: "agent-flow",
  title: "Agent daily workflow",
  bn: "এজেন্টের দিন",
  subtitle: "Agents see only the customers they own.",
  category: "agents",
  nodes: [
    { id: "login", label: "Login (agent portal)", kind: "start", article: "agent-vs-admin" },
    { id: "dash", label: "Agent dashboard", article: "agent-daily-flow" },
    { id: "mycust", label: "My customers", article: "agent-daily-flow", note: "Scoped to customers you own." },
    {
      id: "newcust", label: "New or existing customer?", kind: "decision", article: "create-customer",
      branches: [
        { label: "Existing", outcome: "Open the customer", article: "customer-360" },
        { label: "New", outcome: "Add the customer", article: "create-customer" },
      ],
    },
    { id: "docs", label: "Customer documents", article: "upload-document" },
    { id: "ocr", label: "OCR", article: "scan-passport" },
    { id: "book", label: "New booking → select service", article: "create-booking" },
    { id: "pax", label: "Passenger details & documents", article: "create-booking" },
    { id: "submit", label: "Submit", article: "create-booking" },
    { id: "track", label: "Track booking progress", article: "booking-360" },
    { id: "inv", label: "Invoice & payment", article: "record-payment" },
    { id: "comm", label: "Commission & wallet", article: "agent-wallet" },
    { id: "done", label: "Completion → customer follow-up", kind: "end", article: "agent-daily-flow" },
  ],
};

const serviceFlow = (
  slug: string, title: string, bn: string, category: Flow["category"],
  stages: string[], article: string, route: string,
): Flow => ({
  slug, title, bn, category,
  subtitle: `The live ${stages.length}-stage workflow — click any stage for the guide.`,
  nodes: stageNodes(stages, article, route),
});

export const SERVICE_FLOWS: Flow[] = [
  serviceFlow("visa-flow", "Visa workflow", "ভিসা", "visa", VISA_STAGES, "visa-workflow", "/visa"),
  serviceFlow("ticket-flow", "Air ticket workflow", "এয়ার টিকিট", "ticketing", TICKET_STAGES, "ticketing-workflow", "/ticketing"),
  serviceFlow("hotel-flow", "Hotel workflow", "হোটেল", "hotel", HOTEL_STAGES, "hotel-workflow", "/hotels"),
  serviceFlow("transport-flow", "Transport workflow", "ট্রান্সপোর্ট", "transport", TRANSPORT_STAGES, "transport-workflow", "/transport"),
  serviceFlow("tour-flow", "Tour workflow", "ট্যুর", "tour", TOUR_STAGES, "tour-workflow", "/tours"),
  serviceFlow("hajj-flow", "Hajj & Umrah workflow", "হজ ও ওমরাহ", "hajj", HAJJ_STAGES, "hajj-workflow", "/hajj"),
  serviceFlow("student-flow", "Student workflow", "স্টুডেন্ট", "student", STUDENT_STAGES, "student-workflow", "/students"),
  serviceFlow("manpower-flow", "Manpower workflow", "জনশক্তি", "manpower", MANPOWER_STAGES, "manpower-workflow", "/manpower"),
];

export const FLOWS: Flow[] = [
  MASTER_FLOW, LEAD_FLOW, CUSTOMER_FLOW, OWNERSHIP_FLOW, DOCUMENT_FLOW,
  BOOKING_FLOW, SUPPLIER_FLOW, FINANCE_FLOW, OPERATIONS_FLOW,
  NOTIFICATION_FLOW, ADMIN_FLOW, AGENT_FLOW, ...SERVICE_FLOWS,
];

export const FLOW_BY_SLUG: Record<string, Flow> = Object.fromEntries(FLOWS.map((f) => [f.slug, f]));
