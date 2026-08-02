import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Workflow } from "lucide-react";
import { workflowApi, type WorkflowTemplate } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { Column, DataTable, Pill } from "@/components/enterprise/DataTable";
import { PageHeader, PageShell, Surface, SurfaceHeader, btnGhost } from "@/components/enterprise/Page";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceById } from "@/workspaces/registry";

export default function OperationsWorkflowPage() {
  const workspace = workspaceById("operations")!;
  const [rows, setRows] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(listOf(await workflowApi.list()));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load workflow templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function activate(id: string) {
    setError("");
    setOk("");
    try {
      await workflowApi.activate(id);
      setOk("Template activated");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Activate failed");
    }
  }

  const columns: Column<WorkflowTemplate>[] = [
    { key: "name", header: "Template", render: (r) => <span className="font-semibold text-[var(--primary)]">{r.name}</span> },
    { key: "service", header: "Service", render: (r) => <Pill value={r.serviceType} tone="blue" /> },
    { key: "ver", header: "Version", render: (r) => `v${r.version}` },
    { key: "stages", header: "Stages", render: (r) => `${r.stages?.length ?? 0}` },
    {
      key: "active",
      header: "Active",
      render: (r) => <Pill value={r.isActive ? "active" : "inactive"} tone={r.isActive ? "green" : "slate"} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) =>
        r.isActive ? null : (
          <Can perm="settings:manage">
            <button
              type="button"
              className="text-[11px] font-semibold text-[var(--accent)] hover:underline"
              onClick={() => void activate(r.id)}
            >
              Activate
            </button>
          </Can>
        ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={Workflow}
        title="Workflow Templates"
        subtitle="Case stage templates per service type. Requires settings:manage."
        breadcrumb={[{ label: "Operations" }, { label: "Workflow" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <WorkspaceTabsCompact workspace={workspace} />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />
      <Surface>
        <SurfaceHeader title={`${rows.length} template${rows.length === 1 ? "" : "s"}`} />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No workflow templates"
        />
      </Surface>
    </PageShell>
  );
}
