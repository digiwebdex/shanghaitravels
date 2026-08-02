import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, UserCog } from "lucide-react";
import { adminApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { StaffUser } from "@/lib/types";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  PageHeader,
  PageShell,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
} from "@/components/enterprise/Page";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceById } from "@/workspaces/registry";

const STAFF_ROLES = [
  "visa_executive",
  "visa_consultant",
  "office_incharge",
  "accounts_manager",
  "marketing_manager",
  "general_manager",
];

type Created = { email: string; tempPassword: string };

export default function AdminUsersPage() {
  const workspace = workspaceById("admin")!;
  const [rows, setRows] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [created, setCreated] = useState<Created | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", role: "visa_executive" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(listOf(await adminApi.listUsers()));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    setCreated(null);
    try {
      const r = (await adminApi.createUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
      })) as { email?: string; tempPassword?: string };
      setOk("Staff user created");
      setCreated({ email: r.email || form.email, tempPassword: r.tempPassword || "" });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function toggle(id: string, status: string) {
    try {
      await adminApi.updateUser(id, { status: status === "active" ? "disabled" : "active" });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Update failed");
    }
  }

  const columns: Column<StaffUser>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-semibold text-[var(--primary)]">{r.fullName}</span> },
    { key: "email", header: "Email", render: (r) => r.email },
    { key: "role", header: "Role", render: (r) => <Pill value={r.role} tone="blue" /> },
    { key: "status", header: "Status", render: (r) => <Pill value={r.status} tone={statusTone(r.status)} /> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <Can perm="user:manage">
          <button
            type="button"
            className="text-[11px] font-semibold text-[var(--accent)] hover:underline"
            onClick={() => void toggle(r.id, r.status)}
          >
            {r.status === "active" ? "Disable" : "Enable"}
          </button>
        </Can>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={UserCog}
        title="Users"
        subtitle="Staff accounts. Requires user:manage. Temporary password is shown once on create."
        breadcrumb={[{ label: "Administration" }, { label: "Users" }]}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={() => void load()}>
              <RefreshCw size={12} /> Refresh
            </button>
            <Can perm="user:manage">
              <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={() => setShowForm((s) => !s)}>
                <Plus size={13} /> Add staff
              </button>
            </Can>
          </>
        }
      />
      <WorkspaceTabsCompact workspace={workspace} />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />
      {created && (
        <Surface padded>
          <p className="text-[12px] font-bold text-emerald-800">Temporary password for {created.email}</p>
          <p className="mt-1 font-mono text-[14px] font-black text-[var(--primary)]">{created.tempPassword}</p>
          <p className="mt-1 text-[10.5px] text-[var(--muted-foreground)]">Copy now — it will not be shown again.</p>
        </Surface>
      )}
      {showForm && (
        <Surface>
          <SurfaceHeader title="Add staff user" />
          <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-5">
            <div>
              <label className={labelCls}>Full name *</label>
              <input className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input className={inputCls} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className={labelCls}>Role *</label>
              <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>Create</button>
              <button type="button" className={btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </Surface>
      )}
      <Surface>
        <SurfaceHeader title={`${rows.length} user${rows.length === 1 ? "" : "s"}`} />
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No users" />
      </Surface>
    </PageShell>
  );
}
