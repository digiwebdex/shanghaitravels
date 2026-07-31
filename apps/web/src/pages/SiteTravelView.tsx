import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { siteApi, type CmsTravelOffer } from "@/lib/services";
import { ApiError } from "@/lib/api";

export default function SiteTravelView() {
  const { serviceType = "", slug = "" } = useParams();
  const [offer, setOffer] = useState<CmsTravelOffer | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const rows = await siteApi.travel(serviceType);
        setOffer(rows.find((r) => r.slug === slug) || null);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Failed to load offer");
      }
    })();
  }, [serviceType, slug]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white px-4 py-3 flex justify-between items-center">
        <Link to="/site" className="font-bold text-[14px]">
          Shanghai Travels
        </Link>
        <Link to="/site/enquire" className="text-[12px] text-amber-300 font-semibold">
          Enquire
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        {error && <p className="text-red-600 text-[13px]">{error}</p>}
        {!error && !offer && <p className="text-slate-500 text-[13px]">Offer not found.</p>}
        {offer && (
          <>
            <p className="text-[11px] uppercase tracking-wide text-amber-700 font-semibold">{offer.serviceType}</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{offer.title}</h1>
            {offer.destination && <p className="text-[13px] text-slate-500 mt-2">{offer.destination}</p>}
            {offer.summary && <p className="mt-4 text-[14px] text-slate-700">{offer.summary}</p>}
            {offer.priceFromPoisha != null && (
              <p className="mt-4 text-[14px] font-semibold">
                From {(offer.priceFromPoisha / 100).toLocaleString()} {offer.currencyCode || "BDT"}
              </p>
            )}
            <Link
              to="/site/enquire"
              className="inline-block mt-6 px-4 py-2 rounded-lg bg-amber-600 text-white text-[12px] font-bold"
            >
              Request quote
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
