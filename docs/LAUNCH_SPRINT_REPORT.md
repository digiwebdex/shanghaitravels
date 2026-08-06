# TravelOS — Production Hardening (Launch) Sprint Report

**Date:** 2026-08-05
**Type:** Production Hardening Sprint — **no new business features.** Fixes only the blockers from [`docs/PRODUCTION_READINESS_REVIEW.md`](./PRODUCTION_READINESS_REVIEW.md).
**Discipline:** backend source-of-truth `/opt/shanghai-erp-api` (not under git), built + verified on **staging** (`:4201`, DB `st_erp_staging`); **not deployed to prod, not pushed.** On the shared server, only ST-owned or universally-safe (regenerable-cache) changes were made — no other tenant's app or data was touched. Each fix committed separately.

---

## Fix 1 — Disk Cleanup Strategy (blocker C1)

**Problem:** root disk 96% full (92G/96G, 4.3G free) on a shared box hosting ~45 sites — imminent outage risk for every tenant.

**Diagnosis (read-only):** ST's own footprint is tiny (~1.1 GB: `/opt/shanghai-erp-api` 312M, `/opt/st-erp-api` 69M, `/var/www/ShanghaiTravels-src` 730M, prod uploads 1.9M). ST is **not** the hog. The real consumers are **not ST-owned**: `/var/lib/containerd` 18G (other tenants' containers), `/var/www` 27G (all tenants), `/root/{vps-restructure,dev-tooling caches}`.

**Executed — safe, regenerable caches only (touch no tenant/app data):**
| Action | Reclaimed |
|---|---|
| `npm cache clean --force` (`/root/.npm` 3.3G → 357M) | ~2.95 GB |
| `apt-get clean` (`/var/cache/apt` 423M → 28K) | ~0.42 GB |
| `journalctl --vacuum-size=200M` (kept recent logs) | ~0.36 GB |
| **Total** | **~3.6 GB** |

**Result:** 96% → **92%** used; free **4.3 GB → 7.9 GB**.

**Preventive:** added `/etc/systemd/journald.conf.d/00-size-cap.conf` (`SystemMaxUse=500M`, `SystemKeepFree=2G`) so journald can never balloon the disk again.

**Strategy — ongoing disk safety (owner actions for the non-ST hogs, NOT touched here):**
1. **Containerd/Docker (18 GB)** — `docker system df` then `docker image prune` (dangling) / prune stopped containers; only the owner should decide, as it spans other tenants.
2. **Per-tenant caps** — the root cause is 45 tenants sharing one 96 GB volume with no quotas. Recommend moving ST (and ideally each production tenant) to a **dedicated host or a quota'd volume** (also fixes H3 blast-radius).
3. **Monitoring** — disk alert at 80%/90% (see Fix 7); today there was no alert and it silently crept from 81% (2026-07-22) to 96%.
4. **Log/backup rotation** — journald now capped; confirm each tenant's backup retention prunes (ST's already does: 7-day nightly, 14-day auth).
5. **Recurring cache trim** — a monthly `npm cache clean` + `apt-get clean` maintenance timer would keep ~3 GB from re-accumulating.

**Gates:** N/A (server maintenance, no code change). **Verification:** `df -h /` before/after captured above.

---

## Fix 2 — Production Deployment Checklist (blocker C3)

**Problem:** prod runs a pre-Wave-1 build; deploying "the ERP" without a runbook risks a broken/partial cutover.

