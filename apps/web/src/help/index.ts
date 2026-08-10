/**
 * V17 — the guidance index: aggregate content, direct answers, and search.
 *
 * Search is deliberately local: token matching + fuzzy fallback over the
 * knowledge base. There is no AI backend in this project (the `ai` route is a
 * stub that redirects home), and no paid API is introduced for this feature.
 */
import { CORE_ARTICLES } from "./articles.core";
import { SERVICE_ARTICLES } from "./articles.services";
import { BACKOFFICE_ARTICLES } from "./articles.backoffice";
import { FLOWS } from "./flows";
import type { Answer, Article, CategoryId } from "./types";

export * from "./types";
export { CATEGORIES, CATEGORY_BY_ID, QUICK_ACTIONS, ROLE_LABELS } from "./catalog";
export { FLOWS, FLOW_BY_SLUG, MASTER_FLOW } from "./flows";

export const ARTICLES: Article[] = [...CORE_ARTICLES, ...SERVICE_ARTICLES, ...BACKOFFICE_ARTICLES];

export const ARTICLE_BY_SLUG: Record<string, Article> = Object.fromEntries(
  ARTICLES.map((a) => [a.slug, a]),
);

export const articlesInCategory = (id: CategoryId): Article[] =>
  ARTICLES.filter((a) => a.category === id);

/**
 * Direct answers for the questions staff actually type. Each one points at a
 * full article so there is a single source of truth.
 */
