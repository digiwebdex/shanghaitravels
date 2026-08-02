import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";
import type { PackageMaster } from "@/lib/packages";
import { formatPrice, displayPricePoisha } from "@/lib/packages";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";

export default function PortalCustomerPackageBookPage() {
  const { slug } = useParams();
  const [pkg, setPkg] = useState<PackageMaster | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [pax, setPax] = useState("2");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!slug) return;
    void customerPortalApi
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
    try {
      await customerPortalApi.enquirePackage({
        packageId: pkg.id,
        travelDate: travelDate || undefined,
        pax: Number(pax) || 1,
        notes: notes.trim() || undefined,
      });
      setOk("Booking enquiry submitted");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Submit failed");
    }
  }

  return (
    <div className="p-6 max-w-lg space-y-4">
      <Link to="/portal/customer/packages" className="text-[12px] text-[var(--accent)]">
        ← Packages
      </Link>
      <h1 className="text-[18px] font-bold">Book package</h1>
      {pkg && (
        <div className="p-3 rounded-xl border bg-amber-50 text-[12px]">
          <p className="font-bold">{pkg.name}</p>
          <p>{formatPrice(displayPricePoisha(pkg))}</p>
          <p className="text-[10px] text-[var(--muted-foreground)] font-mono mt-1">PackageID: {pkg.id}</p>
        </div>
      )}
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />
      {pkg && (
        <form onSubmit={(e) => void submit(e)} className="space-y-3 bg-white border rounded-xl p-4">
          <input type="hidden" value={pkg.id} readOnly aria-hidden />
          <div>
            <label className={labelCls}>Travel date</label>
            <input type="date" className={inputCls} value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
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
            Submit booking request
          </button>
        </form>
      )}
    </div>
  );
}
