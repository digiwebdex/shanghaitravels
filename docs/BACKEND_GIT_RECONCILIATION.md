# BACKEND_GIT_RECONCILIATION

Enterprise Stabilization — Phase 1 (Backend Source Control Hardening)
Read-only audit performed 2026-08-08. No files were modified during the audit.

---

## 1. Source-of-truth findings

There are **three** copies of the backend on this machine. They are not equal.

| # | Location | Role | src/ files | Status |
|---|----------|------|-----------|--------|
| A | `/opt/shanghai-erp-api` | **AUTHORITATIVE SOURCE** — staging runtime `st-erp-api-staging.service` (:4201), DB `st_erp_staging` | 141 `.ts` | **Newest. Strict superset of B and C.** Not a git repo. |
| B | `/opt/st-erp-api` | Production runtime `st-erp-api.service` (:4200), DB `st_erp_prod` | 141 `.ts` | **Stale copy** (pre-V8). Its own README says "BUILD ONLY: dist/, no src/" — but a `src/` tree is present anyway. |
| C | `ShanghaiTravels-src/erp-api/` (Git) | Partial fragment committed earlier | 17 `.ts` | **Stale fragment**, 12 % coverage. |

`/opt/shanghai-erp-api/README-SOURCE-OF-TRUTH.md` confirms the intended flow:
edit A → `npm run build` → copy `dist/` to B → restart prod.

### Proof that A is a strict superset (no unique work exists in B or C)

* **C (Git) vs A:** 21 of 28 tracked files are byte-identical; 3 differ; 5 are docs that exist only in Git.
  Lines present in C but absent from A: **1**, and that line (`imports: [NotificationsModule],`) is
  superseded by A's `imports: [NotificationsModule, WorkflowModule],`. **Nothing is lost by importing A.**
* **B (prod) vs A:** 8 files differ, 52 lines exist only in B. Every one of those 52 was inspected and is
  the *older revision* of a line A later changed — e.g. B still has the 7-stage visa workflow
  (`Document Collection…`), the old `UNSUPPORTED_SERVICE_TYPES` including `student`/`work`, the
  pre-`expand` `list()` signature, and the pre-blocker `softDelete()`. **Zero unique features in B.**

**Conclusion: import A. No destructive ambiguity. Nothing must be merged or hand-reconciled.**

---

## 2. File delta (what enters Git)

**205 files / 2.3 MB** from `/opt/shanghai-erp-api`, excluding `.env`, `node_modules/`, `dist/`.

| Group | Contents |
|-------|----------|
| `src/**` | 141 `.ts` across 33 modules (auth, applications, customers, partners, finance, accounting, arap, banking, statements, crm, sales, comms, analytics, cms, ocr, pdf, workflow, storage, tasks, hr, admin, public, portals ×3, packages, destinations, reference/catalog controllers, util, rbac) |
| `prisma/` | `schema.prisma` (3 546 lines), `seed.ts` (288 lines), `migrations/` (39 + `migration_lock.toml`) |
| Build config | `package.json`, `package-lock.json` (lockfileVersion 3, 498 entries), `tsconfig.json`, `nest-cli.json` |
| `scripts/` | `ocr-accuracy-report.cjs` |
| Root `*.cjs` | 10 operational seed/setup scripts (`seed-accounts`, `seed-reference`, `seed-ocr`, `seed-workflow-*`, `china-visa-setup`, `set-site-config`, `fix-site-config`, `seed-work-and-active`, `test-agent-setup`) |
| Docs | `README-SOURCE-OF-TRUTH.md`, `OCR_PASSPORT_ACCURACY_REPORT.{md,json}`, `docs/` (same 2 reports) |
| Safe env template | `.env.example` (placeholders only) |

### Files only in Git (preserved, not overwritten)

`erp-api/DESTINATION_INTEGRATIONS.md`, `PACKAGE_ID_INTEGRATIONS.md`, `SCHEMA_DESTINATION_MASTER.md`,
`SCHEMA_PACKAGE_ENGINE.md`, `erp-api/ocr/README.md` — design notes authored in the repo.

### Stale duplicates to be replaced

`erp-api/{destinations,ocr,packages}/*.ts`, `erp-api/prisma/migrations/*` and `erp-api/scripts/*` currently sit at
paths that do not mirror the real tree (`src/` prefix missing). They are superseded by the import and
are removed so the repo holds exactly **one** copy of each file.

---

## 3. Dependency delta

Backend `package.json` has **never been tracked** — the entire manifest is new to Git.
Cross-check of every non-relative import in `src/**` against declared dependencies:

* **All V5/V6/V8–V15 dependencies are present and genuinely imported:**
  `nodemailer`, `pdfkit`, `qrcode`, `@nestjs/schedule`, `helmet`, `@nestjs/throttler`, `class-validator`,
  plus `@nestjs/{common,config,core,jwt,platform-express}`, `@prisma/client`, `argon2`,
  `class-transformer`, `cookie-parser`, `sharp`.
* **`reflect-metadata`, `rxjs`** — declared, not directly imported: required NestJS 11 framework peers. **Keep.**
* **`express`** — imported for types (`import { Response } from "express"`) but only present transitively via
  `@nestjs/platform-express`; `@types/express` *is* a declared devDependency. Build resolves correctly today.
  **Finding only — not changed**, per the "do not add unused dependencies / do not modify behavior" rule.
* **No unused dependency found. No dependency needs to be added for the build to pass.**

---

## 4. Migration delta

