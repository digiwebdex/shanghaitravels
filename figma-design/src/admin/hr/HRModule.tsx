import { useState } from "react";
import {
  Users, Clock, Calendar, DollarSign, CreditCard, Star, Briefcase, BookOpen,
  Search, ChevronRight, X, CheckCircle2, AlertCircle, FileText, Upload,
  Plus, MoreHorizontal, User, Mail, Phone, Building2, TrendingUp, Award,
} from "lucide-react";
import {
  EMPLOYEES, ATTENDANCE_LOG, ATTENDANCE_CALENDAR, LEAVE_REQUESTS,
  PAYROLL_RUNS, PAYROLL_ENTRIES, LOANS, PERFORMANCE_REVIEWS,
  JOB_POSTINGS, TRAINING_RECORDS,
  Employee, LeaveRequest, PayrollRun, LoanAdvance, PerformanceReview, JobPosting, TrainingRecord,
  fmtAED,
} from "./data";
import { PipelineKanban } from "../shared/PipelineKanban";
import type { PipelineStage, PipelineCard } from "../shared/PipelineKanban";

type HRTab = "employees" | "attendance" | "leave" | "payroll" | "loans" | "performance" | "recruitment" | "training";

const TABS: { key: HRTab; label: string; icon: React.ElementType }[] = [
  { key: "employees",    label: "Employees",      icon: Users       },
  { key: "attendance",   label: "Attendance",     icon: Clock       },
  { key: "leave",        label: "Leave",          icon: Calendar    },
  { key: "payroll",      label: "Payroll",        icon: DollarSign  },
  { key: "loans",        label: "Loans",          icon: CreditCard  },
  { key: "performance",  label: "Performance",    icon: Star        },
  { key: "recruitment",  label: "Recruitment",    icon: Briefcase   },
  { key: "training",     label: "Training",       icon: BookOpen    },
];

const STATUS_COLORS: Record<string, string> = {
  active:    "bg-emerald-500/15 text-emerald-400",
  probation: "bg-amber-500/15 text-amber-400",
  notice:    "bg-orange-500/15 text-orange-400",
  terminated:"bg-red-500/15 text-red-400",
  on_leave:  "bg-blue-500/15 text-blue-400",
  pending:   "bg-amber-500/15 text-amber-400",
  approved:  "bg-emerald-500/15 text-emerald-400",
  rejected:  "bg-red-500/15 text-red-400",
  cancelled: "bg-slate-500/15 text-slate-400",
  draft:     "bg-slate-500/15 text-slate-400",
  processing:"bg-blue-500/15 text-blue-400",
  paid:      "bg-emerald-500/15 text-emerald-400",
  present:   "bg-emerald-500/15 text-emerald-400",
  absent:    "bg-red-500/15 text-red-400",
  late:      "bg-amber-500/15 text-amber-400",
  half_day:  "bg-blue-500/15 text-blue-400",
  leave:     "bg-purple-500/15 text-purple-400",
  holiday:   "bg-teal-500/15 text-teal-400",
  weekend:   "bg-slate-600/40 text-slate-400",
  closed:    "bg-slate-500/15 text-slate-400",
};

function Pill({ status, label }: { status: string; label?: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-slate-500/15 text-slate-400";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label ?? status.replace("_", " ")}
    </span>
  );
}

