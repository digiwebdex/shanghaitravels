import { useState, useRef } from "react";
import {
  LayoutDashboard, CheckSquare, AlertTriangle, BarChart2, MoreHorizontal,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Users, DollarSign,
  Check, X, Clock, Zap, Shield, Eye, EyeOff, RefreshCw,
  Activity, Globe, Bell,
} from "lucide-react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const BG   = "#0D1117";
const CARD = "#161B22";
const EL   = "#1C2128";
const BOR  = "#30363D";
const TXT  = "#E6EDF3";
const MUT  = "#8B949E";
const AMB  = "#F59E0B";
const GRN  = "#22C55E";
const RED  = "#EF4444";
const PUR  = "#A855F7";

type TabKey = "dashboard" | "approvals" | "alerts" | "reports" | "more";
type Screen = TabKey | "login";

function StatusBar() {
  return (
    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between",
      height:44, paddingLeft:24, paddingRight:20, paddingBottom:10 }}>
      <span style={{ color:TXT, fontSize:15, fontWeight:600, letterSpacing:-0.3 }}>9:41</span>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill={TXT}>
          <rect x="0" y="5" width="3" height="6" rx="0.5" opacity="0.4"/>
          <rect x="4.5" y="3" width="3" height="8" rx="0.5" opacity="0.7"/>
          <rect x="9" y="1" width="3" height="10" rx="0.5" opacity="0.9"/>
          <rect x="13.5" y="0" width="3" height="11" rx="0.5"/>
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke={TXT} strokeWidth="1.3" strokeLinecap="round">
          <path d="M7.5 8.5v2"/>
          <path d="M5 6.8C5.8 6 6.6 5.6 7.5 5.6S9.2 6 10 6.8" opacity="0.7"/>
          <path d="M3 4.5C4.5 3 5.9 2.3 7.5 2.3S10.5 3 12 4.5" opacity="0.5"/>
          <path d="M1 2.5C3 .7 5.1 0 7.5 0S12 .7 14 2.5" opacity="0.3"/>
        </svg>
        <div style={{ display:"flex", alignItems:"center" }}>
          <div style={{ width:22, height:11, borderRadius:3, border:`1.5px solid ${TXT}`, padding:1.5 }}>
            <div style={{ width:"90%", height:"100%", background:TXT, borderRadius:1 }}/>
          </div>
          <div style={{ width:1.5, height:5, background:TXT, marginLeft:1, borderRadius:1, opacity:0.4 }}/>
        </div>
      </div>
    </div>
  );
}

function HomeIndicator() {
  return (
    <div style={{ height:34, display:"flex", justifyContent:"center", alignItems:"center" }}>
      <div style={{ width:134, height:5, borderRadius:3, background:"rgba(255,255,255,0.22)" }}/>
    </div>
  );
}

const TABS: { key: TabKey; icon: React.FC<{size:number}>; label: string }[] = [
  { key:"dashboard", icon:(p)=><LayoutDashboard {...p}/>, label:"Overview" },
  { key:"approvals", icon:(p)=><CheckSquare {...p}/>,    label:"Approvals"},
  { key:"alerts",    icon:(p)=><AlertTriangle {...p}/>,   label:"Alerts"   },
  { key:"reports",   icon:(p)=><BarChart2 {...p}/>,       label:"Reports"  },
  { key:"more",      icon:(p)=><MoreHorizontal {...p}/>,  label:"More"     },
];

