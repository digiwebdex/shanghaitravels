import { useState } from "react";
import { Plus, Search, Globe, Star, CheckCircle2, XCircle, Clock, BookOpen } from "lucide-react";
import {
  UNIVERSITIES, STUDENT_CASES, STUDENT_OFFERS, CAS_TRACKER, VISA_STATUSES,
  STUDENT_ACCOMM, TUITION_PAYMENTS, StudentCase, fmtAED,
} from "./data";
import { PipelineKanban, PipelineStage, PipelineCard } from "../shared/PipelineKanban";

type ModTab = "universities"|"pipeline"|"offers"|"cas"|"visa"|"accommodation"|"tuition"|"reports";
const MOD_TABS: { key: ModTab; label: string }[] = [
  { key:"universities",  label:"University Directory" },
  { key:"pipeline",      label:"Admission Pipeline"   },
  { key:"offers",        label:"Offer Letter Tracker" },
  { key:"cas",           label:"CAS/I-20 Tracker"     },
  { key:"visa",          label:"Visa Status"          },
  { key:"accommodation", label:"Accommodation"        },
  { key:"tuition",       label:"Tuition Payment"      },
  { key:"reports",       label:"Report"               },
];

const ADMISSION_PIPELINE: PipelineStage[] = [
  { key:"inquiry",       label:"Inquiry",       color:"bg-slate-400",   textColor:"text-slate-600"   },
  { key:"applied",       label:"Applied",       color:"bg-blue-400",    textColor:"text-blue-700"    },
  { key:"offer",         label:"Offer",         color:"bg-purple-400",  textColor:"text-purple-700"  },
  { key:"cas_i20",       label:"CAS/I-20",      color:"bg-amber-400",   textColor:"text-amber-700"   },
  { key:"visa",          label:"Visa",          color:"bg-orange-400",  textColor:"text-orange-700"  },
  { key:"accommodation", label:"Accommodation", color:"bg-teal-400",    textColor:"text-teal-700"    },
  { key:"tuition_paid",  label:"Tuition Paid",  color:"bg-emerald-500", textColor:"text-emerald-700" },
  { key:"enrolled",      label:"Enrolled",      color:"bg-green-600",   textColor:"text-green-800"   },
];

const STAGE_CFG: Record<string,{bg:string;color:string;label:string}> = {
  inquiry:       { bg:"bg-slate-100",   color:"text-slate-500",   label:"Inquiry"       },
  applied:       { bg:"bg-blue-100",    color:"text-blue-700",    label:"Applied"       },
  offer:         { bg:"bg-purple-100",  color:"text-purple-700",  label:"Offer"         },
  cas_i20:       { bg:"bg-amber-100",   color:"text-amber-700",   label:"CAS/I-20"      },
  visa:          { bg:"bg-orange-100",  color:"text-orange-700",  label:"Visa"          },
  accommodation: { bg:"bg-teal-100",    color:"text-teal-700",    label:"Accommodation" },
  tuition_paid:  { bg:"bg-emerald-100", color:"text-emerald-700", label:"Tuition Paid"  },
  enrolled:      { bg:"bg-green-100",   color:"text-green-700",   label:"Enrolled"      },
  rejected:      { bg:"bg-red-100",     color:"text-red-700",     label:"Rejected"      },
  withdrawn:     { bg:"bg-slate-100",   color:"text-slate-500",   label:"Withdrawn"     },
};

