import { useState } from "react";
import { Plus, Search, CheckCircle2, XCircle, Clock, AlertTriangle, Building2, FileText } from "lucide-react";
import {
  WORK_PERMITS, EMPLOYMENT_VISAS, PR_CASES, EMPLOYERS, DOC_CHECKLISTS, RENEWAL_REMINDERS,
  WorkPermitCase, EmploymentVisaCase, PRCase, fmtAED,
} from "./data";
import { PipelineKanban, PipelineStage, PipelineCard } from "../shared/PipelineKanban";

type ModTab = "work_permit"|"employment_visa"|"pr_residency"|"employers"|"documents"|"renewals"|"reports";
const MOD_TABS: { key: ModTab; label: string }[] = [
  { key:"work_permit",     label:"Work Permit"        },
  { key:"employment_visa", label:"Employment Visa"    },
  { key:"pr_residency",    label:"PR / Residency"     },
  { key:"employers",       label:"Employer Directory" },
  { key:"documents",       label:"Document Checklist" },
  { key:"renewals",        label:"Renewal Reminders"  },
  { key:"reports",         label:"Report"             },
];

const PERMIT_PIPELINE: PipelineStage[] = [
  { key:"inquiry",          label:"Inquiry",          color:"bg-slate-400",   textColor:"text-slate-600"   },
  { key:"documents",        label:"Documents",        color:"bg-amber-400",   textColor:"text-amber-700"   },
  { key:"employer_approval",label:"Employer OK",      color:"bg-blue-300",    textColor:"text-blue-700"    },
  { key:"submitted",        label:"Submitted",        color:"bg-blue-500",    textColor:"text-blue-800"    },
  { key:"processing",       label:"Processing",       color:"bg-purple-400",  textColor:"text-purple-700"  },
  { key:"medical",          label:"Medical",          color:"bg-teal-400",    textColor:"text-teal-700"    },
  { key:"biometric",        label:"Biometric",        color:"bg-cyan-400",    textColor:"text-cyan-700"    },
  { key:"approved",         label:"Approved",         color:"bg-emerald-500", textColor:"text-emerald-700" },
  { key:"issued",           label:"Issued",           color:"bg-green-600",   textColor:"text-green-800"   },
];

const VISA_PIPELINE: PipelineStage[] = [
  { key:"inquiry",      label:"Inquiry",       color:"bg-slate-400",   textColor:"text-slate-600"  },
  { key:"documents",    label:"Documents",     color:"bg-amber-400",   textColor:"text-amber-700"  },
  { key:"noc",          label:"NOC",           color:"bg-blue-300",    textColor:"text-blue-700"   },
  { key:"submitted",    label:"Submitted",     color:"bg-blue-500",    textColor:"text-blue-800"   },
  { key:"processing",   label:"Processing",    color:"bg-purple-400",  textColor:"text-purple-700" },
  { key:"approved",     label:"Approved",      color:"bg-indigo-400",  textColor:"text-indigo-700" },
  { key:"entry_visa",   label:"Entry Visa",    color:"bg-teal-400",    textColor:"text-teal-700"   },
  { key:"status_change",label:"Status Change", color:"bg-orange-400",  textColor:"text-orange-700" },
  { key:"completed",    label:"Completed",     color:"bg-emerald-500", textColor:"text-emerald-700"},
];

const PR_PIPELINE: PipelineStage[] = [
  { key:"inquiry",     label:"Inquiry",     color:"bg-slate-400",   textColor:"text-slate-600"   },
  { key:"eligibility", label:"Eligibility", color:"bg-amber-400",   textColor:"text-amber-700"   },
  { key:"documents",   label:"Documents",   color:"bg-blue-400",    textColor:"text-blue-700"    },
  { key:"filing",      label:"Filing",      color:"bg-blue-600",    textColor:"text-blue-800"    },
  { key:"processing",  label:"Processing",  color:"bg-purple-400",  textColor:"text-purple-700"  },
  { key:"interview",   label:"Interview",   color:"bg-orange-400",  textColor:"text-orange-700"  },
  { key:"decision",    label:"Decision",    color:"bg-cyan-400",    textColor:"text-cyan-700"    },
  { key:"approved",    label:"Approved",    color:"bg-emerald-500", textColor:"text-emerald-700" },
  { key:"issued",      label:"Issued",      color:"bg-green-600",   textColor:"text-green-800"   },
];

