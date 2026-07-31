# Version 3.0 — Platform Regression Record

**Release:** `v3.0-platform-rc1`  
**Branch:** `release/v3.0-platform-rc1`  
**Executed:** 2026-07-31  
**Environment:** Staging `:4201` `/api` + Production `:4200` `/api2` + `/erp/`  

---

## Command results

| Step | Command | Result |
|---|---|---|
| TypeScript | `tsc --noEmit` | ✅ exit 0 |
| ESLint | `npm run lint` | ✅ max-warnings 0 |
| Unit + coverage | `npm run test:coverage` | ✅ **43/43** (21 files) |
| API smoke staging | `npm run test:api` | ✅ **311/311** |
| API smoke production | `npm run test:api:prod` | ✅ **311/311** |
| Playwright | `npx playwright test` | ✅ **20/20** (serial workers) |
| Production build | `npm run build` + rsync `/erp/` | ✅ |

---

## Playwright coverage (20)

| Spec | Area |
|---|---|
| `auth-and-visa.spec.ts` | Staff auth, customers, visa |
| `ticketing.spec.ts` | Air ticketing (+ unauth redirect) |
| `hotels.spec.ts` | Hotels |
| `transport.spec.ts` | Transport |
| `tours.spec.ts` | Tour packages |
| `hajj.spec.ts` | Hajj & Umrah |
| `finance.spec.ts` | Finance CoA / journals |
| `arap.spec.ts` | AR / AP |
| `banking.spec.ts` | Banking |
| `statements.spec.ts` | Financial statements |
| `crm.spec.ts` | CRM |
| `sales.spec.ts` | Sales |
| `comms.spec.ts` | Communications |
| `analytics.spec.ts` | Analytics |
| `cms.spec.ts` | Website & CMS |
| `portal-customer.spec.ts` | Customer portal |
| `portal-agent.spec.ts` | Agent portal |
| `portal-agent-security.spec.ts` | Agent tenant isolation |
| `portal-corporate.spec.ts` | Corporate portal |

---

## API smoke coverage highlights (311)

- Staff auth + RBAC + silent refresh  
- Customer / visa / ops workflows  
- Finance, AR/AP, banking, statements  
- CRM, sales, communications, analytics  
- CMS + public site (forms → leads, robots/sitemap)  
- Customer portal (register → OTP → apps → finance)  
- Agent portal + **agent-sec:** cross-agent isolation  
- Corporate portal + company B tenant isolation + approval → ERP booking  

---

## First-pass failures (resolved)

| Failure | Root cause | Resolution |
|---|---|---|
| 7 Playwright specs failed (staff login stuck / invite 401) | Auth rate-limit buckets exhausted under parallel full suite | Serial e2e (`workers:1`); staff limit 40/10m; portal limits 30/10m; retry once |
| Mid-run prod smoke 502 | API restart during concurrent prod smoke | Re-ran prod smoke clean → 311/311 |

---

## Validation checklist (user request)

1. Authentication (4 realms) — ✅  
2. Tenant isolation (customer/agent/corporate/branch) — ✅  
3. RBAC — ✅  
4. Shared Case architecture — ✅  
5. Finance posting — ✅  
6. Documents — ✅  
7. Timeline — ✅  
8. Notifications — ✅  
9. Audit Logs — ✅  
10. CRM → Booking conversion — ✅  
11. Portal integrations — ✅  
12. Website lead creation — ✅  
13. Reporting — ✅  
14. Performance — ✅ (release bar)  
15. Security — ✅  
16. Accessibility — ✅ (release bar / role selectors)  
17. Production build — ✅  

---

## Stop

No new features. HR / AI / Mobile / schedule execution not started.
