/**
 * RBAC + staff seed — encodes the confirmed office structure.
 * Idempotent: safe to re-run. Users get a generated temp password + must change
 * on first login (printed ONCE at seed time). Runs on STAGING first.
 *
 * Key rules enforced here (server-side is the real boundary via @Permissions):
 *  - visa_executive DOES the work; visa_consultant & up APPROVE.
 *  - Finance ACTIONS (record/refund/ledger/expense) = accounts_manager / super_admin only.
 *  - payment:record and payment:refund are SEPARATE (refund restrictable later).
 *  - Case delete = soft-delete, super_admin + general_manager only.
 *  - office_incharge approves but has NO finance data at all.
 *  - marketing_manager: no passport docs, no finance.
 */
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

// ---- Full fine-grained permission catalog ----
const PERMISSIONS: [string, string][] = [
  ["customer:read", "View customers"],
  ["customer:create", "Create customers"],
  ["customer:update", "Edit customers"],
  ["customer:delete", "Soft-delete customers"],
  ["application:read", "View cases"],
  ["application:create", "Create cases"],
  ["application:update", "Edit case fields"],
  ["application:assign", "Assign cases to staff"],
  ["application:note", "Add case notes"],
  ["application:advance-stage", "Move a case to the next stage"],
  ["application:approve", "Approve a case result"],
  ["application:submit-to-embassy", "Submit a case to the embassy/authority"],
  ["application:reject", "Reject/refuse a case"],
  ["application:delete", "Soft-delete a case (audit-preserving)"],
  ["application:servicefee:read", "See a case's service fee amount"],
  ["document:read", "View documents"],
  ["document:upload", "Upload documents"],
  ["document:verify", "Mark a document verified/rejected"],
  ["document:read-passport", "View passport / sensitive identity documents"],
  ["payment:status:read", "See payment status (Paid/Partial/Due) — no amounts"],
  ["invoice:amount:read", "See invoice amounts"],
  ["payment:amount:read", "See payment amounts"],
  ["commission:read", "See commissions"],
  ["vendorcost:read", "See supplier/vendor costs"],
  ["profit:read", "See profit/margin"],
  ["financial-report:read", "See financial reports"],
  ["bank:read", "See bank/account data"],
  ["invoice:manage", "Create/edit invoices"],
  ["payment:record", "Record a payment"],
  ["payment:refund", "Refund a payment"],
  ["ledger:manage", "Post ledger/journal entries"],
  ["expense:manage", "Record expenses"],
  // Phase C1 — GL foundation
  ["gl:read", "View chart of accounts / GL masters"],
  ["gl:manage", "Manage CoA, groups, cost centers, fiscal setup"],
  ["journal:create", "Create / edit draft journal entries"],
  ["journal:approve", "Approve / reject / post journal entries"],
  ["period:close", "Close accounting periods"],
  ["fx:manage", "Manage currencies and exchange rates"],
  ["ar:read", "View accounts receivable"],
  ["ar:manage", "Create / approve / post AR documents"],
  ["ap:read", "View accounts payable"],
  ["ap:manage", "Create / approve / post AP documents"],
  ["banking:read", "View banking / cash books"],
  ["banking:manage", "Manage bank accounts and post movements"],
  ["banking:reconcile", "Import statements and reconcile"],
  ["cheque:manage", "Manage cheque register and printing"],
  ["fs:export", "Export financial statements (CSV/HTML)"],
  ["period:lock", "Lock closed accounting periods"],
  ["period:reopen-approve", "Approve reopen of closed/locked periods"],
  ["lead:read", "View leads"],
  ["lead:manage", "Manage leads"],
  ["crm:read", "View CRM"],
  ["communication:manage", "Log/manage communications"],
  ["opportunity:read", "View CRM opportunities"],
  ["opportunity:manage", "Manage CRM opportunities"],
  ["quote:read", "View CRM quotations"],
  ["quote:manage", "Manage CRM quotations"],
  ["crm:convert", "Convert CRM opportunities/quotes to cases"],
  ["quote:approve", "Approve or reject sales quotations"],
  ["sales:pricing", "Manage sales pricing templates and price books"],
  ["sales:task", "Manage sales tasks and escalations"],
  ["comms:read", "View communication hub and timelines"],
  ["comms:manage", "Manage templates, threads, and engagement activities"],
  ["comms:send", "Send email, WhatsApp, and SMS via adapters"],
  ["analytics:read", "View CRM analytics dashboards"],
  ["analytics:manage", "Manage analytics report templates and schedules"],
  ["analytics:export", "Export analytics reports to CSV/Excel/PDF"],
  ["cms:manage", "Manage website/CMS content"],
  ["cms:read", "View CMS content and form submissions"],
  ["cms:publish", "Publish CMS pages and content"],
  ["supplier:read", "View suppliers"],
  ["supplier:manage", "Manage suppliers"],
  // Phase 6 partners — money/agent actions (added 2026-07-23)
  ["agent:manage", "Manage agents (create/edit/remove)"],
  ["commission:manage", "Create/approve/pay commissions and adjust agent wallets"],
  ["corporate:manage", "Manage corporate clients"],
  ["hr:read", "View HR"],
  ["hr:manage", "Manage HR"],
  ["task:read", "View tasks"],
  ["task:manage", "Manage tasks"],
  ["report:read", "View operational reports"],
  ["user:manage", "Manage users"],
  ["role:manage", "Manage roles/permissions"],
  ["settings:manage", "Manage system settings"],
  ["backup:manage", "Manage backups"],
  ["audit:read", "View audit logs"],
  // Phase 10 — OCR (Gemini/Vision). Customers use the public endpoint (no perm).
  ["ocr:use", "Upload a document for OCR extraction"],
  ["ocr:apply", "Confirm OCR-extracted data and write it to a record"],
  ["ocr:read-raw", "View raw OCR text / stored passport image (sensitive)"],
];

