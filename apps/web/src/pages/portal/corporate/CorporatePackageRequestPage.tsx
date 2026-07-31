import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { ApiError } from "@/lib/api";
import type { PackageMaster } from "@/lib/packages";
import { formatPrice, displayPricePoisha } from "@/lib/packages";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";

export default function CorporatePackageRequestPage() {
  const { slug } = useParams();
  const [pkg, setPkg] = useState<PackageMaster | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [purpose, setPurpose] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [pax, setPax] = useState("1");

  useEffect(() => {
    if (!slug) return;
    void corporatePortalApi
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
      const r = await corporatePortalApi.requestPackage({
        packageId: pkg.id,
        purpose: purpose.trim() || undefined,
        employeeId: employeeId.trim() || undefined,
        pax: Number(pax) || 1,
      });
      setOk(`Request submitted${r.reference ? `: ${r.reference}` : ""}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed");
    }
  }

  return (
    <div className="p-6 max-w-lg space-y-4">
      <Link to="/portal/corporate/packages" className="text-[12px] text-teal-700">
        ← Packages
      </Link>
      <h1 className="text-[18px] font-bold">Request corporate package</h1>
      {pkg && (
        <div className="p-3 rounded-xl border bg-teal-50 text-[12px]">
          <p className="font-bold">{pkg.name}</p>
          <p>{formatPrice(displayPricePoisha(pkg))}</p>
          <p className="text-[10px] font-mono text-slate-500">PackageID: {pkg.id}</p>
        </div>
      )}
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />
      {pkg && (
        <form onSubmit={(e) => void submit(e)} className="space-y-3 bg-white border rounded-xl p-4">
          <input type="hidden" value={pkg.id} readOnly />
          <div>
            <label className={labelCls}>Employee ID</label>
            <input className={inputCls} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Purpose</label>
            <input className={inputCls} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Travellers</label>
            <input type="number" min="1" className={inputCls} value={pax} onChange={(e) => setPax(e.target.value)} />
          </div>
          <button type="submit" className="w-full py-2 rounded-lg bg-teal-600 text-white font-bold text-[12px]">
            Submit request
          </button>
        </form>
      )}
    </div>
  );
}
