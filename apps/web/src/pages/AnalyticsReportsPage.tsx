import { FormEvent, useCallback, useEffect, useState } from "react";
import { FileSpreadsheet, RefreshCw } from "lucide-react";
import { analyticsApi, type AnalyticsFilters, type AnalyticsSchedule, type AnalyticsTemplate } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { AnalyticsModuleNav } from "@/components/analytics/AnalyticsModuleNav";
import { AnalyticsFiltersBar } from "@/components/analytics/AnalyticsFiltersBar";
import { ERP } from "@/config/env";
import {
  ANALYTICS_CATEGORIES,
  CRON_PRESETS,
  EXPORT_FORMATS,
  validateReportTemplate,
  validateSchedule,
} from "@/lib/analytics";
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

export default function AnalyticsReportsPage() {
  const [templates, setTemplates] = useState<AnalyticsTemplate[]>([]);
  const [schedules, setSchedules] = useState<AnalyticsSchedule[]>([]);
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [exportReport, setExportReport] = useState("executive");
  const [exportFormat, setExportFormat] = useState("csv");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("executive");
  const [schedName, setSchedName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [cronExpr, setCronExpr] = useState<string>(CRON_PRESETS[0].value);
  const [schedFormat, setSchedFormat] = useState("csv");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await analyticsApi.bootstrap().catch(() => null);
      const [t, s] = await Promise.all([analyticsApi.listTemplates(), analyticsApi.listSchedules()]);
      setTemplates(t);
      setSchedules(s);
      if (!templateId && t[0]) setTemplateId(t[0].id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load report tools");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTpl(e: FormEvent) {
    e.preventDefault();
    const bad = validateReportTemplate({ code, name, category });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await analyticsApi.createTemplate({
        code: code.trim(),
        name: name.trim(),
        category,
        definition: { metrics: [category], defaultFilters: filters },
      });
      setOk("Template saved");
      setCode("");
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Template create failed");
    }
  }

  async function createSched(e: FormEvent) {
    e.preventDefault();
    const bad = validateSchedule({ templateId, name: schedName, cronExpr, format: schedFormat });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await analyticsApi.createSchedule({
        templateId,
        name: schedName.trim(),
        cronExpr,
        format: schedFormat,
        filters,
        recipients: [],
      });
      setOk("Schedule definition saved (execution engine deferred)");
      setSchedName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Schedule create failed");
    }
  }

  const tplColumns: Column<AnalyticsTemplate>[] = [
    { key: "code", header: "Code", render: (t) => <span className="font-bold">{t.code}</span> },
    { key: "name", header: "Name", render: (t) => t.name },
    { key: "category", header: "Category", render: (t) => t.category },
  ];

  const schedColumns: Column<AnalyticsSchedule>[] = [
    { key: "name", header: "Name", render: (s) => <span className="font-bold">{s.name}</span> },
    { key: "cron", header: "Cron", render: (s) => s.cronExpr },
    { key: "format", header: "Format", render: (s) => s.format },
    {
      key: "status",
      header: "Status",
      render: (s) => <Pill value={s.isActive ? "active" : "inactive"} tone={statusTone(s.isActive ? "active" : "inactive")} />,
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={FileSpreadsheet}
        title="Analytics reports"
        subtitle="Saved templates, dashboard filters, CSV/Excel/PDF export, scheduled report definitions."
        breadcrumb={[{ label: "Analytics" }, { label: "Reports" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <AnalyticsModuleNav />
      <StatStrip>
        <KpiCard label="Templates" value={templates.length} />
        <KpiCard label="Schedules" value={schedules.length} tone="accent" />
      </StatStrip>
      <AnalyticsFiltersBar value={filters} onChange={setFilters} onApply={() => setOk("Filters ready for export / templates")} />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="analytics:export">
        <Surface padded>
          <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-4">
            <div>
              <label className={labelCls}>Report</label>
              <select className={inputCls} value={exportReport} onChange={(e) => setExportReport(e.target.value)}>
                {ANALYTICS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Format</label>
              <select className={inputCls} value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                {EXPORT_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <a
                className={btnPrimary}
                style={btnPrimaryStyle}
                href={`${ERP}${analyticsApi.exportUrl(exportReport, exportFormat, filters)}`}
                target="_blank"
                rel="noreferrer"
              >
                Export {exportFormat.toUpperCase()}
              </a>
            </div>
          </div>
        </Surface>
      </Can>

      {loading ? (
        <Surface padded>
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        </Surface>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Surface>
            <SurfaceHeader title="Saved templates" />
            <Can perm="analytics:manage">
              <form onSubmit={(e) => void createTpl(e)} className="grid grid-cols-1 gap-2 border-b border-[var(--border)] p-4 sm:grid-cols-2 sm:p-5">
                <input className={inputCls} placeholder="code" value={code} onChange={(e) => setCode(e.target.value)} />
                <input className={inputCls} placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
                <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {ANALYTICS_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button type="submit" className={btnGhost}>
                  Save template
                </button>
              </form>
            </Can>
            <DataTable
              rows={templates}
              columns={tplColumns}
              rowKey={(r) => r.id}
              emptyTitle="No templates"
              maxHeight={280}
            />
          </Surface>
          <Surface>
            <SurfaceHeader title="Scheduled definitions" hint="Definitions only — execution engine later." />
            <Can perm="analytics:manage">
              <form onSubmit={(e) => void createSched(e)} className="grid grid-cols-1 gap-2 border-b border-[var(--border)] p-4 sm:grid-cols-2 sm:p-5">
                <input
                  className={inputCls}
                  placeholder="schedule name"
                  value={schedName}
                  onChange={(e) => setSchedName(e.target.value)}
                />
                <select className={inputCls} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code}
                    </option>
                  ))}
                </select>
                <select className={inputCls} value={cronExpr} onChange={(e) => setCronExpr(e.target.value)}>
                  {CRON_PRESETS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select className={inputCls} value={schedFormat} onChange={(e) => setSchedFormat(e.target.value)}>
                  {EXPORT_FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <button type="submit" className={`${btnGhost} sm:col-span-2`}>
                  Save schedule definition
                </button>
              </form>
            </Can>
            <DataTable
              rows={schedules}
              columns={schedColumns}
              rowKey={(r) => r.id}
              emptyTitle="No schedules"
              maxHeight={280}
            />
          </Surface>
        </div>
      )}
    </PageShell>
  );
}
