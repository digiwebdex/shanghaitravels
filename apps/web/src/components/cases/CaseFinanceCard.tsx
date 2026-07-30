import { useEffect, useState } from "react";
import { arApi, financeApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { Account, Application, Invoice } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { fmtBDTPlain, toPoisha } from "@/lib/money";
import { inputCls, labelCls } from "@/components/cases/formStyles";

export function CaseFinanceCard({
  app,
  invoices,
  accounts,
  onSaved,
  setError,
  setOk,
  defaultDescription,
}: {
  app: Application;
  invoices: Invoice[];
  accounts: Account[];
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
  defaultDescription?: string;
}) {
  const { can } = useAuth();
  const [desc, setDesc] = useState(defaultDescription || `${app.title || "Service"} — fee`);
  const [amount, setAmount] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [method, setMethod] = useState("cash");
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!accountId && accounts[0]) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  useEffect(() => {
    setActiveInvoice(invoices[0] || null);
  }, [invoices]);

  async function createInvoice() {
    const unitPrice = toPoisha(amount);
    if (unitPrice <= 0) {
      setError("Enter an amount");
      return;
    }
    try {
      const inv = await financeApi.createInvoice({
        customerId: app.customerId,
        applicationId: app.id,
        items: [{ description: desc.trim(), quantity: 1, unitPrice }],
      });
      setActiveInvoice(inv);
      setOk(`Invoice ${inv.invoiceNo} created (draft)`);
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Invoice failed");
    }
  }

  async function issue() {
    if (!activeInvoice) return;
    try {
      const inv = await financeApi.issueInvoice(activeInvoice.id);
      setActiveInvoice(inv);
      setOk(`Invoice ${inv.invoiceNo} issued`);
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Issue failed");
    }
  }

  async function postToAr() {
    if (!activeInvoice) return;
    try {
      const ar = await arApi.bridgeInvoice(activeInvoice.id);
      setOk(`AR ${ar.docNo} posted to GL (${ar.journal?.journalNo || "journal"})`);
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "AR bridge failed");
    }
  }

  async function pay() {
    if (!activeInvoice) return;
    const amt = toPoisha(payAmount);
    if (amt <= 0 || !accountId) {
      setError("Enter payment amount and account");
      return;
    }
    try {
      const pay = await financeApi.recordPayment({
        invoiceId: activeInvoice.id,
        customerId: app.customerId,
        accountId,
        amount: amt,
        method,
      });
      setOk("Payment recorded");
      setPayAmount("");
      if (can("ar:manage") && pay?.id) {
        try {
          const ar = await arApi.bridgePayment(pay.id);
          setOk(`Payment recorded · AR receipt ${ar.docNo} posted`);
        } catch {
          /* cash payment succeeded; AR bridge optional if GL not ready */
        }
      }
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Payment failed");
    }
  }

  async function refund() {
    if (!activeInvoice) return;
    const amt = toPoisha(payAmount);
    if (amt <= 0 || !accountId) {
      setError("Enter refund amount and account");
      return;
    }
    try {
      await financeApi.recordRefund({
        invoiceId: activeInvoice.id,
        customerId: app.customerId,
        accountId,
        amount: amt,
        method,
      });
      setOk("Refund recorded");
      setPayAmount("");
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Refund failed");
    }
  }

  if (!can("invoice:amount:read") && !can("invoice:manage")) {
    return (
      <section className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-[12px] font-bold text-slate-800 mb-2">Invoice & payment</h2>
        <p className="text-[11px] text-slate-400">Finance module hidden for your role.</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-[12px] font-bold text-slate-800 mb-3">Invoice & payment</h2>

      {activeInvoice && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
          <p className="font-bold text-slate-800">
            {activeInvoice.invoiceNo} · {fmtBDTPlain(activeInvoice.total)} ·{" "}
            <span className="text-slate-500">{activeInvoice.status}</span>
          </p>
          {activeInvoice.paid != null && (
            <p className="text-slate-500 mt-0.5">
              Paid {fmtBDTPlain(activeInvoice.paid)} · Due {fmtBDTPlain(activeInvoice.due)}
            </p>
          )}
        </div>
      )}

      <Can perm="invoice:manage">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Line description</label>
            <input className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Amount (৳)</label>
            <input
              className={inputCls}
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000.00"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => void createInvoice()}
            className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
          >
            Create invoice
          </button>
          {activeInvoice && activeInvoice.status === "draft" && (
            <button
              type="button"
              onClick={() => void issue()}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold"
            >
              Issue invoice
            </button>
          )}
          <Can perm="ar:manage">
            {activeInvoice && ["issued", "partially_paid", "paid"].includes(activeInvoice.status) && (
              <button
                type="button"
                onClick={() => void postToAr()}
                className="px-3 py-1.5 rounded-lg border border-amber-200 text-[10.5px] font-semibold text-amber-800 bg-amber-50"
              >
                Post receivable to GL
              </button>
            )}
          </Can>
        </div>
      </Can>

      {(can("payment:record") || can("payment:refund")) &&
        activeInvoice &&
        ["issued", "partially_paid", "paid"].includes(activeInvoice.status) && (
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Record payment / refund</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className={labelCls} htmlFor="fin-pay-amt">
                  Amount (৳)
                </label>
                <input
                  id="fin-pay-amt"
                  className={inputCls}
                  type="number"
                  min="0"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="fin-pay-acct">
                  Account
                </label>
                <select
                  id="fin-pay-acct"
                  className={inputCls}
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="fin-pay-method">
                  Method
                </label>
                <select
                  id="fin-pay-method"
                  className={inputCls}
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  {["cash", "bank_transfer", "bkash", "nagad", "card", "cheque", "other"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Can perm="payment:record">
                {["issued", "partially_paid"].includes(activeInvoice.status) && (
                  <button
                    type="button"
                    onClick={() => void pay()}
                    className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
                  >
                    Record payment
                  </button>
                )}
              </Can>
              <Can perm="payment:refund">
                {(activeInvoice.paid ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => void refund()}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-[10.5px] font-semibold text-red-700"
                  >
                    Record refund
                  </button>
                )}
              </Can>
            </div>
          </div>
        )}
    </section>
  );
}
