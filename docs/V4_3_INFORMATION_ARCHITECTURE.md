# TravelOS V4.3 — Enterprise Information Architecture

**Scope:** Navigation, workspace organization, breadcrumbs, Create menu, quick actions, command-palette grouping.  
**Unchanged:** Auth, RBAC, Prisma, finance logic, OCR engine, booking/package engines, APIs, Customer 360, Booking 360, Unified Booking Wizard, dashboard visual design.

---

## Old navigation

| Section | Contents (summary) |
|---------|-------------------|
| Dashboard | Home |
| Bookings & Services | Wizard, Ops queue, Visa…Hajj, Products & Packages |
| Business Partners | Customers, Agents, Corporate, Suppliers |
| CRM & Sales | Leads, Opps, Pipeline, Quotes, Tasks, Comms |
| Finance | Dashboard, Invoices, Payments, Expenses, AR, AP, Cash, Banking |
| Operations | Passports, Document Intelligence, Documents, Case Journey, Calendar, Notifications |
| Analytics | Executive, Sales, Customers, Finance |
| Website CMS | Pages, Menus, Media, Packages, Destinations, Preview, Setup hub |
| Administration | Users, Settings, Workflow |

**Problems:** Feature-first grouping; ops and bookings mixed; DI buried under Operations; reports duplicated across modules; `/visa/new` etc. duplicated the booking wizard; unfinished admin leaves (roles, audit, integrations) were redirects-only; Create button often generic.

---

## New navigation

1. **Dashboard**
2. **CRM & Sales** — Dashboard · Leads · Opportunities · Pipeline · Quotations · Tasks · Communications  
   *Workflow:* Lead → Opportunity → Quotation → Customer
3. **Bookings** — All Bookings · New Booking · Visa · Air · Hotel · Tour · Transport · Hajj & Umrah · Student Consultancy · Manpower · Package Management  
   *All creates go through Unified Booking Wizard*
4. **Document Intelligence** — Dashboard · Passport OCR · NID OCR · Visa OCR · Ticket OCR · Other Documents · Verification Queue  
   *(Central management; OCR remains embedded in Customer/Booking/Portal)*
5. **Operations** — Dashboard · Today's Tasks · Visa / Ticket / Hotel / Transport / Tour / Hajj queues · Workflow Timeline  
   *Execution after booking — no CRM*
6. **Business Partners** — Customers · Agents · Corporate · Suppliers
7. **Finance** — Dashboard · Invoices · Collections · Customer Payments · Supplier Payments · Expenses · Accounts · Reports  
   *Order follows Invoice → Collection → Supplier Payment → Expense → Ledger → Profit*
8. **Reports & Analytics** — one reporting center (CRM / Sales / Booking / Visa / Ticket / Finance / Supplier / Customer)
9. **Website CMS** — Dashboard · Homepage · Hero Banner · Packages · Destinations · Blog · FAQ · Testimonials · Forms · SEO · Content Library
10. **Administration** — Company Setup · Users · Settings  
    *(Branches / Roles / Permissions / Integrations / Audit hidden — no backend pages)*

---

## Reason for every change

| Change | Reason |
|--------|--------|
| CRM before Bookings | Agency acquires before it books |
| All Bookings → operations queue | Single list of every service case |
| Student / Manpower → wizard `?service=` | Same booking engine; no duplicate forms |
| Package Management under Bookings | Operational catalog (not website-only) |
| Document Intelligence top-level | Findable central OCR without leaving workflows |
| Ops queues as sidebar leaves | Ops staff never open CRM |
| Finance menu order | Matches cash-cycle mental model |
| Reports consolidated | Removes per-module report duplication |
| CMS leaves expanded from Setup hub | Real routes only; no empty placeholders |
| Admin unfinished items hidden | Never show redirect-only stubs |
| `/visa/new` etc. → wizard | One create path for every service |
| Workspace compact bar = 5 kinds | Overview · Work · Reports · Calendar · Settings everywhere |
| Auto breadcrumbs | Dashboard › Module › Submodule › Page |
| Context Create labels | Create Lead / New Booking / New Invoice / Add Customer / … |

---

## Business workflow mapping

```
Website / Walk-in / Agent / Corporate
        ↓
CRM & Sales (Lead → Opportunity → Quotation)
        ↓
Business Partners (Customer)
        ↓
Document Intelligence (embedded + hub)
        ↓
Bookings (Unified Wizard → Booking 360)
        ↓
Operations (service queues → Workflow Timeline)
        ↓
Finance (Invoice → Collection → AP → Expense → Ledger)
        ↓
Reports & Analytics
        ↓
Repeat Customer (Customer 360)
```

---

## Workspace tabs

Every module uses the same five kinds:

**Overview · Work · Reports · Calendar · Settings**

Service desks (Hotels, Transport, Tours, Hajj, Packages) keep ModuleNav but render the same five kinds via the registry.

---

## Global search (Cmd-K)

Navigation leaves + quick actions + live entities:

Customers · Bookings · Packages · Passports · Suppliers · Leads · Quotations · (invoices via Finance desk)

---

## Files touched

- `apps/web/src/config/nav.ts`
- `apps/web/src/config/quickActions.ts`
- `apps/web/src/config/contextUi.ts`
- `apps/web/src/workspaces/registry.ts`
- `apps/web/src/workspaces/WorkspaceTabs.tsx`
- `apps/web/src/components/enterprise/Page.tsx` (breadcrumb merge)
- `apps/web/src/layouts/AdminLayout.tsx` (query-aware active leaves)
- `apps/web/src/app/routes.tsx` (wizard redirects for `*/new`)
- `apps/web/src/pages/OperationsDocumentsPage.tsx` (DI workspace)

---

## Validation

- `npm run typecheck` — pass  
- `npm run lint` — pass  
- `npm run build` — pass  

No backend, schema, or business-logic rewrites.
