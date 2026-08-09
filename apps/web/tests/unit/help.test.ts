import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ANSWERS, ARTICLES, ARTICLE_BY_SLUG, CATEGORIES, CATEGORY_BY_ID, FLOWS,
  QUICK_ACTIONS, articlesInCategory, bestAnswer, searchHelp,
} from "@/help";
import { NAV_LEAVES } from "@/config/nav";

/**
 * V17 guidance layer.
 *
 * These tests are the guard against the guide drifting away from the product:
 * every route, permission and cross-link in the knowledge base is checked
 * against the real router and the real permission list.
 */

/** The 88 permission keys seeded in production (Permission.key). */
const REAL_PERMISSIONS = new Set([
  "agent:manage", "analytics:export", "analytics:manage", "analytics:read", "ap:manage", "ap:read",
  "application:advance-stage", "application:approve", "application:assign", "application:create",
  "application:delete", "application:note", "application:read", "application:reject",
  "application:servicefee:read", "application:submit-to-embassy", "application:update", "ar:manage",
  "ar:read", "audit:read", "backup:manage", "bank:read", "banking:manage", "banking:read",
  "banking:reconcile", "cheque:manage", "cms:manage", "cms:publish", "cms:read", "commission:manage",
  "commission:read", "comms:manage", "comms:read", "comms:send", "communication:manage",
  "corporate:manage", "crm:convert", "crm:read", "customer:create", "customer:delete",
  "customer:read", "customer:update", "document:read", "document:read-passport", "document:upload",
  "document:verify", "expense:manage", "financial-report:read", "fs:export", "fx:manage", "gl:manage",
  "gl:read", "hr:manage", "hr:read", "invoice:amount:read", "invoice:manage", "journal:approve",
  "journal:create", "lead:manage", "lead:read", "ledger:manage", "ocr:apply", "ocr:read-raw",
  "ocr:use", "opportunity:manage", "opportunity:read", "payment:amount:read", "payment:record",
  "payment:refund", "payment:status:read", "period:close", "period:lock", "period:reopen-approve",
  "profit:read", "quote:approve", "quote:manage", "quote:read", "report:read", "role:manage",
  "sales:pricing", "sales:task", "settings:manage", "supplier:manage", "supplier:read", "task:manage",
  "task:read", "user:manage", "vendorcost:read",
]);

/**
 * Real route paths, parsed straight out of the router source. Checking against
 * the actual file (rather than a hand-kept list) is what makes this test a real
 * guard: a guide can never link somewhere the app does not route.
 */
const routerPaths = (() => {
  const src = readFileSync(resolve(__dirname, "../../src/app/routes.tsx"), "utf8");
  const paths = [...src.matchAll(/path:\s*"([^"]*)"/g)].map((m) => m[1]);
  const set = new Set<string>(["/"]);
  for (const p of paths) {
    if (!p || p === "*" || p.includes(":")) continue;
    set.add(p.startsWith("/") ? p : `/${p}`);
  }
  return set;
})();

const navRoutes = new Set(NAV_LEAVES.map((l) => l.to));
const isRealRoute = (r: string) => navRoutes.has(r) || routerPaths.has(r);

const allPerms = (): string[] => {
  const out: string[] = [];
  for (const a of ARTICLES) {
    out.push(...a.perms);
    for (const s of a.steps) if (s.perm) out.push(s.perm);
  }
  for (const f of FLOWS) for (const n of f.nodes) if (n.perm) out.push(n.perm);
  for (const q of QUICK_ACTIONS) if (q.perm) out.push(q.perm);
  for (const ans of ANSWERS) if (ans.perm) out.push(ans.perm);
  return out;
};

