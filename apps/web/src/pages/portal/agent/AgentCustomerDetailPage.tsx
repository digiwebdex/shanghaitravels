import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { agentPortalApi } from "@/lib/agentPortalApi";
import { ApiError } from "@/lib/api";

export default function AgentCustomerDetailPage() {
  const { id = "" } = useParams();
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [passportNo, setPassportNo] = useState("");
  const [travellerName, setTravellerName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setData(await agentPortalApi.customer(id));
  }

  useEffect(() => {
    void agentPortalApi
      .customer(id)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, [id]);

  async function addPassport(e: FormEvent) {
    e.preventDefault();
    try {
      await agentPortalApi.upsertPassport(id, { passportNo, isPrimary: true });
      setPassportNo("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    }
  }

  async function addTraveller(e: FormEvent) {
    e.preventDefault();
    try {
      await agentPortalApi.addTraveller(id, { fullName: travellerName });
      setTravellerName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    }
  }

  return (
    <div className="p-5 max-w-3xl space-y-4">
      <Link className="text-[11px] text-[var(--accent)] underline" to="/portal/agent/customers">
        ← Customers
      </Link>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {data && (
        <>
          <h1 className="text-[16px] font-bold">{data.customer?.fullName}</h1>
          <p className="text-[12px] text-[var(--muted-foreground)]">
            {data.customer?.phone} · {data.customer?.email || "—"}
          </p>
          <section className="bg-white border rounded-xl p-4">
            <h2 className="text-[12px] font-bold mb-2">Passports</h2>
            <ul className="text-[11px] space-y-1 mb-2">
              {(data.passports || []).map((p: any) => (
                <li key={p.id}>
                  {p.passportNo} · {p.issuingCountry || "—"}
                </li>
              ))}
            </ul>
            <form onSubmit={addPassport} className="flex gap-2">
              <input className="border rounded px-2 py-1 text-[11px] flex-1" value={passportNo} onChange={(e) => setPassportNo(e.target.value)} placeholder="Passport no" />
              <button className="text-[11px] text-[var(--accent)] font-semibold">Add</button>
            </form>
          </section>
          <section className="bg-white border rounded-xl p-4">
            <h2 className="text-[12px] font-bold mb-2">Traveller profiles</h2>
            <ul className="text-[11px] space-y-1 mb-2">
              {(data.travellers || []).map((t: any) => (
                <li key={t.id}>
                  {t.fullName} · {t.passportNo || "—"}
                </li>
              ))}
            </ul>
            <form onSubmit={addTraveller} className="flex gap-2">
              <input className="border rounded px-2 py-1 text-[11px] flex-1" value={travellerName} onChange={(e) => setTravellerName(e.target.value)} placeholder="Traveller full name" />
              <button className="text-[11px] text-[var(--accent)] font-semibold">Add</button>
            </form>
          </section>
          <section className="bg-white border rounded-xl p-4">
            <h2 className="text-[12px] font-bold mb-2">Bookings</h2>
            <ul className="text-[11px] space-y-1">
              {(data.bookings || []).map((b: any) => (
                <li key={b.id}>
                  <Link className="text-[var(--accent)] underline" to={`/portal/agent/bookings/${b.id}`}>
                    {b.referenceNo}
                  </Link>{" "}
                  · {b.serviceType} · {b.status}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
