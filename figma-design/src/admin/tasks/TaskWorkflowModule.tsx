import { useState } from "react";
import {
  LayoutGrid, UserCheck, Gauge, GitBranch, AlertTriangle, MessageSquare,
  Plus, X, ChevronRight, Search, Trash2, GripVertical, Clock, Paperclip,
  CheckCircle2, ArrowRight, ArrowDown, ChevronUp, ChevronDown, Lock,
} from "lucide-react";
import {
  TASKS, STAFF_WORKLOAD, SLA_CONFIG, WORKFLOW_TEMPLATES, ESCALATION_RULES, DEMO_COMMENTS,
  Task, WorkflowTemplate, WorkflowStep, EscalationRule, Comment,
  SLAConfig,
} from "./data";
import { PipelineKanban } from "../shared/PipelineKanban";
import type { PipelineStage, PipelineCard } from "../shared/PipelineKanban";

type TaskTab = "tasks" | "assignment" | "sla" | "workflow" | "escalation" | "comments";

const TABS: { key: TaskTab; label: string; icon: React.ElementType }[] = [
  { key: "tasks",      label: "Task Board",       icon: LayoutGrid    },
  { key: "assignment", label: "Work Assignment",  icon: UserCheck     },
  { key: "sla",        label: "Priority & SLA",   icon: Gauge         },
  { key: "workflow",   label: "Workflow Builder",  icon: GitBranch     },
  { key: "escalation", label: "Escalation Rules",  icon: AlertTriangle },
  { key: "comments",   label: "Comments",          icon: MessageSquare },
];

const PRIORITY_COLOR: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border border-red-500/30",
  high:     "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  medium:   "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  low:      "bg-slate-600/40 text-slate-400 border border-slate-600/40",
};

const STATUS_COLOR: Record<string, string> = {
  backlog:     "bg-slate-600/40 text-slate-400",
  todo:        "bg-blue-500/15 text-blue-400",
  in_progress: "bg-amber-500/15 text-amber-400",
  review:      "bg-purple-500/15 text-purple-400",
  done:        "bg-emerald-500/15 text-emerald-400",
  blocked:     "bg-red-500/15 text-red-400",
};

