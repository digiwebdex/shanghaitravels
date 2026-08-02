import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, RefreshCw } from "lucide-react";
import { crmApi, type CrmLead, type CrmOpportunity } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { CrmModuleNav } from "@/components/crm/CrmModuleNav";
import { CrmJourneyBanner } from "@/components/workflow/CrmJourneyBanner";
import { formatBdt, OPP_STAGES, probabilityLabel, QUOTE_SERVICES, toPoisha } from "@/lib/crm";
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

  const stats = useMemo(() => {
    const open = rows.filter((o) => o.status === "open").length;
    const revenue = rows.reduce((s, o) => s + (o.expectedRevenuePoisha || 0), 0);
    return { open, revenue };
  }, [rows]);

  const columns: Column<CrmOpportunity>[] = [
    { key: "no", header: "No", render: (o) => <span className="font-bold text-[var(--primary)]">{o.opportunityNo}</span> },
    { key: "title", header: "Title", render: (o) => o.title },
    { key: "stage", header: "Stage", render: (o) => <Pill value={o.stage} tone={statusTone(o.stage)} /> },
    { key: "prob", header: "Probability", render: (o) => probabilityLabel(o.probabilityBps) },
    {
      key: "revenue",
      header: "Expected",
      className: "text-right tabular-nums",
      render: (o) => formatBdt(o.expectedRevenuePoisha),
    },
    {
      key: "actions",
      header: "Actions",
      render: (o) => (
        <Can perm="opportunity:manage">
          <div className="flex flex-wrap gap-1">
            {OPP_STAGES.filter((s) => s !== o.stage)
              .slice(0, 4)
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px]"
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
                className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]"
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
                Convert
              </button>
            )}
          </div>
        </Can>
      ),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Briefcase}
        title="Opportunities"
        subtitle="Pipeline stages, probability, and expected revenue."
        breadcrumb={[{ label: "CRM" }, { label: "Opportunities" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <CrmModuleNav />
      <CrmJourneyBanner stage="opportunity" />
      <StatStrip>
        <KpiCard label="Total" value={rows.length} />
        <KpiCard label="Open" value={stats.open} tone="accent" />
        <KpiCard label="Pipeline value" value={formatBdt(stats.revenue)} tone="success" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="opportunity:manage">
        <Surface>
          <SurfaceHeader title="Create opportunity" />
          <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-4 sm:p-5">
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
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Create opportunity
              </button>
            </div>
          </form>
        </Surface>
      </Can>

      <Surface>
        <SurfaceHeader title={`${rows.length} opportunit${rows.length === 1 ? "y" : "ies"}`} />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No opportunities"
        />
      </Surface>
    </PageShell>
  );
}
