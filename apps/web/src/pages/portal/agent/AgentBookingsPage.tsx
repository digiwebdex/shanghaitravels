import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router";
import { agentPortalApi } from "@/lib/agentPortalApi";
import { ApiError } from "@/lib/api";
import { AGENT_SERVICE_TYPES, validateAgentBooking } from "@/lib/agentPortal";

export default function AgentBookingsPage() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [serviceType, setServiceType] = useState("visa");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setRows(await agentPortalApi.cases());
  }

  useEffect(() => {
    void load().catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    const bad = validateAgentBooking({ serviceType, customerName, customerPhone });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      const r = await agentPortalApi.createCase({ serviceType, customerName, customerPhone, message });
      setOk(`Created ${r.reference}`);
      setCustomerName("");
      setCustomerPhone("");
      setMessage("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Bookings</h1>
      <p className="text-[11px] text-slate-500">Visa, air ticket, hotel, transport, tours, Hajj & Umrah — your cases only.</p>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {ok && <p className="text-emerald-700 text-[11px]">{ok}</p>}
      <form onSubmit={create} className="bg-white border rounded-xl p-4 grid md:grid-cols-2 gap-3">
        <select className="border rounded-lg px-3 py-2 text-[12px]" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
          {AGENT_SERVICE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input className="border rounded-lg px-3 py-2 text-[12px]" placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        <input className="border rounded-lg px-3 py-2 text-[12px]" placeholder="Customer phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
        <input className="border rounded-lg px-3 py-2 text-[12px]" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
        <button type="submit" className="px-3 py-2 rounded-lg bg-amber-600 text-white text-[11px] font-bold w-fit">
          Submit booking
        </button>
      </form>
      <table className="w-full text-[11px] bg-white border rounded-xl overflow-hidden">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="text-left p-2">Reference</th>
            <th className="text-left p-2">Service</th>
            <th className="text-left p-2">Customer</th>
            <th className="text-left p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.id)} className="border-t">
              <td className="p-2">
                <Link className="text-amber-700 underline font-semibold" to={`/portal/agent/bookings/${r.id}`}>
                  {String(r.referenceNo)}
                </Link>
              </td>
              <td className="p-2">{String(r.serviceType)}</td>
              <td className="p-2">{String(r.customer?.fullName || "—")}</td>
              <td className="p-2">{String(r.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
