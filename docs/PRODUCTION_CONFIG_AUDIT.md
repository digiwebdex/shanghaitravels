# TravelOS — Production Configuration Audit

**Date:** 2026-08-06 · Part of the Production Hardening Sprint (Fix 10). Audits prod runtime config (env, systemd, nginx, TLS) against production best practice. **Applied** = safe ST-scoped change made this sprint; **Owner-gated** = documented, not applied (prod app/global changes require owner sign-off).

## Environment (`/opt/st-erp-api/.env`)

| Setting | Value | Verdict |
|---|---|---|
| `NODE_ENV` | `production` | ✅ |
| `COOKIE_SECURE` | `true` | ✅ (HTTPS via Cloudflare/nginx) |
| `ACCESS_TTL` | `8h` | ⚠️ longer-lived access token; acceptable (refresh rotation is sound) — consider shortening |
| `COMMS_SIMULATE_DELIVERY` | `1` | 🔴 **Owner-gated:** delivery is simulated → no real OTP/invite/verify/notifications. Set `COMMS_EMAIL_PROVIDER=smtp` + `SMTP_*`, `COMMS_WHATSAPP_PROVIDER=wasender` + key, `COMMS_SMS_PROVIDER=http` + gateway (blocker C2). |
| `OCR_APPROVED` | `true` | ✅ (OCR usable) — note staging + prod share one Vision key (billing concentration) |
| Secrets (`JWT_*`, DB) | env, `640 root:www-data` | ✅ not hardcoded; app binds `127.0.0.1` |

## systemd (`st-erp-api.service`)

| Setting | Before | After | Verdict |
|---|---|---|---|
| `Restart` | `always` (RestartSec=3) | — | ✅ |
| User | `www-data` | — | ✅ non-root |
| **`MemoryMax`** | *(none)* | **`768M`** (`MemoryHigh=640M`) | ✅ **Applied** — caps OOM blast radius on the shared box (H3) |
| **`LimitNOFILE`** | default | **`65535`** | ✅ **Applied** |
| **`NoNewPrivileges` / `PrivateTmp`** | — | `true` | ✅ **Applied** (filesystem hardening) |

Applied via drop-in `/etc/systemd/system/st-erp-api.service.d/10-hardening.conf` (+ same for staging), `daemon-reload`. MemoryMax is enforced immediately (cgroup); rlimits take effect on next service restart. Version-controlled at `deploy/ops/systemd/`.

## nginx (`sites-available/shanghaitravels`)

| Setting | Before | After | Verdict |
|---|---|---|---|
| Security headers (nosniff/frame/referrer) | present | — | ✅ |
| **`client_max_body_size`** on `/api2` | *(default 1m → 15-20MB uploads 413)* | **`25m`** | ✅ **Applied** (tested `nginx -t`, graceful reload) — fixes M1 |
| CSP / HSTS at nginx | absent | — | ⚠️ Owner-gated: add HSTS + a CSP for the SPA (helmet now covers the API; the SPA origin should too) |
| `/admin`, `/staff` | `return 404` | — | ✅ edge-blocked |

## TLS (`nginx.conf`, global — shared by all tenants)

| Setting | Value | Verdict |
|---|---|---|
| `ssl_protocols` | `TLSv1 TLSv1.1 TLSv1.2 TLSv1.3` | 🔴 **Owner-gated (global — affects all tenants):** drop `TLSv1 TLSv1.1` (deprecated/insecure). Change to `TLSv1.2 TLSv1.3` after confirming no legacy-client dependency across tenants. |

## Cross-cutting (owner-gated)

- **Dedicated host / quotas (H3):** ST prod shares one 96 GB volume + one Postgres with ~45 tenants. A first paying customer should be on a dedicated host or a quota'd volume; MemoryMax now caps memory blast radius but disk/DB are still shared.
- **Rate-limit store (H1):** throttler is in-memory (fine at 1 instance); needs Redis storage before scaling out.
- **Automation (H7):** keep disabled until delivery is real; enable via `PUT /automation/settings` after a verified send.
- **Leader election (H5):** required before running >1 instance with automation (avoid duplicate cron sends).

## Summary

**Applied this sprint (safe, ST-scoped):** systemd MemoryMax/rlimit/hardening drop-ins; nginx `/api2` `client_max_body_size 25m`.
**Owner-gated (documented):** delivery credentials (C2), global TLS 1.0/1.1 removal, nginx HSTS/CSP, dedicated host/quotas, Redis throttler store, automation enablement, leader election.
