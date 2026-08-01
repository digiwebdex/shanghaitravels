# TravelOS — Demo Workflow Data

Seeded and verified against production API (`127.0.0.1:4200`).

## Re-run anytime

```bash
cd /var/www/ShanghaiTravels-src/apps/web
# Ensure .env.test has ERP_BASE, ERP_TEST_EMAIL, ERP_TEST_PASSWORD (gitignored)
node tests/api/demo-workflow.mjs
```

Full regression:

```bash
node tests/api/smoke.mjs
```

## Demo agent (portal)

| Field | Value |
|-------|-------|
| Portal | https://shanghaitravels.com.bd/erp/#/portal/agent/login |
| Email | `demo.agent@shanghaitravels.com.bd` |
| Password | `DemoAgent#2026!` |

## What the demo script creates

1. Demo agent + portal invite  
2. Agent customer + **visa booking** (with workflow stages)  
3. Staff advances all stages → **approves** booking  
4. **Invoice** issued + customer **payment**  
5. AR bridge  
6. Agent **commission** approved + paid to wallet  
7. Extra staff walk-in visa case  

## Latest successful run (reference)

| Entity | ID / ref |
|--------|----------|
| Agent booking | `APP-00208` |
| Invoice | created + issued + paid |
| Commission | paid (wallet credited) |

## Fixes applied for smooth workflow

1. **Agent / package / corporate bookings** now instantiate workflow stages (same as staff create) so admin can advance and approve.  
2. **Corporate approval UI** sends `approved`/`rejected` + `note` (was mismatched with API).

## Staff ERP login

Use existing staff accounts from `docs/INITIAL_STAFF_ACCOUNTS.md` (admin only, not committed secrets in this file).
