# TravelOS — Production Deployment Checklist / Runbook

**Purpose:** deploy the staged work (V5 + V6 Wave 1 + this hardening sprint) to production safely, with backup, migration, smoke-test, and rollback steps. **Owner-gated** — this runbook does not deploy anything itself.

**Topology (verified 2026-08-05):**
- Prod backend: `st-erp-api.service` (systemd, user `www-data`, `WorkingDirectory=/opt/st-erp-api`, `ExecStart=node dist/main.js`, `:4200`), DB `st_erp_prod` (127.0.0.1:5440).
- Source-of-truth: `/opt/shanghai-erp-api` (staging runtime `:4201`, DB `st_erp_staging`).
- Prod frontend: static SPA at `/var/www/ShanghaiTravels`, built from `/var/www/ShanghaiTravels-src/apps/web`, served by nginx (`/api2` → `:4200`).

## Current prod drift (what this deploy ships)
- **DB migrations pending on prod:** `027_corporate_portal` → `034_wallet_ledger` (incl. `030` invoice lifecycle, `031` agent onboarding, `032` customer ownership + backfill, `033` commission engine, `034` wallet ledger) **plus** the new `035` indexes migration from this sprint. Prod is currently "up to date" at its own lower baseline (~026).
- **Backend deps MISSING on prod:** `nodemailer`, `pdfkit`, `qrcode`, `@nestjs/schedule`, `@nestjs/throttler`, `helmet`, `class-validator`, `class-transformer` (the last four added by this hardening sprint). Prod cannot run the new code until `npm ci`.
- **Backend code:** the built `dist/` (comms adapters, workflow seeder, ownership/commission/wallet services, tracking, hardening).
- **Frontend bundle:** current `apps/web` build (ownership UI, commission rules page, wallet card, tracking, etc.).

---

## Pre-deploy (do NOT skip)

- [ ] **Announce a maintenance window** (brief `:4200` restart).
- [ ] **Confirm disk headroom** (`df -h /` ≥ 15% free — see Fix 1; currently ~8%; free more before deploy).
- [ ] **Fresh backup of `st_erp_prod` immediately before deploy** (do not rely on the nightly): run the nightly script or `pg_dump st_erp_prod` and confirm a non-empty, restorable artifact (see Backup Restore Verification, Fix 9).
- [ ] **Snapshot the current prod release** for rollback: note the current `/opt/st-erp-api` git SHA (or tar the current `dist/` + `package.json` + `prisma/`), and record the current migration head.
- [ ] **Review the additive migrations** — all `030`–`035` are additive (new columns nullable, new tables, indexes; backfills fill nulls only). Confirm no destructive step.

## Deploy steps

1. [ ] **Sync source → prod** (`/opt/shanghai-erp-api` → `/opt/st-erp-api`): update the code, `prisma/schema.prisma`, `prisma/migrations/*`, and `package.json`/lockfile via the established mechanism (git pull on the prod checkout, or rsync of source + migrations). Keep `/opt/st-erp-api/.env` untouched.
2. [ ] **Install deps:** `cd /opt/st-erp-api && npm ci` (installs nodemailer/pdfkit/qrcode/@nestjs/schedule/@nestjs/throttler/helmet/class-validator/class-transformer).
3. [ ] **Apply migrations:** `npx prisma migrate deploy` (applies `027`→`035`; backfills run in-migration: ownership `032`, wallet running-balance `034`). Then `npx prisma generate`.
4. [ ] **Build backend:** `npm run build` (nest build).
5. [ ] **Build + deploy frontend:** `cd /var/www/ShanghaiTravels-src/apps/web && npm ci && npm run build`, then publish the bundle to `/var/www/ShanghaiTravels` (per the existing deploy step). Set nginx `client_max_body_size 25m;` on the shanghaitravels site (fixes M1) and reload nginx.
6. [ ] **Restart backend:** `systemctl restart st-erp-api.service` and confirm `active` + boot log "Nest application successfully started" (the workflow seeder auto-installs default templates on boot).

## Configuration to set on prod (blockers C2 / config audit)

- [ ] **Message delivery credentials** (else all OTP/invite/verify/notifications stay simulated — blocker C2). In `/opt/st-erp-api/.env`: `COMMS_EMAIL_PROVIDER=smtp` + `SMTP_*`; `COMMS_WHATSAPP_PROVIDER=wasender` + `COMMS_WASENDER_API_KEY`; `COMMS_SMS_PROVIDER=http` + gateway. Remove/keep `COMMS_SIMULATE_DELIVERY` per go-live decision. Restart.
- [ ] **Automation** stays disabled until delivery verified; enable via `PUT /automation/settings` after a real test send.
- [ ] Confirm `NODE_ENV=production`, `COOKIE_SECURE=true` (already set).

## Smoke tests (post-deploy, on prod)

- [ ] `GET /api/health` → `{ok:true}` (and `/api/health/ready` from Fix 8 → dependencies green).
- [ ] Staff login (`/api/auth/login`) → 200 + cookie.
- [ ] Create + read a customer; create an invoice; record a payment; download an invoice PDF (`/invoices/:id/pdf`).
- [ ] Public: `GET /api/public/track?ref=<known>` and `GET /api/public/verify?no=<known>`.
- [ ] Ownership: assign an agent to a customer; commission: preview an invoice; wallet: reconcile an agent — all 200.
- [ ] If delivery configured: trigger one real email/OTP and confirm receipt.
- [ ] Frontend loads at the site root; `/erp/` app boots; login works end-to-end.

## Rollback

- [ ] **App rollback:** redeploy the snapshotted previous `dist/` + `package.json` (`npm ci`), `systemctl restart st-erp-api.service`.
- [ ] **DB rollback:** migrations `030`–`035` are additive, so a code rollback is safe **without** dropping columns (old code ignores new columns/tables). Only if truly required, restore the pre-deploy `st_erp_prod` backup (accepts data loss since deploy — prefer forward-fix).
- [ ] **Frontend rollback:** republish the previous bundle.

## Post-deploy

- [ ] Watch `journalctl -u st-erp-api.service -f` for 10 min (errors/restarts).
- [ ] Confirm the uptime monitor (Fix 7) is green and disk alert armed.
- [ ] Record the new release SHA + migration head as the next rollback point.

---

_This runbook is owner-gated. Nothing here has been executed against production; prod remains at its pre-sprint baseline._
