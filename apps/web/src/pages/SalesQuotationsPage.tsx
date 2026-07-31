import { FormEvent, useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { crmApi, salesApi, type CrmLead, type CrmOpportunity, type SalesQuotation } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { SalesModuleNav } from "@/components/sales/SalesModuleNav";
import { ERP } from "@/config/env";
import { formatBdt, QUOTE_SERVICES, toPoisha } from "@/lib/crm";
import { canApproveQuote, canConvertQuote, canSubmitQuote, validateSalesQuote } from "@/lib/sales";

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

  return (
    <div>
      <DemoBadge moduleKey="sales" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <FileText size={16} className="text-amber-600" /> Sales quotations
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Versioned quotes with discounts, tax, validity, approval, PDF/HTML export, and booking conversion.
          </p>
        </div>
        <SalesModuleNav />
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
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
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
          <ul className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            {rows.map((q) => (
              <li key={q.id} className="text-[11px] border-b border-slate-50 pb-3 space-y-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-bold">{q.quoteNo}</span>
                  <span>v{q.version}</span>
                  <span>{q.serviceType}</span>
                  <span className="text-slate-500">{q.status}</span>
                  <span className="font-semibold">{formatBdt(q.totalPoisha)}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {canSubmitQuote(q.status) && (
                    <Can perm="quote:manage">
                      <button type="button" className="px-2 py-0.5 rounded border border-slate-200 text-[10px]" onClick={() => void act("Submitted", () => salesApi.submitQuotation(q.id))}>
                        Submit
                      </button>
                    </Can>
                  )}
                  {canApproveQuote(q.status) && (
                    <Can perm="quote:approve">
                      <button type="button" className="px-2 py-0.5 rounded border border-emerald-200 text-[10px] text-emerald-800" onClick={() => void act("Approved", () => salesApi.approveQuotation(q.id))}>
                        Approve
                      </button>
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded border border-rose-200 text-[10px] text-rose-800"
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
                        className="px-2 py-0.5 rounded border border-slate-200 text-[10px]"
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
                        Send / email-ready
                      </button>
                    </Can>
                  )}
                  <Can perm="quote:manage">
                    <button type="button" className="px-2 py-0.5 rounded border border-slate-200 text-[10px]" onClick={() => void act("Revised", () => salesApi.reviseQuotation(q.id))}>
                      Revise
                    </button>
                  </Can>
                  <a className="px-2 py-0.5 rounded border border-slate-200 text-[10px]" href={`${ERP}${salesApi.exportQuotationUrl(q.id)}`} target="_blank" rel="noreferrer">
                    PDF / HTML
                  </a>
                  {canConvertQuote(q.status) && (
                    <Can perm="crm:convert">
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded border border-amber-200 text-[10px] text-amber-900 font-semibold"
                        onClick={() =>
                          void act("Converted", async () => {
                            const r = await salesApi.convert({ quotationId: q.id, serviceType: q.serviceType });
                            setOk(`Converted → ${r.application.referenceNo}`);
                          })
                        }
                      >
                        Convert to booking
                      </button>
                    </Can>
                  )}
                </div>
              </li>
            ))}
            {rows.length === 0 && <p className="text-[11px] text-slate-400">No sales quotations yet.</p>}
          </ul>
        )}
        {emailPreview && (
          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-[12px] font-bold mb-2">Email-ready preview</h2>
            <iframe title="quote-email" className="w-full h-64 border border-slate-100 rounded-lg" srcDoc={emailPreview} />
          </section>
        )}
      </div>
    </div>
  );
}
