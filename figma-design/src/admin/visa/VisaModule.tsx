import { useState } from "react";
import {
  Search, Plus, CheckCircle2, XCircle, Clock, AlertTriangle, AlertCircle,
  FileText, Calendar, Globe, Upload, CheckSquare, MapPin,
  ChevronDown, MoreHorizontal, Layers,
} from "lucide-react";
import {
  EMBASSIES, VISA_APPS, CHECKLISTS, INTERVIEWS, BIOMETRIC_LOG,
  SUBMISSIONS, DELIVERIES, VISA_STAGES,
  VisaApplication, VisaStage, fmtAED,
} from "./data";

// ── Design tokens ─────────────────────────────────────────────────────────────
const PRIORITY_CFG = {
  urgent: { label:"Urgent", color:"text-red-700",    bg:"bg-red-100",    dot:"bg-red-500"    },
  high:   { label:"High",   color:"text-amber-700",  bg:"bg-amber-100",  dot:"bg-amber-500"  },
  normal: { label:"Normal", color:"text-slate-600",  bg:"bg-slate-100",  dot:"bg-slate-400"  },
};
const DOC_STATUS_CFG = {
  verified: { label:"Verified", color:"text-emerald-700", bg:"bg-emerald-50", border:"border-emerald-200", Icon:CheckCircle2 },
  uploaded: { label:"Uploaded", color:"text-blue-700",    bg:"bg-blue-50",    border:"border-blue-200",    Icon:Upload        },
  rejected: { label:"Rejected", color:"text-red-700",     bg:"bg-red-50",     border:"border-red-200",     Icon:XCircle       },
  missing:  { label:"Missing",  color:"text-slate-500",   bg:"bg-slate-50",   border:"border-slate-200",   Icon:AlertCircle   },
};
const STAGE_COLOR: Partial<Record<VisaStage, { bg: string; dot: string }>> = {
  inquiry:      { bg:"bg-slate-100",   dot:"#94A3B8" },
  ocr:          { bg:"bg-slate-100",   dot:"#64748B" },
  checklist:    { bg:"bg-blue-100",    dot:"#3B82F6" },
  documents:    { bg:"bg-blue-100",    dot:"#2563EB" },
  validation:   { bg:"bg-cyan-100",    dot:"#06B6D4" },
  invoice:      { bg:"bg-violet-100",  dot:"#8B5CF6" },
  payment:      { bg:"bg-violet-100",  dot:"#7C3AED" },
  assigned:     { bg:"bg-amber-100",   dot:"#F59E0B" },
  submission:   { bg:"bg-amber-100",   dot:"#D97706" },
  processing:   { bg:"bg-orange-100",  dot:"#EA580C" },
  interview:    { bg:"bg-orange-100",  dot:"#C2410C" },
  approved:     { bg:"bg-emerald-100", dot:"#10B981" },
  passport_recv:{ bg:"bg-emerald-100", dot:"#059669" },
  delivery:     { bg:"bg-emerald-100", dot:"#047857" },
  archive:      { bg:"bg-slate-100",   dot:"#475569" },
};