export const ANSWERS: Answer[] = [
  {
    q: "How do I pay staff salary?",
    alt: ["salary", "payroll", "monthly salary", "pay employee", "staff wages"],
    a: "Finance → Staff Salary. Add employees, then 'Pay salary': choose the month, gross and any deduction (net = gross − deduction), and a payment account. Choosing an account posts it to the ledger; leaving it blank records salary only. Needs hr:manage.",
    route: "/finance/salary",
    perm: "hr:read",
  },
  {
    q: "Where is the Submit Report?",
    alt: ["submit report", "submission report", "what was submitted", "embassy submission report"],
    a: "Reports & Analytics → Submit Report. It lists applications actually submitted to the embassy/authority, filterable by date and by All / Agent / Corporate / Individual. Submit Date comes from the real submission event, never typed by hand. Needs report:read.",
    route: "/analytics/submit",
    perm: "report:read",
  },
  {
    q: "Where is the Delivery Report?",
    alt: ["delivery report", "what was delivered", "passport delivery report"],
    a: "Reports & Analytics → Delivery Report. It shows customer deliveries (not embassy returns), filterable by date and customer type. A passport back from the embassy shows as 'with office', not delivered. Needs report:read.",
    route: "/analytics/delivery",
    perm: "report:read",
  },
  {
    q: "What should I do after creating a customer?",
    alt: ["after creating customer", "next after customer", "customer created now what"],
    article: "customer-360",
    a: "1) Open Customer 360 and check the details are right. 2) Add the passport or NID. 3) Run OCR on it. 4) Review and correct every extracted field. 5) Apply it to the customer. 6) Create the booking. 7) Continue the service workflow.",
    route: "/customers",
    perm: "customer:read",
  },
  {
    q: "How do I create a booking?",
    alt: ["new booking", "make a booking", "start booking", "add booking"],
    article: "create-booking",
    a: "Bookings → New booking. The wizard runs Service → Package → Customer → Documents → Traveller → Supplier → Review → Invoice → Payment → Done. Student and Manpower are not selectable there — create those from their own screens.",
    route: "/bookings/new",
    perm: "application:create",
  },
  {
    q: "How do I add a customer?",
    alt: ["create customer", "new customer", "add client"],
    article: "create-customer",
    a: "Customers → search by phone first to avoid a duplicate, then add. Full name (at least 2 characters) and phone (at least 6) are mandatory; the CUS- code is generated for you.",
    route: "/customers",
    perm: "customer:create",
  },
  {
    q: "How do I assign a customer to an agent?",
    alt: ["assign agent", "agent ownership", "give customer to agent", "change owner"],
    article: "assign-agent-ownership",
    a: "Check the agent is approved under Business Partners → Agents, then open the customer and assign ownership. A secondary co-agent can be added, and ownership can be released back to house. Every change is recorded. Requires agent:manage.",
    route: "/partners/agents",
    perm: "agent:manage",
  },
  {
    q: "How do I scan a passport?",
    alt: ["passport ocr", "scan document", "read passport", "ocr passport"],
    article: "scan-passport",
    a: "Operations → Document Intelligence → scan with type passport. Review passport number, name, date of birth, nationality, issue and expiry against the document, check for duplicates, then apply it to the customer. Scanning needs ocr:use; applying needs ocr:apply.",
    route: "/operations/document-intelligence",
    perm: "ocr:use",
  },
  {
    q: "What should I do after OCR?",
    alt: ["after ocr", "ocr done", "next after scanning"],
    article: "verify-document",
    a: "Compare every extracted field with the document in your hand, correct anything wrong, run the duplicate check, apply it to the customer, then mark the document verified. Only then advance the case.",
    route: "/operations/document-intelligence",
    perm: "ocr:use",
  },
  {
    q: "How do I create a visa booking?",
    alt: ["visa booking", "new visa", "visa case", "visa application"],
    article: "visa-workflow",
    a: "New Booking → Visa (or Bookings → Visa → New). The case then runs 11 stages: Created, Documents, OCR, Review, Embassy Submission, Interview, Approved, Stamped, Collected, Delivered, Completed.",
    route: "/visa",
    perm: "application:create",
  },
  {
    q: "How do I create an air ticket booking?",
    alt: ["air ticket", "flight booking", "issue ticket", "ticketing"],
    article: "ticketing-workflow",
    a: "New Booking → Air Ticket. The 11 stages are Created, Documents, Fare Search, Fare Confirmed, Payment Pending, Ticket Issued, PNR Confirmed, Delivered, Travel Started, Travel Completed, Closed. The passenger name must match the passport exactly.",
    route: "/ticketing",
    perm: "application:create",
  },
  {
    q: "How do I make an invoice?",
    alt: ["create invoice", "raise invoice", "billing", "invoice customer"],
    article: "create-invoice",
    a: "Finance → Invoices → create, or use step 8 of the booking wizard. It starts as a draft; issue it to make it a real receivable, then approve and send. Requires invoice:manage.",
    route: "/finance/invoices",
    perm: "invoice:manage",
  },
  {
    q: "How do I record a payment?",
    alt: ["record payment", "take payment", "customer paid", "receive money", "add payment"],
    article: "record-payment",
    a: "Finance → Payments. Amount and receiving account are mandatory; link the invoice so it settles. The invoice moves to partially_paid or paid automatically. Requires payment:record.",
    route: "/finance/payments",
    perm: "payment:record",
  },
  {
    q: "Where can I see customer payment?",
    alt: ["see payments", "customer paid where", "payment history", "find payment"],
    article: "receivables",
    a: "Finance → Payments lists receipts. Finance → Customer Ledger shows one customer's full account, and Finance → AR shows what is still owed. A booking's own position is on its Booking 360 financial summary.",
    route: "/finance/payments",
    perm: "payment:amount:read",
  },
  {
    q: "How do I check supplier due?",
    alt: [
      "supplier due", "payable", "what do we owe", "supplier balance", "ap",
      "where can i see supplier due", "where is supplier due", "see supplier due",
    ],
    article: "supplier-payment",
    a: "Finance → AP lists everything owed to suppliers. Finance → Supplier Ledger shows one supplier's history. Requires ap:read.",
    route: "/finance/ap",
    perm: "ap:read",
  },
  {
    q: "How do I check receivables?",
    alt: ["receivables", "who owes us", "outstanding", "ar", "due from customers"],
    article: "receivables",
    a: "Finance → AR lists what customers owe, oldest first. Finance → Customer Ledger drills into one customer. The Finance Dashboard summarises receivables and payables together.",
    route: "/finance/ar",
    perm: "ar:read",
  },
  {
    q: "How do I check agent commission?",
    alt: ["agent commission", "commission", "agent earning", "payout"],
    article: "agent-commission",
    a: "Finance → Commission Rules holds the rates; Business Partners → Agents shows each agent's tier, earned commission and wallet. Commission is earned on bookings for customers that agent owns. Requires commission:read.",
    route: "/finance/commission-rules",
    perm: "commission:read",
  },
  {
    q: "How do I check a booking?",
    alt: ["find booking", "open booking", "booking status", "track booking", "where is booking"],
    article: "booking-360",
    a: "Operations shows the live queue; selecting a case opens Booking 360 with its stage progress, money, documents and timeline. You can also reach it from the customer's booking tab.",
    route: "/operations",
    perm: "application:read",
  },
  {
    q: "Where is Customer 360?",
    alt: ["customer 360", "customer profile", "customer detail", "open customer"],
    article: "customer-360",
    a: "Customers → select the customer. That workspace is Customer 360: profile, bookings, financial position, documents and communication history in one place.",
    route: "/customers",
    perm: "customer:read",
  },
  {
    q: "What does At Risk mean?",
    alt: ["at risk", "health", "why is it red", "risk flag"],
    article: "at-risk",
    a: "The case has an overdue stage, a missing document or an unpaid balance. Open it — the health card names the exact reason. Clear that item and the flag recalculates.",
    route: "/operations",
    perm: "application:read",
  },
  {
    q: "How do I complete a booking?",
    alt: ["complete booking", "close case", "finish booking", "mark complete"],
    article: "advance-stage",
    a: "Advance the case through its remaining stages as each real-world step finishes, deliver the final documents, confirm the invoice is settled, then let it reach its final stage (Completed or Closed). Requires application:advance-stage.",
    route: "/operations",
    perm: "application:advance-stage",
  },
  {
    q: "How do I convert a lead?",
    alt: ["convert lead", "lead to customer", "won lead"],
    article: "convert-lead",
    a: "Open the qualified lead, search Customers first so you do not duplicate, then Convert and choose the service type. Only visa, air_ticket, hotel, tour, hajj and umrah can be converted. Requires crm:convert.",
    route: "/crm",
    perm: "crm:convert",
  },
  {
    q: "How do I add a lead?",
    alt: ["new lead", "capture enquiry", "add enquiry"],
    article: "create-lead",
    a: "CRM & Sales → Leads → add. Name is the only mandatory field; source must be one of web, walkin, phone, whatsapp, facebook or referral. Assign an owner so it is actually followed up.",
    route: "/crm",
    perm: "lead:manage",
  },
  {
    q: "How do I send a WhatsApp or SMS?",
    alt: ["whatsapp", "sms", "text message", "send whatsapp"],
    article: "notifications",
    a: "You cannot — WhatsApp and SMS are NOT CONFIGURED in production. Only email delivery is live. Use email or call the customer, and do not tell them a message was sent.",
    route: "/comms",
    perm: "comms:read",
  },
  {
    q: "How do I refund a customer?",
    alt: ["refund", "return money", "money back"],
    article: "refund",
    a: "Confirm the supplier's cancellation charge first, get approval, then record the refund against the original invoice. Requires payment:refund, which only Accounts, GM and Super Admin hold.",
    route: "/finance/payments",
    perm: "payment:refund",
  },
  {
    q: "How do I create a student or manpower case?",
    alt: ["student booking", "manpower booking", "work case", "overseas employment"],
    article: "student-workflow",
    a: "Not through the New Booking wizard — it marks both 'Not yet supported'. Use Bookings → Students → New, or Bookings → Manpower → New. Both then run their own 11-stage workflow.",
    route: "/students",
    perm: "application:create",
  },
  {
    q: "Why can't I do something?",
    alt: ["permission denied", "no access", "cannot", "blocked", "not allowed"],
    article: "roles-and-permissions",
    a: "Every action is permission-gated. The message names the permission you need. There are 7 roles and 88 permissions; ask an administrator with user:manage or role:manage to grant it.",
    route: "/admin/roles",
    perm: "role:manage",
  },
];

