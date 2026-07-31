import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { sitePackagesApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { PackageMaster } from "@/lib/packages";
import { formatPrice, displayPricePoisha } from "@/lib/packages";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";

export default function SitePackageBookPage() {
  const { slug } = useParams();
  const [pkg, setPkg] = useState<PackageMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [pax, setPax] = useState("2");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!slug) return;
    void (async () => {
      setLoading(true);
      try {
        setPkg(await sitePackagesApi.getBySlug(slug));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Package not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!pkg) return;
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required");
      return;
    }
    setError("");
    try {
      // PackageID is locked from the URL slug — never taken from a client-editable field.
      const r = await sitePackagesApi.enquire(pkg.slug, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim(),
        travelDate: travelDate || undefined,
        pax: Number(pax) || 1,
        notes: notes.trim() || undefined,
        source: "website",
      });
      setOk(r.leadId ? `Enquiry submitted — ref ${r.leadId}` : "Enquiry submitted. We will contact you shortly.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Submission failed");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white px-4 py-3">
        <Link to={pkg ? `/site/packages/${pkg.slug}` : "/site"} className="font-bold text-[14px]">
          ← {pkg?.name || "Back"}
        </Link>
      </header>
      <main className="max-w-lg mx-auto px-4 py-10">
        {pkg && (
          <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200">
            <p className="text-[10px] text-slate-400 uppercase">Selected package (locked)</p>
            <p className="font-bold text-[15px] text-slate-900">{pkg.name}</p>
            <p className="text-[12px] text-amber-700 font-semibold">{formatPrice(displayPricePoisha(pkg))}</p>
            <input type="hidden" name="packageId" value={pkg.id} readOnly aria-hidden />
          </div>
        )}
        <h1 className="text-xl font-bold text-slate-900 mb-4">Book / enquire</h1>
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        {pkg && (
          <form onSubmit={(e) => void submit(e)} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div>
              <label className={labelCls}>Full name *</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Phone *</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Preferred travel date</label>
              <input type="date" className={inputCls} value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Travellers</label>
              <input type="number" min="1" className={inputCls} value={pax} onChange={(e) => setPax(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea className={inputCls} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-[13px]">
              Submit enquiry
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
