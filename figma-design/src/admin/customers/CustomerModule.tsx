import { useState } from "react";
import {
  Search, Plus, ChevronLeft, Phone, Mail, MessageSquare,
  FileText, CreditCard, Plane, Globe, MessageCircle,
  BookOpen, CheckCircle2, XCircle, Clock, Download,
  AlertTriangle, Shield, Users, ChevronRight,
} from "lucide-react";
import {
  CUSTOMERS, FAMILY_MEMBERS, CUSTOMER_DOCS, TRAVEL_HISTORY,
  PAYMENT_HISTORY, VISA_HISTORY, TICKET_HISTORY, CUST_COMMS, CUST_NOTES,
  Customer, fmtAED,
} from "./data";

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  active:   { label: "Active",   color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500" },
  inactive: { label: "Inactive", color: "text-slate-600",   bg: "bg-slate-100",   dot: "bg-slate-400"   },
  flagged:  { label: "Flagged",  color: "text-red-700",     bg: "bg-red-100",     dot: "bg-red-500"     },
};
const DOC_STATUS = {
  verified: { label: "Verified", color: "text-emerald-700", bg: "bg-emerald-100", Icon: CheckCircle2 },
  pending:  { label: "Pending",  color: "text-amber-700",   bg: "bg-amber-100",   Icon: Clock        },
  rejected: { label: "Rejected", color: "text-red-700",     bg: "bg-red-100",     Icon: XCircle      },
};
const DOC_CAT_COLORS: Record<string, string> = {
  passport: "bg-blue-100 text-blue-700", visa: "bg-violet-100 text-violet-700",
  financial: "bg-emerald-100 text-emerald-700", medical: "bg-red-100 text-red-700",
  photo: "bg-amber-100 text-amber-700", other: "bg-slate-100 text-slate-600",
};
const VISA_RESULT = {
  approved: { label: "Approved", color: "text-emerald-700", bg: "bg-emerald-100", Icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-700",     bg: "bg-red-100",     Icon: XCircle      },
  pending:  { label: "Pending",  color: "text-amber-700",   bg: "bg-amber-100",   Icon: Clock        },
};
const TICKET_STATUS = {
  confirmed: { label: "Confirmed", color: "text-blue-700",    bg: "bg-blue-100"    },
  used:      { label: "Used",      color: "text-slate-600",   bg: "bg-slate-100"   },
  cancelled: { label: "Cancelled", color: "text-red-700",     bg: "bg-red-100"     },
};
const TRAVEL_STATUS = {
  completed: { label: "Completed", color: "text-slate-600",   bg: "bg-slate-100"   },
  upcoming:  { label: "Upcoming",  color: "text-blue-700",    bg: "bg-blue-100"    },
  cancelled: { label: "Cancelled", color: "text-red-700",     bg: "bg-red-100"     },
};

// ── Tabs ──────────────────────────────────────────────────────────────────────
type ProfileTab = "ocr"|"family"|"documents"|"travel"|"payments"|"visa"|"tickets"|"comms"|"notes";
const PROFILE_TABS: { key: ProfileTab; label: string }[] = [
  { key:"ocr",       label:"OCR Scan"        },
  { key:"family",    label:"Family Members"  },
  { key:"documents", label:"Document Vault"  },
  { key:"travel",    label:"Travel History"  },
  { key:"payments",  label:"Payment History" },
  { key:"visa",      label:"Visa History"    },
  { key:"tickets",   label:"Ticket History"  },
  { key:"comms",     label:"Communications"  },
  { key:"notes",     label:"Notes & Reminder"},
];

// ── OCR Scan Tab ──────────────────────────────────────────────────────────────
function OCRScanTab({ customer }: { customer: Customer }) {
  if (!customer.ocrScanDate) {
    return (
      <div className="text-center py-16">
        <FileText size={32} className="text-slate-300 mx-auto mb-3" />
        <p className="text-[12px] font-bold text-slate-500">No OCR scan recorded</p>
        <button className="mt-3 px-4 py-2 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">Initiate Scan</button>
      </div>
    );
  }

  const lines = (customer.ocrMRZ ?? "").split("\n");
  return (
    <div className="grid grid-cols-[340px_1fr] gap-5">
      {/* Mock passport */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Scanned Document</p>
        <div className="relative rounded-xl overflow-hidden shadow-xl" style={{ background: "linear-gradient(145deg,#1B3A4B,#0D2535)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
                <span className="text-amber-400 text-[8px] font-black">UAE</span>
              </div>
              <div>
                <p className="text-white text-[7.5px] font-bold uppercase tracking-widest">United Arab Emirates</p>
                <p className="text-white/40 text-[6.5px]">الإمارات العربية المتحدة</p>
              </div>
            </div>
            <p className="text-white/50 text-[7.5px] font-mono tracking-widest">PASSPORT</p>
          </div>
          {/* Body */}
          <div className="flex gap-3 px-4 py-3">
            {/* Photo */}
            <div className="w-[70px] h-[88px] rounded-md bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <div className="size-12 rounded-full bg-slate-600 border-2 border-white/20 flex items-center justify-center">
                <span className="text-white text-[15px] font-black">{customer.avatar}</span>
              </div>
            </div>
            {/* Fields */}
            <div className="flex-1 space-y-1">
              {[
                ["Surname / Given Names", customer.name.toUpperCase()],
                ["Nationality",           customer.nationality.toUpperCase()],
                ["Date of Birth",         customer.dob.toUpperCase()],
                ["Sex",                   customer.gender],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-white/35 text-[6.5px] font-bold uppercase">{l}</p>
                  <p className="text-white text-[9.5px] font-bold font-mono leading-tight">{v}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1 flex-shrink-0">
              {[
                ["Passport No", customer.passportNo],
                ["Expiry Date", customer.ocrScanDate?.replace("2024","2029") ?? ""],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-white/35 text-[6.5px] font-bold uppercase">{l}</p>
                  <p className="text-white text-[9.5px] font-bold font-mono leading-tight">{v}</p>
                </div>
              ))}
            </div>
          </div>
          {/* MRZ */}
          <div className="bg-black/30 border-t border-white/10 px-3 py-2">
            {lines.map((line, i) => (
              <p key={i} className="font-mono text-[6.5px] text-amber-400/90 tracking-wider leading-tight">{line}</p>
            ))}
          </div>
        </div>
        <p className="text-[9px] text-slate-400 mt-2">Scanned on {customer.ocrScanDate}</p>
      </div>

      {/* Extracted data */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Extracted Data</p>
        {/* Detection flags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: "Face Detected", ok: customer.faceDetected ?? true   },
            { label: "MRZ Valid",     ok: true                             },
            { label: "No Duplicate",  ok: !(customer.duplicateFlag ?? false) },
          ].map(f => (
            <span key={f.label} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold border
              ${f.ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              {f.ok ? <CheckCircle2 size={11}/> : <AlertTriangle size={11}/>}
              {f.label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Shield size={11}/> Confidence {customer.ocrConfidence}%
          </span>
        </div>
        {/* Field grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label:"Full Name",    value:customer.name,           conf:customer.ocrConfidence ?? 97 },
            { label:"Passport No",  value:customer.passportNo,     conf:100 },
            { label:"Nationality",  value:customer.nationality,    conf:99  },
            { label:"Date of Birth",value:customer.dob,            conf:98  },
            { label:"Gender",       value:customer.gender === "M" ? "Male" : "Female", conf:99 },
            { label:"Expiry Date",  value:customer.ocrScanDate?.replace("2024","2029") ?? "—", conf:100 },
          ].map(f => (
            <div key={f.label} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">{f.label}</p>
              <p className="text-[12px] font-bold text-slate-800 font-mono">{f.value}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="h-1 flex-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width:`${f.conf}%` }} />
                </div>
                <span className="text-[8px] text-slate-400 font-mono">{f.conf}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button className="px-4 py-2 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">Confirm & Save</button>
          <button className="px-4 py-2 border border-slate-200 text-slate-600 text-[10.5px] font-semibold rounded-lg hover:bg-slate-50">Rescan</button>
          <button className="px-4 py-2 border border-slate-200 text-slate-600 text-[10.5px] font-semibold rounded-lg hover:bg-slate-50">Manual Entry</button>
        </div>
      </div>
    </div>
  );
}

// ── Family Tab ────────────────────────────────────────────────────────────────
function FamilyTab({ customer }: { customer: Customer }) {
  const members = FAMILY_MEMBERS.filter(f => f.customerId === customer.id);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Family Members ({members.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">
          <Plus size={11} /> Add Member
        </button>
      </div>
      {members.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Users size={28} className="text-slate-300 mx-auto mb-2" />
          <p className="text-[11px] text-slate-400">No family members added yet</p>
        </div>
      )}
      <div className="space-y-2">
        {members.map(m => (
          <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="size-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
              {m.name.split(" ").map(n => n[0]).join("").slice(0,2)}
            </div>
            <div className="flex-1">
              <p className="text-[11.5px] font-bold text-slate-800">{m.name}</p>
              <p className="text-[9.5px] text-slate-400">{m.relation} · {m.nationality} · Born {m.dob}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-slate-600">{m.passportNo}</p>
              <p className="text-[9px] text-slate-400">{m.gender === "M" ? "Male" : "Female"}</p>
            </div>
            <button className="text-[10px] text-amber-600 hover:text-amber-700 font-semibold">View</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Document Vault Tab ────────────────────────────────────────────────────────
function DocumentsTab({ customer }: { customer: Customer }) {
  const [cat, setCat] = useState("all");
  const docs = CUSTOMER_DOCS.filter(d => d.customerId === customer.id && (cat === "all" || d.category === cat));
  const cats = ["all","passport","visa","financial","medical","photo","other"];
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-bold text-slate-700">Document Vault ({docs.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">
          <Plus size={11} /> Upload
        </button>
      </div>
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-2.5 py-1 rounded-full text-[9.5px] font-bold capitalize transition-colors ${cat === c ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {docs.map(d => {
          const stCfg = DOC_STATUS[d.status];
          const StIcon = stCfg.Icon;
          return (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center gap-3">
              <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <FileText size={14} className="text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-800 truncate">{d.name}</p>
                <p className="text-[9.5px] text-slate-400">{d.uploadedAt} · {d.size}</p>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded capitalize ${DOC_CAT_COLORS[d.category]}`}>{d.category}</span>
              <span className={`flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded ${stCfg.bg} ${stCfg.color}`}>
                <StIcon size={9} />{stCfg.label}
              </span>
              <button className="text-slate-400 hover:text-slate-600 transition-colors"><Download size={13} /></button>
            </div>
          );
        })}
        {docs.length === 0 && <p className="text-[11px] text-slate-400 text-center py-8">No documents in this category</p>}
      </div>
    </div>
  );
}

// ── Travel History Tab ────────────────────────────────────────────────────────
function TravelTab({ customer }: { customer: Customer }) {
  const records = TRAVEL_HISTORY.filter(t => t.customerId === customer.id);
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Travel History ({records.length} trips)</p>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Destination","Visa Type","Departure","Return","Status"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => {
              const cfg = TRAVEL_STATUS[r.status];
              return (
                <tr key={r.id} className={`border-b border-slate-100 ${i % 2 ? "bg-slate-50/30" : ""}`}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Globe size={11} className="text-slate-400" />
                      <span className="font-semibold text-slate-800">{r.destination}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{r.visaType}</td>
                  <td className="px-3 py-2.5 text-slate-600">{r.departure}</td>
                  <td className="px-3 py-2.5 text-slate-600">{r.return}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {records.length === 0 && <p className="text-[11px] text-slate-400 text-center py-8">No travel records</p>}
      </div>
    </div>
  );
}

// ── Payment History Tab ───────────────────────────────────────────────────────
function PaymentsTab({ customer }: { customer: Customer }) {
  const records = PAYMENT_HISTORY.filter(p => p.customerId === customer.id);
  const PAY_STATUS = {
    paid:     { label: "Paid",     color: "text-emerald-700", bg: "bg-emerald-100" },
    pending:  { label: "Pending",  color: "text-amber-700",   bg: "bg-amber-100"   },
    refunded: { label: "Refunded", color: "text-violet-700",  bg: "bg-violet-100"  },
  };
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Payment History ({records.length})</p>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Invoice Ref","Service","Amount","Date","Method","Status"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => {
              const cfg = PAY_STATUS[r.status];
              return (
                <tr key={r.id} className={`border-b border-slate-100 ${i % 2 ? "bg-slate-50/30" : ""}`}>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600">{r.ref}</td>
                  <td className="px-3 py-2.5 text-slate-700 font-semibold">{r.service}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{fmtAED(r.amount)}</td>
                  <td className="px-3 py-2.5 text-slate-500">{r.date}</td>
                  <td className="px-3 py-2.5 text-slate-500">{r.method}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {records.length === 0 && <p className="text-[11px] text-slate-400 text-center py-8">No payment records</p>}
      </div>
    </div>
  );
}

// ── Visa History Tab ──────────────────────────────────────────────────────────
function VisaTab({ customer }: { customer: Customer }) {
  const records = VISA_HISTORY.filter(v => v.customerId === customer.id);
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Visa History ({records.length} applications)</p>
      <div className="space-y-2">
        {records.map(r => {
          const cfg = VISA_RESULT[r.result];
          const Icon = cfg.Icon;
          return (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                <Icon size={14} className={cfg.color} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[11.5px] font-bold text-slate-800">{r.visaType}</p>
                  <span className="text-[9px] font-mono text-slate-400">{r.ref}</span>
                </div>
                <p className="text-[10px] text-slate-500">{r.destination} · Applied {r.appliedAt}</p>
                <p className="text-[9.5px] text-slate-400 mt-0.5">{r.decision}</p>
              </div>
              <span className={`flex items-center gap-1 text-[9.5px] font-bold px-2.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                <Icon size={9} />{cfg.label}
              </span>
            </div>
          );
        })}
        {records.length === 0 && <p className="text-[11px] text-slate-400 text-center py-8">No visa history</p>}
      </div>
    </div>
  );
}

// ── Ticket History Tab ────────────────────────────────────────────────────────
function TicketsTab({ customer }: { customer: Customer }) {
  const records = TICKET_HISTORY.filter(t => t.customerId === customer.id);
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Ticket History ({records.length})</p>
      <div className="space-y-2">
        {records.map(r => {
          const cfg = TICKET_STATUS[r.status];
          return (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0">
                <Plane size={14} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[11.5px] font-bold text-slate-800">{r.route}</p>
                  <span className="text-[9px] font-mono text-slate-400">{r.ref}</span>
                </div>
                <p className="text-[10px] text-slate-500">{r.airline} · {r.date} · {r.cls}</p>
              </div>
              <span className={`text-[9.5px] font-bold px-2.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
            </div>
          );
        })}
        {records.length === 0 && <p className="text-[11px] text-slate-400 text-center py-8">No ticket history</p>}
      </div>
    </div>
  );
}

// ── Communications Tab ────────────────────────────────────────────────────────
function CommsTab({ customer }: { customer: Customer }) {
  const logs = CUST_COMMS.filter(c => c.customerId === customer.id);
  const TYPE_COLOR: Record<string, string> = { call:"bg-blue-100 text-blue-600", email:"bg-violet-100 text-violet-600", whatsapp:"bg-emerald-100 text-emerald-600", sms:"bg-amber-100 text-amber-600" };
  const TYPE_ICON: Record<string, typeof Phone> = { call:Phone, email:Mail, whatsapp:MessageSquare, sms:MessageCircle };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Communications ({logs.length})</p>
        <div className="flex gap-2">
          {[{l:"Call",I:Phone},{l:"Email",I:Mail},{l:"WhatsApp",I:MessageSquare}].map(({l,I}) => (
            <button key={l} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50">
              <I size={10}/>{l}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {logs.map(log => {
          const Icon = TYPE_ICON[log.type] ?? Mail;
          return (
            <div key={log.id} className="bg-white rounded-xl border border-slate-200 p-3.5 flex gap-3">
              <div className={`size-7 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLOR[log.type]}`}>
                <Icon size={12}/>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[10.5px] font-bold text-slate-700">{log.by}</p>
                  <span className="text-[8.5px] text-slate-400 capitalize">{log.type} · {log.direction === "out" ? "↑ Outbound" : "↓ Inbound"}</span>
                </div>
                <p className="text-[10.5px] text-slate-600">{log.summary}</p>
              </div>
              <p className="text-[9px] text-slate-400 flex-shrink-0">{log.at}</p>
            </div>
          );
        })}
        {logs.length === 0 && <p className="text-[11px] text-slate-400 text-center py-8">No communications logged</p>}
      </div>
    </div>
  );
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────
function NotesTab({ customer }: { customer: Customer }) {
  const notes = CUST_NOTES.filter(n => n.customerId === customer.id);
  const [draft, setDraft] = useState("");
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Notes & Reminders ({notes.length})</p>
      <div className="mb-4 space-y-2">
        <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add a note or reminder…"
          className="w-full h-20 px-3 py-2.5 border border-slate-200 rounded-xl text-[11px] resize-none focus:outline-none focus:border-amber-400 bg-white" />
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600 disabled:opacity-40" disabled={!draft.trim()}>Save Note</button>
          <button className="px-3 py-1.5 border border-slate-200 text-slate-600 text-[10.5px] font-semibold rounded-lg hover:bg-slate-50">+ Set Reminder</button>
        </div>
      </div>
      <div className="space-y-3">
        {notes.map(n => (
          <div key={n.id} className={`p-4 rounded-xl border ${n.reminder ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
            <p className="text-[11px] text-slate-700 leading-relaxed">{n.text}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[9.5px] text-slate-400">{n.by} · {n.at}</p>
              {n.reminder && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600">
                  <Clock size={9} /> Reminder: {n.reminder}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Customer Profile ──────────────────────────────────────────────────────────
function CustomerProfile({ customer, onBack }: { customer: Customer; onBack: () => void }) {
  const [tab, setTab] = useState<ProfileTab>("ocr");
  const stCfg = STATUS_CFG[customer.status];
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-[10.5px] text-slate-500 hover:text-slate-800 mb-2 transition-colors">
          <ChevronLeft size={13}/> Back to Customers
        </button>
        <div className="flex items-center gap-4">
          <div className="size-11 rounded-xl bg-blue-500/10 border border-blue-200 flex items-center justify-center flex-shrink-0">
            <span className="text-[13px] font-black text-blue-600">{customer.avatar}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-slate-800">{customer.name}</h2>
              <span className={`flex items-center gap-1.5 text-[9.5px] font-bold px-2 py-0.5 rounded ${stCfg.bg} ${stCfg.color}`}>
                <span className={`size-1.5 rounded-full ${stCfg.dot}`}/>
                {stCfg.label}
              </span>
              {customer.status === "flagged" && <AlertTriangle size={13} className="text-red-500"/>}
            </div>
            <p className="text-[10px] text-slate-400">{customer.email} · {customer.phone} · {customer.nationality}</p>
          </div>
          <div className="flex gap-3 text-center">
            {[
              { label:"Total Spent",    value: fmtAED(customer.totalSpend) },
              { label:"Applications",   value: customer.applications        },
              { label:"Passport No",    value: customer.passportNo          },
            ].map(m => (
              <div key={m.label} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                <p className="text-[14px] font-bold font-mono text-slate-800">{m.value}</p>
                <p className="text-[8.5px] text-slate-400">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {[{l:"Email",I:Mail},{l:"Call",I:Phone},{l:"WhatsApp",I:MessageSquare}].map(({l,I})=>(
              <button key={l} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50">
                <I size={10}/>{l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-white border-b border-slate-200 overflow-x-auto flex-shrink-0">
        {PROFILE_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3.5 py-3 text-[10.5px] font-semibold border-b-2 whitespace-nowrap transition-all flex-shrink-0
              ${tab === t.key ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
        {tab === "ocr"       && <OCRScanTab   customer={customer}/>}
        {tab === "family"    && <FamilyTab    customer={customer}/>}
        {tab === "documents" && <DocumentsTab customer={customer}/>}
        {tab === "travel"    && <TravelTab    customer={customer}/>}
        {tab === "payments"  && <PaymentsTab  customer={customer}/>}
        {tab === "visa"      && <VisaTab      customer={customer}/>}
        {tab === "tickets"   && <TicketsTab   customer={customer}/>}
        {tab === "comms"     && <CommsTab     customer={customer}/>}
        {tab === "notes"     && <NotesTab     customer={customer}/>}
      </div>
    </div>
  );
}

// ── Customer List ─────────────────────────────────────────────────────────────
export default function CustomerModule() {
  const [selected, setSelected] = useState<Customer | null>(null);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  if (selected) return <CustomerProfile customer={selected} onBack={() => setSelected(null)} />;

  const filtered = CUSTOMERS.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.passportNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-slate-800">Customer Management</h1>
            <p className="text-[10.5px] text-slate-400 mt-0.5">{CUSTOMERS.length} registered customers</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email, or passport…"
                className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[11px] w-52 focus:outline-none focus:border-amber-400"/>
            </div>
            {["all","active","inactive","flagged"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-colors ${statusFilter === s ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                {s}
              </button>
            ))}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">
              <Plus size={11}/> Add Customer
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-5 bg-slate-50">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Customer","Nationality","Passport No","Occupation","Applications","Total Spent","Status",""].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const stCfg = STATUS_CFG[c.status];
                return (
                  <tr key={c.id} onClick={() => setSelected(c)}
                    className={`border-b border-slate-100 cursor-pointer hover:bg-amber-50/40 transition-colors ${i % 2 ? "bg-slate-50/30" : ""}`}>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black flex items-center justify-center flex-shrink-0">
                          {c.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{c.name}</p>
                          <p className="text-[9.5px] text-slate-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{c.nationality}</td>
                    <td className="px-3 py-3 font-mono text-[10px] text-slate-600">{c.passportNo}</td>
                    <td className="px-3 py-3 text-slate-600">{c.occupation}</td>
                    <td className="px-3 py-3 text-center font-bold text-slate-700">{c.applications}</td>
                    <td className="px-3 py-3 font-mono font-bold text-slate-700">{fmtAED(c.totalSpend)}</td>
                    <td className="px-3 py-3">
                      <span className={`flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded w-fit ${stCfg.bg} ${stCfg.color}`}>
                        <span className={`size-1.5 rounded-full ${stCfg.dot}`}/>
                        {stCfg.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <ChevronRight size={13} className="text-slate-400"/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