// ───────────────────────────────── search ─────────────────────────────────

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9ঀ-৿\s]/g, " ");
const tokens = (s: string) => norm(s).split(/\s+/).filter(Boolean);

/** Cheap edit-distance-1 check, enough to forgive a single typo. */
function near(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, diff = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++diff > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else { i++; j++; }
  }
  return diff + (a.length - i) + (b.length - j) <= 1;
}

export type SearchHit = {
  kind: "article" | "flow" | "answer";
  slug: string;
  title: string;
  subtitle: string;
  category?: string;
  score: number;
  perm?: string;
};

/**
 * Ranks the knowledge base against a query.
 *
 * Weighting favours an exact title match, then keywords, then body text, so
 * "passport" surfaces the passport guides before an article that merely
 * mentions passports in passing.
 */
export function searchHelp(query: string, limit = 20): SearchHit[] {
  const qs = tokens(query);
  if (!qs.length) return [];
  const hits: SearchHit[] = [];

  const scoreFields = (fields: { text: string; weight: number }[]): number => {
    let score = 0;
    for (const q of qs) {
      let best = 0;
      for (const f of fields) {
        const ft = tokens(f.text);
        if (ft.includes(q)) best = Math.max(best, f.weight);
        else if (ft.some((t) => t.startsWith(q) && q.length >= 3)) best = Math.max(best, f.weight * 0.7);
        else if (ft.some((t) => t.length > 3 && near(t, q))) best = Math.max(best, f.weight * 0.5);
      }
      score += best;
    }
    // Reward matching more of the query rather than one strong token.
    return score * (1 + qs.filter((q) => fields.some((f) => tokens(f.text).includes(q))).length / qs.length);
  };

  for (const a of ARTICLES) {
    const score = scoreFields([
      { text: a.title, weight: 10 },
      { text: a.bn || "", weight: 9 },
      { text: a.keywords.join(" "), weight: 8 },
      { text: a.category, weight: 4 },
      { text: a.what, weight: 3 },
      { text: a.why, weight: 2 },
      { text: a.steps.map((s) => `${s.title} ${s.detail}`).join(" "), weight: 2 },
      { text: a.problems.map((p) => `${p.problem} ${p.fix}`).join(" "), weight: 2 },
    ]);
    if (score > 0) {
      hits.push({
        kind: "article", slug: a.slug, title: a.title, subtitle: a.what,
        category: a.category, score, perm: a.perms[0],
      });
    }
  }

  for (const ans of ANSWERS) {
    const score = scoreFields([
      { text: ans.q, weight: 12 },
      { text: (ans.alt || []).join(" "), weight: 10 },
      { text: ans.a, weight: 3 },
    ]);
    if (score > 0) {
      hits.push({
        kind: "answer", slug: ans.article || "", title: ans.q, subtitle: ans.a,
        score: score + 2, perm: ans.perm,
      });
    }
  }

  for (const f of FLOWS) {
    const score = scoreFields([
      { text: f.title, weight: 9 },
      { text: f.bn || "", weight: 8 },
      { text: f.subtitle, weight: 3 },
      { text: f.nodes.map((n) => n.label).join(" "), weight: 4 },
    ]);
    if (score > 0) {
      hits.push({ kind: "flow", slug: f.slug, title: f.title, subtitle: f.subtitle, category: f.category, score });
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Finds the single best direct answer, used by the assistant. */
export function bestAnswer(query: string): Answer | null {
  const hit = searchHelp(query, 5).find((h) => h.kind === "answer");
  if (!hit) return null;
  return ANSWERS.find((a) => a.q === hit.title) || null;
}
