import { useState } from "react";
import {
  CheckCircle2, AlertTriangle, XCircle, Shield, Search, Plus,
  QrCode, Package, RotateCcw, History, FileText, Clock,
  ArrowRight, ChevronDown, Filter,
} from "lucide-react";
import {
  PASSPORTS, LOCKER_SLOTS, VISA_TYPES, PASSPORT_LOG,
  PassportRecord, fmtAED,
} from "./data";

// ── Types ─────────────────────────────────────────────────────────────────────
type ModuleTab = "intake"|"locker"|"visa_types"|"history";

const MODULE_TABS: { key: ModuleTab; label: string; Icon: typeof FileText }[] = [
  { key:"intake",     label:"Passport Intake / OCR", Icon:FileText   },
  { key:"locker",     label:"Locker Management",     Icon:Package    },
  { key:"visa_types", label:"Visa Types Reference",  Icon:Shield     },
  { key:"history",    label:"Passport History Log",  Icon:History    },
];

const STATUS_CFG = {
  in_locker:      { label:"In Locker",      color:"text-blue-700",    bg:"bg-blue-100",    dot:"bg-blue-500"    },
  returned:       { label:"Returned",       color:"text-emerald-700", bg:"bg-emerald-100", dot:"bg-emerald-500" },
  processing:     { label:"Processing",     color:"text-amber-700",   bg:"bg-amber-100",   dot:"bg-amber-500"   },
  pending_return: { label:"Pending Return", color:"text-red-700",     bg:"bg-red-100",     dot:"bg-red-500"     },
};

const ACTION_CFG = {
  received: { label:"Received",   color:"text-blue-700",    bg:"bg-blue-100"    },
  tagged:   { label:"QR Tagged",  color:"text-violet-700",  bg:"bg-violet-100"  },
  stored:   { label:"Stored",     color:"text-emerald-700", bg:"bg-emerald-100" },
  returned: { label:"Returned",   color:"text-emerald-700", bg:"bg-emerald-100" },
  flagged:  { label:"Flagged",    color:"text-red-700",     bg:"bg-red-100"     },
};