const STAGE_LABEL_CFG: Record<string,{bg:string;color:string}> = {
  inquiry:{bg:"bg-slate-100",color:"text-slate-500"}, documents:{bg:"bg-amber-100",color:"text-amber-700"},
  employer_approval:{bg:"bg-blue-50",color:"text-blue-600"},submitted:{bg:"bg-blue-100",color:"text-blue-700"},
  processing:{bg:"bg-purple-100",color:"text-purple-700"},medical:{bg:"bg-teal-100",color:"text-teal-700"},
  biometric:{bg:"bg-cyan-100",color:"text-cyan-700"},approved:{bg:"bg-emerald-100",color:"text-emerald-700"},
  issued:{bg:"bg-green-100",color:"text-green-700"},rejected:{bg:"bg-red-100",color:"text-red-700"},
  noc:{bg:"bg-blue-50",color:"text-blue-500"},entry_visa:{bg:"bg-teal-100",color:"text-teal-700"},
  status_change:{bg:"bg-orange-100",color:"text-orange-700"},completed:{bg:"bg-slate-100",color:"text-slate-600"},
  eligibility:{bg:"bg-amber-50",color:"text-amber-600"},filing:{bg:"bg-blue-100",color:"text-blue-700"},
  interview:{bg:"bg-orange-100",color:"text-orange-700"},decision:{bg:"bg-cyan-100",color:"text-cyan-700"},
};

function StageBadge({ stage }: { stage: string }) {
  const cfg = STAGE_LABEL_CFG[stage] ?? { bg:"bg-slate-100", color:"text-slate-500" };
  const label = stage.replace(/_/g," ").replace(/\b\w/g, c=>c.toUpperCase());
  return <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded capitalize ${cfg.bg} ${cfg.color}`}>{label}</span>;
}

// ── Work Permit Tab ───────────────────────────────────────────────────────────
function WorkPermitTab() {
  const [view, setView] = useState<"table"|"pipeline">("table");
  const [search, setSearch] = useState("");
  const shown = search ? WORK_PERMITS.filter(w=>w.holderName.toLowerCase().includes(search.toLowerCase())) : WORK_PERMITS;
  const cards: PipelineCard[] = WORK_PERMITS.filter(w=>!["rejected","cancelled"].includes(w.stage)).map(w=>({
    id:w.id, stage:w.stage, title:w.holderName,
    subtitle:`${w.jobTitle} · ${w.employerName}`,
    meta:w.permitNo??"Ref: "+w.ref,
    badge:w.permitType, badgeColor:"bg-amber-100 text-amber-700",
  }));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search holder…" className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10.5px] focus:outline-none focus:border-amber-400 bg-white w-44"/>
          </div>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(["table","pipeline"] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)} className={`px-3 py-1.5 text-[10px] font-semibold capitalize transition-colors ${view===v?"bg-amber-500 text-white":"bg-white text-slate-500 hover:bg-slate-50"}`}>{v}</button>
            ))}
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Case</button>
      </div>
      {view==="table" ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-[11px]">
            <thead><tr className="bg-slate-50 border-b border-slate-200">{["Ref","Holder","Nationality","Job Title","Employer","Type","Permit No","Expiry","Stage"].map(h=><th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {shown.map((w,i)=>(
                <tr key={w.id} className={`border-b border-slate-100 hover:bg-amber-50/30 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400">{w.ref}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{w.holderName}</td>
                  <td className="px-3 py-2.5 text-slate-500">{w.nationality}</td>
                  <td className="px-3 py-2.5 text-slate-600">{w.jobTitle}</td>
                  <td className="px-3 py-2.5 text-slate-500 max-w-[140px] truncate">{w.employerName}</td>
                  <td className="px-3 py-2.5 capitalize"><span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">{w.permitType}</span></td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{w.permitNo??<span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5 text-slate-400">{w.expiryDate??<span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5"><StageBadge stage={w.stage}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <PipelineKanban stages={PERMIT_PIPELINE} cards={cards} columnWidth={185}/>
        </div>
      )}
    </div>
  );
}

