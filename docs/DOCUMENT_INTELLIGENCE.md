# Document Intelligence — TravelOS V4

Centralized OCR across the ERP and portals. Extends the existing Vision + MRZ pipeline **without** schema, booking-workflow, auth, or RBAC changes.

## Entry points (integrated)

| Area | Path / UI |
|------|-----------|
| Document Intelligence workspace | `/#/operations/document-intelligence` |
| Passports | `/#/passports` — `DocumentUploadFlow` |
| Visa / Air / Hotel / Tour / Transport / Hajj cases | `CaseDocumentsCard` on each case page |
| Customer portal | `/portal/customer/documents` — My Documents |
| Agent portal | `/portal/agent/documents` — Customer Documents |
| Ops Documents | link from Document Intelligence settings |
| Nav | Operations → **Document Intelligence** (`ocr:use`) |

Corporate / Supplier: upload APIs exist; use Document Intelligence workspace or case documents until dedicated vault pages ship.

## Supported document types

- Passport (ICAO TD3 MRZ + VIZ, check digits, place of birth)
- Bangladesh National ID (smart / old heuristics)
- Visa
- Air ticket
- Driving license
- Birth certificate
- Trade license
- Bank statement (**classification only**)

## Reusable components

| Component | Path |
|-----------|------|
| `DocumentUploadFlow` | `apps/web/src/components/ocr/DocumentUploadFlow.tsx` |
| `PassportOcrReview` | `apps/web/src/components/ocr/PassportOcrReview.tsx` (legacy passport review) |
| `CaseDocumentsCard` | `apps/web/src/components/cases/CaseDocumentsCard.tsx` (OCR-first) |
| Helpers | `apps/web/src/lib/documentIntelligence.ts` |

## Backend modules (`/opt/shanghai-erp-api/src/ocr`)

| File | Role |
|------|------|
| `vision.provider.ts` | Preprocess → Vision → classify → extract |
| `classify.ts` | Document type detection |
| `extractors.ts` | NID / visa / ticket / DL / birth / trade / bank |
| `mrz.ts` / `viz.ts` / `merge.ts` / `preprocess.ts` | Passport pipeline |
| `ocr.service.ts` | Scan + in-memory journal + stats + duplicate check |
| `ocr.controller.ts` | Existing scan + additive `/ocr/intelligence/*` |

### Additive APIs (existing `/ocr/scan` unchanged in contract)

- `GET /ocr/intelligence/stats`
- `GET /ocr/intelligence/recent`
- `GET /ocr/intelligence/failed`
- `POST /ocr/intelligence/check-duplicate`

## Upload UX

Upload → Choose type (or Auto) → OCR → Preview + Review → Save  

Confidence bands: **95+ green**, **90–95 blue**, **80–90 amber**, **&lt;80 red** (manual review).

## Pages modified

- `DocumentIntelligencePage.tsx` (new)
- `PassportsPage.tsx`
- `VisaCasePage.tsx` (+ other case pages via `customerId` prop)
- `CaseDocumentsCard.tsx`
- `PortalDocumentsPage.tsx`
- `AgentDocumentsPage.tsx`
- `nav.ts`, `routes.tsx`, `workspaces/registry.ts`
- `services.ts`, `portalApi.ts`, `agentPortalApi.ts`, `api.ts` (20MB / HEIC)

## Privacy

Images remain **memory-only** until staff confirm Save. Requires `OCR_APPROVED=true` and Google Vision key.

## Accuracy harness

```bash
node /opt/shanghai-erp-api/scripts/ocr-accuracy-report.cjs
```

See also `docs/OCR_PASSPORT_ACCURACY_REPORT.md`.
