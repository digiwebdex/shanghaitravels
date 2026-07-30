import { useState } from "react";
import {
  Mail, MessageSquare, Phone, Clock, Zap, CalendarDays, List,
  Plus, X, ChevronRight, CheckCircle2, AlertCircle, RefreshCw, Eye,
  Edit3, Play, Pause, Search,
} from "lucide-react";
import {
  EMAIL_TEMPLATES, SMS_TEMPLATES, WHATSAPP_TEMPLATES,
  REMINDER_RULES, ALERT_RULES, SCHEDULED_NOTIFS, NOTIF_LOGS,
  NotifTemplate, ReminderRule, AlertRule, ScheduledNotif, NotifLog,
  CHANNEL_COLOR, LOG_STATUS_COLOR,
} from "./data";

type NotifTab = "email" | "sms" | "whatsapp" | "reminders" | "alerts" | "schedule" | "logs";

const TABS: { key: NotifTab; label: string; icon: React.ElementType }[] = [
  { key:"email",     label:"Email Templates",     icon:Mail         },
  { key:"sms",       label:"SMS Templates",        icon:MessageSquare},
  { key:"whatsapp",  label:"WhatsApp Templates",   icon:Phone        },
  { key:"reminders", label:"Auto Reminders",       icon:Clock        },
  { key:"alerts",    label:"Event Alerts",         icon:Zap          },
  { key:"schedule",  label:"Scheduled",            icon:CalendarDays },
  { key:"logs",      label:"Log History",          icon:List         },
];

const TMPL_STATUS: Record<string, string> = {
  active:   "bg-emerald-500/15 text-emerald-400",
  draft:    "bg-amber-500/15 text-amber-400",
  inactive: "bg-slate-500/15 text-slate-400",
};
const CH_ICON: Record<string, React.ElementType> = {
  email: Mail, sms: MessageSquare, whatsapp: Phone, push: Zap,
};

