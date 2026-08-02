import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { agentPortalApi } from "@/lib/agentPortalApi";
import { ApiError } from "@/lib/api";
import type { PackageMaster } from "@/lib/packages";
import { formatPrice, displayPricePoisha } from "@/lib/packages";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";

export default function AgentPackageBookPage() {
  const { slug } = useParams();
  const [pkg, setPkg] = useState<PackageMaster | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [pax, setPax] = useState("2");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!slug) return;
    void agentPortalApi
      .listPackages()
      .then((rows) => {
        const found = (Array.isArray(rows) ? rows : []).find((r) => String((r as PackageMaster).slug) === slug);
        if (found) setPkg(found as PackageMaster);
        else setError("Package not found");
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Load failed"));
  }, [slug]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!pkg) return;
    if (!customerName.trim()) {
      setError("Customer name required");
      return;
    }
    try {
      const r = await agentPortalApi.bookPackage({
        packageId: pkg.id,
        customerId: customerId.trim() || undefined,
        customerName: customerName.trim(),
        pax: Number(pax) || 1,
        notes: notes.trim() || undefined,
      });
      setOk(`Booking created${r.reference ? `: ${r.reference}` : ""}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Book failed");
    }
  }

  return (
    <div className="p-6 max-w-lg space-y-4">
      <Link to="/portal/agent/packages" className="text-[12px] text-[var(--accent)]">
        ← Packages
      </Link>
      <h1 className="text-[18px] font-bold">Book for customer</h1>
      {pkg && (
        <div className="p-3 rounded-xl border bg-[var(--muted)] text-[12px]">
          <p className="font-bold">{pkg.name}</p>
          <p>{formatPrice(displayPricePoisha(pkg))}</p>
          <p className="text-[10px] font-mono text-[var(--muted-foreground)]">PackageID locked: {pkg.id}</p>
        </div>
      )}
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />
      {pkg && (
        <form onSubmit={(e) => void submit(e)} className="space-y-3 bg-white border rounded-xl p-4">
          <input type="hidden" name="packageId" value={pkg.id} readOnly />
          <div>
            <label className={labelCls}>Customer name *</label>
            <input className={inputCls} value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Customer ID (optional)</label>
            <input className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Travellers</label>
            <input type="number" min="1" className={inputCls} value={pax} onChange={(e) => setPax(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="w-full py-2 rounded-lg bg-amber-600 text-white font-bold text-[12px]">
            Create booking
          </button>
        </form>
      )}
    </div>
  );
}