const ALL = PERMISSIONS.map((p) => p[0]);

// ---- Role → permission keys (super_admin = every permission) ----
const ROLES: Record<string, { description: string; perms: string[] }> = {
  super_admin: { description: "Chairman — full access incl. users/settings/backups", perms: ALL },

  general_manager: {
    description: "All operational + finance READ (no finance actions, no system admin)",
    perms: [
      "customer:read", "customer:create", "customer:update", "customer:delete",
      "application:read", "application:create", "application:update", "application:assign",
      "application:note", "application:advance-stage", "application:approve",
      "application:submit-to-embassy", "application:reject", "application:delete",
      "application:servicefee:read",
      "document:read", "document:upload", "document:verify", "document:read-passport",
      // finance READ ONLY:
      "payment:status:read", "invoice:amount:read", "payment:amount:read", "commission:read",
      "vendorcost:read", "profit:read", "financial-report:read", "bank:read",
      "gl:read", "ar:read", "ap:read", "banking:read", "fs:export",
      "supplier:read", "supplier:manage", "hr:read", "task:read", "task:manage",
      "lead:read", "lead:manage", "crm:read", "communication:manage", "report:read",
      "opportunity:read", "opportunity:manage", "quote:read", "quote:manage", "crm:convert",
      "quote:approve", "sales:pricing", "sales:task",
      "comms:read", "comms:manage", "comms:send",
      "analytics:read", "analytics:manage", "analytics:export",
      "cms:manage", "cms:read", "cms:publish",
      // Phase 6 partners (2026-07-23) — GM manages agents & corporate clients (no commission money action)
      "agent:manage", "corporate:manage",
      "ocr:use", "ocr:apply", "ocr:read-raw",
    ],
  },

  office_incharge: {
    description: "Customers/cases/tasks/docs/assignment + approve. NO finance, NO system.",
    perms: [
      "customer:read", "customer:create", "customer:update",
      "application:read", "application:create", "application:update", "application:assign",
      "application:note", "application:advance-stage", "application:approve",
      "application:submit-to-embassy", "application:reject", // approve yes, NO delete
      "document:read", "document:upload", "document:verify", "document:read-passport",
      "task:read", "task:manage", "supplier:read",
      "lead:read", "lead:manage", "crm:read", "communication:manage",
      "opportunity:read", "opportunity:manage", "quote:read", "quote:manage", "crm:convert",
      "quote:approve", "sales:pricing", "sales:task",
      "comms:read", "comms:manage", "comms:send",
      "analytics:read", "analytics:manage", "analytics:export",
      "cms:manage", "cms:read", "cms:publish",
      "ocr:use", "ocr:apply", "ocr:read-raw",
      // finance: NONE
    ],
  },

  accounts_manager: {
    description: "Full Finance (incl. actions) + read customers/cases for billing. No case approval.",
    perms: [
      "customer:read",
      "application:read", "application:servicefee:read",
      "document:read", // NOT passport
      "payment:status:read", "invoice:amount:read", "payment:amount:read", "commission:read",
      "vendorcost:read", "profit:read", "financial-report:read", "bank:read",
      "invoice:manage", "payment:record", "payment:refund", "ledger:manage", "expense:manage",
      "gl:read", "gl:manage", "journal:create", "journal:approve", "period:close", "fx:manage",
      "ar:read", "ar:manage", "ap:read", "ap:manage",
      "banking:read", "banking:manage", "banking:reconcile", "cheque:manage",
      "fs:export", "period:lock", "period:reopen-approve",
      "report:read",
      // Phase 6 partners (2026-07-23) — accounts owns commission money + agent records
      "commission:manage", "agent:manage",
      "ocr:use", // scan tickets/receipts; NOT passport (no read-raw), NOT apply
    ],
  },

  marketing_manager: {
    description: "CRM/leads/communications/CMS. No passport docs, no finance, no case processing.",
    perms: [
      "customer:read", "customer:create",
      "lead:read", "lead:manage", "crm:read", "communication:manage",
      "opportunity:read", "opportunity:manage", "quote:read", "quote:manage", "crm:convert",
      "quote:approve", "sales:pricing", "sales:task",
      "comms:read", "comms:manage", "comms:send",
      "analytics:read", "analytics:manage", "analytics:export",
      "corporate:manage", "cms:manage", "cms:read", "cms:publish", "report:read",
    ],
  },

  visa_consultant: {
    description: "Full visa handling incl. approve/submit/reject. Payment STATUS only.",
    perms: [
      "customer:read", "customer:create", "customer:update",
      "application:read", "application:create", "application:update", "application:assign",
      "application:note", "application:advance-stage", "application:approve",
      "application:submit-to-embassy", "application:reject", // NO delete
      "document:read", "document:upload", "document:verify", "document:read-passport",
      "payment:status:read", // status only, no amounts/actions
      "ocr:use", "ocr:apply", "ocr:read-raw",
    ],
  },

  visa_executive: {
    description: "Process visa cases (create/update/notes/stages/docs incl passport). No approve/submit/reject/delete. No finance.",
    perms: [
      "customer:read", "customer:create", // start walk-in; NO update/delete
      "application:read", "application:create", "application:update", "application:note", "application:advance-stage",
      "document:read", "document:upload", "document:read-passport", // NO verify
      "ocr:use", "ocr:apply", "ocr:read-raw", // passport scan at intake (data entry)
      // finance: NONE
    ],
  },
};

