import { FormEvent, useCallback, useEffect, useState } from "react";
import { Menu, RefreshCw } from "lucide-react";
import { cmsApi, type CmsMenu } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import { Column, DataTable } from "@/components/enterprise/DataTable";
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

export default function CmsMenusPage() {
  const [rows, setRows] = useState<CmsMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [code, setCode] = useState("main");
  const [name, setName] = useState("Main navigation");
  const [itemsJson, setItemsJson] = useState(
    '[{"label":"Home","href":"/#/site","sortOrder":10},{"label":"Contact","href":"/#/site/enquire","sortOrder":90}]',
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await cmsApi.listMenus());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load menus");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      const items = JSON.parse(itemsJson) as { label: string; href: string; sortOrder?: number }[];
      await cmsApi.upsertMenu({ code: code.trim(), name: name.trim(), items });
      setOk("Menu saved");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid menu JSON or save failed");
    }
  }

  const columns: Column<CmsMenu>[] = [
    {
      key: "name",
      header: "Menu",
      render: (m) => (
        <span className="font-bold">
          {m.name} <span className="font-normal text-[var(--muted-foreground)]">({m.code})</span>
        </span>
      ),
    },
    {
      key: "items",
      header: "Items",
      render: (m) => (
        <ul className="space-y-0.5 text-[var(--muted-foreground)]">
          {(m.items || []).map((i) => (
            <li key={i.id}>
              {i.sortOrder}. {i.label} → {i.href}
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "count",
      header: "Count",
      className: "tabular-nums",
      render: (m) => (m.items || []).length,
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Menu}
        title="Menu manager"
        subtitle="Named menus with ordered items for the public site."
        breadcrumb={[{ label: "Website & CMS" }, { label: "Menus" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <CmsModuleNav />
      <StatStrip>
        <KpiCard label="Menus" value={rows.length} />
        <KpiCard label="Total items" value={rows.reduce((s, m) => s + (m.items?.length || 0), 0)} tone="accent" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="cms:manage">
        <Surface>
          <SurfaceHeader title="Save menu" />
          <form onSubmit={save} className="space-y-3 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={labelCls}>Code</label>
                <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Name</label>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Items JSON</label>
              <textarea className={inputCls} rows={4} value={itemsJson} onChange={(e) => setItemsJson(e.target.value)} />
            </div>
            <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
              Save menu
            </button>
          </form>
        </Surface>
      </Can>

      <Surface>
        <SurfaceHeader title={`${rows.length} menu${rows.length === 1 ? "" : "s"}`} />
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No menus" />
      </Surface>
    </PageShell>
  );
}
