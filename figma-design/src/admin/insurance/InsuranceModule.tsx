import { useState } from "react";
import {
  Shield, Plus, Search, Filter, FileText, CheckCircle2, Clock,
  XCircle, AlertTriangle, TrendingUp, Users, DollarSign, RefreshCw,
  Star, Phone, Mail, Globe, ChevronRight, ChevronDown, Eye,
} from "lucide-react";
import {
  TRAVEL_POLICIES, MEDICAL_POLICIES, INSURANCE_CLAIMS, INSURANCE_PROVIDERS,
  TravelPolicy, MedicalPolicy, InsuranceClaim, InsuranceProvider,
  PolicyStatus, ClaimStatus, fmtAED,
} from "./data";

type InsTab =
  | "travel_policy" | "medical_policy" | "policies"
  | "claims" | "providers" | "renewals" | "reports";

const TABS: { key: InsTab; label: string }[] = [
  { key: "travel_policy",  label: "Travel Policy Issuer" },
  { key: "medical_policy", label: "Medical Policy Issuer" },
  { key: "policies",       label: "Policy Management" },
  { key: "claims",         label: "Claims Tracker" },
  { key: "providers",      label: "Providers" },
  { key: "renewals",       label: "Renewal Reminders" },
  { key: "reports",        label: "Reports" },
];

const POLICY_STATUS_CFG: Record<PolicyStatus, { label: string; bg: string; text: string }> = {
  active:        { label: "Active",        bg: "bg-emerald-500/20", text: "text-emerald-400" },
  expiring_soon: { label: "Expiring Soon", bg: "bg-amber-500/20",   text: "text-amber-400"   },
  expired:       { label: "Expired",       bg: "bg-red-500/20",     text: "text-red-400"     },
  cancelled:     { label: "Cancelled",     bg: "bg-zinc-600/40",    text: "text-zinc-400"    },
  pending:       { label: "Pending",       bg: "bg-blue-500/20",    text: "text-blue-400"    },
};

const CLAIM_STATUS_CFG: Record<ClaimStatus, { label: string; bg: string; text: string; icon: typeof CheckCircle2 }> = {
  submitted:    { label: "Submitted",    bg: "bg-blue-500/20",    text: "text-blue-400",    icon: Clock         },
  under_review: { label: "Under Review", bg: "bg-amber-500/20",   text: "text-amber-400",   icon: Clock         },
  approved:     { label: "Approved",     bg: "bg-emerald-500/20", text: "text-emerald-400", icon: CheckCircle2  },
  settled:      { label: "Settled",      bg: "bg-emerald-600/20", text: "text-emerald-300", icon: CheckCircle2  },
  rejected:     { label: "Rejected",     bg: "bg-red-500/20",     text: "text-red-400",     icon: XCircle       },
  closed:       { label: "Closed",       bg: "bg-zinc-600/40",    text: "text-zinc-400",    icon: CheckCircle2  },
};