function Pill({ cls, label }: { cls: string; label: string }) {
  return <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

// ── Task Board (Kanban) ───────────────────────────────────────────────────────
const TASK_STAGES: PipelineStage[] = [
  { key:"backlog",     label:"Backlog",      color:"bg-slate-800",     textColor:"text-slate-400"  },
  { key:"todo",        label:"To Do",        color:"bg-blue-900/50",   textColor:"text-blue-300"   },
  { key:"in_progress", label:"In Progress",  color:"bg-amber-900/50",  textColor:"text-amber-300"  },
  { key:"review",      label:"In Review",    color:"bg-purple-900/50", textColor:"text-purple-300" },
  { key:"done",        label:"Done",         color:"bg-emerald-900/50",textColor:"text-emerald-300"},
  { key:"blocked",     label:"Blocked",      color:"bg-red-900/50",    textColor:"text-red-300"    },
];

interface TaskCard extends PipelineCard {
  priority: string;
  dueDate: string;
  logged: string;
}

function TaskBoardTab() {
  const [selected, setSelected] = useState<Task | null>(null);

  const cards: TaskCard[] = TASKS.map(t => ({
    id: t.id,
    stage: t.status,
    title: t.title,
    subtitle: t.assigneeName,
    meta: t.ref,
    badge: t.priority,
    badgeColor: t.priority === "critical" ? "bg-red-500/20 text-red-400" :
                t.priority === "high"     ? "bg-orange-500/20 text-orange-400" :
                t.priority === "medium"   ? "bg-amber-500/20 text-amber-400" :
                                            "bg-slate-600/40 text-slate-400",
    priority: t.priority,
    dueDate: t.dueDate,
    logged: `${t.loggedHours}/${t.estimatedHours}h`,
  }));

  const handleClick = (card: TaskCard) => {
    const task = TASKS.find(t => t.id === card.id) ?? null;
    setSelected(task);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
          <input placeholder="Search tasks…" className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-48" />
        </div>
        <select className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none">
          <option value="">All Assignees</option>
          {STAFF_WORKLOAD.map(s => <option key={s.empId}>{s.name}</option>)}
        </select>
        <select className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none">
          <option value="">All Priorities</option>
          <option>critical</option><option>high</option><option>medium</option><option>low</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label:"Open", value: TASKS.filter(t=>!["done"].includes(t.status)).length, color:"text-amber-400" },
              { label:"Blocked", value: TASKS.filter(t=>t.status==="blocked").length, color:"text-red-400" },
              { label:"Due Today", value: 2, color:"text-orange-400" },
              { label:"Done", value: TASKS.filter(t=>t.status==="done").length, color:"text-emerald-400" },
            ].map(k => (
              <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded px-3 py-1.5 text-center">
                <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-slate-500">{k.label}</p>
              </div>
            ))}
          </div>
          <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1.5 rounded font-medium ml-1"><Plus size={12} /> New Task</button>
        </div>
      </div>

      <PipelineKanban<TaskCard>
        stages={TASK_STAGES}
        cards={cards}
        onCardClick={handleClick}
        columnWidth={210}
      />

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-[480px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-slate-700">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500 font-mono">{selected.ref}</span>
                  <Pill cls={PRIORITY_COLOR[selected.priority]} label={selected.priority} />
                  <Pill cls={STATUS_COLOR[selected.status]} label={selected.status.replace("_"," ")} />
                </div>
                <p className="font-semibold text-slate-100 text-sm leading-snug">{selected.title}</p>
              </div>
              <button onClick={() => setSelected(null)}><X size={14} className="text-slate-400" /></button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-400">{selected.description}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l:"Assignee",   v: selected.assigneeName },
                  { l:"Department", v: selected.department   },
                  { l:"Due Date",   v: selected.dueDate      },
                  { l:"Created",    v: selected.createdAt    },
                  { l:"Case Ref",   v: selected.caseRef ?? "—" },
                  { l:"Case Type",  v: selected.caseType ?? "—" },
                ].map(r => (
                  <div key={r.l}>
                    <p className="text-slate-500">{r.l}</p>
                    <p className="text-slate-200 font-medium">{r.v}</p>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Time Logged</span>
                  <span className="text-slate-200">{selected.loggedHours}h / {selected.estimatedHours}h</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{width:`${Math.min(100,(selected.loggedHours/selected.estimatedHours)*100)}%`}} />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {selected.tags.map(tag => (
                  <span key={tag} className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-xs">#{tag}</span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <span className="flex items-center gap-1"><MessageSquare size={11} /> {selected.commentCount}</span>
                <span className="flex items-center gap-1"><Paperclip size={11} /> {selected.attachments}</span>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-slate-700">
              <button className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">Edit Task</button>
              <button className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs">Reassign</button>
              <button className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium">Mark Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Work Assignment Tab ───────────────────────────────────────────────────────
function AssignmentTab() {
  const [selectedStaff, setSelectedStaff] = useState(STAFF_WORKLOAD[0]);

  const staffTasks = TASKS.filter(t => t.assigneeId === selectedStaff.empId && t.status !== "done");

  return (
    <div className="flex gap-4 h-full">
      {/* staff list */}
      <div className="w-72 flex-shrink-0 space-y-2">
        <p className="text-xs font-semibold text-slate-400 px-1 mb-2">Staff Workload</p>
        {STAFF_WORKLOAD.map(staff => {
          const utilPct = staff.utilization;
          const barColor = utilPct >= 90 ? "bg-red-500" : utilPct >= 70 ? "bg-amber-500" : "bg-emerald-500";
          return (
            <button
              key={staff.empId}
              onClick={() => setSelectedStaff(staff)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedStaff.empId === staff.empId ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-800/60 hover:border-slate-600"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {staff.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{staff.name}</p>
                  <p className="text-xs text-slate-500">{staff.department}</p>
                </div>
                {staff.overdueCount > 0 && (
                  <span className="bg-red-500/20 text-red-400 text-xs px-1.5 rounded">{staff.overdueCount} late</span>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">{staff.activeTasks}/{staff.capacity} tasks</span>
                  <span className={utilPct >= 90 ? "text-red-400" : utilPct >= 70 ? "text-amber-400" : "text-emerald-400"}>{utilPct}%</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} rounded-full transition-all`} style={{width:`${utilPct}%`}} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* task list for selected staff */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-200">{selectedStaff.name}</p>
            <p className="text-xs text-slate-400">{selectedStaff.designation} · {selectedStaff.department}</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-center">
              <p className="text-amber-400 font-bold">{selectedStaff.activeTasks}</p>
              <p className="text-slate-500">Active</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-center">
              <p className="text-red-400 font-bold">{selectedStaff.overdueCount}</p>
              <p className="text-slate-500">Overdue</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-center">
              <p className="text-slate-200 font-bold">{selectedStaff.avgCompletionDays}d</p>
              <p className="text-slate-500">Avg. Close</p>
            </div>
            <button className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1.5 rounded font-medium ml-1"><Plus size={12} /> Assign Task</button>
          </div>
        </div>

        {staffTasks.length === 0 ? (
          <div className="flex items-center justify-center h-40 bg-slate-800/60 border border-slate-700 rounded-xl">
            <p className="text-slate-500 text-sm">No active tasks for this staff member</p>
          </div>
        ) : (
          <div className="space-y-2">
            {staffTasks.map(task => (
              <div key={task.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-slate-500 font-mono">{task.ref}</span>
                      <Pill cls={PRIORITY_COLOR[task.priority]} label={task.priority} />
                      <Pill cls={STATUS_COLOR[task.status]} label={task.status.replace("_"," ")} />
                    </div>
                    <p className="text-sm font-medium text-slate-200 leading-snug">{task.title}</p>
                  </div>
                  <div className="flex-shrink-0 text-right text-xs">
                    <p className="text-slate-500">Due</p>
                    <p className="text-slate-300">{task.dueDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-slate-400">{task.loggedHours}h / {task.estimatedHours}h</span>
                    </div>
                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500/70 rounded-full" style={{width:`${Math.min(100,(task.loggedHours/task.estimatedHours)*100)}%`}} />
                    </div>
                  </div>
                  <button className="text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 px-2 py-1 rounded">Reassign</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── SLA Config Tab ────────────────────────────────────────────────────────────
function SLATab() {
  const [selected, setSelected] = useState<SLAConfig | null>(null);
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:"Active SLA Rules",  value: SLA_CONFIG.filter(s=>s.active).length, color:"text-emerald-400" },
          { label:"Critical Response", value: "1h",                                   color:"text-red-400"    },
          { label:"High Response",     value: "2h",                                   color:"text-orange-400" },
          { label:"Breaches Today",    value: 2,                                       color:"text-amber-400"  },
        ].map(k => (
          <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center">
            <p className="text-sm font-semibold text-slate-200">SLA Configuration</p>
            <button className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-2.5 py-1 rounded font-medium flex items-center gap-1"><Plus size={11} /> Add Rule</button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/60">
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Priority</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Service</th>
                <th className="text-right px-4 py-2.5 text-slate-400 font-medium">First Response</th>
                <th className="text-right px-4 py-2.5 text-slate-400 font-medium">Resolution</th>
                <th className="text-right px-4 py-2.5 text-slate-400 font-medium">Escalation At</th>
                <th className="text-center px-4 py-2.5 text-slate-400 font-medium">Email</th>
                <th className="text-center px-4 py-2.5 text-slate-400 font-medium">Active</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {SLA_CONFIG.map(s => (
                <tr key={s.id} onClick={() => { setSelected(s); setEditMode(false); }} className="border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <Pill cls={PRIORITY_COLOR[s.priority]} label={s.priority} />
                  </td>
                  <td className="px-4 py-3 text-slate-300">{s.service}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-200">{s.firstResponseHours}h</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-200">{s.resolutionHours}h</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-400">{s.escalationHours}h</td>
                  <td className="px-4 py-3 text-center">
                    {s.breachActionEmail ? <CheckCircle2 size={13} className="text-emerald-400 mx-auto" /> : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className={`w-8 h-4 rounded-full mx-auto ${s.active ? "bg-emerald-600" : "bg-slate-600"}`}>
                      <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-all ${s.active ? "ml-4.5" : "ml-0.5"}`} style={{marginLeft: s.active ? "18px" : "2px"}} />
                    </div>
                  </td>
                  <td className="px-4 py-3"><ChevronRight size={12} className="text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="w-64 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <span className="text-xs font-semibold text-slate-200">SLA Rule</span>
              <div className="flex gap-2">
                <button onClick={() => setEditMode(e => !e)} className="text-xs text-amber-400 hover:text-amber-300">{editMode ? "Cancel" : "Edit"}</button>
                <button onClick={() => setSelected(null)}><X size={14} className="text-slate-400" /></button>
              </div>
            </div>
            <div className="p-4 space-y-3 text-xs flex-1">
              <Pill cls={PRIORITY_COLOR[selected.priority]} label={selected.priority} />
              {editMode ? (
                <div className="space-y-3">
                  {[
                    { label:"First Response (h)", field:"firstResponseHours", val: selected.firstResponseHours },
                    { label:"Resolution (h)",     field:"resolutionHours",   val: selected.resolutionHours   },
                    { label:"Escalation (h)",     field:"escalationHours",   val: selected.escalationHours   },
                  ].map(f => (
                    <div key={f.field}>
                      <p className="text-slate-500 mb-1">{f.label}</p>
                      <input type="number" defaultValue={f.val} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500" />
                    </div>
                  ))}
                  <button className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded font-medium">Save</button>
                </div>
              ) : (
                <>
                  {[
                    { l:"Service",        v: selected.service },
                    { l:"First Response", v: `${selected.firstResponseHours}h` },
                    { l:"Resolution SLA", v: `${selected.resolutionHours}h` },
                    { l:"Escalate After", v: `${selected.escalationHours}h` },
                    { l:"Email on Breach",v: selected.breachActionEmail ? "Yes" : "No" },
                    { l:"Slack Alert",    v: selected.breachActionSlack ? "Yes" : "No" },
                  ].map(r => (
                    <div key={r.l} className="flex justify-between">
                      <span className="text-slate-500">{r.l}</span>
                      <span className="text-slate-200">{r.v}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Workflow Builder Tab ──────────────────────────────────────────────────────
const STEP_TYPE_COLOR: Record<string, string> = {
  approval:     "bg-blue-500/20 text-blue-400 border-blue-500/30",
  notification: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  condition:    "bg-purple-500/20 text-purple-400 border-purple-500/30",
  action:       "bg-amber-500/20 text-amber-400 border-amber-500/30",
};
const STEP_TYPE_BG: Record<string, string> = {
  approval:     "bg-blue-600",
  notification: "bg-teal-600",
  condition:    "bg-purple-600",
  action:       "bg-amber-600",
};

function WorkflowBuilderTab() {
  const [selectedWF, setSelectedWF] = useState<WorkflowTemplate>(WORKFLOW_TEMPLATES[0]);
  const [steps, setSteps] = useState<WorkflowStep[]>(WORKFLOW_TEMPLATES[0].steps);

  const selectWF = (wf: WorkflowTemplate) => {
    setSelectedWF(wf);
    setSteps(wf.steps);
  };

  const removeStep = (id: string) => setSteps(ss => ss.filter(s => s.id !== id));

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `s${Date.now()}`,
      order: steps.length + 1,
      name: "New Step",
      type: "approval",
      assigneeRole: "Manager",
      timeoutHours: 24,
      onApprove: "next_step",
      onReject: "terminate",
    };
    setSteps(ss => [...ss, newStep]);
  };

  return (
    <div className="flex gap-4 h-full">
      {/* template list */}
      <div className="w-56 flex-shrink-0 space-y-2">
        <p className="text-xs font-semibold text-slate-400 px-1 mb-2">Workflow Templates</p>
        {WORKFLOW_TEMPLATES.map(wf => (
          <button
            key={wf.id}
            onClick={() => selectWF(wf)}
            className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedWF.id === wf.id ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-800/60 hover:border-slate-600"}`}
          >
            <p className="text-xs font-medium text-slate-200 leading-snug">{wf.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{wf.service} · {wf.steps.length} steps</p>
            <p className="text-xs text-slate-600 mt-0.5">Used {wf.usageCount}×</p>
          </button>
        ))}
        <button className="w-full flex items-center justify-center gap-1 p-2.5 border border-dashed border-slate-600 rounded-xl text-xs text-slate-500 hover:border-amber-500/50 hover:text-amber-400 transition-colors">
          <Plus size={12} /> New Template
        </button>
      </div>

      {/* builder canvas */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-200">{selectedWF.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{selectedWF.description}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={addStep} className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1.5 rounded"><Plus size={11} /> Add Step</button>
            <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-2.5 py-1.5 rounded font-medium">Save Workflow</button>
          </div>
        </div>

        {/* step pipeline (vertical) */}
        <div className="space-y-0">
          {steps.map((step, idx) => (
            <div key={step.id} className="relative">
              <div className="flex gap-3 items-stretch">
                {/* step card */}
                <div className="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${STEP_TYPE_BG[step.type]}`}>
                      {step.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-200">{step.name}</p>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium border ${STEP_TYPE_COLOR[step.type]}`}>{step.type}</span>
                      </div>
                      <p className="text-xs text-slate-400">{step.assigneeRole} · Timeout: {step.timeoutHours}h</p>
                      {step.description && <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>}
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx > 0 && <button className="p-1 hover:bg-slate-700 rounded"><ChevronUp size={12} className="text-slate-400" /></button>}
                      {idx < steps.length-1 && <button className="p-1 hover:bg-slate-700 rounded"><ChevronDown size={12} className="text-slate-400" /></button>}
                      <button onClick={() => removeStep(step.id)} className="p-1 hover:bg-red-900/40 rounded"><Trash2 size={12} className="text-red-400" /></button>
                    </div>
                    <GripVertical size={14} className="text-slate-600 cursor-grab flex-shrink-0" />
                  </div>
                  {/* branch indicators */}
                  <div className="flex gap-3 mt-3 text-xs">
                    <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 rounded px-2 py-0.5">
                      <CheckCircle2 size={10} />
                      <span>Approve → {step.onApprove === "complete" ? "Complete" : "Next Step"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-400 bg-red-500/10 rounded px-2 py-0.5">
                      <X size={10} />
                      <span>Reject → {step.onReject === "terminate" ? "Terminate" : step.onReject === "previous_step" ? "Previous Step" : "Escalate"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 rounded px-2 py-0.5">
                      <Clock size={10} />
                      <span>Timeout: {step.timeoutHours}h</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* connector arrow */}
              {idx < steps.length - 1 && (
                <div className="flex justify-center my-1">
                  <ArrowDown size={16} className="text-slate-600" />
                </div>
              )}
            </div>
          ))}
          {/* end node */}
          <div className="flex justify-center mt-2">
            <div className="bg-emerald-900/40 border border-emerald-700/50 rounded-full px-4 py-1.5 text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 size={12} /> Complete
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Escalation Rules Tab ──────────────────────────────────────────────────────
const TRIGGER_COLOR: Record<string, string> = {
  sla_breach:       "bg-red-500/15 text-red-400",
  overdue:          "bg-orange-500/15 text-orange-400",
  no_response:      "bg-amber-500/15 text-amber-400",
  rejection_chain:  "bg-purple-500/15 text-purple-400",
};
const ACTION_COLOR: Record<string, string> = {
  reassign:    "bg-blue-500/15 text-blue-400",
  notify:      "bg-slate-500/15 text-slate-300",
  auto_approve:"bg-emerald-500/15 text-emerald-400",
  flag:        "bg-amber-500/15 text-amber-400",
};

function EscalationTab() {
  const [selected, setSelected] = useState<EscalationRule | null>(null);

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
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Rule Name</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Trigger</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Service</th>
                <th className="text-right px-4 py-2.5 text-slate-400 font-medium">After (h)</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Action</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Escalate To</th>
                <th className="text-right px-4 py-2.5 text-slate-400 font-medium">Triggers</th>
                <th className="text-center px-4 py-2.5 text-slate-400 font-medium">Active</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {ESCALATION_RULES.map(rule => (
                <tr key={rule.id} onClick={() => setSelected(rule)} className="border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30">
                  <td className="px-4 py-3 font-medium text-slate-200">{rule.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${TRIGGER_COLOR[rule.triggerType]}`}>
                      {rule.triggerType.replace("_"," ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{rule.service}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-200">{rule.conditionHours}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${ACTION_COLOR[rule.action]}`}>
                      {rule.action.replace("_"," ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{rule.escalateTo}</td>
                  <td className="px-4 py-3 text-right font-bold text-amber-400">{rule.triggerCount}</td>
                  <td className="px-4 py-3 text-center">
                    <div className={`w-8 h-4 rounded-full mx-auto ${rule.active ? "bg-emerald-600" : "bg-slate-600"}`}>
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
        <div className="w-72 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-200">Escalation Rule</span>
            <button onClick={() => setSelected(null)}><X size={14} className="text-slate-400" /></button>
          </div>
          <div className="p-4 flex-1 space-y-3 text-xs">
            <p className="font-semibold text-slate-200">{selected.name}</p>
            <div className="flex gap-2">
              <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${TRIGGER_COLOR[selected.triggerType]}`}>{selected.triggerType.replace("_"," ")}</span>
              <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${ACTION_COLOR[selected.action]}`}>{selected.action.replace("_"," ")}</span>
            </div>
            {[
              { l:"Service",        v: selected.service       },
              { l:"Condition",      v: `After ${selected.conditionHours}h` },
              { l:"Escalate To",    v: selected.escalateTo    },
              { l:"Last Triggered", v: selected.lastTriggered ?? "Never" },
              { l:"Total Triggers", v: String(selected.triggerCount) },
            ].map(r => (
              <div key={r.l} className="flex justify-between">
                <span className="text-slate-500">{r.l}</span>
                <span className="text-slate-200">{r.v}</span>
              </div>
            ))}
            <div>
              <p className="text-slate-500 mb-1">Notify Roles</p>
              <div className="flex flex-wrap gap-1">
                {selected.notifyRoles.map(r => (
                  <span key={r} className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-xs">{r}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="p-3 border-t border-slate-700 flex gap-2">
            <button className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">Edit</button>
            <button className="flex-1 py-1.5 bg-red-600/70 hover:bg-red-600 text-white rounded text-xs">Disable</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Comments & Notes Thread ───────────────────────────────────────────────────
function CommentsTab() {
  const [caseFilter, setCaseFilter] = useState<string>("all");
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(true);

  const cases = Array.from(new Set(DEMO_COMMENTS.map(c => c.caseRef)));
  const filtered = caseFilter === "all" ? DEMO_COMMENTS : DEMO_COMMENTS.filter(c => c.caseRef === caseFilter);
  const sorted = [...filtered].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return (
    <div className="flex gap-4 h-full">
      {/* case filter sidebar */}
      <div className="w-52 flex-shrink-0 space-y-1">
        <p className="text-xs font-semibold text-slate-400 px-1 mb-2">Case Threads</p>
        <button
          onClick={() => setCaseFilter("all")}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${caseFilter === "all" ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"}`}
        >
          All Comments <span className="float-right text-slate-500">{DEMO_COMMENTS.length}</span>
        </button>
        {cases.map(ref => {
          const count = DEMO_COMMENTS.filter(c => c.caseRef === ref).length;
          const caseType = DEMO_COMMENTS.find(c => c.caseRef === ref)?.caseType;
          return (
            <button
              key={ref}
              onClick={() => setCaseFilter(ref)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${caseFilter === ref ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"}`}
            >
              <p className="font-mono">{ref}</p>
              <p className="text-slate-500">{caseType} · {count} notes</p>
            </button>
          );
        })}
      </div>

      {/* thread */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {sorted.map(comment => (
            <div key={comment.id} className={`rounded-xl p-4 border ${comment.isInternal ? "bg-amber-500/5 border-amber-500/20" : "bg-slate-800/60 border-slate-700"}`}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {comment.authorName.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-slate-200">{comment.authorName}</span>
                    <span className="text-xs text-slate-500">{comment.authorRole}</span>
                    {comment.isInternal && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        <Lock size={9} /> Internal
                      </span>
                    )}
                    {comment.pinned && (
                      <span className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Pinned</span>
                    )}
                    <span className="text-xs text-slate-600 ml-auto">{comment.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{comment.text}</p>
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {comment.attachments.map(a => (
                        <div key={a.name} className="flex items-center gap-1.5 bg-slate-700/50 rounded px-2 py-1 text-xs text-slate-300">
                          <Paperclip size={9} className="text-slate-500" />
                          <span>{a.name}</span>
                          <span className="text-slate-500">{a.size}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3 mt-2">
                    <button className="text-xs text-slate-500 hover:text-slate-300">Reply</button>
                    <button className="text-xs text-slate-500 hover:text-slate-300">Edit</button>
                  </div>
                </div>
              </div>
              {caseFilter === "all" && (
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs text-slate-600 font-mono">{comment.caseRef}</span>
                  <span className="text-xs text-slate-600">·</span>
                  <span className="text-xs text-slate-600">{comment.caseType}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* compose */}
        <div className="flex-shrink-0 bg-slate-800/60 border border-slate-700 rounded-xl p-3">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment or note… use @name to mention someone"
            rows={3}
            className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none"
          />
          <div className="flex items-center gap-2 mt-2 border-t border-slate-700 pt-2">
            <button
              onClick={() => setIsInternal(i => !i)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${isInternal ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-400"}`}
            >
              <Lock size={10} /> {isInternal ? "Internal" : "External"}
            </button>
            <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 px-2 py-1">
              <Paperclip size={10} /> Attach
            </button>
            <div className="ml-auto flex gap-2">
              <button
                disabled={!newComment.trim()}
                className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 px-3 py-1.5 rounded font-medium"
              >
                <ArrowRight size={11} /> Post Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────
export default function TaskWorkflowModule() {
  const [tab, setTab] = useState<TaskTab>("tasks");

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-slate-700/60">
        <h1 className="text-lg font-bold text-slate-100">Tasks &amp; Workflow</h1>
        <p className="text-xs text-slate-500 mt-0.5">Task management, work assignment, approval workflows, and SLA tracking</p>
      </div>

      <div className="flex-shrink-0 flex gap-0.5 px-6 pt-3 border-b border-slate-700/60 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors rounded-t border-b-2 ${
              tab === t.key
                ? "text-amber-400 border-amber-400"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {tab === "tasks"      && <TaskBoardTab />}
        {tab === "assignment" && <AssignmentTab />}
        {tab === "sla"        && <SLATab />}
        {tab === "workflow"   && <WorkflowBuilderTab />}
        {tab === "escalation" && <EscalationTab />}
        {tab === "comments"   && <CommentsTab />}
      </div>
    </div>
  );
}
