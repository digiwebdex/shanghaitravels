import { FormEvent, useEffect, useState } from "react";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { ApiError } from "@/lib/api";
import { CORPORATE_SERVICE_TYPES, formatPoisha } from "@/lib/corporatePortal";
import { InlineSpinner } from "@/components/FullPageSpinner";

export default function CorporateCompanyPage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [billingAddress, setBillingAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [preferredServices, setPreferredServices] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void corporatePortalApi
      .company()
      .then((c) => {
        setData(c);
        setBillingAddress(String(c.billingAddress || ""));
        setPaymentTerms(String(c.paymentTerms || ""));
        setPreferredServices(Array.isArray(c.preferredServices) ? c.preferredServices : []);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  function toggleService(svc: string) {
    setPreferredServices((prev) => (prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setOk("");
    try {
      await corporatePortalApi.patchCompany({ billingAddress, paymentTerms, preferredServices });
      setOk("Company profile updated");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!data && !error) {
    return (
      <div className="flex justify-center py-20">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <div className="p-5 max-w-3xl space-y-4">
      <h1 className="text-[16px] font-bold">Company profile</h1>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {ok && <p className="text-emerald-700 text-[11px]">{ok}</p>}
      {data && (
        <>
          <section className="bg-white border rounded-xl p-4 text-[11px] space-y-2">
            <h2 className="text-[12px] font-bold">{String(data.companyName || "Company")}</h2>
            <p className="text-[var(--muted-foreground)]">{String(data.code || data.registrationNo || "—")}</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <div className="text-[10px] text-[var(--muted-foreground)] uppercase">Credit limit</div>
                <div className="font-bold text-[13px]">{formatPoisha(data.creditLimitPoisha)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--muted-foreground)] uppercase">Payment terms</div>
                <div className="font-semibold">{String(data.paymentTerms || "—")}</div>
              </div>
            </div>
          </section>
          <form onSubmit={save} className="bg-white border rounded-xl p-4 space-y-3">
            <h2 className="text-[12px] font-bold">Edit profile</h2>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-[12px]"
              rows={3}
              placeholder="Billing address"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
            />
            <input
              className="w-full border rounded-lg px-3 py-2 text-[12px]"
              placeholder="Payment terms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
            <div>
              <div className="text-[11px] font-semibold mb-2">Preferred services</div>
              <div className="flex flex-wrap gap-2">
                {CORPORATE_SERVICE_TYPES.map((svc) => (
                  <label key={svc} className="flex items-center gap-1 text-[11px]">
                    <input type="checkbox" checked={preferredServices.includes(svc)} onChange={() => toggleService(svc)} />
                    {svc.replace("_", " ")}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg bg-teal-600 text-white text-[11px] font-bold w-fit disabled:opacity-50">
              Save changes
            </button>
          </form>
        </>
      )}
    </div>
  );
}
