import { describe, expect, it } from "vitest";
import { ANSWERS, ARTICLES, ARTICLE_BY_SLUG, QUICK_ACTIONS } from "@/help";

/**
 * V17 role-aware guidance.
 *
 * The permission sets below are the LIVE Role → Permission rows from
 * production, so these assertions prove the guide's gating matches what the API
 * would actually allow — the guide must never tell someone to do something the
 * server will refuse.
 */
const ROLE_PERMS: Record<string, string[]> = {
  visa_executive: [
    "application:advance-stage", "application:create", "application:note", "application:read",
    "application:update", "customer:create", "customer:read", "document:read",
    "document:read-passport", "document:upload", "ocr:apply", "ocr:read-raw", "ocr:use",
  ],
  accounts_manager: [
    "agent:manage", "ap:manage", "ap:read", "application:read", "application:servicefee:read",
    "ar:manage", "ar:read", "bank:read", "banking:manage", "banking:read", "banking:reconcile",
    "cheque:manage", "commission:manage", "commission:read", "customer:read", "document:read",
    "expense:manage", "financial-report:read", "fs:export", "fx:manage", "gl:manage", "gl:read",
    "invoice:amount:read", "invoice:manage", "journal:approve", "journal:create", "ledger:manage",
    "ocr:use", "payment:amount:read", "payment:record", "payment:refund", "payment:status:read",
    "period:close", "period:lock", "period:reopen-approve", "profit:read", "report:read",
    "vendorcost:read",
  ],
  marketing_manager: [
    "analytics:export", "analytics:manage", "analytics:read", "cms:manage", "cms:publish",
    "cms:read", "comms:manage", "comms:read", "comms:send", "communication:manage", "crm:convert",
    "crm:read", "customer:create", "customer:read", "lead:manage", "lead:read",
    "opportunity:manage", "opportunity:read", "quote:approve", "quote:manage", "quote:read",
    "report:read", "sales:pricing", "sales:task",
  ],
};

/** Mirrors AuthProvider.can(): super_admin passes everything. */
const canFor = (role: string) => (perm: string) =>
  role === "super_admin" || (ROLE_PERMS[role] || []).includes(perm);

/** Mirrors HelpCenterPage's quick-action filter. */
const visibleActions = (role: string) => {
  const can = canFor(role);
  return QUICK_ACTIONS.filter((a) => !a.perm || can(a.perm)).map((a) => a.label);
};

/** Mirrors HelpArticlePage's "can this user actually do it" gate. */
const canPerform = (slug: string, role: string) => {
  const a = ARTICLE_BY_SLUG[slug];
  const can = canFor(role);
  return !a.perms.length || a.perms.some((p) => can(p));
};

describe("quick actions respect permissions", () => {
  it("shows everything to a super admin", () => {
    expect(visibleActions("super_admin")).toHaveLength(QUICK_ACTIONS.length);
  });

  it("gives a visa executive document and booking actions but no finance", () => {
    const v = visibleActions("visa_executive");
    expect(v).toContain("Add Customer");
    expect(v).toContain("New Booking");
    expect(v).toContain("Scan Document");
    expect(v).toContain("View Operations");
    expect(v).not.toContain("View Invoices");
    expect(v).not.toContain("View Payments");
    expect(v).not.toContain("View Agents");
    expect(v).not.toContain("Add Lead");
  });

  it("gives an accounts manager finance actions but not lead capture", () => {
    const v = visibleActions("accounts_manager");
    expect(v).toContain("View Invoices");
    expect(v).toContain("View Payments");
    expect(v).toContain("View Agents");
    expect(v).not.toContain("Add Lead");
    expect(v).not.toContain("New Booking");
    // Observed in the live role matrix: accounts_manager holds ap:read but NOT
    // supplier:read, so they can work payables without opening the supplier
    // master. The guide must therefore not offer them the Suppliers shortcut.
    expect(v).not.toContain("View Suppliers");
  });

  it("gives a marketing manager lead capture but no finance or OCR", () => {
    const v = visibleActions("marketing_manager");
    expect(v).toContain("Add Lead");
    expect(v).toContain("Add Customer");
    expect(v).not.toContain("View Invoices");
    expect(v).not.toContain("Scan Document");
    expect(v).not.toContain("View Payments");
  });
});

describe("articles gate on the same permission the API enforces", () => {
  it("lets a visa executive scan and apply OCR", () => {
    expect(canPerform("scan-passport", "visa_executive")).toBe(true);
    expect(canPerform("upload-document", "visa_executive")).toBe(true);
    expect(canPerform("advance-stage", "visa_executive")).toBe(true);
  });

  it("does not tell a visa executive to raise invoices or refund", () => {
    expect(canPerform("create-invoice", "visa_executive")).toBe(false);
    expect(canPerform("record-payment", "visa_executive")).toBe(false);
    expect(canPerform("refund", "visa_executive")).toBe(false);
    expect(canPerform("assign-agent-ownership", "visa_executive")).toBe(false);
  });

  it("does not tell an accounts manager to verify documents", () => {
    expect(canPerform("verify-document", "accounts_manager")).toBe(false);
    expect(canPerform("create-invoice", "accounts_manager")).toBe(true);
    expect(canPerform("refund", "accounts_manager")).toBe(true);
    expect(canPerform("supplier-payment", "accounts_manager")).toBe(true);
  });

  it("does not tell a marketing manager to record a payment", () => {
    expect(canPerform("record-payment", "marketing_manager")).toBe(false);
    expect(canPerform("create-lead", "marketing_manager")).toBe(true);
    expect(canPerform("convert-lead", "marketing_manager")).toBe(true);
    expect(canPerform("create-quotation", "marketing_manager")).toBe(true);
  });

  it("keeps read-only orientation guides open to everyone", () => {
    for (const role of ["visa_executive", "accounts_manager", "marketing_manager"]) {
      expect(canPerform("getting-started", role), role).toBe(true);
      expect(canPerform("roles-and-permissions", role), role).toBe(true);
      expect(canPerform("agent-vs-admin", role), role).toBe(true);
    }
  });
});

describe("assistant answers carry a checkable permission", () => {
  it("every answer with a route names a permission we can gate on", () => {
    const missing = ANSWERS.filter((a) => a.route && a.route !== "/help" && !a.perm).map((a) => a.q);
    expect(missing).toEqual([]);
  });

  it("would refuse a restricted answer for the wrong role", () => {
    const refund = ANSWERS.find((a) => a.q.includes("refund"))!;
    expect(canFor("visa_executive")(refund.perm!)).toBe(false);
    expect(canFor("accounts_manager")(refund.perm!)).toBe(true);
  });

  it("never routes an answer somewhere no article backs it up", () => {
    const orphan = ANSWERS.filter((a) => a.article && !ARTICLE_BY_SLUG[a.article]).map((a) => a.q);
    expect(orphan).toEqual([]);
  });
});

describe("no guide promises an action without naming its permission", () => {
  it("every step that changes data names a permission", () => {
    // Steps whose wording implies mutation should be permission-tagged, so the
    // UI can show the lock instead of an instruction the user cannot follow.
    const verbs = /^(add|create|record|assign|apply|verify|advance|issue|convert|release|settle|raise|delete|approve)\b/i;
    const untagged: string[] = [];
    for (const a of ARTICLES) {
      for (const s of a.steps) {
        if (verbs.test(s.title) && !s.perm && a.perms.length === 0) untagged.push(`${a.slug}: ${s.title}`);
      }
    }
    expect(untagged).toEqual([]);
  });
});
