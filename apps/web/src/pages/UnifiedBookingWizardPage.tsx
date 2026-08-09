/**
 * Guided service journey — Customer → Passport/OCR → Service → Details →
 * Supplier & Commercials → Invoice & Payment → Confirmation.
 *
 * This REPLACES the older 10-step wizard in place (no second wizard, no second
 * engine). Everything it does goes through existing APIs:
 *   customersApi · ocrApi · applicationsApi(.create/.detail/.setCommercials/
 *   .supplierBill) · suppliersApi · financeApi(.createInvoice/.issueInvoice/
 *   .recordPayment/.listAccounts)
 *
 * Deliberately untouched by this page:
 *   • BUG-02 — the booking's agent is snapshotted server-side from the
 *     customer's primary agent; this page only DISPLAYS it and never posts
 *     agentId, so it cannot overwrite an authorised explicit agent.
 *   • BUG-01 — commission accrual is not triggered here.
 *   • the invoice PDF renderer, the OCR engine and the workflow engine.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Building2, Check, CreditCard, FileCheck,
  Loader2, Receipt, Search, ScanLine, UserRound, Users,
} from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import {
  PageShell, PageHeader, Surface, SurfaceHeader, btnGhost, btnPrimary, inputCls, labelCls,
} from "@/components/enterprise/Page";
import { ErrorBanner } from "@/components/Feedback";
import { agentsApi, applicationsApi, customersApi, financeApi, ocrApi, suppliersApi } from "@/lib/services";
import { SERVICE_OPTIONS, type ServiceKind } from "@/lib/workflow";
import { buildDetailPayload, fieldsFor, missingRequired, type ServiceField } from "@/lib/serviceForms";
import { fmtBDT, fromPoisha, toPoisha } from "@/lib/money";
import type { Customer, Supplier } from "@/lib/types";

const STEPS = [
  "Customer & Agent",
  "Passport & Documents",
  "Service",
  "Service details",
  "Supplier & Commercials",
  "Invoice & Payment",
  "Confirmation",
] as const;

/** Existing CasePriority enum — not a second priority list. */
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
/** Existing PaymentMethod enum. */
const METHODS = ["cash", "bank_transfer", "bkash", "nagad", "card", "cheque", "other"] as const;

type Account = { id: string; name: string; type: string };

