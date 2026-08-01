import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { agentPortalApi } from "@/lib/agentPortalApi";
import { ApiError } from "@/lib/api";
import { validateAgentLogin } from "@/lib/agentPortal";

export default function AgentLoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (otpMode) await agentPortalApi.verifyOtp(email.trim(), otp.trim());
      else {
        const bad = validateAgentLogin({ email, password });
        if (bad) {
          setError(bad);
          return;
        }
        await agentPortalApi.login(email.trim(), password);
      }
      nav("/portal/agent");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex bg-slate-900 text-white p-10 flex-col justify-between">
        <div>
          <p className="text-amber-300 text-[11px] tracking-[0.2em] uppercase font-semibold">Shanghai Travels</p>
          <h1 className="text-3xl font-bold mt-4 max-w-sm">B2B agent portal for bookings, commissions, and customers.</h1>
        </div>
        <p className="text-white/50 text-[12px]">Invitation-only access</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 bg-white border rounded-xl p-5">
          <h2 className="text-[16px] font-bold">Agent sign in</h2>
          <input className="w-full border rounded-lg px-3 py-2 text-[12px]" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {!otpMode ? (
            <input type="password" className="w-full border rounded-lg px-3 py-2 text-[12px]" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          ) : (
            <input className="w-full border rounded-lg px-3 py-2 text-[12px]" placeholder="OTP code" value={otp} onChange={(e) => setOtp(e.target.value)} />
          )}
          {error && <p className="text-red-600 text-[11px]">{error}</p>}
          {info && <p className="text-emerald-700 text-[11px]">{info}</p>}
          <button type="submit" className="w-full py-2 rounded-lg bg-amber-600 text-white text-[12px] font-bold">
            {otpMode ? "Verify OTP" : "Sign in"}
          </button>
          <button
            type="button"
            className="w-full text-[11px] text-amber-700 underline"
            onClick={() =>
              void agentPortalApi
                .requestOtp(email.trim())
                .then(() => {
                  setOtpMode(true);
                  setInfo("OTP sent if account exists");
                })
                .catch((err) => setError(err instanceof ApiError ? err.message : "OTP failed"))
            }
          >
            Use email OTP
          </button>
          <Link className="text-[11px] text-slate-500 underline" to="/portal/agent/forgot">
            Forgot password
          </Link>
        </form>
      </div>
    </div>
  );
}
