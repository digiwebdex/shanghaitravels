import { useEffect, useState } from "react";
import { notificationsApi, type NotificationRow } from "@/lib/services";
import { Pill, statusTone } from "@/components/enterprise/DataTable";
import { EmptyState } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";

const TABS = ["all", "pending", "sent"] as const;
type Tab = (typeof TABS)[number];

/**
 * V5 Phase 6 — ONE reusable Notification Center. Staff use the default
 * (notificationsApi); portals pass their own scoped `fetcher` so Customer / Agent /
 * Corporate reuse the exact same component. Reads the existing Notification store —
 * no duplicate notification engine.
 */
export function NotificationCenter({ fetcher }: { fetcher?: (status?: string) => Promise<NotificationRow[]> }) {
  const [tab, setTab] = useState<Tab>("all");
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const status = tab === "all" ? undefined : tab;
    const p = fetcher ? fetcher(status) : notificationsApi.list({ status, limit: 100 });
    p.then((r) => alive && setRows(r))
      .catch(() => alive && setRows([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tab, fetcher]);

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold capitalize ${
              t === tab ? "border-[var(--accent)] bg-[var(--orange-50)] text-[var(--accent)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--primary)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-10">
          <InlineSpinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No notifications" hint="Automated and manual notifications appear here." />
      ) : (
        <ul className="space-y-2">
          {rows.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] px-3 py-2 text-[11.5px]">
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-[var(--foreground)]">{n.subject || n.body.slice(0, 80)}</span>
                <span className="text-[10.5px] text-[var(--muted-foreground)]">
                  {n.channel} · {n.recipient}
                </span>
              </span>
              <span className="flex flex-shrink-0 items-center gap-2">
                <Pill value={n.status} tone={statusTone(n.status)} />
                <span className="text-[10px] text-[var(--muted-foreground)]">{new Date(n.createdAt).toLocaleString()}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
