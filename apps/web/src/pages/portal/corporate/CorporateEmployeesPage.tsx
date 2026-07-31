import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { ApiError } from "@/lib/api";
import { validateEmployee } from "@/lib/corporatePortal";

export default function CorporateEmployeesPage() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setRows(await corporatePortalApi.employees());
  }

  useEffect(() => {
    void load().catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    const bad = validateEmployee({ fullName, phone, department, designation, passportNo });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await corporatePortalApi.createEmployee({ fullName, phone, department, designation, passportNo });
      setOk("Employee added");
      setFullName("");
      setPhone("");
      setDepartment("");
      setDesignation("");
      setPassportNo("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Employees</h1>
      <p className="text-[11px] text-slate-500">Corporate employee directory for travel requests.</p>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {ok && <p className="text-emerald-700 text-[11px]">{ok}</p>}
      <form onSubmit={create} className="bg-white border rounded-xl p-4 grid md:grid-cols-3 gap-3">
        <input className="border rounded-lg px-3 py-2 text-[12px]" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="border rounded-lg px-3 py-2 text-[12px]" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="border rounded-lg px-3 py-2 text-[12px]" placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
        <input className="border rounded-lg px-3 py-2 text-[12px]" placeholder="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
        <input className="border rounded-lg px-3 py-2 text-[12px]" placeholder="Passport no" value={passportNo} onChange={(e) => setPassportNo(e.target.value)} />
        <button type="submit" className="px-3 py-2 rounded-lg bg-teal-600 text-white text-[11px] font-bold w-fit">
          Add employee
        </button>
      </form>
      <ul className="bg-white border rounded-xl divide-y text-[11px]">
        {rows.map((r) => (
          <li key={String(r.id)} className="p-3 flex justify-between">
            <div>
              <Link className="font-semibold text-teal-700 underline" to={`/portal/corporate/employees/${r.id}`}>
                {String(r.fullName)}
              </Link>
              <div className="text-slate-500">
                {String(r.department || "")} · {String(r.designation || "")} · {String(r.phone || "")}
              </div>
            </div>
            <span className="text-slate-400">{String(r.passportNo || "—")}</span>
          </li>
        ))}
        {!rows.length && <li className="p-3 text-slate-400">No employees yet</li>}
      </ul>
    </div>
  );
}
