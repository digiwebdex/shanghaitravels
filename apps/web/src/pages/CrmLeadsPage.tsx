import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { RefreshCw, Users } from "lucide-react";
import { crmApi, type CrmLead } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { CrmModuleNav } from "@/components/crm/CrmModuleNav";
import { PackagePicker } from "@/components/packages/PackagePicker";
import { LEAD_SOURCES, QUOTE_SERVICES, validateLead } from "@/lib/crm";
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
import { CrmJourneyBanner } from "@/components/workflow/CrmJourneyBanner";

export default function CrmLeadsPage() {
  const [rows, setRows] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState<string>("walkin");
  const [serviceInterest, setServiceInterest] = useState("visa");
  const [packageId, setPackageId] = useState("");
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
      const lead = await crmApi.createLead({
        name: name.trim(),
        phone,
        source,
        serviceInterest,
        priority: "warm",
        packageId: packageId || undefined,
      });
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

  const stats = useMemo(() => {
    const open = rows.filter((l) => l.status !== "converted" && l.status !== "lost").length;
    const converted = rows.filter((l) => l.status === "converted").length;
    return { open, converted };
  }, [rows]);

  const columns: Column<CrmLead>[] = [
    { key: "no", header: "No", render: (l) => <span className="font-semibold">{l.leadNo || "—"}</span> },
    { key: "name", header: "Name", render: (l) => l.name },
    { key: "source", header: "Source", render: (l) => l.source || "—" },
    { key: "interest", header: "Interest", render: (l) => l.serviceInterest || "—" },
    { key: "status", header: "Status", render: (l) => <Pill value={l.status} tone={statusTone(l.status)} /> },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Users}
        title="CRM leads"
        subtitle="Web, walk-in, phone, WhatsApp, Facebook, and referral leads."
        breadcrumb={[{ label: "CRM" }, { label: "Leads" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <CrmModuleNav />
      <CrmJourneyBanner stage="lead" />
      <StatStrip>
        <KpiCard label="Total leads" value={rows.length} />
        <KpiCard label="Open" value={stats.open} tone="accent" />
        <KpiCard label="Converted" value={stats.converted} tone="success" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="lead:manage">
        <Surface>
          <SurfaceHeader title="Create lead" />
          <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-4 sm:p-5">
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
            <div className="sm:col-span-2">
              <PackagePicker value={packageId} onChange={(id) => setPackageId(id)} label="Package (optional)" />
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Create lead
              </button>
            </div>
          </form>
        </Surface>
      </Can>

      <Can perm="crm:convert">
        <Surface padded className="flex flex-wrap items-end gap-2">
          <div className="min-w-[180px]">
            <label className={labelCls}>Convert lead</label>
            <select className={inputCls} value={convertLeadId} onChange={(e) => setConvertLeadId(e.target.value)}>
              <option value="">Select…</option>
              {rows
                .filter((l) => l.status !== "converted")
                .map((l) => (
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
          <button type="button" onClick={() => void convert()} className={btnGhost}>
            Convert to case
          </button>
        </Surface>
      </Can>

      <Surface>
        <SurfaceHeader
          title={`${rows.length} lead${rows.length === 1 ? "" : "s"}`}
          action={
            <Link className="text-[11px] font-semibold text-[var(--accent)] hover:underline" to="/crm/opportunities">
              Opportunities →
            </Link>
          }
        />
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No leads yet" />
      </Surface>
    </PageShell>
  );
}
