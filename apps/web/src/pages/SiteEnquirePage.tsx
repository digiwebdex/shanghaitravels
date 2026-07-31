import { FormEvent, useState } from "react";
import { Link } from "react-router";
import { siteApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { FORM_TYPES, validateSiteForm } from "@/lib/cms";

export default function SiteEnquirePage() {
  const [formType, setFormType] = useState("enquiry");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const bad = validateSiteForm({ formType, name, email, phone });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      const res = await siteApi.submitForm({
        formType,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        message,
        pageSlug: "enquire",
      });
      setOk(res.leadId ? `Submitted — CRM lead created (${res.leadId.slice(0, 8)}…)` : "Submitted — thank you");
      setName("");
      setMessage("");
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Submit failed");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white px-4 py-3 flex justify-between items-center">
        <Link to="/site" className="font-bold text-[14px]">
          Shanghai Travels
        </Link>
        <Link to="/site" className="text-[12px] text-white/70">
          Home
        </Link>
      </header>
      <main className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Enquiry</h1>
        <p className="text-[13px] text-slate-500 mt-1">Contact, quote, visa, tour, Hajj, or career application.</p>
        <form onSubmit={submit} className="mt-6 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Form type</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px]"
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
            >
              {FORM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Name</label>
            <input
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px]"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Phone</label>
              <input
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px]"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Email</label>
              <input
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Message</label>
            <textarea
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px]"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          {error && <p className="text-red-600 text-[11px]">{error}</p>}
          {ok && <p className="text-emerald-700 text-[11px]">{ok}</p>}
          <button type="submit" className="px-4 py-2 rounded-lg bg-amber-600 text-white text-[12px] font-bold">
            Submit
          </button>
        </form>
      </main>
    </div>
  );
}