export default function UnifiedBookingWizardPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { can } = useAuth();

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // ---- step 1: customer + agent ----
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [agentLabel, setAgentLabel] = useState<string>("");

  // ---- step 2: passport ----
  const [passportMode, setPassportMode] = useState<"skip" | "scan" | "manual">("skip");
  const [scanFields, setScanFields] = useState<Record<string, string>>({});
  const [scanId, setScanId] = useState<string | null>(null);
  const [dupWarning, setDupWarning] = useState("");

  // ---- step 3/4: service ----
  const [service, setService] = useState<ServiceKind>((params.get("service") as ServiceKind) || "visa");
  const apiType = useMemo(() => SERVICE_OPTIONS.find((s) => s.value === service)?.apiType || "visa", [service]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("medium");
  const [referredBy, setReferredBy] = useState("");
  const [detail, setDetail] = useState<Record<string, string>>({});

  // ---- step 5: supplier & commercials ----
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierQ, setSupplierQ] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");

  // ---- step 6: invoice & payment ----
  const [payNow, setPayNow] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("cash");
  const [accountId, setAccountId] = useState("");
  const [payRef, setPayRef] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);

  // ---- result ----
  const [created, setCreated] = useState<{ appId: string; ref: string; invoiceNo?: string; apDoc?: string } | null>(null);

  // customer search (existing API; searches name / phone / code / passport / email)
  useEffect(() => {
    let alive = true;
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      customersApi
        .list({ q: q.trim(), limit: 8 })
        .then((r) => alive && setResults(((r as { data?: Customer[] }).data || (r as Customer[])) ?? []))
        .catch(() => alive && setResults([]));
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  useEffect(() => {
    suppliersApi.list({ q: supplierQ || undefined, limit: 30 })
      .then((r) => setSuppliers(r.data || []))
      .catch(() => setSuppliers([]));
  }, [supplierQ]);

  useEffect(() => {
    financeApi.accounts()
      .then((r) => setAccounts((r as unknown as Account[]) || []))
      .catch(() => setAccounts([]));
  }, []);

  // Show the customer's CURRENT primary agent (read-only; the server snapshots it).
  const pickCustomer = useCallback(async (c: Customer) => {
    setCustomer(c);
    setError("");
    setAgentLabel("");
    const primaryId = (c as unknown as { primaryAgentId?: string }).primaryAgentId;
    if (!primaryId) { setAgentLabel("House customer — no owning agent"); return; }
    try {
      const r = await agentsApi.list({ limit: 200 });
      const found = ((r as { data?: { id: string; name: string; code: string }[] }).data || []).find((a) => a.id === primaryId);
      setAgentLabel(found ? `${found.name} · ${found.code}` : `Agent ${primaryId.slice(0, 8)}…`);
    } catch {
      setAgentLabel(`Agent ${primaryId.slice(0, 8)}…`);
    }
  }, []);

  const finalPrice = useMemo(() => {
    const p = price.trim() === "" ? null : toPoisha(Number(price));
    const d = discount.trim() === "" ? 0 : toPoisha(Number(discount));
    if (p == null || !Number.isFinite(p)) return null;
    return Math.max(0, p - (Number.isFinite(d) ? d : 0));
  }, [price, discount]);

  const margin = useMemo(() => {
    const c = cost.trim() === "" ? null : toPoisha(Number(cost));
    if (finalPrice == null || c == null || !Number.isFinite(c)) return null;
    return finalPrice - c;
  }, [finalPrice, cost]);

  function guard(): string {
    if (step === 0 && !customer) return "Select a customer to continue";
    if (step === 2 && !service) return "Choose a service";
    if (step === 3) {
      const missing = missingRequired(apiType, detail);
      if (missing.length) return `Required: ${missing.join(", ")}`;
    }
    if (step === 4) {
      if (cost.trim() && !(Number(cost) >= 0)) return "Supplier cost must be zero or more";
      if (price.trim() && !(Number(price) >= 0)) return "Selling price must be zero or more";
      if (finalPrice != null && finalPrice < 0) return "Discount cannot exceed the selling price";
    }
    if (step === 5 && payNow) {
      if (!accountId) return "Choose the receive account for this payment";
      if (!(Number(payAmount) > 0)) return "Payment amount must be greater than zero";
    }
    return "";
  }

  function next() {
    const g = guard();
    if (g) { setError(g); return; }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  const back = () => { setError(""); setStep((s) => Math.max(0, s - 1)); };

  async function runScan(file: File) {
    if (!customer) return;
    setBusy(true); setError(""); setDupWarning("");
    try {
      const scan = await ocrApi.scan(file, { customerId: customer.id, docType: "passport" });
      setScanId((scan as { id: string }).id);
      const f = ((scan as { fields?: Record<string, string> }).fields || {}) as Record<string, string>;
      setScanFields({
        passportNo: f.passportNo || "", fullName: f.fullName || "", dob: f.dob || "",
        nationality: f.nationality || "", gender: f.gender || "",
        issueDate: f.issueDate || "", expiryDate: f.expiryDate || "",
      });
      if (f.passportNo) {
        const dup = await ocrApi.checkDuplicate({ passportNo: f.passportNo, customerId: customer.id });
        if (dup.duplicate) {
          setDupWarning(
            `This passport already exists on ${dup.hits.map((h) => h.customerName || h.customerCode).join(", ")}. Resolve before applying.`,
          );
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally { setBusy(false); }
  }

  async function applyScan() {
    if (!scanId || !customer) return;
    setBusy(true); setError("");
    try {
      await ocrApi.apply(scanId, { customerId: customer.id, fields: scanFields, isPrimary: true });
      setPassportMode("skip");
      setScanId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not apply the scan");
    } finally { setBusy(false); }
  }

  /** Creates the case, its detail, its commercials, the invoice and any payment. */
  async function submit() {
    if (!customer) return;
    setBusy(true); setError("");
    try {
      // 1 — the case. agentId is intentionally NOT sent: the server snapshots
      // the customer's primary agent (BUG-02) and an explicit value would win.
      const app = await applicationsApi.create({
        serviceType: apiType,
        customerId: customer.id,
        title: title.trim() || `${SERVICE_OPTIONS.find((s) => s.value === service)?.label} — ${customer.fullName}`,
        priority,
        // Existing convention (mirrors VisaListPage): referrer is captured as the
        // lead source + a note, because there is no referredBy column.
        source: referredBy.trim() ? "referral" : "walkin",
      }) as { id: string; referenceNo: string };

      if (referredBy.trim() && can("application:note")) {
        await applicationsApi.note(app.id, `Referred by: ${referredBy.trim()}`).catch(() => undefined);
      }

      // 2 — service-specific detail through the EXISTING endpoints. Visa has its
      // own dedicated route (PUT /applications/:id/visa); every other vertical
      // goes through the generic detail upsert. No new endpoint was added.
      const payload = buildDetailPayload(apiType, detail);
      if (Object.keys(payload).length) {
        if (apiType === "visa") await applicationsApi.putVisa(app.id, payload);
        else await applicationsApi.putDetail(app.id, apiType, payload);
      }

      // 3 — supplier + commercials (existing endpoint used by Booking 360).
      let apDoc: string | undefined;
      if (supplierId || cost.trim() || price.trim()) {
        await applicationsApi.setCommercials(app.id, {
          supplierId: supplierId || null,
          supplierCostPoisha: cost.trim() === "" ? null : toPoisha(Number(cost)),
          sellingPricePoisha: price.trim() === "" ? null : toPoisha(Number(price)),
        });
        if (supplierId && cost.trim() && can("ap:manage")) {
          const bill = await applicationsApi.supplierBill(app.id).catch(() => null);
          apDoc = bill?.docNo;
        }
      }

      // 4 — invoice (existing engine + renderer).
      let invoiceNo: string | undefined;
      if (finalPrice != null && finalPrice > 0 && can("invoice:manage")) {
        const inv = await financeApi.createInvoice({
          customerId: customer.id,
          applicationId: app.id,
          discount: discount.trim() === "" ? 0 : toPoisha(Number(discount)),
          items: [{
            description: title.trim() || `${SERVICE_OPTIONS.find((s) => s.value === service)?.label} service`,
            quantity: 1,
            unitPrice: toPoisha(Number(price)),
          }],
        }) as { id: string; invoiceNo: string };
        await financeApi.issueInvoice(inv.id);
        invoiceNo = inv.invoiceNo;

        // 5 — payment: METHOD and RECEIVE ACCOUNT are separate concepts.
        if (payNow && can("payment:record")) {
          await financeApi.recordPayment({
            invoiceId: inv.id,
            customerId: customer.id,
            accountId,
            amount: toPoisha(Number(payAmount)),
            method,
            reference: payRef.trim() || undefined,
          });
        }
      }

      setCreated({ appId: app.id, ref: app.referenceNo, invoiceNo, apDoc });
      setStep(6);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete the booking");
    } finally { setBusy(false); }
  }

  const svcFields = fieldsFor(apiType);

  return (
    <PageShell>
      <PageHeader
        title="New service"
        subtitle="Customer → passport → service → supplier → invoice → payment, in one pass."
        breadcrumb={[{ label: "Bookings", to: "/operations" }, { label: "New service" }]}
      />

      {/* progress */}
      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
              i === step
                ? "bg-[var(--primary)] text-white"
                : i < step
                  ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                  : "border border-[var(--border)] text-[var(--muted-foreground)]"
            }`}
          >
            {i < step ? <Check size={11} className="mr-1 inline" /> : `${i + 1}. `}
            {s}
          </div>
        ))}
      </div>

      <ErrorBanner message={error} />

      <Surface>
        {/* ─────────── 1 · CUSTOMER & AGENT ─────────── */}
        {step === 0 && (
          <div className="space-y-4 px-5 py-5">
            <SurfaceHeader title="Who is this for?" hint="Search by name, mobile, customer code, passport number or email." />
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search existing customers…"
                className={`${inputCls} pl-9`}
                aria-label="Search customers"
              />
            </div>

            {results.length > 0 && (
              <ul className="space-y-1.5">
                {results.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => pickCustomer(c)}
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                        customer?.id === c.id ? "border-[var(--primary)] bg-[var(--primary)]/[0.06]" : "border-[var(--border)] hover:border-[var(--primary)]/60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users size={13} className="text-[var(--muted-foreground)]" />
                        <span className="text-[12.5px] font-bold">{c.fullName}</span>
                        <span className="text-[11px] text-[var(--muted-foreground)]">{c.code}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                        {[c.phone, c.email].filter(Boolean).join(" · ")}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {customer && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-4 py-3">
                <p className="text-[12.5px] font-bold">{customer.fullName} · {customer.code}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[var(--muted-foreground)]">
                  <UserRound size={12} /> Primary agent: <strong className="text-[var(--foreground)]">{agentLabel || "…"}</strong>
                </p>
                <p className="mt-1 text-[10.5px] text-[var(--muted-foreground)]">
                  The booking records this agent automatically. Changing the customer's owner later will not alter it.
                </p>
              </div>
            )}

            {q.trim() && results.length === 0 && (
              <div className="rounded-lg border border-dashed border-[var(--border)] px-3.5 py-4 text-[12px] text-[var(--muted-foreground)]">
                No match. <Link to="/customers" className="font-semibold text-[var(--accent)]">Create the customer →</Link>
              </div>
            )}
          </div>
        )}

        {/* ─────────── 2 · PASSPORT ─────────── */}
        {step === 1 && (
          <div className="space-y-4 px-5 py-5">
            <SurfaceHeader title="Passport & documents" hint="Optional — but visa, ticketing, hajj and manpower need it." />
            <div className="flex flex-wrap gap-2">
              <button type="button" className={passportMode === "scan" ? btnPrimary : btnGhost} onClick={() => setPassportMode("scan")}>
                <ScanLine size={13} className="mr-1 inline" /> Auto scan (OCR)
              </button>
              <button type="button" className={passportMode === "manual" ? btnPrimary : btnGhost} onClick={() => setPassportMode("manual")}>
                <FileCheck size={13} className="mr-1 inline" /> Manual entry
              </button>
              <button type="button" className={btnGhost} onClick={() => setPassportMode("skip")}>Skip for now</button>
            </div>

            {passportMode === "scan" && can("ocr:use") && (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  aria-label="Passport image"
                  className={inputCls}
                  onChange={(e) => e.target.files?.[0] && runScan(e.target.files[0])}
                />
                {busy && <p className="flex items-center gap-1.5 text-[12px]"><Loader2 size={13} className="animate-spin" /> Reading the document…</p>}
                {dupWarning && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/[0.08] px-3 py-2">
                    <AlertTriangle size={14} className="mt-[1px] shrink-0 text-amber-600" />
                    <p className="text-[11.5px]">{dupWarning}</p>
                  </div>
                )}
                {scanId && (
                  <>
                    <p className="text-[11px] text-[var(--muted-foreground)]">Check every value against the passport before applying.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.entries(scanFields).map(([k, v]) => (
                        <div key={k}>
                          <label className={labelCls} htmlFor={`ocr-${k}`}>{k}</label>
                          <input id={`ocr-${k}`} className={inputCls} value={v} onChange={(e) => setScanFields((f) => ({ ...f, [k]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {can("ocr:apply") && (
                        <button type="button" className={btnPrimary} onClick={applyScan} disabled={busy || !!dupWarning}>
                          Confirm & save to customer
                        </button>
                      )}
                      <button type="button" className={btnGhost} onClick={() => { setScanId(null); setScanFields({}); }}>Cancel</button>
                    </div>
                  </>
                )}
              </div>
            )}
            {passportMode === "scan" && !can("ocr:use") && (
              <p className="text-[12px] text-[var(--muted-foreground)]">Scanning needs <code>ocr:use</code>.</p>
            )}

            {passportMode === "manual" && (
              <p className="text-[12px] text-[var(--muted-foreground)]">
                Manual passports are entered on the customer record so the existing validation and duplicate checks apply.{" "}
                <Link to="/passports" className="font-semibold text-[var(--accent)]">Open Passports →</Link>
              </p>
            )}
          </div>
        )}

        {/* ─────────── 3 · SERVICE ─────────── */}
        {step === 2 && (
          <div className="space-y-4 px-5 py-5">
            <SurfaceHeader title="What service does this customer need?" />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICE_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => { setService(s.value); setDetail({}); }}
                  className={`rounded-lg border px-3.5 py-3 text-left transition-colors ${
                    service === s.value ? "border-[var(--primary)] bg-[var(--primary)]/[0.06]" : "border-[var(--border)] hover:border-[var(--primary)]/60"
                  }`}
                >
                  <span className="text-[12.5px] font-bold">{s.label}</span>
                  <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{s.description}</p>
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls} htmlFor="w-title">Title</label>
                <input id="w-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label className={labelCls} htmlFor="w-priority">Priority</label>
                <select id="w-priority" className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="w-ref">Referred by</label>
                <input id="w-ref" className={inputCls} value={referredBy} onChange={(e) => setReferredBy(e.target.value)} placeholder="Person or source" />
              </div>
            </div>
          </div>
        )}

        {/* ─────────── 4 · SERVICE DETAILS (dynamic) ─────────── */}
        {step === 3 && (
          <div className="space-y-4 px-5 py-5">
            <SurfaceHeader
              title={`${SERVICE_OPTIONS.find((s) => s.value === service)?.label} details`}
              hint="Only the fields this service actually uses."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {svcFields.map((f: ServiceField) => (
                <div key={f.name} className={f.half === false ? "sm:col-span-2" : ""}>
                  <label className={labelCls} htmlFor={`d-${f.name}`}>
                    {f.label}{f.required && <span className="ml-1 text-red-500">*</span>}
                  </label>
                  {f.kind === "select" ? (
                    <select id={`d-${f.name}`} className={inputCls} value={detail[f.name] || ""} onChange={(e) => setDetail((d) => ({ ...d, [f.name]: e.target.value }))}>
                      <option value="">—</option>
                      {f.options?.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
                    </select>
                  ) : f.kind === "textarea" ? (
                    <textarea id={`d-${f.name}`} rows={2} className={inputCls} value={detail[f.name] || ""} onChange={(e) => setDetail((d) => ({ ...d, [f.name]: e.target.value }))} />
                  ) : (
                    <input
                      id={`d-${f.name}`}
                      type={f.kind === "number" ? "number" : f.kind === "date" ? "date" : f.kind === "datetime" ? "datetime-local" : "text"}
                      className={inputCls}
                      placeholder={f.placeholder}
                      value={detail[f.name] || ""}
                      onChange={(e) => setDetail((d) => ({ ...d, [f.name]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
              {svcFields.length === 0 && (
                <p className="text-[12px] text-[var(--muted-foreground)]">This service has no extra detail fields.</p>
              )}
            </div>
          </div>
        )}

        {/* ─────────── 5 · SUPPLIER & COMMERCIALS ─────────── */}
        {step === 4 && (
          <div className="space-y-4 px-5 py-5">
            <SurfaceHeader title="Supplier & commercials" hint="The supplier belongs to THIS service, not to the customer." />
            <div>
              <label className={labelCls} htmlFor="w-supq">Supplier</label>
              <div className="relative mb-2">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input id="w-supq" className={`${inputCls} pl-8`} value={supplierQ} onChange={(e) => setSupplierQ(e.target.value)} placeholder="Search by supplier name or code…" />
              </div>
              <select aria-label="Supplier" className={inputCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">— No supplier —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.code}{s.type ? ` · ${s.type}` : ""}</option>)}
              </select>
              <Link to="/partners/suppliers" className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)]">
                <Building2 size={11} /> Manage suppliers →
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls} htmlFor="w-cost">Supplier cost (BDT)</label>
                <input id="w-cost" type="number" min="0" step="0.01" className={inputCls} value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls} htmlFor="w-price">Selling price (BDT)</label>
                <input id="w-price" type="number" min="0" step="0.01" className={inputCls} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls} htmlFor="w-disc">Discount (BDT)</label>
                <input id="w-disc" type="number" min="0" step="0.01" className={inputCls} value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-4 py-3 sm:grid-cols-2">
              <p className="text-[12px]">Customer price: <strong>{finalPrice == null ? "—" : fmtBDT(finalPrice)}</strong></p>
              <p className={`text-[12px] ${margin != null && margin < 0 ? "text-red-500" : ""}`}>
                Gross margin: <strong>{margin == null ? "—" : fmtBDT(margin)}</strong>
              </p>
            </div>
          </div>
        )}

        {/* ─────────── 6 · INVOICE & PAYMENT ─────────── */}
        {step === 5 && (
          <div className="space-y-4 px-5 py-5">
            <SurfaceHeader title="Invoice & payment" hint="Payment method and receive account are separate." />
            <div className="rounded-xl border border-[var(--border)] px-4 py-3 text-[12px]">
              <p>Customer: <strong>{customer?.fullName}</strong></p>
              <p>Service: <strong>{SERVICE_OPTIONS.find((s) => s.value === service)?.label}</strong></p>
              <p>Invoice total: <strong>{finalPrice == null ? "— (no invoice will be raised)" : fmtBDT(finalPrice)}</strong></p>
              {supplierId && cost.trim() && <p>Supplier payable: <strong>{fmtBDT(toPoisha(Number(cost)))}</strong></p>}
            </div>

            <label className="flex items-center gap-2 text-[12.5px] font-semibold">
              <input type="checkbox" checked={payNow} onChange={(e) => { setPayNow(e.target.checked); if (e.target.checked && finalPrice) setPayAmount(String(fromPoisha(finalPrice))); }} />
              Record a payment now
            </label>

            {payNow && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls} htmlFor="w-amt">Amount (BDT)</label>
                  <input id="w-amt" type="number" min="0" step="0.01" className={inputCls} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="w-method">Payment method</label>
                  <select id="w-method" className={inputCls} value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
                    {METHODS.map((m) => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="w-acct">Receive account</label>
                  <select id="w-acct" className={inputCls} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                    <option value="">— Choose where the money landed —</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.type}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="w-ref2">Reference</label>
                  <input id="w-ref2" className={inputCls} value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="bKash trx / cheque no." />
                </div>
                <p className="sm:col-span-2 text-[10.5px] text-[var(--muted-foreground)]">
                  The <strong>method</strong> is how the customer paid; the <strong>receive account</strong> is which company account it landed in. They are recorded separately.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─────────── 7 · CONFIRMATION ─────────── */}
        {step === 6 && created && (
          <div className="space-y-3 px-5 py-6">
            <p className="flex items-center gap-2 text-[14px] font-bold text-emerald-600">
              <Check size={16} /> {created.ref} created
            </p>
            <ul className="space-y-1 text-[12.5px]">
              <li>Service: {SERVICE_OPTIONS.find((s) => s.value === service)?.label}</li>
              <li>Customer: {customer?.fullName}</li>
              {created.invoiceNo && <li className="flex items-center gap-1.5"><Receipt size={12} /> Invoice {created.invoiceNo}</li>}
              {created.apDoc && <li className="flex items-center gap-1.5"><Building2 size={12} /> Supplier payable {created.apDoc}</li>}
              {payNow && <li className="flex items-center gap-1.5"><CreditCard size={12} /> Payment recorded</li>}
              <li>The case has entered its workflow and appears in the operations queue.</li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" className={btnPrimary} onClick={() => navigate(`/bookings/${created.appId}`)}>Open Booking 360</button>
              <button type="button" className={btnGhost} onClick={() => navigate("/operations")}>Operations queue</button>
            </div>
          </div>
        )}
      </Surface>

      {step < 6 && (
        <div className="flex items-center justify-between">
          <button type="button" className={btnGhost} onClick={back} disabled={step === 0 || busy}>
            <ArrowLeft size={13} className="mr-1 inline" /> Back
          </button>
          {step < 5 ? (
            <button type="button" className={btnPrimary} onClick={next} disabled={busy}>
              Continue <ArrowRight size={13} className="ml-1 inline" />
            </button>
          ) : (
            <button type="button" className={btnPrimary} onClick={submit} disabled={busy}>
              {busy ? "Creating…" : "Create service"}
            </button>
          )}
        </div>
      )}
    </PageShell>
  );
}
