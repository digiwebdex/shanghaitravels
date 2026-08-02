import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { BookOpen } from "lucide-react";
import { customersApi, ocrApi, passportsApi } from "@/lib/services";
import { ApiError, listOf, validateUploadFile } from "@/lib/api";
import type { Customer, Passport } from "@/lib/types";
import { passportExpiry } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import {
  PageHeader,
  PageShell,
  Surface,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { DocumentUploadFlow } from "@/components/ocr/DocumentUploadFlow";
import type { OcrScanResult } from "@/lib/documentIntelligence";

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

  const passports: Passport[] = detail?.passports || [];

  return (
    <PageShell>
      <PageHeader
        icon={BookOpen}
        title="Passport Management"
        subtitle="Document Intelligence OCR with MRZ validation — confirm before save."
        breadcrumb={[{ label: "CRM", to: "/customers" }, { label: "Passports" }]}
        actions={
          <Link to="/operations/document-intelligence" className="text-[11px] font-bold text-[var(--accent)]">
            Document Intelligence →
          </Link>
        }
      />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      {loading ? (
        <div className="flex justify-center py-16">
          <InlineSpinner />
        </div>
      ) : (
        <>
          <Surface padded className="mb-4">
            <label className={labelCls}>Customer</label>
            <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">— select —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.code})
                </option>
              ))}
            </select>
          </Surface>

          {customerId && (
            <>
              <Can perm="ocr:use">
                <Surface padded className="mb-4">
                  <DocumentUploadFlow
                    customerId={customerId}
                    defaultDocType="passport"
                    onFields={(fields) => {
                      if (fields.passportNo) setNo(fields.passportNo);
                      if (fields.issuingCountry) setCountry(fields.issuingCountry);
                      if (fields.dateOfIssue) setIssue(fields.dateOfIssue);
                      if (fields.dateOfExpiry) setExpiry(fields.dateOfExpiry);
                    }}
                    scanFile={async (file, docType) => {
                      const bad = validateUploadFile(file);
                      if (bad) throw new Error(bad);
                      return (await ocrApi.scan(file, { docType, customerId })) as OcrScanResult;
                    }}
                    checkDuplicate={async (fields) =>
                      ocrApi.checkDuplicate({
                        passportNo: fields.passportNo,
                        customerId,
                      })
                    }
                    onSave={async ({ fields }) => {
                      if (!fields.passportNo) throw new Error("Passport number required");
                      await passportsApi.create({
                        customerId,
                        passportNo: fields.passportNo,
                        issuingCountry: fields.issuingCountry || undefined,
                        dateOfIssue: fields.dateOfIssue || undefined,
                        dateOfExpiry: fields.dateOfExpiry || undefined,
                        isPrimary: true,
                      });
                      setOk("Passport saved from OCR");
                      setDetail(await customersApi.get(customerId));
                      return true;
                    }}
                  />
                </Surface>
              </Can>

              <Surface padded className="mb-4">
                <form onSubmit={save} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                    <button type="submit" className={`${btnPrimary} w-fit`} style={btnPrimaryStyle}>
                      Save passport
                    </button>
                  </Can>
                  {!can("ocr:apply") && (
                    <p className="text-[11px] text-[var(--muted-foreground)] sm:col-span-2">
                      Missing ocr:apply permission to save passports.
                    </p>
                  )}
                </form>
              </Surface>

              <Surface padded>
                <h2 className="mb-3 text-[12px] font-bold text-[var(--primary)]">Saved passports</h2>
                {passports.length === 0 ? (
                  <EmptyState title="No passports yet" />
                ) : (
                  <ul className="space-y-2">
                    {passports.map((p) => (
                      <li
                        key={p.id}
                        className="flex justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-[11px]"
                      >
                        <span className="font-mono font-bold">{p.passportNo}</span>
                        <span className="text-[var(--muted-foreground)]">
                          {p.issuingCountry || "—"} · exp {passportExpiry(p)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Surface>
            </>
          )}
        </>
      )}
    </PageShell>
  );
}