function BottomTabBar({ active, onSelect }: { active: TabKey; onSelect: (k: TabKey) => void }) {
  return (
    <div style={{ height:49, background:CARD, borderTop:`1px solid ${BOR}`, display:"flex" }}>
      {TABS.map(t => {
        const Icon = t.icon;
        const on   = active === t.key;
        return (
          <button key={t.key} onClick={() => onSelect(t.key)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:3, background:"none", border:"none", cursor:"pointer",
              color: on ? AMB : MUT }}>
            <Icon size={22}/>
            <span style={{ fontSize:9.5, fontWeight: on ? 700 : 400 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ flex:1, background:BG, display:"flex", flexDirection:"column",
      padding:"0 28px", paddingTop:60, overflowY:"auto" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:44 }}>
        <div style={{ width:72, height:72, borderRadius:22,
          background:`linear-gradient(135deg,${AMB}30,#D9770630)`,
          border:`2px solid ${AMB}40`, display:"flex", alignItems:"center",
          justifyContent:"center", marginBottom:16 }}>
          <Activity size={30} color={AMB}/>
        </div>
        <p style={{ color:TXT, fontSize:26, fontWeight:800, letterSpacing:-0.5, marginBottom:4 }}>TravelOS</p>
        <p style={{ color:MUT, fontSize:13 }}>Executive Admin</p>
      </div>

      <div style={{ background:CARD, borderRadius:24, padding:24, border:`1px solid ${BOR}` }}>
        <p style={{ color:TXT, fontSize:20, fontWeight:700, marginBottom:4 }}>Executive Login</p>
        <p style={{ color:MUT, fontSize:13, marginBottom:24 }}>Full administrative access</p>

        <p style={{ color:MUT, fontSize:11, fontWeight:600, textTransform:"uppercase",
          letterSpacing:0.5, marginBottom:8 }}>Email</p>
        <div style={{ background:EL, borderRadius:14, padding:"13px 16px",
          border:`1px solid ${BOR}`, marginBottom:14 }}>
          <span style={{ color:TXT, fontSize:15 }}>ceo@travelosco.ae</span>
        </div>

        <p style={{ color:MUT, fontSize:11, fontWeight:600, textTransform:"uppercase",
          letterSpacing:0.5, marginBottom:8 }}>Password</p>
        <div style={{ background:EL, borderRadius:14, padding:"13px 16px", border:`1px solid ${BOR}`,
          display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <span style={{ color:TXT, fontSize:15 }}>{show?"exec2024!":"••••••••••"}</span>
          <button onClick={()=>setShow(!show)} style={{ background:"none", border:"none",
            color:MUT, cursor:"pointer", display:"flex" }}>
            {show?<EyeOff size={18}/>:<Eye size={18}/>}
          </button>
        </div>

        <button onClick={onLogin} style={{ width:"100%", height:52, borderRadius:16,
          background:`linear-gradient(135deg,${AMB},#D97706)`,
          border:"none", color:"#0D1117", fontSize:16, fontWeight:700, cursor:"pointer" }}>
          Sign In
        </button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginTop:32, gap:10 }}>
        <div style={{ width:52, height:52, borderRadius:16, background:EL, border:`1px solid ${BOR}`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Shield size={24} color={AMB}/>
        </div>
        <p style={{ color:MUT, fontSize:12 }}>Biometric authentication</p>
      </div>
      <div style={{ height:24 }}/>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function DashboardScreen() {
  const revData = [
    {d:"10",v:180},{d:"11",v:210},{d:"12",v:165},{d:"13",v:290},{d:"14",v:240},
    {d:"15",v:315},{d:"16",v:270},{d:"17",v:340},{d:"18",v:310},{d:"19",v:380},
  ];
  const kpis = [
    { label:"Monthly Revenue",  value:"AED 2.4M",   sub:"+18% vs last month",  color:GRN,  icon:<DollarSign size={20} color={GRN}/>,  bg:`${GRN}12`  },
    { label:"Active Cases",     value:"145",        sub:"12 need attention",   color:AMB,  icon:<Users size={20} color={AMB}/>,       bg:`${AMB}12`  },
    { label:"SLA Compliance",   value:"94.2%",      sub:"-1.3% this week",     color:RED,  icon:<Clock size={20} color={RED}/>,       bg:`${RED}10`  },
    { label:"Staff Online",     value:"23 / 31",    sub:"8 on leave today",    color:PUR,  icon:<Users size={20} color={PUR}/>,       bg:`${PUR}12`  },
  ];
  const [kpiIdx, setKpiIdx] = useState(0);
  const kpi = kpis[kpiIdx];

  const portals = [
    { name:"Customer Portal",  sessions:1842, health:"operational" },
    { name:"Agent Portal",     sessions:421,  health:"operational" },
    { name:"Staff Portal",     sessions:89,   health:"degraded"    },
    { name:"Supplier Portal",  sessions:34,   health:"operational" },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      <div style={{ padding:"18px 20px 0" }}>
        {/* Greeting */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <p style={{ color:MUT, fontSize:13 }}>Good morning,</p>
            <p style={{ color:TXT, fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>CEO Dashboard</p>
          </div>
          <button style={{ width:42, height:42, borderRadius:14, background:CARD, border:`1px solid ${BOR}`,
            display:"flex", alignItems:"center", justifyContent:"center", position:"relative", cursor:"pointer" }}>
            <Bell size={20} color={TXT}/>
            <div style={{ position:"absolute", top:9, right:9, width:8, height:8, borderRadius:"50%",
              background:RED, border:`2px solid ${BG}` }}/>
          </button>
        </div>

        {/* Swipeable KPI card */}
        <div style={{ position:"relative", marginBottom:16 }}>
          <div style={{ borderRadius:22, padding:22, background:kpi.bg,
            border:`1px solid ${kpi.color}25`, transition:"all 0.25s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ width:44, height:44, borderRadius:14, background:`${kpi.color}20`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {kpi.icon}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {kpis.map((_,i) => (
                  <div key={i} onClick={() => setKpiIdx(i)} style={{ width: i===kpiIdx?20:6, height:6,
                    borderRadius:3, background: i===kpiIdx?kpi.color:BOR,
                    cursor:"pointer", transition:"all 0.2s" }}/>
                ))}
              </div>
            </div>
            <p style={{ color:MUT, fontSize:12, marginBottom:6 }}>{kpi.label}</p>
            <p style={{ color:kpi.color, fontSize:34, fontWeight:800, letterSpacing:-1, marginBottom:4 }}>
              {kpi.value}
            </p>
            <p style={{ color:MUT, fontSize:12 }}>{kpi.sub}</p>
          </div>
          <button onClick={() => setKpiIdx((kpiIdx+kpis.length-1)%kpis.length)}
            style={{ position:"absolute", left:-8, top:"50%", transform:"translateY(-50%)", width:32, height:32,
              borderRadius:"50%", background:CARD, border:`1px solid ${BOR}`, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ChevronLeft size={16} color={TXT}/>
          </button>
          <button onClick={() => setKpiIdx((kpiIdx+1)%kpis.length)}
            style={{ position:"absolute", right:-8, top:"50%", transform:"translateY(-50%)", width:32, height:32,
              borderRadius:"50%", background:CARD, border:`1px solid ${BOR}`, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ChevronRight size={16} color={TXT}/>
          </button>
        </div>

        {/* Revenue chart */}
        <div style={{ background:CARD, borderRadius:18, padding:16, border:`1px solid ${BOR}`, marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <p style={{ color:TXT, fontSize:14, fontWeight:700 }}>Revenue (Jan)</p>
            <p style={{ color:GRN, fontSize:12, fontWeight:700 }}>AED 2.4M total</p>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={revData}>
              <defs>
                <linearGradient id="rv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={AMB} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={AMB} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="d" tick={{ fill:MUT, fontSize:9 }} axisLine={false} tickLine={false}/>
              <Tooltip
                contentStyle={{ background:EL, border:`1px solid ${BOR}`, borderRadius:10, fontSize:11 }}
                itemStyle={{ color:AMB }}
                formatter={(v:number) => [`AED ${(v*10).toFixed(0)}K`, "Revenue"]}
              />
              <Area type="monotone" dataKey="v" stroke={AMB} strokeWidth={2}
                fill="url(#rv)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Portal health */}
        <p style={{ color:TXT, fontSize:15, fontWeight:700, marginBottom:14 }}>Portal Health</p>
        {portals.map(p => (
          <div key={p.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            background:CARD, borderRadius:14, padding:"12px 16px", border:`1px solid ${BOR}`, marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:8, height:8, borderRadius:"50%",
                background: p.health==="operational" ? GRN : AMB }}/>
              <p style={{ color:TXT, fontSize:13.5 }}>{p.name}</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <p style={{ color:MUT, fontSize:12 }}>{p.sessions.toLocaleString()} sessions</p>
              {p.health==="degraded" && (
                <div style={{ background:`${AMB}20`, padding:"2px 8px", borderRadius:6 }}>
                  <p style={{ color:AMB, fontSize:10, fontWeight:700 }}>Degraded</p>
                </div>
              )}
            </div>
          </div>
        ))}
        <div style={{ height:20 }}/>
      </div>
    </div>
  );
}

// ── Approvals Queue ───────────────────────────────────────────────────────────
function ApprovalsScreen() {
  const [cards, setCards] = useState([
    { ref:"REQ-4421", type:"Corporate Booking",   org:"TCS Ltd", desc:"8 pax UAE visa, bulk rate AED 9,600", risk:"low",    amt:"AED 9,600"  },
    { ref:"REQ-4418", type:"Agent Wallet Top-up", org:"Gulf Travels", desc:"AED 50,000 credit increase request", risk:"medium","amt":"AED 50,000"},
    { ref:"REQ-4415", type:"Visa Override",       org:"—", desc:"APP-7701 — Priority embassy slot, fee waiver", risk:"high", amt:"AED 800"  },
    { ref:"REQ-4412", type:"Refund Request",      org:"Sunrise Travel", desc:"BK-4398 cancelled — refund AED 2,100", risk:"low","amt":"AED 2,100"},
  ]);
  const [current, setCurrent] = useState(0);
  const riskColor = { low:GRN, medium:AMB, high:RED };

  const approve = () => setCurrent(c => Math.min(c+1, cards.length));
  const reject  = () => setCurrent(c => Math.min(c+1, cards.length));

  if (current >= cards.length) {
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", background:BG, gap:16 }}>
        <div style={{ width:72, height:72, borderRadius:24, background:`${GRN}20`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Check size={32} color={GRN}/>
        </div>
        <p style={{ color:TXT, fontSize:18, fontWeight:700 }}>All Caught Up!</p>
        <p style={{ color:MUT, fontSize:14, textAlign:"center" }}>No more pending approvals.</p>
        <button onClick={() => setCurrent(0)} style={{ padding:"10px 24px", borderRadius:14,
          background:EL, border:`1px solid ${BOR}`, color:TXT, fontSize:14, cursor:"pointer" }}>
          Refresh
        </button>
      </div>
    );
  }

  const card = cards[current];
  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      <div style={{ padding:"18px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <p style={{ color:TXT, fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>Approvals</p>
          <div style={{ background:CARD, padding:"6px 14px", borderRadius:20, border:`1px solid ${BOR}` }}>
            <p style={{ color:TXT, fontSize:13, fontWeight:700 }}>
              {current+1} <span style={{ color:MUT }}>/ {cards.length}</span>
            </p>
          </div>
        </div>

        {/* Swipe hint */}
        <p style={{ color:MUT, fontSize:12, textAlign:"center", marginBottom:16 }}>
          ← Reject &nbsp;&nbsp; Approve →
        </p>

        {/* Card */}
        <div style={{ background:CARD, borderRadius:24, padding:24, border:`1px solid ${BOR}`, marginBottom:22 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <p style={{ color:MUT, fontSize:10, fontFamily:"monospace", marginBottom:6 }}>{card.ref}</p>
              <p style={{ color:TXT, fontSize:18, fontWeight:700, marginBottom:4 }}>{card.type}</p>
              {card.org !== "—" && <p style={{ color:MUT, fontSize:13 }}>{card.org}</p>}
            </div>
            <div style={{ background:`${riskColor[card.risk as keyof typeof riskColor]}15`,
              padding:"6px 12px", borderRadius:12,
              border:`1px solid ${riskColor[card.risk as keyof typeof riskColor]}25` }}>
              <p style={{ color:riskColor[card.risk as keyof typeof riskColor], fontSize:11, fontWeight:700 }}>
                {card.risk.toUpperCase()} RISK
              </p>
            </div>
          </div>

          <div style={{ background:EL, borderRadius:14, padding:"14px 16px", marginBottom:20 }}>
            <p style={{ color:TXT, fontSize:13.5, lineHeight:1.5 }}>{card.desc}</p>
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ color:MUT, fontSize:13 }}>Amount</p>
            <p style={{ color:AMB, fontSize:20, fontWeight:800 }}>{card.amt}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:"flex", gap:16, marginBottom:24 }}>
          <button onClick={reject} style={{ flex:1, height:60, borderRadius:18,
            background:`${RED}15`, border:`1px solid ${RED}30`,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            gap:4, cursor:"pointer" }}>
            <X size={24} color={RED} strokeWidth={2.5}/>
            <p style={{ color:RED, fontSize:13, fontWeight:700 }}>Reject</p>
          </button>
          <button onClick={approve} style={{ flex:1, height:60, borderRadius:18,
            background:`${GRN}15`, border:`1px solid ${GRN}30`,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            gap:4, cursor:"pointer" }}>
            <Check size={24} color={GRN} strokeWidth={2.5}/>
            <p style={{ color:GRN, fontSize:13, fontWeight:700 }}>Approve</p>
          </button>
        </div>

        {/* Upcoming queue preview */}
        {current < cards.length - 1 && (
          <>
            <p style={{ color:MUT, fontSize:12, marginBottom:12 }}>Up next</p>
            {cards.slice(current+1, current+3).map((c, i) => (
              <div key={c.ref} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                background:CARD, borderRadius:14, padding:"12px 16px", border:`1px solid ${BOR}`,
                marginBottom:8, opacity: 0.7 - i * 0.2 }}>
                <div>
                  <p style={{ color:MUT, fontSize:10, fontFamily:"monospace", marginBottom:2 }}>{c.ref}</p>
                  <p style={{ color:TXT, fontSize:13, fontWeight:600 }}>{c.type}</p>
                </div>
                <p style={{ color:AMB, fontSize:13, fontWeight:700 }}>{c.amt}</p>
              </div>
            ))}
          </>
        )}
        <div style={{ height:16 }}/>
      </div>
    </div>
  );
}

// ── Alerts / SLA ──────────────────────────────────────────────────────────────
function AlertsScreen() {
  const [filter, setFilter] = useState<"all"|"breach"|"warning">("all");
  const alerts = [
    { type:"breach",  icon:"🔴", ref:"APP-7705", text:"Mohammed Al-Ali — Schengen submission overdue by 6h",    t:"5m ago",   ack:false },
    { type:"breach",  icon:"🔴", ref:"APP-7701", text:"Priya Sharma — Embassy deadline missed (yesterday)",      t:"2h ago",   ack:false },
    { type:"warning", icon:"🟡", ref:"APP-7698", text:"Chen Wei — Staff review due in 2h",                       t:"30m ago",  ack:false },
    { type:"warning", icon:"🟡", ref:"APP-7692", text:"Fatima Al-Rashidi — Payment pending for 72h",             t:"1h ago",   ack:true  },
    { type:"breach",  icon:"🔴", ref:"SYS-001",  text:"AI Verification service elevated latency (320ms avg)",    t:"45m ago",  ack:false },
    { type:"warning", icon:"🟡", ref:"AGT-8891", text:"Gulf Travels wallet below AED 5,000 threshold",           t:"3h ago",   ack:true  },
    { type:"warning", icon:"🟡", ref:"BKG-4418", text:"3 applications awaiting senior officer review > 48h",     t:"4h ago",   ack:false },
  ];
  const shown = filter==="all" ? alerts : alerts.filter(a=>a.type===filter);

  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      <div style={{ padding:"18px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <p style={{ color:TXT, fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>SLA & Alerts</p>
          <button style={{ padding:"6px 12px", borderRadius:10, background:EL, border:`1px solid ${BOR}`,
            color:MUT, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
            <RefreshCw size={12}/> Refresh
          </button>
        </div>

        {/* Summary pills */}
        <div style={{ display:"flex", gap:8, marginBottom:18 }}>
          <button onClick={()=>setFilter("all")} style={{ flex:1, height:40, borderRadius:12,
            background: filter==="all" ? EL : "transparent",
            border: `1px solid ${filter==="all"?BOR:"transparent"}`,
            color: filter==="all" ? TXT : MUT, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            All ({alerts.length})
          </button>
          <button onClick={()=>setFilter("breach")} style={{ flex:1, height:40, borderRadius:12,
            background: filter==="breach" ? `${RED}15` : "transparent",
            border: `1px solid ${filter==="breach"?RED+"40":"transparent"}`,
            color: filter==="breach" ? RED : MUT, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            🔴 Breach ({alerts.filter(a=>a.type==="breach").length})
          </button>
          <button onClick={()=>setFilter("warning")} style={{ flex:1, height:40, borderRadius:12,
            background: filter==="warning" ? `${AMB}15` : "transparent",
            border: `1px solid ${filter==="warning"?AMB+"40":"transparent"}`,
            color: filter==="warning" ? AMB : MUT, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            🟡 Warn ({alerts.filter(a=>a.type==="warning").length})
          </button>
        </div>

        {shown.map((a, i) => (
          <div key={i} style={{ display:"flex", gap:14, background:CARD, borderRadius:16,
            padding:"14px 16px", border:`1px solid ${a.type==="breach"?RED+"25":AMB+"20"}`,
            marginBottom:10, opacity: a.ack ? 0.55 : 1 }}>
            <div style={{ width:40, height:40, borderRadius:12, flexShrink:0, fontSize:20,
              background: a.type==="breach" ? `${RED}15` : `${AMB}15`,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {a.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                <p style={{ color:MUT, fontSize:10, fontFamily:"monospace" }}>{a.ref}</p>
                <p style={{ color:MUT, fontSize:10 }}>{a.t}</p>
              </div>
              <p style={{ color:TXT, fontSize:12.5, lineHeight:1.45, marginBottom:8 }}>{a.text}</p>
              {!a.ack && (
                <button style={{ padding:"5px 12px", borderRadius:8,
                  background: a.type==="breach" ? `${RED}15` : `${AMB}15`,
                  border:"none", color: a.type==="breach" ? RED : AMB, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                  Acknowledge
                </button>
              )}
              {a.ack && <p style={{ color:MUT, fontSize:11 }}>✓ Acknowledged</p>}
            </div>
          </div>
        ))}
        <div style={{ height:16 }}/>
      </div>
    </div>
  );
}

// ── Reports Summary ───────────────────────────────────────────────────────────
function ReportsScreen() {
  const monthly = [
    {m:"Aug",r:1.8},{m:"Sep",r:2.1},{m:"Oct",r:1.9},{m:"Nov",r:2.5},{m:"Dec",r:2.9},{m:"Jan",r:2.4},
  ];
  const services = [
    { name:"Schengen Visa",   rev:"AED 890K",  apps:312, pct:37 },
    { name:"UK Visa",         rev:"AED 520K",  apps:184, pct:22 },
    { name:"UAE Entry Permit",rev:"AED 360K",  apps:440, pct:15 },
    { name:"Air Ticketing",   rev:"AED 290K",  apps:128, pct:12 },
    { name:"Hotel Packages",  rev:"AED 210K",  apps:76,  pct:9  },
    { name:"Other",           rev:"AED 130K",  apps:55,  pct:5  },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      <div style={{ padding:"18px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <p style={{ color:TXT, fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>Reports</p>
          <div style={{ background:EL, padding:"6px 12px", borderRadius:10, border:`1px solid ${BOR}` }}>
            <p style={{ color:MUT, fontSize:12 }}>Jan 2025</p>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:18 }}>
          {[
            { l:"Total Revenue",  v:"AED 2.4M", sub:"+18% MoM", c:GRN  },
            { l:"Applications",   v:"1,195",    sub:"+8% MoM",  c:AMB  },
            { l:"Avg Ticket",     v:"AED 2,010",sub:"+9% MoM",  c:BOR  },
            { l:"NPS Score",      v:"72",       sub:"+4 pts",   c:PUR  },
          ].map(k => (
            <div key={k.l} style={{ background:CARD, borderRadius:16, padding:"14px 14px",
              border:`1px solid ${BOR}` }}>
              <p style={{ color:MUT, fontSize:11, marginBottom:6 }}>{k.l}</p>
              <p style={{ color:k.c===BOR?TXT:k.c, fontSize:20, fontWeight:800, marginBottom:3 }}>{k.v}</p>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <TrendingUp size={11} color={GRN}/>
                <p style={{ color:GRN, fontSize:10 }}>{k.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue trend */}
        <div style={{ background:CARD, borderRadius:18, padding:16, border:`1px solid ${BOR}`, marginBottom:18 }}>
          <p style={{ color:TXT, fontSize:14, fontWeight:700, marginBottom:14 }}>Revenue Trend (6 mo)</p>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={monthly}>
              <XAxis dataKey="m" tick={{ fill:MUT, fontSize:10 }} axisLine={false} tickLine={false}/>
              <Tooltip
                contentStyle={{ background:EL, border:`1px solid ${BOR}`, borderRadius:10, fontSize:11 }}
                itemStyle={{ color:AMB }}
                formatter={(v:number) => [`AED ${v}M`, "Revenue"]}
              />
              <Line type="monotone" dataKey="r" stroke={AMB} strokeWidth={2.5} dot={{ fill:AMB, r:3 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Services breakdown */}
        <p style={{ color:TXT, fontSize:15, fontWeight:700, marginBottom:14 }}>Revenue by Service</p>
        {services.map(s => (
          <div key={s.name} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <p style={{ color:TXT, fontSize:13 }}>{s.name}</p>
              <div style={{ display:"flex", gap:12 }}>
                <p style={{ color:MUT, fontSize:12 }}>{s.apps} apps</p>
                <p style={{ color:TXT, fontSize:13, fontWeight:700 }}>{s.rev}</p>
              </div>
            </div>
            <div style={{ background:EL, borderRadius:4, height:4, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${s.pct}%`, borderRadius:4,
                background:`linear-gradient(90deg,${AMB},${GRN})` }}/>
            </div>
          </div>
        ))}
        <div style={{ height:20 }}/>
      </div>
    </div>
  );
}

// ── More ──────────────────────────────────────────────────────────────────────
function MoreScreen({ onLogout }: { onLogout: () => void }) {
  const items = [
    { label:"User Management",     icon:<Users size={18} color={MUT}/>,        sub:"31 active staff"              },
    { label:"Branch Overview",     icon:<Globe size={18} color={MUT}/>,        sub:"5 branches, 4 countries"      },
    { label:"System Health",       icon:<Activity size={18} color={MUT}/>,     sub:"1 degraded service"           },
    { label:"Notification Center", icon:<Bell size={18} color={MUT}/>,         sub:"12 unread alerts"             },
    { label:"Settings",            icon:<Shield size={18} color={MUT}/>,       sub:"General & security"           },
    { label:"Audit Log",           icon:<Zap size={18} color={MUT}/>,          sub:"Last event 2 min ago"         },
  ];
  return (
    <div style={{ flex:1, overflowY:"auto", background:BG, padding:"18px 20px 0" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:22 }}>
        <div style={{ width:64, height:64, borderRadius:"50%",
          background:`linear-gradient(135deg,${AMB},#D97706)`,
          display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10,
          boxShadow:`0 0 0 4px ${AMB}30` }}>
          <p style={{ color:"#0D1117", fontSize:24, fontWeight:800 }}>M</p>
        </div>
        <p style={{ color:TXT, fontSize:16, fontWeight:700, marginBottom:2 }}>Mohammed Al-Rashidi</p>
        <p style={{ color:MUT, fontSize:12 }}>Chief Executive Officer</p>
        <div style={{ background:`${AMB}20`, padding:"4px 12px", borderRadius:20, marginTop:8 }}>
          <p style={{ color:AMB, fontSize:11, fontWeight:600 }}>Super Admin · All access</p>
        </div>
      </div>

      <div style={{ background:CARD, borderRadius:18, border:`1px solid ${BOR}`, overflow:"hidden", marginBottom:14 }}>
        {items.map((item, i) => (
          <div key={item.label} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
            borderBottom: i<items.length-1 ? `1px solid ${BOR}` : "none", cursor:"pointer" }}>
            <div style={{ width:36, height:36, borderRadius:10, background:EL,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {item.icon}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ color:TXT, fontSize:13.5 }}>{item.label}</p>
              <p style={{ color:MUT, fontSize:11, marginTop:1 }}>{item.sub}</p>
            </div>
            <ChevronRight size={15} color={MUT}/>
          </div>
        ))}
      </div>

      <button onClick={onLogout} style={{ width:"100%", height:46, borderRadius:14,
        background:`${RED}12`, border:`1px solid ${RED}22`,
        color:RED, fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:24 }}>
        Sign Out
      </button>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function AdminApp() {
  const [screen, setScreen] = useState<Screen>("login");
  const [tab,    setTab]    = useState<TabKey>("dashboard");

  const changeTab = (t: TabKey) => { setTab(t); setScreen(t); };
  const showTabs  = screen !== "login";

  const renderScreen = () => {
    switch (screen) {
      case "login":     return <LoginScreen onLogin={() => { setTab("dashboard"); setScreen("dashboard"); }}/>;
      case "dashboard": return <DashboardScreen/>;
      case "approvals": return <ApprovalsScreen/>;
      case "alerts":    return <AlertsScreen/>;
      case "reports":   return <ReportsScreen/>;
      case "more":      return <MoreScreen onLogout={() => setScreen("login")}/>;
      default:          return null;
    }
  };

  return (
    <div style={{ width:375, height:812, background:BG, overflow:"hidden",
      display:"flex", flexDirection:"column" }}>
      <StatusBar/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>
        {renderScreen()}
      </div>
      {showTabs && <BottomTabBar active={tab} onSelect={changeTab}/>}
      <HomeIndicator/>
    </div>
  );
}
