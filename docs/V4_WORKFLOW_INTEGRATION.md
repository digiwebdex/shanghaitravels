# TravelOS V4.1 — Enterprise Workflow Integration

Frontend integration layer that connects existing modules into **one guided journey**.  
Auth, RBAC, Nest APIs, database schema, finance calculations, package engine, OCR engine, CMS, and multi-tenant architecture are **unchanged**.

## Master journey

```
Lead → Customer → Documents → OCR → Booking → Operations → Finance → Travel → After Sales → Repeat
```

Rendered as `MasterJourneyStrip` across dashboard, CRM, Customer 360, Booking 360, Operations, and the unified wizard.

## Customer Journey

1. Entry (website / walk-in / phone / WhatsApp / Facebook / corporate / agent / existing).
2. Create or select **one** customer (`/customers` → `/customers/:id` Customer 360).
3. Upload passport → Document Intelligence OCR → review confidence → save.
4. Start **Unified Booking Wizard** (`/bookings/new?customerId=`).
5. Operate from Booking 360 + service desk; finance from the booking.
6. After completion, Customer 360 Travel History + Loyalty snapshot drives repeat.

**Customer 360 tabs:** Overview, Timeline, Bookings, Documents, Passport, Visa, OCR, Invoices, Payments, Communications, Tasks, Travel History, Feedback, Loyalty, Notes, Analytics.

## CRM Journey

```
Lead → Opportunity → Follow-up → Quotation → Negotiation → Customer → Booking → Operations → Finance → Completed
```

CRM pages show `CrmJourneyBanner` so staff do **not** leave CRM until a booking exists. Convert actions (existing APIs) remain the bridge into applications.

## Booking Journey

```
Service → Package → Customer → Documents/OCR → Traveler → Supplier note → Review → Invoice → Payment → Done
```

- Wizard: `/bookings/new`
- Workspace: `/bookings/:id` (Booking 360)
- Deep processing: existing `/visa/:id`, `/ticketing/:id`, etc. (service desks) with Booking 360 banner

**Booking 360 tabs:** Overview, Traveler, Package, Supplier, Documents, OCR, Visa, Air Ticket, Hotel, Transport, Finance, Payments, Invoices, Timeline, Tasks, Communications, Audit Log.

## Operations Journey

`/operations` is now an **Operations Workspace** with queues:

Queue · Today · Visa · Ticket · Hotel · Transport · Hajj · Documents · Urgent · Completed

Each row opens Booking 360 (primary) or the service desk (secondary). OCR KPIs remain on the ops hub.

## Finance Journey

```
Booking → Invoice → Customer Payment → Supplier Payable → Supplier Payment → Expense → Ledger → Profit
```

Finance UI still uses existing invoice/payment/AP APIs. Booking 360 Finance tab embeds `CaseFinanceCard` so amounts are not re-entered in a parallel form.

## Agent Journey

Portal banner enforces:

Packages → Commission → Create customer → OCR → Booking request → Submit → Admin approval → Commission → Payment

Agent cannot issue tickets, approve visas, edit finance, change package price, or pay suppliers (enforced by existing portal RBAC/APIs).

## Corporate Journey

Company → Employee → Travel request → Manager approval → Quotation → Booking → Invoice → Payment → Reports  
(Corporate portal layout journey strip; existing APIs.)

## Supplier Journey

Supplier Center (`/partners/suppliers`) workspace tabs link Overview → Bookings/Ops → AP invoices/payments → Packages → Documents. Suppliers remain separate from customers/agents/corporate.

## Portal Journey (Customer)

Register → Verify → Travel profile → Passport upload → OCR → Browse packages → Book → Payment → Track → Travel history → Invoices → Documents → Support  
(Customer portal layout journey strip; existing portal routes.)

## Document Intelligence

Existing OCR service only (`ocrApi` / `DocumentUploadFlow` / `ScanDocumentPanel`). Integrated on Customer 360, Booking 360, wizard, case desks, pilgrim/employee forms, and portals (prior OCR work).

## Global search

Cmd/Ctrl-K searches navigation + live entities: customers, bookings, suppliers, leads, packages.

## Role dashboards

Company dashboard shows a **role lens** (executive / sales / visa / ticketing / accounts / ops) derived from `user.role`, plus the master journey strip. KPI fetches remain permission-gated.

## Entry points → one workflow

| Source        | Path into TravelOS                                      |
|---------------|---------------------------------------------------------|
| Website       | Lead / enquire → CRM → convert → Booking wizard         |
| Walk-in/Phone | Customer 360 or wizard                                  |
| WhatsApp/FB   | Comms → CRM lead → booking                              |
| Corporate     | Corporate portal request → admin booking                |
| Agent         | Agent portal booking request → admin approval           |
| Existing cust | Customer 360 → New booking                              |

## What we deliberately did not change

- NestJS modules, Prisma schema, booking reference IDs
- Finance math (`toPoisha`, invoice/payment bridges)
- Package engine publish/pricing
- OCR Vision/MRZ pipeline
- Auth / RBAC permission strings
- Portal API contracts

## Screenshots

Captured under `docs/screenshots-v41/` (local preview build + live API):

| File | Workspace |
|------|-----------|
| `01-dashboard.png` | Role-aware company dashboard + master journey |
| `02-booking-wizard.png` | Unified Booking Wizard |
| `03-customers.png` | Customer directory → Customer 360 |
| `04-operations.png` | Operations Workspace queues |
| `05-crm-leads.png` | CRM journey banner |
| `06-suppliers.png` | Supplier Center |
| `07-document-intelligence.png` | Document Intelligence hub |
| `08-customer-360.png` | Customer 360 tabs |
| `09-booking-360.png` | Booking 360 tabs |

## Remaining limitations (backend)

1. No dedicated Student Consultancy / Manpower `serviceType` — wizard maps them to `visa` with a note.
2. Applications list has no first-class `customerId` filter on all deployments — Customer 360 filters client-side.
3. Visa expiry KPI is a proxy (urgent/docs_required) until a visa-expiry column exists.
4. Loyalty / feedback are derived from bookings + notes (no loyalty ledger API).
5. Supplier 360 is directory + deep-links (no `/suppliers/:id` detail API).
6. Notifications triggers are existing ops notifications — not a new event bus.
7. Per-role dashboards are UX lenses over the same aggregates, not separate analytics APIs.