// ── Mock Passport Visual ──────────────────────────────────────────────────────
function MockPassport({ passport }: { passport: PassportRecord }) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ background:"linear-gradient(145deg,#1a3a4f,#0d2535)", minHeight:240 }}>
      {/* Header stripe */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full border-2 border-amber-400/50 bg-amber-400/10 flex items-center justify-center">
            <span className="text-amber-400 text-[9px] font-black">
              {passport.nationality.slice(0,3).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white text-[8px] font-black uppercase tracking-[0.18em]">{passport.nationality}</p>
            <p className="text-white/35 text-[6.5px] uppercase tracking-widest">TRAVEL DOCUMENT</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-[7px] font-mono tracking-[0.2em]">PASSPORT</p>
          <p className="text-amber-400/70 text-[7px] font-mono">{passport.passportNo}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-4 px-5 py-4">
        {/* Photo */}
        <div className="w-[76px] h-[96px] rounded-xl bg-white/8 border border-white/15 flex items-center justify-center flex-shrink-0">
          {passport.faceDetected ? (
            <div className="size-14 rounded-full bg-slate-600/80 border-2 border-white/20 flex items-center justify-center">
              <span className="text-white/90 text-[16px] font-black">
                {passport.ownerName.split(" ").map(n => n[0]).join("").slice(0,2)}
              </span>
            </div>
          ) : (
            <div className="text-center">
              <XCircle size={20} className="text-red-400/70 mx-auto mb-1"/>
              <p className="text-[6.5px] text-red-300/70">No Face</p>
            </div>
          )}
          {/* Face detection overlay */}
          {passport.faceDetected && (
            <div className="absolute" style={{ top:52, left:22 }}>
              <div className="border border-emerald-400/60 rounded" style={{ width:66, height:86, position:"relative" }}>
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-400 rounded-br" />
              </div>
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5 content-start">
          {[
            ["Full Name",    passport.ownerName.toUpperCase()],
            ["Passport No",  passport.passportNo],
            ["Nationality",  passport.nationality.toUpperCase()],
            ["Date of Birth",passport.dob.toUpperCase()],
            ["Expiry Date",  passport.expiry.toUpperCase()],
            ["Gender",       passport.gender],
          ].map(([l, v]) => (
            <div key={l}>
              <p className="text-white/30 text-[6px] font-bold uppercase tracking-wide">{l}</p>
              <p className="text-white text-[9.5px] font-bold font-mono leading-tight">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MRZ Strip */}
      <div className="mt-1 bg-black/25 border-t border-white/8 px-4 py-2.5">
        <p className="font-mono text-[6.5px] text-amber-300/80 tracking-[0.12em] leading-[1.6]">{passport.mrz1}</p>
        <p className="font-mono text-[6.5px] text-amber-300/80 tracking-[0.12em] leading-[1.6]">{passport.mrz2}</p>
      </div>
    </div>
  );
}

// ── Intake Tab ────────────────────────────────────────────────────────────────
function IntakeTab() {
  const [selected, setSelected] = useState<PassportRecord>(PASSPORTS[0]);

  // Intake workflow steps
  const STEPS = ["Receive Passport","OCR / MRZ Scan","Face Detection","Duplicate Check","Confirm & Tag","Assign Locker"];
  const currentStep = selected.status === "returned" ? 5 : selected.duplicateFlag ? 3 : 4;

  return (
    <div className="space-y-5">
      {/* Workflow progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Intake Workflow</p>
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`size-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-colors
                  ${i < currentStep ? "bg-emerald-500 border-emerald-500 text-white" : i === currentStep ? "bg-amber-500 border-amber-500 text-white" : "border-slate-300 text-slate-400"}`}>
                  {i < currentStep ? <CheckCircle2 size={12}/> : i + 1}
                </div>
                <p className="text-[7.5px] text-center text-slate-500 mt-1 w-16 leading-tight">{step}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-4 ${i < currentStep ? "bg-emerald-400" : "bg-slate-200"}`}/>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-[360px_1fr] gap-5">
        {/* Left: Mock passport + selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Scanned Document</p>
            <select
              onChange={e => setSelected(PASSPORTS.find(p => p.id === e.target.value) ?? PASSPORTS[0])}
              className="text-[10px] border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none focus:border-amber-400"
            >
              {PASSPORTS.filter(p => p.status !== "returned").map(p => (
                <option key={p.id} value={p.id}>{p.ownerName} — {p.passportNo}</option>
              ))}
            </select>
          </div>
          <MockPassport passport={selected} />
          <p className="text-[9px] text-slate-400 text-center">Received {selected.receivedAt} · Handler: {selected.handler}</p>
        </div>

        {/* Right: Extracted data + flags */}
        <div className="space-y-4">
          {/* Detection flags */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Detection Results</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label:"Face Detected",   ok:selected.faceDetected,  failNote:"No face found in photo zone"         },
                { label:"MRZ Checksum",    ok:selected.mrzValid,       failNote:"MRZ checksum failed"                 },
                { label:"No Duplicate",    ok:!selected.duplicateFlag, failNote:"Possible duplicate in system"        },
                { label:"Passport Valid",  ok:selected.status !== "pending_return", failNote:"Flagged for review"     },
              ].map(f => (
                <div key={f.label} className={`flex items-start gap-2.5 p-3 rounded-xl border ${f.ok ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                  {f.ok
                    ? <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5"/>
                    : <AlertTriangle size={15} className="text-red-600 flex-shrink-0 mt-0.5"/>
                  }
                  <div>
                    <p className={`text-[10.5px] font-bold ${f.ok ? "text-emerald-700" : "text-red-700"}`}>{f.label}</p>
                    {!f.ok && <p className="text-[9px] text-red-500 mt-0.5">{f.failNote}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extracted fields */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Extracted Fields (OCR)</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label:"Full Name",     value:selected.ownerName, conf:98 },
                { label:"Passport No",   value:selected.passportNo, conf:100 },
                { label:"Nationality",   value:selected.nationality, conf:99 },
                { label:"Date of Birth", value:selected.dob, conf:97 },
                { label:"Expiry Date",   value:selected.expiry, conf:100 },
                { label:"Gender",        value:selected.gender === "M" ? "Male" : "Female", conf:99 },
              ].map(f => (
                <div key={f.label} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[8.5px] font-bold text-slate-400 uppercase">{f.label}</p>
                  <p className="text-[11.5px] font-bold text-slate-800 font-mono mt-0.5">{f.value}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="h-1 flex-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width:`${f.conf}%` }}/>
                    </div>
                    <span className="text-[7.5px] text-slate-400 font-mono">{f.conf}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {selected.notes && (
            <div className={`flex gap-2 p-3 rounded-xl border ${selected.duplicateFlag ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
              <AlertTriangle size={13} className={selected.duplicateFlag ? "text-red-600 flex-shrink-0 mt-0.5" : "text-amber-600 flex-shrink-0 mt-0.5"}/>
              <p className={`text-[10.5px] ${selected.duplicateFlag ? "text-red-700" : "text-amber-700"}`}>{selected.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button className="flex-1 py-2 bg-amber-500 text-white text-[10.5px] font-bold rounded-xl hover:bg-amber-600 transition-colors">
              Confirm & Generate QR Tag
            </button>
            <button className="px-4 py-2 border border-slate-200 text-slate-600 text-[10.5px] font-semibold rounded-xl hover:bg-slate-50">
              Rescan
            </button>
            <button className="px-4 py-2 border border-slate-200 text-slate-600 text-[10.5px] font-semibold rounded-xl hover:bg-slate-50">
              Manual Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Locker Management Tab ─────────────────────────────────────────────────────
function LockerTab() {
  const [hovered, setHovered] = useState<string | null>(null);
  const occupied = LOCKER_SLOTS.filter(s => s.occupied);
  const pp = PASSPORTS;

  return (
    <div className="grid grid-cols-[1fr_320px] gap-5">
      {/* Locker grid */}
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Total Lockers",   value:30,                        color:"text-slate-800", bg:"bg-white" },
            { label:"Occupied",        value:occupied.length,            color:"text-amber-700", bg:"bg-amber-50" },
            { label:"Available",       value:30 - occupied.length,       color:"text-emerald-700",bg:"bg-emerald-50" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-slate-200 p-3.5 text-center`}>
              <p className={`text-[22px] font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[9.5px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Locker Grid — Bay A</p>
          <div className="grid gap-1.5" style={{ gridTemplateColumns:"repeat(6, 1fr)" }}>
            {LOCKER_SLOTS.map(slot => {
              const passport = slot.passportId ? pp.find(p => p.id === slot.passportId) : null;
              const isHovered = hovered === slot.id;
              return (
                <div
                  key={slot.id}
                  onMouseEnter={() => setHovered(slot.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`relative h-12 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all
                    ${slot.occupied
                      ? isHovered ? "border-amber-400 bg-amber-50 shadow-md scale-105" : "border-amber-300 bg-amber-50/60"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                >
                  <span className="text-[8.5px] font-bold text-slate-600">{slot.id}</span>
                  {slot.occupied && <span className="size-1.5 rounded-full bg-amber-500 mt-0.5"/>}
                  {/* Tooltip */}
                  {isHovered && passport && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[8px] font-semibold px-2 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50">
                      <p className="font-bold">{passport.ownerName}</p>
                      <p className="text-slate-300">{passport.passportNo}</p>
                      <p className="text-slate-400">Due: {passport.returnDue}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5"><div className="size-2.5 rounded bg-amber-50 border-2 border-amber-300"/><span className="text-[9px] text-slate-500">Occupied</span></div>
            <div className="flex items-center gap-1.5"><div className="size-2.5 rounded bg-slate-50 border-2 border-slate-200"/><span className="text-[9px] text-slate-500">Available</span></div>
          </div>
        </div>
      </div>

      {/* Passports in custody */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase">Passports In Custody</p>
        {pp.filter(p => p.status === "in_locker" || p.status === "processing").map(p => {
          const cfg = STATUS_CFG[p.status];
          return (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-3.5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[11px] font-bold text-slate-800">{p.ownerName}</p>
                  <p className="text-[9px] font-mono text-slate-500">{p.passportNo} · {p.nationality}</p>
                </div>
                {p.lockerId && (
                  <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-amber-100 text-amber-700 rounded">{p.lockerId}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                  <span className={`size-1.5 rounded-full ${cfg.dot}`}/>{cfg.label}
                </span>
                {p.returnDue && <span className="text-[9px] text-slate-400">Due {p.returnDue}</span>}
              </div>
              <div className="flex gap-1.5 mt-2.5">
                <button className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-slate-200 text-[9.5px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50">
                  <QrCode size={10}/> QR Code
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-amber-500 text-white text-[9.5px] font-bold rounded-lg hover:bg-amber-600">
                  <RotateCcw size={10}/> Return
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Visa Types Tab ────────────────────────────────────────────────────────────
function VisaTypesTab() {
  const [search, setSearch] = useState("");
  const filtered = VISA_TYPES.filter(v =>
    !search || v.country.toLowerCase().includes(search.toLowerCase()) || v.visaType.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Visa Types Reference ({VISA_TYPES.length} types)</p>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Country or visa type…"
            className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[11px] w-48 focus:outline-none focus:border-amber-400"/>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Country","Visa Type","Duration","Max Stay","Fee (AED)","Processing","Notes"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => (
              <tr key={v.id} className={`border-b border-slate-100 hover:bg-amber-50/30 transition-colors ${i % 2 ? "bg-slate-50/30" : ""}`}>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px]">{v.flag}</span>
                    <span className="font-semibold text-slate-800">{v.country}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-slate-600">{v.visaType}</td>
                <td className="px-3 py-2.5 text-slate-600">{v.duration}</td>
                <td className="px-3 py-2.5 text-slate-600">{v.maxStay}</td>
                <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{v.feeAED.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-slate-500">{v.processingDays} days</td>
                <td className="px-3 py-2.5 text-[9.5px] text-slate-400 max-w-[160px] truncate" title={v.notes}>{v.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── History Log Tab ───────────────────────────────────────────────────────────
function HistoryTab() {
  const [search, setSearch] = useState("");
  const filtered = PASSPORT_LOG.filter(l =>
    !search || l.ownerName.toLowerCase().includes(search.toLowerCase()) || l.passportNo.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Passport Activity Log ({PASSPORT_LOG.length} events)</p>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or passport no…"
            className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[11px] w-44 focus:outline-none focus:border-amber-400"/>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Action","Passport No","Owner","Handler","Timestamp","Notes"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, i) => {
              const cfg = ACTION_CFG[log.action];
              return (
                <tr key={log.id} className={`border-b border-slate-100 ${i % 2 ? "bg-slate-50/30" : ""}`}>
                  <td className="px-3 py-2.5">
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600">{log.passportNo}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-700">{log.ownerName}</td>
                  <td className="px-3 py-2.5 text-slate-500">{log.by}</td>
                  <td className="px-3 py-2.5 text-slate-400 text-[9.5px]">{log.at}</td>
                  <td className="px-3 py-2.5 text-[9.5px] text-slate-400">{log.notes ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────
export default function PassportModule() {
  const [tab, setTab] = useState<ModuleTab>("intake");

  const inLocker     = PASSPORTS.filter(p => p.status === "in_locker").length;
  const pendingReturn= PASSPORTS.filter(p => p.status === "pending_return").length;
  const flagged      = PASSPORTS.filter(p => p.duplicateFlag).length;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[17px] font-bold text-slate-800">Passport Management</h1>
            <p className="text-[10.5px] text-slate-400 mt-0.5">{PASSPORTS.length} total · {inLocker} in custody · {LOCKER_SLOTS.filter(s => !s.occupied).length} lockers free</p>
          </div>
          <div className="flex items-center gap-2.5">
            {pendingReturn > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold rounded-lg">
                <AlertTriangle size={11}/> {pendingReturn} Pending Return
              </span>
            )}
            {flagged > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold rounded-lg">
                <XCircle size={11}/> {flagged} Flagged
              </span>
            )}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">
              <Plus size={11}/> New Intake
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-0">
          {MODULE_TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[10.5px] font-semibold border-b-2 transition-all
                ${tab === key ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              <Icon size={11}/>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
        {tab === "intake"     && <IntakeTab/>}
        {tab === "locker"     && <LockerTab/>}
        {tab === "visa_types" && <VisaTypesTab/>}
        {tab === "history"    && <HistoryTab/>}
      </div>
    </div>
  );
}
