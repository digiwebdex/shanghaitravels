import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Contact, RefreshCw } from "lucide-react";
import { crmApi, type CrmContact } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { CrmModuleNav } from "@/components/crm/CrmModuleNav";
import { CONTACT_KINDS } from "@/lib/crm";
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

export default function CrmContactsPage() {
  const [rows, setRows] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [fullName, setFullName] = useState("");
  const [kind, setKind] = useState("individual");
  const [phone, setPhone] = useState("");
  const [familyGroup, setFamilyGroup] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await crmApi.listContacts());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load contacts");
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
      await crmApi.createContact({ fullName: fullName.trim(), kind, phone, familyGroup: familyGroup || undefined });
      setOk("Contact created");
      setFullName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  const stats = useMemo(() => {
    const families = rows.filter((c) => !!c.familyGroup).length;
    const corporate = rows.filter((c) => c.kind === "corporate").length;
    return { families, corporate };
  }, [rows]);

  const columns: Column<CrmContact>[] = [
    { key: "name", header: "Name", render: (c) => <span className="font-bold text-[var(--primary)]">{c.fullName}</span> },
    { key: "kind", header: "Kind", render: (c) => <Pill value={c.kind} tone={statusTone(c.kind)} /> },
    { key: "phone", header: "Phone", render: (c) => c.phone || "—" },
    {
      key: "family",
      header: "Family group",
      render: (c) => (c.familyGroup ? <span className="font-semibold text-[var(--accent)]">{c.familyGroup}</span> : "—"),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Contact}
        title="Contacts"
        subtitle="Individuals, families, and corporate contacts."
        breadcrumb={[{ label: "CRM" }, { label: "Contacts" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <CrmModuleNav />
      <StatStrip>
        <KpiCard label="Total" value={rows.length} />
        <KpiCard label="In families" value={stats.families} tone="accent" />
        <KpiCard label="Corporate" value={stats.corporate} />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="lead:manage">
        <Surface>
          <SurfaceHeader title="Create contact" />
          <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-4 sm:p-5">
            <div>
              <label className={labelCls}>Full name *</label>
              <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Kind</label>
              <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
                {CONTACT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Family group</label>
              <input className={inputCls} value={familyGroup} onChange={(e) => setFamilyGroup(e.target.value)} />
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Create contact
              </button>
            </div>
          </form>
        </Surface>
      </Can>

      <Surface>
        <SurfaceHeader title={`${rows.length} contact${rows.length === 1 ? "" : "s"}`} />
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No contacts" />
      </Surface>
    </PageShell>
  );
}
