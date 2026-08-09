/**
 * FINAL WORKFLOW — Supplier & Commercials for ONE booking.
 *
 * Replaces the old placeholder "Supplier" tab, which only linked to the supplier
 * centre and never recorded anything. Supplier, supplier cost and selling price
 * belong to the booking transaction — never to the customer — so the same
 * customer can buy a visa from one supplier and a ticket from another.
 *
 * Reuses the existing Supplier master (`suppliersApi`) and the existing AP
 * engine (`/applications/:id/supplier-bill` → `createApDocument`). No second
 * supplier list, no second payables path.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Building2, ExternalLink, Receipt, Search } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { applicationsApi, suppliersApi } from "@/lib/services";
import type { Application, Supplier } from "@/lib/types";
import { btnGhost, btnPrimary, inputCls, labelCls } from "@/components/enterprise/Page";
import { fromPoisha, toPoisha, fmtBDT } from "@/lib/money";

export function BookingCommercialsCard({
  app,
  onSaved,
  setError,
  setOk,
}: {
  app: Application;
  onSaved: () => void;
  setError: (m: string) => void;
  setOk: (m: string) => void;
}) {
  const { can } = useAuth();
  const mayEdit = can("application:update");
  const mayBill = can("ap:manage");

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");
  const [supplierId, setSupplierId] = useState(app.supplierId || "");
  const [cost, setCost] = useState(app.supplierCostPoisha != null ? String(fromPoisha(app.supplierCostPoisha)) : "");
  const [price, setPrice] = useState(app.sellingPricePoisha != null ? String(fromPoisha(app.sellingPricePoisha)) : "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    suppliersApi
      .list({ q: q || undefined, limit: 50 })
      .then((r) => alive && setSuppliers(r.data || []))
      .catch(() => alive && setSuppliers([]));
    return () => {
      alive = false;
    };
  }, [q]);

  // Margin is derived, never stored — it can never drift from cost/price.
  const margin = useMemo(() => {
    const c = cost.trim() === "" ? null : toPoisha(Number(cost));
    const p = price.trim() === "" ? null : toPoisha(Number(price));
    if (c == null || p == null || !Number.isFinite(c) || !Number.isFinite(p)) return null;
    return p - c;
  }, [cost, price]);

  async function save() {
    setError("");
    setOk("");
    setBusy(true);
    try {
      await applicationsApi.setCommercials(app.id, {
        supplierId: supplierId || null,
        supplierCostPoisha: cost.trim() === "" ? null : toPoisha(Number(cost)),
        sellingPricePoisha: price.trim() === "" ? null : toPoisha(Number(price)),
      });
      setOk("Commercials saved.");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save commercials");
    } finally {
      setBusy(false);
    }
  }

  async function raiseBill() {
    setError("");
    setOk("");
    setBusy(true);
    try {
      const doc = await applicationsApi.supplierBill(app.id);
      setOk(`Supplier payable ${doc.docNo} raised.`);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not raise the supplier bill");
    } finally {
      setBusy(false);
    }
  }

  const selected = suppliers.find((s) => s.id === supplierId) || app.supplier || null;

  return (
    <div className="space-y-4 px-5 py-5">
      <p className="text-[11.5px] leading-relaxed text-[var(--muted-foreground)]">
        The supplier and cost belong to <strong>this booking</strong>, not to the customer — the same customer can use a
        different supplier on every service.
      </p>

      <div>
        <label className={labelCls} htmlFor="cm-supplier-search">
          Supplier
        </label>
        <div className="relative mb-2">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            id="cm-supplier-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search suppliers by name or code…"
            className={`${inputCls} pl-8`}
            disabled={!mayEdit}
          />
        </div>
        <select
          aria-label="Select supplier"
          className={inputCls}
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          disabled={!mayEdit}
        >
          <option value="">— No supplier assigned —</option>
          {selected && !suppliers.some((s) => s.id === selected.id) && (
            <option value={selected.id}>
              {selected.name} · {selected.code}
            </option>
          )}
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.code}
              {s.type ? ` · ${s.type}` : ""}
            </option>
          ))}
        </select>
        {selected && (
          <Link
            to={`/partners/suppliers`}
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)]"
          >
            <Building2 size={11} /> Open supplier centre <ExternalLink size={10} />
          </Link>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls} htmlFor="cm-cost">
            Supplier cost (BDT)
          </label>
          <input
            id="cm-cost"
            type="number"
            min="0"
            step="0.01"
            className={inputCls}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            disabled={!mayEdit}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="cm-price">
            Selling price (BDT)
          </label>
          <input
            id="cm-price"
            type="number"
            min="0"
            step="0.01"
            className={inputCls}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={!mayEdit}
            placeholder="0.00"
          />
        </div>
        <div>
          <span className={labelCls}>Margin</span>
          <div
            className={`rounded-lg border border-[var(--border)] px-3 py-2 text-[13px] font-bold ${
              margin == null ? "text-[var(--muted-foreground)]" : margin < 0 ? "text-red-500" : "text-emerald-600"
            }`}
          >
            {margin == null ? "—" : fmtBDT(margin)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {mayEdit && (
          <button type="button" className={btnPrimary} onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save commercials"}
          </button>
        )}
        {mayBill && (
          <button
            type="button"
            className={btnGhost}
            onClick={raiseBill}
            disabled={busy || !supplierId || !cost.trim()}
            title={!supplierId || !cost.trim() ? "Assign a supplier and cost first" : "Raise the supplier payable"}
          >
            <Receipt size={13} className="mr-1 inline" /> Raise supplier bill
          </button>
        )}
        <Link to="/finance/ap" className="text-[11px] font-semibold text-[var(--accent)]">
          Supplier due (AP) →
        </Link>
      </div>

      {!mayEdit && (
        <p className="text-[11px] text-[var(--muted-foreground)]">
          You can view these figures but not change them — editing needs <code>application:update</code>.
        </p>
      )}
    </div>
  );
}