function StageBadge({ stage }: { stage: VisaStage }) {
  const s = VISA_STAGES.find(v => v.key === stage)!;
  const c = STAGE_COLOR[stage] ?? { bg:"bg-slate-100", dot:"#94A3B8" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9.5px] font-bold ${c.bg} text-slate-700`}>
      <span className="size-[5px] rounded-full" style={{ backgroundColor:c.dot }} />
      {s.short}
    </span>
  );
}

function StatusBadge({ status, labels }: { status: string; labels: Record<string, { label: string; color: string; bg: string }> }) {
  const cfg = labels[status] ?? { label:status, color:"text-slate-600", bg:"bg-slate-100" };
  return <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>;
}

// ── Module Tabs ───────────────────────────────────────────────────────────────
type ModTab = "tracker"|"embassies"|"visa_types"|"checklists"|"doc_review"|"verification"|"interviews"|"biometric"|"submissions"|"outcomes"|"delivery";
const MOD_TABS: { key: ModTab; label: string }[] = [
  { key:"tracker",     label:"Processing Tracker" },
  { key:"embassies",   label:"Countries & Embassies" },
  { key:"visa_types",  label:"Visa Types Config" },
  { key:"checklists",  label:"Checklist Builder" },
  { key:"doc_review",  label:"Document Review" },
  { key:"verification",label:"Verification" },
  { key:"interviews",  label:"Interview Scheduler" },
  { key:"biometric",   label:"Biometric Log" },
  { key:"submissions", label:"Embassy Submissions" },
  { key:"outcomes",    label:"Outcomes" },
  { key:"delivery",    label:"Collection & Delivery" },
];

// ── Processing Tracker (Kanban) ───────────────────────────────────────────────
const KANBAN_COLS: { key: VisaStage; short: string }[] = VISA_STAGES.slice(0, 12).map(s => ({ key:s.key, short:s.short }));

function AppCard({ app }: { app: VisaApplication }) {
  const pc = PRIORITY_CFG[app.priority];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer">
      <div className="flex items-start justify-between gap-1 mb-1">
        <p className="text-[10.5px] font-bold text-slate-800 leading-snug">{app.applicantName}</p>
        <span className={`size-1.5 rounded-full flex-shrink-0 mt-1 ${pc.dot}`} title={pc.label} />
      </div>
      <p className="text-[9px] text-slate-500 font-mono">{app.ref}</p>
      <p className="text-[9.5px] text-slate-500 mt-1">{app.visaType} → {app.destination}</p>
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
        <span className="text-[9px] font-mono text-slate-500">{fmtAED(app.fee)}</span>
        <div className="size-4 rounded-full bg-amber-100 text-amber-700 text-[7.5px] font-black flex items-center justify-center">
          {app.assignedTo.split(" ").map(n=>n[0]).join("").slice(0,2)}
        </div>
      </div>
    </div>
  );
}

function TrackerTab() {
  const [search, setSearch] = useState("");
  const apps = VISA_APPS.filter(a => !search || a.applicantName.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">{apps.length} Applications in Pipeline</p>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search applicant…"
            className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[11px] w-44 focus:outline-none focus:border-amber-400 bg-white"/>
        </div>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-4 -mx-1 px-1">
        {KANBAN_COLS.map(col => {
          const colApps = apps.filter(a => a.stage === col.key);
          const sc = STAGE_COLOR[col.key] ?? { bg:"bg-slate-50", dot:"#94A3B8" };
          return (
            <div key={col.key} className="flex-shrink-0 w-[185px]">
              <div className="flex items-center gap-1.5 mb-2 px-0.5">
                <span className="size-1.5 rounded-full" style={{ backgroundColor:sc.dot }} />
                <span className="text-[9.5px] font-bold text-slate-600">{col.short}</span>
                <span className="text-[9px] text-slate-400 font-mono ml-auto">{colApps.length}</span>
              </div>
              <div className="space-y-1.5 min-h-[60px]">
                {colApps.map(a => <AppCard key={a.id} app={a} />)}
                {colApps.length === 0 && (
                  <div className="h-12 border-dashed border-2 border-slate-200 rounded-xl flex items-center justify-center">
                    <span className="text-[8.5px] text-slate-300">Empty</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Embassies ─────────────────────────────────────────────────────────────────
const EMBASSY_STATUS = {
  operational: { label:"Operational", color:"text-emerald-700", bg:"bg-emerald-100" },
  limited:     { label:"Limited",     color:"text-amber-700",   bg:"bg-amber-100"   },
  closed:      { label:"Closed",      color:"text-red-700",     bg:"bg-red-100"     },
};
function EmbassiesTab() {
  const [search, setSearch] = useState("");
  const items = EMBASSIES.filter(e => !search || e.country.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">{EMBASSIES.length} Embassies & Consulates</p>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search country…"
              className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[11px] w-40 focus:outline-none focus:border-amber-400 bg-white"/>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">
            <Plus size={11}/> Add Embassy
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Country","Embassy / Consulate","Address","Phone","Hours","Visa Types","Status",""].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((e, i) => {
              const sc = EMBASSY_STATUS[e.status];
              return (
                <tr key={e.id} className={`border-b border-slate-100 hover:bg-amber-50/30 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5">
                    <span className="text-[16px]">{e.flag}</span>
                    <span className="ml-2 font-semibold text-slate-800">{e.country}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 font-semibold">{e.embassyName}</td>
                  <td className="px-3 py-2.5 text-slate-500 max-w-[130px] truncate text-[10px]">{e.address}</td>
                  <td className="px-3 py-2.5 text-slate-500 font-mono text-[9.5px]">{e.phone}</td>
                  <td className="px-3 py-2.5 text-slate-500 text-[9.5px]">{e.hours}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-0.5">
                      {e.visaTypes.slice(0,2).map(vt => (
                        <span key={vt} className="text-[8px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{vt}</span>
                      ))}
                      {e.visaTypes.length > 2 && <span className="text-[8px] text-slate-400">+{e.visaTypes.length-2}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <button className="text-slate-400 hover:text-amber-500 transition-colors"><MoreHorizontal size={14}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Visa Types Config ─────────────────────────────────────────────────────────
const VISA_TYPES_LIST = [
  { id:"vt1",  country:"🇬🇧 UK",     type:"Standard Visitor",  category:"Tourist/Business", fee:735,  processing:"15-21 days", validity:"6 months",  apps:8,  active:true  },
  { id:"vt2",  country:"🇪🇺 Schengen",type:"Short Stay C",      category:"Tourist/Business", fee:330,  processing:"10-15 days", validity:"90/180 days",apps:12, active:true  },
  { id:"vt3",  country:"🇺🇸 USA",     type:"B1/B2 Visitor",     category:"Tourist/Business", fee:600,  processing:"30-90 days", validity:"10 years",  apps:6,  active:true  },
  { id:"vt4",  country:"🇨🇦 Canada",  type:"Temporary Resident",category:"Visitor",          fee:420,  processing:"14-21 days", validity:"10 years",  apps:4,  active:true  },
  { id:"vt5",  country:"🇦🇺 Australia",type:"Tourist 600",       category:"Tourist",          fee:505,  processing:"20-40 days", validity:"12 months", apps:3,  active:true  },
  { id:"vt6",  country:"🇦🇪 UAE",     type:"Visit Visa 60 days",category:"Visit",            fee:400,  processing:"3-5 days",   validity:"60 days",   apps:22, active:true  },
  { id:"vt7",  country:"🇯🇵 Japan",   type:"Short-Stay Tourist", category:"Tourist",         fee:330,  processing:"5-10 days",  validity:"5 years",   apps:2,  active:true  },
  { id:"vt8",  country:"🇦🇪 UAE",     type:"Golden Visa Investor",category:"Residence",      fee:8500, processing:"30-60 days", validity:"10 years",  apps:1,  active:true  },
];
function VisaTypesTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">{VISA_TYPES_LIST.length} Visa Types Configured</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">
          <Plus size={11}/> Add Visa Type
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Country","Visa Type","Category","Fee (AED)","Processing","Validity","Active Apps","Status",""].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VISA_TYPES_LIST.map((v, i) => (
              <tr key={v.id} className={`border-b border-slate-100 hover:bg-amber-50/30 ${i%2?"bg-slate-50/30":""}`}>
                <td className="px-3 py-2.5 font-semibold text-slate-700">{v.country}</td>
                <td className="px-3 py-2.5 font-bold text-slate-800">{v.type}</td>
                <td className="px-3 py-2.5"><span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">{v.category}</span></td>
                <td className="px-3 py-2.5 font-mono font-bold text-slate-700">{v.fee.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-slate-500">{v.processing}</td>
                <td className="px-3 py-2.5 text-slate-500">{v.validity}</td>
                <td className="px-3 py-2.5 text-center font-bold text-slate-700">{v.apps}</td>
                <td className="px-3 py-2.5">
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${v.active?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-500"}`}>
                    {v.active?"Active":"Inactive"}
                  </span>
                </td>
                <td className="px-3 py-2.5"><button className="text-slate-400 hover:text-amber-500"><MoreHorizontal size={13}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Checklist Builder ─────────────────────────────────────────────────────────
function ChecklistTab() {
  const [selected, setSelected] = useState(CHECKLISTS[0]);
  return (
    <div className="grid grid-cols-[260px_1fr] gap-5">
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Select Visa Type</p>
        {CHECKLISTS.map(cl => (
          <button key={cl.id} onClick={() => setSelected(cl)}
            className={`w-full text-left px-3 py-2.5 rounded-xl border text-[11px] font-semibold transition-all
              ${selected.id === cl.id ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-slate-200 text-slate-700 hover:border-amber-200"}`}>
            <p className="font-bold">{cl.visaType}</p>
            <p className="text-[9.5px] font-normal text-slate-400 mt-0.5">{cl.destination}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{cl.documents.length} documents</p>
          </button>
        ))}
        <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-dashed border-slate-200 text-slate-400 text-[10.5px] font-semibold rounded-xl hover:border-amber-300 hover:text-amber-500 transition-colors">
          <Plus size={11}/> New Checklist
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-bold text-slate-800">{selected.visaType}</h3>
            <p className="text-[10px] text-slate-400">{selected.destination} · {selected.documents.length} documents</p>
          </div>
          <button className="px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">Save Changes</button>
        </div>
        <div className="space-y-2">
          {selected.documents.map((doc, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-200 transition-colors group">
              <div className={`size-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center ${doc.required ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                {doc.required ? <AlertTriangle size={9}/> : <CheckSquare size={9}/>}
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-slate-800">{doc.name}</p>
                {doc.notes && <p className="text-[9.5px] text-slate-400 mt-0.5">{doc.notes}</p>}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${doc.required ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                  {doc.required ? "Required" : "Optional"}
                </span>
                <button className="text-slate-400 hover:text-red-500 transition-colors"><XCircle size={12}/></button>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full flex items-center justify-center gap-1.5 mt-3 py-2 border-2 border-dashed border-slate-200 text-slate-400 text-[10.5px] font-semibold rounded-xl hover:border-amber-300 hover:text-amber-500 transition-colors">
          <Plus size={11}/> Add Document Requirement
        </button>
      </div>
    </div>
  );
}

// ── Document Review ───────────────────────────────────────────────────────────
function DocReviewTab() {
  const [selected, setSelected] = useState<VisaApplication>(VISA_APPS[0]);
  const withDocs = VISA_APPS.filter(a => a.documents.length > 0);
  return (
    <div className="grid grid-cols-[260px_1fr] gap-4 h-full">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
          <p className="text-[9.5px] font-bold text-slate-500 uppercase">Applications with Docs</p>
        </div>
        <div className="overflow-y-auto flex-1">
          {withDocs.map(app => (
            <button key={app.id} onClick={() => setSelected(app)}
              className={`w-full text-left px-3 py-2.5 border-b border-slate-100 transition-colors ${selected.id===app.id?"bg-amber-50":"hover:bg-slate-50"}`}>
              <p className="text-[10.5px] font-bold text-slate-800">{app.applicantName}</p>
              <p className="text-[9px] text-slate-400 font-mono">{app.ref} · {app.visaType}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {["verified","uploaded","missing","rejected"].map(s => {
                  const cnt = app.documents.filter(d => d.status === s).length;
                  if (!cnt) return null;
                  const cfg = DOC_STATUS_CFG[s as keyof typeof DOC_STATUS_CFG];
                  return <span key={s} className={`text-[8px] font-bold px-1 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cnt} {s}</span>;
                })}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-bold text-slate-800">{selected.applicantName}</h3>
            <p className="text-[10px] text-slate-400">{selected.ref} · {selected.visaType} → {selected.destination}</p>
          </div>
          <StageBadge stage={selected.stage}/>
        </div>
        <div className="space-y-2">
          {selected.documents.map((doc, i) => {
            const cfg = DOC_STATUS_CFG[doc.status];
            const Icon = cfg.Icon;
            return (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                <Icon size={14} className={cfg.color}/>
                <p className="flex-1 text-[11px] font-semibold text-slate-800">{doc.name}</p>
                <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{cfg.label}</span>
                <div className="flex gap-1.5">
                  <button className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded hover:bg-emerald-200">Verify</button>
                  <button className="px-2 py-1 bg-red-100 text-red-700 text-[9px] font-bold rounded hover:bg-red-200">Flag</button>
                  <button className="px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-semibold rounded hover:bg-slate-200">View</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
          <button className="px-4 py-2 bg-emerald-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-emerald-600">Approve All & Advance</button>
          <button className="px-4 py-2 border border-red-200 text-red-600 text-[10.5px] font-semibold rounded-lg hover:bg-red-50">Flag Application</button>
        </div>
      </div>
    </div>
  );
}

// ── Verification ──────────────────────────────────────────────────────────────
function VerificationTab() {
  const allDocs = VISA_APPS.flatMap(a => a.documents.map(d => ({ ...d, ref:a.ref, applicant:a.applicantName, visaType:a.visaType })));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">{allDocs.length} Documents Across All Applications</p>
        <div className="flex gap-2">
          {["All","Uploaded","Missing","Rejected"].map(f => (
            <button key={f} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${f==="All"?"bg-amber-500 text-white":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{f}</button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Document","Application","Applicant","Visa Type","Status","Actions"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allDocs.slice(0, 18).map((d, i) => {
              const cfg = DOC_STATUS_CFG[d.status as keyof typeof DOC_STATUS_CFG];
              const Icon = cfg.Icon;
              return (
                <tr key={i} className={`border-b border-slate-100 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{d.name}</td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{d.ref}</td>
                  <td className="px-3 py-2.5 text-slate-700">{d.applicant}</td>
                  <td className="px-3 py-2.5 text-slate-500">{d.visaType}</td>
                  <td className="px-3 py-2.5">
                    <span className={`flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded w-fit ${cfg.bg} ${cfg.color}`}>
                      <Icon size={9}/>{cfg.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1.5">
                      <button className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded hover:bg-emerald-200">✓ Verify</button>
                      <button className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded hover:bg-red-200">✗ Flag</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Interview Scheduler ───────────────────────────────────────────────────────
const INT_STATUS_CFG = {
  scheduled:   { label:"Scheduled",   color:"text-blue-700",    bg:"bg-blue-100"    },
  completed:   { label:"Completed",   color:"text-emerald-700", bg:"bg-emerald-100" },
  no_show:     { label:"No Show",     color:"text-red-700",     bg:"bg-red-100"     },
  rescheduled: { label:"Rescheduled", color:"text-amber-700",   bg:"bg-amber-100"   },
};
function InterviewsTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">{INTERVIEWS.length} Interviews Scheduled</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">
          <Calendar size={11}/> Schedule Interview
        </button>
      </div>
      <div className="space-y-2">
        {INTERVIEWS.map(iv => {
          const sc = INT_STATUS_CFG[iv.status];
          return (
            <div key={iv.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Calendar size={15}/>
              </div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{iv.applicantName}</p>
                <p className="text-[10px] text-slate-500">{iv.visaType} · {iv.embassy}</p>
                <p className="text-[9.5px] text-slate-400 mt-0.5 font-mono">{iv.appRef}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-700">{iv.scheduledAt}</p>
              </div>
              <span className={`text-[9.5px] font-bold px-2.5 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span>
              <div className="flex gap-1.5">
                <button className="px-2.5 py-1 border border-slate-200 text-[9.5px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50">Reschedule</button>
                <button className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[9.5px] font-bold rounded-lg hover:bg-emerald-200">Mark Done</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Biometric Log ─────────────────────────────────────────────────────────────
const BIO_STATUS_CFG = {
  pending:   { label:"Pending",   color:"text-amber-700",   bg:"bg-amber-100"   },
  completed: { label:"Completed", color:"text-emerald-700", bg:"bg-emerald-100" },
  failed:    { label:"Failed",    color:"text-red-700",     bg:"bg-red-100"     },
};
function BiometricTab() {
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Biometric Capture Log ({BIOMETRIC_LOG.length} records)</p>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["App Ref","Applicant","Nationality","Biometric Type","Appointment","Location","Status"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BIOMETRIC_LOG.map((b, i) => {
              const sc = BIO_STATUS_CFG[b.status];
              return (
                <tr key={b.id} className={`border-b border-slate-100 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{b.appRef}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{b.applicantName}</td>
                  <td className="px-3 py-2.5 text-slate-500">{b.nationality}</td>
                  <td className="px-3 py-2.5 text-slate-600">{b.btype}</td>
                  <td className="px-3 py-2.5 text-slate-500 font-mono text-[9.5px]">{b.appointmentAt}</td>
                  <td className="px-3 py-2.5 text-slate-500">{b.location}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Embassy Submissions ───────────────────────────────────────────────────────
const SUB_STATUS_CFG = {
  submitted:      { label:"Submitted",      color:"text-blue-700",    bg:"bg-blue-100"    },
  acknowledged:   { label:"Acknowledged",   color:"text-cyan-700",    bg:"bg-cyan-100"    },
  processing:     { label:"Processing",     color:"text-amber-700",   bg:"bg-amber-100"   },
  decision_ready: { label:"Decision Ready", color:"text-emerald-700", bg:"bg-emerald-100" },
};
function SubmissionsTab() {
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Embassy Submissions ({SUBMISSIONS.length})</p>
      <div className="space-y-2">
        {SUBMISSIONS.map(s => {
          const sc = SUB_STATUS_CFG[s.status];
          return (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center flex-shrink-0">
                <Globe size={15}/>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[11.5px] font-bold text-slate-800">{s.embassy} — {s.country}</p>
                </div>
                <p className="text-[10px] text-slate-500">{s.visaType} · App: {s.appRef}</p>
                <p className="text-[9px] font-mono text-slate-400 mt-0.5">Tracking: {s.trackingRef}</p>
              </div>
              <div className="text-right text-[9.5px] text-slate-400">
                <p>Submitted: <span className="text-slate-600 font-semibold">{s.submittedAt}</span></p>
                <p>Expected: <span className="text-slate-600 font-semibold">{s.expectedAt}</span></p>
              </div>
              <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg ${sc.bg} ${sc.color}`}>{sc.label}</span>
              {s.status === "decision_ready" && (
                <button className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-lg hover:bg-amber-600">Record Decision</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Outcomes ──────────────────────────────────────────────────────────────────
function OutcomesTab() {
  const decided = VISA_APPS.filter(a => a.decision || a.stage === "approved" || a.stage === "delivery" || a.stage === "archive" || a.stage === "passport_recv");
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Visa Outcomes ({decided.length} decisions)</p>
        <div className="flex gap-3">
          <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-700"><span className="size-2 rounded-full bg-emerald-500"/>{decided.filter(a=>a.decision==="approved").length} Approved</span>
          <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-red-700"><span className="size-2 rounded-full bg-red-500"/>0 Rejected</span>
          <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-amber-700"><span className="size-2 rounded-full bg-amber-500"/>{decided.filter(a=>!a.decision).length} Pending Decision</span>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["App Ref","Applicant","Nationality","Visa Type","Destination","Stage","Decision","Next Step"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {decided.map((a, i) => (
              <tr key={a.id} className={`border-b border-slate-100 ${i%2?"bg-slate-50/30":""}`}>
                <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{a.ref}</td>
                <td className="px-3 py-2.5 font-semibold text-slate-800">{a.applicantName}</td>
                <td className="px-3 py-2.5 text-slate-500">{a.nationality}</td>
                <td className="px-3 py-2.5 text-slate-600">{a.visaType}</td>
                <td className="px-3 py-2.5 text-slate-500">{a.destination}</td>
                <td className="px-3 py-2.5"><StageBadge stage={a.stage}/></td>
                <td className="px-3 py-2.5">
                  {a.decision
                    ? <span className={`flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded w-fit ${a.decision==="approved"?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>
                        {a.decision==="approved"?<CheckCircle2 size={9}/>:<XCircle size={9}/>}
                        {a.decision==="approved"?"Approved":"Rejected"}
                      </span>
                    : <span className="text-[9.5px] text-amber-600 font-bold flex items-center gap-1"><Clock size={9}/>Pending</span>
                  }
                </td>
                <td className="px-3 py-2.5 text-[9.5px] text-slate-400">
                  {a.stage==="approved"?"Collect Passport": a.stage==="passport_recv"?"Schedule Delivery": a.stage==="delivery"?"Confirm Return": a.stage==="archive"?"Archived":"—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Collection & Delivery ─────────────────────────────────────────────────────
const DEL_STATUS_CFG = {
  pending:    { label:"Pending",    color:"text-amber-700",   bg:"bg-amber-100"   },
  dispatched: { label:"Dispatched", color:"text-blue-700",    bg:"bg-blue-100"    },
  completed:  { label:"Completed",  color:"text-emerald-700", bg:"bg-emerald-100" },
  failed:     { label:"Failed",     color:"text-red-700",     bg:"bg-red-100"     },
};
function DeliveryTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Collection & Delivery ({DELIVERIES.length} records)</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">
          <Plus size={11}/> Schedule Delivery
        </button>
      </div>
      <div className="space-y-2">
        {DELIVERIES.map(d => {
          const sc = DEL_STATUS_CFG[d.status];
          return (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className={`size-9 rounded-xl flex items-center justify-center flex-shrink-0 ${d.type==="collection"?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-700"}`}>
                <MapPin size={15}/>
              </div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{d.ownerName}</p>
                <p className="text-[10px] text-slate-500">
                  {d.type==="collection"?"Office Collection":"Home Delivery"}
                  {d.address ? ` — ${d.address}` : ""}
                  {d.driverName ? ` · Driver: ${d.driverName}` : ""}
                </p>
                <p className="text-[9px] font-mono text-slate-400">{d.appRef}</p>
              </div>
              <p className="text-[10px] text-slate-600 font-semibold">{d.scheduledAt}</p>
              <span className={`text-[9.5px] font-bold px-2.5 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span>
              <div className="flex gap-1.5">
                <button className="px-2.5 py-1 border border-slate-200 text-[9.5px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50">Details</button>
                {d.status==="pending"&&<button className="px-2.5 py-1 bg-amber-500 text-white text-[9.5px] font-bold rounded-lg hover:bg-amber-600">Dispatch</button>}
                {d.status==="dispatched"&&<button className="px-2.5 py-1 bg-emerald-500 text-white text-[9.5px] font-bold rounded-lg hover:bg-emerald-600">Confirm</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────
export default function VisaModule() {
  const [tab, setTab] = useState<ModTab>("tracker");
  const active  = VISA_APPS.filter(a => !["archive","delivery"].includes(a.stage)).length;
  const urgent  = VISA_APPS.filter(a => a.priority === "urgent").length;
  const pending = SUBMISSIONS.filter(s => s.status !== "decision_ready").length;
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[17px] font-bold text-slate-800">Visa Management</h1>
            <p className="text-[10.5px] text-slate-400 mt-0.5">{VISA_APPS.length} total · {active} active · {urgent} urgent</p>
          </div>
          <div className="flex items-center gap-2.5">
            {urgent > 0 && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold rounded-lg"><AlertTriangle size={11}/>{urgent} Urgent</span>}
            {pending > 0 && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-lg"><Clock size={11}/>{pending} Pending</span>}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">
              <Plus size={11}/> New Application
            </button>
          </div>
        </div>
        <div className="flex gap-0 overflow-x-auto">
          {MOD_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3.5 py-2.5 text-[10.5px] font-semibold border-b-2 whitespace-nowrap transition-all flex-shrink-0
                ${tab===t.key?"border-amber-500 text-amber-600":"border-transparent text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
        {tab==="tracker"      && <TrackerTab/>}
        {tab==="embassies"    && <EmbassiesTab/>}
        {tab==="visa_types"   && <VisaTypesTab/>}
        {tab==="checklists"   && <ChecklistTab/>}
        {tab==="doc_review"   && <DocReviewTab/>}
        {tab==="verification" && <VerificationTab/>}
        {tab==="interviews"   && <InterviewsTab/>}
        {tab==="biometric"    && <BiometricTab/>}
        {tab==="submissions"  && <SubmissionsTab/>}
        {tab==="outcomes"     && <OutcomesTab/>}
        {tab==="delivery"     && <DeliveryTab/>}
      </div>
    </div>
  );
}
