# Phase D3 — Customer Communication & Engagement Technical Design

**Branch:** `feature/phase-d-communications`  
**Baseline:** `v2.5-sales-automation`  
**Business model:** Centralized multi-channel hub for prospects, customers, agents, suppliers, and corporate clients  

---

## 1. Architecture

| Layer | Approach |
|---|---|
| Reuse | Auth, RBAC, branch, CRM, Sales, Application spine, Documents, Notifications outbox, AuditLog |
| New module | Nest `@Controller("comms")` + UI `/#/comms/*` |
| Legacy | Keep `/communications` + `/crm/activities` + `/notifications` unchanged |
| Delivery | Pluggable `MessagingAdapter` (email / WhatsApp / SMS); Wasender-ready WhatsApp stub |

### Explicit non-goals

- Website, CMS, live Customer/Agent/Corporate portals, HR, AI  
- Redesign of CRM D1 / Sales D2 / Finance / booking engines  

---

## 2. Domain (additive)

| Entity | Purpose |
|---|---|
| `CommTemplate` | Email / WhatsApp / SMS templates + merge fields |
| `CommThread` | Conversation / email thread |
| `CommMessage` | Message rows with delivery status |
| `CommAttachment` | File attachments on messages or timeline entries |
| `Communication` (extended) | Unified timeline fields (body, party, delivery, thread link) |
| `CrmActivity` (extended) | Recurrence, SLA due, escalation |

---

## 3. Messaging adapters

```
MessagingAdapter { channel; enabled(); send(req) → SendResult }
  ├─ EmailAdapter      (null / log / SMTP later)
  ├─ WhatsAppAdapter   (null / Wasender later)
  └─ SmsAdapter        (null / gateway later)
```

Business logic enqueues `CommMessage` + `Notification` outbox.  
`POST /comms/process-outbox` dispatches via enabled adapters only.  
Simulated delivery allowed only when `COMMS_SIMULATE_DELIVERY=1` (staging/tests).

---

## 4. API (`/comms/*`)

```
POST   /comms/bootstrap
GET    /comms/timeline?relatedType&relatedId
POST   /comms/log
GET/POST /comms/templates
POST   /comms/templates/:id/render
GET/POST /comms/threads
GET    /comms/threads/:id
POST   /comms/threads/:id/messages
POST   /comms/send                    # channel=email|whatsapp|sms
GET    /comms/delivery
GET/POST /comms/activities
POST   /comms/activities/:id/complete|escalate
GET    /comms/calendar
GET    /comms/sla
GET    /comms/portal/:partyKind/:partyId/timeline   # portal prep
GET    /comms/reports/*
POST   /comms/process-outbox
```

Permissions: `comms:read`, `comms:manage`, `comms:send` (+ existing `communication:manage`)

---

## 5. Frontend routes

| Path | Page |
|---|---|
| `/#/comms` | Unified timeline hub |
| `/#/comms/email` | Templates, send, threads |
| `/#/comms/whatsapp` | WhatsApp history / templates |
| `/#/comms/sms` | SMS templates / OTP / history |
| `/#/comms/activities` | Calendar, SLA, escalations |
| `/#/comms/reports` | Volume, response time, SLA, productivity |

---

## 6. Portal preparation

`GET /comms/portal/:partyKind/:partyId/timeline` returns a stable DTO (`items[]` with channel, direction, summary, body, status, attachments, createdAt) for future customer/agent portals. No portal UI in D3.

---

## 7. Regression guard

Do not modify Visa / Ticketing / Hotel / Transport / Tour / Hajj engines.  
Do not begin Website, CMS, Portals, HR, or AI.
