# Document Intelligence — TravelOS V4

Centralized OCR across the ERP and portals. Extends the existing Vision + MRZ pipeline **without** schema, booking-workflow, auth, or RBAC changes.

Images stay **memory-only** until staff/portal users confirm **Save**. Requires `OCR_APPROVED=true` and Google Vision credentials on the API.

---

## 1. Where OCR is integrated

| Area | UI surface |
|------|------------|
| **Document Intelligence workspace** | `/#/operations/document-intelligence` — Dashboard, Scan, OCR Queue, Recent, Duplicates, Failed, Processing Logs, Global Search, Settings |
| **Global Scan** | Admin shell “Scan Document” modal (`ScanDocumentModal`) |
| **Passports** | `/#/passports` — `DocumentUploadFlow` |
| **Customer 360** | Documents / Passport / OCR tabs — `ScanDocumentPanel` with profile autofill |
| **Customers create** | `CustomersPage` passport scan |
| **Booking 360** | Traveler + OCR tabs |
| **Unified Booking Wizard** | Documents step |
| **Visa case** | Passport & OCR section + `CaseDocumentsCard` |
| **Air ticket case** | `AirTicketDetailCard` + `CaseDocumentsCard` |
| **Hotel case** | Guest passport on `HotelDetailCard` + `CaseDocumentsCard` |
| **Transport case** | Passenger docs on `TransportDetailCard` + `CaseDocumentsCard` |
| **Tour case** | Traveler scan + `CaseDocumentsCard` |
| **Hajj / Umrah case** | `HajjDetailCard` + `CaseDocumentsCard` |
| **Hajj pilgrims** | Pilgrim create form scan |
| **List create forms** | Visa / Ticketing / Tour / Hajj list pages |
| **Operations hub** | `OcrOpsWidget` KPIs + Document Intelligence link |
| **Supplier Center** | Documents tab — trade license OCR → create form |
| **Customer portal** | My Documents — upload + OCR + profile passport upsert |
| **Agent portal** | Customer Documents — booking-scoped upload + OCR |
| **Corporate portal** | Employees — passport scan autofill on create |

---

## 2. Reusable components

| Component | Path | Role |
|-----------|------|------|
| `DocumentUploadFlow` | `apps/web/src/components/ocr/DocumentUploadFlow.tsx` | Upload → type → OCR → preview/review → save; confidence bands; MRZ; Edit / Use OCR / Use MRZ / Rotate / Crop / Reprocess; duplicate banner |
| `ScanDocumentPanel` | `apps/web/src/components/ocr/ScanDocumentPanel.tsx` | Embed wrapper around flow + `ocrApi` + duplicate check |
| `ScanDocumentModal` | same file | Shell global scanner |
| `PassportOcrReview` | `apps/web/src/components/ocr/PassportOcrReview.tsx` | Legacy passport field review helpers |
| `OcrOpsWidget` | `apps/web/src/components/ocr/OcrOpsWidget.tsx` | Ops KPI strip |
| `CaseDocumentsCard` | `apps/web/src/components/cases/CaseDocumentsCard.tsx` | Case document collection with OCR-first upload |
| Helpers | `apps/web/src/lib/documentIntelligence.ts` | Types, confidence tones, field map, doc-type options |

---

## 3. Pages modified (this upgrade + prior DI work)

