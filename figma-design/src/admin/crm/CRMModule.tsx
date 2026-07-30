import { useState } from "react";
import {
  Search, Plus, LayoutGrid, List, ChevronLeft, ChevronDown,
  Phone, Mail, MessageSquare, Calendar, Clock, CheckSquare, Square,
  FileText, Briefcase, Send, Activity, BookOpen, BarChart2, Tag,
  ArrowUpRight, AlertCircle, CheckCircle2, Circle,
} from "lucide-react";
import {
  LEADS, PIPELINE_STAGES, FOLLOW_UPS, QUOTATIONS, DEALS,
  CAMPAIGNS, COMM_LOG, TIMELINE_EVENTS, CRM_NOTES,
  Lead, LeadStage, fmtAED,
} from "./data";

// ── Helpers ───────────────────────────────────────────────────────────────────
const PRIORITY_DOT: Record<string, string> = { hot: "bg-red-500", warm: "bg-amber-400", cold: "bg-slate-400" };
const PRIORITY_LABEL: Record<string, string> = { hot: "Hot", warm: "Warm", cold: "Cold" };

const QUOTE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: "Draft",    color: "text-slate-600",   bg: "bg-slate-100"   },
  sent:     { label: "Sent",     color: "text-blue-700",    bg: "bg-blue-100"    },
  accepted: { label: "Accepted", color: "text-emerald-700", bg: "bg-emerald-100" },
  rejected: { label: "Rejected", color: "text-red-700",     bg: "bg-red-100"     },
};

const COMM_ICON: Record<string, typeof Phone> = {
  call: Phone, email: Mail, whatsapp: MessageSquare, meeting: Calendar, note: FileText,
};

