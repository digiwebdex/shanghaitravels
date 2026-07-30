import { useState } from "react";
import {
  LayoutDashboard, Users, FileCheck, Users2, Building2, Home,
  Bell, Settings, Search, ChevronRight, AlertTriangle,
  DollarSign, CheckCircle2, XCircle, Circle, Plus, ArrowLeft,
  CreditCard, X, FileText, TrendingUp, Monitor,
} from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CaseTimeline } from "../shared/CaseTimeline";

// ─── Inline demo data ─────────────────────────────────────────────────────────

const REVENUE_BARS = [
  { month: "Aug", rev: 1.24, tgt: 1.2 },
  { month: "Sep", rev: 1.44, tgt: 1.4 },
  { month: "Oct", rev: 1.82, tgt: 1.6 },
  { month: "Nov", rev: 2.1,  tgt: 2.0 },
  { month: "Dec", rev: 2.38, tgt: 2.2 },
  { month: "Jan", rev: 1.92, tgt: 2.4 },
];

const ACTIVITY_ITEMS = [
  { text: "New application submitted",      ref: "APP-7708", at: "5m",  type: "app" },
  { text: "SLA breach — APP-7705 overdue",  ref: "APP-7705", at: "8m",  type: "sla" },
  { text: "Agent wallet top-up AED 50,000", ref: "TXN-8812", at: "12m", type: "pay" },
  { text: "Visa approved by officer",       ref: "APP-7706", at: "28m", type: "ok"  },
  { text: "Corporate booking confirmed",    ref: "BKG-4421", at: "41m", type: "bk"  },
];

const LEADS = [
  { id: "L001", name: "Ahmed Al-Rashidi",   status: "hot",  value: "AED 12,500", service: "Schengen Visa",     date: "Today"  },
  { id: "L002", name: "Sarah Johnson",      status: "warm", value: "AED 8,200",  service: "UK Tourist Visa",   date: "Today"  },
  { id: "L003", name: "Raj Patel",          status: "cold", value: "AED 5,400",  service: "Canada Visa",       date: "Yest."  },
  { id: "L004", name: "Liu Wei",            status: "hot",  value: "AED 22,000", service: "US Visa + Flight",  date: "Yest."  },
  { id: "L005", name: "Fatima Al-Zaabi",    status: "warm", value: "AED 14,800", service: "UAE Residency",     date: "2d ago" },
  { id: "L006", name: "James Mitchell",     status: "warm", value: "AED 9,600",  service: "Australia Visa",    date: "3d ago" },
];

const VISA_CASES = [
  { ref: "APP-7708", name: "Ahmed Al-Rashidi",  dest: "Schengen",  stageIdx: 4,  sla: "ok",       stage: "Document Upload"    },
  { ref: "APP-7705", name: "Sarah Chen",        dest: "UK",        stageIdx: 8,  sla: "overdue",  stage: "Embassy Submission" },
  { ref: "APP-7706", name: "Raj Patel",         dest: "Canada",    stageIdx: 13, sla: "ok",       stage: "Approved"           },
  { ref: "APP-7701", name: "Liu Wei",           dest: "USA",       stageIdx: 3,  sla: "due_soon", stage: "Checklist Review"   },
  { ref: "APP-7703", name: "Fatima Al-Zaabi",   dest: "Australia", stageIdx: 6,  sla: "ok",       stage: "Payment Received"   },
];

const DOCS_LIST = [
  { name: "Passport Copy",      status: "verified", required: true  },
  { name: "Bank Statement",     status: "uploaded",  required: true  },
  { name: "Employment Letter",  status: "rejected",  required: true  },
  { name: "Hotel Booking",      status: "pending",   required: true  },
  { name: "Flight Itinerary",   status: "verified", required: true  },
  { name: "Travel Insurance",   status: "pending",   required: false },
];

const CORP_REQS = [
  { id: "APR-001", employee: "James Thornton",    dept: "Engineering", dest: "New York, USA", dates: "15–20 Mar", cost: "AED 12,400", status: "pending",  urgent: true  },
  { id: "APR-002", employee: "Aisha Al-Mansoori", dept: "Marketing",   dest: "London, UK",    dates: "22–28 Mar", cost: "AED 8,750",  status: "pending",  urgent: false },
  { id: "APR-003", employee: "David Park",        dept: "Sales",       dest: "Singapore",     dates: "5–8 Apr",   cost: "AED 6,200",  status: "approved", urgent: false },
  { id: "APR-004", employee: "Sarah Williams",    dept: "Legal",       dest: "Paris, France", dates: "10–14 Apr", cost: "AED 15,600", status: "pending",  urgent: true  },
];

