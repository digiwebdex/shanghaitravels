import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router";
import { agentPortalApi } from "@/lib/agentPortalApi";
import { ApiError } from "@/lib/api";
import { validateAgentCustomer } from "@/lib/agentPortal";

export default function AgentCustomersPage() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setRows(await agentPortalApi.customers());
  }

  useEffect(() => {
    void load().catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    const bad = validateAgentCustomer({ fullName, phone });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await agentPortalApi.createCustomer({ fullName, phone, email: email || undefined });
      setFullName("");
      setPhone("");
      setEmail("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Customers</h1>
      <p className="text-[11px] text-[var(--muted-foreground)]">Only customers linked to your bookings.</p>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      <form onSubmit={create} className="bg-white border rounded-xl p-4 grid md:grid-cols-3 gap-3">
        <input className="border rounded-lg px-3 py-2 text-[12px]" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="border rounded-lg px-3 py-2 text-[12px]" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="border rounded-lg px-3 py-2 text-[12px]" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" className="px-3 py-2 rounded-lg bg-amber-600 text-white text-[11px] font-bold w-fit">
          Add customer
        </button>
      </form>
      <ul className="bg-white border rounded-xl divide-y text-[11px]">
        {rows.map((r) => (
          <li key={String(r.id)} className="p-3 flex justify-between">
            <div>
              <Link className="font-semibold text-[var(--accent)] underline" to={`/portal/agent/customers/${r.id}`}>
                {String(r.fullName)}
              </Link>
              <div className="text-[var(--muted-foreground)]">
                {String(r.phone || "")} · {String(r.email || "")}
              </div>
            </div>
            <span className="text-[var(--muted-foreground)]">{String(r.code)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
