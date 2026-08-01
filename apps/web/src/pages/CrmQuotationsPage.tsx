import { FormEvent, useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { crmApi, type CrmLead, type CrmOpportunity, type CrmQuotation } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { CrmModuleNav } from "@/components/crm/CrmModuleNav";
import { formatBdt, QUOTE_SERVICES, toPoisha, validateQuoteLines } from "@/lib/crm";

export default function CrmQuotationsPage() {
  const [rows, setRows] = useState<CrmQuotation[]>([]);
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [q, ld, op] = await Promise.all([
        crmApi.listQuotations(),
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
    const lines = [{ description: desc, amountBdt }];
    const bad = validateQuoteLines(lines);
    if (bad) {
      setError(bad);
      return;
    }
    try {
      const quote = await crmApi.createQuotation({
        serviceType,
        leadId: leadId || undefined,
        opportunityId: opportunityId || undefined,
        lines: [{ description: desc.trim(), quantity: 1, unitPricePoisha: toPoisha(amountBdt) }],
      });
      setOk(`Quote ${quote.quoteNo} created`);
      setDesc("");
      setAmountBdt("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={FileText}
        title="Quotations"
        subtitle="Visa, ticket, hotel, tour, and Hajj & Umrah quotes."
        breadcrumb={[{ label: "CRM", to: "/crm" }, { label: "Quotations" }]}
      />
      <CrmModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <Can perm="quote:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
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
              <label className={labelCls}>Amount (BDT)</label>
              <input className={inputCls} value={amountBdt} onChange={(e) => setAmountBdt(e.target.value)} required />
            </div>
            <div className="sm:col-span-4">
              <label className={labelCls}>Description</label>
              <input className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} required />
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}>
                Create quotation
              </button>
            </div>
          </form>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <ul className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            {rows.map((q) => (
              <li key={q.id} className="text-[11px] flex flex-wrap gap-2 items-center border-b border-slate-50 pb-2">
                <span className="font-bold">{q.quoteNo}</span>
                <span>{q.serviceType}</span>
                <span className="text-slate-500">{q.status}</span>
                <span className="font-semibold">{formatBdt(q.totalPoisha)}</span>
                {q.status === "draft" && (
                  <Can perm="quote:manage">
                    <button
                      type="button"
                      className="text-[10px] font-semibold text-amber-700"
                      onClick={() =>
                        void crmApi
                          .setQuotationStatus(q.id, "sent")
                          .then(() => load())
                          .catch((e) => setError(e instanceof ApiError ? e.message : "Status failed"))
                      }
                    >
                      Mark sent
                    </button>
                  </Can>
                )}
              </li>
            ))}
            {rows.length === 0 && <p className="text-[11px] text-slate-400">No quotations.</p>}
          </ul>
        )}
    </PageShell>
  );
}
