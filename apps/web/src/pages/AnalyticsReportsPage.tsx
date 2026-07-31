import { FormEvent, useCallback, useEffect, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { analyticsApi, type AnalyticsFilters, type AnalyticsSchedule, type AnalyticsTemplate } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
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

  return (
    <div>
      <DemoBadge moduleKey="analytics" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-amber-600" /> Analytics reports
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Saved templates, dashboard filters, CSV/Excel/PDF export, scheduled report definitions.
          </p>
        </div>
        <AnalyticsModuleNav />
        <AnalyticsFiltersBar value={filters} onChange={setFilters} onApply={() => setOk("Filters ready for export / templates")} />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <Can perm="analytics:export">
          <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
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
                className="inline-block px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
                href={`${ERP}${analyticsApi.exportUrl(exportReport, exportFormat, filters)}`}
                target="_blank"
                rel="noreferrer"
              >
                Export {exportFormat.toUpperCase()}
              </a>
            </div>
          </div>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h2 className="text-[12px] font-bold">Saved templates</h2>
              <Can perm="analytics:manage">
                <form onSubmit={(e) => void createTpl(e)} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input className={inputCls} placeholder="code" value={code} onChange={(e) => setCode(e.target.value)} />
                  <input className={inputCls} placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
                  <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                    {ANALYTICS_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-semibold border border-slate-200">
                    Save template
                  </button>
                </form>
              </Can>
              <ul className="text-[11px] space-y-1">
                {templates.map((t) => (
                  <li key={t.id} className="border-b border-slate-50 pb-1">
                    <span className="font-bold">{t.code}</span> {t.name} · {t.category}
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h2 className="text-[12px] font-bold">Scheduled definitions</h2>
              <p className="text-[10px] text-slate-500">Definitions only — execution engine later.</p>
              <Can perm="analytics:manage">
                <form onSubmit={(e) => void createSched(e)} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input className={inputCls} placeholder="schedule name" value={schedName} onChange={(e) => setSchedName(e.target.value)} />
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
                  <button type="submit" className="sm:col-span-2 px-3 py-1.5 rounded-lg text-[10.5px] font-semibold border border-slate-200">
                    Save schedule definition
                  </button>
                </form>
              </Can>
              <ul className="text-[11px] space-y-1">
                {schedules.map((s) => (
                  <li key={s.id} className="border-b border-slate-50 pb-1">
                    <span className="font-bold">{s.name}</span> · {s.cronExpr} · {s.format} · {s.isActive ? "active" : "off"}
                  </li>
                ))}
                {schedules.length === 0 && <li className="text-slate-400">No schedules.</li>}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
