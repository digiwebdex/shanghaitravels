# V5 Finance — Phase 5 Report: Enterprise Automation & Reminder Engine

**Status: DONE (scheduler + reminders + retry + event automation + dashboard), verified on staging. No prod deploy, no push.**
Continuation of the approved V5 finance architecture. No redesign; **reuses `CommsService` / `Communication` /
`AuditLog` / `Setting` — no duplicate notification engine. No new schema/migration** (AuditLog is the automation log).

## 1. Architecture review (Phases 1–5)
Phase 1 detail page · Phase 2 lifecycle+audit (migration 030 staging) · Phase 3 communication (invoice templates) ·
Phase 4 PDF engine + QR verify · **Phase 5 automation** = `@nestjs/schedule` cron jobs + a reusable event→notify
method, all calling the existing `CommsService`. Delivery stays **simulation-safe**: disabled by default in prod
(cron no-ops), and adapters simulate until Wasender/SMTP creds.

## 2. Reuse inventory
| Need | Reused (no duplication) | Location |
|---|---|---|
| Send WhatsApp/Email/SMS | `CommsService.send` | `automation.service.notify` |
| Retry a failed message | **new** `CommsService.resendMessage` (reuses the adapter — no dup) | `comms.service.ts` |
| Automation log / history | `AuditLog` (`action=automation.*`) | `automation.service.audit` |
| Admin config | `Setting` (`automation_config`) + upsert pattern | `automation.service.config/setConfig` |
| Scheduler runtime | `@nestjs/schedule` `ScheduleModule.forRoot()` (approved; not external cron) | `automation.module` |
| Templates | Phase 3 `inv_*` / `*_reminder` | comms |
| Dashboard UI | `ListPageShell`/`DataTable`/`Pill`/tokens | `AutomationDashboardPage` |
**New dependency:** `@nestjs/schedule`.

## 3. Automation matrix (event → notify, reusing CommsService)
| Event | Wired now | Notify |
|---|---|---|
| Invoice Approved / Sent | ✅ (finance transitions → `auto.notify`) | customer message |
| Payment Received / Refund | ✅ (recordPayment → `auto.notify`) | customer message |
| Payment Due / Overdue | ✅ (reminder scheduler) | reminder |
| Passport Expiry | ✅ (reminder scheduler) | reminder |
| Booking Created/Updated/Approved/Cancelled/Completed, Stage Changed, Document Uploaded, OCR Completed, Visa Expiry, Delivery Assigned/Out/Delivered | 🟡 same one-line `applicationsService → auto.notify(event, ctx)` hook; documented, additive (no engine change) | reminder/notify |
Every commercial event calls the **single** `AutomationService.notify(event, ctx)` — adding an event is one line
at the existing transition point; **no rewrite**. Each notify writes an `AuditLog` (`automation.<event>.sent/failed/skipped`).

## 4. Scheduler matrix (`@nestjs/schedule`)
| Job | Cron | Does |
|---|---|---|
| `dailyReminders` | `0 3 * * *` | payment due/overdue + passport-expiry sweep → notify |
| `retrySweep` | `*/15 * * * *` | re-dispatch failed messages (≤3) |
Both check `config.enabled` first (disabled ⇒ no-op, prod-safe). Manual triggers: `POST /automation/run/:job`.
Dashboard: `GET /automation/status` (jobs registry: cron/last-run/runs/failures + recent events).

## 5. Reminder matrix
- **Payment**: 1 day before due · due today · 1 / 3 / 7 days overdue (invoice status excludes `paid`, so matches are outstanding).
- **Passport expiry**: 30 / 15 / 7 / 1 days.
- **Visa expiry** (30/15/7): documented follow-up — visa detail expiry field mapping (same sweep pattern, additive).
Verified on staging: reminder sweep ran (passport scan; 0 due-window matches on current data — honest, not fabricated).

## 6. Retry strategy
`RetryProcessor` (`runRetries`, every 15 min) finds `CommMessage.status="failed"`, counts prior
`automation.retry` audit rows, and retries via `CommsService.resendMessage` up to **3 attempts** — **in place**
(same message + thread, no duplicates). Each attempt is audited. Applies to WhatsApp/Email/SMS uniformly.

## 7. Security
RBAC: automation endpoints require `settings:manage`. Sends resolve the customer's own contact; comms writes are
branch-tagged. Every scheduled action, retry, success and failure writes an `AuditLog` row.

## 8. Future-ready design
No rewrite for Phase 6 (reports/portals/search): the automation `AuditLog` rows feed a notification report and the
global search; portal notification centers read the same `Communication`/`Notification` rows; remaining events plug
into `notify()`. Admin settings (enable/disable, channel priority, business hours, holiday-skip) live in one
`Setting` and are read by every job. Master plan: `docs/V5_FINANCE_COMMERCIAL_COMPLETION.md`.

## 9. Production readiness
Verified on staging `:4201`: enable settings, run reminders/retries, **event automation** (invoice approve →
`automation.invoice.approved.sent`), dashboard status. Automation is **disabled by default in prod** and delivery is
simulation-only until Wasender/SMTP creds — production-ready architecture, safe to deploy dark. typecheck/lint/build pass.
