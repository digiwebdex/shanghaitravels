import { useEffect, useState } from "react";
import { Link } from "react-router";
import { customersApi, applicationsApi, commissionApi, type CommissionLedgerRow } from "@/lib/services";
import { listOf } from "@/lib/api";
import type { Customer, Application } from "@/lib/types";
import { Surface, SurfaceHeader } from "@/components/enterprise/Page";
import { Pill, statusTone } from "@/components/enterprise/DataTable";
import { fmtBDTPlain } from "@/lib/money";

/**
 * Read-only View context for an agent — reuses existing list APIs (no new
 * endpoints): owned customers, bookings, and the commission ledger. Wallet
 * ledger is shown by AgentWalletCard; audit/activity timeline by the detail page.
 */
export function AgentContextCards({ agentId }: { agentId: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Application[]>([]);
  const [ledger, setLedger] = useState<CommissionLedgerRow[]>([]);

  useEffect(() => {
    let alive = true;
    customersApi.list({ agentId, limit: 50 }).then((r) => alive && setCustomers(listOf<Customer>(r))).catch(() => alive && setCustomers([]));
    applicationsApi.list({ agentId, limit: 50 }).then((r) => alive && setBookings(listOf<Application>(r))).catch(() => alive && setBookings([]));
    commissionApi.ledger(agentId).then((r) => alive && setLedger(r)).catch(() => alive && setLedger([]));
    return () => { alive = false; };
  }, [agentId]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Surface padded className="space-y-2">
          <SurfaceHeader title={`Customer Ownership (${customers.length})`} hint="Customers owned or referred by this agent." />
          <ul className="divide-y divide-[var(--border)] text-[11.5px]">
            {customers.length === 0 ? (
              <li className="py-2 text-[var(--muted-foreground)]">No customers.</li>
            ) : (
              customers.slice(0, 12).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 py-1.5">
                  <Link to={`/customers/${c.id}`} className="font-semibold text-[var(--accent)] hover:underline">{c.fullName}</Link>
                  <span className="font-mono text-[10.5px] text-[var(--muted-foreground)]">{c.code}</span>
                </li>
              ))
            )}
          </ul>
        </Surface>

        <Surface padded className="space-y-2">
          <SurfaceHeader title={`Bookings (${bookings.length})`} hint="Cases referred by this agent." />
          <ul className="divide-y divide-[var(--border)] text-[11.5px]">
            {bookings.length === 0 ? (
              <li className="py-2 text-[var(--muted-foreground)]">No bookings.</li>
            ) : (
              bookings.slice(0, 12).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2 py-1.5">
                  <Link to={`/bookings/${b.id}`} className="font-semibold text-[var(--accent)] hover:underline">{b.referenceNo}</Link>
                  <span className="flex items-center gap-2">
                    <span className="text-[10.5px] uppercase text-[var(--muted-foreground)]">{b.serviceType}</span>
                    <Pill value={b.status} tone={statusTone(b.status)} />
                  </span>
                </li>
              ))
            )}
          </ul>
        </Surface>
      </div>

      <Surface padded className="space-y-2">
        <SurfaceHeader title="Commission Ledger" hint="Earned / settled entries (reused commission ledger)." />
        <ul className="divide-y divide-[var(--border)] text-[11px]">
          {ledger.length === 0 ? (
            <li className="py-2 text-[var(--muted-foreground)]">No commission entries.</li>
          ) : (
            ledger.slice(0, 12).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 py-1.5">
                <span className="flex items-center gap-2">
                  <Pill value={e.entryType} tone={statusTone(e.entryType)} />
                  <span className={`font-semibold tabular-nums ${e.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtBDTPlain(e.amount)}</span>
                </span>
                <span className="tabular-nums text-[var(--muted-foreground)]">bal {fmtBDTPlain(e.runningBalance)}</span>
              </li>
            ))
          )}
        </ul>
      </Surface>
    </>
  );
}
