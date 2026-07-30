# Phase A Completion — Visa Vertical (Live API)

**Completed:** 2026-07-30  
**ERP base:** `/api2` → NestJS `:4200`  
**UI:** Figma Admin chrome + TravelOS tokens; live data only (no mock rows)

---

## Workflow coverage

| Step | UI surface | API |
|---|---|---|
| Lead / intake context | Dashboard + new case from customer | Existing public intake remains separate; staff creates customers/cases |
| Customer | `/#/customers` | `GET/POST/PATCH /customers` |
| Passport | `/#/passports` + case workspace | `POST /passports` |
| OCR | Passports + case workspace | `POST /ocr/scan` (+ apply when available); **503 handled** when gated |
| Visa application | `/#/visa`, `/#/visa/new`, `/#/visa/:id` | `POST /applications`, `PUT …/visa` |
| Document upload | Case workspace | `GET/POST /applications/:id/documents` |
| Checklist | Case workspace | `china_visa_checklist` setting (fallback defaults) |
| Invoice | Case workspace | `POST /invoices`, `POST …/issue` |
| Payment | Case workspace | `POST /payments` + `GET /accounts` |
| Staff assignment | Case workspace | `POST …/assign` + `GET /users` |
| Processing | Stage tracker + Advance | `POST …/advance-stage`, notes |
| Status tracking | Case timeline + history | `GET …/journey`, events |
| Delivery / Archive | Approve + Mark completed | `POST …/approve`, `PATCH status` |

---

## Screens delivered

1. **Login** — Figma portal login visual language; staff-only  
2. **Change password** — hard gate when `mustChangePassword`  
3. **Dashboard** — live counts + recent visa cases  
4. **Customers** — list/search/create/edit/detail (Figma density)  
5. **Visa list** — filter by status; empty states real  
6. **New visa case** — customer + visa type → CVASC stages auto  
7. **Visa case workspace** — details, stages, OCR, checklist, docs, finance, assign, history  
8. **Passports** — manual + OCR  
9. **Case Journey Map** — Figma `CaseTimeline` + live journey  

Live modules (no DemoBadge): `customers`, `passports`, `visa`, `case-journey`.

---

## Quality gates (after Phase A)

```
npm run typecheck   ✅
npm run lint        ✅
npm run build       ✅
```

Deployed to `/var/www/ShanghaiTravels/erp/`.  
`visa-admin/index.html` md5 unchanged (`6873bb1e1d6b29e6c9f1bd216ac8c758`).

---

## How to verify E2E (staff)

1. Open `https://shanghaitravels.com.bd/erp/`  
2. Sign in as `super_admin` (needed for invoice+payment).  
3. Create customer → New Visa Case (China / Tourist L).  
4. Confirm 7 CVASC stages appear.  
5. Save visa details → upload docs → tick checklist.  
6. Advance stages → assign staff → approve.  
7. Create invoice (৳) → Issue → Record payment (Cash/Bank account).  
8. Mark delivered/archive.  
9. Reload case — data persists.

---

## Backend changes

**None.** Phase A consumed existing Nest contracts only.
