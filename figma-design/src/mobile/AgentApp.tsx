import { useState } from "react";
import {
  LayoutDashboard, Wallet, Users, Globe, Bell,
  ChevronLeft, ChevronRight, Plus, TrendingUp,
  Plane, Check, X, Clock, ArrowUpRight, ArrowDownRight,
  Search, Briefcase, RefreshCw, Shield, Eye, EyeOff,
} from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";

const BG   = "#0D1117";
const CARD = "#161B22";
const EL   = "#1C2128";
const BOR  = "#30363D";
const TXT  = "#E6EDF3";
const MUT  = "#8B949E";
const AMB  = "#F59E0B";
const GRN  = "#22C55E";
const RED  = "#EF4444";
const BLU  = "#3B82F6";

type TabKey = "dashboard" | "bookings" | "passengers" | "commission" | "alerts";
type Screen = TabKey | "login" | "booking_form";

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
            <div style={{ width:"80%", height:"100%", background:TXT, borderRadius:1 }}/>
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
  { key:"dashboard",  icon:(p)=><LayoutDashboard {...p}/>, label:"Home"      },
  { key:"bookings",   icon:(p)=><Plane {...p}/>,           label:"Bookings"  },
  { key:"passengers", icon:(p)=><Users {...p}/>,           label:"Passengers"},
  { key:"commission", icon:(p)=><TrendingUp {...p}/>,      label:"Commission"},
  { key:"alerts",     icon:(p)=><Bell {...p}/>,            label:"Alerts"    },
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
        <div style={{ width:72, height:72, borderRadius:22, background:"#0F2818",
          border:`2px solid ${GRN}40`, display:"flex", alignItems:"center",
          justifyContent:"center", marginBottom:16 }}>
          <Briefcase size={30} color={GRN}/>
        </div>
        <p style={{ color:TXT, fontSize:26, fontWeight:800, letterSpacing:-0.5, marginBottom:4 }}>TravelOS</p>
        <p style={{ color:MUT, fontSize:13 }}>Agent Portal</p>
      </div>

      <div style={{ background:CARD, borderRadius:24, padding:24, border:`1px solid ${BOR}` }}>
        <p style={{ color:TXT, fontSize:20, fontWeight:700, marginBottom:4 }}>Agent Login</p>
        <p style={{ color:MUT, fontSize:13, marginBottom:24 }}>Access your bookings &amp; wallet</p>

        <p style={{ color:MUT, fontSize:11, fontWeight:600, textTransform:"uppercase",
          letterSpacing:0.5, marginBottom:8 }}>Agent ID / Email</p>
        <div style={{ background:EL, borderRadius:14, padding:"13px 16px",
          border:`1px solid ${BOR}`, marginBottom:14 }}>
          <span style={{ color:TXT, fontSize:15 }}>sunrise.travel@gmail.com</span>
        </div>

        <p style={{ color:MUT, fontSize:11, fontWeight:600, textTransform:"uppercase",
          letterSpacing:0.5, marginBottom:8 }}>Password</p>
        <div style={{ background:EL, borderRadius:14, padding:"13px 16px", border:`1px solid ${BOR}`,
          display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <span style={{ color:TXT, fontSize:15 }}>{show?"sunrise2024":"••••••••••"}</span>
          <button onClick={()=>setShow(!show)}
            style={{ background:"none", border:"none", color:MUT, cursor:"pointer", display:"flex" }}>
            {show?<EyeOff size={18}/>:<Eye size={18}/>}
          </button>
        </div>

        <button onClick={onLogin} style={{ width:"100%", height:52, borderRadius:16,
          background:GRN, border:"none", color:"#0D1117", fontSize:16, fontWeight:700, cursor:"pointer" }}>
          Sign In
        </button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginTop:32, gap:10 }}>
        <div style={{ width:52, height:52, borderRadius:16, background:EL, border:`1px solid ${BOR}`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Shield size={24} color={GRN}/>
        </div>
        <p style={{ color:MUT, fontSize:12 }}>Sign in with Face ID</p>
      </div>
      <div style={{ height:24 }}/>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function DashboardScreen({ goTo }: { goTo: (s: Screen) => void }) {
  const weekData = [
    { d:"Mon", amt:12400 }, { d:"Tue", amt:18200 }, { d:"Wed", amt:9800  },
    { d:"Thu", amt:22100 }, { d:"Fri", amt:31500 }, { d:"Sat", amt:16700 }, { d:"Sun", amt:8900 },
  ];
  const bookings = [
    { ref:"BK-4421", pax:"Mohammed Al-Ali",    dest:"🇸🇬 Singapore",   type:"Visa",    st:"confirmed", amt:"AED 1,200" },
    { ref:"BK-4420", pax:"Priya Sharma",       dest:"🇬🇧 UK",          type:"Visa",    st:"pending",   amt:"AED 850"   },
    { ref:"BK-4419", pax:"Ahmed Hassan",       dest:"🇩🇪 Germany",     type:"Schengen",st:"confirmed", amt:"AED 2,400" },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      <div style={{ padding:"18px 20px 0" }}>
        {/* Wallet card */}
        <div style={{ borderRadius:22, padding:22, marginBottom:18,
          background:"linear-gradient(135deg,#0F2818,#082010)", border:`1px solid ${GRN}30` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
            <div>
              <p style={{ color:MUT, fontSize:12, marginBottom:8 }}>Wallet Balance</p>
              <p style={{ color:GRN, fontSize:34, fontWeight:800, letterSpacing:-1 }}>AED 124,500</p>
            </div>
            <div style={{ width:44, height:44, borderRadius:14, background:`${GRN}15`,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Wallet size={22} color={GRN}/>
            </div>
          </div>
          <div style={{ display:"flex", gap:12, marginTop:16 }}>
            <div style={{ flex:1, background:"rgba(34,197,94,0.08)", borderRadius:12, padding:"10px 14px" }}>
              <p style={{ color:MUT, fontSize:10, marginBottom:4 }}>This Month</p>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <ArrowUpRight size={14} color={GRN}/>
                <p style={{ color:GRN, fontSize:16, fontWeight:700 }}>AED 38,200</p>
              </div>
            </div>
            <div style={{ flex:1, background:"rgba(239,68,68,0.06)", borderRadius:12, padding:"10px 14px" }}>
              <p style={{ color:MUT, fontSize:10, marginBottom:4 }}>Commissions Paid</p>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <ArrowDownRight size={14} color={RED}/>
                <p style={{ color:RED, fontSize:16, fontWeight:700 }}>AED 4,820</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:18 }}>
          {[
            { label:"Today's Bookings", value:"8",  color:AMB },
            { label:"Pending Approval", value:"3",  color:RED },
            { label:"Completed",        value:"12", color:GRN },
          ].map(s => (
            <div key={s.label} style={{ background:CARD, borderRadius:14, padding:"12px 10px",
              border:`1px solid ${BOR}`, textAlign:"center" }}>
              <p style={{ color:s.color, fontSize:22, fontWeight:800, marginBottom:3 }}>{s.value}</p>
              <p style={{ color:MUT, fontSize:9.5, lineHeight:1.3 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Weekly chart */}
        <div style={{ background:CARD, borderRadius:18, padding:16, border:`1px solid ${BOR}`, marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <p style={{ color:TXT, fontSize:14, fontWeight:700 }}>Weekly Earnings</p>
            <p style={{ color:GRN, fontSize:13, fontWeight:700 }}>+18% ↑</p>
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={weekData} barSize={20}>
              <XAxis dataKey="d" tick={{ fill:MUT, fontSize:10 }} axisLine={false} tickLine={false}/>
              <Tooltip
                contentStyle={{ background:EL, border:`1px solid ${BOR}`, borderRadius:10, fontSize:11 }}
                labelStyle={{ color:MUT }}
                itemStyle={{ color:GRN }}
                formatter={(v:number) => [`AED ${(v/1000).toFixed(1)}K`, "Earned"]}
              />
              <Bar dataKey="amt" fill={`${GRN}60`} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Today's bookings */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <p style={{ color:TXT, fontSize:15, fontWeight:700 }}>Today&apos;s Bookings</p>
          <button onClick={() => goTo("bookings")} style={{ background:"none", border:"none",
            color:AMB, fontSize:13, cursor:"pointer" }}>See all →</button>
        </div>
        {bookings.map(b => (
          <div key={b.ref} style={{ display:"flex", alignItems:"center", gap:12, background:CARD,
            borderRadius:16, padding:"13px 16px", border:`1px solid ${BOR}`, marginBottom:10 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:EL,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Globe size={18} color={MUT}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ color:TXT, fontSize:13, fontWeight:600, marginBottom:2 }}
                style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {b.pax}
              </p>
              <p style={{ color:MUT, fontSize:11 }}>{b.dest} · {b.type}</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ color:TXT, fontSize:13, fontWeight:700 }}>{b.amt}</p>
              <p style={{ color: b.st==="confirmed"?GRN:AMB, fontSize:10, fontWeight:600 }}>
                {b.st==="confirmed"?"Confirmed":"Pending"}
              </p>
            </div>
          </div>
        ))}

        {/* Quick book CTA */}
        <button onClick={() => goTo("booking_form")} style={{ width:"100%", height:52, borderRadius:16,
          background:AMB, border:"none", color:"#0D1117", fontSize:15, fontWeight:700,
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          gap:8, marginTop:6, marginBottom:24 }}>
          <Plus size={20}/>
          Quick New Booking
        </button>
      </div>
    </div>
  );
}

// ── Booking Form ──────────────────────────────────────────────────────────────
function BookingFormScreen({ goBack }: { goBack: () => void }) {
  const [service, setService] = useState<"visa"|"flight"|"hotel">("visa");
  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 20px",
        borderBottom:`1px solid ${BOR}`, background:CARD }}>
        <button onClick={goBack} style={{ background:"none", border:"none", color:TXT,
          cursor:"pointer", display:"flex" }}>
          <ChevronLeft size={24}/>
        </button>
        <p style={{ color:TXT, fontSize:16, fontWeight:700 }}>Quick Booking</p>
      </div>

      <div style={{ padding:"20px 20px 0" }}>
        {/* Service selector */}
        <p style={{ color:MUT, fontSize:11, fontWeight:600, textTransform:"uppercase",
          letterSpacing:0.5, marginBottom:12 }}>Service Type</p>
        <div style={{ display:"flex", gap:8, marginBottom:22 }}>
          {([["visa","Visa"],["flight","Flight"],["hotel","Hotel"]] as const).map(([k,l]) => (
            <button key={k} onClick={() => setService(k)} style={{ flex:1, height:44, borderRadius:14,
              border:"none", cursor:"pointer", fontSize:13, fontWeight: service===k ? 700 : 500,
              background: service===k ? AMB : EL,
              color:       service===k ? "#0D1117" : MUT }}>
              {l}
            </button>
          ))}
        </div>

        {/* Fields */}
        {([
          ["Passenger Name",  "Mohammed Al-Ali"],
          ["Passport No.",    "A12345678"],
          ["Nationality",     "UAE National"],
          ["Destination",     "Germany — Schengen"],
          ["Travel Date",     "15 Jan 2025"],
          ["Return Date",     "30 Jan 2025"],
        ] as [string,string][]).map(([label, val]) => (
          <div key={label} style={{ marginBottom:14 }}>
            <p style={{ color:MUT, fontSize:11, fontWeight:600, textTransform:"uppercase",
              letterSpacing:0.5, marginBottom:8 }}>{label}</p>
            <div style={{ background:EL, borderRadius:14, padding:"13px 16px",
              border:`1px solid ${BOR}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ color:TXT, fontSize:15 }}>{val}</span>
              <ChevronRight size={16} color={MUT}/>
            </div>
          </div>
        ))}

        {/* Price estimate */}
        <div style={{ background:`${AMB}15`, borderRadius:16, padding:"14px 16px",
          border:`1px solid ${AMB}30`, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:MUT, fontSize:12, marginBottom:4 }}>Estimated Fee</p>
              <p style={{ color:AMB, fontSize:24, fontWeight:800 }}>AED 2,400</p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ color:MUT, fontSize:11, marginBottom:4 }}>Commission</p>
              <p style={{ color:GRN, fontSize:16, fontWeight:700 }}>AED 240</p>
            </div>
          </div>
        </div>

        <button style={{ width:"100%", height:52, borderRadius:16, background:AMB,
          border:"none", color:"#0D1117", fontSize:15, fontWeight:700, cursor:"pointer", marginBottom:24 }}>
          Submit Booking
        </button>
      </div>
    </div>
  );
}

// ── Passengers ────────────────────────────────────────────────────────────────
function PassengersScreen() {
  const [q, setQ] = useState("");
  const pax = [
    { name:"Mohammed Al-Ali",   nat:"🇦🇪 UAE",    pass:"A12345678", exp:"Oct 2027", apps:3  },
    { name:"Priya Sharma",      nat:"🇮🇳 India",  pass:"P98765432", exp:"Mar 2026", apps:1  },
    { name:"Ahmed Hassan",      nat:"🇸🇦 KSA",    pass:"G55512345", exp:"Jun 2028", apps:5  },
    { name:"Chen Wei",          nat:"🇨🇳 China",  pass:"E20183452", exp:"Jan 2026", apps:2  },
    { name:"Fatima Al-Rashidi", nat:"🇦🇪 UAE",    pass:"A77891234", exp:"Aug 2027", apps:4  },
    { name:"John Smith",        nat:"🇬🇧 UK",     pass:"P23456789", exp:"Dec 2025", apps:1  },
  ];
  const shown = q ? pax.filter(p => p.name.toLowerCase().includes(q.toLowerCase())) : pax;
  const expiringSoon = (exp: string) => {
    const [m, y] = exp.split(" ");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const diff = parseInt(y) * 12 + months.indexOf(m) - (2025 * 12 + 0);
    return diff < 6;
  };

  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      <div style={{ padding:"18px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <p style={{ color:TXT, fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>Passengers</p>
          <button style={{ width:38, height:38, borderRadius:12, background:AMB,
            border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <Plus size={20} color="#0D1117"/>
          </button>
        </div>

        {/* Search */}
        <div style={{ background:CARD, borderRadius:16, padding:"0 16px", border:`1px solid ${BOR}`,
          display:"flex", alignItems:"center", gap:10, marginBottom:18, height:44 }}>
          <Search size={17} color={MUT}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search passengers…"
            style={{ flex:1, background:"none", border:"none", color:TXT, fontSize:14, outline:"none" }}/>
        </div>

        {shown.map(p => (
          <div key={p.name} style={{ background:CARD, borderRadius:16, padding:"14px 16px",
            border:`1px solid ${BOR}`, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:"50%",
                  background:`linear-gradient(135deg,${AMB}40,${GRN}20)`,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <p style={{ color:TXT, fontSize:14, fontWeight:700 }}>{p.name[0]}</p>
                </div>
                <div>
                  <p style={{ color:TXT, fontSize:13.5, fontWeight:600, marginBottom:2 }}>{p.name}</p>
                  <p style={{ color:MUT, fontSize:11 }}>{p.nat}</p>
                </div>
              </div>
              <div style={{ background:`${GRN}20`, padding:"3px 8px", borderRadius:6 }}>
                <p style={{ color:GRN, fontSize:10, fontWeight:700 }}>{p.apps} apps</p>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ background:EL, borderRadius:8, padding:"6px 10px", flex:1 }}>
                <p style={{ color:MUT, fontSize:9, marginBottom:2 }}>Passport</p>
                <p style={{ color:TXT, fontSize:11, fontFamily:"monospace" }}>{p.pass}</p>
              </div>
              <div style={{ background: expiringSoon(p.exp) ? `${RED}15` : EL,
                borderRadius:8, padding:"6px 10px", flex:1, border: expiringSoon(p.exp) ? `1px solid ${RED}30` : "none" }}>
                <p style={{ color:MUT, fontSize:9, marginBottom:2 }}>Expires</p>
                <p style={{ color: expiringSoon(p.exp) ? RED : TXT, fontSize:11, fontWeight: expiringSoon(p.exp) ? 700 : 400 }}>
                  {p.exp}{expiringSoon(p.exp)?" ⚠":""}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div style={{ height:16 }}/>
      </div>
    </div>
  );
}

// ── Commission ────────────────────────────────────────────────────────────────
function CommissionScreen() {
  const months = [
    { m:"Aug", c:5800 }, { m:"Sep", c:7200 }, { m:"Oct", c:6100 },
    { m:"Nov", c:9400 }, { m:"Dec", c:11200 }, { m:"Jan", c:4820 },
  ];
  const recent = [
    { ref:"BK-4419", pax:"Ahmed Hassan",    dest:"🇩🇪 Germany", amt:"AED 240", date:"Today 14:22"  },
    { ref:"BK-4416", pax:"Priya Sharma",    dest:"🇬🇧 UK",      amt:"AED 85",  date:"Today 11:05"  },
    { ref:"BK-4411", pax:"Chen Wei",        dest:"🇨🇳 China",   amt:"AED 120", date:"Yesterday"    },
    { ref:"BK-4408", pax:"John Smith",      dest:"🇺🇸 USA",     amt:"AED 195", date:"17 Jan"       },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      <div style={{ padding:"18px 20px 0" }}>
        <p style={{ color:TXT, fontSize:22, fontWeight:800, letterSpacing:-0.5, marginBottom:18 }}>Commission</p>

        {/* Hero card */}
        <div style={{ borderRadius:22, padding:22, marginBottom:18,
          background:"linear-gradient(135deg,#0F1A2E,#071526)", border:`1px solid ${BLU}25` }}>
          <p style={{ color:MUT, fontSize:12, marginBottom:8 }}>January Earnings</p>
          <p style={{ color:BLU, fontSize:34, fontWeight:800, letterSpacing:-1, marginBottom:4 }}>AED 4,820</p>
          <p style={{ color:MUT, fontSize:12 }}>← AED 11,200 last month</p>
          <div style={{ display:"flex", gap:16, marginTop:18 }}>
            {[{l:"Visa",v:"AED 3,120"},{l:"Flight",v:"AED 980"},{l:"Hotel",v:"AED 720"}].map(s => (
              <div key={s.l}>
                <p style={{ color:MUT, fontSize:10, marginBottom:3 }}>{s.l}</p>
                <p style={{ color:TXT, fontSize:14, fontWeight:700 }}>{s.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ background:CARD, borderRadius:18, padding:16, border:`1px solid ${BOR}`, marginBottom:18 }}>
          <p style={{ color:TXT, fontSize:14, fontWeight:700, marginBottom:14 }}>6-Month Trend</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={months} barSize={22}>
              <XAxis dataKey="m" tick={{ fill:MUT, fontSize:10 }} axisLine={false} tickLine={false}/>
              <Tooltip
                contentStyle={{ background:EL, border:`1px solid ${BOR}`, borderRadius:10, fontSize:11 }}
                itemStyle={{ color:BLU }}
                formatter={(v:number) => [`AED ${(v/1000).toFixed(1)}K`, "Commission"]}
              />
              <Bar dataKey="c" fill={`${BLU}60`} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent entries */}
        <p style={{ color:TXT, fontSize:15, fontWeight:700, marginBottom:14 }}>Recent Commissions</p>
        {recent.map(r => (
          <div key={r.ref} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            background:CARD, borderRadius:16, padding:"13px 16px", border:`1px solid ${BOR}`, marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${BLU}15`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <TrendingUp size={16} color={BLU}/>
              </div>
              <div>
                <p style={{ color:TXT, fontSize:13, fontWeight:600, marginBottom:2 }}>{r.pax}</p>
                <p style={{ color:MUT, fontSize:11 }}>{r.dest} · {r.date}</p>
              </div>
            </div>
            <p style={{ color:GRN, fontSize:14, fontWeight:700 }}>{r.amt}</p>
          </div>
        ))}
        <div style={{ height:16 }}/>
      </div>
    </div>
  );
}

// ── Alerts / Bookings ─────────────────────────────────────────────────────────
function AlertsScreen() {
  const items = [
    { icon:"⚠️", title:"Visa Expiry Warning",        body:"Mohammed Al-Ali — passport expires Oct 2027. Renew before booking.", t:"2m ago",  color:AMB },
    { icon:"✅", title:"Booking Confirmed",            body:"BK-4419 — Ahmed Hassan Germany visa approved & confirmed.",         t:"18m ago", color:GRN },
    { icon:"💳", title:"Wallet Credit",               body:"AED 5,000 top-up credited from agency account.",                    t:"1h ago",  color:BLU },
    { icon:"❌", title:"Application Rejected",        body:"BK-4398 — Priya Sharma UK visa application declined by embassy.",   t:"3h ago",  color:RED },
    { icon:"🔔", title:"New Booking Request",          body:"Corporate client TCS Ltd — 8 pax UAE visa, bulk rate applicable.", t:"5h ago",  color:MUT },
    { icon:"⏰", title:"SLA Alert",                   body:"BK-4407 — Embassy submission deadline in 24 hours.",                t:"Yesterday",color:RED },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      <div style={{ padding:"18px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <p style={{ color:TXT, fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>Alerts</p>
          <button style={{ padding:"6px 12px", borderRadius:10, background:EL, border:`1px solid ${BOR}`,
            color:MUT, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
            <RefreshCw size={13}/> Mark all read
          </button>
        </div>

        {items.map((item, i) => (
          <div key={i} style={{ display:"flex", gap:14, background:CARD, borderRadius:16,
            padding:"14px 16px", border:`1px solid ${item.color}20`, marginBottom:10 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:`${item.color}15`,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18 }}>
              {item.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                <p style={{ color:TXT, fontSize:13, fontWeight:700 }}>{item.title}</p>
                <p style={{ color:MUT, fontSize:10, flexShrink:0, marginLeft:8 }}>{item.t}</p>
              </div>
              <p style={{ color:MUT, fontSize:11.5, lineHeight:1.45 }}>{item.body}</p>
            </div>
          </div>
        ))}
        <div style={{ height:16 }}/>
      </div>
    </div>
  );
}

// ── Bookings list ─────────────────────────────────────────────────────────────
function BookingsScreen() {
  const bookings = [
    { ref:"BK-4421", pax:"Mohammed Al-Ali",   dest:"🇸🇬 Singapore", type:"Visa",  st:"confirmed", amt:"AED 1,200", date:"Today"    },
    { ref:"BK-4420", pax:"Priya Sharma",      dest:"🇬🇧 UK",        type:"Visa",  st:"pending",   amt:"AED 850",   date:"Today"    },
    { ref:"BK-4419", pax:"Ahmed Hassan",      dest:"🇩🇪 Germany",   type:"Schengen",st:"confirmed",amt:"AED 2,400", date:"Today"    },
    { ref:"BK-4418", pax:"Chen Wei",          dest:"🇨🇳 China",     type:"Flight",st:"cancelled", amt:"AED 2,100", date:"Yesterday"},
    { ref:"BK-4417", pax:"Fatima Al-Rashidi", dest:"🇫🇷 France",    type:"Visa",  st:"confirmed", amt:"AED 1,800", date:"17 Jan"   },
  ];
  const stColor = { confirmed:GRN, pending:AMB, cancelled:RED };
  const stLabel = { confirmed:"Confirmed", pending:"Pending", cancelled:"Cancelled" };

  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      <div style={{ padding:"18px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <p style={{ color:TXT, fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>Bookings</p>
          <button style={{ width:38, height:38, borderRadius:12, background:AMB, border:"none",
            display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <Plus size={20} color="#0D1117"/>
          </button>
        </div>

        {bookings.map(b => (
          <div key={b.ref} style={{ background:CARD, borderRadius:16, padding:"14px 16px",
            border:`1px solid ${BOR}`, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <p style={{ color:MUT, fontSize:10, fontFamily:"monospace", marginBottom:4 }}>{b.ref}</p>
                <p style={{ color:TXT, fontSize:14, fontWeight:700, marginBottom:2 }}>{b.pax}</p>
                <p style={{ color:MUT, fontSize:11 }}>{b.dest} · {b.type}</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ background:`${stColor[b.st as keyof typeof stColor]}20`, padding:"3px 8px",
                  borderRadius:8, marginBottom:6 }}>
                  <p style={{ color:stColor[b.st as keyof typeof stColor], fontSize:10, fontWeight:700 }}>
                    {stLabel[b.st as keyof typeof stLabel]}
                  </p>
                </div>
                <p style={{ color:TXT, fontSize:13, fontWeight:700 }}>{b.amt}</p>
              </div>
            </div>
            <p style={{ color:MUT, fontSize:10 }}>{b.date}</p>
          </div>
        ))}
        <div style={{ height:16 }}/>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function AgentApp() {
  const [screen, setScreen] = useState<Screen>("login");
  const [tab,    setTab]    = useState<TabKey>("dashboard");

  const changeTab = (t: TabKey) => { setTab(t); setScreen(t); };
  const goTo      = (s: Screen) => setScreen(s);
  const goBack    = () => setScreen(tab);
  const showTabs  = screen !== "login";

  const renderScreen = () => {
    switch (screen) {
      case "login":        return <LoginScreen onLogin={() => { setTab("dashboard"); setScreen("dashboard"); }}/>;
      case "dashboard":    return <DashboardScreen goTo={goTo}/>;
      case "booking_form": return <BookingFormScreen goBack={goBack}/>;
      case "bookings":     return <BookingsScreen/>;
      case "passengers":   return <PassengersScreen/>;
      case "commission":   return <CommissionScreen/>;
      case "alerts":       return <AlertsScreen/>;
      default:             return null;
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