// ── Employees Tab ─────────────────────────────────────────────────────────────
function EmployeesTab() {
  const [selected, setSelected] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const [docTab, setDocTab] = useState<"profile" | "documents">("profile");

  const filtered = EMPLOYEES.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase()) ||
    e.empNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full gap-4">
      {/* list */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search employees…"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-medium">
            <Plus size={14} /> New Employee
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Total Staff",  value: EMPLOYEES.length,                                  color:"text-slate-200" },
            { label:"Active",       value: EMPLOYEES.filter(e=>e.status==="active").length,    color:"text-emerald-400" },
            { label:"Probation",    value: EMPLOYEES.filter(e=>e.status==="probation").length, color:"text-amber-400" },
            { label:"On Notice",    value: EMPLOYEES.filter(e=>e.status==="notice").length,    color:"text-orange-400" },
          ].map(k => (
            <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Employee</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Department</th>
                <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Contract</th>
                <th className="text-right px-4 py-3 text-xs text-slate-400 font-medium">Gross Salary</th>
                <th className="text-center px-4 py-3 text-xs text-slate-400 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <tr
                  key={emp.id}
                  onClick={() => setSelected(emp)}
                  className={`border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30 transition-colors ${selected?.id === emp.id ? "bg-slate-700/40" : i % 2 === 0 ? "" : "bg-slate-800/30"}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {emp.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200 text-xs">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.empNo} · {emp.designation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">{emp.department}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{emp.contractType.replace("_"," ")}</td>
                  <td className="px-4 py-3 text-right text-xs font-mono text-slate-200">
                    {fmtAED(emp.basicSalary + emp.housing + emp.transport + emp.otherAllowances)}
                  </td>
                  <td className="px-4 py-3 text-center"><Pill status={emp.status} /></td>
                  <td className="px-4 py-3"><ChevronRight size={14} className="text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* detail panel */}
      {selected && (
        <div className="w-80 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-sm font-semibold text-slate-200">{selected.empNo}</span>
            <button onClick={() => setSelected(null)}><X size={14} className="text-slate-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* avatar + name */}
            <div className="flex flex-col items-center py-5 border-b border-slate-700">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl font-bold text-white mb-2">
                {selected.name.split(" ").map(n => n[0]).join("").slice(0,2)}
              </div>
              <p className="font-semibold text-slate-200 text-sm">{selected.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{selected.designation}</p>
              <Pill status={selected.status} />
            </div>
            {/* sub-tabs */}
            <div className="flex border-b border-slate-700">
              {(["profile","documents"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setDocTab(t)}
                  className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${docTab === t ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {docTab === "profile" ? (
              <div className="p-4 space-y-3 text-xs">
                {[
                  { icon: Mail,     label:"Email",       val: selected.email      },
                  { icon: Phone,    label:"Phone",       val: selected.phone      },
                  { icon: Building2,label:"Department",  val: selected.department },
                  { icon: User,     label:"Reports To",  val: selected.reportingTo},
                  { icon: Calendar, label:"Joined",      val: selected.joinedAt   },
                  { icon: FileText, label:"Passport",    val: selected.passportNo },
                  { icon: FileText, label:"Emirates ID", val: selected.emiratesId },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-2">
                    <row.icon size={12} className="text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-500">{row.label}</p>
                      <p className="text-slate-300">{row.val}</p>
                    </div>
                  </div>
                ))}
                <div className="bg-slate-700/40 rounded-lg p-3 mt-2">
                  <p className="text-slate-400 mb-2 font-medium">Salary Breakdown</p>
                  {[
                    ["Basic",       selected.basicSalary],
                    ["Housing",     selected.housing],
                    ["Transport",   selected.transport],
                    ["Other",       selected.otherAllowances],
                  ].map(([l, v]) => (
                    <div key={String(l)} className="flex justify-between py-0.5">
                      <span className="text-slate-400">{l}</span>
                      <span className="font-mono text-slate-200">{fmtAED(Number(v))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-slate-600 pt-1 mt-1 font-semibold">
                    <span className="text-slate-300">Gross</span>
                    <span className="font-mono text-amber-400">{fmtAED(selected.basicSalary + selected.housing + selected.transport + selected.otherAllowances)}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <div className="flex-1 bg-slate-700/40 rounded p-2 text-center">
                    <p className="text-slate-400">Annual Leave</p>
                    <p className="text-emerald-400 font-bold text-lg">{selected.annualLeaveBalance}</p>
                    <p className="text-slate-500">days left</p>
                  </div>
                  <div className="flex-1 bg-slate-700/40 rounded p-2 text-center">
                    <p className="text-slate-400">Sick Leave</p>
                    <p className="text-blue-400 font-bold text-lg">{selected.sickLeaveBalance}</p>
                    <p className="text-slate-500">days left</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {selected.documents.map(doc => (
                  <div key={doc.name} className="flex items-center gap-3 p-2.5 bg-slate-700/30 rounded-lg">
                    {doc.uploaded
                      ? <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                      : <AlertCircle  size={14} className="text-amber-400 flex-shrink-0"  />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-200 truncate">{doc.name}</p>
                      {doc.expiryDate && <p className="text-xs text-slate-500">Expires: {doc.expiryDate}</p>}
                    </div>
                    {doc.uploaded
                      ? <button className="text-xs text-blue-400 hover:text-blue-300">View</button>
                      : <button className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"><Upload size={10} /> Upload</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 border-t border-slate-700 flex gap-2">
            <button className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">Edit</button>
            <button className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs">Payslip</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Attendance Tab ────────────────────────────────────────────────────────────
function AttendanceTab() {
  const CAL_STATUS_COLOR: Record<string, string> = {
    present: "bg-emerald-500/80",
    absent:  "bg-red-500/70",
    late:    "bg-amber-500/70",
    half_day:"bg-blue-500/70",
    leave:   "bg-purple-500/70",
    holiday: "bg-teal-500/70",
    weekend: "bg-slate-700",
  };

  const days = Array.from({length:25},(_,i) => {
    const d = i + 1;
    const key = `2025-01-${String(d).padStart(2,"0")}`;
    return { day: d, key, status: ATTENDANCE_CALENDAR[key] ?? null };
  });

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label:"Present Today",  value:5, color:"text-emerald-400" },
          { label:"Absent",         value:1, color:"text-red-400"     },
          { label:"Late",           value:1, color:"text-amber-400"   },
          { label:"Half Day",       value:1, color:"text-blue-400"    },
          { label:"On Leave",       value:1, color:"text-purple-400"  },
        ].map(k => (
          <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Calendar */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <p className="text-sm font-semibold text-slate-200 mb-3">January 2025 — Ayesha Rahman</p>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["S","M","T","W","T","F","S"].map((d,i) => (
              <div key={i} className="text-center text-xs text-slate-500 font-medium py-1">{d}</div>
            ))}
          </div>
          {/* offset: Jan 2025 starts Wednesday (3) */}
          <div className="grid grid-cols-7 gap-1">
            {[0,1,2].map(i => <div key={`e${i}`} />)}
            {days.map(({ day, status }) => (
              <div key={day} className={`aspect-square rounded flex items-center justify-center text-xs font-medium ${status ? CAL_STATUS_COLOR[status] : "bg-slate-700/30 text-slate-400"} ${status === "weekend" ? "text-slate-500" : "text-white"}`}>
                {day}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(CAL_STATUS_COLOR).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-sm ${v}`} />
                <span className="text-xs text-slate-400 capitalize">{k.replace("_"," ")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Log */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-sm font-semibold text-slate-200">Attendance Log — 13 Jan 2025</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/60">
                <th className="text-left px-4 py-2 text-slate-400 font-medium">Employee</th>
                <th className="text-center px-3 py-2 text-slate-400 font-medium">In</th>
                <th className="text-center px-3 py-2 text-slate-400 font-medium">Out</th>
                <th className="text-center px-3 py-2 text-slate-400 font-medium">Hours</th>
                <th className="text-center px-3 py-2 text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {ATTENDANCE_LOG.filter(a => a.date === "13 Jan 2025").map(a => (
                <tr key={a.id} className="border-b border-slate-700/50">
                  <td className="px-4 py-2.5 text-slate-300">{a.empName}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-slate-300">{a.checkIn ?? "—"}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-slate-300">{a.checkOut ?? "—"}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-slate-200">{a.hoursWorked ?? "—"}</td>
                  <td className="px-3 py-2.5 text-center"><Pill status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Leave Tab ─────────────────────────────────────────────────────────────────
function LeaveTab() {
  const [selected, setSelected] = useState<LeaveRequest | null>(null);

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Pending Approval", value: LEAVE_REQUESTS.filter(l=>l.status==="pending").length,  color:"text-amber-400"   },
            { label:"Approved",          value: LEAVE_REQUESTS.filter(l=>l.status==="approved").length, color:"text-emerald-400" },
            { label:"Staff on Leave Now",value: 2,                                                      color:"text-blue-400"    },
          ].map(k => (
            <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-200">Leave Requests</p>
            <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-2.5 py-1 rounded font-medium">
              <Plus size={11} /> New Request
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">Employee</th>
                <th className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">Type</th>
                <th className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">Period</th>
                <th className="text-center px-4 py-2.5 text-xs text-slate-400 font-medium">Days</th>
                <th className="text-center px-4 py-2.5 text-xs text-slate-400 font-medium">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {LEAVE_REQUESTS.map(lr => (
                <tr key={lr.id} onClick={() => setSelected(lr)} className="border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-200">{lr.empName}</p>
                    <p className="text-xs text-slate-500">{lr.department}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300 capitalize">{lr.type}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{lr.startDate} – {lr.endDate}</td>
                  <td className="px-4 py-3 text-center text-xs font-bold text-slate-200">{lr.days}</td>
                  <td className="px-4 py-3 text-center"><Pill status={lr.status} /></td>
                  <td className="px-4 py-3"><ChevronRight size={14} className="text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-72 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-200">Leave Request</span>
            <button onClick={() => setSelected(null)}><X size={14} className="text-slate-400" /></button>
          </div>
          <div className="p-4 flex-1 space-y-3 text-xs">
            <div className="text-center py-3 bg-slate-700/40 rounded-lg">
              <p className="text-2xl font-bold text-amber-400">{selected.days}</p>
              <p className="text-slate-400">working days</p>
              <p className="text-slate-200 font-medium mt-1 capitalize">{selected.type} Leave</p>
            </div>
            {[
              { label:"Employee",    val: selected.empName      },
              { label:"Department",  val: selected.department   },
              { label:"From",        val: selected.startDate    },
              { label:"To",          val: selected.endDate      },
              { label:"Submitted",   val: selected.submittedAt  },
              { label:"Approved By", val: selected.approvedBy ?? "Pending" },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span className="text-slate-500">{row.label}</span>
                <span className="text-slate-200 font-medium">{row.val}</span>
              </div>
            ))}
            <div className="bg-slate-700/30 rounded p-2">
              <p className="text-slate-500 mb-1">Reason</p>
              <p className="text-slate-300">{selected.reason}</p>
            </div>
            <Pill status={selected.status} />
          </div>
          {selected.status === "pending" && (
            <div className="p-3 border-t border-slate-700 flex gap-2">
              <button className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium">Approve</button>
              <button className="flex-1 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded text-xs">Reject</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Payroll Tab ───────────────────────────────────────────────────────────────
function PayrollTab() {
  const [selectedRun, setSelectedRun] = useState<PayrollRun>(PAYROLL_RUNS[1]);
  const entries = PAYROLL_ENTRIES.filter(e => e.runId === selectedRun.id);
  const grossTotal = entries.reduce((s, e) => s + e.grossPay, 0);
  const deductTotal = entries.reduce((s, e) => s + e.totalDeductions, 0);
  const netTotal    = entries.reduce((s, e) => s + e.netPay, 0);

  return (
    <div className="space-y-4">
      {/* run selector */}
      <div className="flex gap-3">
        {PAYROLL_RUNS.map(run => (
          <button
            key={run.id}
            onClick={() => setSelectedRun(run)}
            className={`flex-1 border rounded-xl p-3 text-left transition-colors ${selectedRun.id === run.id ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-800/60 hover:border-slate-600"}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-200">{run.period}</span>
              <Pill status={run.status} />
            </div>
            <p className="text-sm font-bold text-amber-400">{fmtAED(run.netPayroll)}</p>
            <p className="text-xs text-slate-500">{run.employeeCount} employees</p>
          </button>
        ))}
        <button className="border border-dashed border-slate-600 rounded-xl p-3 flex items-center justify-center hover:border-amber-500/50 transition-colors">
          <Plus size={16} className="text-slate-500" />
        </button>
      </div>

      {/* summary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:"Gross Payroll", value: fmtAED(grossTotal), color:"text-slate-200"  },
          { label:"Deductions",    value: fmtAED(deductTotal),color:"text-red-400"    },
          { label:"Net Payroll",   value: fmtAED(netTotal),   color:"text-emerald-400"},
          { label:"Employees",     value: String(entries.length), color:"text-amber-400" },
        ].map(k => (
          <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`text-base font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/60">
              <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Employee</th>
              <th className="text-right px-3 py-2.5 text-slate-400 font-medium">Basic</th>
              <th className="text-right px-3 py-2.5 text-slate-400 font-medium">Allowances</th>
              <th className="text-right px-3 py-2.5 text-slate-400 font-medium">Overtime</th>
              <th className="text-right px-3 py-2.5 text-slate-400 font-medium">Gross</th>
              <th className="text-right px-3 py-2.5 text-slate-400 font-medium">Deductions</th>
              <th className="text-right px-4 py-2.5 text-slate-400 font-medium">Net Pay</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-slate-200">{e.empName}</p>
                  <p className="text-slate-500">{e.department}</p>
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-300">{e.basicSalary.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-300">{(e.housing+e.transport+e.otherAllowances).toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-mono text-emerald-400">{e.overtime ? "+"+e.overtime.toLocaleString() : "—"}</td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-200 font-semibold">{e.grossPay.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right font-mono text-red-400">{e.totalDeductions ? "("+e.totalDeductions.toLocaleString()+")" : "—"}</td>
                <td className="px-4 py-2.5 text-right font-mono text-amber-400 font-bold">{e.netPay.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-slate-700/30 border-t-2 border-slate-600 font-bold">
              <td className="px-4 py-2.5 text-slate-200">TOTAL</td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-200">{entries.reduce((s,e)=>s+e.basicSalary,0).toLocaleString()}</td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-200">{entries.reduce((s,e)=>s+e.housing+e.transport+e.otherAllowances,0).toLocaleString()}</td>
              <td className="px-3 py-2.5 text-right font-mono text-emerald-400">{entries.reduce((s,e)=>s+e.overtime,0).toLocaleString()}</td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-200">{grossTotal.toLocaleString()}</td>
              <td className="px-3 py-2.5 text-right font-mono text-red-400">({deductTotal.toLocaleString()})</td>
              <td className="px-4 py-2.5 text-right font-mono text-amber-400">{netTotal.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {selectedRun.status === "draft" && (
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm">Save Draft</button>
          <button className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-semibold">Submit for Approval</button>
        </div>
      )}
      {selectedRun.status === "approved" && (
        <div className="flex justify-end">
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold">Process Payment (WPS)</button>
        </div>
      )}
    </div>
  );
}

// ── Loans Tab ─────────────────────────────────────────────────────────────────
function LoansTab() {
  const [selected, setSelected] = useState<LoanAdvance | null>(null);

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Active Loans",      value: LOANS.filter(l=>l.status==="active").length,   color:"text-blue-400"   },
            { label:"Pending Approval",  value: LOANS.filter(l=>l.status==="pending").length,  color:"text-amber-400"  },
            { label:"Total Outstanding", value: fmtAED(LOANS.filter(l=>l.status==="active").reduce((s,l)=>s+l.outstandingBalance,0)), color:"text-red-400" },
            { label:"Closed This Year",  value: LOANS.filter(l=>l.status==="closed").length,   color:"text-emerald-400"},
          ].map(k => (
            <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className={`text-base font-bold mt-0.5 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center">
            <p className="text-sm font-semibold text-slate-200">Loans & Advances</p>
            <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-2.5 py-1 rounded font-medium"><Plus size={11} /> New</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">Employee</th>
                <th className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">Type</th>
                <th className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">Purpose</th>
                <th className="text-right px-4 py-2.5 text-xs text-slate-400 font-medium">Amount</th>
                <th className="text-right px-4 py-2.5 text-xs text-slate-400 font-medium">Outstanding</th>
                <th className="text-center px-4 py-2.5 text-xs text-slate-400 font-medium">Progress</th>
                <th className="text-center px-4 py-2.5 text-xs text-slate-400 font-medium">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {LOANS.map(loan => {
                const pct = loan.installmentsTotal ? (loan.installmentsPaid / loan.installmentsTotal) * 100 : 0;
                return (
                  <tr key={loan.id} onClick={() => setSelected(loan)} className="border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-slate-200">{loan.empName}</p>
                      <p className="text-xs text-slate-500">{loan.department}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 capitalize">{loan.type}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-32 truncate">{loan.purpose}</td>
                    <td className="px-4 py-3 text-right text-xs font-mono text-slate-200">{fmtAED(loan.amount)}</td>
                    <td className="px-4 py-3 text-right text-xs font-mono text-red-400">{loan.outstandingBalance > 0 ? fmtAED(loan.outstandingBalance) : "—"}</td>
                    <td className="px-4 py-3 w-28">
                      {loan.installmentsTotal > 0 && (
                        <div>
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{width:`${pct}%`}} />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 text-center">{loan.installmentsPaid}/{loan.installmentsTotal}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center"><Pill status={loan.status} /></td>
                    <td className="px-4 py-3"><ChevronRight size={14} className="text-slate-500" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-72 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-200">Loan Detail</span>
            <button onClick={() => setSelected(null)}><X size={14} className="text-slate-400" /></button>
          </div>
          <div className="p-4 flex-1 space-y-3 text-xs">
            <div className="bg-slate-700/40 rounded-lg p-3 text-center">
              <p className="text-slate-500 capitalize">{selected.type}</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{fmtAED(selected.amount)}</p>
              <Pill status={selected.status} />
            </div>
            {[
              { label:"Employee",       val: selected.empName       },
              { label:"Purpose",        val: selected.purpose       },
              { label:"Installment",    val: selected.installmentAED ? fmtAED(selected.installmentAED)+"/mo" : "N/A" },
              { label:"Paid",           val: `${selected.installmentsPaid} / ${selected.installmentsTotal}` },
              { label:"Outstanding",    val: fmtAED(selected.outstandingBalance) },
              { label:"Requested",      val: selected.requestedAt   },
              { label:"Approved",       val: selected.approvedAt ?? "—" },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span className="text-slate-500">{row.label}</span>
                <span className="text-slate-200">{row.val}</span>
              </div>
            ))}
          </div>
          {selected.status === "pending" && (
            <div className="p-3 border-t border-slate-700 flex gap-2">
              <button className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium">Approve</button>
              <button className="flex-1 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded text-xs">Reject</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Performance Tab ───────────────────────────────────────────────────────────
function PerformanceTab() {
  const [selected, setSelected] = useState<PerformanceReview | null>(null);
  const RATING_LABEL: Record<string, string> = { exceptional:"Exceptional", exceeds:"Exceeds Expectations", meets:"Meets Expectations", below:"Below Expectations", unsatisfactory:"Unsatisfactory" };
  const RATING_COLOR: Record<string, string> = { exceptional:"text-emerald-400", exceeds:"text-blue-400", meets:"text-slate-200", below:"text-amber-400", unsatisfactory:"text-red-400" };

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Reviewed (H2 2024)", value:4, color:"text-slate-200"  },
            { label:"Exceptional",        value:1, color:"text-emerald-400"},
            { label:"Exceeds",            value:2, color:"text-blue-400"   },
            { label:"Meets",              value:1, color:"text-slate-400"  },
          ].map(k => (
            <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">Employee</th>
                <th className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">Period</th>
                <th className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">Reviewed By</th>
                <th className="text-center px-4 py-2.5 text-xs text-slate-400 font-medium">Score</th>
                <th className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">Rating</th>
                <th className="text-center px-4 py-2.5 text-xs text-slate-400 font-medium">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {PERFORMANCE_REVIEWS.map(rv => (
                <tr key={rv.id} onClick={() => setSelected(rv)} className="border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-200">{rv.empName}</p>
                    <p className="text-xs text-slate-500">{rv.department}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">{rv.reviewPeriod}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{rv.reviewedBy}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-base font-bold text-amber-400">{rv.overallScore.toFixed(1)}</span>
                    <span className="text-xs text-slate-500">/5</span>
                  </td>
                  <td className={`px-4 py-3 text-xs font-medium ${RATING_COLOR[rv.overallRating]}`}>{RATING_LABEL[rv.overallRating]}</td>
                  <td className="px-4 py-3 text-center"><Pill status={rv.status} /></td>
                  <td className="px-4 py-3"><ChevronRight size={14} className="text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-80 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-200">{selected.empName}</span>
            <button onClick={() => setSelected(null)}><X size={14} className="text-slate-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            <div className="text-center py-3 bg-slate-700/40 rounded-lg">
              <p className="text-4xl font-bold text-amber-400">{selected.overallScore.toFixed(1)}</p>
              <p className="text-slate-400">/ 5.0</p>
              <p className={`font-medium mt-1 ${RATING_COLOR[selected.overallRating]}`}>{RATING_LABEL[selected.overallRating]}</p>
            </div>
            <p className="text-slate-400 font-medium">Category Scores</p>
            {selected.ratings.map(r => (
              <div key={r.category} className="space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-300">{r.category}</span>
                  <span className="font-bold text-amber-400">{r.score}/5</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500/70 rounded-full" style={{width:`${(r.score/5)*100}%`}} />
                </div>
                {r.comment && <p className="text-slate-500 text-xs">{r.comment}</p>}
              </div>
            ))}
            <div>
              <p className="text-slate-400 font-medium mb-1">Strengths</p>
              {selected.strengths.map(s => (
                <div key={s} className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp size={10} className="text-emerald-400" />
                  <span className="text-slate-300">{s}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-1">Areas for Improvement</p>
              {selected.improvements.map(s => (
                <div key={s} className="flex items-center gap-1.5 mb-0.5">
                  <Award size={10} className="text-amber-400" />
                  <span className="text-slate-300">{s}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-500">Next Review: <span className="text-slate-300">{selected.nextReviewDate}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Recruitment (Kanban) Tab ─────────────────────────────────────────────────
const RECRUIT_STAGES: PipelineStage[] = [
  { key:"applied",     label:"Applied",     color:"bg-slate-700",      textColor:"text-slate-300"  },
  { key:"screening",   label:"Screening",   color:"bg-blue-900/60",    textColor:"text-blue-300"   },
  { key:"interview_1", label:"Interview 1", color:"bg-violet-900/60",  textColor:"text-violet-300" },
  { key:"interview_2", label:"Interview 2", color:"bg-purple-900/60",  textColor:"text-purple-300" },
  { key:"offer",       label:"Offer Sent",  color:"bg-amber-900/60",   textColor:"text-amber-300"  },
  { key:"hired",       label:"Hired",       color:"bg-emerald-900/60", textColor:"text-emerald-300"},
  { key:"rejected",    label:"Rejected",    color:"bg-red-900/50",     textColor:"text-red-400"    },
];

interface RecruitCard extends PipelineCard {
  department: string;
  salary: string;
  nationality: string;
}

function RecruitmentTab() {
  const [selected, setSelected] = useState<JobPosting | null>(null);

  const cards: RecruitCard[] = JOB_POSTINGS.map(j => ({
    id: j.id,
    stage: j.stage,
    title: j.applicantName,
    subtitle: j.title,
    meta: j.department,
    badge: j.type === "full_time" ? "Full-time" : j.type,
    department: j.department,
    salary: `AED ${j.salaryFrom.toLocaleString()}–${j.salaryTo.toLocaleString()}`,
    nationality: j.nationality,
  }));

  const handleClick = (card: RecruitCard) => {
    const job = JOB_POSTINGS.find(j => j.id === card.id) ?? null;
    setSelected(job);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{JOB_POSTINGS.length} active candidates</p>
        <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1.5 rounded font-medium"><Plus size={12} /> Post Job</button>
      </div>
      <PipelineKanban<RecruitCard>
        stages={RECRUIT_STAGES}
        cards={cards}
        onCardClick={handleClick}
        columnWidth={180}
      />
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-96 p-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-3">
              <p className="font-semibold text-slate-200">{selected.applicantName}</p>
              <button onClick={() => setSelected(null)}><X size={14} className="text-slate-400" /></button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                {[
                  {l:"Position",    v: selected.title},
                  {l:"Department",  v: selected.department},
                  {l:"Nationality", v: selected.nationality},
                  {l:"Experience",  v: selected.experience},
                  {l:"Salary Range",v: `AED ${selected.salaryFrom.toLocaleString()}–${selected.salaryTo.toLocaleString()}`},
                  {l:"Posted",      v: selected.postedAt},
                ].map(r => (
                  <div key={r.l}>
                    <p className="text-slate-500">{r.l}</p>
                    <p className="text-slate-200">{r.v}</p>
                  </div>
                ))}
              </div>
              {selected.notes && (
                <div className="bg-slate-700/40 rounded p-2 mt-2">
                  <p className="text-slate-400 mb-0.5">Notes</p>
                  <p className="text-slate-300">{selected.notes}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium">Move to Next Stage</button>
              <button className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Training Tab ──────────────────────────────────────────────────────────────
function TrainingTab() {
  const [selected, setSelected] = useState<TrainingRecord | null>(null);
  const STATUS_COLORS2: Record<string, string> = {
    scheduled:   "bg-blue-500/15 text-blue-400",
    in_progress: "bg-amber-500/15 text-amber-400",
    completed:   "bg-emerald-500/15 text-emerald-400",
    cancelled:   "bg-red-500/15 text-red-400",
  };

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Total Trainings",  value: TRAINING_RECORDS.length,                                         color:"text-slate-200"  },
            { label:"Completed",        value: TRAINING_RECORDS.filter(t=>t.completionStatus==="completed").length, color:"text-emerald-400"},
            { label:"Upcoming",         value: TRAINING_RECORDS.filter(t=>t.completionStatus==="scheduled").length,  color:"text-blue-400"   },
            { label:"Training Budget",  value: fmtAED(TRAINING_RECORDS.reduce((s,t)=>s+t.cost,0)),               color:"text-amber-400"  },
          ].map(k => (
            <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className={`text-base font-bold mt-0.5 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center">
            <p className="text-sm font-semibold text-slate-200">Training Records</p>
            <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-2.5 py-1 rounded font-medium"><Plus size={11} /> Add Training</button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/60">
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Employee</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Course</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Provider</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Dates</th>
                <th className="text-right px-4 py-2.5 text-slate-400 font-medium">Hours</th>
                <th className="text-right px-4 py-2.5 text-slate-400 font-medium">Cost</th>
                <th className="text-center px-4 py-2.5 text-slate-400 font-medium">Cert</th>
                <th className="text-center px-4 py-2.5 text-slate-400 font-medium">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {TRAINING_RECORDS.map(tr => (
                <tr key={tr.id} onClick={() => setSelected(tr)} className="border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-200">{tr.empName}</p>
                    <p className="text-slate-500">{tr.department}</p>
                  </td>
                  <td className="px-4 py-2.5 text-slate-300 max-w-40 truncate">{tr.courseName}</td>
                  <td className="px-4 py-2.5 text-slate-400">{tr.provider}</td>
                  <td className="px-4 py-2.5 text-slate-400">{tr.startDate}–{tr.endDate}</td>
                  <td className="px-4 py-2.5 text-right text-slate-200">{tr.hours}h</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-200">{tr.cost ? fmtAED(tr.cost) : "Free"}</td>
                  <td className="px-4 py-2.5 text-center">
                    {tr.certificate
                      ? <CheckCircle2 size={12} className="text-emerald-400 mx-auto" />
                      : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS2[tr.completionStatus]}`}>
                      {tr.completionStatus.replace("_"," ")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5"><ChevronRight size={12} className="text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-64 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-200">Training Detail</span>
            <button onClick={() => setSelected(null)}><X size={14} className="text-slate-400" /></button>
          </div>
          <div className="p-4 flex-1 space-y-3 text-xs">
            <p className="font-semibold text-slate-200 leading-snug">{selected.courseName}</p>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS2[selected.completionStatus]}`}>{selected.completionStatus.replace("_"," ")}</span>
            {[
              {l:"Employee",  v: selected.empName},
              {l:"Provider",  v: selected.provider},
              {l:"Category",  v: selected.category},
              {l:"Dates",     v: `${selected.startDate} – ${selected.endDate}`},
              {l:"Hours",     v: `${selected.hours}h`},
              {l:"Cost",      v: selected.cost ? fmtAED(selected.cost) : "Free"},
              {l:"Score",     v: selected.score ? `${selected.score}%` : "—"},
            ].map(r => (
              <div key={r.l} className="flex justify-between">
                <span className="text-slate-500">{r.l}</span>
                <span className="text-slate-200">{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────
export default function HRModule() {
  const [tab, setTab] = useState<HRTab>("employees");

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-slate-700/60">
        <h1 className="text-lg font-bold text-slate-100">HR &amp; Payroll</h1>
        <p className="text-xs text-slate-500 mt-0.5">Employee lifecycle, attendance, payroll, and recruitment</p>
      </div>

      {/* tabs */}
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

      {/* content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === "employees"   && <EmployeesTab />}
        {tab === "attendance"  && <AttendanceTab />}
        {tab === "leave"       && <LeaveTab />}
        {tab === "payroll"     && <PayrollTab />}
        {tab === "loans"       && <LoansTab />}
        {tab === "performance" && <PerformanceTab />}
        {tab === "recruitment" && <RecruitmentTab />}
        {tab === "training"    && <TrainingTab />}
      </div>
    </div>
  );
}
