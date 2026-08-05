# V6 Wave 1 · Item 1 — Production Communication Layer

**Date:** 2026-08-05 · **Status:** DONE (staging-verified, not deployed to prod, not pushed)
**Roadmap ref:** [`docs/V6_COMMERCIAL_GAP_ANALYSIS.md`](./V6_COMMERCIAL_GAP_ANALYSIS.md) Wave 1 item 1 — the #1 commercial blocker (S1: message delivery was 100% simulated).

## Goal
Replace simulated-only delivery with a real provider architecture across **email, WhatsApp, and SMS**, while keeping simulation mode available for staging/demo. Switching to production must be **env-only, no code change**.

## What was built (backend `/opt/shanghai-erp-api/src`)
Reused the existing `MessagingAdapter` interface + DI tokens (`comms/adapters/messaging.adapter.ts`) — no interface change, no duplication.

- **Real adapters (new):**
  - `comms/adapters/smtp-email.adapter.ts` — SMTP via **nodemailer** (added dep). Env `COMMS_EMAIL_PROVIDER=smtp` + `SMTP_HOST/PORT/SECURE/USER/PASS/FROM`.
  - `comms/adapters/wasender-whatsapp.adapter.ts` — Wasender HTTP API via native `fetch` (Node 22). Env `COMMS_WHATSAPP_PROVIDER=wasender` + `COMMS_WASENDER_API_KEY` (+ optional `COMMS_WASENDER_API_URL`). 15s timeout, error mapping.
  - `comms/adapters/http-sms.adapter.ts` — generic JSON HTTP SMS gateway via `fetch`. Env `COMMS_SMS_PROVIDER=http` + `COMMS_SMS_API_URL` (+ key/sender).
- **Provider architecture (new):** `comms/messaging.module.ts` — one shared module whose factories resolve each channel token to the **real adapter when its provider env names a production provider, else the null/simulate adapter**. Exported so both consumers share the exact same adapters.
- **Simulation preserved:** the three `null-*.adapter.ts` remain the fallback; `COMMS_SIMULATE_DELIVERY=1` still simulates. Removed the misleading "Wasender HTTP client not wired" dead branch from `null-whatsapp.adapter.ts` (Wasender is now a real adapter).
- **CommsModule** now imports `MessagingModule` (dropped the inline null-adapter providers) — send path unchanged.
- **Notifications outbox now DELIVERS (closes the no-op):** `notifications.service.ts` `processPending()` was a hard no-op; it now injects the shared adapters and delivers pending `email/whatsapp/sms` rows — marking `sent` (with `providerMessageId`), `failed` (with error), or leaving `pending` when a channel's adapter is not enabled (no fabricated delivery). In-app rows untouched. `NotificationsModule` imports `MessagingModule`.
- **Config documented** in `.env.example` (provider vars commented; no secrets).

## Reuse / no-duplication
Reused `MessagingAdapter`, the DI tokens, `CommsService.send`, and the `Notification` model (already had `status/error/sentAt`). One shared `MessagingModule` serves both `CommsService` and `NotificationsService` — a single set of adapters, no duplicate delivery code.

## Verification (staging :4201, `COMMS_SIMULATE_DELIVERY=1`)
- `nest build` ✓ (typecheck via nest build; backend has no separate lint script).
- App **boots cleanly** — new DI graph resolves ("Nest application successfully started").
- `POST /notifications/process` → `{processed:100, delivered:100, failed:0, skipped:0}`; rows flip `pending → sent` with `error="simulated"`. Previously this endpoint delivered 0 (no-op).
- Provider selection: with providers unset (staging), tokens resolve to null/simulate; setting `COMMS_*_PROVIDER` routes to the real adapter (SMTP/Wasender/HTTP) — verified by code path + boot.

## Production readiness
- ⛔ Not deployed to prod, not pushed. Prod still runs `COMMS_SIMULATE_DELIVERY=1`; to go live, set the provider env vars on prod (SMTP/Wasender/SMS creds) + `npm i` (nodemailer) + build + deploy the `/opt` backend.
- ✅ No schema change. New dep: **nodemailer** (adds to prod deploy debt).
- ✅ Real delivery is opt-in per channel; simulation remains the safe default.

## Files (all in `/opt/shanghai-erp-api`, not under git)
`src/comms/adapters/{smtp-email,wasender-whatsapp,http-sms}.adapter.ts` (new), `src/comms/messaging.module.ts` (new), `src/comms/comms.module.ts`, `src/comms/adapters/null-whatsapp.adapter.ts`, `src/notifications/notifications.service.ts`, `src/notifications/notifications.module.ts`, `.env.example`, `package.json` (+nodemailer).
