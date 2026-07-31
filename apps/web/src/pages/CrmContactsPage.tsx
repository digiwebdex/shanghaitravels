import { FormEvent, useCallback, useEffect, useState } from "react";
import { Contact } from "lucide-react";
import { crmApi, type CrmContact } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { CrmModuleNav } from "@/components/crm/CrmModuleNav";
import { CONTACT_KINDS } from "@/lib/crm";

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

  return (
    <div>
      <DemoBadge moduleKey="crm" />
      <div className="p-5 max-w-[1100px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Contact size={16} className="text-amber-600" /> Contacts
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Individuals, families, and corporate contacts.</p>
        </div>
        <CrmModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <Can perm="lead:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
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
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                Create contact
              </button>
            </div>
          </form>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <ul className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            {rows.map((c) => (
              <li key={c.id} className="text-[11px] flex flex-wrap gap-x-3 border-b border-slate-50 pb-2">
                <span className="font-bold text-slate-800">{c.fullName}</span>
                <span className="text-slate-500">{c.kind}</span>
                <span className="text-slate-500">{c.phone || "—"}</span>
                {c.familyGroup && <span className="text-amber-700">{c.familyGroup}</span>}
              </li>
            ))}
            {rows.length === 0 && <p className="text-[11px] text-slate-400">No contacts.</p>}
          </ul>
        )}
      </div>
    </div>
  );
}
