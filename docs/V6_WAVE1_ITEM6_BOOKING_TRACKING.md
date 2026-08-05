# V6 Wave 1 · Item 6 — Booking Tracking (public + portal)

**Date:** 2026-08-05 · **Status:** DONE (staging-verified, not deployed to prod, not pushed)
**Roadmap ref:** Wave 1 item 6 — completes the public and portal booking-tracking experience.

## Goal
Let customers track a booking's progress: **publicly** (no login, by reference number, like parcel tracking) and **inside the portal** (a proper stage tracker on their applications).

## Backend (`/opt/shanghai-erp-api/src/public`, staging-verified)
- **`GET /public/track?ref=<referenceNo>`** (`@Public`, no auth) → `PublicService.trackBooking`. Returns **customer-safe** fields only: `referenceNo`, `serviceType`, `status`, `currentStage/totalStages`, `title`, masked `customerName`, `updatedAt`, and the stage list (`stageNo/name/status/completedAt`). No finance, notes, or personal data — mirrors the existing `verifyDocument` safety pattern. Unknown ref → `{found:false}`.

## Frontend (repo, gates green)
- **`BookingTracker`** (new reusable component) — stage stepper (done / active / pending icons) + progress bar + status pill; falls back to a friendly "being processed" message when a case has no configured stages. Shared by public + portal.
- **`BookingTrackPage`** (public routes `/track` and `/track/:ref`) — reference input + `BookingTracker`, mirrors the public VerifyPage chrome; deep-linkable.
- **Portal tracking** — `PortalApplicationDetailPage` now renders the same `BookingTracker` (replacing the plain stage list) using the data it already loads, so customers get a real progress view.

## Verification (staging :4201)
- Public `GET /public/track?ref=APP-00226` (no auth) → `found:true`, status, `stage 1/1`, masked name `Portal S.`, stage list. Unknown ref → `found:false`. ✓
- Frontend `tsc` ✓ · eslint ✓ · `npm run build` ✓ (`/track` route + portal tracker).

## Production readiness
- ⛔ Not deployed to prod, not pushed. No schema change. On prod deploy, `/track` is immediately usable (public) and the portal tracker renders on existing customer applications.
- Note: cases created before the workflow seeder (Item 2) may have no stages → the tracker shows the graceful status-only view; new cases get full stage tracking.

## Files
Backend (`/opt`): `src/public/public.service.ts`, `src/public/public.controller.ts`.
Frontend (git): `components/tracking/BookingTracker.tsx` (new), `pages/BookingTrackPage.tsx` (new), `pages/portal/PortalApplicationDetailPage.tsx`, `app/routes.tsx`.
