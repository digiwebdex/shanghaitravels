import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { applicationsApi, customersApi, financeApi, packagesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Account, Customer } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import {
  PageHeader,
  PageShell,
  Surface,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { JourneyContinuity } from "@/components/workflow/MasterJourney";
import { ScanDocumentPanel, ocrFullName, ocrGenderToForm } from "@/components/ocr/ScanDocumentPanel";
import { bookingWorkspaceHref, SERVICE_OPTIONS, type ServiceKind } from "@/lib/workflow";
import { toPoisha } from "@/lib/money";

const STEPS = [
  "Service",
  "Package",
  "Customer",
  "Documents",
  "Traveler",
  "Supplier",
  "Review",
  "Invoice",
  "Payment",
  "Done",
] as const;

export default function UnifiedBookingWizardPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { can } = useAuth();
  const presetCustomer = params.get("customerId") || "";
  const presetService = (params.get("service") as ServiceKind) || "visa";

  const [step, setStep] = useState(0);
  const [service, setService] = useState<ServiceKind>(
    SERVICE_OPTIONS.some((s) => s.value === presetService && s.supported !== false) ? presetService : "visa",
  );
  const [packageId, setPackageId] = useState("");
  const [packageLabel, setPackageLabel] = useState("");
  const [packages, setPackages] = useState<{ id: string; name: string; slug?: string }[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(presetCustomer);
  const [createNew, setCreateNew] = useState(false);
  const [newCust, setNewCust] = useState({ fullName: "", phone: "", email: "", nationality: "", gender: "", dob: "" });
  const [travelerNote, setTravelerNote] = useState("");
  const [supplierNote, setSupplierNote] = useState("");
  const [priority, setPriority] = useState("medium");
  const [title, setTitle] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [appId, setAppId] = useState("");
  const [refNo, setRefNo] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [ocrHint, setOcrHint] = useState("");

  const apiType = useMemo(
    () => SERVICE_OPTIONS.find((s) => s.value === service)?.apiType || "visa",
    [service],
  );

  useEffect(() => {
    void customersApi
      .list({ limit: 200 })
      .then((r) => setCustomers(listOf<Customer>(r)))
      .catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    void packagesApi
      .list({ limit: 100 })
      .then((r) => {
        const rows = listOf<{ id: string; name: string; slug?: string }>(r as never);
        setPackages(rows);
      })
      .catch(() => setPackages([]));
  }, []);

  useEffect(() => {
    if (!can("bank:read")) return;
    void financeApi
      .accounts()
      .then((a) => {
        setAccounts(a);
        if (a[0]) setAccountId(a[0].id);
      })
      .catch(() => setAccounts([]));
  }, [can]);

  function next() {
    setError("");
    if (step === 0 && !service) {
      setError("Choose a service");
      return;
    }
    if (step === 2 && !customerId && !createNew) {
      setError("Select or create a customer");
      return;
    }
    if (step === 2 && createNew && (!newCust.fullName.trim() || !newCust.phone.trim())) {
      setError("New customer needs name and phone");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  }

  async function ensureCustomer(): Promise<string> {
    if (customerId && !createNew) return customerId;
    const c = await customersApi.create({
      fullName: newCust.fullName.trim(),
      phone: newCust.phone.trim(),
      email: newCust.email.trim() || undefined,
      nationality: newCust.nationality || undefined,
      gender: newCust.gender || undefined,
      dob: newCust.dob || undefined,
    });
    setCustomerId(c.id);
    setCreateNew(false);
    return c.id;
  }

  async function createBooking() {
    // HF2 — never create an unsupported service (would otherwise map to visa).
    if (SERVICE_OPTIONS.find((s) => s.value === service)?.supported === false) {
      setError("This service type is not yet supported.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const cid = await ensureCustomer();
      const cust = customers.find((c) => c.id === cid);
      const svcLabel = SERVICE_OPTIONS.find((s) => s.value === service)?.label || service;
      const app = await applicationsApi.create({
        serviceType: apiType,
        customerId: cid,
        priority,
        title:
          title.trim() ||
          `${svcLabel} — ${cust?.fullName || newCust.fullName || "customer"}`,
        direction: "outbound",
        source: "walkin",
      });
      const notes = [
        packageLabel ? `Package: ${packageLabel}` : "",
        travelerNote.trim(),
        supplierNote.trim() ? `Supplier note: ${supplierNote.trim()}` : "",
        ocrHint ? `OCR: ${ocrHint}` : "",
        service === "student" || service === "manpower" ? `Channel service: ${service}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      if (notes) {
        await applicationsApi.note(app.id, notes).catch(() => undefined);
      }
      setAppId(app.id);
      setRefNo(app.referenceNo);
      setOk(`Booking ${app.referenceNo} created`);
      setStep(7);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create booking");
    } finally {
      setBusy(false);
    }
  }

  async function createInvoice(e: FormEvent) {
    e.preventDefault();
    if (!appId || !customerId) return;
    const amt = toPoisha(invoiceAmount);
    if (!amt || amt <= 0) {
      setError("Enter invoice amount (BDT)");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const inv = await financeApi.createInvoice({
        customerId,
        applicationId: appId,
        items: [
          {
            description: title || `${service} booking`,
            quantity: 1,
            unitPrice: amt,
          },
        ],
      });
      try {
        await financeApi.issueInvoice(inv.id);
      } catch {
        /* issue may require extra perm — invoice still created */
      }
      setInvoiceId(inv.id);
      setOk(`Invoice ${inv.invoiceNo} ready`);
      setStep(8);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invoice failed");
    } finally {
      setBusy(false);
    }
  }

  async function recordPayment(e: FormEvent) {
    e.preventDefault();
    if (!invoiceId) {
      setStep(9);
      return;
    }
    const amt = toPoisha(payAmount || invoiceAmount);
    if (!amt || !accountId) {
      setError("Payment amount and cash/bank account required — or skip");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await financeApi.recordPayment({
        invoiceId,
        customerId,
        accountId,
        amount: amt,
        method: "cash",
      });
      setOk("Payment recorded");
      setStep(9);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        icon={Sparkles}
        title="Unified Booking Wizard"
        subtitle="One guided path: service → customer → documents/OCR → booking → invoice → payment."
        breadcrumb={[
          { label: "Bookings", to: "/visa" },
          { label: "New booking" },
        ]}
      />
      <JourneyContinuity
        active={step >= 9 ? "finance" : step >= 6 ? "booking" : step >= 3 ? "documents" : "customer"}
        previousHint={step === 0 ? "Customer selected or walk-in" : STEPS[Math.max(0, step - 1)]}
        nextHint={step < STEPS.length - 1 ? STEPS[step + 1] : "Open Booking 360"}
      />

      <Surface padded className="mb-4">
        <ol className="flex flex-wrap gap-1.5">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                i === step
                  ? "border-[var(--accent)] bg-[var(--orange-50)] text-[var(--accent)]"
                  : i < step
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-[var(--border)] text-[var(--muted-foreground)]"
              }`}
            >
              {i < step ? <Check size={10} /> : <span className="opacity-60">{i + 1}</span>}
              {label}
            </li>
          ))}
        </ol>
      </Surface>

      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Surface padded className="max-w-2xl space-y-4">
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-[14px] font-bold text-[var(--primary)]">1 · Choose service</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SERVICE_OPTIONS.filter((s) => s.supported !== false).map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setService(s.value)}
                  className={`rounded-2xl border p-3 text-left ${
                    service === s.value
                      ? "border-[var(--accent)] bg-[var(--orange-50)]"
                      : "border-[var(--border)] bg-white"
                  }`}
                >
                  <p className="text-[12px] font-bold text-[var(--primary)]">{s.label}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">{s.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-[14px] font-bold">2 · Choose package (optional)</h2>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Skip if not package-based. Catalog packages are attached as a booking note — package engine unchanged.
            </p>
            <select
              className={inputCls}
              value={packageId}
              onChange={(e) => {
                const id = e.target.value;
                setPackageId(id);
                const p = packages.find((x) => x.id === id);
                setPackageLabel(p?.name || "");
              }}
            >
              <option value="">— no package / skip —</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Link to="/products/packages" className="text-[11px] font-bold text-[var(--accent)]">
              Browse full catalog →
            </Link>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-[14px] font-bold">3 · Customer</h2>
            <label className="flex items-center gap-2 text-[12px]">
              <input type="checkbox" checked={createNew} onChange={(e) => setCreateNew(e.target.checked)} />
              Create new customer (never duplicate — search first)
            </label>
            {!createNew ? (
              <div>
                <label className={labelCls}>Existing customer *</label>
                <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">— select —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.code}) · {c.phone}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(
                  [
                    ["fullName", "Full name *"],
                    ["phone", "Phone *"],
                    ["email", "Email"],
                    ["nationality", "Nationality"],
                    ["dob", "DOB"],
                  ] as const
                ).map(([k, label]) => (
                  <div key={k}>
                    <label className={labelCls}>{label}</label>
                    <input
                      className={inputCls}
                      value={newCust[k]}
                      onChange={(e) => setNewCust({ ...newCust, [k]: e.target.value })}
                    />
                  </div>
                ))}
                <div>
                  <label className={labelCls}>Gender</label>
                  <select
                    className={inputCls}
                    value={newCust.gender}
                    onChange={(e) => setNewCust({ ...newCust, gender: e.target.value })}
                  >
                    <option value="">—</option>
                    <option value="male">male</option>
                    <option value="female">female</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h2 className="text-[14px] font-bold">4 · Documents → OCR → autofill</h2>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Uses the existing Document Intelligence engine. Confirm Save after reviewing confidence.
            </p>
            <ScanDocumentPanel
              customerId={customerId || undefined}
              defaultDocType="passport"
              defaultOpen
              compact={false}
              savePassportOnConfirm={!!customerId && !createNew}
              title="Upload passport / NID / visa"
              onAutofill={(fields) => {
                const name = ocrFullName(fields);
                setOcrHint([name, fields.passportNo, fields.nidNumber].filter(Boolean).join(" · "));
                if (createNew) {
                  setNewCust((f) => ({
                    ...f,
                    fullName: name || f.fullName,
                    nationality: fields.nationality || f.nationality,
                    gender: ocrGenderToForm(fields.gender) || f.gender,
                    dob: fields.dateOfBirth || f.dob,
                  }));
                }
                if (name) setTitle((t) => t || `${SERVICE_OPTIONS.find((s) => s.value === service)?.label} — ${name}`);
                setOk("OCR fields applied — continue to traveler step");
              }}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h2 className="text-[14px] font-bold">5 · Traveler information</h2>
            <div>
              <label className={labelCls}>Booking title</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Auto if blank" />
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
                {["low", "medium", "high", "urgent"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Traveler / case notes</label>
              <textarea className={inputCls} rows={3} value={travelerNote} onChange={(e) => setTravelerNote(e.target.value)} />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <h2 className="text-[14px] font-bold">6 · Supplier (optional)</h2>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Full supplier assignment remains on the service desk. Capture a note here for ops.
            </p>
            <textarea
              className={inputCls}
              rows={3}
              placeholder="e.g. Preferred airline / hotel vendor"
              value={supplierNote}
              onChange={(e) => setSupplierNote(e.target.value)}
            />
            <Link to="/suppliers" className="text-[11px] font-bold text-[var(--accent)]">
              Open supplier center →
            </Link>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3">
            <h2 className="text-[14px] font-bold">7 · Review</h2>
            <dl className="space-y-1 text-[12px]">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted-foreground)]">Service</dt>
                <dd className="font-bold">{SERVICE_OPTIONS.find((s) => s.value === service)?.label}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted-foreground)]">Package</dt>
                <dd className="font-bold">{packageLabel || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted-foreground)]">Customer</dt>
                <dd className="font-bold">
                  {createNew
                    ? `${newCust.fullName} (new)`
                    : customers.find((c) => c.id === customerId)?.fullName || customerId}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted-foreground)]">OCR</dt>
                <dd className="font-bold">{ocrHint || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted-foreground)]">Priority</dt>
                <dd className="font-bold">{priority}</dd>
              </div>
            </dl>
            <Can perm="application:create">
              <button
                type="button"
                disabled={busy}
                className={btnPrimary}
                style={btnPrimaryStyle}
                onClick={() => void createBooking()}
              >
                {busy ? "Creating…" : "Create booking"}
              </button>
            </Can>
          </div>
        )}

        {step === 7 && (
          <form onSubmit={(e) => void createInvoice(e)} className="space-y-3">
            <h2 className="text-[14px] font-bold">8 · Invoice</h2>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Booking <span className="font-mono font-bold">{refNo}</span> created. Optional invoice (existing finance API).
            </p>
            <div>
              <label className={labelCls}>Amount (BDT)</label>
              <input
                className={inputCls}
                inputMode="decimal"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Can perm="invoice:manage">
                <button type="submit" disabled={busy} className={btnPrimary} style={btnPrimaryStyle}>
                  Create invoice
                </button>
              </Can>
              <button type="button" className={btnGhost} onClick={() => setStep(9)}>
                Skip finance for now
              </button>
            </div>
          </form>
        )}

        {step === 8 && (
          <form onSubmit={(e) => void recordPayment(e)} className="space-y-3">
            <h2 className="text-[14px] font-bold">9 · Payment</h2>
            <div>
              <label className={labelCls}>Amount (BDT)</label>
              <input
                className={inputCls}
                value={payAmount || invoiceAmount}
                onChange={(e) => setPayAmount(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
            <div>
              <label className={labelCls}>Cash / bank account</label>
              <select className={inputCls} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">—</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name || a.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Can perm="payment:record">
                <button type="submit" disabled={busy} className={btnPrimary} style={btnPrimaryStyle}>
                  Record payment
                </button>
              </Can>
              <button type="button" className={btnGhost} onClick={() => setStep(9)}>
                Skip payment
              </button>
            </div>
          </form>
        )}

        {step === 9 && (
          <div className="space-y-3">
            <h2 className="text-[14px] font-bold text-emerald-700">10 · Booking created</h2>
            <p className="text-[12px]">
              Reference <span className="font-mono font-bold">{refNo || "—"}</span>
            </p>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Continue in Booking 360 for documents, operations, and audit — or open the service desk for deep processing.
            </p>
            <div className="flex flex-wrap gap-2">
              {appId && (
                <button
                  type="button"
                  className={btnPrimary}
                  style={btnPrimaryStyle}
                  onClick={() => navigate(bookingWorkspaceHref(appId), { replace: true })}
                >
                  Open Booking 360
                </button>
              )}
              {customerId && (
                <Link to={`/customers/${customerId}`} className={btnGhost}>
                  Customer 360
                </Link>
              )}
              <Link to="/operations" className={btnGhost}>
                Operations queue
              </Link>
            </div>
          </div>
        )}

        {step < 6 && (
          <div className="flex justify-between border-t border-[var(--border)] pt-4">
            <button type="button" className={btnGhost} disabled={step === 0} onClick={back}>
              Back
            </button>
            <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={next}>
              Continue <ChevronRight size={14} />
            </button>
          </div>
        )}
      </Surface>
    </PageShell>
  );
}
