import { useState } from "react";
import { Plus, Search, CheckCircle2, XCircle, Clock, Users, Building2, FileText, Printer } from "lucide-react";
import {
  HAJJ_PACKAGES, HAJJ_GROUPS, PILGRIMS, DOCUMENT_TRACKER, ACCOMMODATIONS,
  HAJJ_PAYMENTS, OFFER_LETTERS, HajjPackage, Pilgrim, fmtAED,
} from "./data";
import { PipelineKanban, PipelineStage, PipelineCard } from "../shared/PipelineKanban";

type ModTab = "packages"|"offer_letters"|"documents"|"groups"|"pilgrims"|"accommodation"|"payments"|"reports";
const MOD_TABS: { key: ModTab; label: string }[] = [
  { key:"packages",      label:"Package List"        },
  { key:"offer_letters", label:"Offer Letter"        },
  { key:"documents",     label:"Document Tracker"    },
  { key:"groups",        label:"Group Management"    },
  { key:"pilgrims",      label:"Pilgrim List"        },
  { key:"accommodation", label:"Accommodation"       },
  { key:"payments",      label:"Payment Collection"  },
  { key:"reports",       label:"Report"              },
];

const PILGRIM_PIPELINE: PipelineStage[] = [
  { key:"registered",          label:"Registered",         color:"bg-slate-400",   textColor:"text-slate-600" },
  { key:"documents_pending",   label:"Docs Pending",       color:"bg-amber-400",   textColor:"text-amber-700" },
  { key:"visa_applied",        label:"Visa Applied",       color:"bg-blue-400",    textColor:"text-blue-700"  },
  { key:"visa_approved",       label:"Visa Approved",      color:"bg-emerald-500", textColor:"text-emerald-700" },
  { key:"departed",            label:"Departed",           color:"bg-purple-400",  textColor:"text-purple-700" },
  { key:"returned",            label:"Returned",           color:"bg-slate-600",   textColor:"text-slate-700"  },
];

const CAT_BADGE: Record<string,string> = {
  economy:"bg-slate-100 text-slate-600",  standard:"bg-blue-100 text-blue-700",
  premium:"bg-purple-100 text-purple-700",vip:"bg-amber-100 text-amber-700",
};
const PILGRIM_STATUS_CFG: Record<string,{ bg:string;color:string;label:string }> = {
  registered:         { bg:"bg-slate-100",   color:"text-slate-600",   label:"Registered"       },
  documents_pending:  { bg:"bg-amber-100",   color:"text-amber-700",   label:"Docs Pending"     },
  visa_applied:       { bg:"bg-blue-100",    color:"text-blue-700",    label:"Visa Applied"     },
  visa_approved:      { bg:"bg-emerald-100", color:"text-emerald-700", label:"Visa Approved"    },
  departed:           { bg:"bg-purple-100",  color:"text-purple-700",  label:"Departed"         },
  returned:           { bg:"bg-slate-200",   color:"text-slate-700",   label:"Returned"         },
  cancelled:          { bg:"bg-red-100",     color:"text-red-700",     label:"Cancelled"        },
};
const DOC_STATUS_CFG: Record<string,{ icon: typeof CheckCircle2; color:string }> = {
  received:  { icon: CheckCircle2, color:"text-emerald-500" },
  pending:   { icon: Clock,         color:"text-amber-500"   },
  expired:   { icon: XCircle,       color:"text-red-500"     },
  submitted: { icon: CheckCircle2, color:"text-emerald-500" },
  approved:  { icon: CheckCircle2, color:"text-emerald-500" },
  applied:   { icon: Clock,         color:"text-blue-500"    },
  not_applied:{ icon: XCircle,      color:"text-slate-300"  },
  waived:    { icon: CheckCircle2, color:"text-slate-400"   },
  na:        { icon: CheckCircle2, color:"text-slate-300"   },
  rejected:  { icon: XCircle,       color:"text-red-500"     },
};

function DocIcon({ status }: { status: string }) {
  const cfg = DOC_STATUS_CFG[status] ?? DOC_STATUS_CFG["pending"];
  const Icon = cfg.icon;
  return <Icon size={13} className={cfg.color}/>;
}

