import { Link } from "react-router";
import {
  AlertTriangle, Clock, CheckCircle2, ArrowRight,
  Folder, CalendarDays, Users, TrendingUp,
} from "lucide-react";
import {
  TASKS, APPLICATIONS, EVENTS, ME, STAGES,
  SLA_CFG, PRIORITY_CFG,
} from "./data";

function SLABadge({ status }: { status: "ok"|"due_soon"|"overdue" }) {
  const cfg = SLA_CFG[status];
  const Icon = status === "overdue" ? AlertTriangle : status === "due_soon" ? Clock : CheckCircle2;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon size={8} />
      {cfg.label}
    </span>
  );
}

export default function MyDashboard() {
  const myApps   = APPLICATIONS.filter(a => a.assignedTo === ME.id);
  const myTasks  = TASKS.filter(t => t.assignedTo === ME.id && !t.done);
  const overdue  = myTasks.filter(t => t.slaStatus === "overdue");
  const dueSoon  = myTasks.filter(t => t.slaStatus === "due_soon");
  const todayEvt = EVENTS.filter(e => e.date === "2025-01-09").sort((a,b) => a.time.localeCompare(b.time));

  const TYPE_COLOR: Record<string,string> = {
    interview: "bg-purple-100 text-purple-700 border-purple-200",
    biometric: "bg-blue-100 text-blue-700 border-blue-200",
    meeting:   "bg-slate-100 text-slate-600 border-slate-200",
    deadline:  "bg-red-100 text-red-700 border-red-200",
    call:      "bg-teal-100 text-teal-700 border-teal-200",
  };

  return (
    <div className="p-5 space-y-4 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-slate-800 text-[18px] font-bold">
          Good morning, {ME.name.split(" ")[0]}
        </h1>
        <p className="text-[11px] text-slate-400 mt-0.5">Thursday, 9 January 2025 · {myApps.length} active cases · {myTasks.length} tasks pending</p>
      </div>

      {/* SLA alerts */}
      {overdue.length > 0 && (
        <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-300 rounded-xl">
          <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11.5px] font-bold text-red-700 mb-1">
              {overdue.length} overdue task{overdue.length > 1 ? "s" : ""} — action required immediately
            </p>
            <div className="flex flex-wrap gap-1.5">
              {overdue.map(t => (
                <span key={t.id} className="text-[10px] font-mono font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                  {t.appRef}
                </span>
              ))}
            </div>
          </div>
          <Link to="/staff/tasks" className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-0.5 flex-shrink-0">
            View tasks <ArrowRight size={9} />
          </Link>
        </div>
      )}
      {dueSoon.length > 0 && (
        <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <Clock size={13} className="text-amber-600 flex-shrink-0" />
          <p className="text-[11.5px] font-semibold text-amber-700 flex-1">
            {dueSoon.length} task{dueSoon.length > 1 ? "s" : ""} due soon — complete today
          </p>
          <Link to="/staff/tasks" className="text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-0.5">
            View <ArrowRight size={9} />
          </Link>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Cases",   value: myApps.length,                                   icon: Folder,      vc: "text-sky-600",     ic: "bg-sky-50 text-sky-600"     },
          { label: "Overdue Tasks",  value: overdue.length,                                  icon: AlertTriangle,vc: "text-red-600",    ic: "bg-red-50 text-red-600"     },
          { label: "Due Today",      value: dueSoon.length,                                  icon: Clock,       vc: "text-amber-600",   ic: "bg-amber-50 text-amber-600" },
          { label: "Meetings Today", value: todayEvt.filter(e => e.type === "meeting").length,icon: CalendarDays,vc: "text-slate-700",  ic: "bg-slate-100 text-slate-500"},
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide">{k.label}</p>
              <div className={`size-6 rounded-md flex items-center justify-center ${k.ic}`}><k.icon size={11} /></div>
            </div>
            <p className={`text-[28px] font-bold leading-none ${k.vc}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Priority tasks */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-[12px] font-bold text-slate-800">Today&apos;s Priority Tasks</p>
            <Link to="/staff/tasks" className="text-[10px] font-semibold text-sky-600 hover:underline flex items-center gap-0.5">
              All tasks <ArrowRight size={9} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {myTasks
              .sort((a,b) => {
                const ord = { overdue: 0, due_soon: 1, ok: 2 };
                return ord[a.slaStatus] - ord[b.slaStatus];
              })
              .slice(0, 6)
              .map(t => {
                const pc = PRIORITY_CFG[t.priority];
                return (
                  <div key={t.id} className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors ${t.slaStatus === "overdue" ? "bg-red-50/40" : ""}`}>
                    <span className={`size-1.5 rounded-full flex-shrink-0 ${pc.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11.5px] font-semibold text-slate-800 truncate">{t.title}</p>
                      <p className="text-[9.5px] text-slate-400">{t.appRef} · {t.applicantName} · {t.type}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[9.5px] text-slate-400 font-mono">{t.dueAt}</span>
                      <SLABadge status={t.slaStatus} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Today's agenda */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-[12px] font-bold text-slate-800">Today&apos;s Agenda</p>
            <Link to="/staff/calendar" className="text-[10px] font-semibold text-sky-600 hover:underline">Calendar</Link>
          </div>
          {todayEvt.length === 0 ? (
            <div className="flex items-center justify-center h-24">
              <p className="text-[11px] text-slate-400">No events today</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {todayEvt.map(e => (
                <div key={e.id} className="flex items-start gap-3 px-4 py-2.5">
                  <div className="text-right flex-shrink-0 w-10">
                    <p className="text-[10px] font-bold text-slate-700">{e.time}</p>
                    <p className="text-[8.5px] text-slate-400">{e.duration}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 leading-snug">{e.title}</p>
                    <span className={`inline-block mt-0.5 text-[8.5px] font-bold px-1.5 py-0.5 rounded border ${TYPE_COLOR[e.type]}`}>
                      {e.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My cases quick overview */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-[12px] font-bold text-slate-800">My Active Cases</p>
          <Link to="/staff/apps" className="text-[10px] font-semibold text-sky-600 hover:underline flex items-center gap-0.5">
            All apps <ArrowRight size={9} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Ref","Applicant","Destination","Stage","Travel Date","SLA Due","Status",""].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[9.5px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myApps.map(app => {
                const pc = PRIORITY_CFG[app.priority];
                return (
                  <tr key={app.id} className={`hover:bg-slate-50 transition-colors ${app.slaStatus === "overdue" ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-2.5 font-mono font-bold text-[10px] text-slate-700">{app.ref}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-slate-800">{app.applicantName}</p>
                      <p className="text-[9.5px] text-slate-400">{app.nationality}</p>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{app.destination}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden" style={{ width: 60 }}>
                          <div className="h-full bg-sky-400 rounded-full" style={{ width: `${(app.stage / 14) * 100}%` }} />
                        </div>
                        <span className="text-[9.5px] text-slate-500">{STAGES[app.stage].short}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{app.travelDate}</td>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap font-mono text-[10px]">{app.slaDue}</td>
                    <td className="px-4 py-2.5"><SLABadge status={app.slaStatus} /></td>
                    <td className="px-4 py-2.5">
                      <Link to="/staff/apps" className="text-[10px] font-semibold text-sky-600 hover:underline">Open</Link>
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