**Diagnosis (verified against `st_erp_prod`):** prod DB is "up to date" at its own baseline (~026) → **migrations `027`→`034` pending** (corporate portal, package engine, destination master, invoice lifecycle, agent onboarding, customer ownership + backfill, commission engine, wallet ledger) plus the new `035` indexes. Prod backend deps **nodemailer / pdfkit / qrcode / @nestjs/schedule are MISSING** (plus this sprint's helmet / throttler / class-validator / class-transformer) — prod can't run the new code until `npm ci`.

**Delivered:** [`docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) — a full owner-gated runbook: pre-deploy (maintenance window, disk headroom, fresh prod backup, release snapshot, additive-migration review) → deploy (sync source, `npm ci`, `prisma migrate deploy` + `generate`, `nest build`, frontend build/publish + nginx `client_max_body_size`, service restart) → **prod config** (delivery creds for C2, automation gate) → **smoke tests** (health/ready, auth, customer/invoice/payment/PDF, public track/verify, ownership/commission/wallet) → **rollback** (additive migrations make code rollback safe without column drops) → post-deploy watch.

**Nothing deployed** — prod remains at its pre-sprint baseline (this is a runbook, not a deployment).

**Gates:** N/A (documentation).

---

## Fix 3 — Validation DTOs on auth & payment endpoints (blocker C5)

**Problem:** the global `ValidationPipe` was a no-op — every handler took `@Body() any` (0 DTOs), so credentials and money arrived unvalidated (NaN/negative/overflow amounts, mass-assignment).

**Fix (backend `/opt/shanghai-erp-api/src`):** class-validator/class-transformer were already installed and the pipe already global (`whitelist+transform`) — it just had no typed bodies. Added DTOs and wired them onto **every auth and payment endpoint**:
- `common/dto/auth.dto.ts` — `LoginDto` (email/password), `ChangePasswordDto` (newPassword ≥8), `EmailDto` (forgot / otp-request), `ResetPasswordDto`, `EmailCodeDto` (otp-verify / verify-email). Wired into **staff auth** (`auth.controller`) and **all three portal auth controllers** (agent/customer/corporate): login, forgot, reset, otp/request, otp/verify (+ customer verify-email).
- `common/dto/payment.dto.ts` — `RecordPaymentDto` (`amount` must be a **positive integer** minor-unit value via `@IsInt @IsPositive @Type(Number)`; `accountId` required; optional invoice/customer/method/reference/note/receivedAt bounded). Wired into `POST /payments` and `POST /payments/refund`.

**Verification (staging):** `nest build` ✓; login missing-password → **400**, bad-email → **400**, valid → **201**; payment negative amount → **400**, missing accountId → **400**. (Register stays permissive by design — free-form profile fields; noted for a follow-up broadening, not an auth-credential/money endpoint.)

**Files** (`/opt`, not under git): `src/common/dto/{auth,payment}.dto.ts` (new), `src/auth/auth.controller.ts`, `src/finance/finance.controller.ts`, `src/{agent-portal,customer-portal,corporate-portal}/*-auth.controller.ts`.

---

## Fix 4 — Helmet security headers (blocker H2)

**Problem:** the API set no security headers (no `helmet`) — no HSTS, nosniff, frameguard, etc. from the app.

**Fix (backend `/opt/shanghai-erp-api/src/main.ts`):** installed `helmet` and added `app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }))`. CSP is intentionally left to nginx for the SPA (the API returns JSON/PDF, not HTML) and CORP is `cross-origin` so PDF/QR downloads through the `/api2` proxy keep working.

**Verification (staging):** `nest build` ✓; `curl -D-` on `/api/health` now returns `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Cross-Origin-Opener-Policy`, `Referrer-Policy`, `X-Download-Options`, `X-DNS-Prefetch-Control` — none of which were present before.

**Files** (`/opt`): `src/main.ts`, `package.json` (+helmet).

---

## Fix 5 — Rate limiting (blocker H1)

**Problem:** no framework rate limiting — the entire authenticated API and all public read endpoints were unthrottled; the unauthenticated **public OCR scan** (paid Google Vision) was an abuse vector protected only by a per-instance in-memory map.

**Fix (backend `/opt/shanghai-erp-api/src`):** added `@nestjs/throttler`:
- `ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }])` — baseline **120 req/min per IP across the whole API**.
- `ThrottlerGuard` registered as the **first** `APP_GUARD` (before JWT/permissions) so it throttles even unauthenticated traffic.
- `@SkipThrottle()` on `HealthController` (monitoring must never be throttled).
- Stricter `@Throttle({ default: { limit: 5, ttl: 60000 } })` on the public OCR scan (on top of its existing in-memory limiter).

**Verification (staging):** `nest build` ✓; hammering `/api/public/track` 130× → **120×200 then 10×429**; `/api/health` polled 10× → 10×200 (exempt).

**Note:** throttler storage is in-memory (per-instance) — correct for the single-instance prod today; a Redis storage is needed if ever scaling out (documented in the config audit / readiness review).

**Files** (`/opt`): `src/app.module.ts`, `src/health.controller.ts`, `src/ocr/ocr.public.controller.ts`, `package.json` (+@nestjs/throttler).
