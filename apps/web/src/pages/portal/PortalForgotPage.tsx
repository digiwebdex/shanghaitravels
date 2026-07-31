import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";

export default function PortalForgotPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function request(e: FormEvent) {
    e.preventDefault();
    try {
      const r = await customerPortalApi.forgot(email.trim());
      setInfo(r.devCode ? `Reset code (dev): ${r.devCode}` : "If the account exists, a reset code was sent");
      if (r.devCode) setCode(r.devCode);
      setStep("reset");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed");
    }
  }

  async function reset(e: FormEvent) {
    e.preventDefault();
    try {
      await customerPortalApi.reset(email.trim(), code.trim(), password);
      nav("/portal/customer/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form onSubmit={step === "request" ? request : reset} className="w-full max-w-sm bg-white border rounded-xl p-5 space-y-3">
        <h1 className="text-[16px] font-bold">Password reset</h1>
        <input className="w-full border rounded-lg px-3 py-2 text-[12px]" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        {step === "reset" && (
          <>
            <input className="w-full border rounded-lg px-3 py-2 text-[12px]" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Reset code" />
            <input type="password" className="w-full border rounded-lg px-3 py-2 text-[12px]" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
          </>
        )}
        {error && <p className="text-red-600 text-[11px]">{error}</p>}
        {info && <p className="text-emerald-700 text-[11px]">{info}</p>}
        <button type="submit" className="w-full py-2 rounded-lg bg-amber-600 text-white text-[12px] font-bold">
          {step === "request" ? "Send code" : "Reset password"}
        </button>
        <Link className="text-[11px] text-amber-700 underline" to="/portal/customer/login">Login</Link>
      </form>
    </div>
  );
}
