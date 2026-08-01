import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";
import { validatePortalRegister } from "@/lib/portal";

export default function PortalRegisterPage() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const bad = validatePortalRegister({ fullName, email, password });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      const r = await customerPortalApi.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      nav(`/portal/customer/verify?email=${encodeURIComponent(r.email)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h1 className="text-[16px] font-bold">Create customer account</h1>
        <input className="w-full border rounded-lg px-3 py-2 text-[12px]" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2 text-[12px]" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2 text-[12px]" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input type="password" className="w-full border rounded-lg px-3 py-2 text-[12px]" placeholder="Password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-red-600 text-[11px]">{error}</p>}
        <button type="submit" className="w-full py-2 rounded-lg bg-amber-600 text-white text-[12px] font-bold">Register</button>
        <Link className="text-[11px] text-amber-700 underline" to="/portal/customer/login">Back to login</Link>
      </form>
    </div>
  );
}
