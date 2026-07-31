import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { ApiError } from "@/lib/api";

export default function CorporateEmployeeDetailPage() {
  const { id = "" } = useParams();
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setData(await corporatePortalApi.employee(id));
  }

  useEffect(() => {
    void corporatePortalApi
      .employee(id)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, [id]);

  async function addEmergency(e: FormEvent) {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) {
      setError("Contact name and phone are required");
      return;
    }
    try {
      await corporatePortalApi.addEmergency(id, { contactName, contactPhone, relationship });
      setOk("Emergency contact saved");
      setContactName("");
      setContactPhone("");
      setRelationship("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    }
  }

  const emp = data?.employee ?? data;

  return (
    <div className="p-5 max-w-3xl space-y-4">
      <Link className="text-[11px] text-teal-700 underline" to="/portal/corporate/employees">
        ← Employees
      </Link>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {ok && <p className="text-emerald-700 text-[11px]">{ok}</p>}
      {emp && (
        <>
          <h1 className="text-[16px] font-bold">{String(emp.fullName)}</h1>
          <p className="text-[12px] text-slate-600">
            {String(emp.department || "—")} · {String(emp.designation || "—")} · {String(emp.phone || "—")}
          </p>
          <section className="bg-white border rounded-xl p-4 text-[11px]">
            <h2 className="text-[12px] font-bold mb-2">Passport</h2>
            <p>{String(emp.passportNo || "—")}</p>
          </section>
          <section className="bg-white border rounded-xl p-4">
            <h2 className="text-[12px] font-bold mb-2">Emergency contacts</h2>
            <ul className="text-[11px] space-y-1 mb-3">
              {(data?.emergencyContacts || emp.emergencyContacts || []).map((c: any) => (
                <li key={c.id}>
                  {c.contactName} · {c.contactPhone} · {c.relationship || "—"}
                </li>
              ))}
              {!data?.emergencyContacts?.length && !emp.emergencyContacts?.length && (
                <li className="text-slate-400">No emergency contacts</li>
              )}
            </ul>
            <form onSubmit={addEmergency} className="grid md:grid-cols-3 gap-2">
              <input className="border rounded px-2 py-1 text-[11px]" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact name" />
              <input className="border rounded px-2 py-1 text-[11px]" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Phone" />
              <input className="border rounded px-2 py-1 text-[11px]" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Relationship" />
              <button type="submit" className="text-[11px] text-teal-700 font-semibold w-fit">
                Add contact
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
