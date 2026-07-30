import { useState } from "react";
import { Plus, Search, Star, Globe, Stethoscope, CheckCircle2, XCircle, Clock, Printer } from "lucide-react";
import {
  HOSPITALS, DOCTORS, MEDICAL_CASES, INVITATION_LETTERS, MEDICAL_VISAS,
  TREATMENT_PLANS, MEDICAL_ACCOMM, TRANSLATORS, MEDICAL_PAYMENTS,
  MedicalCase, fmtAED,
} from "./data";
import { PipelineKanban, PipelineStage, PipelineCard } from "../shared/PipelineKanban";

type ModTab = "hospitals"|"pipeline"|"letters"|"visa"|"treatment"|"accommodation"|"translators"|"transport"|"payments"|"reports";
const MOD_TABS: { key: ModTab; label: string }[] = [
  { key:"hospitals",     label:"Hospital Directory"     },
  { key:"pipeline",      label:"Case Pipeline"          },
  { key:"letters",       label:"Invitation Letter"      },
  { key:"visa",          label:"Medical Visa"           },
  { key:"treatment",     label:"Treatment Plan"         },
  { key:"accommodation", label:"Accommodation"          },
  { key:"translators",   label:"Translators"            },
  { key:"transport",     label:"Transport"              },
  { key:"payments",      label:"Payment"                },
  { key:"reports",       label:"Report"                 },
];

const MEDICAL_PIPELINE: PipelineStage[] = [
  { key:"inquiry",           label:"Inquiry",           color:"bg-slate-400",   textColor:"text-slate-600"   },
  { key:"documents",         label:"Documents",         color:"bg-amber-400",   textColor:"text-amber-700"   },
  { key:"invitation_letter", label:"Inv. Letter",       color:"bg-blue-400",    textColor:"text-blue-700"    },
  { key:"visa_applied",      label:"Visa Applied",      color:"bg-purple-400",  textColor:"text-purple-700"  },
  { key:"visa_approved",     label:"Visa Approved",     color:"bg-indigo-400",  textColor:"text-indigo-700"  },
  { key:"treatment_booked",  label:"Treatment Booked",  color:"bg-teal-400",    textColor:"text-teal-700"    },
  { key:"arrived",           label:"Arrived",           color:"bg-cyan-400",    textColor:"text-cyan-700"    },
  { key:"treatment",         label:"In Treatment",      color:"bg-orange-400",  textColor:"text-orange-700"  },
  { key:"follow_up",         label:"Follow-Up",         color:"bg-amber-500",   textColor:"text-amber-700"   },
  { key:"completed",         label:"Completed",         color:"bg-emerald-500", textColor:"text-emerald-700" },
];

const STAGE_CFG: Record<string,{bg:string;color:string;label:string}> = {
  inquiry:           { bg:"bg-slate-100",   color:"text-slate-500",   label:"Inquiry"          },
  documents:         { bg:"bg-amber-100",   color:"text-amber-700",   label:"Documents"        },
  invitation_letter: { bg:"bg-blue-100",    color:"text-blue-700",    label:"Invitation Letter"},
  visa_applied:      { bg:"bg-purple-100",  color:"text-purple-700",  label:"Visa Applied"     },
  visa_approved:     { bg:"bg-indigo-100",  color:"text-indigo-700",  label:"Visa Approved"    },
  treatment_booked:  { bg:"bg-teal-100",    color:"text-teal-700",    label:"Treatment Booked" },
  arrived:           { bg:"bg-cyan-100",    color:"text-cyan-700",    label:"Arrived"          },
  treatment:         { bg:"bg-orange-100",  color:"text-orange-700",  label:"In Treatment"     },
  follow_up:         { bg:"bg-amber-100",   color:"text-amber-700",   label:"Follow-Up"        },
  completed:         { bg:"bg-emerald-100", color:"text-emerald-700", label:"Completed"        },
  cancelled:         { bg:"bg-red-100",     color:"text-red-700",     label:"Cancelled"        },
};