// ─── Admin sidebar (44px, icon-only) ─────────────────────────────────────────

const ADMIN_NAV = [
  { id: "dashboard", icon: LayoutDashboard },
  { id: "crm",       icon: Users           },
  { id: "visa",      icon: FileCheck       },
  { id: "staff",     icon: Users2          },
  { id: "finance",   icon: DollarSign      },
  { id: "reports",   icon: TrendingUp      },
];

function AdminSidebar({ active }: { active: string }) {
  return (
    <div className="w-11 flex-shrink-0 flex flex-col items-center py-3 gap-1 bg-[#0D1117] border-r border-slate-800/80">
      <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center mb-2 flex-shrink-0">
        <span className="text-slate-900 font-black text-[10px]">TP</span>
      </div>
      {ADMIN_NAV.map(n => (
        <button key={n.id}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            active === n.id ? "bg-amber-500/20 text-amber-400" : "text-slate-600 hover:text-slate-400"
          }`}>
          <n.icon size={14} />
        </button>
      ))}
      <div className="flex-1" />
      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600">
        <Bell size={13} />
      </button>
      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600">
        <Settings size={13} />
      </button>
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white mt-1">A</div>
    </div>
  );
}

function PortalSidebar() {
  return (
    <div className="w-11 flex-shrink-0 flex flex-col items-center py-3 gap-1 bg-white border-r border-slate-100">
      <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center mb-2 flex-shrink-0">
        <span className="text-white font-black text-[10px]">TP</span>
      </div>
      {[Home, FileText, CreditCard, Bell].map((Icon, i) => (
        <button key={i}
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            i === 1 ? "bg-orange-50 text-orange-500" : "text-slate-300"
          }`}>
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

function CorpSidebar() {
  return (
    <div className="w-11 flex-shrink-0 flex flex-col items-center py-3 gap-1 bg-[#0F1C2E] border-r border-slate-700/60">
      <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center mb-2 flex-shrink-0">
        <Building2 size={12} className="text-white" />
      </div>
      {[LayoutDashboard, Users, CheckCircle2, TrendingUp].map((Icon, i) => (
        <button key={i}
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            i === 2 ? "bg-sky-500/20 text-sky-400" : "text-slate-500"
          }`}>
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

// ─── Topbars ──────────────────────────────────────────────────────────────────

function AdminTopbar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 h-11 border-b border-slate-800 bg-[#0D1117] flex-shrink-0">
      <p className="text-sm font-semibold text-slate-200 flex-1 truncate">{title}</p>
      <div className="relative">
        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-1 text-xs text-slate-300 w-32 focus:outline-none" placeholder="Search…" readOnly />
      </div>
      <button className="relative w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
        <Bell size={12} />
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full text-[7px] font-bold text-slate-900 flex items-center justify-center">3</span>
      </button>
    </div>
  );
}

function PortalTopbar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 px-4 h-11 border-b border-slate-100 bg-white flex-shrink-0">
      <p className="text-sm font-semibold text-slate-800 flex-1">{title}</p>
      <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white">A</div>
    </div>
  );
}

function CorpTopbar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 px-4 h-11 border-b border-slate-700/60 bg-[#0F1C2E] flex-shrink-0">
      <p className="text-sm font-semibold text-white flex-1">{title}</p>
      <button className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">JT</button>
    </div>
  );
}

// ─── 1. Admin Dashboard ───────────────────────────────────────────────────────

function DashboardTablet() {
  const dot = (type: string) => {
    if (type === "sla") return "bg-red-400";
    if (type === "ok")  return "bg-emerald-400";
    if (type === "pay") return "bg-green-400";
    return "bg-amber-400";
  };
  return (
    <div className="overflow-auto bg-[#0D1117] p-4 space-y-3 h-full">
      {/* 2×2 KPI grid — was 4×1 on desktop */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Active Cases",    value: "2,847",    delta: "+12%", color: "#06B6D4", up: true  },
          { label: "Revenue MTD",     value: "AED 2.38M", delta: "+8%", color: "#10B981", up: true  },
          { label: "Pending Review",  value: "23",        delta: "−3",   color: "#F59E0B", up: false },
          { label: "SLA Breaches",    value: "4",         delta: "+1",   color: "#EF4444", up: false },
        ].map(k => (
          <div key={k.label} className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 leading-none">{k.label}</p>
            <p className="text-xl font-bold mt-2 leading-none" style={{ color: k.color }}>{k.value}</p>
            <p className={`text-[10px] mt-1.5 font-medium ${k.up ? "text-emerald-400" : "text-red-400"}`}>{k.delta} vs last month</p>
          </div>
        ))}
      </div>

      {/* Revenue chart — full width, was shared row on desktop */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
        <p className="text-[11px] font-semibold text-slate-300 mb-3">Revenue vs Target (AED M)</p>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={REVENUE_BARS} barGap={4} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 8, fontSize: 10 }}
              labelStyle={{ color: "#CBD5E1" }}
            />
            <Bar dataKey="rev" name="Actual" fill="#F59E0B" radius={[3, 3, 0, 0]} />
            <Bar dataKey="tgt" name="Target" fill="#1E293B" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Activity — stacked below chart, was side-by-side on desktop */}
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
        <p className="text-[11px] font-semibold text-slate-300 mb-3">Recent Activity</p>
        <div className="space-y-2.5">
          {ACTIVITY_ITEMS.map((a, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dot(a.type)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300 leading-snug">{a.text}</p>
                <p className="text-[10px] text-slate-600 font-mono">{a.ref}</p>
              </div>
              <span className="text-[10px] text-slate-600 flex-shrink-0">{a.at}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 2. Staff Case Detail ─────────────────────────────────────────────────────

function CaseDetailTablet() {
  const docIcon = (status: string) => {
    if (status === "verified") return <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />;
    if (status === "rejected") return <XCircle size={13} className="text-red-400 flex-shrink-0" />;
    if (status === "uploaded") return <CheckCircle2 size={13} className="text-sky-400 flex-shrink-0" />;
    return <Circle size={13} className="text-slate-600 flex-shrink-0" />;
  };
  const badgeCls = (s: string) =>
    s === "verified" ? "bg-emerald-500/15 text-emerald-400" :
    s === "rejected" ? "bg-red-500/15 text-red-400" :
    s === "uploaded" ? "bg-sky-500/15 text-sky-400" :
    "bg-slate-700 text-slate-500";

  return (
    <div className="overflow-auto bg-[#0D1117] h-full">
      {/* Header — full width, no left list panel on tablet */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/40">
        <button className="flex items-center gap-1 text-[10px] text-slate-500 mb-1.5">
          <ArrowLeft size={10} /> All Cases
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono text-sky-400">APP-7705</p>
            <p className="text-base font-bold text-slate-100 mt-0.5">Sarah Chen</p>
            <p className="text-xs text-slate-400">UK Tourist Visa · London, UK</p>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md flex-shrink-0">OVERDUE</span>
        </div>
        {/* 2-col key info — stacked from desktop 4-col */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[
            { l: "Travel Date",  v: "15 Mar 2025" },
            { l: "SLA Due",      v: "12 Jan 2025"  },
            { l: "Assigned To",  v: "Omar Hassan"  },
            { l: "Priority",     v: "Urgent"        },
          ].map(r => (
            <div key={r.l} className="flex justify-between bg-slate-800/50 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-500">{r.l}</span>
              <span className="text-slate-200 font-medium">{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline — full width */}
      <div className="px-4 py-3 border-b border-slate-800">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Application Workflow</p>
        <CaseTimeline
          currentStage={8}
          entries={[
            { stageIndex: 0, date: "2 Jan",  note: "Lead received"           },
            { stageIndex: 1, date: "3 Jan",  note: "Profile created"         },
            { stageIndex: 2, date: "4 Jan",  note: "Passport scanned"        },
            { stageIndex: 3, date: "5 Jan",  note: "Checklist sent"          },
            { stageIndex: 4, date: "7 Jan",  note: "6/7 docs uploaded"       },
            { stageIndex: 5, date: "8 Jan",  note: "AI validation passed"    },
            { stageIndex: 6, date: "9 Jan",  note: "Reviewed by Omar H."     },
            { stageIndex: 7, date: "10 Jan", note: "Invoice AED 1,850 sent"  },
            { stageIndex: 8, date: "12 Jan", note: "Payment confirmed"        },
          ]}
          variant="dark"
          compact={true}
        />
      </div>

      {/* Documents — stacked, full width */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Documents</p>
        <div className="space-y-1">
          {DOCS_LIST.map(d => (
            <div key={d.name} className="flex items-center gap-2.5 py-2 border-b border-slate-800/60">
              {docIcon(d.status)}
              <span className="flex-1 text-xs text-slate-300">{d.name}</span>
              {!d.required && <span className="text-[9px] text-slate-600 italic">optional</span>}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${badgeCls(d.status)}`}>{d.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 3. CRM Leads ─────────────────────────────────────────────────────────────

function CRMTablet() {
  const [selected, setSelected] = useState<typeof LEADS[0] | null>(null);
  const SC = { hot: "bg-red-500/20 text-red-400 border-red-500/30", warm: "bg-amber-500/20 text-amber-400 border-amber-500/30", cold: "bg-slate-700 text-slate-400 border-slate-600" };

  return (
    <div className="flex flex-col bg-[#0D1117] h-full overflow-hidden relative">
      {/* Search + new lead */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 flex-shrink-0">
        <div className="relative flex-1">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input placeholder="Search leads…" className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none" readOnly />
        </div>
        <button className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-slate-900 rounded-lg text-xs font-semibold flex-shrink-0">
          <Plus size={11} /> New
        </button>
      </div>

      {/* 2-column card grid — was a list/table row on desktop */}
      <div className="flex-1 overflow-auto p-3">
        <div className="grid grid-cols-2 gap-2.5">
          {LEADS.map(lead => (
            <div key={lead.id} onClick={() => setSelected(lead === selected ? null : lead)}
              className={`bg-slate-800/60 border rounded-xl p-3 cursor-pointer transition-all ${
                selected?.id === lead.id ? "border-amber-500/50 bg-slate-800" : "border-slate-700 hover:border-slate-600"
              }`}>
              <div className="flex items-start justify-between mb-2 gap-1">
                <p className="text-xs font-semibold text-slate-200 leading-snug">{lead.name}</p>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase flex-shrink-0 ${SC[lead.status as keyof typeof SC]}`}>
                  {lead.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-1.5">{lead.service}</p>
              <p className="text-xs font-bold text-amber-400">{lead.value}</p>
              <p className="text-[9px] text-slate-600 mt-1">{lead.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Slide-in detail panel — 220px from right */}
      {selected && (
        <div className="absolute top-0 right-0 bottom-0 w-52 bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700 flex-shrink-0">
            <p className="text-xs font-semibold text-slate-200">Lead Detail</p>
            <button onClick={() => setSelected(null)}><X size={13} className="text-slate-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            <div>
              <p className="font-bold text-slate-100 text-sm">{selected.name}</p>
              <span className={`inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${SC[selected.status as keyof typeof SC]}`}>
                {selected.status}
              </span>
            </div>
            {[
              { l: "Service", v: selected.service },
              { l: "Value",   v: selected.value   },
              { l: "Added",   v: selected.date     },
              { l: "Source",  v: "Website"          },
            ].map(r => (
              <div key={r.l} className="flex justify-between text-xs">
                <span className="text-slate-500">{r.l}</span>
                <span className="text-slate-200 text-right max-w-[110px] leading-snug">{r.v}</span>
              </div>
            ))}
            <div className="space-y-2 pt-1">
              <button className="w-full py-2 bg-amber-500 text-slate-900 rounded-lg text-xs font-semibold">Convert to Case</button>
              <button className="w-full py-2 bg-slate-700 text-slate-200 rounded-lg text-xs">Schedule Call</button>
              <button className="w-full py-2 bg-slate-800 text-slate-400 rounded-lg text-xs">Send Email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 4. Visa Tracker ──────────────────────────────────────────────────────────

function VisaTrackerTablet() {
  const [tab, setTab] = useState("active");
  const SLA = {
    ok:       "bg-emerald-500/15 text-emerald-400",
    overdue:  "bg-red-500/15 text-red-400",
    due_soon: "bg-amber-500/15 text-amber-400",
  };

  return (
    <div className="flex flex-col bg-[#0D1117] h-full overflow-hidden">
      {/* Horizontally scrollable tab bar */}
      <div className="flex border-b border-slate-800 overflow-x-auto flex-shrink-0 scrollbar-none">
        {["active", "processing", "approved", "refused"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-medium capitalize whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
              tab === t ? "text-amber-400 border-amber-400" : "text-slate-400 border-transparent"
            }`}>{t}</button>
        ))}
      </div>

      {/* Stats strip — 3 mini cards */}
      <div className="grid grid-cols-3 gap-2 p-3 flex-shrink-0">
        {[
          { label: "Total",      value: "47", color: "text-slate-100" },
          { label: "Due Today",  value: "8",  color: "text-amber-400" },
          { label: "Overdue",    value: "2",  color: "text-red-400"   },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/60 border border-slate-700 rounded-xl py-2 px-3 text-center">
            <p className={`text-xl font-bold leading-none ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Case list — full width rows (no side panel on tablet) */}
      <div className="flex-1 overflow-auto px-3 space-y-2 pb-3">
        {VISA_CASES.map(c => (
          <div key={c.ref} className="bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-3 cursor-pointer hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{c.name}</p>
                <p className="text-[10px] font-mono text-slate-500">{c.ref} · {c.dest}</p>
              </div>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${SLA[c.sla as keyof typeof SLA]}`}>
                {c.sla.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] text-slate-400 flex-shrink-0">{c.stage}</p>
              <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(c.stageIdx / 15) * 100}%` }} />
              </div>
              <span className="text-[9px] text-slate-600 flex-shrink-0">{Math.round((c.stageIdx / 15) * 100)}%</span>
              <ChevronRight size={12} className="text-slate-600 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 5. Customer Apply Flow ───────────────────────────────────────────────────

function ApplyTablet() {
  const STEPS = ["Personal Info", "Documents", "Travel Details", "Review", "Payment"];
  const cur = 2;

  const FIELDS = [
    { label: "Destination Country", type: "select", value: "United Kingdom"   },
    { label: "Purpose of Visit",    type: "select", value: "Tourism"          },
    { label: "Travel Date",         type: "date",   value: "15 Mar 2025"      },
    { label: "Return Date",         type: "date",   value: "30 Mar 2025"      },
    { label: "Duration (days)",     type: "text",   value: "15"               },
    { label: "Accommodation",       type: "select", value: "Hotel"            },
    { label: "Hotel Name & Address",type: "text",   value: ""                 },
    { label: "Previous Visits",     type: "select", value: "None"             },
  ];

  return (
    <div className="overflow-auto bg-white h-full">
      {/* Step progress — horizontal bar (single column form replaces 2-col desktop) */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-start">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-start flex-1 min-w-0">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  i < cur  ? "bg-emerald-500 text-white" :
                  i === cur ? "bg-orange-500 text-white ring-2 ring-orange-200" :
                  "bg-slate-100 text-slate-400 border border-slate-200"
                }`}>
                  {i < cur ? "✓" : i + 1}
                </div>
                <p className="text-[8px] text-slate-400 mt-1 text-center leading-tight w-12 truncate">{s}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mt-3 mx-0.5 ${i < cur ? "bg-emerald-400" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Single-column form (was 2-column grid on desktop) */}
      <div className="px-4 py-4 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Travel Details</h2>
          <p className="text-xs text-slate-400 mt-0.5">Step 3 of 5 — Please provide your travel information</p>
        </div>

        {FIELDS.map(f => (
          <div key={f.label}>
            <label className="text-xs font-medium text-slate-600 block mb-1">{f.label}</label>
            {f.type === "select" ? (
              <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 appearance-none">
                <option>{f.value || "Select…"}</option>
              </select>
            ) : (
              <input type={f.type === "date" ? "text" : f.type} defaultValue={f.value} placeholder={f.value ? "" : "Enter…"}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            )}
          </div>
        ))}

        {/* CTA row — full width, was partial width on desktop */}
        <div className="flex gap-3 pt-2">
          <button className="flex-1 py-3 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">← Previous</button>
          <button className="flex-[2] py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold">Continue →</button>
        </div>
      </div>
    </div>
  );
}

// ─── 6. Corporate Approvals ───────────────────────────────────────────────────

function ApprovalsTablet() {
  const [filter, setFilter] = useState("pending");
  const BADGE = {
    pending:  "bg-amber-50 border-2 border-amber-200",
    approved: "bg-emerald-50 border-2 border-emerald-200",
    rejected: "bg-red-50 border-2 border-red-100",
  };

  const visible = CORP_REQS.filter(r => filter === "all" || r.status === filter);

  return (
    <div className="flex flex-col bg-slate-50 h-full overflow-hidden">
      {/* Filter tabs */}
      <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
        {["all", "pending", "approved", "rejected"].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize border-b-2 transition-colors ${
              filter === t ? "text-sky-600 border-sky-500" : "text-slate-400 border-transparent"
            }`}>{t}</button>
        ))}
      </div>

      {/* Stacked approval cards — single column (was table rows on desktop) */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {visible.map(req => (
          <div key={req.id} className={`bg-white rounded-2xl p-4 ${BADGE[req.status as keyof typeof BADGE] ?? "border-2 border-slate-200"}`}>
            <div className="flex items-start justify-between mb-3 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-800">{req.employee}</p>
                  {req.urgent && (
                    <span className="text-[8px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">URGENT</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{req.dept}</p>
              </div>
              <p className="text-sm font-bold text-sky-600 flex-shrink-0">{req.cost}</p>
            </div>

            {/* 2-col trip details — stacked from 4-col on desktop */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { l: "Destination", v: req.dest  },
                { l: "Dates",       v: req.dates  },
              ].map(r => (
                <div key={r.l} className="bg-slate-50 rounded-lg px-2.5 py-2">
                  <p className="text-[8px] text-slate-400 uppercase font-bold tracking-wide">{r.l}</p>
                  <p className="text-xs text-slate-700 font-medium mt-0.5">{r.v}</p>
                </div>
              ))}
            </div>

            {/* Actions — stacked button row (inline on desktop) */}
            {req.status === "pending" ? (
              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium">Details</button>
                <button className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-medium">Reject</button>
                <button className="flex-[2] py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold">Approve</button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {req.status === "approved"
                  ? <CheckCircle2 size={14} className="text-emerald-500" />
                  : <XCircle size={14} className="text-red-500" />}
                <span className={`text-xs font-semibold capitalize ${req.status === "approved" ? "text-emerald-600" : "text-red-600"}`}>
                  {req.status}
                </span>
              </div>
            )}
          </div>
        ))}

        {visible.length === 0 && (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">No requests</div>
        )}
      </div>
    </div>
  );
}

// ─── Showcase shell ───────────────────────────────────────────────────────────

type Screen = "dashboard" | "case_detail" | "crm" | "visa" | "apply" | "approvals";

const SCREENS: {
  id: Screen; label: string; module: string; sidebar: string; theme: "admin" | "portal" | "corp";
  title: string; annotation: string;
}[] = [
  { id: "dashboard",  label: "Admin Dashboard",   module: "Admin ERP",       sidebar: "dashboard", theme: "admin",  title: "Dashboard",         annotation: "2×2 KPI grid · revenue chart + activity stacked"   },
  { id: "case_detail",label: "Staff Case Detail", module: "Staff Portal",    sidebar: "staff",     theme: "admin",  title: "Application Detail",annotation: "Full-width case header · timeline + docs stacked"     },
  { id: "crm",        label: "CRM Leads",         module: "Admin ERP",       sidebar: "crm",       theme: "admin",  title: "CRM · Leads",       annotation: "2-column card grid · tap card for slide-in detail"    },
  { id: "visa",       label: "Visa Tracker",       module: "Admin ERP",       sidebar: "visa",      theme: "admin",  title: "Visa Processing",   annotation: "Scrollable tab bar · full-width case list"            },
  { id: "apply",      label: "Customer Apply",    module: "Customer Portal", sidebar: "",          theme: "portal", title: "New Application",   annotation: "Horizontal step progress · single-column form"         },
  { id: "approvals",  label: "Corp Approvals",    module: "Corporate Portal",sidebar: "",          theme: "corp",   title: "Travel Approvals",  annotation: "Stacked approval cards · inline action buttons"        },
];

export default function TabletShowcase() {
  const [active, setActive] = useState<Screen>("dashboard");
  const sc = SCREENS.find(s => s.id === active)!;

  const renderSidebar = () => {
    if (sc.theme === "portal") return <PortalSidebar />;
    if (sc.theme === "corp")   return <CorpSidebar />;
    return <AdminSidebar active={sc.sidebar} />;
  };

  const renderTopbar = () => {
    if (sc.theme === "portal") return <PortalTopbar title={sc.title} />;
    if (sc.theme === "corp")   return <CorpTopbar title={sc.title} />;
    return <AdminTopbar title={sc.title} />;
  };

  const renderScreen = () => {
    switch (active) {
      case "dashboard":   return <DashboardTablet />;
      case "case_detail": return <CaseDetailTablet />;
      case "crm":         return <CRMTablet />;
      case "visa":        return <VisaTrackerTablet />;
      case "apply":       return <ApplyTablet />;
      case "approvals":   return <ApprovalsTablet />;
    }
  };

  const frameBg =
    sc.theme === "portal" ? "bg-white" :
    sc.theme === "corp"   ? "bg-[#0F1C2E]" :
                            "bg-[#0D1117]";
  const statusBg =
    sc.theme === "portal" ? "bg-white text-slate-400 border-b border-slate-100" :
    sc.theme === "corp"   ? "bg-[#0F1C2E] text-slate-500 border-b border-slate-700/60" :
                            "bg-[#0D1117] text-slate-600 border-b border-slate-800";

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-auto">
      {/* Page header */}
      <div className="flex-shrink-0 flex items-start justify-between px-8 pt-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Monitor size={16} className="text-slate-400" />
            <h1 className="text-base font-bold text-slate-100">Tablet Responsive Layouts</h1>
          </div>
          <p className="text-xs text-slate-500">834px · iPad-style · 44px icon-only sidebar · 2-column grids · Stacked forms</p>
        </div>
        <span className="text-xs text-slate-600 font-mono bg-slate-800 px-2 py-1 rounded">834 × 680</span>
      </div>

      {/* Screen selector */}
      <div className="flex-shrink-0 flex gap-2 flex-wrap px-8 py-4 border-b border-slate-800/50">
        {SCREENS.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              active === s.id
                ? "bg-amber-500 text-slate-900 shadow-sm shadow-amber-500/30"
                : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 border border-slate-700"
            }`}>
            {s.label}
            <span className="ml-1.5 opacity-50 text-[9px]">· {s.module}</span>
          </button>
        ))}
      </div>

      {/* Tablet frame */}
      <div className="flex-1 flex items-start justify-center px-8 py-8 overflow-auto">
        <div style={{ width: 834 }} className="flex-shrink-0">
          {/* Frame label */}
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[10px] text-slate-600 font-mono">iPad · {sc.annotation}</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/70" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/70" />
              <div className="w-2 h-2 rounded-full bg-green-500/70" />
            </div>
          </div>

          {/* Device border + content */}
          <div className={`border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ${frameBg}`}>
            {/* Status bar */}
            <div className={`flex items-center justify-between px-5 py-1.5 text-[9px] ${statusBg}`}>
              <span className="font-bold tracking-tight">9:41</span>
              <span className="tracking-tight">▲ ◀▶ ▮▮</span>
            </div>

            {/* App shell — sidebar + content */}
            <div className="flex" style={{ height: 660 }}>
              {renderSidebar()}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {renderTopbar()}
                <div className="flex-1 overflow-hidden relative">
                  {renderScreen()}
                </div>
              </div>
            </div>
          </div>

          {/* Annotation row */}
          <div className="flex items-center gap-5 mt-3 px-1 text-[10px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-3.5 bg-slate-800 border border-slate-700 rounded-sm" />
              <span>44px icon-only sidebar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-3.5 bg-slate-800/50 border border-slate-700/50 rounded-sm" />
              <span>790px content area</span>
            </div>
            <div className="ml-auto text-slate-700">
              {sc.theme === "admin" ? "Admin dark theme" : sc.theme === "portal" ? "Customer portal light theme" : "Corporate portal dark blue"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
