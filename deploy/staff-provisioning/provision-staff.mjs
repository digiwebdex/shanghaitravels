#!/usr/bin/env node
/**
 * Secure Staff ERP provisioning — Shanghai Travels
 *
 * - Reads roster.json (names/roles only — NO passwords)
 * - Generates unique temporary passwords at runtime
 * - Stores argon2id hashes in DB only
 * - Writes admin-only report: docs/INITIAL_STAFF_ACCOUNTS.md (gitignored)
 *
 * Usage (production):
 *   cd /opt/st-erp-api
 *   set -a && source .env && set +a
 *   node /var/www/ShanghaiTravels-src/deploy/staff-provisioning/provision-staff.mjs
 *
 * Does not modify auth flow, JWT, RBAC matrix, or portal realms.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(process.cwd() + "/package.json");
const argon2 = require("argon2");
const { PrismaClient } = require("@prisma/client");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROSTER_PATH = path.join(__dirname, "roster.json");
const DEFAULT_REPORT = path.resolve(__dirname, "../../docs/INITIAL_STAFF_ACCOUNTS.md");
const REPORT_PATH = process.env.STAFF_PROVISION_REPORT || DEFAULT_REPORT;

function genPassword() {
  const abc = "abcdefghjkmnpqrstuvwxyz";
  const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const num = "23456789";
  const sym = "!@#$%&*";
  const pick = (set, n) =>
    Array.from({ length: n }, () => set[crypto.randomInt(set.length)]).join("");
  return `${pick(ABC, 1)}${pick(abc, 4)}-${pick(num, 4)}-${pick(abc, 4)}${pick(sym, 1)}`;
}

function genPhone(seed) {
  // Placeholder BD mobile — update from profile
  const n = crypto.createHash("sha256").update(seed).digest();
  const mid = ((n[0] << 8) | n[1]) % 100000000;
  return `+88017${String(mid).padStart(8, "0")}`;
}

function companyEmail(username, domain) {
  return `${username.replace(/[^a-z0-9.-]/gi, "")}@${domain}`;
}

async function findExisting(prisma, row, email) {
  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) return byEmail;

  for (const legacy of row.legacyEmails || []) {
    const u = await prisma.user.findUnique({ where: { email: legacy } });
    if (u) return u;
  }

  // Single-identity match by exact full name among active users
  const named = await prisma.user.findMany({
    where: { fullName: row.employeeName, status: "active", deletedAt: null },
  });
  if (named.length === 1) return named[0];
  if (named.length > 1) {
    throw new Error(
      `Ambiguous active users named "${row.employeeName}" (${named.length}). Resolve manually.`,
    );
  }
  return null;
}

function renderReport(rows, meta) {
  const generatedAt = new Date().toISOString();
  const lines = [
    "# Initial Staff Accounts — ADMIN ONLY",
    "",
    "**CONFIDENTIAL.** Generated once for the administrator. Do not commit.",
    "",
    `- Generated: ${generatedAt}`,
    `- Login: https://shanghaitravels.com.bd/erp/#/login`,
    `- Auth: email + temporary password (username is the email local-part slug)`,
    `- All accounts: status=Active, mustChangePassword=true`,
    `- Emails / phones / departments are placeholders — update from Staff Profile`,
    "",
    "## Duplicate-name resolution",
    "",
    "- **Mohammad Liton**: treated as **one** employee (Chairman → `super_admin`).",
    "- A separate **Super Admin** system account was also provisioned.",
    "",
    "## Accounts",
    "",
    "| Employee Name | Username | Email | Role | Department | Temporary Password | mustChangePassword |",
    "|---|---|---|---|---|---|---|",
  ];

  for (const r of rows) {
    lines.push(
      `| ${r.employeeName} | \`${r.username}\` | ${r.email} | ${r.roleLabel} | ${r.department} | \`${r.tempPassword}\` | ${r.mustChangePassword} |`,
    );
  }

  lines.push(
    "",
    "## Operator checklist",
    "",
    "1. Deliver each temporary password securely (out-of-band).",
    "2. User signs in → forced change-password gate.",
    "3. Update email / phone / department from profile (or admin user edit).",
    "4. Destroy or lock down this file after delivery (`chmod 600`).",
    "",
    `Roster meta domain: \`${meta.domain}\` · branch: \`${meta.branchId}\``,
    "",
  );
  return lines.join("\n");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required (source /opt/st-erp-api/.env).");
    process.exit(1);
  }

  const roster = JSON.parse(fs.readFileSync(ROSTER_PATH, "utf8"));
  const { meta, roleMap, staff } = roster;
  const prisma = new PrismaClient();

  try {
    const roles = await prisma.role.findMany({ select: { id: true, name: true } });
    const roleId = Object.fromEntries(roles.map((r) => [r.name, r.id]));
    const branch = await prisma.branch.findUnique({ where: { id: meta.branchId } });
    if (!branch) throw new Error(`Branch ${meta.branchId} not found`);

    // Guard: duplicate employee names in roster (except intentional Super Admin system row)
    const nameCounts = new Map();
    for (const row of staff) {
      nameCounts.set(row.employeeName, (nameCounts.get(row.employeeName) || 0) + 1);
    }
    for (const [name, count] of nameCounts) {
      if (count > 1) {
        throw new Error(
          `Roster lists "${name}" ${count} times. Resolve duplicate identity before provisioning.`,
        );
      }
    }

    const reportRows = [];
    const summary = [];

    for (const row of staff) {
      const roleKey = roleMap[row.designation];
      if (!roleKey || !roleId[roleKey]) {
        throw new Error(`Unknown designation/role mapping: ${row.designation}`);
      }

      const email = companyEmail(row.username, meta.domain);
      const phone = genPhone(row.username);
      const tempPassword = genPassword();
      const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });

      const existing = await findExisting(prisma, row, email);
      let action;

      if (existing) {
        // If target email is taken by a different user, abort
        const emailOwner = await prisma.user.findUnique({ where: { email } });
        if (emailOwner && emailOwner.id !== existing.id) {
          throw new Error(`Email ${email} already owned by another user`);
        }

        await prisma.user.update({
          where: { id: existing.id },
          data: {
            email,
            fullName: row.employeeName,
            phone,
            roleId: roleId[roleKey],
            branchId: meta.branchId,
            status: "active",
            mustChangePassword: true,
            passwordHash,
            deletedAt: null,
          },
        });
        action = existing.email === email ? "UPDATED" : `MIGRATED(${existing.email}→${email})`;
      } else {
        await prisma.user.create({
          data: {
            email,
            fullName: row.employeeName,
            phone,
            roleId: roleId[roleKey],
            branchId: meta.branchId,
            status: "active",
            mustChangePassword: true,
            passwordHash,
          },
        });
        action = "CREATED";
      }

      summary.push(`  ${action.padEnd(28)} ${roleKey.padEnd(18)} ${email}`);
      reportRows.push({
        employeeName: row.employeeName,
        username: row.username,
        email,
        roleLabel: row.designation,
        department: row.department,
        tempPassword,
        mustChangePassword: true,
      });
    }

    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, renderReport(reportRows, meta), { mode: 0o600 });
    fs.chmodSync(REPORT_PATH, 0o600);

    console.log(summary.join("\n"));
    console.log(`\nProvisioned ${reportRows.length} staff accounts.`);
    console.log(`Admin report (chmod 600): ${REPORT_PATH}`);
    console.log("Plaintext passwords are ONLY in that report — not in source/roster.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("ERR:", e.message || e);
  process.exit(1);
});
