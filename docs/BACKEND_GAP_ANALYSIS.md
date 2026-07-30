# Backend Gap Analysis — TravelOS / Nest ERP

**Audit date:** 2026-07-30  
**Source of truth:** `/opt/shanghai-erp-api`  
**Prod runtime:** `/opt/st-erp-api`  
**Compared to:** product phase specs + Figma portals

---

## 1. Overall maturity

Backend phases **1–8 + OCR (10) + Agent portal (11)** are implemented and deployed to staging and prod. The system is **API-ahead of UI**. Remaining backend work is mostly:

- Auth cutover (ops)  
- External portal auth realms (customer / corporate / supplier)  
- Notification delivery adapters  
- OCR enablement + retention  
- A few product features implied by Figma but never scoped (chat, calendar, payment gateway)

**Directive:** do not widen backend until Figma admin proves the visa vertical against existing APIs (owner 2026-07-25). Exceptions only for blockers found during UI wiring.

---

## 2. Module status matrix

| Domain | Status | Notes |
|---|---|---|
| Auth (staff) | DONE | Cookie JWT; change-password; refresh |
| Auth cutover | PENDING | `/api/` still legacy Express |
| Customers | DONE | CRUD + soft-delete + branch scope |
| Passports | PARTIAL | Create via `/passports` + OCR apply; limited list UX API |
| Applications / stages / journey | DONE | Spine + events + assign/note/advance/approve |
| Per-service detail tables | DONE | visa + 11 detail upserts incl. work |
| Workflow templates | DONE | Settings-managed; activate per serviceType |
| Tasks | DONE | CRUD + mine filter |
| Finance (invoice/payment/expense/accounts/ledger) | DONE | Cash-basis; minor units; refund separate perm |
| Public intake + config + countries | DONE | Rate-limited intake |
| Notifications outbox | PARTIAL | Create/list/process; **no SMTP/WhatsApp send** |
| Suppliers / Agents / Commissions / Corporate | DONE | Staff-managed |
| Agent self-service portal | DONE (API) | Separate JWT; UI missing |
| HR / Payroll | DONE | |
| CRM leads + communications | DONE | |
| CMS pages | DONE | |
| Settings key-value | DONE | `active_services`, checklists, etc. |
| Operational reports | DONE | Derived counts |
| OCR | DONE but GATED | `OCR_APPROVED` required; no retention job |
| Users / roles | PARTIAL | User CRUD; no full role-editor UI API beyond seed |
| Customer portal auth | MISSING | |
| Corporate portal auth | MISSING | Deferred |
| Supplier portal auth | MISSING | Deferred |
| Internal chat | MISSING | Figma-only |
| Staff calendar | MISSING | Figma-only |
| Payment gateway (bKash/card) | MISSING | Record-only payments |
| Full double-entry GL / multi-currency | DEFERRED | By design |
| GDS / live inventory | OUT OF SCOPE | By design |
| Manpower/recruitment (BMET etc.) | ON HOLD | `work` = China work visa only |

---

## 3. Auth & session gaps

| Issue | Impact | Fix |
|---|---|---|
| Dual API (`/api` legacy vs `/api2` Nest) | Public login ≠ ERP login | Run cutover kit after admin UI ready |
| Refresh cookie path `/api/auth` | `/api2` sessions die at 15m | Fix cookie path on cutover or dual-path interim |
| No customer JWT realm | Portal cannot be real | Design customer auth (separate secret/cookie) like agents |
| Agent portal live but zero AgentUser on prod historically | Portal unusable until staff invites | Staff `POST /agent-accounts/:agentId` |
| Legacy `users.json` still authoritative for `/api` | Drift risk | Retire after cutover; remove backup hooks |

---

## 4. Applications / workflow gaps

| Gap | Severity | Notes |
|---|---|---|
| `docs_required` / `on_hold` / `submitted` status UX helpers | Low | Enums exist; staff UI may underuse |
| Reject as first-class endpoint | Low | Spec lists `application:reject` perm; visa-admin uses PATCH status |
| Embassy submit action | Low | Perm `application:submit-to-embassy` seeded; dedicated endpoint usage unclear |
| Document verify workflow | Medium | Perm `document:verify` exists; verification state machine thin |
| SLA breach automation | Medium | `slaDueAt` field exists; no breach job / notif |
| Case search across modules | Low | List filters exist; global ⌘K search not implemented |

---

## 5. Finance gaps

| Gap | Severity | Notes |
|---|---|---|
| Void invoice flow UI contract | Low | Soft-delete blocked if payments |
| `payment:status:read` (status without amounts) | Low | Spec mentions later refinement |
| Multi-currency / FX | Deferred | BDT only |
| Online payment capture | Medium | Needed for customer portal Payment screens |
| Receipt PDF generation | Medium | No PDF service |

---

## 6. Partners / portals gaps

| Gap | Severity | Notes |
|---|---|---|
| Corporate self-service | High (product) | Explicitly deferred |
| Supplier self-service | High (product) | Explicitly deferred |
| Agent passengers entity | Medium | Figma screen; no model |
| Agent downloads | Low | No dedicated API |
| Commission auto-calc from invoices | Medium | Manual commission create today |

---

## 7. Communications / notifications gaps

| Gap | Severity | Notes |
|---|---|---|
| Email adapter | High | Blocks real customer updates |
| WhatsApp adapter | High | Owner must supply creds |
| In-app notification read/unread for staff | Medium | Outbox oriented |
| Internal chat | Low/Med | No backend — cut from MVP or scope new module |

---

## 8. OCR / documents gaps

| Gap | Severity | Notes |
|---|---|---|
| `OCR_APPROVED` off | Ops | Privacy approval pending |
| Retention/cleanup job | High (compliance) | Images + rawText accumulate when on |
| Non-passport doc types | Low | Enum supports more; UX thin |
| Signed URL download for documents | Medium | Local storage; auth download paths need audit when wiring UI |

---

## 9. Admin / platform gaps

| Gap | Severity | Notes |
|---|---|---|
| Role/permission editor API | Medium | Seed-driven; `role:manage` exists |
| Audit log query API | Medium | `AuditLog` model; limited exposure |
| Backup manage API | Low | Scripts exist outside Nest |
| Branch multi-tenancy UI | Medium | Branch model exists; Figma Dubai branches are wrong locale |
| CMS → public blog rendering | Medium | Pages API yes; public site not confirmed consuming it |

---

## 10. Quality / ops gaps

| Gap | Notes |
|---|---|
| Automated test suite | No Jest/e2e in package.json — rely on manual smokes |
| OpenAPI/Swagger | Not present — frontend specs are the contract |
| Request DTOs | Many `dto: any` — tighten during UI phases when touching endpoints |
| Observability | Basic logs; no APM |
| Rate limit coverage | Public intake/OCR/agent login; other public routes TBD |

---

## 11. What NOT to build (preserve product decisions)

- External GDS / fake flight lists  
- Full accounting GL replacement  
- Recruitment/manpower ATS (until owner decides)  
- Bundling corporate/supplier login without security design review  

---

## 12. Backend readiness for Figma admin wiring

**Ready now (no backend change required for MVP admin):**

Auth, customers, applications, visa + all detail types, documents, OCR (UI for 503), invoices issue, tasks, workflow templates, CRM, HR, partners, settings, reports, reference data, public config.

**Needs small backend before pixel UI can be complete:**

Customer portal auth; notification senders; document download UX; optional reject/submit endpoints cleanup; OCR retention.

**Needs major new backend:**

Chat, calendar, payment gateway, corporate/supplier portals, PDF generation.
