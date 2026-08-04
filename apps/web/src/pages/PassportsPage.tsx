import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { BookOpen } from "lucide-react";
import { customersApi, ocrApi, passportsApi } from "@/lib/services";
import { ApiError, listOf, validateUploadFile } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { passportExpiry } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import {
  ListToolbar,
  PageHeader,
  PageShell,
  Surface,
  SurfaceHeader,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
  searchInputClassName,
  selectClassName,
} from "@/components/enterprise/Page";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { DocumentUploadFlow } from "@/components/ocr/DocumentUploadFlow";
import type { OcrScanResult } from "@/lib/documentIntelligence";

export default function PassportsPage() {
  const { can } = useAuth();
  const [params] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(params.get("customerId") || "");
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
      setCustomers(listOf<Customer>(await customersApi.list({ limit: 200 })));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  // ---- Saved Passports enterprise table (cross-customer; reuses customersApi.list passports) ----
  type PassportRow = {
    id: string;
    customerId: string;
    customerName: string;
    customerCode: string;
    passportNo: string;
    category: string;
    nationality: string;
    expiry: string;
    ocrStatus?: string;
    confidence?: number | null;
    applicationId?: string | null;
  };
  const CATEGORIES = ["Customer", "Agent", "Corporate", "Employee", "Supplier", "Other"];

  const [ocrMeta, setOcrMeta] = useState<Map<string, { status?: string; confidence?: number | null; applicationId?: string | null }>>(new Map());
  const [fName, setFName] = useState("");
  const [fPassport, setFPassport] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [dName, setDName] = useState("");
  const [dPassport, setDPassport] = useState("");

  // Debounce the two text filters (250ms) — filtering itself is client-side over loaded data.
  useEffect(() => {
    const t = setTimeout(() => {
      setDName(fName);
      setDPassport(fPassport);
    }, 250);
    return () => clearTimeout(t);
  }, [fName, fPassport]);

  // Enrich rows with Document Intelligence OCR status/confidence (existing service; matched by passport no).
  useEffect(() => {
    let alive = true;
    ocrApi
      .recent(200)
      .then((recs) => {
        if (!alive) return;
        const m = new Map<string, { status?: string; confidence?: number | null; applicationId?: string | null }>();
        for (const r of recs) {
          const no = String((r as Record<string, unknown>).passportNo || "").trim().toUpperCase();
          if (!no || m.has(no)) continue;
          m.set(no, {
            status: (r as Record<string, unknown>).status as string | undefined,
            confidence: (r as Record<string, unknown>).confidence as number | null | undefined,
            applicationId: (r as Record<string, unknown>).applicationId as string | null | undefined,
          });
        }
        setOcrMeta(m);
      })
      .catch(() => {
        /* OCR journal is optional context; the table renders without it. */
      });
    return () => {
      alive = false;
    };
  }, []);

  const rows: PassportRow[] = useMemo(() => {
    const out: PassportRow[] = [];
    for (const c of customers) {
      for (const p of c.passports || []) {
        const meta = ocrMeta.get(String(p.passportNo || "").trim().toUpperCase());
        out.push({
          id: p.id,
          customerId: c.id,
          customerName: c.fullName,
          customerCode: c.code,
          passportNo: p.passportNo,
          category: "Customer", // saved passports link to the Customer model
          nationality: p.issuingCountry || "",
          expiry: passportExpiry(p),
          ocrStatus: meta?.status,
          confidence: meta?.confidence,
          applicationId: meta?.applicationId,
        });
      }
    }
    return out;
  }, [customers, ocrMeta]);

  const filtered: PassportRow[] = useMemo(() => {
    const nm = dName.trim().toLowerCase();
    const pp = dPassport.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!nm || r.customerName.toLowerCase().includes(nm)) &&
        (!pp || r.passportNo.toLowerCase().includes(pp)) &&
        (!fCategory || r.category === fCategory),
    );
  }, [rows, dName, dPassport, fCategory]);

  function pct(c?: number | null): string {
    if (c == null) return "—";
    const v = c <= 1 ? c * 100 : c;
    return `${Math.round(v)}%`;
  }

  const passportColumns: Column<PassportRow>[] = [
    {
      key: "customerName",
      header: "Customer Name",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[var(--foreground)]">{r.customerName}</span>
          <span className="text-[10px] text-[var(--muted-foreground)]">{r.customerCode}</span>
        </div>
      ),
    },
    { key: "passportNo", header: "Passport Number", render: (r) => <span className="font-mono font-bold">{r.passportNo}</span> },
    { key: "category", header: "Category", render: (r) => <Pill value={r.category} tone="blue" /> },
    { key: "nationality", header: "Nationality", render: (r) => r.nationality || "—" },
    { key: "expiry", header: "Expiry Date", render: (r) => r.expiry },
    {
      key: "ocrStatus",
      header: "OCR Status",
      render: (r) =>
        r.ocrStatus ? <Pill value={r.ocrStatus} tone={statusTone(r.ocrStatus)} /> : <span className="text-[var(--muted-foreground)]">—</span>,
    },
    { key: "confidence", header: "Confidence", render: (r) => pct(r.confidence) },
    {
      key: "linked",
      header: "Linked Customer",
      render: (r) => (
        <Link to={`/customers/${r.customerId}`} className="font-semibold text-[var(--accent)] hover:underline">
          {r.customerName}
        </Link>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-2.5 text-[11px] font-semibold">
          <Link to={`/customers/${r.customerId}`} className="text-[var(--accent)] hover:underline">
            Customer 360
          </Link>
          {r.applicationId && (
            <Link to={`/bookings/${r.applicationId}`} className="text-[var(--accent)] hover:underline">
              Booking 360
            </Link>
          )}
        </div>
      ),
    },
  ];

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
              <div className="mb-3 flex justify-end">
                <Link
                  to={`/customers/${customerId}`}
                  className="text-[11px] font-bold text-[var(--accent)] hover:underline"
                >
                  Open Customer 360 →
                </Link>
              </div>
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
                      setCustomers(listOf<Customer>(await customersApi.list({ limit: 200 })));
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

            </>
          )}

          <Surface>
            <SurfaceHeader title="Saved Passports" hint={`Showing ${filtered.length} of ${rows.length}`} />
            <ListToolbar>
              <input
                className={searchInputClassName}
                list="passport-customer-names"
                placeholder="Search customer name..."
                value={fName}
                onChange={(e) => setFName(e.target.value)}
              />
              <datalist id="passport-customer-names">
                {customers.map((c) => (
                  <option key={c.id} value={c.fullName} />
                ))}
              </datalist>
              <input
                className={searchInputClassName}
                placeholder="Search passport number..."
                value={fPassport}
                onChange={(e) => setFPassport(e.target.value)}
              />
              <select className={selectClassName} value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </ListToolbar>
            <DataTable rows={filtered} columns={passportColumns} rowKey={(r) => r.id} emptyTitle="No passport found" />
          </Surface>
        </>
      )}
    </PageShell>
  );
}
