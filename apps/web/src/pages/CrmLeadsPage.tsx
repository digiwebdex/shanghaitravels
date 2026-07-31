import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Users } from "lucide-react";
import { crmApi, type CrmLead } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { CrmModuleNav } from "@/components/crm/CrmModuleNav";
import { LEAD_SOURCES, QUOTE_SERVICES, validateLead } from "@/lib/crm";

export default function CrmLeadsPage() {
  const [rows, setRows] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState<string>("walkin");
  const [serviceInterest, setServiceInterest] = useState("visa");
  const [convertLeadId, setConvertLeadId] = useState("");
  const [convertService, setConvertService] = useState("visa");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await crmApi.listLeads({ limit: 100 });
      setRows(r.data || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    const bad = validateLead({ name, source });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      const lead = await crmApi.createLead({ name: name.trim(), phone, source, serviceInterest, priority: "warm" });
      setOk(`Lead ${lead.leadNo || lead.name} created`);
      setName("");
      setPhone("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function convert() {
    if (!convertLeadId) {
      setError("Select a lead to convert");
      return;
    }
    try {
      const r = await crmApi.convert({ leadId: convertLeadId, serviceType: convertService });
      setOk(`Converted → ${r.application.referenceNo}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Convert failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="crm" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Users size={16} className="text-amber-600" /> CRM leads
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Web, walk-in, phone, WhatsApp, Facebook, and referral leads.
          </p>
        </div>
        <CrmModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="lead:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label className={labelCls}>Name *</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Source</label>
              <select className={inputCls} value={source} onChange={(e) => setSource(e.target.value)}>
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Interest</label>
              <select className={inputCls} value={serviceInterest} onChange={(e) => setServiceInterest(e.target.value)}>
                {QUOTE_SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                Create lead
              </button>
            </div>
          </form>
        </Can>

        <Can perm="crm:convert">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-2 items-end">
            <div className="min-w-[180px]">
              <label className={labelCls}>Convert lead</label>
              <select className={inputCls} value={convertLeadId} onChange={(e) => setConvertLeadId(e.target.value)}>
                <option value="">Select…</option>
                {rows.filter((l) => l.status !== "converted").map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.leadNo || l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Case type</label>
              <select className={inputCls} value={convertService} onChange={(e) => setConvertService(e.target.value)}>
                {QUOTE_SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" onClick={() => void convert()} className="px-3 py-1.5 rounded-lg border border-amber-200 text-[10.5px] font-semibold text-amber-800">
              Convert to case
            </button>
          </div>
        </Can>

        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                  <th className="px-2 py-2 font-bold">No</th>
                  <th className="px-2 py-2 font-bold">Name</th>
                  <th className="px-2 py-2 font-bold">Source</th>
                  <th className="px-2 py-2 font-bold">Interest</th>
                  <th className="px-2 py-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id} className="border-b border-slate-50 text-[11px]">
                    <td className="px-2 py-1.5 font-semibold">{l.leadNo || "—"}</td>
                    <td className="px-2 py-1.5">{l.name}</td>
                    <td className="px-2 py-1.5">{l.source || "—"}</td>
                    <td className="px-2 py-1.5">{l.serviceInterest || "—"}</td>
                    <td className="px-2 py-1.5">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="text-[11px] text-slate-400">No leads yet.</p>}
            <p className="text-[10px] text-slate-400 mt-3">
              Pipeline: <Link className="text-amber-700 font-semibold" to="/crm/opportunities">Opportunities</Link>
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