describe("help content integrity", () => {
  it("has a populated knowledge base", () => {
    expect(ARTICLES.length).toBeGreaterThanOrEqual(35);
    expect(FLOWS.length).toBeGreaterThanOrEqual(20);
    expect(ANSWERS.length).toBeGreaterThanOrEqual(20);
    expect(CATEGORIES.length).toBe(22);
  });

  it("uses unique article slugs", () => {
    const slugs = ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses unique flow slugs", () => {
    const slugs = FLOWS.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("only references permissions that exist in production", () => {
    const unknown = [...new Set(allPerms())].filter((p) => !REAL_PERMISSIONS.has(p));
    expect(unknown).toEqual([]);
  });

  it("only links to routes that exist in the app", () => {
    const routes: string[] = [];
    for (const a of ARTICLES) {
      if (a.openTo) routes.push(a.openTo);
      for (const s of a.steps) if (s.route) routes.push(s.route);
    }
    for (const f of FLOWS) for (const n of f.nodes) if (n.route) routes.push(n.route);
    for (const q of QUICK_ACTIONS) routes.push(q.to);
    for (const ans of ANSWERS) if (ans.route) routes.push(ans.route);
    const bad = [...new Set(routes)].filter((r) => !isRealRoute(r));
    expect(bad).toEqual([]);
  });

  it("resolves every related-article cross-link", () => {
    const broken: string[] = [];
    for (const a of ARTICLES) for (const r of a.related) if (!ARTICLE_BY_SLUG[r]) broken.push(`${a.slug} -> ${r}`);
    expect(broken).toEqual([]);
  });

  it("resolves every flow node and branch article", () => {
    const broken: string[] = [];
    for (const f of FLOWS) {
      for (const n of f.nodes) {
        if (n.article && !ARTICLE_BY_SLUG[n.article]) broken.push(`${f.slug}/${n.id} -> ${n.article}`);
        for (const b of n.branches || []) {
          if (b.article && !ARTICLE_BY_SLUG[b.article]) broken.push(`${f.slug}/${n.id}/${b.label} -> ${b.article}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("resolves every answer's source article", () => {
    const broken = ANSWERS.filter((a) => a.article && !ARTICLE_BY_SLUG[a.article]).map((a) => a.q);
    expect(broken).toEqual([]);
  });

  it("assigns every article to a known category", () => {
    const bad = ARTICLES.filter((a) => !CATEGORY_BY_ID[a.category]).map((a) => a.slug);
    expect(bad).toEqual([]);
  });

  it("gives every category at least one guide", () => {
    const empty = CATEGORIES.filter((c) => articlesInCategory(c.id).length === 0).map((c) => c.id);
    expect(empty).toEqual([]);
  });

  it("answers all ten documentation questions in every article", () => {
    for (const a of ARTICLES) {
      expect(a.what.length, `${a.slug}.what`).toBeGreaterThan(20);
      expect(a.why.length, `${a.slug}.why`).toBeGreaterThan(20);
      expect(a.who.length, `${a.slug}.who`).toBeGreaterThan(0);
      expect(a.when.length, `${a.slug}.when`).toBeGreaterThan(5);
      expect(a.steps.length, `${a.slug}.steps`).toBeGreaterThan(2);
      expect(a.result.length, `${a.slug}.result`).toBeGreaterThan(10);
      expect(a.problems.length, `${a.slug}.problems`).toBeGreaterThan(0);
      expect(a.keywords.length, `${a.slug}.keywords`).toBeGreaterThan(2);
    }
  });

  it("states an honest note whenever availability is not full", () => {
    for (const a of ARTICLES) {
      if (a.availability && a.availability !== "available") {
        expect(a.availabilityNote, `${a.slug}`).toBeTruthy();
      }
    }
  });
});

describe("help search", () => {
  it("finds passport guidance", () => {
    const slugs = searchHelp("passport").map((h) => h.slug);
    expect(slugs).toContain("scan-passport");
    expect(slugs).toContain("duplicate-passport");
  });

  it("finds the payment family", () => {
    const titles = searchHelp("payment", 30).map((h) => h.title.toLowerCase()).join(" ");
    expect(titles).toMatch(/payment/);
    const slugs = searchHelp("payment", 30).map((h) => h.slug);
    expect(slugs).toContain("record-payment");
    expect(slugs).toContain("receivables");
  });

  it("finds supplier due via a natural phrase", () => {
    const slugs = searchHelp("supplier due", 20).map((h) => h.slug);
    expect(slugs).toContain("supplier-payment");
  });

  it("tolerates a single typo", () => {
    expect(searchHelp("pasport").length).toBeGreaterThan(0);
    expect(searchHelp("invoise").length).toBeGreaterThan(0);
  });

  it("returns nothing for an empty query", () => {
    expect(searchHelp("")).toEqual([]);
    expect(searchHelp("   ")).toEqual([]);
  });

  it("ranks a direct answer for common questions", () => {
    expect(bestAnswer("How do I add a customer?")?.article).toBe("create-customer");
    expect(bestAnswer("how do i scan a passport")?.article).toBe("scan-passport");
    expect(bestAnswer("where can I see supplier due")?.article).toBe("supplier-payment");
    expect(bestAnswer("what does at risk mean")?.article).toBe("at-risk");
  });

  it("never invents an answer for nonsense", () => {
    expect(bestAnswer("zzzzqqqq wibble")).toBeNull();
  });
});

describe("honesty about unavailable capability", () => {
  it("marks student and manpower as partly available", () => {
    expect(ARTICLE_BY_SLUG["student-workflow"].availability).toBe("partial");
    expect(ARTICLE_BY_SLUG["manpower-workflow"].availability).toBe("partial");
  });

  it("does not claim WhatsApp or SMS delivery works", () => {
    const n = ARTICLE_BY_SLUG["notifications"];
    expect(n.availability).toBe("partial");
    expect(n.availabilityNote).toMatch(/NOT CONFIGURED/);
    const whatsapp = ANSWERS.find((a) => a.q.includes("WhatsApp"));
    expect(whatsapp?.a).toMatch(/NOT CONFIGURED|cannot/i);
  });

  it("limits lead conversion and quotations to the supported service types", () => {
    expect(ARTICLE_BY_SLUG["convert-lead"].availability).toBe("partial");
    expect(ARTICLE_BY_SLUG["create-quotation"].availability).toBe("partial");
  });
});

describe("service workflows match the live templates", () => {
  const ELEVEN = [
    "visa-workflow", "ticketing-workflow", "hotel-workflow", "transport-workflow",
    "tour-workflow", "hajj-workflow", "student-workflow", "manpower-workflow",
  ];

  it("documents all eight service verticals", () => {
    for (const slug of ELEVEN) expect(ARTICLE_BY_SLUG[slug], slug).toBeTruthy();
  });

  it("renders 11 stages in each service flow", () => {
    const serviceFlows = FLOWS.filter((f) => f.slug.endsWith("-flow") && /visa|ticket|hotel|transport|tour|hajj|student|manpower/.test(f.slug));
    expect(serviceFlows.length).toBe(8);
    for (const f of serviceFlows) expect(f.nodes.length, f.slug).toBe(11);
  });

  it("starts the visa flow at Created and ends at Completed", () => {
    const visa = FLOWS.find((f) => f.slug === "visa-flow")!;
    expect(visa.nodes[0].label).toBe("1. Created");
    expect(visa.nodes[10].label).toBe("11. Completed");
  });
});

describe("master workflow", () => {
  const master = FLOWS.find((f) => f.slug === "master-journey")!;

  it("covers lead through after-sales", () => {
    const labels = master.nodes.map((n) => n.label.toLowerCase()).join(" ");
    for (const step of ["lead", "customer", "documents", "ocr", "booking", "supplier", "invoice", "payment", "operations", "after sales"]) {
      expect(labels, step).toContain(step);
    }
  });

  it("makes every node clickable to a guide", () => {
    const orphan = master.nodes.filter((n) => !n.article).map((n) => n.id);
    expect(orphan).toEqual([]);
  });

  it("starts at a start node and ends at an end node", () => {
    expect(master.nodes[0].kind).toBe("start");
    expect(master.nodes[master.nodes.length - 1].kind).toBe("end");
  });
});
