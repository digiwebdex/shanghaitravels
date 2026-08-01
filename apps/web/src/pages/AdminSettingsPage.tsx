import { FormEvent, useCallback, useEffect, useState } from "react";
import { RefreshCw, Settings } from "lucide-react";
import { adminApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { PageHeader, PageShell, Surface, SurfaceHeader, btnGhost, btnPrimary, btnPrimaryStyle } from "@/components/enterprise/Page";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceById } from "@/workspaces/registry";
import { InlineSpinner } from "@/components/FullPageSpinner";

type SettingRow = { key: string; value: unknown };

export default function AdminSettingsPage() {
  const workspace = workspaceById("admin")!;
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await adminApi.listSettings());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!key.trim()) {
      setError("Key is required");
      return;
    }
    setError("");
    setOk("");
    let parsed: unknown = value;
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = value;
    }
    try {
      await adminApi.setSetting(key.trim(), parsed);
      setOk(`Saved ${key.trim()}`);
      setKey("");
      setValue("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  return (
    <PageShell>
      <PageHeader
        icon={Settings}
        title="System Settings"
        subtitle="Key/value settings from /settings. Requires settings:manage."
        breadcrumb={[{ label: "Administration" }, { label: "System Settings" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <WorkspaceTabsCompact workspace={workspace} />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="settings:manage">
        <Surface>
          <SurfaceHeader title="Upsert setting" hint="Value accepts JSON or plain text." />
          <form onSubmit={(e) => void save(e)} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
            <div>
              <label className={labelCls}>Key *</label>
              <input className={inputCls} value={key} onChange={(e) => setKey(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Value</label>
              <input className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div>
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>Save</button>
            </div>
          </form>
        </Surface>
      </Can>

      <Surface>
        <SurfaceHeader title={`${rows.length} setting${rows.length === 1 ? "" : "s"}`} />
        {loading ? (
          <div className="flex justify-center py-16"><InlineSpinner /></div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-[11.5px] text-slate-400">No settings yet</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((r) => (
              <div key={r.key} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                <p className="font-mono text-[11px] font-bold text-slate-800">{r.key}</p>
                <pre className="max-w-xl overflow-x-auto rounded-lg bg-slate-50 px-2 py-1 font-mono text-[10.5px] text-slate-600">
                  {typeof r.value === "string" ? r.value : JSON.stringify(r.value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </Surface>
    </PageShell>
  );
}
