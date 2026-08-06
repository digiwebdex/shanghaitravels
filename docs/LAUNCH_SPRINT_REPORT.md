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
