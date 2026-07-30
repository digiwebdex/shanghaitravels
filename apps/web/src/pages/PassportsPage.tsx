import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { customersApi, ocrApi, passportsApi } from "@/lib/services";
import { ApiError, listOf, validateUploadFile } from "@/lib/api";
import type { Customer, Passport } from "@/lib/types";
import { passportExpiry } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";

const inputCls =
  "w-full px-2.5 py-2 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-amber-400";
const labelCls = "block text-[10px] font-bold text-slate-500 mb-1";

export default function PassportsPage() {
  const { can } = useAuth();
  const [params] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(params.get("customerId") || "");
  const [detail, setDetail] = useState<Customer | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [passportNo, setNo] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [issue, setIssue] = useState("");
  const [expiry, setExpiry] = useState("");
  const [ocrMsg, setOcrMsg] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await customersApi.list({ limit: 200 });
      setCustomers(listOf<Customer>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!customerId) {
      setDetail(null);
      return;
    }
    void customersApi
      .get(customerId)
      .then(setDetail)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load customer"));
  }, [customerId]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!customerId || !passportNo.trim()) {
      setError("Customer and passport no required");
      return;
    }
    try {
      await passportsApi.create({
        customerId,
        passportNo: passportNo.trim(),
        issuingCountry: country || undefined,
        dateOfIssue: issue || undefined,
        dateOfExpiry: expiry || undefined,
        isPrimary: true,
      });
      setOk("Passport saved");
      setNo("");
      const c = await customersApi.get(customerId);
      setDetail(c);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  async function scan(file: File) {
    setOcrMsg("");
    const bad = validateUploadFile(file);
    if (bad) {
      setOcrMsg(bad);
      return;
    }
    try {
      const r = await ocrApi.scan(file, { customerId: customerId || undefined });
      const f = (r.fields || {}) as Record<string, string>;
      if (f.passportNo) setNo(f.passportNo);
      if (f.issuingCountry) setCountry(f.issuingCountry);
      if (f.dateOfExpiry) setExpiry(f.dateOfExpiry);
      if (f.dateOfIssue) setIssue(f.dateOfIssue);
      setOcrMsg(f.passportNo ? `OCR filled ${f.passportNo} — verify and Save.` : "Could not read passport — enter manually.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setOcrMsg("Passport scanning is pending approval — enter details manually.");
      } else {
        setOcrMsg(err instanceof ApiError ? err.message : "Scan failed");
      }
    }
  }

  const passports: Passport[] = detail?.passports || [];

  return (
    <div>
      <DemoBadge moduleKey="passports" />
      <div className="p-5 max-w-[900px]">
        <h1 className="text-[16px] font-bold text-slate-800 mb-1">Passport Management</h1>
        <p className="text-[11px] text-slate-500 mb-4">Manual entry + OCR (when approved). Confirm before write.</p>
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
              <label className={labelCls}>Customer</label>
              <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">— select —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {customerId && (
              <>
                <form onSubmit={save} className="bg-white rounded-xl border border-slate-200 p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Passport no *</label>
                    <input className={inputCls} required value={passportNo} onChange={(e) => setNo(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Issuing country</label>
                    <input className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Date of issue</label>
                    <input type="date" className={inputCls} value={issue} onChange={(e) => setIssue(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Date of expiry</label>
                    <input type="date" className={inputCls} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                  </div>
                  <Can perm="ocr:apply">
                    <button type="submit" className="px-3 py-2 rounded-lg text-[11px] font-bold text-white w-fit" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                      Save passport
                    </button>
                  </Can>
                  {!can("ocr:apply") && (
                    <p className="text-[11px] text-slate-400 sm:col-span-2">Missing ocr:apply permission to save passports.</p>
                  )}
                </form>

                <Can perm="ocr:use">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
                    <p className="text-[12px] font-bold text-slate-800 mb-2">OCR scan</p>
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && void scan(e.target.files[0])} className="text-[11px]" />
                    {ocrMsg && <p className="text-[11px] text-slate-600 mt-2">{ocrMsg}</p>}
                  </div>
                </Can>

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h2 className="text-[12px] font-bold text-slate-800 mb-3">Saved passports</h2>
                  {passports.length === 0 ? (
                    <EmptyState title="No passports yet" />
                  ) : (
                    <ul className="space-y-2">
                      {passports.map((p) => (
                        <li key={p.id} className="flex justify-between text-[11px] border border-slate-100 rounded-lg px-3 py-2">
                          <span className="font-mono font-bold">{p.passportNo}</span>
                          <span className="text-slate-500">
                            {p.issuingCountry || "—"} · exp {passportExpiry(p)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