// ── Package List Tab ──────────────────────────────────────────────────────────
function PackagesTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Hajj & Umrah Packages ({HAJJ_PACKAGES.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Package</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {HAJJ_PACKAGES.map(pkg => (
          <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[12px] font-bold text-slate-800">{pkg.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{pkg.code}</p>
              </div>
              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded capitalize ${CAT_BADGE[pkg.category]}`}>{pkg.category}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
              {[["Season",pkg.season],["Duration",`${pkg.duration} days`],["Makkah",`${pkg.hotelStarsMakkah}★ · ${pkg.distanceMakkah}`],["Madinah",`${pkg.hotelStarsMadinah}★ · ${pkg.distanceMadinah}`]].map(([l,v]) => (
                <div key={l} className="bg-slate-50 rounded-lg p-2">
                  <p className="text-[8.5px] font-bold text-slate-400 uppercase">{l}</p>
                  <p className="font-semibold text-slate-700 text-[9.5px]">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {pkg.inclusions.slice(0,4).map(inc => <span key={inc} className="text-[8px] font-semibold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded">{inc}</span>)}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <p className="text-[11px] font-bold text-amber-600 font-mono">{fmtAED(pkg.priceAED)}<span className="text-[9px] text-slate-400 font-normal">/person</span></p>
              </div>
              <div className="text-right">
                <p className="text-[9.5px] text-slate-500">{pkg.enrolled}/{pkg.capacity} enrolled</p>
                <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-1">
                  <div className="h-full rounded-full bg-amber-400" style={{width:`${(pkg.enrolled/pkg.capacity)*100}%`}}/>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Offer Letters Tab ─────────────────────────────────────────────────────────
function OfferLettersTab() {
  const [sel, setSel] = useState(OFFER_LETTERS[0]);
  const STATUS_CFG: Record<string,{bg:string;color:string;label:string}> = {
    draft:       { bg:"bg-slate-100",   color:"text-slate-500",   label:"Draft"       },
    sent:        { bg:"bg-blue-100",    color:"text-blue-700",    label:"Sent"        },
    acknowledged:{ bg:"bg-emerald-100", color:"text-emerald-700", label:"Acknowledged"},
  };
  const pkg = HAJJ_PACKAGES.find(p=>p.id===sel.packageId)!;
  return (
    <div className="grid grid-cols-[260px_1fr] gap-5">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-[9.5px] font-bold text-slate-500 uppercase">Letters ({OFFER_LETTERS.length})</p>
            <button className="text-[9px] font-bold text-amber-600"><Plus size={10}/></button>
          </div>
        </div>
        {OFFER_LETTERS.map(ol => {
          const sc = STATUS_CFG[ol.status];
          return (
            <button key={ol.id} onClick={() => setSel(ol)}
              className={`w-full text-left px-3 py-2.5 border-b border-slate-100 transition-colors ${sel.id===ol.id?"bg-amber-50":"hover:bg-slate-50"}`}>
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[10px] font-bold text-slate-800 truncate">{ol.pilgrimName}</p>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono">{ol.ref}</p>
              <p className="text-[9px] text-slate-400">{ol.season}</p>
            </button>
          );
        })}
      </div>
      {/* Letter preview */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-emerald-300/70 text-[8px] font-bold uppercase tracking-[0.2em] mb-0.5">Offer Letter</p>
            <p className="text-white text-[18px] font-bold font-mono">{sel.ref}</p>
          </div>
          <div className="text-right">
            <p className="text-emerald-300/60 text-[9px]">Season</p>
            <p className="text-emerald-200 text-[12px] font-bold">{sel.season}</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-5 mb-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Pilgrim Details</p>
              {[["Full Name",sel.pilgrimName],["Package",sel.packageName],["Generated",sel.generatedAt],["Sent",sel.sentAt??"—"]].map(([l,v]) => (
                <div key={l} className="flex gap-2 py-1 border-b border-slate-100 last:border-0">
                  <span className="text-[9.5px] text-slate-400 w-20 flex-shrink-0">{l}</span>
                  <span className="text-[10px] font-bold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Package Details</p>
              {pkg && [["Category",pkg.category],["Duration",`${pkg.duration} days`],["Makkah Hotel",pkg.hotelMakkah],["Madinah Hotel",pkg.hotelMadinah],["Package Price",fmtAED(pkg.priceAED)]].map(([l,v]) => (
                <div key={l} className="flex gap-2 py-1 border-b border-slate-100 last:border-0">
                  <span className="text-[9.5px] text-slate-400 w-24 flex-shrink-0">{l}</span>
                  <span className="text-[10px] font-bold text-slate-800 capitalize">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 text-[10px] text-emerald-700">
            <p className="font-bold mb-1">Inclusions</p>
            <div className="flex flex-wrap gap-1">
              {pkg?.inclusions.map(i => <span key={i} className="text-[8.5px] font-semibold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">{i}</span>)}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-xl hover:bg-emerald-700">Send to Pilgrim</button>
            <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 text-[10px] font-semibold rounded-xl hover:bg-slate-50"><Printer size={11}/> Print</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Document Tracker Tab ──────────────────────────────────────────────────────
function DocumentsTab() {
  const DOC_COLS = ["Passport","Photo","Meningitis","Covid Vax","MoI Form","Visa Status","Mahram Proof"];
  const DOC_KEYS = ["passport","photo","meningitis","covidVax","moiForm","visaStatus","mahramProof"];
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Document Tracker ({DOCUMENT_TRACKER.length} pilgrims)</p>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">Pilgrim</th>
              <th className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">Group</th>
              {DOC_COLS.map(c => <th key={c} className="px-2 py-2.5 text-[8.5px] font-bold text-slate-400 uppercase tracking-wide text-center">{c}</th>)}
              <th className="px-3 py-2.5"/>
            </tr>
          </thead>
          <tbody>
            {DOCUMENT_TRACKER.map((dt, i) => (
              <tr key={dt.id} className={`border-b border-slate-100 ${i%2?"bg-slate-50/30":""}`}>
                <td className="px-3 py-2.5 font-semibold text-slate-800">{dt.pilgrimName}</td>
                <td className="px-3 py-2.5 text-slate-400 font-mono text-[9px]">{dt.groupId}</td>
                {DOC_KEYS.map(k => (
                  <td key={k} className="px-2 py-2.5 text-center">
                    <DocIcon status={(dt as any)[k]}/>
                  </td>
                ))}
                <td className="px-3 py-2.5">
                  <button className="text-[9.5px] text-amber-600 font-bold hover:text-amber-700">Update</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Group Management Tab ──────────────────────────────────────────────────────
function GroupsTab() {
  const STATUS_CFG: Record<string,{bg:string;color:string;label:string}> = {
    forming:   { bg:"bg-amber-100",   color:"text-amber-700",   label:"Forming"   },
    confirmed: { bg:"bg-blue-100",    color:"text-blue-700",    label:"Confirmed" },
    departed:  { bg:"bg-purple-100",  color:"text-purple-700",  label:"Departed"  },
    returned:  { bg:"bg-emerald-100", color:"text-emerald-700", label:"Returned"  },
    cancelled: { bg:"bg-red-100",     color:"text-red-700",     label:"Cancelled" },
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Hajj/Umrah Groups ({HAJJ_GROUPS.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Group</button>
      </div>
      <div className="space-y-3">
        {HAJJ_GROUPS.map(g => {
          const sc = STATUS_CFG[g.status];
          return (
            <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0"><Users size={14}/></div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{g.packageName}</p>
                <p className="text-[10px] text-slate-500">Guide: {g.guideName ?? "TBD"} · Departs: {g.departure}</p>
                {g.flightNo && <p className="text-[9px] text-slate-400 font-mono">{g.airline} · {g.flightNo}</p>}
              </div>
              <div className="text-center text-[10px]">
                <p className="font-bold text-[18px] text-slate-800">{g.pilgrims}</p>
                <p className="text-slate-400">pilgrims</p>
              </div>
              <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg ${sc.bg} ${sc.color}`}>{sc.label}</span>
              <button className="px-3 py-1.5 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50">Manage</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Pilgrim List Tab ──────────────────────────────────────────────────────────
function PilgrimsTab() {
  const [view, setView] = useState<"table"|"pipeline">("table");
  const pipelineCards: PipelineCard[] = PILGRIMS.map(p => ({
    id: p.id, stage: p.status, title: p.name,
    subtitle: `${p.nationality} · ${p.passportNo}`,
    meta: `Paid: ${fmtAED(p.paidAED)} / ${fmtAED(p.totalAED)}`,
    badge: p.paymentStatus==="full"?"Fully Paid":p.paymentStatus==="partial"?"Part Paid":"Unpaid",
    badgeColor: p.paymentStatus==="full"?"bg-emerald-100 text-emerald-700":p.paymentStatus==="partial"?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700",
  }));
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Pilgrim List ({PILGRIMS.length})</p>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(["table","pipeline"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-[10px] font-semibold capitalize transition-colors ${view===v?"bg-amber-500 text-white":"bg-white text-slate-500 hover:bg-slate-50"}`}>{v}</button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> Add Pilgrim</button>
        </div>
      </div>
      {view==="table" ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Name","Passport","Nationality","DOB","Gender","Group","Paid","Total","Payment","Status"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PILGRIMS.map((p, i) => {
                const sc = PILGRIM_STATUS_CFG[p.status];
                return (
                  <tr key={p.id} className={`border-b border-slate-100 ${i%2?"bg-slate-50/30":""}`}>
                    <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{p.name}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{p.passportNo}</td>
                    <td className="px-3 py-2.5 text-slate-500">{p.nationality}</td>
                    <td className="px-3 py-2.5 text-slate-500 text-[10px]">{p.dob}</td>
                    <td className="px-3 py-2.5 text-center text-slate-600">{p.gender}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400">{p.groupId}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-700">{fmtAED(p.paidAED)}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-700">{fmtAED(p.totalAED)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${p.paymentStatus==="full"?"bg-emerald-100 text-emerald-700":p.paymentStatus==="partial"?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700"}`}>
                        {p.paymentStatus.replace("_"," ")}
                      </span>
                    </td>
                    <td className="px-3 py-2.5"><span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <PipelineKanban stages={PILGRIM_PIPELINE} cards={pipelineCards} columnWidth={190}/>
        </div>
      )}
    </div>
  );
}

// ── Accommodation Tab ─────────────────────────────────────────────────────────
function AccommodationTab() {
  const CITY_COLOR: Record<string,string> = {
    Makkah:"bg-amber-100 text-amber-700", Madinah:"bg-emerald-100 text-emerald-700",
    Mina:"bg-blue-100 text-blue-700",     Arafat:"bg-purple-100 text-purple-700",
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Accommodation Assignments ({ACCOMMODATIONS.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> Assign Room</button>
      </div>
      <div className="space-y-3">
        {ACCOMMODATIONS.map(acc => (
          <div key={acc.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="size-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0"><Building2 size={14}/></div>
            <div className="flex-1">
              <p className="text-[11.5px] font-bold text-slate-800">{acc.hotelName}</p>
              <p className="text-[10px] text-slate-500">{acc.roomType} · {acc.checkIn} – {acc.checkOut} · Group: {acc.groupId}</p>
            </div>
            <div className="text-center text-[10px]">
              <p className="font-bold text-[18px] text-slate-800">{acc.occupancy}</p>
              <p className="text-slate-400">guests</p>
            </div>
            <div className="text-center text-[10px]">
              <p className="font-bold text-[18px] text-slate-800">{acc.totalRooms}</p>
              <p className="text-slate-400">rooms</p>
            </div>
            <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg ${CITY_COLOR[acc.city] ?? "bg-slate-100 text-slate-600"}`}>{acc.city}</span>
            <button className="px-3 py-1.5 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50">Rooming List</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Payments Tab ──────────────────────────────────────────────────────────────
function PaymentsTab() {
  const totalCollected = HAJJ_PAYMENTS.reduce((s,p) => s+p.amount, 0);
  const totalDue = PILGRIMS.reduce((s,p) => s+p.totalAED, 0);
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[["Total Due",fmtAED(totalDue),"text-slate-700"],["Collected",fmtAED(totalCollected),"text-emerald-600"],["Outstanding",fmtAED(totalDue-totalCollected),"text-amber-600"]].map(([l,v,c]) => (
          <div key={l} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className={`text-[22px] font-bold font-mono ${c}`}>{v}</p>
            <p className="text-[9.5px] text-slate-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Pilgrim","Group","Amount","Method","Date","Received By"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HAJJ_PAYMENTS.map((p, i) => (
              <tr key={p.id} className={`border-b border-slate-100 ${i%2?"bg-slate-50/30":""}`}>
                <td className="px-3 py-2.5 font-semibold text-slate-800">{p.pilgrimName}</td>
                <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400">{p.groupId}</td>
                <td className="px-3 py-2.5 font-mono font-bold text-emerald-600">{fmtAED(p.amount)}</td>
                <td className="px-3 py-2.5 capitalize text-slate-500">{p.method.replace("_"," ")}</td>
                <td className="px-3 py-2.5 text-slate-500">{p.date}</td>
                <td className="px-3 py-2.5 text-slate-500">{p.receivedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab() {
  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[["Total Packages",String(HAJJ_PACKAGES.length)],["Total Pilgrims",String(PILGRIMS.length)],["Groups",String(HAJJ_GROUPS.length)],["Revenue",fmtAED(HAJJ_PAYMENTS.reduce((s,p)=>s+p.amount,0))]].map(([l,v]) => (
          <div key={l} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-[22px] font-bold font-mono text-slate-800">{v}</p>
            <p className="text-[9.5px] text-slate-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Package Enrollment</p>
          {HAJJ_PACKAGES.map(pkg => (
            <div key={pkg.id} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-700 truncate max-w-[180px]">{pkg.name}</span>
                <span className="text-[10px] text-slate-400">{pkg.enrolled}/{pkg.capacity}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full">
                <div className="h-full rounded-full bg-amber-400" style={{width:`${(pkg.enrolled/pkg.capacity)*100}%`}}/>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Payment Status</p>
          {[["Fully Paid",PILGRIMS.filter(p=>p.paymentStatus==="full").length,"bg-emerald-400"],["Part Paid",PILGRIMS.filter(p=>p.paymentStatus==="partial").length,"bg-amber-400"],["Unpaid",PILGRIMS.filter(p=>p.paymentStatus==="unpaid").length,"bg-red-400"]].map(([l,v,c]) => (
            <div key={String(l)} className="flex items-center gap-3 mb-2">
              <div className={`size-3 rounded-full ${c}`}/>
              <span className="text-[10.5px] text-slate-700 flex-1">{l}</span>
              <span className="text-[10.5px] font-bold text-slate-800">{v} pilgrims</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────
export default function HajjModule() {
  const [tab, setTab] = useState<ModTab>("packages");
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[17px] font-bold text-slate-800">Hajj & Umrah Management</h1>
            <p className="text-[10.5px] text-slate-400 mt-0.5">{PILGRIMS.length} pilgrims · {HAJJ_GROUPS.length} groups · {HAJJ_PACKAGES.length} packages</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-[10.5px] font-bold rounded-lg hover:bg-emerald-700"><Plus size={11}/> Add Pilgrim</button>
        </div>
        <div className="flex gap-0 overflow-x-auto">
          {MOD_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3.5 py-2.5 text-[10.5px] font-semibold border-b-2 whitespace-nowrap transition-all flex-shrink-0
                ${tab===t.key?"border-emerald-500 text-emerald-700":"border-transparent text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
        {tab==="packages"      && <PackagesTab/>}
        {tab==="offer_letters" && <OfferLettersTab/>}
        {tab==="documents"     && <DocumentsTab/>}
        {tab==="groups"        && <GroupsTab/>}
        {tab==="pilgrims"      && <PilgrimsTab/>}
        {tab==="accommodation" && <AccommodationTab/>}
        {tab==="payments"      && <PaymentsTab/>}
        {tab==="reports"       && <ReportsTab/>}
      </div>
    </div>
  );
}
