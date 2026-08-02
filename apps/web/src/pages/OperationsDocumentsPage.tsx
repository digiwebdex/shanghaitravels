import { useEffect, useState } from "react";
import { Files, RefreshCw } from "lucide-react";
import { apiFetch, ApiError, listOf } from "@/lib/api";
import { ErrorBanner } from "@/components/Feedback";
import { Column, DataTable, Pill } from "@/components/enterprise/DataTable";
import { PageHeader, PageShell, Surface, SurfaceHeader, btnGhost } from "@/components/enterprise/Page";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceById } from "@/workspaces/registry";

type PassportDoc = {
  id: string;
  fileName?: string | null;
  customerId?: string | null;
  createdAt?: string;
  status?: string;
};

export default function OperationsDocumentsPage() {
  const workspace = workspaceById("doc-intel")!;
  const [rows, setRows] = useState<PassportDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await apiFetch<PassportDoc[] | { data: PassportDoc[] }>("/documents/passports");
      setRows(listOf(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const columns: Column<PassportDoc>[] = [
    { key: "file", header: "File", render: (r) => r.fileName || r.id },
    { key: "customer", header: "Customer", render: (r) => r.customerId || "—" },
    { key: "status", header: "Status", render: (r) => <Pill value={r.status || "stored"} tone="blue" /> },
    { key: "date", header: "Uploaded", render: (r) => r.createdAt?.slice(0, 10) || "—" },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={Files}
        title="Documents"
        subtitle="Passport documents from /documents/passports. Requires document:read-passport."
        breadcrumb={[{ label: "Operations" }, { label: "Documents" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <WorkspaceTabsCompact workspace={workspace} />
      <ErrorBanner message={error} />
      <Surface>
        <SurfaceHeader title={`${rows.length} document${rows.length === 1 ? "" : "s"}`} />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No passport documents"
          emptyHint="Upload passports from Passport Management."
        />
      </Surface>
    </PageShell>
  );
}
