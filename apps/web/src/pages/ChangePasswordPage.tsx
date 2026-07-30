import { FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/auth/AuthProvider";
import { authApi } from "@/lib/services";
import { ApiError } from "@/lib/api";

export default function ChangePasswordPage() {
  const { refetch, user } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const labelCls = "block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider";
  const inputCls =
    "w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      await refetch();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] px-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-[18px] font-bold text-slate-800 mb-1">Change password</h1>
        <p className="text-[11px] text-slate-500 mb-5">
          {user?.mustChangePassword
            ? "You must set a new password before continuing."
            : "Update your staff account password."}
        </p>
        {error && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[11px] font-semibold" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className={labelCls} htmlFor="cur">
              Current password
            </label>
            <input
              id="cur"
              type="password"
              autoComplete="current-password"
              className={inputCls}
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="neu">
              New password (min 8)
            </label>
            <input
              id="neu"
              type="password"
              autoComplete="new-password"
              className={inputCls}
              value={newPassword}
              onChange={(e) => setNew(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-[12px] font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
          >
            {loading ? "Saving…" : "Save password"}
          </button>
        </form>
      </div>
    </div>
  );
}
