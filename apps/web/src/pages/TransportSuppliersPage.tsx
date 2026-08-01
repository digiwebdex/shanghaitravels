import { FormEvent, useCallback, useEffect, useState } from "react";
import { Truck } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { suppliersApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Supplier } from "@/lib/types";
import { Can } from "@/auth/Can";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { TransportModuleNav } from "@/components/transport/TransportModuleNav";

export default function TransportSuppliersPage() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await suppliersApi.list({ type: "transport", q: q || undefined, limit: 100 });
      setRows(listOf<Supplier>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load transport suppliers");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError("");
    setOk("");
    try {
      await suppliersApi.create({
        name: name.trim(),
        type: "transport",
        contactName: contactName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setOk("Hotel supplier created");
      setName("");
      setContactName("");
      setPhone("");
      setEmail("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Truck}
        title="Transport suppliers"
        subtitle="Partners with type=transport (transfer companies / car hire). Requires supplier:read."
        breadcrumb={[{ label: "Transport", to: "/transport" }, { label: "Transport suppliers" }]}
      />
      <TransportModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="supplier:manage">
          <form
            onSubmit={(e) => void create(e)}
            className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-2"
          >
            <div className="sm:col-span-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Add supplier</p>
            </div>
            <div>
              <label className={labelCls} htmlFor="sup-name">
                Name *
              </label>
              <input id="sup-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls} htmlFor="sup-contact">
                Contact
              </label>
              <input
                id="sup-contact"
                className={inputCls}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="sup-phone">
                Phone
              </label>
              <input id="sup-phone" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="sup-email">
                Email
              </label>
              <input id="sup-email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="sup-notes">
                Notes
              </label>
              <input id="sup-notes" className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
              >
                Add transport supplier
              </button>
            </div>
          </form>
        </Can>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex gap-2">
            <input
              className="flex-1 max-w-sm px-3 py-2 border border-slate-200 rounded-lg text-[11px]"
              placeholder="Search suppliers…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              aria-label="Search transport suppliers"
            />
            <button
              type="button"
              onClick={() => void load()}
              className="px-3 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No transport suppliers" hint="Add a supplier or check supplier:read permission." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-2 font-bold">Code</th>
                    <th className="px-4 py-2 font-bold">Name</th>
                    <th className="px-4 py-2 font-bold">Contact</th>
                    <th className="px-4 py-2 font-bold">Phone</th>
                    <th className="px-4 py-2 font-bold">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50 text-[11px]">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{s.code}</td>
                      <td className="px-4 py-2.5 text-slate-700">{s.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{s.contactName || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{s.phone || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{s.email || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </PageShell>
  );
}
