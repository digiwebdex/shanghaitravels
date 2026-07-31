# Version 2.0 Release Candidate (RC1)

**Tag / branch:** `release/v2.0-rc1`  
**Baseline:** `v2.3-financial-statements` (`c3b9d2b`) + RC1 audit hotfixes  
**Date:** 2026-07-31  
**Status:** Release Candidate — production modules frozen; no new features in this cut  

---

## Production modules (complete)

| Module | Phase / tag |
|---|---|
| Visa | Phase A / B spine |
| Air Ticketing | B1 |
| Hotel | B2 |
| Transport | B3 |
| Tour Packages | B4 |
| Hajj & Umrah | B5 |
| Finance Foundation (GL) | C1 → `v2.0-finance-foundation` |
| Accounts Receivable | C2 → `v2.1-ar-ap` |
| Accounts Payable | C2 → `v2.1-ar-ap` |
| Banking & Cash Management | C3 → `v2.2-banking` |
| Financial Statements | C4 → `v2.3-financial-statements` |

**Explicitly out of scope for v2.0 RC1:** CRM, Website redesign, Portals expansion, AI.

---

## Runtime topology

| Layer | Location |
|---|---|
| Frontend SPA | `/var/www/ShanghaiTravels/erp/` (Vite build of `apps/web`) |
| Nest API SoT | `/opt/shanghai-erp-api` → staging `:4201`, prod `/opt/st-erp-api` → `/api2` |
| Databases | `st_erp_staging` / `st_erp_prod` (Prisma, 20 migrations, up to date) |

---

## Quality gates (RC1)

| Gate | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ |
| ESLint (`--max-warnings 0`) | ✅ |
| Unit tests + coverage | ✅ 33/33 |
| Integration tests (`tests/integration`) | ✅ 2/2 |
| API smoke staging | ✅ 123/123 |
| API smoke production (`/api2`) | ✅ 123/123 |
| Playwright full regression | ✅ 11/11 |
| Production build | ✅ synced to `/erp/` |

### Bundle (production)

| Asset | Size |
|---|---|
| Main chunk `index-*.js` | ~325 KB (~101 KB gzip) |
| Largest lazy case page (Hajj) | ~32 KB |
| Total `dist/` | ~1.1 MB |

---

## RC1 hotfixes (bugs only)

Applied to Nest SoT and deployed staging + prod (no feature work):

1. **mustChangePassword enforced server-side** for staff JWT and agent JWT (allowlist: `me`, `change-password`).  
2. **Document list/upload branch-scoped** to match case RBAC.  
3. **Passport create** rejects customers outside caller branch (non-HQ).  
4. **OCR list/get/apply** branch-scoped for non-HQ; apply validates customer branch.  
5. **Application `referenceNo` allocation** uses collision-safe helper (staff, public intake, agent portal).

---

## Known limitations (accepted for RC1)

Documented in `V2_SYSTEM_AUDIT.md` — not treated as blockers for RC1 freeze:

- Dual cash ledger (`Account`/`LedgerEntry`/`Payment`) remains alongside double-entry GL (intentional C1 design).  
- Journal draft fast-post and void-without-reversal remain C1 semantics (statements use posted-only; void removes from reports).  
- Notification delivery worker still no-op (`delivered: 0`); in-app enqueue exists for B2C intake.  
- AuditLog coverage is finance-heavy (GL/AR/AP/Banking/FS); ops mutations rely on ApplicationEvent timelines.  
- Helmet/CORS headers expected at nginx edge.  
- Duplicate migration label `_012` (timestamp order still unique; both applied).

---

## Recommendation

**RC1 is suitable for staged production use** of the listed modules, with the security hotfixes above deployed.

Next (post-RC, not in this cut): broaden AuditLog, notification delivery, AR/AP/banking atomic post transactions, and reconciliation strictness — as separate change tickets.

---

## Related docs

- `docs/V2_SYSTEM_AUDIT.md` — 26-area checklist  
- `docs/V2_REGRESSION_REPORT.md` — gate evidence  
- Phase design/completion docs under `docs/PHASEB*` / `docs/PHASEC*`  
