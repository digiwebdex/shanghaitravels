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
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-[var(--navy-700)] p-10 text-white md:flex">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--orange-300)]">
            Shanghai Travels
          </p>
          <h1 className="mt-4 max-w-sm text-3xl font-bold">
            B2B agent portal for bookings, commissions, and customers.
          </h1>
        </div>
        <p className="text-[12px] text-white/50">Invitation-only access · TravelOS</p>
      </div>
      <div className="flex items-center justify-center bg-[var(--background)] p-6">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]"
        >
          <h2 className="text-[16px] font-extrabold text-[var(--primary)]">Agent sign in</h2>
          <input
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-[12px]"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {!otpMode ? (
            <input
              type="password"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-[12px]"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          ) : (
            <input
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-[12px]"
              placeholder="OTP code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          )}
          {error && <p className="text-[11px] text-[var(--error)]">{error}</p>}
          {info && <p className="text-[11px] text-[var(--success)]">{info}</p>}
          <button
            type="submit"
            className="w-full rounded-xl py-2.5 text-[12px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
          >
            {otpMode ? "Verify OTP" : "Sign in"}
          </button>
          <button
            type="button"
            className="w-full text-[11px] text-[var(--accent)] underline"
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
          <Link className="text-[11px] text-[var(--muted-foreground)] underline" to="/portal/agent/forgot">
            Forgot password
          </Link>
        </form>
      </div>
    </div>
  );
}
