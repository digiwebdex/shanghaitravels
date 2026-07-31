import { FormEvent, useCallback, useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { crmApi, type CrmLead, type CrmOpportunity } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { CrmModuleNav } from "@/components/crm/CrmModuleNav";
import { formatBdt, OPP_STAGES, probabilityLabel, QUOTE_SERVICES, toPoisha } from "@/lib/crm";

export default function CrmOpportunitiesPage() {
  const [rows, setRows] = useState<CrmOpportunity[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [title, setTitle] = useState("");
  const [leadId, setLeadId] = useState("");
  const [serviceType, setServiceType] = useState("visa");
  const [revenueBdt, setRevenueBdt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [opps, ld] = await Promise.all([crmApi.listOpportunities(), crmApi.listLeads({ limit: 100 })]);
      setRows(opps);
      setLeads(ld.data || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      await crmApi.createOpportunity({
        title: title.trim(),
        leadId: leadId || undefined,
        serviceType,
        expectedRevenuePoisha: revenueBdt ? toPoisha(revenueBdt) : 0,
      });
      setOk("Opportunity created");
      setTitle("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="crm" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Briefcase size={16} className="text-amber-600" /> Opportunities
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Pipeline stages, probability, and expected revenue.</p>
        </div>
        <CrmModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <Can perm="opportunity:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Title *</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required />
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
              <label className={labelCls}>Expected revenue (BDT)</label>
              <input className={inputCls} value={revenueBdt} onChange={(e) => setRevenueBdt(e.target.value)} />
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                Create opportunity
              </button>
            </div>
          </form>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            {rows.map((o) => (
              <div key={o.id} className="border-b border-slate-50 pb-3 text-[11px]">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-bold text-slate-800">{o.opportunityNo}</span>
                  <span>{o.title}</span>
                  <span className="text-slate-500">{o.stage}</span>
                  <span>{probabilityLabel(o.probabilityBps)}</span>
                  <span className="font-semibold">{formatBdt(o.expectedRevenuePoisha)}</span>
                </div>
                <Can perm="opportunity:manage">
                  <div className="flex flex-wrap gap-1 mt-2">
                    {OPP_STAGES.filter((s) => s !== o.stage).slice(0, 5).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="px-2 py-0.5 rounded border border-slate-200 text-[10px]"
                        onClick={() =>
                          void crmApi
                            .setOpportunityStage(o.id, s)
                            .then(() => load())
                            .catch((e) => setError(e instanceof ApiError ? e.message : "Stage failed"))
                        }
                      >
                        → {s}
                      </button>
                    ))}
                    {o.status === "open" && (
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded border border-amber-200 text-[10px] text-amber-800 font-semibold"
                        onClick={() =>
                          void crmApi
                            .convert({ opportunityId: o.id, serviceType: o.serviceType || "visa" })
                            .then((r) => {
                              setOk(`Converted → ${r.application.referenceNo}`);
                              return load();
                            })
                            .catch((e) => setError(e instanceof ApiError ? e.message : "Convert failed"))
                        }
                      >
                        Convert to case
                      </button>
                    )}
                  </div>
                </Can>
              </div>
            ))}
            {rows.length === 0 && <p className="text-[11px] text-slate-400">No opportunities.</p>}
          </section>
        )}
      </div>
    </div>
  );
}