function Pill({ cls, label }: { cls: string; label: string }) {
  return <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function ChannelPill({ channel }: { channel: string }) {
  return <Pill cls={CHANNEL_COLOR[channel] ?? "bg-slate-500/15 text-slate-400"} label={channel} />;
}

// ── Generic Template List+Editor ──────────────────────────────────────────────
function TemplateEditor({ templates }: { templates: NotifTemplate[] }) {
  const [selected, setSelected] = useState<NotifTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [body, setBody] = useState("");

  const select = (t: NotifTemplate) => { setSelected(t); setBody(t.body); setPreviewMode(false); };

  return (
    <div className="flex gap-4 h-full">
      {/* list */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input placeholder="Search templates…" className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500" />
          </div>
          <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-2 rounded-lg font-medium"><Plus size={13} /> New Template</button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Active",   value: templates.filter(t=>t.status==="active").length,   color:"text-emerald-400" },
            { label:"Draft",    value: templates.filter(t=>t.status==="draft").length,    color:"text-amber-400"   },
            { label:"Total Sent",value: templates.reduce((s,t)=>s+t.sentCount,0).toLocaleString(), color:"text-slate-200" },
          ].map(k => (
            <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {templates.map(tmpl => (
            <div key={tmpl.id} onClick={() => select(tmpl)}
              className={`bg-slate-800/60 border rounded-xl p-4 cursor-pointer hover:border-slate-600 transition-colors ${selected?.id === tmpl.id ? "border-amber-500/50" : "border-slate-700"}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-slate-200 text-sm">{tmpl.name}</p>
                    <Pill cls={TMPL_STATUS[tmpl.status]} label={tmpl.status} />
                    <span className="text-xs bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded">{tmpl.category}</span>
                    <span className="text-xs text-slate-500 uppercase">{tmpl.language}</span>
                  </div>
                  {tmpl.subject && <p className="text-xs text-slate-500 truncate"><span className="text-slate-600">Subject: </span>{tmpl.subject}</p>}
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 font-mono">{tmpl.body.slice(0, 80)}…</p>
                </div>
                <div className="text-right text-xs flex-shrink-0">
                  <p className="text-slate-400">{tmpl.sentCount.toLocaleString()}</p>
                  <p className="text-slate-500">sent</p>
                </div>
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {tmpl.variables.map(v => (
                  <span key={v} className="text-xs bg-slate-700 text-amber-400 px-1.5 py-0.5 rounded font-mono">{"{{"+v+"}}"}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* editor / preview */}
      {selected && (
        <div className="w-96 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <div className="flex gap-2">
              <button onClick={() => setPreviewMode(false)} className={`text-xs px-2 py-1 rounded ${!previewMode ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:text-slate-200"}`}>
                <Edit3 size={10} className="inline mr-1" />Editor
              </button>
              <button onClick={() => setPreviewMode(true)} className={`text-xs px-2 py-1 rounded ${previewMode ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:text-slate-200"}`}>
                <Eye size={10} className="inline mr-1" />Preview
              </button>
            </div>
            <button onClick={() => setSelected(null)}><X size={13} className="text-slate-400" /></button>
          </div>

          {previewMode ? (
            <div className="flex-1 overflow-y-auto p-4">
              {selected.subject && (
                <div className="bg-slate-700/40 rounded-lg p-3 mb-3">
                  <p className="text-xs text-slate-500 mb-0.5">Subject</p>
                  <p className="text-xs font-medium text-slate-200">{selected.subject}</p>
                </div>
              )}
              <div className="bg-white rounded-lg p-4 text-slate-800 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, "<br>") }} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto">
              <div>
                <p className="text-xs text-slate-500 mb-1">Template Name</p>
                <input defaultValue={selected.name} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500" />
              </div>
              {selected.subject !== undefined && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Subject Line</p>
                  <input defaultValue={selected.subject} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500" />
                </div>
              )}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-500">Body</p>
                  <div className="flex gap-1">
                    {selected.variables.map(v => (
                      <button key={v} onClick={() => setBody(b => b + " {{"+v+"}}")}
                        className="text-xs bg-slate-700 hover:bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono">{"{{"+v+"}}"}</button>
                    ))}
                  </div>
                </div>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={14}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs font-mono text-slate-300 resize-none focus:outline-none focus:border-amber-500" />
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">Save Template</button>
                <button className="py-1.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs">Send Test</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Auto Reminders Tab ────────────────────────────────────────────────────────
function RemindersTab() {
  const [selected, setSelected] = useState<ReminderRule | null>(null);

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-3">
        <div className="flex justify-end">
          <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1.5 rounded font-medium"><Plus size={12} /> Add Rule</button>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/60">
                {["Rule Name","Event Trigger","Timing","Channel","Template","Target","Last Ran","Active"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-medium">{h}</th>
                ))}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {REMINDER_RULES.map(rule => (
                <tr key={rule.id} onClick={() => setSelected(rule)}
                  className={`border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30 ${selected?.id === rule.id ? "bg-slate-700/40" : ""}`}>
                  <td className="px-4 py-3 font-medium text-slate-200">{rule.name}</td>
                  <td className="px-4 py-3 text-slate-400">{rule.event.replace(/_/g," ")}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${rule.basis === "before" ? "text-amber-400" : "text-blue-400"}`}>
                      {rule.offsetDays}d {rule.basis}
                    </span>
                  </td>
                  <td className="px-4 py-3"><ChannelPill channel={rule.channel} /></td>
                  <td className="px-4 py-3 text-slate-400 truncate max-w-32">{rule.templateName}</td>
                  <td className="px-4 py-3 text-slate-400">{rule.targetRole}</td>
                  <td className="px-4 py-3 text-slate-500">{rule.lastRan ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className={`w-8 h-4 rounded-full ${rule.active ? "bg-emerald-600" : "bg-slate-600"}`}>
                      <div className="w-3 h-3 rounded-full bg-white mt-0.5 transition-all" style={{marginLeft: rule.active ? "18px" : "2px"}} />
                    </div>
                  </td>
                  <td className="px-4 py-3"><ChevronRight size={12} className="text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-64 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-200">Reminder Rule</span>
            <button onClick={() => setSelected(null)}><X size={13} className="text-slate-400" /></button>
          </div>
          <div className="p-4 flex-1 space-y-3 text-xs">
            <p className="font-medium text-slate-200">{selected.name}</p>
            <ChannelPill channel={selected.channel} />
            {[
              { l:"Event",    v: selected.event.replace(/_/g," ") },
              { l:"Offset",   v: `${selected.offsetDays} days ${selected.basis}` },
              { l:"Target",   v: selected.targetRole },
              { l:"Template", v: selected.templateName },
              { l:"Last Ran", v: selected.lastRan ?? "Never" },
            ].map(r => (
              <div key={r.l} className="flex justify-between">
                <span className="text-slate-500">{r.l}</span>
                <span className="text-slate-200">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-700 flex gap-2">
            <button className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">Edit</button>
            <button className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs">{selected.active ? "Disable" : "Enable"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Event Alerts Tab ──────────────────────────────────────────────────────────
function AlertsTab() {
  const [selected, setSelected] = useState<AlertRule | null>(null);

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-3">
        <div className="flex justify-end">
          <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1.5 rounded font-medium"><Plus size={12} /> Add Alert</button>
        </div>
        <div className="space-y-3">
          {ALERT_RULES.map(rule => (
            <div key={rule.id} onClick={() => setSelected(rule)}
              className={`bg-slate-800/60 border rounded-xl p-4 cursor-pointer hover:border-slate-600 transition-colors ${selected?.id === rule.id ? "border-amber-500/50" : "border-slate-700"}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-slate-200 text-sm">{rule.name}</p>
                    {rule.active
                      ? <Pill cls="bg-emerald-500/15 text-emerald-400" label="Active" />
                      : <Pill cls="bg-slate-500/15 text-slate-400" label="Inactive" />}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Trigger: <span className="text-slate-400">{rule.triggerEvent.replace(/_/g," ")}</span></p>
                  <div className="flex gap-1.5 flex-wrap">
                    {rule.channels.map(ch => <ChannelPill key={ch} channel={ch} />)}
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {rule.notifyRoles.map(r => (
                      <span key={r} className="text-xs bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded">{r}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right text-xs flex-shrink-0">
                  <p className="text-amber-400 font-bold text-base">{rule.triggeredCount.toLocaleString()}</p>
                  <p className="text-slate-500">triggers</p>
                  {rule.lastTriggered && <p className="text-slate-600 mt-1">{rule.lastTriggered}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="w-64 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-200">Alert Rule</span>
            <button onClick={() => setSelected(null)}><X size={13} className="text-slate-400" /></button>
          </div>
          <div className="p-4 flex-1 space-y-3 text-xs">
            <p className="font-medium text-slate-200">{selected.name}</p>
            <div className="flex gap-1 flex-wrap">{selected.channels.map(ch => <ChannelPill key={ch} channel={ch} />)}</div>
            {[
              { l:"Trigger Event", v: selected.triggerEvent.replace(/_/g," ") },
              { l:"Triggered",     v: selected.triggeredCount.toLocaleString() },
              { l:"Last Triggered",v: selected.lastTriggered ?? "Never" },
            ].map(r => (
              <div key={r.l} className="flex justify-between">
                <span className="text-slate-500">{r.l}</span>
                <span className="text-slate-200">{r.v}</span>
              </div>
            ))}
            <div>
              <p className="text-slate-500 mb-1">Notify Roles</p>
              <div className="flex flex-col gap-1">
                {selected.notifyRoles.map(r => (
                  <span key={r} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded">{r}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Templates Used</p>
              <div className="space-y-1">
                {Object.entries(selected.templateIds).filter(([,v]) => v).map(([ch, tid]) => (
                  <div key={ch} className="flex justify-between">
                    <ChannelPill channel={ch} />
                    <span className="text-slate-400 font-mono text-xs">{tid}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-3 border-t border-slate-700 flex gap-2">
            <button className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">Edit</button>
            <button className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs">{selected.active ? "Disable" : "Enable"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Scheduled Notifications Tab ────────────────────────────────────────────────
function ScheduleTab() {
  const SCHED_STATUS: Record<string, string> = {
    pending:   "bg-amber-500/15 text-amber-400",
    sent:      "bg-emerald-500/15 text-emerald-400",
    cancelled: "bg-slate-500/15 text-slate-400",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Pending", value: SCHEDULED_NOTIFS.filter(s=>s.status==="pending").length, color:"text-amber-400"   },
            { label:"Sent",    value: SCHEDULED_NOTIFS.filter(s=>s.status==="sent").length,    color:"text-emerald-400" },
            { label:"Total Recipients", value: SCHEDULED_NOTIFS.reduce((s,n)=>s+n.recipientCount,0).toLocaleString(), color:"text-slate-200" },
          ].map(k => (
            <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5">
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
        <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-2 rounded-lg font-medium"><Plus size={13} /> Schedule New</button>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/60">
              {["Name","Channel","Scheduled For","Recipients","Status","Sent","Actions"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCHEDULED_NOTIFS.map(n => (
              <tr key={n.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="px-4 py-3 font-medium text-slate-200">{n.name}</td>
                <td className="px-4 py-3"><ChannelPill channel={n.channel} /></td>
                <td className="px-4 py-3 font-mono text-slate-300">{n.scheduledAt}</td>
                <td className="px-4 py-3 text-slate-300">{n.recipients}</td>
                <td className="px-4 py-3"><Pill cls={SCHED_STATUS[n.status]} label={n.status} /></td>
                <td className="px-4 py-3 text-slate-300">{n.sentCount != null ? `${n.sentCount?.toLocaleString()} / ${n.recipientCount.toLocaleString()}` : `— / ${n.recipientCount.toLocaleString()}`}</td>
                <td className="px-4 py-3">
                  {n.status === "pending" && (
                    <div className="flex gap-1">
                      <button className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded"><Play size={9} className="inline" /> Send Now</button>
                      <button className="text-xs text-slate-400 hover:text-red-400 border border-slate-600 px-2 py-0.5 rounded">Cancel</button>
                    </div>
                  )}
                  {n.status === "sent" && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={11} /> Delivered</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Log History Tab ───────────────────────────────────────────────────────────
function LogsTab() {
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = NOTIF_LOGS.filter(l =>
    (channelFilter === "all" || l.channel === channelFilter) &&
    (statusFilter  === "all" || l.status  === statusFilter)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Sent",    value: NOTIF_LOGS.filter(l=>l.status==="sent").length,    color:"text-emerald-400" },
            { label:"Failed",  value: NOTIF_LOGS.filter(l=>l.status==="failed").length,  color:"text-red-400"     },
            { label:"Bounced", value: NOTIF_LOGS.filter(l=>l.status==="bounced").length, color:"text-orange-400"  },
            { label:"Pending", value: NOTIF_LOGS.filter(l=>l.status==="pending").length, color:"text-amber-400"   },
          ].map(k => (
            <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5">
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none">
            <option value="all">All Channels</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none">
            <option value="all">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="bounced">Bounced</option>
          </select>
          <button className="flex items-center gap-1 text-xs border border-slate-700 bg-slate-800 hover:border-slate-600 text-slate-300 px-2.5 py-1.5 rounded-lg">
            <RefreshCw size={11} /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/60">
              {["Timestamp","Channel","Recipient","Subject / Template","Trigger","Case Ref","Status"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                <td className="px-4 py-2.5"><ChannelPill channel={log.channel} /></td>
                <td className="px-4 py-2.5">
                  <p className="text-slate-200">{log.recipientName ?? log.recipient}</p>
                  <p className="text-slate-500 font-mono">{log.recipient}</p>
                </td>
                <td className="px-4 py-2.5 max-w-40 truncate">
                  {log.subject
                    ? <p className="text-slate-300 truncate">{log.subject}</p>
                    : <p className="text-slate-400">{log.templateName}</p>}
                </td>
                <td className="px-4 py-2.5 text-slate-400">{log.triggerEvent.replace(/_/g," ")}</td>
                <td className="px-4 py-2.5 font-mono text-slate-500">{log.caseRef ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <div>
                    <Pill cls={LOG_STATUS_COLOR[log.status]} label={log.status} />
                    {log.errorMsg && <p className="text-red-400 text-xs mt-0.5">{log.errorMsg}</p>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function NotificationModule() {
  const [tab, setTab] = useState<NotifTab>("email");

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-slate-700/60">
        <h1 className="text-lg font-bold text-slate-100">Notification Engine</h1>
        <p className="text-xs text-slate-500 mt-0.5">Email, SMS, WhatsApp templates · Auto reminders · Event alerts · Send history</p>
      </div>
      <div className="flex-shrink-0 flex gap-0.5 px-6 pt-3 border-b border-slate-700/60 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors rounded-t border-b-2 ${tab === t.key ? "text-amber-400 border-amber-400" : "text-slate-400 border-transparent hover:text-slate-200"}`}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-6">
        {tab === "email"     && <TemplateEditor templates={EMAIL_TEMPLATES} />}
        {tab === "sms"       && <TemplateEditor templates={SMS_TEMPLATES} />}
        {tab === "whatsapp"  && <TemplateEditor templates={WHATSAPP_TEMPLATES} />}
        {tab === "reminders" && <RemindersTab />}
        {tab === "alerts"    && <AlertsTab />}
        {tab === "schedule"  && <ScheduleTab />}
        {tab === "logs"      && <LogsTab />}
      </div>
    </div>
  );
}