function StageBadge({ stage }: { stage: LeadStage }) {
  const s = PIPELINE_STAGES.find(p => p.key === stage)!;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold ${s.bg} ${s.color}`}>
      <span className="size-[5px] rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
      {s.label}
    </span>
  );
}

// ── Kanban Card ───────────────────────────────────────────────────────────────
function LeadCard({ lead, onSelect }: { lead: Lead; onSelect: (l: Lead) => void }) {
  return (
    <div
      onClick={() => onSelect(lead)}
      className="bg-white rounded-xl border border-slate-200 p-3.5 cursor-pointer hover:border-amber-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-[11.5px] font-bold text-slate-800 leading-snug">{lead.name}</p>
        <span className={`size-2 rounded-full flex-shrink-0 mt-0.5 ${PRIORITY_DOT[lead.priority]}`} title={PRIORITY_LABEL[lead.priority]} />
      </div>
      {lead.company && <p className="text-[9.5px] text-slate-400 mb-0.5">{lead.company}</p>}
      <p className="text-[10px] text-slate-500">{lead.serviceInterest}{lead.destination ? ` → ${lead.destination}` : ""}</p>
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
        <span className="text-[11px] font-bold font-mono text-slate-700">{fmtAED(lead.value)}</span>
        <div className="flex items-center gap-1.5">
          {lead.tags.slice(0, 1).map(t => (
            <span key={t} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{t}</span>
          ))}
          <div className="size-5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black flex items-center justify-center">
            {lead.assignedAvatar}
          </div>
        </div>
      </div>
      {lead.daysInStage > 0 && (
        <p className="text-[8.5px] text-slate-400 mt-1">{lead.daysInStage}d in stage</p>
      )}
    </div>
  );
}

// ── Kanban View ───────────────────────────────────────────────────────────────
function KanbanView({ leads, onSelect }: { leads: Lead[]; onSelect: (l: Lead) => void }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
      {PIPELINE_STAGES.map(stage => {
        const sl = leads.filter(l => l.stage === stage.key);
        const total = sl.reduce((s, l) => s + l.value, 0);
        return (
          <div key={stage.key} className="flex-shrink-0 w-[220px]">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${stage.bg} ${stage.color}`}>{stage.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">{sl.length}</span>
              </div>
              {total > 0 && <span className="text-[9px] font-mono text-slate-400">{fmtAED(total)}</span>}
            </div>
            <div className="space-y-2 min-h-[60px]">
              {sl.map(l => <LeadCard key={l.id} lead={l} onSelect={onSelect} />)}
              {sl.length === 0 && (
                <div className="h-16 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center">
                  <span className="text-[9.5px] text-slate-300">Empty</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Table View ────────────────────────────────────────────────────────────────
function TableView({ leads, onSelect }: { leads: Lead[]; onSelect: (l: Lead) => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {["Name","Service / Destination","Stage","Value","Source","Assigned","Last Contact",""].map(h => (
              <th key={h} className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => (
            <tr
              key={lead.id}
              onClick={() => onSelect(lead)}
              className={`border-b border-slate-100 cursor-pointer hover:bg-amber-50/40 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}
            >
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`size-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[lead.priority]}`} />
                  <div>
                    <p className="font-bold text-slate-800">{lead.name}</p>
                    <p className="text-[9.5px] text-slate-400">{lead.nationality}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5">
                <p className="text-slate-700">{lead.serviceInterest}</p>
                {lead.destination && <p className="text-[9.5px] text-slate-400">{lead.destination}</p>}
              </td>
              <td className="px-3 py-2.5"><StageBadge stage={lead.stage} /></td>
              <td className="px-3 py-2.5 font-mono font-bold text-slate-700">{fmtAED(lead.value)}</td>
              <td className="px-3 py-2.5 text-slate-500">{lead.source}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="size-5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black flex items-center justify-center">
                    {lead.assignedAvatar}
                  </div>
                  <span className="text-slate-600">{lead.assignedTo.split(" ")[0]}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-slate-400">{lead.lastContact}</td>
              <td className="px-3 py-2.5">
                <button className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-semibold text-[10px]">
                  View <ArrowUpRight size={11} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Lead Detail Tabs ──────────────────────────────────────────────────────────
type LeadTab = "overview"|"followups"|"quotations"|"deals"|"campaigns"|"comms"|"timeline"|"notes"|"report";
const TABS: { key: LeadTab; label: string; Icon: typeof Phone }[] = [
  { key: "overview",   label: "Overview",       Icon: Circle       },
  { key: "followups",  label: "Follow Ups",     Icon: Clock        },
  { key: "quotations", label: "Quotations",     Icon: FileText     },
  { key: "deals",      label: "Deals",          Icon: Briefcase    },
  { key: "campaigns",  label: "Campaigns",      Icon: Send         },
  { key: "comms",      label: "Communications", Icon: MessageSquare},
  { key: "timeline",   label: "Timeline",       Icon: Activity     },
  { key: "notes",      label: "Notes",          Icon: BookOpen     },
  { key: "report",     label: "Report",         Icon: BarChart2    },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-[9.5px] font-bold text-slate-400 uppercase w-[100px] flex-shrink-0 mt-0.5">{label}</span>
      <span className="text-[11px] text-slate-700">{value}</span>
    </div>
  );
}

function OverviewTab({ lead }: { lead: Lead }) {
  const stage = PIPELINE_STAGES.find(p => p.key === lead.stage)!;
  const stageIdx = PIPELINE_STAGES.findIndex(p => p.key === lead.stage);
  return (
    <div className="grid grid-cols-[1fr_300px] gap-5">
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Contact Details</p>
          <InfoRow label="Email"       value={lead.email}           />
          <InfoRow label="Phone"       value={lead.phone}           />
          <InfoRow label="Nationality" value={lead.nationality}     />
          <InfoRow label="Source"      value={lead.source}          />
          <InfoRow label="Created"     value={lead.createdAt}       />
          <InfoRow label="Last Contact"value={lead.lastContact}     />
          {lead.company && <InfoRow label="Company" value={lead.company} />}
        </div>
        {lead.notes && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <p className="text-[10px] font-bold text-amber-700 uppercase mb-2">Note</p>
            <p className="text-[11px] text-amber-800 leading-relaxed">{lead.notes}</p>
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {lead.tags.map(t => (
              <span key={t} className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-[9.5px] font-semibold rounded-full">
                <Tag size={8} />{t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Pipeline Stage</p>
          <div className="space-y-2">
            {PIPELINE_STAGES.slice(0, 5).map((s, i) => (
              <div key={s.key} className={`flex items-center gap-2.5 p-2 rounded-lg ${s.key === lead.stage ? "bg-amber-50 border border-amber-200" : ""}`}>
                <div className={`size-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${i < stageIdx ? "bg-emerald-500 border-emerald-500" : s.key === lead.stage ? "bg-amber-500 border-amber-500" : "border-slate-300 bg-white"}`}>
                  {i < stageIdx && <CheckCircle2 size={8} className="text-white" />}
                </div>
                <span className={`text-[10px] font-semibold ${s.key === lead.stage ? "text-amber-700" : i < stageIdx ? "text-slate-500" : "text-slate-400"}`}>{s.label}</span>
                {s.key === lead.stage && <span className="ml-auto text-[8.5px] text-amber-600 font-bold">CURRENT</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Key Metrics</p>
          {[
            { label: "Deal Value",       value: fmtAED(lead.value)          },
            { label: "Priority",         value: PRIORITY_LABEL[lead.priority] },
            { label: "Days in Stage",    value: lead.daysInStage > 0 ? `${lead.daysInStage} days` : "Just entered" },
            { label: "Service Interest", value: lead.serviceInterest        },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
              <span className="text-[10px] text-slate-500">{label}</span>
              <span className="text-[10.5px] font-bold text-slate-700">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FollowUpsTab({ lead }: { lead: Lead }) {
  const [items, setItems] = useState(FOLLOW_UPS.filter(f => f.leadId === lead.id));
  const toggle = (id: string) => setItems(prev => prev.map(f => f.id === id ? { ...f, done: !f.done } : f));
  const TYPE_COLOR: Record<string, string> = { call: "bg-blue-100 text-blue-700", email: "bg-violet-100 text-violet-700", whatsapp: "bg-emerald-100 text-emerald-700", meeting: "bg-amber-100 text-amber-700" };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Follow-ups ({items.filter(f => !f.done).length} pending)</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600 transition-colors">
          <Plus size={11} /> Add Follow-up
        </button>
      </div>
      {items.length === 0 && <p className="text-[11px] text-slate-400 text-center py-8">No follow-ups scheduled</p>}
      {items.map(f => {
        const Icon = COMM_ICON[f.type] ?? Clock;
        return (
          <div key={f.id} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${f.done ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200 hover:border-amber-200"}`}>
            <button onClick={() => toggle(f.id)} className="flex-shrink-0 text-slate-400 hover:text-amber-500 transition-colors">
              {f.done ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} />}
            </button>
            <div className={`size-7 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLOR[f.type] ?? "bg-slate-100 text-slate-600"}`}>
              <Icon size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[11.5px] font-semibold ${f.done ? "line-through text-slate-400" : "text-slate-800"}`}>{f.title}</p>
              <p className="text-[9.5px] text-slate-400 capitalize">{f.type} · Due {f.dueDate}</p>
            </div>
            {!f.done && f.dueDate === "09 Jan 2025" && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                <AlertCircle size={8} /> Due Today
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function QuotationsTab({ lead }: { lead: Lead }) {
  const qs = QUOTATIONS.filter(q => q.leadId === lead.id);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Quotations ({qs.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">
          <Plus size={11} /> New Quotation
        </button>
      </div>
      {qs.length === 0 && <p className="text-[11px] text-slate-400 text-center py-8">No quotations yet</p>}
      <div className="space-y-2">
        {qs.map(q => {
          const cfg = QUOTE_CFG[q.status];
          return (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center flex-shrink-0">
                <FileText size={14} />
              </div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{q.ref}</p>
                <p className="text-[10px] text-slate-500">{q.service}</p>
                <p className="text-[9.5px] text-slate-400 mt-0.5">Created {q.createdAt} · Valid until {q.validUntil}</p>
              </div>
              <p className="font-mono font-bold text-[13px] text-slate-800">{fmtAED(q.amount)}</p>
              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
              <button className="text-[10px] text-amber-600 hover:text-amber-700 font-bold">PDF</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DealsTab({ lead }: { lead: Lead }) {
  const ds = DEALS.filter(d => d.leadId === lead.id);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Deals ({ds.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">
          <Plus size={11} /> Create Deal
        </button>
      </div>
      {ds.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Briefcase size={28} className="text-slate-300 mx-auto mb-2" />
          <p className="text-[11px] text-slate-400">No deals yet. Convert a quotation to create a deal.</p>
        </div>
      )}
      {ds.map(d => (
        <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
          <div className={`size-8 rounded-lg flex items-center justify-center ${d.status === "won" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            <Briefcase size={14} />
          </div>
          <div className="flex-1">
            <p className="text-[11.5px] font-bold text-slate-800">{d.ref}</p>
            <p className="text-[10px] text-slate-500">{d.service}</p>
            {d.closedAt && <p className="text-[9.5px] text-slate-400">Closed {d.closedAt}</p>}
          </div>
          <p className="font-mono font-bold text-[13px] text-slate-800">{fmtAED(d.amount)}</p>
          <span className={`text-[9.5px] font-bold px-2.5 py-0.5 rounded ${d.status === "won" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

function CampaignsTab() {
  const TYPE_COLOR: Record<string, string> = { email: "bg-blue-100 text-blue-700", whatsapp: "bg-emerald-100 text-emerald-700", sms: "bg-violet-100 text-violet-700" };
  const STATUS_COLOR: Record<string, string> = { active: "bg-emerald-100 text-emerald-700", completed: "bg-slate-100 text-slate-600", draft: "bg-amber-100 text-amber-700" };
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Enrolled Campaigns</p>
      <div className="space-y-3">
        {CAMPAIGNS.map(c => {
          const rate = c.sent > 0 ? Math.round((c.opened / c.sent) * 100) : 0;
          const conv = c.sent > 0 ? Math.round((c.converted / c.sent) * 100) : 0;
          return (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[11.5px] font-bold text-slate-800">{c.name}</p>
                  <p className="text-[9.5px] text-slate-400 mt-0.5">{c.createdAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded capitalize ${TYPE_COLOR[c.type]}`}>{c.type}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded capitalize ${STATUS_COLOR[c.status]}`}>{c.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[["Sent", c.sent.toLocaleString()], ["Open Rate", `${rate}%`], ["Converted", `${conv}%`]].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-[14px] font-bold font-mono text-slate-800">{v}</p>
                    <p className="text-[9px] text-slate-400">{l}</p>
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

function CommsTab({ lead }: { lead: Lead }) {
  const logs = COMM_LOG.filter(c => c.leadId === lead.id);
  const TYPE_COLOR: Record<string, string> = { call: "bg-blue-100 text-blue-600", email: "bg-violet-100 text-violet-600", whatsapp: "bg-emerald-100 text-emerald-600", meeting: "bg-amber-100 text-amber-600", note: "bg-slate-100 text-slate-600" };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Communication Log ({logs.length})</p>
        <div className="flex gap-2">
          {[{label:"Log Call",Icon:Phone},{label:"Send Email",Icon:Mail},{label:"WhatsApp",Icon:MessageSquare}].map(({label,Icon}) => (
            <button key={label} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50">
              <Icon size={10} />{label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {logs.map(log => {
          const Icon = COMM_ICON[log.type] ?? MessageSquare;
          return (
            <div key={log.id} className={`flex gap-3 p-3.5 rounded-xl border ${log.direction === "in" ? "bg-blue-50/30 border-blue-100" : "bg-white border-slate-200"}`}>
              <div className={`size-7 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLOR[log.type]}`}>
                <Icon size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[10.5px] font-bold text-slate-700">{log.from}</p>
                  <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${log.direction === "in" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                    {log.direction === "in" ? "↓ Inbound" : "↑ Outbound"}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 leading-relaxed">{log.summary}</p>
              </div>
              <p className="text-[9px] text-slate-400 flex-shrink-0 mt-0.5">{log.at}</p>
            </div>
          );
        })}
        {logs.length === 0 && <p className="text-[11px] text-slate-400 text-center py-8">No communications logged</p>}
      </div>
    </div>
  );
}

function TimelineTab({ lead }: { lead: Lead }) {
  const events = TIMELINE_EVENTS.filter(t => t.leadId === lead.id);
  const TYPE_COLOR: Record<string, { bg: string; text: string }> = {
    stage_change: { bg: "bg-violet-100", text: "text-violet-700" },
    comm:         { bg: "bg-blue-100",   text: "text-blue-700"   },
    quotation:    { bg: "bg-amber-100",  text: "text-amber-700"  },
    task:         { bg: "bg-emerald-100",text: "text-emerald-700"},
    note:         { bg: "bg-slate-100",  text: "text-slate-700"  },
  };
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Activity Timeline</p>
      {events.length === 0 && <p className="text-[11px] text-slate-400 text-center py-8">No timeline events</p>}
      <div className="space-y-0">
        {events.map((e, i) => {
          const cfg = TYPE_COLOR[e.type] ?? TYPE_COLOR.note;
          return (
            <div key={e.id} className="flex gap-3">
              <div className="flex flex-col items-center w-6">
                <div className={`size-4 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text} flex items-center justify-center mt-1`}>
                  <Activity size={8} />
                </div>
                {i < events.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
              </div>
              <div className="flex-1 pb-4">
                <p className="text-[11px] text-slate-700">{e.text}</p>
                <p className="text-[9.5px] text-slate-400 mt-0.5">{e.by} · {e.at}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NotesTab({ lead }: { lead: Lead }) {
  const [draft, setDraft] = useState("");
  const notes = CRM_NOTES.filter(n => n.leadId === lead.id);
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Notes ({notes.length})</p>
      <div className="mb-4">
        <textarea
          value={draft} onChange={e => setDraft(e.target.value)}
          placeholder="Add a note…"
          className="w-full h-20 px-3 py-2.5 border border-slate-200 rounded-xl text-[11px] resize-none focus:outline-none focus:border-amber-400 bg-white"
        />
        <button className="mt-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600 disabled:opacity-40" disabled={!draft.trim()}>
          Save Note
        </button>
      </div>
      <div className="space-y-3">
        {notes.map(n => (
          <div key={n.id} className={`p-4 rounded-xl border ${n.pinned ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
            {n.pinned && <span className="text-[9px] font-bold text-amber-600 uppercase mb-1 block">📌 Pinned</span>}
            <p className="text-[11px] text-slate-700 leading-relaxed">{n.text}</p>
            <p className="text-[9.5px] text-slate-400 mt-1.5">{n.by} · {n.at}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportTab({ lead }: { lead: Lead }) {
  const stageIdx = PIPELINE_STAGES.findIndex(p => p.key === lead.stage);
  const prob = lead.stage === "won" ? 100 : lead.stage === "lost" ? 0 : Math.round((stageIdx / 5) * 100);
  const metrics = [
    { label: "Win Probability",  value: `${prob}%`,            note: lead.priority === "hot" ? "High priority" : "Normal flow" },
    { label: "Deal Value",       value: fmtAED(lead.value),    note: "Agreed quotation"                                         },
    { label: "Pipeline Stage",   value: `${stageIdx + 1} of 7`,note: PIPELINE_STAGES[stageIdx]?.label ?? ""                    },
    { label: "Days in Pipeline", value: "12 days",             note: "Since first inquiry"                                      },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-[9.5px] font-bold text-slate-400 uppercase mb-1">{m.label}</p>
            <p className="text-[20px] font-bold text-slate-800 font-mono">{m.value}</p>
            <p className="text-[9.5px] text-slate-400 mt-0.5">{m.note}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Win Probability Gauge</p>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 transition-all" style={{ width: `${prob}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-400">0% (Lost)</span>
          <span className="text-[9px] font-bold text-amber-600">{prob}%</span>
          <span className="text-[9px] text-slate-400">100% (Won)</span>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Lead Source</p>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Send size={14} className="text-amber-600" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-800">{lead.source}</p>
            <p className="text-[9.5px] text-slate-400">First touchpoint channel</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Lead Detail Shell ─────────────────────────────────────────────────────────
function LeadDetail({ lead, onBack }: { lead: Lead; onBack: () => void }) {
  const [tab, setTab] = useState<LeadTab>("overview");
  const [showStage, setShowStage] = useState(false);
  const stage = PIPELINE_STAGES.find(p => p.key === lead.stage)!;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1 text-[10.5px] text-slate-500 hover:text-slate-800 mb-2 transition-colors">
          <ChevronLeft size={13} /> Back to Leads
        </button>
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-200 flex items-center justify-center flex-shrink-0">
            <span className="text-[13px] font-black text-amber-600">{lead.name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-slate-800">{lead.name}</h2>
            <p className="text-[10px] text-slate-400">{lead.email} · {lead.phone} · {lead.nationality}</p>
          </div>
          {/* Stage selector */}
          <div className="relative">
            <button onClick={() => setShowStage(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10.5px] font-bold ${stage.bg} ${stage.color} border-current/20`}>
              {stage.label} <ChevronDown size={11} />
            </button>
            {showStage && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 min-w-[140px]">
                {PIPELINE_STAGES.map(s => (
                  <button key={s.key} onClick={() => setShowStage(false)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 text-[10.5px] font-semibold hover:bg-slate-50 ${s.key === lead.stage ? "text-amber-600" : "text-slate-700"}`}>
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Priority */}
          <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg ${PRIORITY_DOT[lead.priority].replace("bg-", "bg-").replace("-500", "-100")} text-slate-700`}>
            <span className={`size-1.5 rounded-full ${PRIORITY_DOT[lead.priority]}`} />
            {PRIORITY_LABEL[lead.priority]}
          </span>
          {/* Actions */}
          <div className="flex items-center gap-2">
            {[{label:"Email",Icon:Mail,cls:"border-slate-200 text-slate-600"},{label:"Call",Icon:Phone,cls:"border-slate-200 text-slate-600"},{label:"Schedule",Icon:Calendar,cls:"border-slate-200 text-slate-600"}].map(({label,Icon,cls})=>(
              <button key={label} className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-[10px] font-semibold hover:bg-slate-50 transition-colors ${cls}`}>
                <Icon size={11}/>{label}
              </button>
            ))}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600 transition-colors">
              <ArrowUpRight size={11} /> Convert
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-white border-b border-slate-200 overflow-x-auto flex-shrink-0">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3.5 py-3 text-[10.5px] font-semibold border-b-2 whitespace-nowrap transition-all flex-shrink-0
              ${tab === key ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            <Icon size={11} />{label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
        {tab === "overview"   && <OverviewTab   lead={lead} />}
        {tab === "followups"  && <FollowUpsTab  lead={lead} />}
        {tab === "quotations" && <QuotationsTab lead={lead} />}
        {tab === "deals"      && <DealsTab      lead={lead} />}
        {tab === "campaigns"  && <CampaignsTab              />}
        {tab === "comms"      && <CommsTab      lead={lead} />}
        {tab === "timeline"   && <TimelineTab   lead={lead} />}
        {tab === "notes"      && <NotesTab      lead={lead} />}
        {tab === "report"     && <ReportTab     lead={lead} />}
      </div>
    </div>
  );
}

// ── Main CRM Module ───────────────────────────────────────────────────────────
export default function CRMModule() {
  const [view, setView]               = useState<"kanban"|"table">("kanban");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch]           = useState("");

  const filtered = LEADS.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.serviceInterest.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedLead) return <LeadDetail lead={selectedLead} onBack={() => setSelectedLead(null)} />;

  const totalPipe = LEADS.filter(l => l.stage !== "won" && l.stage !== "lost").reduce((s, l) => s + l.value, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-slate-800">CRM — Leads</h1>
            <p className="text-[10.5px] text-slate-400 mt-0.5">{LEADS.length} leads · {fmtAED(totalPipe)} pipeline value</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…"
                className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[11px] w-48 focus:outline-none focus:border-amber-400 bg-white" />
            </div>
            {/* View toggle */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              {([["kanban", LayoutGrid], ["table", List]] as const).map(([v, Icon]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-2.5 py-1.5 transition-colors ${view === v ? "bg-amber-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                  <Icon size={13} />
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600">
              <Plus size={11} /> Add Lead
            </button>
          </div>
        </div>
        {/* Pipeline summary */}
        <div className="flex gap-3 mt-3">
          {PIPELINE_STAGES.map(s => {
            const count = filtered.filter(l => l.stage === s.key).length;
            return (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                <span className="text-[9.5px] text-slate-500">{s.label}</span>
                <span className="text-[9.5px] font-bold text-slate-700 font-mono">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5 bg-slate-50">
        {view === "kanban"
          ? <KanbanView leads={filtered} onSelect={setSelectedLead} />
          : <TableView  leads={filtered} onSelect={setSelectedLead} />
        }
      </div>
    </div>
  );
}
