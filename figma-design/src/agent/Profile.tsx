import { useState } from "react";
import { Building2, Mail, Phone, MapPin, FileText, Award, Shield, Edit2, CheckCircle2, Clock, AlertCircle, Upload, User } from "lucide-react";
import { AGENT_PROFILE, TIER_CFG, BOOKINGS } from "./data";

const DOCS = [
  { label: "Trade License",          status: "verified", expiry: "15 Jun 2026" },
  { label: "IATA Accreditation",     status: "verified", expiry: "30 Nov 2025" },
  { label: "UAE Tourism License",    status: "pending",  expiry: "—" },
  { label: "VAT Registration (TRN)", status: "verified", expiry: "—" },
];
const DOC_CFG = {
  verified: { label: "Verified",     icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  pending:  { label: "Under Review", icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50 border-amber-200" },
  expired:  { label: "Expired",      icon: AlertCircle,  color: "text-red-600",     bg: "bg-red-50 border-red-200" },
};

const inp = "w-full px-3 py-2.5 text-[12px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[#14213D] disabled:opacity-60 disabled:bg-slate-100";
const lbl = "block text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1.5";

export default function Profile() {
  const [editing, setEditing] = useState(false);
  const tier = TIER_CFG[AGENT_PROFILE.tier];

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-[20px] font-bold">Company Profile</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">{AGENT_PROFILE.agentId} · Last updated 10 Jan 2025</p>
        </div>
        <button
          onClick={() => setEditing(e => !e)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors ${editing ? "bg-emerald-500 text-white hover:bg-emerald-600" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          {editing ? <><CheckCircle2 size={13} /> Save Changes</> : <><Edit2 size={13} /> Edit Profile</>}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          {/* Company info */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-5">
              <Building2 size={15} className="text-slate-400" />
              <p className="text-[13px] font-bold text-slate-800">Company Information</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={lbl}>Agency Name</label>
                <input disabled={!editing} defaultValue={AGENT_PROFILE.name} className={inp} />
              </div>
              <div>
                <label className={lbl}>Trade License Number</label>
                <input disabled={!editing} defaultValue={AGENT_PROFILE.licenseNo} className={inp} />
              </div>
              <div>
                <label className={lbl}>IATA Code</label>
                <input disabled={!editing} defaultValue={AGENT_PROFILE.iataCode} className={inp} />
              </div>
              <div>
                <label className={lbl}>Email Address</label>
                <input type="email" disabled={!editing} defaultValue={AGENT_PROFILE.email} className={inp} />
              </div>
              <div>
                <label className={lbl}>Phone Number</label>
                <input disabled={!editing} defaultValue={AGENT_PROFILE.phone} className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Business Address</label>
                <input disabled={!editing} defaultValue={AGENT_PROFILE.address} className={inp} />
              </div>
            </div>
          </div>

          {/* Banking */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-5">
              <FileText size={15} className="text-slate-400" />
              <p className="text-[13px] font-bold text-slate-800">Banking & Billing</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Bank Name</label>
                <input disabled={!editing} defaultValue="Emirates NBD" className={inp} />
              </div>
              <div>
                <label className={lbl}>Account Number</label>
                <input disabled={!editing} defaultValue="0101234567890" className={inp} />
              </div>
              <div>
                <label className={lbl}>IBAN</label>
                <input disabled={!editing} defaultValue="AE07 0331 2345 6789 0123 456" className={inp} />
              </div>
              <div>
                <label className={lbl}>VAT / TRN Number</label>
                <input disabled={!editing} defaultValue="100987654300003" className={inp} />
              </div>
              <div>
                <label className={lbl}>Billing Currency</label>
                <select disabled={!editing} className={inp + " appearance-none"}>
                  <option>AED — UAE Dirham</option>
                  <option>USD — US Dollar</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Invoice Cycle</label>
                <select disabled={!editing} className={inp + " appearance-none"}>
                  <option>Monthly (end of month)</option>
                  <option>Bi-weekly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-5">
              <Shield size={15} className="text-slate-400" />
              <p className="text-[13px] font-bold text-slate-800">Compliance Documents</p>
            </div>
            <div className="space-y-3">
              {DOCS.map(doc => {
                const cfg = DOC_CFG[doc.status as keyof typeof DOC_CFG];
                return (
                  <div key={doc.label} className={`flex items-center gap-4 p-3.5 rounded-xl border ${cfg.bg}`}>
                    <cfg.icon size={15} className={cfg.color} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-slate-800">{doc.label}</p>
                      {doc.expiry !== "—" && <p className="text-[10px] text-slate-400">Expires: {doc.expiry}</p>}
                    </div>
                    <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                    <button className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                      <Upload size={11} /> Replace
                    </button>
                  </div>
                );
              })}
            </div>
            <button className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-[#F97316] hover:underline">
              <Upload size={12} /> Upload additional document
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-[#14213D] rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[12px] font-bold text-white/80">Agent Tier</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>{tier.label}</span>
            </div>
            <p className="text-[28px] font-bold font-mono text-amber-400">{tier.rate}%</p>
            <p className="text-[11px] text-white/45 mt-0.5">Commission rate</p>
            <div className="mt-5 space-y-2">
              {[
                ["Wallet Balance",    "AED 28,450"],
                ["Security Deposit", "AED 50,000"],
                ["Credit Limit",     "AED 100,000"],
                ["Bookings (YTD)",   String(BOOKINGS.length)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-[11px]">
                  <span className="text-white/45">{k}</span>
                  <span className="text-white/80 font-semibold font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-[12px] font-bold text-slate-800 mb-4">Account Manager</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-[#14213D] flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800">{AGENT_PROFILE.accountManager.name}</p>
                <p className="text-[10px] text-slate-400">Senior B2B Relationship Manager</p>
              </div>
            </div>
            <div className="space-y-2">
              <a href={`tel:${AGENT_PROFILE.accountManager.phone}`} className="flex items-center gap-2 text-[11px] text-slate-500 hover:text-[#14213D] transition-colors">
                <Phone size={11} className="text-[#F97316]" /> {AGENT_PROFILE.accountManager.phone}
              </a>
              <a href={`mailto:${AGENT_PROFILE.accountManager.email}`} className="flex items-center gap-2 text-[11px] text-slate-500 hover:text-[#14213D] transition-colors">
                <Mail size={11} className="text-[#F97316]" /> {AGENT_PROFILE.accountManager.email}
              </a>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-[12px] font-bold text-slate-800 mb-3">Certifications</p>
            <div className="space-y-2">
              {["IATA Certified Agent", "ATAS Accredited", "UAE Tourism Partner"].map(c => (
                <div key={c} className="flex items-center gap-2">
                  <Award size={12} className="text-amber-500" />
                  <span className="text-[11px] text-slate-600">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
