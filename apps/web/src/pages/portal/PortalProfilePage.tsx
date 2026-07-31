import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";

export default function PortalProfilePage() {
  const [me, setMe] = useState<any>(null);
  const [passports, setPassports] = useState<any[]>([]);
  const [family, setFamily] = useState<any[]>([]);
  const [travellers, setTravellers] = useState<any[]>([]);
  const [emergency, setEmergency] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [famName, setFamName] = useState("");
  const [travName, setTravName] = useState("");
  const [emName, setEmName] = useState("");
  const [emPhone, setEmPhone] = useState("");

  async function load() {
    const [m, p, f, t, e] = await Promise.all([
      customerPortalApi.me(),
      customerPortalApi.passports(),
      customerPortalApi.family(),
      customerPortalApi.travellers(),
      customerPortalApi.emergency(),
    ]);
    setMe(m);
    setFullName(String(m.customer?.fullName || ""));
    setPhone(String(m.customer?.phone || ""));
    setPassports(p);
    setFamily(f);
    setTravellers(t);
    setEmergency(e);
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
  }, []);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    try {
      await customerPortalApi.updateProfile({ fullName, phone });
      setOk("Profile updated");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Profile</h1>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {ok && <p className="text-emerald-700 text-[11px]">{ok}</p>}
      {me && (
        <form onSubmit={saveProfile} className="bg-white border rounded-xl p-4 grid md:grid-cols-2 gap-3">
          <input className="border rounded-lg px-3 py-2 text-[12px]" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
          <input className="border rounded-lg px-3 py-2 text-[12px]" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
          <button type="submit" className="px-3 py-2 rounded-lg bg-amber-600 text-white text-[11px] font-bold w-fit">
            Save profile
          </button>
        </form>
      )}
      <div className="grid md:grid-cols-2 gap-3">
        <Card title="Passports" items={passports.map((p) => `${p.passportNo} (${p.issuingCountry || "—"})`)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void customerPortalApi
                .upsertPassport({ passportNo })
                .then(() => {
                  setPassportNo("");
                  return load();
                })
                .catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
            }}
            className="flex gap-2 mt-2"
          >
            <input className="border rounded px-2 py-1 text-[11px] flex-1" value={passportNo} onChange={(e) => setPassportNo(e.target.value)} placeholder="Passport no" />
            <button className="text-[11px] text-amber-700 font-semibold">Add</button>
          </form>
        </Card>
        <Card title="Family members" items={family.map((f) => `${f.fullName}${f.relationship ? " · " + f.relationship : ""}`)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void customerPortalApi
                .addFamily({ fullName: famName })
                .then(() => {
                  setFamName("");
                  return load();
                })
                .catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
            }}
            className="flex gap-2 mt-2"
          >
            <input className="border rounded px-2 py-1 text-[11px] flex-1" value={famName} onChange={(e) => setFamName(e.target.value)} placeholder="Name" />
            <button className="text-[11px] text-amber-700 font-semibold">Add</button>
          </form>
        </Card>
        <Card title="Saved travellers" items={travellers.map((t) => t.fullName)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void customerPortalApi
                .addTraveller({ fullName: travName })
                .then(() => {
                  setTravName("");
                  return load();
                })
                .catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
            }}
            className="flex gap-2 mt-2"
          >
            <input className="border rounded px-2 py-1 text-[11px] flex-1" value={travName} onChange={(e) => setTravName(e.target.value)} placeholder="Name" />
            <button className="text-[11px] text-amber-700 font-semibold">Add</button>
          </form>
        </Card>
        <Card title="Emergency contacts" items={emergency.map((e) => `${e.fullName} · ${e.phone}`)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void customerPortalApi
                .addEmergency({ fullName: emName, phone: emPhone })
                .then(() => {
                  setEmName("");
                  setEmPhone("");
                  return load();
                })
                .catch((err) => setError(err instanceof ApiError ? err.message : "Failed"));
            }}
            className="flex gap-2 mt-2"
          >
            <input className="border rounded px-2 py-1 text-[11px] flex-1" value={emName} onChange={(e) => setEmName(e.target.value)} placeholder="Name" />
            <input className="border rounded px-2 py-1 text-[11px] flex-1" value={emPhone} onChange={(e) => setEmPhone(e.target.value)} placeholder="Phone" />
            <button className="text-[11px] text-amber-700 font-semibold">Add</button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, items, children }: { title: string; items: string[]; children?: ReactNode }) {
  return (
    <section className="bg-white border rounded-xl p-4">
      <h2 className="text-[12px] font-bold mb-2">{title}</h2>
      <ul className="text-[11px] space-y-1">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
        {!items.length && <li className="text-slate-400">None yet</li>}
      </ul>
      {children}
    </section>
  );
}