// ---- Real staff (emails = proposed convention — CONFIRM before PRODUCTION seed) ----
const STAFF: [string, string, string][] = [
  ["Mohammad Liton", "liton@shanghaitravels.com.bd", "super_admin"],
  ["Liza Akter Bina", "liza@shanghaitravels.com.bd", "general_manager"],
  ["Porimal Bayda", "porimal@shanghaitravels.com.bd", "office_incharge"],
  ["Md Jasim Uddin", "jasim@shanghaitravels.com.bd", "accounts_manager"],
  ["Md Rasel Hossain", "rasel@shanghaitravels.com.bd", "marketing_manager"],
  ["Bappi Biswas", "bappi@shanghaitravels.com.bd", "visa_consultant"],
  ["Manash Mondal", "manash@shanghaitravels.com.bd", "visa_consultant"],
  ["Abu Rayhan", "rayhan@shanghaitravels.com.bd", "visa_executive"],
  ["Md Asidul Islam", "asidul@shanghaitravels.com.bd", "visa_executive"],
  ["Shakil Ahmmed", "shakil@shanghaitravels.com.bd", "visa_executive"],
  ["Md Arafat Islam", "arafat@shanghaitravels.com.bd", "visa_executive"],
  ["Shihab Islam", "shihab@shanghaitravels.com.bd", "visa_executive"],
  ["Md Shahol", "shahol@shanghaitravels.com.bd", "visa_executive"],
];

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "org-shanghai" },
    update: {},
    create: { id: "org-shanghai", name: "Shanghai Travels", regNo: "0017053", regAuthority: "Ministry of Civil Aviation and Tourism, Bangladesh" },
  });
  const corporate = await prisma.branch.upsert({ where: { id: "br-corporate" }, update: {}, create: { id: "br-corporate", orgId: org.id, name: "Corporate Office", type: "corporate", address: "House-5, Level-4, Road-4, Baridhara, Vatara, Dhaka-1212" } });
  await prisma.branch.upsert({ where: { id: "br-head" }, update: {}, create: { id: "br-head", orgId: org.id, name: "Head Office", type: "head", address: "Dag No-1199, Natun Bazar (100 Fit), Vatara, Dhaka-1212" } });

  // Permissions
  for (const [key, description] of PERMISSIONS) {
    await prisma.permission.upsert({ where: { key }, update: { description }, create: { key, description } });
  }
  const permByKey = Object.fromEntries((await prisma.permission.findMany()).map((p) => [p.key, p.id]));

  // Roles + role_permissions
  for (const [name, def] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({ where: { name }, update: { description: def.description, isSystem: true }, create: { name, description: def.description, isSystem: true } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({ data: def.perms.map((k) => ({ roleId: role.id, permId: permByKey[k] })), skipDuplicates: true });
  }
  const roleByName = Object.fromEntries((await prisma.role.findMany()).map((r) => [r.name, r.id]));

  // Staff users (create only if missing; print temp password once)
  const creds: string[] = [];
  for (const [fullName, email, roleName] of STAFF) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) continue;
    const temp = randomBytes(9).toString("base64url"); // ~12 chars
    const passwordHash = await argon2.hash(temp, { type: argon2.argon2id });
    await prisma.user.create({ data: { email, fullName, passwordHash, roleId: roleByName[roleName], branchId: corporate.id, mustChangePassword: true } });
    creds.push(`${fullName.padEnd(20)} ${email.padEnd(34)} ${roleName.padEnd(17)} temp: ${temp}`);
  }

  // Break-glass super-admin (migrated from the current placeholder auth)
  const admin = "admin@shanghaitravels.com.bd";
  if (!(await prisma.user.findUnique({ where: { email: admin } }))) {
    const temp = randomBytes(9).toString("base64url");
    await prisma.user.create({ data: { email: admin, fullName: "Break-glass Admin", passwordHash: await argon2.hash(temp, { type: argon2.argon2id }), roleId: roleByName["super_admin"], branchId: corporate.id, mustChangePassword: true } });
    creds.push(`${"Break-glass Admin".padEnd(20)} ${admin.padEnd(34)} ${"super_admin".padEnd(17)} temp: ${temp}`);
  }

  console.log(`\nSeed complete. ${Object.keys(ROLES).length} roles, ${PERMISSIONS.length} permissions.`);
  if (creds.length) { console.log("\n=== TEMP PASSWORDS (shown once — deliver securely, users must change on first login) ===\n" + creds.join("\n") + "\n"); }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
