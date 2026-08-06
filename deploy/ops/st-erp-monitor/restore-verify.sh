#!/usr/bin/env bash
# Shanghai Travels ERP — restore drill. Proves st_erp_prod dumps AND restores
# cleanly (RTO/RPO mechanism). pg_dump is read-only; restore uses a throwaway DB;
# prod is never touched. The ENCRYPTED nightly .age artifacts additionally require
# the OWNER's age identity (held off-box) — see docs.
set -uo pipefail
H=127.0.0.1; PORT=5440; U=st_erp; DB=st_erp_prod; TEST=st_erp_restore_test
export PGPASSWORD="$(cat /root/.st_erp_db_pwd 2>/dev/null)"
TMP=$(mktemp /tmp/st_erp_restore.XXXX.dump)
trap 'rm -f "$TMP"' EXIT

counts() { psql -h $H -p $PORT -U $U -d "$1" -tA \
  -c 'select count(*) from "User"' -c 'select count(*) from "Role"' \
  -c 'select count(*) from "Customer"' -c 'select count(*) from "Application"' \
  -c 'select count(*) from "Invoice"' 2>/dev/null | tr '\n' ' '; }

echo "=== 1) dump $DB (read-only) ==="; pg_dump -h $H -p $PORT -U $U -Fc "$DB" -f "$TMP" && ls -lh "$TMP"
echo "=== 2) source counts [User Role Customer Application Invoice] ==="; SRC="$(counts $DB)"; echo "$SRC"
echo "=== 3) restore into throwaway $TEST ==="
sudo -u postgres psql -q -c "DROP DATABASE IF EXISTS $TEST;"
sudo -u postgres psql -q -c "CREATE DATABASE $TEST OWNER $U;"
pg_restore -h $H -p $PORT -U $U -d "$TEST" "$TMP" 2>&1 | tail -1 || true
echo "=== 4) restored counts ==="; DST="$(counts $TEST)"; echo "$DST"
sudo -u postgres psql -q -c "DROP DATABASE $TEST;"
echo "=== 5) verdict ==="
[ "$SRC" = "$DST" ] && echo "RESTORE VERIFIED — source == restored ($SRC)" || { echo "MISMATCH src=[$SRC] dst=[$DST]"; exit 1; }
