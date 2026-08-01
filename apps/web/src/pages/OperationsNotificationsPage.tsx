import { useCallback, useEffect, useState } from "react";
import { Bell, RefreshCw } from "lucide-react";
import { notificationsApi, type NotificationRow } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import { PageHeader, PageShell, Surface, SurfaceHeader, btnGhost, btnPrimary, btnPrimaryStyle } from "@/components/enterprise/Page";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceById } from "@/workspaces/registry";

export default function OperationsNotificationsPage() {
  const workspace = workspaceById("operations")!;
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await notificationsApi.list({ limit: 100 }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function process() {
    setError("");
    setOk("");
    try {
      const r = await notificationsApi.process();
      setOk(`${r.note} · pending ${r.pending}`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Process failed");
    }
  }

  const columns: Column<NotificationRow>[] = [
    { key: "channel", header: "Channel", render: (r) => <Pill value={r.channel} tone="blue" /> },
    { key: "to", header: "Recipient", render: (r) => r.recipient },
    { key: "subject", header: "Subject", render: (r) => r.subject || r.body.slice(0, 60) },
    { key: "status", header: "Status", render: (r) => <Pill value={r.status} tone={statusTone(r.status)} /> },
    { key: "date", header: "Created", render: (r) => r.createdAt?.slice(0, 16).replace("T", " ") || "—" },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Bell}
        title="Notifications"
        subtitle="Outbox from /notifications. Delivery adapters are not configured — rows stay pending."
        breadcrumb={[{ label: "Operations" }, { label: "Notifications" }]}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={() => void load()}>
              <RefreshCw size={12} /> Refresh
            </button>
            <Can perm="communication:manage">
              <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={() => void process()}>
                Process pending
              </button>
            </Can>
          </>
        }
      />
      <WorkspaceTabsCompact workspace={workspace} />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />
      <Surface>
        <SurfaceHeader title={`${rows.length} notification${rows.length === 1 ? "" : "s"}`} />
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No notifications" />
      </Surface>
    </PageShell>
  );
}
