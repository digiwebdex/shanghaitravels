import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Receipt, RefreshCw } from "lucide-react";
import {
  agentsApi,
  applicationsApi,
  commsApi,
  customersApi,
  financeApi,
  type CommTemplate,
  type CommTimelineItem,
} from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { Account, Application, Customer, Invoice, Payment } from "@/lib/types";
import { useAuth } from "@/auth/AuthProvider";
import { Can } from "@/auth/Can";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { EntityTabs, EntityTabPanel, type EntityTab } from "@/components/workflow/EntityTabs";
import { type Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  PageHeader,
  PageShell,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { fmtBDTPlain } from "@/lib/money";
import { ERP } from "@/config/env";

// getInvoice returns more than the shared Invoice type declares — widen locally (read-only).
type InvoiceDetail = Invoice & {
  discount?: number;
  tax?: number;
  currency?: string;
  dueAt?: string | null;
  issuedAt?: string | null;
  notes?: string | null;
  createdAt?: string;
  customer?: { fullName?: string; code?: string };
};

const PAYMENT_METHODS = ["cash", "bank_transfer", "bkash", "nagad", "card", "cheque", "other"];
const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString() : "—");
const fmtDateTime = (s?: string | null) => (s ? new Date(s).toLocaleString() : "—");
const ACTION_BTN =
  "inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--navy-50)]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--muted-foreground)]">{label}</span>
      <span className="text-[12.5px] text-[var(--foreground)]">{children ?? "—"}</span>
    </div>
  );
}

