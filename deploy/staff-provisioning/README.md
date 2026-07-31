# Staff ERP provisioning

Secure, repeatable provisioning for Shanghai Travels **Staff ERP** accounts.

## What it does

1. Reads `roster.json` (employee name, username slug, designation, department — **no passwords**).
2. Generates a unique temporary password per account at runtime.
3. Stores **argon2id hashes** only in PostgreSQL.
4. Writes an admin-only report to `docs/INITIAL_STAFF_ACCOUNTS.md` (gitignored, `chmod 600`).

## Role mapping (existing RBAC — not modified)

| Designation | System role |
|---|---|
| Super Admin | `super_admin` |
| Chairman | `super_admin` |
| General Manager | `general_manager` |
| Office In Charge | `office_incharge` |
| Manager Accounts | `accounts_manager` |
| Marketing Manager | `marketing_manager` |
| Visa Consultant Officer | `visa_consultant` |
| Visa Executive Officer | `visa_executive` |

## Run (production)

```bash
cd /opt/st-erp-api
set -a && source .env && set +a
node /var/www/ShanghaiTravels-src/deploy/staff-provisioning/provision-staff.mjs
```

Login: `https://shanghaitravels.com.bd/erp/#/login` (email + temp password).

## Safety

- Do **not** commit `docs/INITIAL_STAFF_ACCOUNTS.md`.
- Do **not** put plaintext passwords in `roster.json` or application source.
- Re-running the script **rotates** temporary passwords and resets `mustChangePassword=true`.
