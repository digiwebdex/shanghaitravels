# Authentication Entry System

**Date:** 2026-07-31  
**Scope:** Public website header UI/UX only  
**Non-goals:** No auth logic, JWT, RBAC, API, database, or portal business features

---

## Purpose

Give visitors a clear way to reach the correct TravelOS workspace from the marketing site header:

- **Login** → workspace chooser  
- **Register** → account-type chooser (customer / agent interest only)

Staff and Corporate accounts are **not** self-registered.

---

## Surfaces

| Surface | Implementation |
|---|---|
| Production public site | Injector: `/assets/auth-entry.js` + `/assets/auth-entry.css` (loaded from `index.html`) |
| Source of truth (React) | `figma-design/src/components/AuthEntryMenus.tsx` + `Layout.tsx` |

**Why an injector?** The live Bangladesh-localized SPA is ahead of `figma-design` source. A full Vite rebuild of the marketing app would regress Dhaka content. The injector mounts Login/Register on the existing header without replacing the BD bundle. React components are ready for the next full public rebuild once localization is merged into source.

---

## Header (Desktop + Mobile)

Top-right (desktop) / Account section (mobile menu):

| Control | Behavior |
|---|---|
| **Login** | Popover — “Welcome Back” / “Choose your workspace” |
| **Register** | Popover — “Create Account” / “Choose account type” |

Existing nav (Home, Services, …) is unchanged.

---

## Login targets

| Item | Description | URL |
|---|---|---|
| Staff ERP | Internal employees & administrators | `/erp/#/login` |
| Corporate Portal | Corporate travel managers | `/erp/#/portal/corporate/login` |
| Agent Portal | Travel partners & B2B agents | `/erp/#/portal/agent/login` |
| Customer Portal | Track applications, payments & documents | `/erp/#/portal/customer/login` |

---

## Register targets

| Item | Description | URL |
|---|---|---|
| Become an Agent | Partner interest landing (invite-only; no self-signup API) | `/erp/#/portal/agent/register` |
| Customer Registration | Create customer account | `/erp/#/portal/customer/register` |

**Corporate footer in Register menu**

- Title: Need Corporate Access?  
- Copy: Corporate accounts are created by our sales team.  
- Button: **Contact Sales** → `/contact`

### Explicitly not shown

- Staff registration  
- Corporate registration  

---

## Agent register landing (UI only)

`apps/web` exposes a **static** public page at `/portal/agent/register`:

- Explains invitation-only onboarding  
- CTAs: Contact Sales (`/contact`), Already invited → agent login  
- **No** registration API, JWT, or DB writes  

---

## Accessibility & UX

- `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-label` on triggers  
- Menus use `role="menu"` / `menuitem`  
- Escape + outside click dismiss  
- ArrowDown / Enter / Space open menu  
- Focusable links; hover motion on icons/arrows  
- Brand tokens: navy `#14213D`, accent `#F97316`, soft shadow, rounded panels  
- Dark-mode compatible styles (`.dark` / CSS variables)  
- Responsive: desktop popovers; mobile expandable cards inside the hamburger menu  

---

## Deploy notes

```bash
# Marketing injector (does not rebuild BD SPA)
cp figma-design/src/auth-entry/auth-entry.inject.js /var/www/ShanghaiTravels/assets/auth-entry.js
cp figma-design/src/auth-entry/auth-entry.css       /var/www/ShanghaiTravels/assets/auth-entry.css
# Ensure index.html includes:
#   <link rel="stylesheet" href="/assets/auth-entry.css" />
#   <script defer src="/assets/auth-entry.js"></script>

# ERP shell (only if agent register page / other apps/web UI changed)
cd apps/web && npm run build
rsync -a --delete dist/ /var/www/ShanghaiTravels/erp/
```

Do **not** rsync `figma-design` build over document root until BD localization is in source.

---

## Verification checklist

| Check | Result |
|---|---|
| Header shows Login + Register | ✅ |
| Login → Staff ERP | ✅ `/erp/#/login` |
| Login → Corporate / Agent / Customer | ✅ portal login hashes |
| Register → Customer Registration | ✅ `/erp/#/portal/customer/register` |
| Register → Become an Agent | ✅ `/erp/#/portal/agent/register` (static landing) |
| Contact Sales | ✅ `/contact` |
| No staff/corporate register entries | ✅ |
| Mobile Account section | ✅ injector mounts in mobile CTA host |
| Auth / API / RBAC unchanged | ✅ |

---

## Files touched

```
figma-design/src/components/AuthEntryMenus.tsx   # React Auth Entry
figma-design/src/components/Layout.tsx           # wires desktop + mobile
figma-design/src/auth-entry/auth-entry.inject.js # production injector
figma-design/src/auth-entry/auth-entry.css
index.html                                       # loads injector
assets/auth-entry.js / auth-entry.css            # deployed copies
apps/web/.../AgentRegisterPage.tsx               # UI landing only
apps/web/src/app/routes.tsx                      # public route for landing
docs/AUTH_ENTRY_SYSTEM.md
```
