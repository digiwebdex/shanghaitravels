# Missing Features — TravelOS Consolidated Backlog

**Audit date:** 2026-07-30  
**Sources:** Figma inventory, Nest phase specs, visa-admin capabilities, owner directives.

Status tags: `UI` `API` `DB` `OPS` `CONTENT`

---

## 1. Critical path (block production ERP UX)

| ID | Feature | Tags | Notes |
|---|---|---|---|
| C1 | Production React app from `figma-design` with Nest wiring | UI | Replace mocks; BDT locale |
| C2 | Staff AuthProvider / RequireAuth / Can / DemoBadge | UI | Per phase1 spec |
| C3 | Figma AdminLayout shell live under `/visa-admin` or `/erp` | UI OPS | Keep nginx protection for mock `/admin` until ready |
| C4 | Customers module (Figma) on live API | UI | Behavior exists in stopgap |
| C5 | Visa case workspace (stages, journey, docs, passport, approve) | UI | Pixel Figma VisaModule + CaseTimeline |
| C6 | Invoice create/issue from case + finance basics | UI | Partial in stopgap |
| C7 | Auth cutover `/api` → Nest | OPS | After C1–C6 proven on `/api2` |
| C8 | Preserve visa-admin until cutover complete | OPS | Rollback path |

---

## 2. Admin ERP modules (Figma present, live UI missing)

| ID | Module | Backend | Missing |
|---|---|---|---|
| A1 | Dashboard (real KPIs) | reports + finance summary | UI |
| A2 | CRM | leads/comms | UI |
| A3 | Passports | passports/OCR | UI |
| A4 | Air / Hotel / Transport / Tours | detail upsert | UI |
| A5 | Hajj/Umrah / Student / Medical / Immigration / Insurance / Work | detail upsert | UI (+ Work screen) |
| A6 | Corporate Clients | API | UI |
| A7 | Suppliers | API | UI |
| A8 | Wallet & Commission | API | UI |
| A9 | Tasks & Workflow templates | API | UI |
| A10 | Accounting full (payments, expenses, accounts, ledger) | API | UI |
| A11 | Reports & BI | API | UI **+ missing Figma file** |
| A12 | HR & Payroll | API | UI |
| A13 | CMS | API | UI |
| A14 | Notifications inbox | Partial API | UI + delivery adapters |
| A15 | Download Center | Partial | UI |
| A16 | Settings (org, active_services, checklists, workflows) | API | UI |
| A17 | Case Journey Map | journey API | UI |
| A18 | Global search ⌘K | Compose or new API | UI / API |
| A19 | Branch switcher (BD branches) | Branch model | UI + CONTENT |

---

## 3. Public website

| ID | Feature | Tags |
|---|---|---|
| W1 | Rebuild from Figma with `/api/public/config` driven services | UI API |
| W2 | Inquiry → `/api/public/intake` (all services/countries) | UI |
| W3 | Remove fabricated flights/tours/prices | UI CONTENT |
| W4 | China-visa-first content (fees, CVASC checklist) from owner | CONTENT |
| W5 | Blog from CMS pages | UI API |
| W6 | Public OCR autofill on forms (when approved) | UI OPS |

---

## 4. Portals

### Customer portal

| ID | Feature | Tags |
|---|---|---|
| P1 | Customer auth realm (cookie JWT) | API DB |
| P2 | Dashboard / track / documents / invoices scoped to customer | API UI |
| P3 | Apply flow creating real cases | API UI |
| P4 | Online payment | API UI OPS |

### Agent portal

| ID | Feature | Tags |
|---|---|---|
| G1 | Figma agent UI on `/portal/agent` APIs | UI |
| G2 | Staff invite flow UX for AgentUser | UI |
| G3 | Passengers entity | DB API UI |
| G4 | Downloads | API UI |

### Corporate / Supplier portals

| ID | Feature | Tags |
|---|---|---|
| X1 | Corporate auth + employees/approvals/credit/reports | DB API UI (deferred) |
| X2 | Supplier auth + requests/invoices/payments | DB API UI (deferred) |

### Staff portal

| ID | Feature | Decision |
|---|---|---|
| S1 | Separate `/staff` app | Prefer merge into Admin; else wire subset |
| S2 | Internal Chat | Missing entirely — cut or new project |
| S3 | Calendar | Missing — use Tasks due dates interim |

---

## 5. Platform / compliance

| ID | Feature | Tags |
|---|---|---|
| O1 | Enable OCR after privacy approval (`OCR_APPROVED`) | OPS |
| O2 | OCR retention/cleanup job | API OPS |
| O3 | SMTP email delivery for notifications | OPS API |
| O4 | WhatsApp delivery | OPS API |
| O5 | Document verify endpoint + UI | API UI |
| O6 | Explicit reject / embassy-submit endpoints | API |
| O7 | PDF invoice/receipt generation | API |
| O8 | Automated test suite (API + critical UI) | OPS |
| O9 | Git repo + CI for web app | OPS |
| O10 | Code-split production bundle (&lt;2.4MB monolith) | UI |
| O11 | Role/permission admin UI | UI API |
| O12 | Audit log viewer | UI API |

---

## 6. Explicitly out of scope / deferred

| Item | Reason |
|---|---|
| GDS / live air-hotel inventory | Product rule: manual fulfilment |
| Full double-entry GL / multi-currency | Deferred by design |
| Manpower recruitment ATS | Owner hold — `work` visa only |
| Redesigning Figma visuals | Forbidden |
| Promoting Figma mock data to prod | Forbidden |
| Corporate/supplier login without security review | Deferred |

---

## 7. Working features to preserve

Do not regress:

- Nest staff auth cookies + RBAC  
- Customer + multi-service case create/advance/approve  
- Document upload, passport save, OCR scan path  
- Invoice create/issue (minor units)  
- Staff user create with temp password  
- Public config/countries/intake  
- Agent portal API isolation  
- Encrypted backups + cutover rollback scripts  
- nginx `/api/public` carve-out and `/visa-admin` no-store  

---

## 8. Priority stack (for roadmap)

1. Figma Admin shell + auth + Customers + Visa vertical (prove E2E)  
2. Finance (payment/expense/accounts) + Tasks + Settings/workflows  
3. Remaining service modules (shared case pattern)  
4. CRM / HR / Partners / Reports / CMS / Notifications UI  
5. Public site rebuild  
6. Agent portal UI  
7. Auth cutover  
8. Customer portal  
9. Notification delivery + OCR on  
10. Corporate/Supplier portals (security design first)
