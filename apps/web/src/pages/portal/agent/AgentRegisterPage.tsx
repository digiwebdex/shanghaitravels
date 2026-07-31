import { Link } from "react-router";

/**
 * Public entry landing for "Become an Agent".
 * Agent accounts remain invitation-only (staff CRM) — no self-signup API.
 * UI-only page so marketing Auth Entry can deep-link here.
 */
export default function AgentRegisterPage() {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex bg-slate-900 text-white p-10 flex-col justify-between">
        <div>
          <p className="text-amber-300 text-[11px] tracking-[0.2em] uppercase font-semibold">
            Shanghai Travels
          </p>
          <h1 className="text-3xl font-bold mt-4 max-w-sm">
            Partner with us as a B2B travel agent.
          </h1>
          <p className="text-white/60 text-sm mt-4 max-w-sm leading-relaxed">
            Agent portal access is provisioned by our partnership team after review —
            there is no open self-registration.
          </p>
        </div>
        <p className="text-white/50 text-[12px]">Invitation-only access</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 bg-white border rounded-xl p-6">
          <h2 className="text-[16px] font-bold text-slate-900">Become an Agent</h2>
          <p className="text-[12px] text-slate-600 leading-relaxed">
            Apply to become a Shanghai Travels partner. Our sales team creates agent
            accounts after onboarding — then you sign in with the invitation credentials.
          </p>
          <a
            href="/contact"
            className="flex w-full items-center justify-center py-2.5 rounded-lg bg-amber-600 text-white text-[12px] font-bold hover:bg-amber-700 transition-colors"
          >
            Contact Sales
          </a>
          <Link
            to="/portal/agent/login"
            className="flex w-full items-center justify-center py-2.5 rounded-lg border border-slate-200 text-slate-700 text-[12px] font-semibold hover:bg-slate-50 transition-colors"
          >
            Already invited? Sign in
          </Link>
          <p className="text-[11px] text-slate-400 text-center">
            No public agent registration form — accounts are created by staff only.
          </p>
        </div>
      </div>
    </div>
  );
}
