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
import { HotelModuleNav } from "@/components/hotels/HotelModuleNav";

export default function HotelSuppliersPage() {
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
      const r = await suppliersApi.list({ type: "hotel", q: q || undefined, limit: 100 });
      setRows(listOf<Supplier>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load hotel suppliers");
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
        type: "hotel",
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
        title="Hotel suppliers"
        subtitle="Partners with type=hotel (DMC / property / consolidator). Requires supplier:read."
        breadcrumb={[{ label: "Hotels", to: "/hotels" }, { label: "Hotel suppliers" }]}
      />
      <HotelModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="supplier:manage">
          <form
            onSubmit={(e) => void create(e)}
            className="bg-white rounded-xl border border-[var(--border)] p-4 grid grid-cols-1 sm:grid-cols-2 gap-2"
          >
            <div className="sm:col-span-2">
              <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-1">Add supplier</p>
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
                Add hotel supplier
              </button>
            </div>
          </form>
        </Can>

        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex gap-2">
            <input
              className="flex-1 max-w-sm px-3 py-2 border border-[var(--border)] rounded-lg text-[11px]"
              placeholder="Search suppliers…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              aria-label="Search hotel suppliers"
            />
            <button
              type="button"
              onClick={() => void load()}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-[11px] font-semibold"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No hotel suppliers" hint="Add a supplier or check supplier:read permission." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-[var(--muted-foreground)] border-b border-[var(--border)]">
                    <th className="px-4 py-2 font-bold">Code</th>
                    <th className="px-4 py-2 font-bold">Name</th>
                    <th className="px-4 py-2 font-bold">Contact</th>
                    <th className="px-4 py-2 font-bold">Phone</th>
                    <th className="px-4 py-2 font-bold">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--border)] text-[11px]">
                      <td className="px-4 py-2.5 font-semibold text-[var(--primary)]">{s.code}</td>
                      <td className="px-4 py-2.5 text-[var(--primary)]">{s.name}</td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{s.contactName || "—"}</td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{s.phone || "—"}</td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{s.email || "—"}</td>
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
