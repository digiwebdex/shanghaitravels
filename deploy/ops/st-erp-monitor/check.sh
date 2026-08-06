#!/usr/bin/env bash
# Shanghai Travels ERP — production monitor (ST-scoped). Polls health + disk and
# emits ALERT lines to the log/journal. Set ST_MONITOR_WEBHOOK to POST alerts.
set -uo pipefail
LOG=/var/log/st-erp-monitor.log
DISK_WARN=90            # % used
ALERTS=()

check_http() { # name url
  local name="$1" url="$2" code body
  body=$(curl -s -m 8 -w '\n%{http_code}' "$url" 2>/dev/null)
  code=$(printf '%s' "$body" | tail -1)
  if [ "$code" != "200" ] || ! printf '%s' "$body" | grep -q '"ok":true'; then
    ALERTS+=("$name DOWN (http=$code) $url")
  fi
}

check_http "erp-prod"    "http://127.0.0.1:4200/api/health"
check_http "erp-staging" "http://127.0.0.1:4201/api/health"

# systemd service liveness
for svc in st-erp-api.service st-erp-api-staging.service; do
  systemctl is-active --quiet "$svc" || ALERTS+=("service $svc not active")
done

# disk
USED=$(df --output=pcent / | tail -1 | tr -dc '0-9')
[ "${USED:-0}" -ge "$DISK_WARN" ] && ALERTS+=("disk ${USED}% >= ${DISK_WARN}% on /")

TS=$(date -u +%FT%TZ)
if [ ${#ALERTS[@]} -eq 0 ]; then
  echo "$TS OK erp-prod+staging healthy, disk ${USED}%" >> "$LOG"
else
  for a in "${ALERTS[@]}"; do echo "$TS ALERT $a" | tee -a "$LOG" | systemd-cat -t st-erp-monitor -p err; done
  if [ -n "${ST_MONITOR_WEBHOOK:-}" ]; then
    payload=$(printf '%s\n' "${ALERTS[@]}" | sed 's/"/\\"/g')
    curl -s -m 8 -X POST "$ST_MONITOR_WEBHOOK" -H 'Content-Type: application/json' \
      -d "{\"service\":\"st-erp\",\"ts\":\"$TS\",\"alerts\":\"$payload\"}" >/dev/null 2>&1 || true
  fi
fi
