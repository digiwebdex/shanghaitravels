# Git Setup — Shanghai Travels (TravelOS Phase A baseline)

**Documented:** 2026-07-30  
**Workspace:** `/var/www/ShanghaiTravels`

---

## Repository status

| Item | Value |
|---|---|
| Initialized | Yes (was previously uninitialized) |
| Current branch | `main` |
| Working tree | Clean (after baseline commit) |
| Baseline commit | `5a7a6e14e7f50c984074e642c9940d7ab75444e9` |
| Short hash | `5a7a6e1` |
| Commit subject | `Release Candidate v1.0 - Phase A Complete` |
| Files in baseline | 323 |
| Annotated tag | `v1.0-phase-a` |
| Tag message | Stable production baseline after Phase A stabilization. |
| Tag object | `0b3651029edf46a718ab631ca956833a9da18714` (points at commit above) |
| Remote | `origin` → `https://github.com/digiwebdex/shanghaitravels.git` |
| Tracking | `main` ↔ `origin/main` |
| Pushed | `main` + tag `v1.0-phase-a` (2026-07-30) |

`docs/GIT_SETUP.md` was written immediately after the tag and committed on `main` as a follow-up docs commit (the annotated tag `v1.0-phase-a` still points at the RC baseline hash `5a7a6e1`).

---

## What is tracked

- Public marketing site (`index.html`, `assets/`, media, SEO files)
- TravelOS ERP source (`apps/web/src`, configs, tests)
- Figma design SoT (`figma-design/`)
- Staff stopgaps (`visa-admin/`, `visa-admin-staging/`)
- Project docs (`docs/`)
- Root + app `.gitignore`
- `erp/.gitkeep` (deploy directory placeholder)

## What is ignored (not in Git)

- `node_modules/`, `dist/`, `build/`, coverage & Playwright reports
- `.env`, `.env.*` (except `.env.example`)
- Deployed ERP build: `erp/assets/`, `erp/index.html`
- IDE/OS junk, logs, tmp, cache
- `uploads/temp/` (customer documents live outside this repo under Nest storage, e.g. `/var/data/st-erp/uploads` — not part of this frontend tree)

**Note:** Nest API source of truth remains `/opt/shanghai-erp-api` (separate tree). This repository is the **website + TravelOS frontend + design + docs** baseline.

---

## Safe directory note (this server)

Directory owner is `www-data` while operations often run as `root`. Git may report “dubious ownership”. Prefer a one-shot flag (does not rewrite global config):

```bash
git -c safe.directory=/var/www/ShanghaiTravels status
```

Or, if you choose to persist (optional, owner decision):

```bash
git config --global --add safe.directory /var/www/ShanghaiTravels
```

---

## Remote status

**Configured and pushed.**

```text
origin  https://github.com/digiwebdex/shanghaitravels.git (fetch)
origin  https://github.com/digiwebdex/shanghaitravels.git (push)
```

Repo URL: https://github.com/digiwebdex/shanghaitravels

Verify:

```bash
git -c safe.directory=/var/www/ShanghaiTravels remote -v
git -c safe.directory=/var/www/ShanghaiTravels ls-remote --heads --tags origin
```

Future pushes:

```bash
cd /var/www/ShanghaiTravels
git -c safe.directory=/var/www/ShanghaiTravels push origin main
git -c safe.directory=/var/www/ShanghaiTravels push origin v1.0-phase-a   # only when creating new tags
```

---

## Backup recommendations

1. **Push to GitHub** as soon as the remote exists (commit + tag).  
2. Keep a **server-side archive** of the baseline:

```bash
cd /var/www
tar -czf "/root/backups/ShanghaiTravels-v1.0-phase-a-$(date +%Y%m%d).tar.gz" \
  --exclude='ShanghaiTravels/apps/web/node_modules' \
  --exclude='ShanghaiTravels/apps/web/dist' \
  --exclude='ShanghaiTravels/apps/web/coverage' \
  --exclude='ShanghaiTravels/erp/assets' \
  ShanghaiTravels
```

3. Back up Nest API + DB separately (`/opt/shanghai-erp-api`, `/opt/st-erp-api`, PostgreSQL `st_erp_prod`).  
4. Never back up `.env` / `.env.test` into public remotes; store secrets in a vault or root-only files (mode `0600`).

---

## Restore instructions

### Restore code to this baseline (tagged)

```bash
cd /var/www/ShanghaiTravels
git -c safe.directory=/var/www/ShanghaiTravels fetch origin   # if remote exists
git -c safe.directory=/var/www/ShanghaiTravels checkout v1.0-phase-a
# or reset a branch:
# git checkout main && git reset --hard v1.0-phase-a
```

### Rebuild & redeploy ERP UI after restore

```bash
cd /var/www/ShanghaiTravels/apps/web
cp .env.example .env   # set VITE_ERP_BASE=/api2
npm ci
npm run build
rsync -a --delete dist/ /var/www/ShanghaiTravels/erp/
```

### Verify tag integrity

```bash
git -c safe.directory=/var/www/ShanghaiTravels show v1.0-phase-a
git -c safe.directory=/var/www/ShanghaiTravels rev-parse v1.0-phase-a^{commit}
# expect: 5a7a6e14e7f50c984074e642c9940d7ab75444e9
```

---

## Quick status commands

```bash
cd /var/www/ShanghaiTravels
git -c safe.directory=/var/www/ShanghaiTravels status
git -c safe.directory=/var/www/ShanghaiTravels log -1 --oneline
git -c safe.directory=/var/www/ShanghaiTravels tag -l -n9 v1.0-phase-a
git -c safe.directory=/var/www/ShanghaiTravels remote -v
```