// ── Employment Visa Tab ───────────────────────────────────────────────────────
function EmploymentVisaTab() {
  const [view, setView] = useState<"table"|"pipeline">("table");
  const cards: PipelineCard[] = EMPLOYMENT_VISAS.filter(e=>!["rejected"].includes(e.stage)).map(e=>({
    id:e.id, stage:e.stage, title:e.applicantName,
    subtitle:`${e.jobTitle} · ${e.employerName}`,
    meta:e.visaNo??"AED "+e.salary.toLocaleString(),
    badge:e.nationality, badgeColor:"bg-slate-100 text-slate-500",
  }));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {(["table","pipeline"] as const).map(v=>(
            <button key={v} onClick={()=>setView(v)} className={`px-3 py-1.5 text-[10px] font-semibold capitalize transition-colors ${view===v?"bg-amber-500 text-white":"bg-white text-slate-500 hover:bg-slate-50"}`}>{v}</button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Case</button>
      </div>
      {view==="table" ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-[11px]">
            <thead><tr className="bg-slate-50 border-b border-slate-200">{["Ref","Applicant","Nationality","Job Title","Employer","Salary","Visa No","EID","Expiry","Stage"].map(h=><th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {EMPLOYMENT_VISAS.map((e,i)=>(
                <tr key={e.id} className={`border-b border-slate-100 hover:bg-amber-50/30 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400">{e.ref}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{e.applicantName}</td>
                  <td className="px-3 py-2.5 text-slate-500">{e.nationality}</td>
                  <td className="px-3 py-2.5 text-slate-600">{e.jobTitle}</td>
                  <td className="px-3 py-2.5 text-slate-500 max-w-[130px] truncate">{e.employerName}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-700">AED {e.salary.toLocaleString()}</td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400">{e.visaNo??<span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400">{e.emiratesId??<span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5 text-slate-400">{e.visaExpiry??<span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5"><StageBadge stage={e.stage}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto"><PipelineKanban stages={VISA_PIPELINE} cards={cards} columnWidth={175}/></div>
      )}
    </div>
  );
}

// ── PR / Residency Tab ────────────────────────────────────────────────────────
function PRResidencyTab() {
  const [view, setView] = useState<"table"|"pipeline">("table");
  const TYPE_BADGE: Record<string,string> = {
    golden_visa:"bg-amber-100 text-amber-700",permanent_residency:"bg-blue-100 text-blue-700",
    investor:"bg-purple-100 text-purple-700",retirement:"bg-slate-100 text-slate-600",
  };
  const cards: PipelineCard[] = PR_CASES.filter(p=>!["rejected"].includes(p.stage)).map(p=>({
    id:p.id, stage:p.stage, title:p.applicantName,
    subtitle:`${p.targetCountry} · ${p.prType.replace(/_/g," ")}`,
    meta:p.prNo??"",
    badge:p.nationality, badgeColor:"bg-slate-100 text-slate-500",
  }));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {(["table","pipeline"] as const).map(v=>(
            <button key={v} onClick={()=>setView(v)} className={`px-3 py-1.5 text-[10px] font-semibold capitalize transition-colors ${view===v?"bg-amber-500 text-white":"bg-white text-slate-500 hover:bg-slate-50"}`}>{v}</button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Case</button>
      </div>
      {view==="table" ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-[11px]">
            <thead><tr className="bg-slate-50 border-b border-slate-200">{["Ref","Applicant","Nationality","Country","Type","Investment","PR No","Expiry","Stage"].map(h=><th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {PR_CASES.map((p,i)=>(
                <tr key={p.id} className={`border-b border-slate-100 hover:bg-amber-50/30 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400">{p.ref}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{p.applicantName}</td>
                  <td className="px-3 py-2.5 text-slate-500">{p.nationality}</td>
                  <td className="px-3 py-2.5 text-slate-600">{p.targetCountry}</td>
                  <td className="px-3 py-2.5"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${TYPE_BADGE[p.prType]}`}>{p.prType.replace(/_/g," ")}</span></td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600">{p.investmentAED?fmtAED(p.investmentAED):<span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400">{p.prNo??<span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5 text-slate-400">{p.expiryDate??<span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5"><StageBadge stage={p.stage}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto"><PipelineKanban stages={PR_PIPELINE} cards={cards} columnWidth={175}/></div>
      )}
    </div>
  );
}

// ── Employer Directory Tab ────────────────────────────────────────────────────
function EmployersTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Employer Directory ({EMPLOYERS.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> Add Employer</button>
      </div>
      <div className="space-y-3">
        {EMPLOYERS.map(emp=>{
          const quotaPct = (emp.quotaUsed/emp.quota)*100;
          return (
            <div key={emp.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0"><Building2 size={16}/></div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{emp.name}</p>
                <p className="text-[10px] text-slate-500">{emp.industry} · {emp.emirate} · {emp.contactName}</p>
                <p className="text-[9.5px] font-mono text-slate-400">{emp.tradeLicense}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-slate-400">Work Permits</p>
                <p className="font-bold text-slate-800 text-[15px]">{emp.activePermits}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-slate-400">Visas</p>
                <p className="font-bold text-slate-800 text-[15px]">{emp.activeVisas}</p>
              </div>
              <div className="w-28">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] text-slate-400">Quota</span>
                  <span className="text-[9px] font-bold text-slate-700">{emp.quotaUsed}/{emp.quota}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full">
                  <div className="h-full rounded-full bg-amber-400" style={{width:`${quotaPct}%`}}/>
                </div>
              </div>
              <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg ${emp.status==="active"?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>{emp.status.charAt(0).toUpperCase()+emp.status.slice(1)}</span>
              <button className="px-3 py-1.5 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50">View</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Document Checklist Tab ────────────────────────────────────────────────────
const DOC_STATUS_ICON = {
  received:{ icon:CheckCircle2, color:"text-emerald-500" },
  pending: { icon:Clock,        color:"text-amber-500"   },
  expired: { icon:XCircle,      color:"text-red-500"     },
  waived:  { icon:CheckCircle2, color:"text-slate-300"   },
};
function DocIcon({ status }: { status: string }) {
  const cfg = DOC_STATUS_ICON[status as keyof typeof DOC_STATUS_ICON] ?? DOC_STATUS_ICON.pending;
  const Icon = cfg.icon;
  return <Icon size={14} className={cfg.color}/>;
}

function DocumentsTab() {
  const [sel, setSel] = useState(DOC_CHECKLISTS[0]);
  const pending = sel.documents.filter(d=>d.status==="pending").length;
  const received = sel.documents.filter(d=>d.status==="received").length;
  return (
    <div className="grid grid-cols-[220px_1fr] gap-5">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200"><p className="text-[9.5px] font-bold text-slate-500 uppercase">Cases ({DOC_CHECKLISTS.length})</p></div>
        {DOC_CHECKLISTS.map(dc=>(
          <button key={dc.id} onClick={()=>setSel(dc)} className={`w-full text-left px-3 py-2.5 border-b border-slate-100 transition-colors ${sel.id===dc.id?"bg-amber-50":"hover:bg-slate-50"}`}>
            <p className="text-[10px] font-bold text-slate-800">{dc.applicantName}</p>
            <p className="text-[9px] text-slate-400 capitalize">{dc.caseType.replace(/_/g," ")} · {dc.caseId}</p>
          </button>
        ))}
      </div>
      <div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center gap-4">
          <FileText size={16} className="text-amber-600"/>
          <div>
            <p className="text-[12px] font-bold text-slate-800">{sel.applicantName}</p>
            <p className="text-[10px] text-slate-500 capitalize">{sel.caseType.replace(/_/g," ")} · {sel.caseId}</p>
          </div>
          <div className="ml-auto flex gap-3 text-center">
            {[["Received",received,"text-emerald-600"],["Pending",pending,"text-amber-600"],["Total",sel.documents.length,"text-slate-700"]].map(([l,v,c])=>(
              <div key={String(l)}>
                <p className={`text-[18px] font-bold font-mono ${c}`}>{v}</p>
                <p className="text-[9px] text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {sel.documents.map((doc,i)=>(
            <div key={i} className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 ${i%2?"bg-slate-50/30":""}`}>
              <DocIcon status={doc.status}/>
              <p className="flex-1 text-[10.5px] font-semibold text-slate-700">{doc.name}</p>
              {doc.notes && <p className="text-[9px] text-amber-600 font-semibold">{doc.notes}</p>}
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded capitalize ${doc.status==="received"?"bg-emerald-100 text-emerald-700":doc.status==="pending"?"bg-amber-100 text-amber-700":doc.status==="expired"?"bg-red-100 text-red-700":"bg-slate-100 text-slate-500"}`}>{doc.status}</span>
              {doc.status==="pending" && <button className="text-[9px] text-amber-600 font-bold hover:text-amber-700">Mark Received</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Renewal Reminders Tab ─────────────────────────────────────────────────────
function RenewalsTab() {
  const STATUS_CFG: Record<string,{bg:string;color:string;label:string;icon:typeof Clock}> = {
    active:        { bg:"bg-emerald-100", color:"text-emerald-700", label:"Active",        icon:CheckCircle2 },
    expiring_soon: { bg:"bg-amber-100",   color:"text-amber-700",   label:"Expiring Soon", icon:AlertTriangle },
    expired:       { bg:"bg-red-100",     color:"text-red-700",     label:"Expired",       icon:XCircle       },
    renewed:       { bg:"bg-slate-100",   color:"text-slate-500",   label:"Renewed",       icon:CheckCircle2 },
  };
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        {["expiring_soon","expired","active"].map(s=>{
          const cnt = RENEWAL_REMINDERS.filter(r=>r.status===s).length;
          const sc = STATUS_CFG[s];
          return (
            <div key={s} className={`flex-1 rounded-xl border p-4 text-center ${sc.bg} border-opacity-50`}>
              <p className={`text-[22px] font-bold font-mono ${sc.color}`}>{cnt}</p>
              <p className={`text-[9.5px] font-bold ${sc.color}`}>{sc.label}</p>
            </div>
          );
        })}
      </div>
      <div className="space-y-2">
        {RENEWAL_REMINDERS.sort((a,b)=>a.daysLeft-b.daysLeft).map(r=>{
          const sc = STATUS_CFG[r.status];
          const Icon = sc.icon;
          return (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <Icon size={18} className={sc.color}/>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{r.holderName}</p>
                <p className="text-[10px] text-slate-500">{r.permitType} · <span className="font-mono">{r.permitNo}</span></p>
                <p className="text-[9.5px] text-slate-400">Assigned: {r.assignedTo}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500">Expiry: <span className="font-semibold text-slate-700">{r.expiryDate}</span></p>
                <p className={`text-[11px] font-bold ${r.daysLeft<0?"text-red-600":r.daysLeft<30?"text-amber-600":"text-slate-600"}`}>
                  {r.daysLeft<0?`${Math.abs(r.daysLeft)} days overdue`:r.daysLeft===0?"Expires today":`${r.daysLeft} days left`}
                </p>
              </div>
              <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg ${sc.bg} ${sc.color}`}>{sc.label}</span>
              {r.status!=="renewed" && <button className="px-3 py-1.5 bg-amber-500 text-white text-[9.5px] font-bold rounded-lg hover:bg-amber-600">Initiate Renewal</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab() {
  const totalCases = WORK_PERMITS.length + EMPLOYMENT_VISAS.length + PR_CASES.length;
  const approved = [...WORK_PERMITS,...EMPLOYMENT_VISAS,...PR_CASES].filter(c=>(c as any).stage==="approved"||(c as any).stage==="issued"||(c as any).stage==="completed").length;
  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[["Total Cases",String(totalCases)],["Work Permits",String(WORK_PERMITS.length)],["Emp. Visas",String(EMPLOYMENT_VISAS.length)],["PR/Residency",String(PR_CASES.length)]].map(([l,v])=>(
          <div key={l} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-[22px] font-bold font-mono text-slate-800">{v}</p>
            <p className="text-[9.5px] text-slate-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Work Permit Stages</p>
          {PERMIT_PIPELINE.map(s=>{
            const cnt = WORK_PERMITS.filter(w=>w.stage===s.key).length;
            return (
              <div key={s.key} className="flex items-center gap-3 mb-2">
                <div className={`size-2.5 rounded-full ${s.color}`}/>
                <span className="text-[10px] text-slate-600 flex-1">{s.label}</span>
                <span className="text-[10px] font-bold text-slate-800">{cnt}</span>
              </div>
            );
          })}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Top Employers</p>
          {EMPLOYERS.sort((a,b)=>b.activePermits-a.activePermits).slice(0,5).map(emp=>(
            <div key={emp.id} className="flex items-center gap-3 mb-2">
              <span className="text-[10px] text-slate-600 flex-1 truncate">{emp.name}</span>
              <div className="w-20 h-1.5 bg-slate-100 rounded-full">
                <div className="h-full rounded-full bg-amber-400" style={{width:`${(emp.activePermits/EMPLOYERS[0].activePermits)*100}%`}}/>
              </div>
              <span className="text-[10px] font-bold text-slate-800">{emp.activePermits}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────
export default function ImmigrationModule() {
  const [tab, setTab] = useState<ModTab>("work_permit");
  const expiringCnt = RENEWAL_REMINDERS.filter(r=>r.status==="expiring_soon"||r.status==="expired").length;
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[17px] font-bold text-slate-800">Immigration Management</h1>
            <p className="text-[10.5px] text-slate-400 mt-0.5">{WORK_PERMITS.length} work permits · {EMPLOYMENT_VISAS.length} employment visas · {PR_CASES.length} PR cases</p>
          </div>
          <div className="flex items-center gap-2">
            {expiringCnt>0 && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-lg"><AlertTriangle size={11}/>{expiringCnt} expiring</span>}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Case</button>
          </div>
        </div>
        <div className="flex gap-0 overflow-x-auto">
          {MOD_TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`px-3.5 py-2.5 text-[10.5px] font-semibold border-b-2 whitespace-nowrap transition-all flex-shrink-0
                ${tab===t.key?"border-amber-500 text-amber-600":"border-transparent text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
        {tab==="work_permit"     && <WorkPermitTab/>}
        {tab==="employment_visa" && <EmploymentVisaTab/>}
        {tab==="pr_residency"    && <PRResidencyTab/>}
        {tab==="employers"       && <EmployersTab/>}
        {tab==="documents"       && <DocumentsTab/>}
        {tab==="renewals"        && <RenewalsTab/>}
        {tab==="reports"         && <ReportsTab/>}
      </div>
    </div>
  );
}
