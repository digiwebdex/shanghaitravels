import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Building, RefreshCw } from "lucide-react";
import { crmApi, type CrmOrganization } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { CrmModuleNav } from "@/components/crm/CrmModuleNav";
import { ORG_TYPES } from "@/lib/crm";
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

export default function CrmOrganizationsPage() {
  const [rows, setRows] = useState<CrmOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("corporate");
  const [phone, setPhone] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await crmApi.listOrganizations());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load organizations");
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
      await crmApi.createOrganization({ name: name.trim(), type, phone });
      setOk("Organization created");
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  const stats = useMemo(() => {
    const active = rows.filter((o) => o.isActive).length;
    return { active, inactive: rows.length - active };
  }, [rows]);

  const columns: Column<CrmOrganization>[] = [
    { key: "code", header: "Code", render: (o) => <span className="font-mono font-bold">{o.code}</span> },
    { key: "name", header: "Name", render: (o) => o.name },
    { key: "type", header: "Type", render: (o) => <Pill value={o.type} tone={statusTone(o.type)} /> },
    {
      key: "status",
      header: "Status",
      render: (o) => <Pill value={o.isActive ? "active" : "inactive"} tone={statusTone(o.isActive ? "active" : "inactive")} />,
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Building}
        title="Organizations"
        subtitle="Corporate customers, travel agents, partner agencies."
        breadcrumb={[{ label: "CRM" }, { label: "Organizations" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <CrmModuleNav />
      <StatStrip>
        <KpiCard label="Total" value={rows.length} />
        <KpiCard label="Active" value={stats.active} tone="success" />
        <KpiCard label="Inactive" value={stats.inactive} tone="warning" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="corporate:manage">
        <Surface>
          <SurfaceHeader title="Create organization" />
          <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-3 sm:p-5">
            <div>
              <label className={labelCls}>Name *</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Create organization
              </button>
            </div>
          </form>
        </Surface>
      </Can>

      <Surface>
        <SurfaceHeader title={`${rows.length} organization${rows.length === 1 ? "" : "s"}`} />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No organizations"
        />
      </Surface>
    </PageShell>
  );
}
