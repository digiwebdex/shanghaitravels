import { useState } from "react";
import {
  AlertTriangle, Clock, CheckCircle2,
  Mail, Phone, Globe, MapPin, Calendar, Hash,
} from "lucide-react";
import { APPLICATIONS, Application, STAGES, SLA_CFG, PRIORITY_CFG, SLAStatus, CasePriority } from "./data";
import { CaseTimeline } from "../admin/shared/CaseTimeline";

function SLABadge({ status }: { status: SLAStatus }) {
  const cfg = SLA_CFG[status];
  const Icon = status === "overdue" ? AlertTriangle : status === "due_soon" ? Clock : CheckCircle2;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon size={8} />
      {cfg.label}
    </span>
  );
}

function PriorityDot({ p }: { p: CasePriority }) {
  const cfg = PRIORITY_CFG[p];
  return (
    <span className="flex items-center gap-1">
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      <span className={`text-[9.5px] font-semibold ${cfg.color}`}>{cfg.label}</span>
    </span>
  );
}

const STATUS_TABS = [
  { key: "all",    label: "All"       },
  { key: "active", label: "Active"    },
  { key: "on_hold",label: "On Hold"   },
];

export default function Applications() {
  const [selected, setSelected] = useState<Application>(APPLICATIONS[0]);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");

  const list = APPLICATIONS
    .filter(a => filter === "all" || a.status === filter)
    .filter(a =>
      !search ||
      a.ref.toLowerCase().includes(search.toLowerCase()) ||
      a.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      a.destination.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left pane — case list */}
      <div className="flex flex-col w-[320px] flex-shrink-0 border-r border-slate-200 bg-white overflow-hidden">
        {/* Search + filter */}
        <div className="p-3 border-b border-slate-100 space-y-2">
          <input
            type="text" placeholder="Search ref, name, destination…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[10.5px] focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 bg-slate-50"
          />
          <div className="flex gap-1">
            {STATUS_TABS.map(t => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                className={`flex-1 py-1 rounded text-[9.5px] font-semibold transition-all
                  ${filter === t.key ? "bg-[#1A2332] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {list.map(app => (
            <button
              key={app.id}
              onClick={() => setSelected(app)}
              className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors
                ${selected.id === app.id ? "bg-sky-50/60 border-l-2 border-sky-400" : "border-l-2 border-transparent"}
                ${app.slaStatus === "overdue" && selected.id !== app.id ? "bg-red-50/30" : ""}`}
            >
              <div className="flex items-start justify-between gap-1.5 mb-1">
                <p className="text-[11px] font-bold text-slate-800 leading-snug">{app.applicantName}</p>
                <SLABadge status={app.slaStatus} />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-mono font-bold text-sky-600">{app.ref}</span>
                <span className="text-slate-300">·</span>
                <span className="text-[9.5px] text-slate-500">{app.destination}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-400">{STAGES[app.stage].short}</span>
                <PriorityDot p={app.priority} />
              </div>
              {/* mini progress */}
              <div className="mt-1.5 h-0.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-400 rounded-full" style={{ width: `${(app.stage / 14) * 100}%` }} />
              </div>
            </button>
          ))}
          {list.length === 0 && (
            <div className="flex items-center justify-center h-24">
              <p className="text-[11px] text-slate-400">No cases found</p>
            </div>
          )}
        </div>
        <div className="px-3 py-2 border-t border-slate-100">
          <p className="text-[9.5px] text-slate-400">{list.length} application{list.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Right pane — case detail */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {selected ? <CaseDetail app={selected} /> : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-[13px]">Select a case to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CaseDetail({ app }: { app: Application }) {
  const tlStages  = STAGES.map((s, i) => ({ id: String(i), label: s.label }));
  const tlEntries = app.stageHistory.map(h => ({
    stageIndex: h.stage as number,
    date:       h.completedAt,
    note:       [h.by ? `by ${h.by}` : null, h.note].filter(Boolean).join(" · ") || undefined,
  }));

  return (
    <div className="p-5 space-y-5 max-w-[900px]">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[11px] font-bold text-sky-600">{app.ref}</span>
              <SLABadge status={app.slaStatus} />
              <PriorityDot p={app.priority} />
            </div>
            <h2 className="text-[18px] font-bold text-slate-800">{app.applicantName}</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{app.visaType} · {app.destination}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[9.5px] text-slate-400 uppercase font-bold">SLA Due</p>
            <p className="text-[13px] font-bold font-mono text-slate-800">{app.slaDue}</p>
            <p className="text-[9.5px] text-slate-400 mt-0.5">Travel: {app.travelDate}</p>
          </div>
        </div>

        {/* Applicant info grid */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-[10.5px]">
          {[
            { icon: Mail,  label: "Email",    value: app.applicantEmail  },
            { icon: Phone, label: "Phone",    value: app.applicantPhone  },
            { icon: Hash,  label: "Passport", value: app.passportNo      },
            { icon: Globe, label: "Nationality", value: app.nationality  },
            { icon: MapPin,label: "Destination", value: app.destination  },
            { icon: Calendar,label: "Created", value: app.createdAt      },
          ].map(f => (
            <div key={f.label} className="flex items-start gap-2">
              <f.icon size={11} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{f.label}</p>
                <p className="text-slate-700 font-medium">{f.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {app.notes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {app.notes.map((n, i) => (
              <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">{n}</span>
            ))}
          </div>
        )}
      </div>

      {/* 15-stage workflow timeline — shared CaseTimeline, staff variant */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[12px] font-bold text-slate-800 mb-5">Application Workflow</p>
        <CaseTimeline
          stages={tlStages}
          currentStage={app.stage as number}
          entries={tlEntries}
          variant="staff"
        />
      </div>
    </div>
  );
}