- `DocumentIntelligencePage.tsx` (hub sections)
- `DocumentUploadFlow.tsx`, `ScanDocumentPanel.tsx`, `OcrOpsWidget.tsx`
- `PassportsPage.tsx`, `CustomersPage.tsx`
- `CustomerWorkspacePage.tsx`, `BookingWorkspacePage.tsx`, `UnifiedBookingWizardPage.tsx`
- `VisaCasePage.tsx`, `TicketingCasePage.tsx`, `HotelsCasePage.tsx`, `TransportCasePage.tsx`, `TourCasePage.tsx`, `HajjCasePage.tsx`
- `HotelDetailCard.tsx`, `TransportDetailCard.tsx`, `AirTicketDetailCard.tsx`, `HajjDetailCard.tsx`, `CaseDocumentsCard.tsx`
- `VisaListPage.tsx`, `TicketingListPage.tsx`, `TourListPage.tsx`, `HajjListPage.tsx`, `HajjPilgrimsPage.tsx`
- `SuppliersPage.tsx`
- `PortalDocumentsPage.tsx`, `AgentDocumentsPage.tsx`, `CorporateEmployeesPage.tsx`
- `nav.ts`, `routes.tsx`, `workspaces/*`, `services.ts`, `portalApi.ts`, `agentPortalApi.ts`, `api.ts` (20MB / HEIC / WEBP)

---

## 4. Supported document types

| Type | Extraction |
|------|------------|
| Passport | Number, names, gender, nationality, DOB, place of birth, issue/expiry, issuing country, type, MRZ L1/L2 — ICAO TD3 + check digits |
| Bangladesh NID | Number, name, parents, DOB, gender, address, issue (smart + old heuristics) |
| Visa | Number, country, type, entries, issue/expiry, passport number |
| Air ticket | Passenger, ticket no, PNR, flight, departure/arrival |
| Driving license | Number, name, DOB, expiry |
| Birth certificate | Registration, name, DOB, parents |
| Trade license | Number, company, issue/expiry |
| Bank statement | **Classification only** |

---

## 5. Upload UX

```
Upload → Choose type (or Auto) → OCR → Preview → Review → Save
```

**Review panel:** original image / PDF object · OCR fields · confidence % · MRZ status · validation status · low-confidence list · Edit · Use OCR · Use MRZ · Rotate (bakes into file) · Crop (center) · Reprocess · Save

**Confidence bands:** 95+ green · 90–95 blue · 80–90 amber · &lt;80 red (manual review before save)

**Duplicates:** `POST /ocr/intelligence/check-duplicate` (staff); portals use local passport match before save. Banner: View / Merge on Customer 360 / Continue / Cancel.

---

## 6. Document Intelligence workspace

| Tab | Content |
|-----|---------|
| Dashboard | Scanned today, Passport/NID/Visa counts, failures, avg confidence, avg time |
| Scan | Targeted OCR with optional customer/application IDs |
| OCR Queue | Session journal (non-failed) |
| Recent Documents | Full recent journal |
| Duplicates | Passport numbers shared across customers |
| Failed OCR | Failed journal entries |
| Processing Logs | Journal with confidence color bands |
| Global Search | Passport / NID / visa / MRZ / name |
| Settings | Env notes + deep links |

---

## 7. Additive APIs (existing `/ocr/scan` unchanged)

- `GET /ocr/intelligence/stats`
- `GET /ocr/intelligence/recent`
- `GET /ocr/intelligence/failed`
- `POST /ocr/intelligence/check-duplicate`

Portal: public/agent OCR scan endpoints already wired.

---

## 8. Backend modules (`/opt/shanghai-erp-api/src/ocr`)

`vision.provider.ts` · `classify.ts` · `extractors.ts` · `mrz.ts` · `viz.ts` · `merge.ts` · `preprocess.ts` · `ocr.service.ts` · `ocr.controller.ts`

---

## 9. Remaining limitations

1. OCR queue is the **in-memory journal**, not a durable job table (no schema change).
2. Crop is center-crop bake; not freeform region selection.
3. Portal duplicate check is **local** (no portal intelligence API).
4. Supplier OCR autofills create form — no per-supplier document vault API.
5. Corporate employee detail has no separate document vault beyond create-form scan.
6. `ocrApi.apply` / `process-pending` remain available on API; hub uses scan + save paths.

---

## 10. Accuracy harness

```bash
node /opt/shanghai-erp-api/scripts/ocr-accuracy-report.cjs
```

See `docs/OCR_PASSPORT_ACCURACY_REPORT.md`.