const CAT_BADGE: Record<string,string> = {
  oncology:"bg-red-100 text-red-700",        cardiology:"bg-rose-100 text-rose-700",
  orthopedics:"bg-orange-100 text-orange-700",fertility:"bg-pink-100 text-pink-700",
  neurology:"bg-purple-100 text-purple-700",  ophthalmology:"bg-blue-100 text-blue-700",
  dental:"bg-sky-100 text-sky-700",           cosmetic:"bg-violet-100 text-violet-700",
  general:"bg-slate-100 text-slate-600",
};

// ── Hospital Directory ────────────────────────────────────────────────────────
function HospitalsTab() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All");
  const countries = ["All", ...Array.from(new Set(HOSPITALS.map(h=>h.country)))];
  const shown = HOSPITALS.filter(h =>
    (country==="All"||h.country===country) &&
    (!search||h.name.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search hospitals…" className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10.5px] focus:outline-none focus:border-amber-400 bg-white w-full"/>
        </div>
        <div className="flex gap-1.5">
          {countries.map(c => (
            <button key={c} onClick={() => setCountry(c)}
              className={`px-2.5 py-1 text-[9.5px] font-semibold rounded-lg border transition-colors ${country===c?"bg-amber-500 text-white border-amber-500":"bg-white text-slate-500 border-slate-200 hover:border-amber-300"}`}>{c}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {shown.map(h => {
          const docs = DOCTORS.filter(d=>d.hospitalId===h.id);
          return (
            <div key={h.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[12px] font-bold text-slate-800">{h.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Globe size={9} className="text-slate-400"/>
                    <p className="text-[10px] text-slate-500">{h.city}, {h.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Star size={10} className="text-amber-400 fill-amber-400"/>
                  <span className="font-bold text-[11px] text-slate-700">{h.rating}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {h.category.map(c => <span key={c} className={`text-[8px] font-bold px-1.5 py-0.5 rounded capitalize ${CAT_BADGE[c]??""}`}>{c}</span>)}
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {h.accreditation.map(a => <span key={a} className="text-[8px] font-semibold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">{a}</span>)}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
                {[["Coordinator",h.coordinatorName],["Phone",h.coordinatorPhone],["Beds",String(h.bedsCount)],["Doctors",String(docs.length)]].map(([l,v]) => (
                  <div key={l} className="bg-slate-50 rounded-lg p-2">
                    <p className="text-[8.5px] font-bold text-slate-400 uppercase">{l}</p>
                    <p className="font-semibold text-slate-700">{v}</p>
                  </div>
                ))}
              </div>
              {docs.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  {docs.map(d => (
                    <div key={d.id} className="flex items-center gap-2 py-1">
                      <Stethoscope size={9} className="text-slate-400"/>
                      <p className="text-[9.5px] font-semibold text-slate-700">{d.name}</p>
                      <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded capitalize ml-auto ${CAT_BADGE[d.specialty]??""}`}>{d.specialty}</span>
                      <p className="text-[9px] font-mono text-amber-600">${d.consultFeeUSD}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Case Pipeline Tab ─────────────────────────────────────────────────────────
function CasePipelineTab({ onSelect }: { onSelect: (c: MedicalCase) => void }) {
  const cards: PipelineCard[] = MEDICAL_CASES
    .filter(c=>c.stage!=="cancelled")
    .map(c => ({
      id:c.id, stage:c.stage, title:c.patientName,
      subtitle: c.medicalCondition,
      meta: `${c.targetHospital} · ${c.country}`,
      badge: c.nationality, badgeColor:"bg-slate-100 text-slate-500",
    }));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Medical Case Pipeline ({MEDICAL_CASES.filter(c=>c.stage!=="cancelled").length} active)</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Case</button>
      </div>
      <div className="overflow-x-auto">
        <PipelineKanban
          stages={MEDICAL_PIPELINE}
          cards={cards}
          onCardClick={card => { const c = MEDICAL_CASES.find(m=>m.id===card.id); if(c) onSelect(c); }}
          columnWidth={175}
        />
      </div>
    </div>
  );
}

// ── Invitation Letter Tab ─────────────────────────────────────────────────────
function InvitationLettersTab() {
  const [sel, setSel] = useState(INVITATION_LETTERS[0]);
  const STATUS_CFG: Record<string,{bg:string;color:string;label:string}> = {
    draft:       { bg:"bg-slate-100",   color:"text-slate-500",   label:"Draft"       },
    sent:        { bg:"bg-blue-100",    color:"text-blue-700",    label:"Sent"        },
    acknowledged:{ bg:"bg-emerald-100", color:"text-emerald-700", label:"Acknowledged"},
  };
  const medCase = MEDICAL_CASES.find(c=>c.id===sel.caseId);
  return (
    <div className="grid grid-cols-[240px_1fr] gap-5">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-[9.5px] font-bold text-slate-500 uppercase">Letters ({INVITATION_LETTERS.length})</p>
            <button className="text-[9px] font-bold text-amber-600"><Plus size={10}/></button>
          </div>
        </div>
        {INVITATION_LETTERS.map(il => {
          const sc = STATUS_CFG[il.status];
          return (
            <button key={il.id} onClick={() => setSel(il)}
              className={`w-full text-left px-3 py-2.5 border-b border-slate-100 transition-colors ${sel.id===il.id?"bg-amber-50":"hover:bg-slate-50"}`}>
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[10px] font-bold text-slate-800 truncate">{il.patientName}</p>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono">{il.letterRef}</p>
              <p className="text-[9px] text-slate-400">{il.hospital}</p>
            </button>
          );
        })}
      </div>
      {/* Letter preview */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-blue-300/70 text-[8px] font-bold uppercase tracking-[0.2em] mb-0.5">Medical Invitation Letter</p>
            <p className="text-white text-[18px] font-bold font-mono">{sel.letterRef}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-300/60 text-[9px]">Hospital</p>
            <p className="text-blue-200 text-[11px] font-bold">{sel.hospital}</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-5 mb-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Patient Information</p>
              {[["Patient Name",sel.patientName],["Nationality",medCase?.nationality??"—"],["Passport",medCase?.passportNo??"—"],["DOB",medCase?.dob??"—"]].map(([l,v]) => (
                <div key={l} className="flex gap-2 py-1 border-b border-slate-100 last:border-0">
                  <span className="text-[9.5px] text-slate-400 w-20 flex-shrink-0">{l}</span>
                  <span className="text-[10px] font-bold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Treatment Details</p>
              {[["Hospital",sel.hospital],["Doctor",sel.doctor],["Treatment",sel.treatmentType],["Appointment",sel.appointmentDate],["Generated",sel.generatedAt]].map(([l,v]) => (
                <div key={l} className="flex gap-2 py-1 border-b border-slate-100 last:border-0">
                  <span className="text-[9.5px] text-slate-400 w-24 flex-shrink-0">{l}</span>
                  <span className="text-[10px] font-bold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-[9.5px] text-blue-700">
            <p className="font-bold mb-1">Purpose of Visit</p>
            <p>This letter confirms that <strong>{sel.patientName}</strong> has been scheduled for <strong>{sel.treatmentType}</strong> at <strong>{sel.hospital}</strong> on <strong>{sel.appointmentDate}</strong>. This invitation is issued to support the medical visa application.</p>
          </div>
          <div className="flex gap-2">
            {sel.status==="draft" && <button className="px-4 py-2 bg-blue-600 text-white text-[10px] font-bold rounded-xl hover:bg-blue-700">Send to Patient</button>}
            <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 text-[10px] font-semibold rounded-xl hover:bg-slate-50"><Printer size={11}/> Print</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Medical Visa Tab ──────────────────────────────────────────────────────────
function VisaTab() {
  const STATUS_CFG: Record<string,{bg:string;color:string;label:string}> = {
    not_started:        { bg:"bg-slate-100",   color:"text-slate-500",   label:"Not Started"     },
    appointment_booked: { bg:"bg-blue-100",    color:"text-blue-700",    label:"Appointment Set" },
    submitted:          { bg:"bg-purple-100",  color:"text-purple-700",  label:"Submitted"       },
    approved:           { bg:"bg-emerald-100", color:"text-emerald-700", label:"Approved"        },
    refused:            { bg:"bg-red-100",     color:"text-red-700",     label:"Refused"         },
  };
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Medical Visa Tracker ({MEDICAL_VISAS.length})</p>
      <div className="space-y-3">
        {MEDICAL_VISAS.map(mv => {
          const sc = STATUS_CFG[mv.status];
          return (
            <div key={mv.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 text-[9px] font-bold">VISA</div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{mv.patientName}</p>
                <p className="text-[10px] text-slate-500">{mv.visaType} · {mv.targetCountry} · {mv.companions} companion(s)</p>
                {mv.submittedAt && <p className="text-[9.5px] text-slate-400">Submitted: {mv.submittedAt}</p>}
              </div>
              {mv.visaNo && (
                <div className="text-right">
                  <p className="text-[9px] text-slate-400">Visa No</p>
                  <p className="font-mono font-bold text-[10px] text-slate-700">{mv.visaNo}</p>
                  {mv.validTo && <p className="text-[9px] text-slate-400">Until: {mv.validTo}</p>}
                </div>
              )}
              <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg ${sc.bg} ${sc.color}`}>{sc.label}</span>
              {mv.status==="not_started" && <button className="px-3 py-1.5 bg-amber-500 text-white text-[9.5px] font-bold rounded-lg hover:bg-amber-600">Start</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Treatment Plan Tab ────────────────────────────────────────────────────────
function TreatmentTab() {
  const STATUS_CFG: Record<string,{bg:string;color:string;label:string}> = {
    draft:           { bg:"bg-slate-100",   color:"text-slate-500",   label:"Draft"           },
    sent_to_patient: { bg:"bg-blue-100",    color:"text-blue-700",    label:"Sent to Patient" },
    approved:        { bg:"bg-emerald-100", color:"text-emerald-700", label:"Approved"        },
    in_progress:     { bg:"bg-orange-100",  color:"text-orange-700",  label:"In Progress"     },
    completed:       { bg:"bg-slate-100",   color:"text-slate-600",   label:"Completed"       },
  };
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Treatment Plans ({TREATMENT_PLANS.length})</p>
      <div className="space-y-4">
        {TREATMENT_PLANS.map(tp => {
          const sc = STATUS_CFG[tp.status];
          return (
            <div key={tp.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[12px] font-bold text-slate-800">{tp.patientName}</p>
                  <p className="text-[10px] text-slate-500">{tp.hospital} · {tp.doctor}</p>
                </div>
                <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg ${sc.bg} ${sc.color}`}>{sc.label}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                <p className="text-[9px] font-bold text-amber-700 uppercase mb-1">Diagnosis</p>
                <p className="text-[10.5px] font-semibold text-slate-800">{tp.diagnosis}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tp.treatmentProcedures.map(proc => (
                  <span key={proc} className="text-[9px] font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">{proc}</span>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-3 text-[10px]">
                {[["Estimated Cost",`$${tp.estimatedCostUSD.toLocaleString()} / ${fmtAED(tp.estimatedCostAED)}`],["Duration",tp.duration],["Hospitalization",tp.hospitalizations],["Follow-up Visits",String(tp.followUpVisits)+" visits"]].map(([l,v]) => (
                  <div key={l} className="bg-slate-50 rounded-lg p-2">
                    <p className="text-[8.5px] font-bold text-slate-400 uppercase">{l}</p>
                    <p className="font-semibold text-slate-700">{v}</p>
                  </div>
                ))}
              </div>
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
    searching:{ bg:"bg-amber-100",   color:"text-amber-700",   label:"Searching" },
    booked:   { bg:"bg-blue-100",    color:"text-blue-700",    label:"Booked"    },
    confirmed:{ bg:"bg-emerald-100", color:"text-emerald-700", label:"Confirmed" },
    completed:{ bg:"bg-slate-100",   color:"text-slate-500",   label:"Completed" },
  };
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Medical Accommodation ({MEDICAL_ACCOMM.length})</p>
      <div className="space-y-3">
        {MEDICAL_ACCOMM.map(acc => {
          const sc = STATUS_CFG[acc.status];
          return (
            <div key={acc.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">🏨</div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{acc.patientName}</p>
                <p className="text-[10px] text-slate-500">{acc.hotelName} · {acc.city} · {acc.roomType}</p>
                <p className="text-[9.5px] text-slate-400">{acc.checkIn} – {acc.checkOut} · {acc.nights} nights · {acc.distanceKm} km from {acc.nearHospital}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-slate-800">{fmtAED(acc.totalAED)}</p>
                <p className="text-[9px] text-slate-400">{fmtAED(acc.ratePerNight)}/night</p>
              </div>
              <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg ${sc.bg} ${sc.color}`}>{sc.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Translators Tab ───────────────────────────────────────────────────────────
function TranslatorsTab() {
  const STATUS_CFG: Record<string,{bg:string;color:string;label:string}> = {
    available:   { bg:"bg-emerald-100", color:"text-emerald-700", label:"Available"  },
    assigned:    { bg:"bg-blue-100",    color:"text-blue-700",    label:"Assigned"   },
    unavailable: { bg:"bg-slate-100",   color:"text-slate-500",   label:"Unavailable"},
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Translators ({TRANSLATORS.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> Add Translator</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Translator","Languages","Specialization","City","Country","Rate/Day","Status",""].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRANSLATORS.map((tr, i) => {
              const sc = STATUS_CFG[tr.status];
              return (
                <tr key={tr.id} className={`border-b border-slate-100 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{tr.name}</td>
                  <td className="px-3 py-2.5"><div className="flex flex-wrap gap-0.5">{tr.languages.map(l => <span key={l} className="text-[8px] font-semibold px-1 py-0.5 bg-slate-100 text-slate-500 rounded">{l}</span>)}</div></td>
                  <td className="px-3 py-2.5 text-slate-500">{tr.specialization}</td>
                  <td className="px-3 py-2.5 text-slate-500">{tr.city}</td>
                  <td className="px-3 py-2.5 text-slate-500">{tr.country}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-700">${tr.ratePerDay}</td>
                  <td className="px-3 py-2.5"><span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                  <td className="px-3 py-2.5">{tr.status==="available"&&<button className="text-[9.5px] text-amber-600 font-bold hover:text-amber-700">Assign</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Transport Tab ─────────────────────────────────────────────────────────────
function TransportTab() {
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Patient Transport Bookings</p>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[11px] font-bold text-slate-700 mb-3">New Transport Booking</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {["Patient Name","Case Ref","From Location","To Location","Date & Time","Vehicle Type","Driver Required?","Companions","Notes"].map(l => (
            <div key={l} className={l==="Notes"?"col-span-3":""}>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{l}</label>
              {l==="Vehicle Type"||l==="Driver Required?" ? (
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50">
                  {l==="Vehicle Type"?<><option>Sedan</option><option>SUV</option><option>Wheelchair Van</option><option>Ambulance</option></>:<><option>Yes</option><option>No</option></>}
                </select>
              ) : <input placeholder={l} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50"/>}
            </div>
          ))}
        </div>
        <button className="px-5 py-2 bg-amber-500 text-white text-[10.5px] font-bold rounded-xl hover:bg-amber-600">Book Transport</button>
      </div>
      <div className="mt-4 space-y-2">
        {MEDICAL_CASES.filter(c=>["treatment","arrived"].includes(c.stage)).map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="size-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">🚐</div>
            <div className="flex-1">
              <p className="text-[11.5px] font-bold text-slate-800">{c.patientName}</p>
              <p className="text-[10px] text-slate-500">{c.targetHospital} · {c.country} · {c.companions} companion(s)</p>
            </div>
            <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg ${STAGE_CFG[c.stage]?.bg??""} ${STAGE_CFG[c.stage]?.color??""}`}>{STAGE_CFG[c.stage]?.label??c.stage}</span>
            <button className="px-3 py-1.5 bg-amber-500 text-white text-[9.5px] font-bold rounded-lg hover:bg-amber-600">Book Transfer</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Payments Tab ──────────────────────────────────────────────────────────────
function PaymentsTab() {
  const STATUS_CFG: Record<string,{bg:string;color:string;label:string}> = {
    unpaid:  { bg:"bg-amber-100",   color:"text-amber-700",   label:"Unpaid"  },
    partial: { bg:"bg-blue-100",    color:"text-blue-700",    label:"Partial" },
    paid:    { bg:"bg-emerald-100", color:"text-emerald-700", label:"Paid"    },
    overdue: { bg:"bg-red-100",     color:"text-red-700",     label:"Overdue" },
  };
  const totalAED = MEDICAL_PAYMENTS.reduce((s,p)=>s+p.amountAED,0);
  const paidAED  = MEDICAL_PAYMENTS.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amountAED,0);
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[["Total Due",fmtAED(totalAED),"text-slate-700"],["Collected",fmtAED(paidAED),"text-emerald-600"],["Outstanding",fmtAED(totalAED-paidAED),"text-amber-600"]].map(([l,v,c]) => (
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
              {["Patient","Description","USD Amount","AED Amount","Due Date","Paid Date","Method","Status"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEDICAL_PAYMENTS.map((p,i) => {
              const sc = STATUS_CFG[p.status];
              return (
                <tr key={p.id} className={`border-b border-slate-100 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{p.patientName}</td>
                  <td className="px-3 py-2.5 text-slate-500 max-w-[180px] truncate">{p.description}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-700">${p.amountUSD.toLocaleString()}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-600">{fmtAED(p.amountAED)}</td>
                  <td className="px-3 py-2.5 text-slate-500">{p.dueDate}</td>
                  <td className="px-3 py-2.5 text-slate-400">{p.paidDate??"—"}</td>
                  <td className="px-3 py-2.5 capitalize text-slate-400">{p.method?.replace("_"," ")??"—"}</td>
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
  const byStageCounts = MEDICAL_PIPELINE.map(s => ({
    ...s, count: MEDICAL_CASES.filter(c=>c.stage===s.key).length
  }));
  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[["Total Cases",String(MEDICAL_CASES.length)],["Active",String(MEDICAL_CASES.filter(c=>!["completed","cancelled"].includes(c.stage)).length)],["Hospitals",String(HOSPITALS.length)],["Revenue",fmtAED(MEDICAL_PAYMENTS.filter(p=>p.status==="paid").reduce((s,p)=>s+p.amountAED,0))]].map(([l,v]) => (
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
          <p className="text-[11px] font-bold text-slate-700 mb-3">Treatment Categories</p>
          {Array.from(new Set(MEDICAL_CASES.map(c=>c.treatmentCategory))).map(cat => (
            <div key={cat} className="flex items-center gap-3 mb-2">
              <div className={`text-[8px] font-bold px-1.5 py-0.5 rounded capitalize ${CAT_BADGE[cat]??""}`}>{cat}</div>
              <span className="text-[10px] text-slate-600 flex-1 capitalize">{cat}</span>
              <span className="text-[10px] font-bold text-slate-800">{MEDICAL_CASES.filter(c=>c.treatmentCategory===cat).length}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────
export default function MedicalModule() {
  const [tab, setTab] = useState<ModTab>("hospitals");

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[17px] font-bold text-slate-800">Medical Tourism</h1>
            <p className="text-[10.5px] text-slate-400 mt-0.5">{MEDICAL_CASES.length} cases · {HOSPITALS.length} partner hospitals · {DOCTORS.length} doctors</p>
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
        {tab==="hospitals"     && <HospitalsTab/>}
        {tab==="pipeline"      && <CasePipelineTab onSelect={() => {}}/>}
        {tab==="letters"       && <InvitationLettersTab/>}
        {tab==="visa"          && <VisaTab/>}
        {tab==="treatment"     && <TreatmentTab/>}
        {tab==="accommodation" && <AccommodationTab/>}
        {tab==="translators"   && <TranslatorsTab/>}
        {tab==="transport"     && <TransportTab/>}
        {tab==="payments"      && <PaymentsTab/>}
        {tab==="reports"       && <ReportsTab/>}
      </div>
    </div>
  );
}
