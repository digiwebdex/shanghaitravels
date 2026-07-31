import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";
import { PORTAL_SERVICE_TYPES, validateApplicationRequest } from "@/lib/portal";

export default function PortalApplicationsPage() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [serviceType, setServiceType] = useState("visa");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    try {
      setRows(await customerPortalApi.applications());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    const bad = validateApplicationRequest({ serviceType });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      const r = await customerPortalApi.createApplication({ serviceType, title, message });
      setOk(`Created ${r.referenceNo}`);
      setTitle("");
      setMessage("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Applications</h1>
      <p className="text-[11px] text-slate-500">Visa, air ticket, hotel, transport, tours, Hajj & Umrah.</p>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {ok && <p className="text-emerald-700 text-[11px]">{ok}</p>}
      <form onSubmit={create} className="bg-white border rounded-xl p-4 grid md:grid-cols-2 gap-3">
        <select className="border rounded-lg px-3 py-2 text-[12px]" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
          {PORTAL_SERVICE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input className="border rounded-lg px-3 py-2 text-[12px]" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="md:col-span-2 border rounded-lg px-3 py-2 text-[12px]" rows={2} placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
        <button type="submit" className="px-3 py-2 rounded-lg bg-amber-600 text-white text-[11px] font-bold w-fit">
          Submit request
        </button>
      </form>
      <table className="w-full text-[11px] bg-white border rounded-xl overflow-hidden">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="text-left p-2">Reference</th>
            <th className="text-left p-2">Service</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Stage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.id)} className="border-t">
              <td className="p-2">
                <Link className="text-amber-700 underline font-semibold" to={`/portal/customer/applications/${r.id}`}>
                  {String(r.referenceNo)}
                </Link>
              </td>
              <td className="p-2">{String(r.serviceType)}</td>
              <td className="p-2">{String(r.status)}</td>
              <td className="p-2">
                {String(r.currentStage)}/{String(r.totalStages)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
