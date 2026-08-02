import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";

export default function PortalVerifyPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await customerPortalApi.verifyEmail(email.trim(), code.trim());
      setOk("Email verified — you can sign in");
      setTimeout(() => nav("/portal/customer/login"), 800);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white border rounded-xl p-5 space-y-3">
        <h1 className="text-[16px] font-bold">Verify email</h1>
        <input className="w-full border rounded-lg px-3 py-2 text-[12px]" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="w-full border rounded-lg px-3 py-2 text-[12px]" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Verification code" />
        {error && <p className="text-red-600 text-[11px]">{error}</p>}
        {ok && <p className="text-emerald-700 text-[11px]">{ok}</p>}
        <button type="submit" className="w-full py-2 rounded-lg bg-amber-600 text-white text-[12px] font-bold">Verify</button>
        <Link className="text-[11px] text-[var(--accent)] underline" to="/portal/customer/login">Login</Link>
      </form>
    </div>
  );
}
