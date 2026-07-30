import { useState } from "react";
import { AlertTriangle, Clock, CheckCircle2, X, ChevronDown, ChevronUp } from "lucide-react";
import { TASKS, Task, SLA_CFG, PRIORITY_CFG, SLAStatus } from "./data";

function SLABadge({ status }: { status: SLAStatus }) {
  const cfg = SLA_CFG[status];
  const Icon = status === "overdue" ? AlertTriangle : status === "due_soon" ? Clock : CheckCircle2;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon size={9} />
      {cfg.label}
    </span>
  );
}

const TABS: { key: SLAStatus | "all" | "done"; label: string }[] = [
  { key: "all",      label: "All Active" },
  { key: "overdue",  label: "Overdue"    },
  { key: "due_soon", label: "Due Soon"   },
  { key: "ok",       label: "On Track"   },
  { key: "done",     label: "Completed"  },
];

export default function AssignedTasks() {
  const [tab, setTab]       = useState<SLAStatus | "all" | "done">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [sort, setSort]     = useState<"sla" | "due" | "priority">("sla");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tasks, setTasks]   = useState<Task[]>(TASKS);

  const base = tasks.filter(t => {
    if (tab === "done")    return t.done;
    if (tab === "all")     return !t.done;
    return !t.done && t.slaStatus === tab;
  }).filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.appRef.toLowerCase().includes(search.toLowerCase()) ||
    t.applicantName.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...base].sort((a, b) => {
    if (sort === "sla") {
      const o = { overdue: 0, due_soon: 1, ok: 2 };
      return o[a.slaStatus] - o[b.slaStatus];
    }
    if (sort === "priority") {
      const o = { urgent: 0, high: 1, normal: 2, low: 3 };
      return o[a.priority] - o[b.priority];
    }
    return a.dueAt.localeCompare(b.dueAt);
  });

  const allChecked = sorted.length > 0 && sorted.every(t => selected.includes(t.id));
  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(allChecked ? [] : sorted.map(t => t.id));
  const markDone = (ids: string[]) => {
    setTasks(ts => ts.map(t => ids.includes(t.id) ? { ...t, done: true } : t));
    setSelected([]);
  };

  const ovCt  = tasks.filter(t => !t.done && t.slaStatus === "overdue").length;
  const dueCt = tasks.filter(t => !t.done && t.slaStatus === "due_soon").length;
  const okCt  = tasks.filter(t => !t.done && t.slaStatus === "ok").length;
  const doneCt= tasks.filter(t => t.done).length;

  const th = "px-3 py-2 text-left text-[9.5px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap";

  return (
    <div className="p-5 space-y-4 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-[18px] font-bold">Assigned Tasks</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {tasks.filter(t=>!t.done).length} pending · {ovCt} overdue · {dueCt} due soon
          </p>
        </div>
        <input
          type="text" placeholder="Search tasks, refs, applicants…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-56 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 bg-white"
        />
      </div>

      {/* Overdue alert */}
      {ovCt > 0 && (
        <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-300 rounded-xl">
          <AlertTriangle size={13} className="text-red-600 flex-shrink-0" />
          <p className="text-[11.5px] font-bold text-red-700">
            {ovCt} overdue task{ovCt > 1 ? "s" : ""} — SLA breached. Immediate action required.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5">
        {TABS.map(t => {
          const count = t.key === "all" ? tasks.filter(x=>!x.done).length
            : t.key === "done" ? doneCt
            : tasks.filter(x => !x.done && x.slaStatus === t.key).length;
          const active = tab === t.key;
          const dotColor = t.key === "overdue" ? "bg-red-500" : t.key === "due_soon" ? "bg-amber-400" : t.key === "ok" ? "bg-emerald-500" : "";
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-semibold transition-all
                ${active ? "bg-[#1A2332] text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              {dotColor && <span className={`size-1.5 rounded-full ${dotColor}`} />}
              {t.label}
              <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-slate-400">Sort:</span>
          {(["sla","due","priority"] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all
                ${sort === s ? "bg-sky-100 text-sky-700" : "text-slate-400 hover:text-slate-600"}`}
            >
              {s === "sla" ? "SLA Status" : s === "due" ? "Due Time" : "Priority"}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-sky-200 bg-sky-50">
          <span className="text-[11px] font-bold text-sky-700">{selected.length} selected</span>
          <button onClick={() => markDone(selected)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[10.5px] font-bold hover:bg-emerald-600 transition-colors">
            <CheckCircle2 size={11} /> Mark Complete
          </button>
          <button onClick={() => setSelected([])}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[10.5px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
            <X size={10} /> Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-3 py-2 w-8">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll}
                    className="rounded border-slate-300 text-sky-500 focus:ring-sky-400/40" />
                </th>
                {["SLA Status","Task","Case Ref","Applicant","Type","Priority","Due",""].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.map(t => {
                const pc = PRIORITY_CFG[t.priority];
                const isExp = expanded === t.id;
                return (
                  <>
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer
                        ${t.slaStatus === "overdue" && !t.done ? "bg-red-50/40" : ""}
                        ${t.done ? "opacity-50" : ""}`}
                      onClick={() => setExpanded(isExp ? null : t.id)}
                    >
                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggle(t.id)}
                          className="rounded border-slate-300 text-sky-500 focus:ring-sky-400/40" />
                      </td>
                      <td className="px-3 py-2.5">
                        <SLABadge status={t.slaStatus} />
                      </td>
                      <td className="px-3 py-2.5">
                        <p className={`text-[11.5px] font-semibold ${t.done ? "line-through text-slate-400" : "text-slate-800"}`}>{t.title}</p>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] font-bold text-sky-700">{t.appRef}</td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-600">{t.applicantName}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{t.type}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <span className={`size-1.5 rounded-full ${pc.dot}`} />
                          <span className={`text-[10px] font-semibold ${pc.color}`}>{pc.label}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-mono text-slate-500 whitespace-nowrap">{t.dueAt}</td>
                      <td className="px-3 py-2.5">
                        {isExp ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
                      </td>
                    </tr>
                    {isExp && (
                      <tr key={`${t.id}-exp`} className="bg-slate-50">
                        <td colSpan={9} className="px-5 py-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-[10.5px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Task Description</p>
                              <p className="text-[11.5px] text-slate-700">{t.description}</p>
                            </div>
                            {!t.done && (
                              <button onClick={() => markDone([t.id])}
                                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[10.5px] font-bold hover:bg-emerald-600 transition-colors">
                                <CheckCircle2 size={11} /> Mark Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[11px] text-slate-400">
                    No tasks match the current filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