39 migration directories + `migration_lock.toml` in `/opt`; **only 2 were tracked in Git**
(`028_package_engine`, `029_destination_master`) — both byte-identical. **37 migrations enter Git.**

Range: `20260723000001_001_foundation` → `20260808005729_visa_collected_delivered`.

| Programme | Migrations |
|-----------|-----------|
| Foundation → services | 001–011 |
| Checklist / catalogs / verticals | 012–015 (incl. duplicate-numbered `012_hotel_meal_plan`, distinct timestamp — harmless) |
| Finance (GL, AR/AP, banking, statements) | 016–019 |
| CRM / sales / comms / analytics / CMS | 020–024 |
| Portals (customer, agent, corporate) | 025–027 |
| Package + destination engines | 028–029 |
| **V5 finance** | 030 invoice lifecycle |
| **V6 agent + Wave 1** | 031 onboarding · 032 customer ownership · 033 commission · 034 wallet · 035 perf indexes |
| **Hardening / onboarding** | 036 onboarding profile · 037 agent deletedBy |
| **V8 Visa** | `visa_collected_delivered` |

**V9–V15 required no schema change** (Ticket/Hotel/Transport/Tour/Hajj/Student/Manpower reused existing
detail tables) — confirming the "no schema redesign" rule held.

### ⚠ Drift finding (report only — history NOT modified)

`_prisma_migrations` on staging shows **38 applied**, but there are **39 files**.
`20260808005729_visa_collected_delivered` was applied by hand with `psql`, so Prisma has no history row —
though the columns *do* exist. Its SQL uses `ADD COLUMN IF NOT EXISTS`, so a future `prisma migrate deploy`
is a safe no-op that will simply record it. **No duplicate migration was created and no history row was
altered**, per instruction.

---

## 5. Config / security exclusions (never to be committed)

| Path | Reason |
|------|--------|
| `/opt/shanghai-erp-api/.env` | **Live secrets** — DB password, `JWT_ACCESS/REFRESH/AGENT/CUSTOMER/CORPORATE_SECRET`, `GOOGLE_VISION_API_KEY`. Stays `chmod 600` on disk only. |
| `node_modules/` (307 MB) | Reproducible from lockfile. |
| `dist/` (3.2 MB) | Build output. |
| `/var/data/st-erp/uploads` | Customer passports/documents — **outside** the source tree; nothing to exclude inside it. |

**Scan result:** no `*.pem`, `*.key`, `*.p12`, `*.sql.gz`, `*.dump`, `*.tar.gz`, `*.sqlite`, `*.bak` anywhere
in the tree. No database dumps, backups or uploads inside `/opt/shanghai-erp-api`.

`OCR_PASSPORT_ACCURACY_REPORT.json` was PII-audited: its `passportNo` / `dateOfBirth` occurrences are
**boolean field-presence flags** (`"passportNo": true`) and field-name arrays — **no passport numbers, names
or dates of birth are present.** Safe to commit.

`.env.example` contains placeholders only — safe and useful as the config contract.

---

## 6. Recommended repository layout

Keep the existing `erp-api/` directory (already the repo's backend slot) and make it a faithful mirror:

```
erp-api/
├─ src/**                     # 141 .ts — the real tree, src/ prefix preserved
├─ prisma/{schema.prisma,seed.ts,migrations/**}
├─ scripts/ocr-accuracy-report.cjs
├─ package.json · package-lock.json · tsconfig.json · nest-cli.json
├─ .env.example               # never .env
├─ *.cjs                      # operational seed/setup scripts
├─ docs/ · README-SOURCE-OF-TRUTH.md · OCR_PASSPORT_ACCURACY_REPORT.*
└─ (preserved) DESTINATION_INTEGRATIONS.md, PACKAGE_ID_INTEGRATIONS.md,
   SCHEMA_DESTINATION_MASTER.md, SCHEMA_PACKAGE_ENGINE.md, src/ocr/README.md
```

Rationale: no new top-level directory, no route/deploy-script churn, and the `src/` prefix makes the Git
tree diffable 1:1 against `/opt` forever after.

`.gitignore` additions: `erp-api/node_modules/`, `erp-api/dist/` (the existing global `node_modules/`,
`dist/`, `.env*` rules already cover most of this; explicit entries are added for clarity).

---

## 7. Rollback plan

The import is **additive to Git and inert to every runtime**. Nothing is deleted from `/opt`; no service is
restarted; no migration is run; no credential is touched.

| Scenario | Action |
|----------|--------|
| Undo before commit | `git restore --staged erp-api && git checkout -- erp-api` (or `git clean -fd erp-api` for new files) |
| Undo after commit (not pushed) | `git revert <hash>` — or `git reset --hard HEAD~1`, since nothing is pushed |
| Runtime damaged (cannot happen — nothing is written to `/opt`) | `/opt/shanghai-erp-api` remains the live, untouched source; `systemctl restart st-erp-api-staging` restores service |
| Verification build pollutes `/opt` | Build verification is performed in a **temporary copy**, never in `/opt` |

Production (`/opt/st-erp-api`, :4200) is **not touched at any point in this phase.**

---

## 8. Open items for later phases (not actioned here)

1. **Prod source drift** — `/opt/st-erp-api/src` is a stale pre-V8 tree that contradicts its own
   "no src/" README. Recommend deleting it at prod-promotion time so `dist/` is unambiguously the only
   prod artifact. **Owner-gated; not touched.**
2. **Prisma history gap** — one applied-by-hand migration lacks its `_prisma_migrations` row (see §4).
3. **`express`** should arguably become an explicit dependency (see §3).
