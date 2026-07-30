import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Eye, EyeOff, ArrowRight, Shield } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { authApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { ORG_NAME } from "@/config/env";
import { FullPageSpinner } from "@/components/FullPageSpinner";

/** Staff login — Figma portal Login visual language, staff-only (no register). */
export default function LoginPage() {
  const { status, refetch, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") return <FullPageSpinner />;
  if (status === "authed" && user) {
    if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
    return <Navigate to={returnTo} replace />;
  }

  const labelCls = "block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider";
  const inputCls =
    "w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const lr = await authApi.login(email.trim(), password);
      await refetch();
      if (lr.mustChangePassword) navigate("/change-password", { replace: true });
      else navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden" style={{ background: "#14213D" }}>
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 20%, rgba(249,115,22,0.35), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(245,158,11,0.2), transparent 45%)",
          }}
        />
        <div className="relative flex flex-col justify-between p-14 w-full">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-black">T</span>
            </div>
            <div>
              <p className="text-white font-bold">TravelOS</p>
              <p className="text-white/40 text-[11px]">{ORG_NAME}</p>
            </div>
          </div>
          <div>
            <h1 className="text-white text-4xl font-bold leading-tight mb-4">
              Staff ERP for
              <br />
              China visa operations.
            </h1>
            <p className="text-white/60 text-base leading-relaxed mb-10">
              Manage customers, passports, CVASC cases, documents, invoices, and delivery — one Application spine.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                ["7", "CVASC stages"],
                ["BDT", "Cash-basis"],
                ["RBAC", "Fail-closed"],
              ].map(([v, l]) => (
                <div key={l} className="bg-white/10 rounded-xl p-4 border border-white/15">
                  <p className="text-2xl font-bold text-white">{v}</p>
                  <p className="text-white/50 text-xs mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} {ORG_NAME} · Dhaka · Staff only</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="font-bold text-foreground">TravelOS ERP</span>
          </div>

          <h2 className="text-foreground text-xl font-bold mb-1">Welcome back</h2>
          <p className="text-muted-foreground text-sm mb-6">Sign in with your staff account to continue.</p>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className={labelCls} htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  className={inputCls}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-orange-600 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2 p-3 bg-muted rounded-xl">
            <Shield size={14} className="text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Sessions use httpOnly cookies. Tokens are never stored in the browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
