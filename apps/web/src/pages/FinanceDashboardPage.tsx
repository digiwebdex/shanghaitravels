import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Landmark } from "lucide-react";
import { arApi, reportsApi, type FinanceSummary } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { ErrorBanner } from "@/components/Feedback";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import {
  JourneyContinuity,
  NextStepBanner,
} from "@/components/workflow/MasterJourney";
import {
  PageHeader,
  PageShell,
  SkeletonRows,
  Surface,
  SurfaceHeader,
} from "@/components/enterprise/Page";
import { fmtBDTCompact, fmtBDTPlain } from "@/lib/money";

export default function FinanceDashboardPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [outstanding, setOutstanding] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [s, o] = await Promise.all([
          reportsApi.financeSummary(),
          arApi.reportOutstanding().catch(() => null),
        ]);
        if (cancelled) return;
        setSummary(s);
        setOutstanding(o);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load finance dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = summary
    ? [
        { label: "Invoiced", value: summary.invoiced, to: "/finance/invoices" },
        { label: "Collected", value: summary.collected, to: "/finance/payments" },
        { label: "Receivable", value: Number(outstanding?.arOutstandingPoisha ?? summary.receivable), to: "/finance/ar" },
        { label: "Payables", value: Number(outstanding?.apOutstandingPoisha ?? 0), to: "/finance/ap" },
        { label: "Expenses", value: summary.expenses, to: "/finance/expenses" },
        { label: "Net cash", value: summary.netCash, to: "/finance/cash" },
        { label: "Cash position", value: summary.cashPosition, to: "/finance/cash" },
        { label: "Refunds", value: summary.refunds, to: "/finance/payments" },
      ]
    : [];

  return (
    <PageShell wide>
      <PageHeader
        icon={Landmark}
        title="Finance Dashboard"
        subtitle="Company-wide financial health from /finance/summary and AR/AP outstanding reports."
        breadcrumb={[{ label: "Finance ERP" }, { label: "Dashboard" }]}
      />
      <FinanceModuleNav />
      <JourneyContinuity
        active="finance"
        previousHint="Booking operated · documents verified"
        nextHint="Travel complete → after-sales feedback"
      />
      <NextStepBanner
        title="Finance follows the booking"
        body="Create invoices and record payments from Booking 360. This dashboard is the company lens — not a parallel entry path."
        actions={[
          { label: "Invoices", to: "/finance/invoices", primary: true },
          { label: "Payments", to: "/finance/payments" },
          { label: "New booking", to: "/bookings/new" },
        ]}
      />
      <ErrorBanner message={error} />
      {loading ? (
        <SkeletonRows rows={8} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {cards.map((c) => (
              <Link
                key={c.label}
                to={c.to}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] transition-all hover:border-[var(--accent)] hover:shadow-[var(--shadow-md)]"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {c.label}
                </p>
                <p className="mt-2 text-[20px] font-black tabular-nums text-[var(--primary)]">
                  {fmtBDTCompact(c.value)}
                </p>
                <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{fmtBDTPlain(c.value)}</p>
              </Link>
            ))}
          </div>
          {summary && summary.accounts.length > 0 && (
            <Surface>
              <SurfaceHeader title="Cash & bank accounts" hint="Balances from /accounts via finance summary" />
              <div className="divide-y divide-[var(--border)]">
                {summary.accounts.map((a) => (
                  <div key={a.name} className="flex items-center justify-between px-4 py-3 sm:px-5">
                    <div>
                      <p className="text-[12px] font-semibold text-[var(--primary)]">{a.name}</p>
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">{a.type}</p>
                    </div>
                    <p className="text-[12px] font-bold tabular-nums text-[var(--primary)]">
                      {fmtBDTPlain(a.currentBalance)}
                    </p>
                  </div>
                ))}
              </div>
            </Surface>
          )}
        </>
      )}
    </PageShell>
  );
}
