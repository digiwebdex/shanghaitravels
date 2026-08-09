/**
 * V17 — ERP Guidance layer types.
 *
 * This layer is documentation ONLY. It never calls a business API, never
 * mutates data, and never re-implements a frozen module. Every article points
 * at a REAL route and a REAL permission taken from the audited codebase, so
 * role-aware filtering can reuse `useAuth().can()` verbatim.
 */

export type CategoryId =
  | "getting-started"
  | "leads"
  | "customers"
  | "agents"
  | "documents"
  | "bookings"
  | "visa"
  | "ticketing"
  | "hotel"
  | "transport"
  | "tour"
  | "hajj"
  | "student"
  | "manpower"
  | "suppliers"
  | "finance"
  | "invoices"
  | "payments"
  | "operations"
  | "reports"
  | "notifications"
  | "troubleshooting";

export type Category = {
  id: CategoryId;
  label: string;
  /** Bangla label shown beside the English one — staff-facing wording. */
  bn: string;
  blurb: string;
  /** lucide icon name resolved in the UI layer (keeps this file data-only). */
  icon: string;
};

/** A field the user actually types on the real screen. */
export type FieldSpec = {
  label: string;
  bn?: string;
  required?: boolean;
  note?: string;
};

export type Step = {
  title: string;
  bn?: string;
  detail: string;
  /** Real ERP route this step happens on. */
  route?: string;
  /** Real permission the underlying API enforces. */
  perm?: string;
  fields?: FieldSpec[];
};

export type Problem = { problem: string; fix: string };

/**
 * Availability of the documented workflow in the CURRENT build.
 * `partial` and `unavailable` render an explicit banner — the guide must never
 * imply a capability the code does not have.
 */
export type Availability = "available" | "partial" | "unavailable";

export type Article = {
  slug: string;
  title: string;
  bn?: string;
  category: CategoryId;
  /** 1. What is this? */
  what: string;
  /** 2. Why do I use it? */
  why: string;
  /** 3. Who uses it? — role ids, or ["*"] for everyone with the permission. */
  who: string[];
  /** 4. When should I use it? */
  when: string;
  /** 5. What do I need before starting? */
  prerequisites: string[];
  /** Permissions required to actually perform this. Empty = read-only/no gate. */
  perms: string[];
  /** 6. Step-by-step. */
  steps: Step[];
  /** 7. What happens after completion? */
  result: string;
  /** 8/9. What can go wrong + how to fix it. */
  problems: Problem[];
  /** 10. Where can I see the result? */
  seeResult?: string;
  /** "Open this module" target. */
  openTo?: string;
  openLabel?: string;
  related: string[];
  keywords: string[];
  availability?: Availability;
  /** Shown when availability !== "available". States the honest limitation. */
  availabilityNote?: string;
};

/** One node of a clickable flowchart. Rendered as real HTML, never an image. */
export type FlowNode = {
  id: string;
  label: string;
  bn?: string;
  kind?: "start" | "step" | "decision" | "end";
  /** Help article this node opens. */
  article?: string;
  /** ERP module this node can jump to. */
  route?: string;
  perm?: string;
  note?: string;
  /** Decision outcomes, rendered as labelled branches under the node. */
  branches?: { label: string; outcome: string; article?: string; route?: string }[];
};

export type Flow = {
  slug: string;
  title: string;
  bn?: string;
  subtitle: string;
  category: CategoryId;
  nodes: FlowNode[];
};

/** A "What should I do now?" entry the assistant answers directly. */
export type Answer = {
  q: string;
  /** Extra phrasings that should match the same answer. */
  alt?: string[];
  /** Article the answer is drawn from — keeps one source of truth. */
  article?: string;
  a: string;
  route?: string;
  perm?: string;
};
