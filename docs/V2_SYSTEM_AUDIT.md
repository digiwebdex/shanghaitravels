# Version 2.0 — System Audit

**Branch:** `release/v2.0-rc1`  
**Date:** 2026-07-31  
**Scope:** Production modules only; bugs fixed where clear; no redesign  

Legend: **PASS** / **WARN** / **FAIL** (FAIL = fixed in RC1 or residual risk noted)

---

## 1. Authentication — PASS (after hotfix)

| Check | Result |
|---|---|
| Cookie HttpOnly / SameSite Lax access + refresh | PASS |
| Refresh rotation + hashed refresh tokens | PASS |
| Login rate limit (process-local) | WARN — not multi-instance |
| Frontend `mustChangePassword` redirect | PASS |
| **Server-side `mustChangePassword` enforcement** | PASS — RC1 hotfix in `JwtAuthGuard` + `AgentJwtGuard` |
| Access JWT still valid after password change until TTL | WARN — 8h access TTL |

## 2. Authorization (RBAC) — PASS (after hotfix)

| Check | Result |
|---|---|
| Global JWT + Permissions guards | PASS |
| `super_admin` bypass documented | PASS |
| Frontend `Can` / `RequireAuth` | PASS (UI only) |
| Case / customer branch scope | PASS |
| **Documents branch scope** | PASS — RC1 hotfix |
| **Passport create branch scope** | PASS — RC1 hotfix |
| **OCR list/get/apply branch scope** | PASS — RC1 hotfix |

## 3. Navigation — PASS (v2 modules)

Primary sidebar (`AdminLayout` NAV): Dashboard, Customers, Visa, Air Ticketing, Hotels, Transport, Tours, Hajj & Umrah, Finance ERP, Passports, Case Journey.

Finance subnav covers CoA → Statements/Ledger/Analysis/Closing. Module navs exist for Hotel / Transport / Tour / Hajj.

CRM / HR / Partners / Admin settings not promoted as v2.0 production nav (out of RC1 scope).

## 4. Shared Case architecture — PASS (after hotfix)

Single `Application` spine with service-specific detail tables, stages from workflow templates, events timeline.  
**referenceNo race** mitigated with `nextApplicationReference` (staff / public / agent).

Residual WARN: stage advance is multi-write without a single transaction.

## 5. Documents — PASS (after hotfix)

`GET/POST /applications/:id/documents` now applies the same branch filter as case get. Upload types limited (JPG/PNG/WEBP/PDF, 15 MB).

## 6. Timeline — PASS

`ApplicationEvent` append-only; journey endpoint returns stages + events. Used across visa and booking modules.

## 7. Assignment — PASS

`POST …/assign` validates active staff and writes timeline event.

## 8. Notifications — WARN

B2C intake enqueues in-app notifications for assign roles. Delivery processor still reports `delivered: 0`. Staff bell is non-functional. Accepted RC1 limitation (not a v2 module deliverable).

## 9. Finance posting — PASS / WARN

| Path | Result |
|---|---|
| GL journals (C1) | PASS — period open required to post |
| AR/AP → GL (C2) | PASS — posts via journal engine; WARN non-atomic doc update after JE |
| Banking → GL (C3) | PASS — same pattern WARN |
| Legacy `/payments` / `/expenses` cash wallets | WARN — intentional parallel cash ledger, not GL |

## 10. Journal Engine — PASS / WARN

Balanced lines, period checks, approve/post workflow.  
WARN: draft may fast-post for approvers (documented).  
WARN: void sets status void without auto-reversal (use FS reverse for adjustments).

## 11. AR/AP — PASS

Documents, aging, customer/supplier ledgers, bridges from operational invoice. Smoke coverage green.

## 12. Banking — PASS / WARN

Accounts, movements, cheques, CSV recon, cash position.  
WARN: recon complete allows non-zero difference (operator choice).  
WARN: opening post idempotency not hardened.

## 13. Financial Statements — PASS

`/fs/*` posted-journals-only; opening journals excluded from perpetual asOf. BS/P&L/CF/Equity/TB/analysis/exports/travel-validation covered by smoke.

## 14. Reports — PASS / WARN

GL TB/register, AR/AP aging, banking books, FS statements.  
WARN: operational cash reports can diverge from GL when only wallet payments are used.

## 15. API contracts — PASS / WARN

Frontend `services.ts` covers primary routes for v2 modules. Some backend PATCH/void helpers lack thin client wrappers (non-blocking).

## 16. Database integrity — PASS / WARN

FKs and unique constraints present (`Application.referenceNo` unique).  
WARN: no DB unique on `(applicationId, stageNo)`.

## 17. Migrations — PASS / WARN

20 migrations applied on staging + prod (`prisma migrate status` up to date).  
WARN: two folders share numeric label `_012` but distinct timestamps.

## 18. Production build — PASS

`npm run build` succeeds; artifacts synced to `/erp/`.

## 19. Bundle size — PASS

Main JS ~325 KB / ~101 KB gzip; total dist ~1.1 MB; lazy-loaded case pages.

## 20. Performance — PASS / WARN

Code-split routes; list endpoints paginated.  
WARN: some reports load large JSON into UI `<pre>` for CF/equity/travel-validation (acceptable for RC).

## 21. Security — PASS / WARN (after hotfix)

Hotfixes closed cross-branch document/OCR/passport gaps and password-change bypass.  
WARN: no Nest Helmet; rely on nginx. Rate limits in-memory. Secrets in host `.env` mode 0600 (not in git).

## 22. Accessibility — WARN

Login has `role="alert"` and password toggle `aria-label`. Broader a11y (skip links, full form labelling on all modules) not systematically audited — no RC1 regressions introduced.

## 23. Responsive UI — PASS / WARN

Admin layout collapses sidebar `<1024px`; finance/module pages use responsive grids. Not a full device lab audit.

## 24. Error handling — PASS / WARN

Frontend `ApiError` + banners; React error boundary.  
WARN: no Nest global exception filter / correlation IDs.

## 25. Logging — WARN

Console provider errors (OCR) truncated; passwords/tokens not logged. No centralized structured request logging.

## 26. Audit logs — WARN

`AuditLog` written for GL / AR-AP / Banking / FS control actions. Case ops use `ApplicationEvent`. Broader AuditLog coverage deferred post-RC.

---

## Residual risk summary

| Severity | Item | Disposition |
|---|---|---|
| Fixed RC1 | Auth password gate, branch docs/OCR/passport, APP- ref race | Deployed |
| Accepted | Dual cash wallet, notification delivery, AuditLog breadth | Post-RC tickets |
| Accepted | AR/AP/Banking post atomicity, recon strictness | Post-RC tickets |
