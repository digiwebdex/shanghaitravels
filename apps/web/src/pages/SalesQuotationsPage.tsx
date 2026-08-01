import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { crmApi, salesApi, type CrmLead, type CrmOpportunity, type SalesQuotation } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { SalesModuleNav } from "@/components/sales/SalesModuleNav";
import { ERP } from "@/config/env";
import { formatBdt, QUOTE_SERVICES, toPoisha } from "@/lib/crm";
import { canApproveQuote, canConvertQuote, canSubmitQuote, validateSalesQuote } from "@/lib/sales";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  KpiCard,
  PageHeader,
  PageShell,
  StatStrip,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";

export default function SalesQuotationsPage() {
  const [rows, setRows] = useState<SalesQuotation[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [opps, setOpps] = useState<CrmOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [serviceType, setServiceType] = useState("visa");
  const [leadId, setLeadId] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [desc, setDesc] = useState("");
  const [amountBdt, setAmountBdt] = useState("");
  const [discountBdt, setDiscountBdt] = useState("0");
  const [taxBdt, setTaxBdt] = useState("0");
  const [validUntil, setValidUntil] = useState("");
  const [emailPreview, setEmailPreview] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [q, ld, op] = await Promise.all([
        salesApi.listQuotations(),
        crmApi.listLeads({ limit: 50 }),
        crmApi.listOpportunities(),
      ]);
      setRows(q);
      setLeads(ld.data || []);
      setOpps(op);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load quotations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    const bad = validateSalesQuote({
      serviceType,
      lines: [{ description: desc, unitPriceBdt: amountBdt, quantity: "1" }],
    });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      const quote = await salesApi.createQuotation({
        serviceType,
        leadId: leadId || undefined,
        opportunityId: opportunityId || undefined,
        discountPoisha: toPoisha(discountBdt || "0"),
        taxPoisha: toPoisha(taxBdt || "0"),
        validUntil: validUntil || undefined,
        lines: [{ description: desc.trim(), quantity: 1, unitPricePoisha: toPoisha(amountBdt) }],
      });
      setOk(`Quote ${quote.quoteNo} v${quote.version} created`);
      setDesc("");
      setAmountBdt("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function act(label: string, fn: () => Promise<unknown>) {
    try {
      await fn();
      setOk(label);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : `${label} failed`);
    }
  }

  const stats = useMemo(() => {
    const approved = rows.filter((q) => q.status === "approved" || q.status === "accepted").length;
    const draft = rows.filter((q) => q.status === "draft").length;
    const total = rows.reduce((s, q) => s + (q.totalPoisha || 0), 0);
    return { approved, draft, total };
  }, [rows]);

  const columns: Column<SalesQuotation>[] = [
    {
      key: "no",
      header: "Quote",
      render: (q) => (
        <span className="font-bold">
          {q.quoteNo} <span className="font-normal text-[var(--muted-foreground)]">v{q.version}</span>
        </span>
      ),
    },
    { key: "service", header: "Service", render: (q) => q.serviceType },
    { key: "status", header: "Status", render: (q) => <Pill value={q.status} tone={statusTone(q.status)} /> },
    {
      key: "total",
      header: "Total",
      className: "text-right tabular-nums font-semibold",
      render: (q) => formatBdt(q.totalPoisha),
    },
    {
      key: "actions",
      header: "Actions",
      render: (q) => (
        <div className="flex flex-wrap gap-1">
          {canSubmitQuote(q.status) && (
            <Can perm="quote:manage">
              <button
                type="button"
                className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px]"
                onClick={() => void act("Submitted", () => salesApi.submitQuotation(q.id))}
              >
                Submit
              </button>
            </Can>
          )}
          {canApproveQuote(q.status) && (
            <Can perm="quote:approve">
              <button
                type="button"
                className="rounded border border-emerald-200 px-2 py-0.5 text-[10px] text-emerald-800"
                onClick={() => void act("Approved", () => salesApi.approveQuotation(q.id))}
              >
                Approve
              </button>
              <button
                type="button"
                className="rounded border border-rose-200 px-2 py-0.5 text-[10px] text-rose-800"
                onClick={() => void act("Rejected", () => salesApi.rejectQuotation(q.id, "Needs revision"))}
              >
                Reject
              </button>
            </Can>
          )}
          {(q.status === "approved" || q.status === "accepted") && (
            <Can perm="quote:manage">
              <button
                type="button"
                className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px]"
                onClick={() =>
                  void salesApi
                    .sendQuotation(q.id)
                    .then((r) => {
                      setEmailPreview(r.emailReady.html);
                      setOk("Email-ready quotation prepared");
                      return load();
                    })
                    .catch((e) => setError(e instanceof ApiError ? e.message : "Send failed"))
                }
              >
                Send
              </button>
            </Can>
          )}
          <Can perm="quote:manage">
            <button
              type="button"
              className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px]"
              onClick={() => void act("Revised", () => salesApi.reviseQuotation(q.id))}
            >
              Revise
            </button>
          </Can>
          <a
            className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px]"
            href={`${ERP}${salesApi.exportQuotationUrl(q.id)}`}
            target="_blank"
            rel="noreferrer"
          >
            PDF
          </a>
          {canConvertQuote(q.status) && (
            <Can perm="crm:convert">
              <button
                type="button"
                className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]"
                onClick={() =>
                  void act("Converted", async () => {
                    const r = await salesApi.convert({ quotationId: q.id, serviceType: q.serviceType });
                    setOk(`Converted → ${r.application.referenceNo}`);
                  })
                }
              >
                Convert
              </button>
            </Can>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={FileText}
        title="Sales quotations"
        subtitle="Versioned quotes with discounts, tax, validity, approval, PDF/HTML export, and booking conversion."
        breadcrumb={[{ label: "Sales" }, { label: "Quotations" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <SalesModuleNav />
      <StatStrip>
        <KpiCard label="Quotes" value={rows.length} />
        <KpiCard label="Draft" value={stats.draft} tone="warning" />
        <KpiCard label="Approved" value={stats.approved} tone="success" />
        <KpiCard label="Quoted value" value={formatBdt(stats.total)} tone="accent" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="quote:manage">
        <Surface>
          <SurfaceHeader title="Create quotation" />
          <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-4 sm:p-5">
            <div>
              <label className={labelCls}>Service</label>
              <select className={inputCls} value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                {QUOTE_SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Lead</label>
              <select className={inputCls} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
                <option value="">Optional…</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Opportunity</label>
              <select className={inputCls} value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)}>
                <option value="">Optional…</option>
                {opps.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.opportunityNo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Valid until</label>
              <input type="date" className={inputCls} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <input className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Unit price (BDT)</label>
              <input className={inputCls} value={amountBdt} onChange={(e) => setAmountBdt(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Discount (BDT)</label>
              <input className={inputCls} value={discountBdt} onChange={(e) => setDiscountBdt(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Tax (BDT)</label>
              <input className={inputCls} value={taxBdt} onChange={(e) => setTaxBdt(e.target.value)} />
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Create quotation
              </button>
            </div>
          </form>
        </Surface>
      </Can>

      <Surface>
        <SurfaceHeader title={`${rows.length} quotation${rows.length === 1 ? "" : "s"}`} />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No sales quotations yet"
        />
      </Surface>

      {emailPreview && (
        <Surface>
          <SurfaceHeader title="Email-ready preview" />
          <div className="p-4 sm:p-5">
            <iframe title="quote-email" className="h-64 w-full rounded-lg ring-1 ring-[var(--ring-card)]" srcDoc={emailPreview} />
          </div>
        </Surface>
      )}
    </PageShell>
  );
}