function PolicyBadge({ status }: { status: PolicyStatus }) {
  const cfg = POLICY_STATUS_CFG[status];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function ClaimBadge({ status }: { status: ClaimStatus }) {
  const cfg = CLAIM_STATUS_CFG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// ── Travel Policy Issuer ───────────────────────────────────────────────────────
function TravelPolicyTab() {
  const [step, setStep] = useState<"form" | "preview">("form");
  const [form, setForm] = useState({
    insuredName: "", nationality: "", passportNo: "",
    destination: "", departure: "", returnDate: "",
    coverageType: "standard", pax: "1",
    providerId: "ip1",
  });

  const providerOpts = INSURANCE_PROVIDERS.filter(p => p.types.includes("travel"));
  const premiumMap: Record<string, number> = { basic: 150, standard: 280, premium: 420, group: 140 };
  const pax = parseInt(form.pax) || 1;
  const premium = premiumMap[form.coverageType] * pax;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex gap-3 mb-6">
        {["form", "preview"].map((s, i) => (
          <button key={s} onClick={() => setStep(s as typeof step)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${step === s ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold
              ${step === s ? "bg-black/20" : "bg-zinc-700"}`}>{i + 1}</span>
            {s === "form" ? "Policy Details" : "Preview & Issue"}
          </button>
        ))}
      </div>

      {step === "form" ? (
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Insured Information</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Full Name", key: "insuredName", placeholder: "As per passport" },
                { label: "Nationality", key: "nationality", placeholder: "e.g. British" },
                { label: "Passport No.", key: "passportNo", placeholder: "e.g. GB-P1234567" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-zinc-500 mb-1">{f.label}</label>
                  <input value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Trip Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Destination(s)</label>
                <input value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))}
                  placeholder="e.g. France, Italy"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Departure</label>
                  <input type="date" value={form.departure} onChange={e => setForm(p => ({ ...p, departure: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Return</label>
                  <input type="date" value={form.returnDate} onChange={e => setForm(p => ({ ...p, returnDate: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">No. of Passengers</label>
                <input type="number" min="1" value={form.pax} onChange={e => setForm(p => ({ ...p, pax: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Coverage & Provider</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Coverage Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: "basic", label: "Basic", sub: "USD 50K limit" },
                    { val: "standard", label: "Standard", sub: "USD 150K limit" },
                    { val: "premium", label: "Premium", sub: "USD 250K limit" },
                    { val: "group", label: "Group", sub: "USD 100K / pax" },
                  ].map(o => (
                    <button key={o.val} onClick={() => setForm(p => ({ ...p, coverageType: o.val }))}
                      className={`p-3 rounded-lg border text-left transition-colors ${form.coverageType === o.val
                        ? "border-amber-500 bg-amber-500/10" : "border-zinc-700 hover:border-zinc-600"}`}>
                      <div className="text-sm font-medium text-zinc-200">{o.label}</div>
                      <div className="text-xs text-zinc-500">{o.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Insurance Provider</label>
                <select value={form.providerId} onChange={e => setForm(p => ({ ...p, providerId: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500">
                  {providerOpts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="col-span-2 bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-500">Estimated Premium</div>
              <div className="text-2xl font-bold text-amber-400">{fmtAED(premium)}</div>
              <div className="text-xs text-zinc-500">{pax} pax × {fmtAED(premiumMap[form.coverageType])}</div>
            </div>
            <button onClick={() => setStep("preview")}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-lg flex items-center gap-2">
              Preview Policy <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            {/* Policy preview card */}
            <div className="rounded-xl overflow-hidden border border-zinc-700">
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xs text-blue-300 uppercase tracking-widest">Travel Insurance Policy</div>
                    <div className="text-2xl font-bold text-white mt-1">DRAFT — PENDING ISSUE</div>
                  </div>
                  <Shield size={40} className="text-blue-300 opacity-50" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-blue-300 text-xs">Insured</div>
                    <div className="text-white font-medium">{form.insuredName || "—"}</div>
                  </div>
                  <div>
                    <div className="text-blue-300 text-xs">Passport</div>
                    <div className="text-white font-medium">{form.passportNo || "—"}</div>
                  </div>
                  <div>
                    <div className="text-blue-300 text-xs">Destination</div>
                    <div className="text-white font-medium">{form.destination || "—"}</div>
                  </div>
                  <div>
                    <div className="text-blue-300 text-xs">Coverage</div>
                    <div className="text-white font-medium capitalize">{form.coverageType}</div>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-900 p-6">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-zinc-500 text-xs">Departure</div>
                    <div className="text-zinc-200">{form.departure || "—"}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-xs">Return</div>
                    <div className="text-zinc-200">{form.returnDate || "—"}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 text-xs">Passengers</div>
                    <div className="text-zinc-200">{form.pax}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between">
                  <div className="text-zinc-500 text-sm">Total Premium</div>
                  <div className="text-amber-400 font-bold text-lg">{fmtAED(premium)}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-lg">
              Issue Policy
            </button>
            <button onClick={() => setStep("form")}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-3 rounded-lg">
              ← Back to Form
            </button>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500 space-y-2">
              <div className="font-semibold text-zinc-400">Before issuing:</div>
              <div>• Collect payment from customer</div>
              <div>• Verify passport scan</div>
              <div>• Confirm travel dates</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Medical Policy Issuer ──────────────────────────────────────────────────────
function MedicalPolicyTab() {
  const [step, setStep] = useState<"form" | "preview">("form");
  const [form, setForm] = useState({
    insuredName: "", dob: "", nationality: "",
    employerName: "", plan: "enhanced",
    pax: "1", providerId: "ip4",
    inPatient: true, outPatient: true, dental: false, maternity: false,
    networkType: "regional",
    startDate: "",
  });

  const providerOpts = INSURANCE_PROVIDERS.filter(p => p.types.includes("medical"));
  const planPremium: Record<string, number> = { basic: 3200, enhanced: 7800, comprehensive: 12000, family: 18000 };
  const pax = parseInt(form.pax) || 1;
  const annual = planPremium[form.plan] * pax;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex gap-3 mb-6">
        {["form", "preview"].map((s, i) => (
          <button key={s} onClick={() => setStep(s as typeof step)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${step === s ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold
              ${step === s ? "bg-black/20" : "bg-zinc-700"}`}>{i + 1}</span>
            {s === "form" ? "Policy Details" : "Preview & Issue"}
          </button>
        ))}
      </div>

      {step === "form" ? (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Member Information</h3>
            <div className="space-y-3">
              {[
                { label: "Full Name / Group Name", key: "insuredName", placeholder: "Individual or company group" },
                { label: "Date of Birth", key: "dob", type: "date" },
                { label: "Nationality", key: "nationality", placeholder: "e.g. Emirati" },
                { label: "Employer (optional)", key: "employerName", placeholder: "Company name" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-zinc-500 mb-1">{f.label}</label>
                  <input type={f.type || "text"} value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={(f as any).placeholder || ""}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs text-zinc-500 mb-1">No. of Members</label>
                <input type="number" min="1" value={form.pax}
                  onChange={e => setForm(p => ({ ...p, pax: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Plan Type</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: "basic", label: "Basic", sub: "AED 100K limit" },
                  { val: "enhanced", label: "Enhanced", sub: "AED 300K limit" },
                  { val: "comprehensive", label: "Comprehensive", sub: "AED 500K limit" },
                  { val: "family", label: "Family", sub: "AED 500K family" },
                ].map(o => (
                  <button key={o.val} onClick={() => setForm(p => ({ ...p, plan: o.val }))}
                    className={`p-3 rounded-lg border text-left transition-colors ${form.plan === o.val
                      ? "border-amber-500 bg-amber-500/10" : "border-zinc-700 hover:border-zinc-600"}`}>
                    <div className="text-sm font-medium text-zinc-200">{o.label}</div>
                    <div className="text-xs text-zinc-500">{o.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Benefits Included</h3>
              <div className="grid grid-cols-2 gap-2">
                {(["inPatient", "outPatient", "dental", "maternity"] as const).map(b => (
                  <label key={b} className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form[b]}
                      onChange={e => setForm(p => ({ ...p, [b]: e.target.checked }))}
                      className="accent-amber-500" />
                    <span className="text-sm text-zinc-300 capitalize">{b.replace(/([A-Z])/g, " $1").trim()}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-xs text-zinc-500 mb-1">Network Type</label>
                <select value={form.networkType} onChange={e => setForm(p => ({ ...p, networkType: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500">
                  <option value="local">Local (UAE only)</option>
                  <option value="regional">Regional (GCC + Middle East)</option>
                  <option value="international">International (Worldwide)</option>
                </select>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-zinc-500 mb-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
              </div>
              <div className="mt-3">
                <label className="block text-xs text-zinc-500 mb-1">Provider</label>
                <select value={form.providerId} onChange={e => setForm(p => ({ ...p, providerId: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500">
                  {providerOpts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-zinc-500">Annual Premium</div>
                <div className="text-2xl font-bold text-amber-400">{fmtAED(annual)}</div>
                <div className="text-xs text-zinc-500">{pax} member{pax > 1 ? "s" : ""} × {fmtAED(planPremium[form.plan])}</div>
              </div>
              <button onClick={() => setStep("preview")}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm">
                Preview <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="rounded-xl overflow-hidden border border-zinc-700">
              <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-800 p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-xs text-emerald-300 uppercase tracking-widest">Medical Insurance Policy</div>
                    <div className="text-2xl font-bold text-white mt-1">DRAFT — PENDING ISSUE</div>
                  </div>
                  <Shield size={40} className="text-emerald-300 opacity-50" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><div className="text-emerald-300 text-xs">Insured / Group</div><div className="text-white font-medium">{form.insuredName || "—"}</div></div>
                  <div><div className="text-emerald-300 text-xs">Plan</div><div className="text-white font-medium capitalize">{form.plan}</div></div>
                  <div><div className="text-emerald-300 text-xs">Network</div><div className="text-white font-medium capitalize">{form.networkType}</div></div>
                  <div><div className="text-emerald-300 text-xs">Members</div><div className="text-white font-medium">{form.pax}</div></div>
                </div>
              </div>
              <div className="bg-zinc-900 p-6">
                <div className="text-xs text-zinc-500 mb-3">Benefits</div>
                <div className="flex gap-2 flex-wrap">
                  {(["inPatient", "outPatient", "dental", "maternity"] as const).filter(b => form[b]).map(b => (
                    <span key={b} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full capitalize">
                      {b.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between">
                  <div className="text-zinc-500 text-sm">Annual Premium</div>
                  <div className="text-amber-400 font-bold text-lg">{fmtAED(annual)}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 rounded-lg">Issue Policy</button>
            <button onClick={() => setStep("form")} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-3 rounded-lg">← Back</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Policy Management ──────────────────────────────────────────────────────────
function PoliciesTab() {
  const [filter, setFilter] = useState<"all" | "active" | "expiring_soon" | "expired">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "travel" | "medical">("all");

  const allPolicies = [
    ...TRAVEL_POLICIES.map(p => ({ ...p, policyType: "travel" as const })),
    ...MEDICAL_POLICIES.map(p => ({ ...p, policyType: "medical" as const })),
  ];
  const filtered = allPolicies.filter(p =>
    (filter === "all" || p.status === filter) &&
    (typeFilter === "all" || p.policyType === typeFilter)
  );

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex rounded-lg overflow-hidden border border-zinc-700">
          {(["all", "active", "expiring_soon", "expired"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
              {f === "all" ? "All" : f === "expiring_soon" ? "Expiring Soon" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg overflow-hidden border border-zinc-700">
          {(["all", "travel", "medical"] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${typeFilter === t ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
              {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-zinc-500">{filtered.length} policies</div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left">
              {["Ref", "Type", "Insured", "Provider", "Premium", "Expiry", "Status", ""].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                <td className="px-4 py-3 font-mono text-xs text-amber-400">{p.ref}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.policyType === "travel" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                    {p.policyType}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-200">{p.insuredName}</td>
                <td className="px-4 py-3 text-zinc-400">{p.providerName}</td>
                <td className="px-4 py-3 text-zinc-200 font-medium">
                  {fmtAED(p.policyType === "travel" ? (p as TravelPolicy).premiumAED : (p as MedicalPolicy).annualPremiumAED)}
                </td>
                <td className="px-4 py-3 text-zinc-400">{p.expiryDate}</td>
                <td className="px-4 py-3"><PolicyBadge status={p.status} /></td>
                <td className="px-4 py-3">
                  <button className="text-xs text-zinc-500 hover:text-amber-400 transition-colors flex items-center gap-1">
                    <Eye size={12} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Claims Tracker ─────────────────────────────────────────────────────────────
function ClaimsTab() {
  const [selected, setSelected] = useState<InsuranceClaim | null>(null);

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input placeholder="Search claims..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Ref", "Policy", "Type", "Insured", "Claim Amount", "Approved", "Status", "Assigned To"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INSURANCE_CLAIMS.map((c, i) => (
                <tr key={c.id} onClick={() => setSelected(c)}
                  className={`border-b border-zinc-800/60 cursor-pointer transition-colors hover:bg-zinc-800/40
                    ${selected?.id === c.id ? "bg-amber-500/5 border-l-2 border-l-amber-500" : i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">{c.ref}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{c.policyRef}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.policyType === "travel" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                      {c.policyType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-200">{c.insuredName}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{fmtAED(c.claimAmountAED)}</td>
                  <td className="px-4 py-3 text-zinc-400">{c.approvedAmountAED ? fmtAED(c.approvedAmountAED) : "—"}</td>
                  <td className="px-4 py-3"><ClaimBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{c.assignedTo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-80 flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-sm text-amber-400">{selected.ref}</div>
              <div className="text-lg font-bold text-zinc-100 mt-0.5">{selected.insuredName}</div>
            </div>
            <ClaimBadge status={selected.status} />
          </div>
          <div className="text-sm text-zinc-400 bg-zinc-800 rounded-lg p-3">{selected.description}</div>
          <div className="space-y-2 text-sm">
            {[
              ["Policy Ref", selected.policyRef],
              ["Provider", selected.providerName],
              ["Incident Date", selected.incidentDate],
              ["Submitted", selected.submittedAt],
              ["Claim Amount", fmtAED(selected.claimAmountAED)],
              ["Approved Amount", selected.approvedAmountAED ? fmtAED(selected.approvedAmountAED) : "Pending"],
              ["Settled", selected.settledAt ?? "—"],
              ["Assigned To", selected.assignedTo],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-zinc-500">{k}</span>
                <span className="text-zinc-200 text-right max-w-[60%]">{v}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-2">Documents</div>
            <div className="space-y-1">
              {selected.documents.map(d => (
                <div key={d} className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-800 px-3 py-1.5 rounded-lg">
                  <FileText size={11} className="text-zinc-500" /> {d}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold py-2 rounded-lg">Update Status</button>
            <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium py-2 rounded-lg">Add Note</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Providers ──────────────────────────────────────────────────────────────────
function ProvidersTab() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 gap-4">
        {INSURANCE_PROVIDERS.map(p => (
          <div key={p.id} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex items-center gap-6 hover:border-zinc-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
              <Shield size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <div className="font-semibold text-zinc-100">{p.name}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                  {p.status}
                </span>
                {p.types.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 capitalize">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>{p.country}</span>
                <span className="flex items-center gap-1"><Phone size={10} /> {p.contactPhone}</span>
                <span className="flex items-center gap-1"><Mail size={10} /> {p.contactEmail}</span>
              </div>
            </div>
            <div className="flex gap-8 text-center flex-shrink-0">
              <div>
                <div className="text-lg font-bold text-zinc-100">{p.activePolicies}</div>
                <div className="text-xs text-zinc-500">Active Policies</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-400">{p.commissionPct}%</div>
                <div className="text-xs text-zinc-500">Commission</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-lg font-bold text-emerald-400">
                  <Star size={14} className="fill-emerald-400" /> {p.rating}
                </div>
                <div className="text-xs text-zinc-500">Rating</div>
              </div>
            </div>
            <button className="flex-shrink-0 text-xs text-zinc-500 hover:text-amber-400 flex items-center gap-1 transition-colors">
              <Eye size={12} /> View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Renewal Reminders ──────────────────────────────────────────────────────────
function RenewalsTab() {
  const allPolicies = [
    ...TRAVEL_POLICIES.map(p => ({
      id: p.id, ref: p.ref, insuredName: p.insuredName, policyType: "travel" as const,
      expiryDate: p.expiryDate, providerName: p.providerName, status: p.status,
    })),
    ...MEDICAL_POLICIES.map(p => ({
      id: p.id, ref: p.ref, insuredName: p.insuredName, policyType: "medical" as const,
      expiryDate: p.expiryDate, providerName: p.providerName, status: p.status,
    })),
  ];

  const expiring = allPolicies.filter(p => p.status === "expiring_soon" || p.status === "active");

  return (
    <div className="p-6">
      <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
        <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
        <p className="text-sm text-amber-300">
          {expiring.filter(p => p.status === "expiring_soon").length} policies expiring within 30 days. Review and contact clients for renewal.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Ref", "Type", "Insured", "Provider", "Expiry", "Status", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expiring.map((p, i) => (
              <tr key={p.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                <td className="px-4 py-3 font-mono text-xs text-amber-400">{p.ref}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.policyType === "travel" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                    {p.policyType}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-200">{p.insuredName}</td>
                <td className="px-4 py-3 text-zinc-400">{p.providerName}</td>
                <td className="px-4 py-3 text-zinc-300 font-medium">{p.expiryDate}</td>
                <td className="px-4 py-3"><PolicyBadge status={p.status} /></td>
                <td className="px-4 py-3">
                  <button className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg hover:bg-amber-500/30 transition-colors">
                    Send Reminder
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────
function InsuranceReportsTab() {
  const totalPremium = TRAVEL_POLICIES.reduce((a, p) => a + p.premiumAED, 0)
    + MEDICAL_POLICIES.reduce((a, p) => a + p.annualPremiumAED, 0);
  const totalClaims = INSURANCE_CLAIMS.reduce((a, c) => a + c.claimAmountAED, 0);
  const approved = INSURANCE_CLAIMS.filter(c => c.approvedAmountAED).reduce((a, c) => a + (c.approvedAmountAED ?? 0), 0);
  const totalPolicies = TRAVEL_POLICIES.length + MEDICAL_POLICIES.length;

  const kpis = [
    { label: "Total Policies", value: totalPolicies.toString(), icon: FileText, color: "text-blue-400" },
    { label: "Gross Premium", value: fmtAED(totalPremium), icon: DollarSign, color: "text-emerald-400" },
    { label: "Claims Submitted", value: fmtAED(totalClaims), icon: AlertTriangle, color: "text-amber-400" },
    { label: "Claims Approved", value: fmtAED(approved), icon: CheckCircle2, color: "text-emerald-400" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-500">{k.label}</span>
                <Icon size={16} className={k.color} />
              </div>
              <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">Claims by Status</h3>
        <div className="space-y-3">
          {(["submitted","under_review","approved","settled","rejected"] as ClaimStatus[]).map(s => {
            const count = INSURANCE_CLAIMS.filter(c => c.status === s).length;
            const pct = Math.round((count / INSURANCE_CLAIMS.length) * 100);
            const cfg = CLAIM_STATUS_CFG[s];
            return (
              <div key={s} className="flex items-center gap-3">
                <div className="w-28 text-xs text-zinc-400 capitalize">{cfg.label}</div>
                <div className="flex-1 bg-zinc-800 rounded-full h-2">
                  <div className={`h-2 rounded-full ${cfg.bg.replace("/20","/60")}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="w-6 text-xs text-zinc-500 text-right">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">Provider Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-800">
              {["Provider","Active Policies","Commission %","Rating"].map(h => (
                <th key={h} className="pb-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {INSURANCE_PROVIDERS.map(p => (
                <tr key={p.id} className="border-b border-zinc-800/40">
                  <td className="py-3 text-zinc-200">{p.name}</td>
                  <td className="py-3 text-zinc-400">{p.activePolicies}</td>
                  <td className="py-3 text-amber-400 font-medium">{p.commissionPct}%</td>
                  <td className="py-3 text-emerald-400 flex items-center gap-1 font-medium">
                    <Star size={12} className="fill-emerald-400" /> {p.rating}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function InsuranceModule() {
  const [tab, setTab] = useState<InsTab>("travel_policy");

  return (
    <div className="flex flex-col h-full bg-[#0D1117]">
      <div className="flex-shrink-0 px-6 pt-6 pb-0 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
            <Shield size={16} className="text-blue-400" />
          </div>
          <h1 className="text-lg font-bold text-zinc-100">Insurance</h1>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-0">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${tab === t.key ? "border-amber-500 text-amber-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "travel_policy"  && <TravelPolicyTab />}
        {tab === "medical_policy" && <MedicalPolicyTab />}
        {tab === "policies"       && <PoliciesTab />}
        {tab === "claims"         && <ClaimsTab />}
        {tab === "providers"      && <ProvidersTab />}
        {tab === "renewals"       && <RenewalsTab />}
        {tab === "reports"        && <InsuranceReportsTab />}
      </div>
    </div>
  );
}