export default function FinanceInvoiceDetailPage() {
  const { id = "" } = useParams();
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  function setTab(t: string) {
    const n = new URLSearchParams(params);
    n.set("tab", t);
    setParams(n, { replace: true });
  }

  const [inv, setInv] = useState<InvoiceDetail | null>(null);
  const [app, setApp] = useState<Application | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [agentName, setAgentName] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [comms, setComms] = useState<CommTimelineItem[]>([]);
  const [audit, setAudit] = useState<Awaited<ReturnType<typeof financeApi.invoiceAudit>>>([]);
  // Communication composer (reuses CommsService — no duplicate engine)
  const [commTemplates, setCommTemplates] = useState<CommTemplate[]>([]);
  const [sendChannel, setSendChannel] = useState<"email" | "whatsapp" | "sms">("email");
  const [sendTemplateId, setSendTemplateId] = useState("");
  const [sendTo, setSendTo] = useState("");
  const [sendPreview, setSendPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  // Record-payment form
  const [pKind, setPKind] = useState<"payment" | "refund">("payment");
  const [pAmount, setPAmount] = useState("");
  const [pMethod, setPMethod] = useState("cash");
  const [pAccount, setPAccount] = useState("");
  const [pReference, setPReference] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const i = (await financeApi.getInvoice(id)) as InvoiceDetail;
      setInv(i);
      const jobs: Promise<unknown>[] = [
        financeApi.accounts().then(setAccounts).catch(() => setAccounts([])),
        commsApi
          .timeline("invoice", id)
          .then((r) => setComms(r.items || []))
          .catch(() => setComms([])),
        financeApi.invoiceAudit(id).then(setAudit).catch(() => setAudit([])),
      ];
      if (i.customerId) jobs.push(customersApi.get(i.customerId).then(setCustomer).catch(() => setCustomer(null)));
      if (i.applicationId) {
        jobs.push(
          applicationsApi
            .get(i.applicationId)
            .then(async (a) => {
              setApp(a);
              const agentId = (a as { agentId?: string | null }).agentId;
              if (agentId) {
                try {
                  const ag = await agentsApi.get(agentId);
                  setAgentName(`${ag.name} · ${ag.code}`);
                } catch {
                  /* agent lookup optional */
                }
              }
            })
            .catch(() => setApp(null)),
        );
      }
      await Promise.all(jobs);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Templates for the chosen channel; recipient pre-filled from the customer's contact.
  useEffect(() => {
    commsApi.listTemplates({ channel: sendChannel }).then(setCommTemplates).catch(() => setCommTemplates([]));
    setSendTemplateId("");
    setSendPreview("");
  }, [sendChannel]);
  useEffect(() => {
    setSendTo(sendChannel === "email" ? customer?.email || "" : customer?.whatsapp || customer?.phone || "");
  }, [sendChannel, customer]);

  async function submitPayment(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    const taka = Number(pAmount);
    if (!(taka > 0)) {
      setError("Amount must be a positive number");
      return;
    }
    if (!pAccount) {
      setError("Select a receiving account");
      return;
    }
    // F-2: a payment can never exceed the outstanding balance (refunds are exempt).
    // The backend is the final enforcement layer; this is the friendly front stop.
    if (pKind !== "refund" && inv?.due != null && Math.round(taka * 100) > inv.due) {
      setError("Payment amount cannot exceed the outstanding invoice balance.");
      return;
    }
    try {
      const body = {
        invoiceId: id,
        customerId: inv?.customerId,
        accountId: pAccount,
        amount: Math.round(taka * 100), // minor units (poisha)
        method: pMethod,
        reference: pReference || undefined,
      };
      if (pKind === "refund") await financeApi.recordRefund(body);
      else await financeApi.recordPayment(body);
      setOk(pKind === "refund" ? "Refund recorded" : "Payment recorded");
      setPAmount("");
      setPReference("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to record");
    }
  }

  async function run(fn: () => Promise<unknown>, msg: string) {
    setError("");
    setOk("");
    try {
      await fn();
      setOk(msg);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed");
    }
  }

  const payments = useMemo<Payment[]>(() => inv?.payments || [], [inv]);

  // Commercial merge vars — only truthful values. paymentLink/trackUrl render blank
  // until Phase 4 (pay link) / tracking exist (applyMergeFields drops unknown vars).
  const commVars = useMemo<Record<string, string>>(
    () => ({
      customerName: customer?.fullName || inv?.customer?.fullName || "",
      invoiceNo: inv?.invoiceNo || "",
      bookingNo: app?.referenceNo || "",
      amount: fmtBDTPlain(inv?.total ?? 0),
      dueAmount: fmtBDTPlain(inv?.due ?? 0),
      portalUrl: "https://shanghaitravels.com.bd/erp/#/portal/customer/login",
    }),
    [inv, customer, app],
  );

  async function pickCommTemplate(tid: string) {
    setSendTemplateId(tid);
    if (!tid) {
      setSendPreview("");
      return;
    }
    try {
      const r = (await commsApi.renderTemplate(tid, commVars)) as { subject?: string; body?: string };
      setSendPreview(r.body || "");
    } catch {
      setSendPreview("");
    }
  }
  async function reloadComms() {
    try {
      const r = await commsApi.timeline("invoice", id);
      setComms(r.items || []);
    } catch {
      /* keep existing */
    }
  }
  async function sendComm() {
    setError("");
    setOk("");
    if (!sendTo.trim()) {
      setError("Recipient is required");
      return;
    }
    try {
      await commsApi.send({
        channel: sendChannel,
        to: sendTo.trim(),
        relatedType: "invoice",
        relatedId: id,
        templateId: sendTemplateId || undefined,
        vars: commVars,
        partyKind: "customer",
        partyId: inv?.customerId,
      });
      setOk(`Message queued via ${sendChannel} (simulation)`);
      await reloadComms();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Send failed");
    }
  }
  async function retryComm(item: CommTimelineItem) {
    const to = item.channel === "email" ? customer?.email || "" : customer?.whatsapp || customer?.phone || "";
    if (!to) {
      setError("No recipient on file to retry");
      return;
    }
    setError("");
    setOk("");
    try {
      await commsApi.send({
        channel: item.channel,
        to,
        relatedType: "invoice",
        relatedId: id,
        body: item.body || undefined,
        subject: item.subject || undefined,
        partyKind: "customer",
        partyId: inv?.customerId,
      });
      setOk("Retried");
      await reloadComms();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Retry failed");
    }
  }

  // Timeline composed from existing sources (invoice lifecycle stamps + payments + communications).
  const timeline = useMemo(() => {
    const ev: { at: string; label: string; detail?: string }[] = [];
    if (inv?.createdAt) ev.push({ at: inv.createdAt, label: "Invoice created", detail: inv.invoiceNo });
    if (inv?.issuedAt) ev.push({ at: inv.issuedAt, label: "Invoice issued" });
    for (const p of payments)
      ev.push({
        at: p.receivedAt || "",
        label: p.kind === "refund" ? "Refund issued" : "Payment received",
        detail: `${fmtBDTPlain(p.amount)} · ${p.method}`,
      });
    for (const c of comms)
      ev.push({ at: c.createdAt, label: `${c.channel} ${c.direction}`, detail: c.summary || c.subject || undefined });
    return ev.filter((e) => e.at).sort((a, b) => (b.at || "").localeCompare(a.at || ""));
  }, [inv, payments, comms]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-16">
          <InlineSpinner />
        </div>
      </PageShell>
    );
  }
  if (!inv) {
    return (
      <PageShell>
        <ErrorBanner message={error || "Invoice not found"} />
        <Link to="/finance/invoices" className="text-[12px] font-bold text-[var(--accent)]">
          ← Back to invoices
        </Link>
      </PageShell>
    );
  }

  const s = inv.status;
  const terminal = ["void", "cancelled", "refunded"].includes(s);
  const paidAny = (inv.paid ?? 0) > 0;

  const itemCols: Column<NonNullable<InvoiceDetail["items"]>[number]>[] = [
    { key: "d", header: "Description", render: (r) => r.description },
    { key: "q", header: "Qty", className: "text-right tabular-nums", render: (r) => r.quantity },
    { key: "u", header: "Unit Price", className: "text-right tabular-nums", render: (r) => fmtBDTPlain(r.unitPrice) },
    { key: "a", header: "Amount", className: "text-right tabular-nums font-semibold", render: (r) => fmtBDTPlain(r.amount) },
  ];
  const payCols: Column<Payment>[] = [
    { key: "date", header: "Date", render: (r) => fmtDate(r.receivedAt) },
    { key: "amt", header: "Amount", className: "text-right tabular-nums", render: (r) => fmtBDTPlain(r.amount) },
    { key: "method", header: "Method", render: (r) => r.method },
    { key: "kind", header: "Kind", render: (r) => <Pill value={r.kind} tone={r.kind === "refund" ? "amber" : "green"} /> },
    { key: "ref", header: "Reference", render: (r) => r.reference || "—" },
    {
      key: "receipt",
      header: "Receipt",
      render: (r) =>
        r.kind === "payment" ? (
          <a href={`${ERP}/payments/${r.id}/receipt?download=1`} className="text-[11px] font-semibold text-[var(--accent)] hover:underline">
            Download
          </a>
        ) : (
          <span className="text-[var(--muted-foreground)]">—</span>
        ),
    },
  ];

  const tabs: EntityTab[] = [
    { id: "overview", label: "Overview" },
    { id: "items", label: "Items" },
    { id: "payments", label: "Payments" },
    { id: "communication", label: "Communication" },
    { id: "timeline", label: "Timeline" },
    { id: "documents", label: "Documents" },
    { id: "audit", label: "Audit" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Receipt}
        title={inv.invoiceNo}
        subtitle="Commercial invoice"
        breadcrumb={[{ label: "Finance ERP" }, { label: "Invoices", to: "/finance/invoices" }, { label: inv.invoiceNo }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Pill value={inv.status} tone={statusTone(inv.status)} />
            <Link to={`/customers/${inv.customerId}`} className={btnGhost}>
              Customer 360
            </Link>
            {inv.applicationId && (
              <Link to={`/bookings/${inv.applicationId}`} className={btnGhost}>
                Booking 360
              </Link>
            )}
            <a href={`${ERP}/invoices/${id}/pdf?download=1`} className={btnGhost}>
              Download PDF
            </a>
            <a href={`${ERP}/invoices/${id}/pdf`} target="_blank" rel="noopener" className={btnGhost}>
              Preview / Print
            </a>
            <button type="button" className={btnGhost} onClick={() => void load()}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        }
      />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="invoice:manage">
        <div className="flex flex-wrap gap-2">
          {s === "draft" && (
            <button type="button" className={ACTION_BTN} onClick={() => run(() => financeApi.issueInvoice(id), "Invoice issued")}>
              Issue
            </button>
          )}
          {!terminal && s !== "paid" && s !== "approved" && s !== "sent" && (
            <button type="button" className={ACTION_BTN} onClick={() => run(() => financeApi.approveInvoice(id), "Invoice approved")}>
              Approve
            </button>
          )}
          {!terminal && ["issued", "generated", "approved", "viewed"].includes(s) && (
            <button type="button" className={ACTION_BTN} onClick={() => run(() => financeApi.sendInvoice(id), "Marked as sent")}>
              Send
            </button>
          )}
          {s === "sent" && (
            <button type="button" className={ACTION_BTN} onClick={() => run(() => financeApi.markInvoiceViewed(id), "Marked as viewed")}>
              Mark viewed
            </button>
          )}
          {!terminal && s !== "paid" && !paidAny && (
            <button type="button" className={ACTION_BTN} onClick={() => run(() => financeApi.cancelInvoice(id), "Invoice cancelled")}>
              Cancel
            </button>
          )}
          {s !== "void" && s !== "refunded" && (
            <button type="button" className={ACTION_BTN} onClick={() => run(() => financeApi.voidInvoice(id), "Invoice voided")}>
              Void
            </button>
          )}
          <Can perm="payment:refund">
            {s !== "refunded" && (
              <button type="button" className={ACTION_BTN} onClick={() => run(() => financeApi.markInvoiceRefunded(id), "Marked refunded")}>
                Mark refunded
              </button>
            )}
          </Can>
        </div>
      </Can>

      <EntityTabs tabs={tabs} active={tab} onChange={setTab} />

      <EntityTabPanel when="overview" active={tab}>
        <Surface padded>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Field label="Invoice Number">{inv.invoiceNo}</Field>
            <Field label="Booking Number">
              {app ? (
                <Link to={`/bookings/${inv.applicationId}`} className="font-semibold text-[var(--accent)] hover:underline">
                  {app.referenceNo}
                </Link>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Customer">
              <Link to={`/customers/${inv.customerId}`} className="font-semibold text-[var(--accent)] hover:underline">
                {inv.customer?.fullName || customer?.fullName || inv.customerId}
              </Link>
            </Field>
            <Field label="Agent">{agentName || "—"}</Field>
            <Field label="Corporate">{"—"}</Field>
            <Field label="Passport Number">{customer?.passports?.[0]?.passportNo || "—"}</Field>
            <Field label="Service">{app?.serviceType || "—"}</Field>
            <Field label="Issue Date">{fmtDate(inv.issuedAt)}</Field>
            <Field label="Due Date">{fmtDate(inv.dueAt)}</Field>
            <Field label="Currency">{inv.currency || "BDT"}</Field>
            <Field label="Status">
              <Pill value={inv.status} tone={statusTone(inv.status)} />
            </Field>
            <Field label="Total">{fmtBDTPlain(inv.total)}</Field>
            <Field label="Discount">{fmtBDTPlain(inv.discount ?? 0)}</Field>
            <Field label="Tax">{fmtBDTPlain(inv.tax ?? 0)}</Field>
            <Field label="Paid">{fmtBDTPlain(inv.paid ?? 0)}</Field>
            <Field label="Due">
              <span className={(inv.due ?? 0) > 0 ? "font-bold text-red-600" : "text-[var(--muted-foreground)]"}>
                {fmtBDTPlain(inv.due ?? 0)}
              </span>
            </Field>
          </div>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="items" active={tab}>
        <Surface>
          <SurfaceHeader title={`${inv.items?.length || 0} line item${(inv.items?.length || 0) === 1 ? "" : "s"}`} />
          <DataTable rows={inv.items || []} columns={itemCols} rowKey={(r) => (r as { id?: string }).id ?? r.description} emptyTitle="No line items" />
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="payments" active={tab}>
        <Surface>
          <SurfaceHeader title={`${payments.length} payment${payments.length === 1 ? "" : "s"}`} hint={`Due ${fmtBDTPlain(inv.due ?? 0)}`} />
          <DataTable rows={payments} columns={payCols} rowKey={(r) => r.id} emptyTitle="No payments yet" />
        </Surface>
        <Can perm="payment:record">
          <Surface padded>
            <h3 className="mb-3 text-[12px] font-bold text-[var(--primary)]">Record a payment</h3>
            <form onSubmit={submitPayment} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelCls}>Type</label>
                <select className={inputCls} value={pKind} onChange={(e) => setPKind(e.target.value as "payment" | "refund")}>
                  <option value="payment">Payment</option>
                  {can("payment:refund") && <option value="refund">Refund</option>}
                </select>
              </div>
              <div>
                <label className={labelCls}>Amount (BDT)</label>
                <input className={inputCls} inputMode="decimal" value={pAmount} onChange={(e) => setPAmount(e.target.value)} placeholder="0.00" />
                {pKind !== "refund" && (inv?.due ?? 0) > 0 && (
                  <p className="mt-1 text-[10.5px] text-[var(--muted-foreground)]">Outstanding: {fmtBDTPlain(inv?.due ?? 0)}</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Method</label>
                <select className={inputCls} value={pMethod} onChange={(e) => setPMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Account</label>
                <select className={inputCls} value={pAccount} onChange={(e) => setPAccount(e.target.value)}>
                  <option value="">— select —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Reference</label>
                <input className={inputCls} value={pReference} onChange={(e) => setPReference(e.target.value)} placeholder="txn / cheque no." />
              </div>
              <div className="flex items-end">
                <button type="submit" className={`${btnPrimary} w-full`} style={btnPrimaryStyle}>
                  {pKind === "refund" ? "Record refund" : "Record payment"}
                </button>
              </div>
            </form>
          </Surface>
        </Can>
      </EntityTabPanel>

      <EntityTabPanel when="communication" active={tab}>
        <Can perm="comms:send">
          <Surface padded>
            <h3 className="mb-3 text-[12px] font-bold text-[var(--primary)]">Send invoice message</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Channel</label>
                <select className={inputCls} value={sendChannel} onChange={(e) => setSendChannel(e.target.value as "email" | "whatsapp" | "sms")}>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Template</label>
                <select className={inputCls} value={sendTemplateId} onChange={(e) => void pickCommTemplate(e.target.value)}>
                  <option value="">— none —</option>
                  {commTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>To</label>
                <input className={inputCls} value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder={sendChannel === "email" ? "email" : "phone / whatsapp"} />
              </div>
            </div>
            {sendPreview && (
              <div className="mt-3">
                <label className={labelCls}>Preview</label>
                <pre className="whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3 text-[11.5px] text-[var(--foreground)]">{sendPreview}</pre>
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={() => void sendComm()}>
                Send
              </button>
              <span className="text-[10.5px] text-[var(--muted-foreground)]">
                Delivery is in simulation mode until messaging credentials are configured. PDF attachment activates in Phase 4.
              </span>
            </div>
          </Surface>
        </Can>
        <Surface padded>
          <h3 className="mb-3 text-[12px] font-bold text-[var(--primary)]">History</h3>
          {comms.length === 0 ? (
            <EmptyState title="No communications yet" hint="Sent invoice email / WhatsApp / SMS appear here with delivery status." />
          ) : (
            <ul className="space-y-2">
              {comms.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3 py-2 text-[11.5px]">
                  <span className="flex min-w-0 items-center gap-2">
                    <Pill value={c.channel} tone="blue" />
                    <span className="text-[var(--muted-foreground)]">{c.direction}</span>
                    <span className="truncate">{c.summary || c.subject || "—"}</span>
                  </span>
                  <span className="flex flex-shrink-0 items-center gap-2">
                    <Pill value={c.status} tone={statusTone(c.status)} />
                    <span className="text-[10.5px] text-[var(--muted-foreground)]">{fmtDateTime(c.createdAt)}</span>
                    {c.status === "failed" && (
                      <button type="button" className="text-[10.5px] font-bold text-[var(--accent)] hover:underline" onClick={() => void retryComm(c)}>
                        Retry
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="timeline" active={tab}>
        <Surface padded>
          {timeline.length === 0 ? (
            <EmptyState title="No events yet" />
          ) : (
            <ol className="space-y-2.5">
              {timeline.map((e, i) => (
                <li key={i} className="flex items-start gap-3 text-[11.5px]">
                  <span className="mt-1 size-2 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-[var(--foreground)]">{e.label}</span>
                    {e.detail && <span className="text-[var(--muted-foreground)]">{e.detail}</span>}
                    <span className="text-[10.5px] text-[var(--muted-foreground)]">{fmtDateTime(e.at)}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="documents" active={tab}>
        <Surface padded>
          {inv.applicationId ? (
            <div className="space-y-3">
              <EmptyState title="Documents live on the linked booking" hint="Open Booking 360 → Documents for this invoice's booking." />
              <div className="text-center">
                <Link to={`/bookings/${inv.applicationId}`} className={btnGhost}>
                  Open Booking 360
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState title="No linked booking" hint="This invoice is not attached to a booking." />
          )}
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="audit" active={tab}>
        <Surface padded>
          {audit.length === 0 ? (
            <EmptyState title="No audit entries yet" hint="Lifecycle actions (issue, approve, send, payments, cancel/void) are recorded here." />
          ) : (
            <ol className="space-y-2">
              {audit.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3 py-2 text-[11.5px]"
                >
                  <span className="font-semibold text-[var(--foreground)]">{a.action}</span>
                  <span className="flex items-center gap-2 text-[10.5px] text-[var(--muted-foreground)]">
                    <span>by {a.userId.slice(0, 8)}</span>
                    <span>{fmtDateTime(a.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="notes" active={tab}>
        <Surface padded>
          {inv.notes ? (
            <p className="whitespace-pre-wrap text-[12.5px] text-[var(--foreground)]">{inv.notes}</p>
          ) : (
            <EmptyState title="No notes" />
          )}
        </Surface>
      </EntityTabPanel>
    </PageShell>
  );
}