// ── University Directory ──────────────────────────────────────────────────────
function UniversitiesTab() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All");
  const countries = ["All", ...Array.from(new Set(UNIVERSITIES.map(u=>u.country)))];
  const shown = UNIVERSITIES.filter(u =>
    (country==="All" || u.country===country) &&
    (!search || u.name.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search universities…" className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10.5px] focus:outline-none focus:border-amber-400 bg-white w-full"/>
        </div>
        <div className="flex gap-1.5">
          {countries.map(c => (
            <button key={c} onClick={() => setCountry(c)}
              className={`px-2.5 py-1 text-[9.5px] font-semibold rounded-lg border transition-colors ${country===c?"bg-amber-500 text-white border-amber-500":"bg-white text-slate-500 border-slate-200 hover:border-amber-300"}`}>{c}</button>
          ))}
        </div>
        <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> Add University</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["University","Country","Ranking","Type","Tuition","Acceptance","IELTS","Intakes","Consult Fee",""].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((u, i) => (
              <tr key={u.id} className={`border-b border-slate-100 hover:bg-amber-50/30 ${i%2?"bg-slate-50/30":""}`}>
                <td className="px-3 py-2.5">
                  <p className="font-semibold text-slate-800">{u.name}</p>
                  <p className="text-[9px] text-slate-400">{u.city}</p>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1"><Globe size={9} className="text-slate-400"/><span className="text-slate-600">{u.country}</span></div>
                </td>
                <td className="px-3 py-2.5 font-bold text-slate-700">#{u.ranking}</td>
                <td className="px-3 py-2.5 capitalize text-slate-500">{u.type}</td>
                <td className="px-3 py-2.5 text-slate-500 text-[10px]">{u.tuitionRange}</td>
                <td className="px-3 py-2.5"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${parseInt(u.acceptanceRate)<30?"bg-red-100 text-red-700":parseInt(u.acceptanceRate)<55?"bg-amber-100 text-amber-700":"bg-emerald-100 text-emerald-700"}`}>{u.acceptanceRate}</span></td>
                <td className="px-3 py-2.5 font-mono font-bold text-slate-700">{u.requirementsIELTS}</td>
                <td className="px-3 py-2.5"><div className="flex flex-wrap gap-0.5">{u.intakes.map(it => <span key={it} className="text-[8px] font-semibold px-1 py-0.5 bg-blue-50 text-blue-700 rounded">{it}</span>)}</div></td>
                <td className="px-3 py-2.5 font-mono font-bold text-amber-600">{fmtAED(u.consultFee)}</td>
                <td className="px-3 py-2.5"><button className="text-[9.5px] text-amber-600 font-bold hover:text-amber-700">Apply</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Admission Pipeline Tab ────────────────────────────────────────────────────
function PipelineTab({ onSelect }: { onSelect: (c: StudentCase) => void }) {
  const pipelineCards: PipelineCard[] = STUDENT_CASES
    .filter(c => !["rejected","withdrawn"].includes(c.stage))
    .map(c => ({
      id: c.id, stage: c.stage, title: c.studentName,
      subtitle: `${c.targetUniversity}`,
      meta: `${c.course} · ${c.intake}`,
      badge: c.nationality,
      badgeColor: "bg-slate-100 text-slate-500",
    }));
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Admission Pipeline ({STUDENT_CASES.filter(c => !["rejected","withdrawn"].includes(c.stage)).length} active)</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Case</button>
      </div>
      <div className="overflow-x-auto">
        <PipelineKanban
          stages={ADMISSION_PIPELINE}
          cards={pipelineCards}
          onCardClick={card => { const sc = STUDENT_CASES.find(c=>c.id===card.id); if(sc) onSelect(sc); }}
          columnWidth={185}
        />
      </div>
    </div>
  );
}

// ── Offer Letters Tab ─────────────────────────────────────────────────────────
function OffersTab() {
  const STATUS_CFG: Record<string,{bg:string;color:string;label:string}> = {
    awaited:   { bg:"bg-amber-100",   color:"text-amber-700",   label:"Awaited"      },
    received:  { bg:"bg-blue-100",    color:"text-blue-700",    label:"Received"     },
    accepted:  { bg:"bg-emerald-100", color:"text-emerald-700", label:"Accepted"     },
    declined:  { bg:"bg-slate-100",   color:"text-slate-500",   label:"Declined"     },
    expired:   { bg:"bg-red-100",     color:"text-red-700",     label:"Expired"      },
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Offer Letters ({STUDENT_OFFERS.length})</p>
      </div>
      <div className="space-y-3">
        {STUDENT_OFFERS.map(offer => {
          const sc = STATUS_CFG[offer.status];
          return (
            <div key={offer.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0"><BookOpen size={14}/></div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{offer.studentName}</p>
                <p className="text-[10px] text-slate-500">{offer.university} · {offer.course}</p>
                <p className="text-[9.5px] text-slate-400">Intake: {offer.intake} · {offer.conditionalOrUnconditional}</p>
                {offer.conditions && <p className="text-[9px] text-amber-600 font-semibold mt-0.5">⚠ Condition: {offer.conditions}</p>}
              </div>
              <div className="text-right text-[9.5px] text-slate-400">
                {offer.receivedDate && <p>Received: {offer.receivedDate}</p>}
                {offer.expiryDate && <p>Expires: {offer.expiryDate}</p>}
              </div>
              <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg ${sc.bg} ${sc.color}`}>{sc.label}</span>
              {offer.status==="received" && <button className="px-3 py-1.5 bg-emerald-500 text-white text-[9.5px] font-bold rounded-lg hover:bg-emerald-600">Accept</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CAS / I-20 Tracker ────────────────────────────────────────────────────────
function CASTab() {
  const STATUS_CFG: Record<string,{icon:typeof CheckCircle2;color:string;label:string}> = {
    not_requested: { icon:Clock,         color:"text-slate-300",  label:"Not Requested" },
    requested:     { icon:Clock,         color:"text-amber-500",  label:"Requested"     },
    issued:        { icon:CheckCircle2,  color:"text-emerald-500",label:"Issued"        },
    expired:       { icon:XCircle,       color:"text-red-500",    label:"Expired"       },
  };
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">CAS / I-20 / CoE Tracker ({CAS_TRACKER.length})</p>
      <div className="space-y-3">
        {CAS_TRACKER.map(cas => {
          const sc = STATUS_CFG[cas.casStatus];
          const Icon = sc.icon;
          return (
            <div key={cas.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[11px] font-bold">{cas.type}</div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{cas.studentName}</p>
                <p className="text-[10px] text-slate-500">{cas.university}</p>
                {cas.casNumber && <p className="text-[9.5px] font-mono text-slate-400">{cas.casNumber}</p>}
              </div>
              <div className="text-right text-[9.5px] text-slate-400">
                {cas.issuedDate && <p>Issued: {cas.issuedDate}</p>}
                {cas.expiryDate && <p>Expires: {cas.expiryDate}</p>}
              </div>
              <div className="flex items-center gap-1.5">
                <Icon size={14} className={sc.color}/>
                <span className="text-[9.5px] font-bold text-slate-600">{sc.label}</span>
              </div>
              {cas.casStatus==="not_requested" && <button className="px-3 py-1.5 bg-blue-500 text-white text-[9.5px] font-bold rounded-lg hover:bg-blue-600">Request</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Visa Status Tab ───────────────────────────────────────────────────────────
function VisaTab() {
  const STATUS_CFG: Record<string,{bg:string;color:string;label:string}> = {
    not_started:         { bg:"bg-slate-100",   color:"text-slate-500",   label:"Not Started"     },
    documents_gathering: { bg:"bg-amber-100",   color:"text-amber-700",   label:"Gathering Docs"  },
    appointment_booked:  { bg:"bg-blue-100",    color:"text-blue-700",    label:"Appointment Set" },
    submitted:           { bg:"bg-purple-100",  color:"text-purple-700",  label:"Submitted"       },
    approved:            { bg:"bg-emerald-100", color:"text-emerald-700", label:"Approved"        },
    refused:             { bg:"bg-red-100",     color:"text-red-700",     label:"Refused"         },
    reapplying:          { bg:"bg-amber-100",   color:"text-amber-700",   label:"Reapplying"      },
  };
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Student Visa Status ({VISA_STATUSES.length})</p>
      <div className="space-y-3">
        {VISA_STATUSES.map(vs => {
          const sc = STATUS_CFG[vs.status];
          return (
            <div key={vs.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center flex-shrink-0 text-[9px] font-bold">VISA</div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{vs.studentName}</p>
                <p className="text-[10px] text-slate-500">{vs.visaType.replace("student_","").toUpperCase()} Student Visa</p>
                {vs.appointmentDate && <p className="text-[9.5px] text-slate-400">Appointment: {vs.appointmentDate}</p>}
              </div>
              {vs.visaNo && (
                <div className="text-right">
                  <p className="text-[9px] text-slate-400">Visa No</p>
                  <p className="font-mono font-bold text-[10px] text-slate-700">{vs.visaNo}</p>
                  {vs.validTo && <p className="text-[9px] text-slate-400">Until: {vs.validTo}</p>}
                </div>
              )}
              <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg ${sc.bg} ${sc.color}`}>{sc.label}</span>
              {vs.status==="not_started" && <button className="px-3 py-1.5 bg-amber-500 text-white text-[9.5px] font-bold rounded-lg hover:bg-amber-600">Start</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Accommodation Tab ─────────────────────────────────────────────────────────
function AccommodationTab() {
  const STATUS_CFG: Record<string,{bg:string;color:string;label:string}> = {
    searching:  { bg:"bg-amber-100",   color:"text-amber-700",   label:"Searching"  },
    shortlisted:{ bg:"bg-blue-100",    color:"text-blue-700",    label:"Shortlisted"},
    booked:     { bg:"bg-purple-100",  color:"text-purple-700",  label:"Booked"     },
    confirmed:  { bg:"bg-emerald-100", color:"text-emerald-700", label:"Confirmed"  },
  };
  const TYPE_LABELS: Record<string,string> = {
    university_halls:"University Halls", private_student:"Private Student",
    homestay:"Homestay", shared_flat:"Shared Flat",
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Accommodation Bookings ({STUDENT_ACCOMM.length})</p>
      </div>
      <div className="space-y-3">
        {STUDENT_ACCOMM.map(acc => {
          const sc = STATUS_CFG[acc.status];
          return (
            <div key={acc.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 text-[9px] font-bold">🏠</div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{acc.studentName}</p>
                <p className="text-[10px] text-slate-500">{acc.providerName} · {acc.city} · {acc.roomType}</p>
                <p className="text-[9.5px] text-slate-400">{acc.moveInDate} – {acc.contractEnd} · {TYPE_LABELS[acc.type]}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-slate-800">£{acc.weeklyRent}<span className="text-[9px] text-slate-400 font-normal">/wk</span></p>
              </div>
              <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg ${sc.bg} ${sc.color}`}>{sc.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tuition Payments Tab ──────────────────────────────────────────────────────
function TuitionTab() {
  const STATUS_CFG: Record<string,{bg:string;color:string;label:string}> = {
    unpaid:     { bg:"bg-amber-100",   color:"text-amber-700",   label:"Unpaid"     },
    processing: { bg:"bg-blue-100",    color:"text-blue-700",    label:"Processing" },
    paid:       { bg:"bg-emerald-100", color:"text-emerald-700", label:"Paid"       },
    overdue:    { bg:"bg-red-100",     color:"text-red-700",     label:"Overdue"    },
  };
  const totalAED = TUITION_PAYMENTS.reduce((s,p) => s+p.amountAED, 0);
  const paidAED  = TUITION_PAYMENTS.filter(p=>p.status==="paid").reduce((s,p) => s+p.amountAED, 0);
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[["Total Due",fmtAED(totalAED),"text-slate-700"],["Paid",fmtAED(paidAED),"text-emerald-600"],["Outstanding",fmtAED(totalAED-paidAED),"text-amber-600"]].map(([l,v,c]) => (
          <div key={l} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className={`text-[20px] font-bold font-mono ${c}`}>{v}</p>
            <p className="text-[9.5px] text-slate-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Student","University","Semester","Amount","Currency","AED Equiv","Due Date","Paid Date","Method","Status"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TUITION_PAYMENTS.map((p, i) => {
              const sc = STATUS_CFG[p.status];
              return (
                <tr key={p.id} className={`border-b border-slate-100 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{p.studentName}</td>
                  <td className="px-3 py-2.5 text-slate-500 max-w-[140px] truncate">{p.university}</td>
                  <td className="px-3 py-2.5 text-slate-500">{p.semester}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{p.amountDue.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-slate-400">{p.currency}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-700">{fmtAED(p.amountAED)}</td>
                  <td className="px-3 py-2.5 text-slate-500">{p.dueDate}</td>
                  <td className="px-3 py-2.5 text-slate-400">{p.paidDate ?? "—"}</td>
                  <td className="px-3 py-2.5 capitalize text-slate-400">{p.method?.replace("_"," ") ?? "—"}</td>
                  <td className="px-3 py-2.5"><span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab() {
  const byStageCounts = ADMISSION_PIPELINE.map(s => ({
    ...s, count: STUDENT_CASES.filter(c=>c.stage===s.key).length
  }));
  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[["Total Cases",String(STUDENT_CASES.length)],["Active",String(STUDENT_CASES.filter(c=>!["enrolled","rejected","withdrawn"].includes(c.stage)).length)],["Enrolled",String(STUDENT_CASES.filter(c=>c.stage==="enrolled").length)],["Revenue",fmtAED(TUITION_PAYMENTS.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amountAED,0))]].map(([l,v]) => (
          <div key={l} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-[22px] font-bold font-mono text-slate-800">{v}</p>
            <p className="text-[9.5px] text-slate-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Pipeline Distribution</p>
          {byStageCounts.map(s => (
            <div key={s.key} className="flex items-center gap-3 mb-2">
              <div className={`size-2.5 rounded-full ${s.color}`}/>
              <span className="text-[10px] text-slate-600 flex-1">{s.label}</span>
              <span className="text-[10px] font-bold text-slate-800">{s.count}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Top Destinations</p>
          {[["UK",2],["Australia",2],["Canada",1],["USA",1],["Germany",1]].map(([c,n]) => (
            <div key={String(c)} className="flex items-center gap-3 mb-2">
              <Globe size={10} className="text-slate-400"/>
              <span className="text-[10px] text-slate-600 flex-1">{c}</span>
              <div className="w-24 h-1.5 bg-slate-100 rounded-full">
                <div className="h-full rounded-full bg-amber-400" style={{width:`${(Number(n)/STUDENT_CASES.length)*100}%`}}/>
              </div>
              <span className="text-[10px] font-bold text-slate-800">{n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────
export default function StudentModule() {
  const [tab, setTab] = useState<ModTab>("universities");
  const [_selectedCase, setSelectedCase] = useState<StudentCase|null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[17px] font-bold text-slate-800">Student Consultancy</h1>
            <p className="text-[10.5px] text-slate-400 mt-0.5">{STUDENT_CASES.length} cases · {UNIVERSITIES.length} partner universities · {STUDENT_CASES.filter(c=>c.stage==="enrolled").length} enrolled</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Case</button>
        </div>
        <div className="flex gap-0 overflow-x-auto">
          {MOD_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3.5 py-2.5 text-[10.5px] font-semibold border-b-2 whitespace-nowrap transition-all flex-shrink-0
                ${tab===t.key?"border-amber-500 text-amber-600":"border-transparent text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
        {tab==="universities"  && <UniversitiesTab/>}
        {tab==="pipeline"      && <PipelineTab onSelect={c=>{ setSelectedCase(c); }}/>}
        {tab==="offers"        && <OffersTab/>}
        {tab==="cas"           && <CASTab/>}
        {tab==="visa"          && <VisaTab/>}
        {tab==="accommodation" && <AccommodationTab/>}
        {tab==="tuition"       && <TuitionTab/>}
        {tab==="reports"       && <ReportsTab/>}
      </div>
    </div>
  );
}
