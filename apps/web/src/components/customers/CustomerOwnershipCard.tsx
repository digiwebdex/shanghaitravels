import { useCallback, useEffect, useState } from "react";
import { UserCheck, History } from "lucide-react";
import { customersApi, agentsApi, type Agent } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { OwnershipAssignment } from "@/lib/types";
import { useAuth } from "@/auth/AuthProvider";
import { Surface, SurfaceHeader, btnGhost, btnPrimary, btnPrimaryStyle, selectClassName } from "@/components/enterprise/Page";
import { ErrorBanner } from "@/components/Feedback";

/**
 * V6 Wave 1 — customer ownership panel. Shows the current primary agent (owner)
 * and lets staff (agent:manage) assign / reassign / release, with history. Owner
 * = Primary Agent; operational staff are responsibilities, not ownership.
 */
export function CustomerOwnershipCard({
  customerId,
  owner,
  onChange,
}: {
  customerId: string;
  owner?: { id: string; name: string; code: string } | null;
  onChange?: () => void;
}) {
  const { can } = useAuth();
  const canManage = can("agent:manage");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pick, setPick] = useState("");
  const [history, setHistory] = useState<OwnershipAssignment[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (canManage) agentsApi.list({ status: "active", limit: 100 }).then((r) => setAgents(listOf<Agent>(r))).catch(() => setAgents([]));
  }, [canManage]);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await customersApi.ownershipHistory(customerId));
      setShowHistory(true);
    } catch {
      /* ignore */
    }
  }, [customerId]);

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      setPick("");
      onChange?.();
      if (showHistory) await loadHistory();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Surface padded className="space-y-3">
      <SurfaceHeader title="Ownership" hint="Primary agent owns this customer. House = unassigned (staff-owned)." />
      <ErrorBanner message={error} />
      <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
        <UserCheck size={14} className="text-[var(--accent)]" />
        <span className="font-semibold text-[var(--foreground)]">Owner:</span>
        {owner ? (
          <span className="font-medium text-[var(--primary)]">{owner.name} <span className="text-[var(--muted-foreground)]">({owner.code})</span></span>
        ) : (
          <span className="text-[10.5px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">House account</span>
        )}
        <button type="button" className={`${btnGhost} ml-auto`} onClick={() => (showHistory ? setShowHistory(false) : void loadHistory())}>
          <History size={12} /> {showHistory ? "Hide" : "History"}
        </button>
      </div>

      {canManage && (
        <div className="flex flex-wrap items-end gap-2 border-t border-[var(--border)] pt-3">
          <select className={selectClassName} value={pick} onChange={(e) => setPick(e.target.value)} disabled={busy} aria-label="Select agent">
            <option value="">Select agent…</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
            ))}
          </select>
          <button
            type="button"
            className={btnPrimary}
            style={btnPrimaryStyle}
            disabled={busy || !pick}
            onClick={() => void act(() => customersApi.assignOwner(customerId, { agentId: pick }))}
          >
            {owner ? "Reassign" : "Assign"}
          </button>
          {owner && (
            <button type="button" className={btnGhost} disabled={busy} onClick={() => void act(() => customersApi.releaseOwner(customerId))}>
              Release to house
            </button>
          )}
        </div>
      )}

      {showHistory && (
        <ul className="divide-y divide-[var(--border)] border-t border-[var(--border)] pt-1 text-[11px]">
          {history.length === 0 ? (
            <li className="py-2 text-[var(--muted-foreground)]">No ownership changes recorded.</li>
          ) : (
            history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-2 py-1.5">
                <span className="font-semibold text-[var(--foreground)]">{h.action} <span className="font-normal text-[var(--muted-foreground)]">· {h.role}</span></span>
                <span className="text-[10px] text-[var(--muted-foreground)]">{new Date(h.createdAt).toLocaleString()}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </Surface>
  );
}
