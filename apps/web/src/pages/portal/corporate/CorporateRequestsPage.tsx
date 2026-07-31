import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { ApiError } from "@/lib/api";
import { CORPORATE_SERVICE_TYPES, validateTravelRequest } from "@/lib/corporatePortal";

export default function CorporateRequestsPage() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [employees, setEmployees] = useState<Record<string, any>[]>([]);
  const [serviceType, setServiceType] = useState("visa");
  const [employeeId, setEmployeeId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    const [reqs, emps] = await Promise.all([corporatePortalApi.travelRequests(), corporatePortalApi.employees()]);
    setRows(reqs);
    setEmployees(emps);
    if (!employeeId && emps.length) setEmployeeId(String(emps[0].id));
  }

  useEffect(() => {
    void (async () => {
      try {
        const [reqs, emps] = await Promise.all([corporatePortalApi.travelRequests(), corporatePortalApi.employees()]);
        setRows(reqs);
        setEmployees(emps);
        if (emps.length) setEmployeeId((prev) => prev || String(emps[0].id));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Failed");
      }
    })();
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    const bad = validateTravelRequest({ serviceType, purpose, employeeId });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      const r = await corporatePortalApi.createTravelRequest({ serviceType, employeeId, purpose, notes });
      setOk(`Created ${r.reference || r.id}`);
      setPurpose("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function submit(id: string) {
    try {
      await corporatePortalApi.submitTravelRequest(id);
      setOk("Request submitted for approval");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Submit failed");
    }
  }

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Travel requests</h1>
      <p className="text-[11px] text-slate-500">Submit corporate travel requests for approval.</p>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {ok && <p className="text-emerald-700 text-[11px]">{ok}</p>}
      <form onSubmit={create} className="bg-white border rounded-xl p-4 grid md:grid-cols-2 gap-3">
        <select className="border rounded-lg px-3 py-2 text-[12px]" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
          {CORPORATE_SERVICE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
        <select className="border rounded-lg px-3 py-2 text-[12px]" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="">Select employee</option>
          {employees.map((e) => (
            <option key={String(e.id)} value={String(e.id)}>
              {String(e.fullName)}
            </option>
          ))}
        </select>
        <input className="border rounded-lg px-3 py-2 text-[12px]" placeholder="Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        <input className="border rounded-lg px-3 py-2 text-[12px]" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button type="submit" className="px-3 py-2 rounded-lg bg-teal-600 text-white text-[11px] font-bold w-fit">
          Create draft
        </button>
      </form>
      <table className="w-full text-[11px] bg-white border rounded-xl overflow-hidden">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="text-left p-2">Reference</th>
            <th className="text-left p-2">Service</th>
            <th className="text-left p-2">Employee</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.id)} className="border-t">
              <td className="p-2">
                <Link className="text-teal-700 underline font-semibold" to={`/portal/corporate/requests/${r.id}`}>
                  {String(r.referenceNo || r.reference || r.id)}
                </Link>
              </td>
              <td className="p-2">{String(r.serviceType)}</td>
              <td className="p-2">{String(r.employee?.fullName || r.employeeName || "—")}</td>
              <td className="p-2">{String(r.status)}</td>
              <td className="p-2">
                {r.status === "draft" && (
                  <button type="button" onClick={() => void submit(String(r.id))} className="text-teal-700 underline">
                    Submit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
