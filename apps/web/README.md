# TravelOS Web (Phase A)

Production React ERP shell for Shanghai Travels.

- **UI SoT:** `../../figma-design` (tokens, AdminLayout patterns, CaseTimeline, shadcn)
- **API:** NestJS via `VITE_ERP_BASE` (default `/api2`)
- **Deploy:** `npm run build` → sync `dist/` to `/var/www/ShanghaiTravels/erp/`

## Scripts

```bash
npm install
npm run dev          # Vite + proxy /api2 → :4200
npm run typecheck
npm run lint
npm run build
```

## Phase A routes (`/#/…`)

| Path | Module |
|---|---|
| `/login` | Staff login |
| `/` | Dashboard |
| `/customers` | Customers |
| `/visa` | Visa cases |
| `/visa/new` | Create China visa case |
| `/visa/:id` | Case workspace |
| `/passports` | Passports + OCR |
| `/case-journey` | Journey map |

Do not modify `../../visa-admin` until migration is complete.
