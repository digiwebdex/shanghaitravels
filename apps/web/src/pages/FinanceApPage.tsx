import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { FileSpreadsheet } from "lucide-react";
import { apApi, suppliersApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { ApDocument, Supplier } from "@/lib/types";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { AP_TYPES, docLinesPayload, validateDocLines } from "@/lib/arap";
import { formatBdt } from "@/lib/gl";

export default function FinanceApPage() {
  const [rows, setRows] = useState<ApDocument[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [type, setType] = useState("bill");
  const [supplierId, setSupplierId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [desc, setDesc] = useState("");
  const [amountBdt, setAmountBdt] = useState("");
  const [dueDate, setDueDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [docs, sup] = await Promise.all([
        apApi.listDocuments({ limit: 100 }),
        suppliersApi.list({ limit: 100 }),
      ]);
      setRows(docs);
      setSuppliers(sup.data || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load AP");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    const lines = [{ description: desc, amountBdt }];
    const bad = validateDocLines(lines);
    if (bad || !supplierId) {
      setError(bad || "Select a supplier");
      return;
    }
    setError("");
    setOk("");
    try {
      const doc = await apApi.createDocument({
        type,
        supplierId,
        applicationId: applicationId.trim() || undefined,
        dueDate: dueDate || undefined,
        lines: docLinesPayload(lines),
      });
      setOk(`Created ${doc.docNo}`);
      setDesc("");
      setAmountBdt("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="finance" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-amber-600" /> Accounts Payable
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Supplier bills, payments, advances, credit/debit notes — posts through Phase C1 GL.
          </p>
        </div>
        <FinanceModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="ap:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">New AP document</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <label className={labelCls}>Type</label>
                <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                  {AP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Supplier *</label>
                <select className={inputCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
                  <option value="">Select…</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Due date</label>
                <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Description *</label>
                <input className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Amount (৳) *</label>
                <input className={inputCls} value={amountBdt} onChange={(e) => setAmountBdt(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Case ID (optional)</label>
                <input className={inputCls} value={applicationId} onChange={(e) => setApplicationId(e.target.value)} placeholder="Application UUID" />
              </div>
            </div>
            <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
              Create draft
            </button>
          </form>
        </Can>

        {loading ? (
          <div className="flex justify-center py-12">
            <InlineSpinner />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="No AP documents" hint="Create a supplier bill linked to a case when needed." />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-slate-500 border-b border-slate-100">
                  <th className="px-3 py-2">Doc</th>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Balance</th>
                  <th className="px-3 py-2">Case</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 text-[11px]">
                    <td className="px-3 py-2">
                      <Link to={`/finance/ap/${r.id}`} className="font-semibold text-amber-700 hover:underline">
                        {r.docNo}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{r.supplier?.name || r.supplierId}</td>
                    <td className="px-3 py-2">{r.type}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{formatBdt(r.totalPoisha)}</td>
                    <td className="px-3 py-2">{formatBdt(r.balancePoisha)}</td>
                    <td className="px-3 py-2">{r.application?.referenceNo || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
