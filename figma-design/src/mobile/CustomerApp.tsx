import { useState } from "react";
import {
  Home, FileText, Upload, CreditCard, User,
  ChevronLeft, ChevronRight, Bell, Camera, Send,
  Shield, Globe, Eye, EyeOff, MessageSquare,
  Lock, Plane, Check, Paperclip, Search, MapPin,
} from "lucide-react";

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

type TabKey = "home" | "applications" | "documents" | "payment" | "profile";
type Screen = TabKey | "login" | "app_detail" | "chat";

// ── Primitives ────────────────────────────────────────────────────────────────
function StatusBar() {
  return (
    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between",
      height:44, paddingLeft:24, paddingRight:20, paddingBottom:10 }}>
      <span style={{ color:TXT, fontSize:15, fontWeight:600, letterSpacing:-0.3 }}>9:41</span>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill={TXT}>
          <rect x="0" y="5" width="3" height="6" rx="0.5" opacity="0.4"/>
          <rect x="4.5" y="3" width="3" height="8" rx="0.5" opacity="0.6"/>
          <rect x="9" y="1" width="3" height="10" rx="0.5" opacity="0.8"/>
          <rect x="13.5" y="0" width="3" height="11" rx="0.5"/>
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke={TXT} strokeWidth="1.3" strokeLinecap="round">
          <path d="M7.5 8.5v2" /><path d="M5 6.8C5.8 6 6.6 5.6 7.5 5.6S9.2 6 10 6.8" opacity="0.7"/>
          <path d="M3 4.5C4.5 3 5.9 2.3 7.5 2.3S10.5 3 12 4.5" opacity="0.5"/>
          <path d="M1 2.5C3 .7 5.1 0 7.5 0S12 .7 14 2.5" opacity="0.3"/>
        </svg>
        <div style={{ display:"flex", alignItems:"center" }}>
          <div style={{ width:22, height:11, borderRadius:3, border:`1.5px solid ${TXT}`, padding:1.5 }}>
            <div style={{ width:"75%", height:"100%", background:TXT, borderRadius:1 }}/>
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
  { key:"home",         icon:(p)=><Home {...p}/>,        label:"Home"    },
  { key:"applications", icon:(p)=><FileText {...p}/>,    label:"Visa"    },
  { key:"documents",    icon:(p)=><Upload {...p}/>,      label:"Docs"    },
  { key:"payment",      icon:(p)=><CreditCard {...p}/>,  label:"Pay"     },
  { key:"profile",      icon:(p)=><User {...p}/>,        label:"Profile" },
];

function BottomTabBar({ active, onSelect }: { active: TabKey; onSelect: (k: TabKey) => void }) {
  return (
    <div style={{ height:49, background:CARD, borderTop:`1px solid ${BOR}`, display:"flex" }}>
      {TABS.map(t => {
        const Icon = t.icon;
        const on   = active === t.key;
        return (
          <button key={t.key} onClick={() => onSelect(t.key)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              gap:3, background:"none", border:"none", cursor:"pointer", color: on ? AMB : MUT }}>
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
      padding:"0 28px", paddingTop:56, overflowY:"auto" }}>
      {/* Brand */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:44 }}>
        <div style={{ width:72, height:72, borderRadius:22, background:AMB, display:"flex",
          alignItems:"center", justifyContent:"center", marginBottom:16,
          boxShadow:`0 0 0 10px ${AMB}20` }}>
          <Plane size={32} color="#0D1117"/>
        </div>
        <p style={{ color:TXT, fontSize:26, fontWeight:800, letterSpacing:-0.5, marginBottom:4 }}>TravelOS</p>
        <p style={{ color:MUT, fontSize:13 }}>Customer Portal</p>
      </div>

      {/* Card */}
      <div style={{ background:CARD, borderRadius:24, padding:24, border:`1px solid ${BOR}` }}>
        <p style={{ color:TXT, fontSize:20, fontWeight:700, marginBottom:4 }}>Welcome Back</p>
        <p style={{ color:MUT, fontSize:13, marginBottom:24 }}>Track your visa applications</p>

        <p style={{ color:MUT, fontSize:11, fontWeight:600, textTransform:"uppercase",
          letterSpacing:0.5, marginBottom:8 }}>Email</p>
        <div style={{ background:EL, borderRadius:14, padding:"13px 16px",
          border:`1px solid ${BOR}`, marginBottom:14 }}>
          <span style={{ color:TXT, fontSize:15 }}>sarah@example.com</span>
        </div>

        <p style={{ color:MUT, fontSize:11, fontWeight:600, textTransform:"uppercase",
          letterSpacing:0.5, marginBottom:8 }}>Password</p>
        <div style={{ background:EL, borderRadius:14, padding:"13px 16px", border:`1px solid ${BOR}`,
          display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <span style={{ color:TXT, fontSize:15 }}>{show ? "p@ssw0rd" : "••••••••"}</span>
          <button onClick={() => setShow(!show)}
            style={{ background:"none", border:"none", color:MUT, cursor:"pointer", display:"flex" }}>
            {show ? <EyeOff size={18}/> : <Eye size={18}/>}
          </button>
        </div>

        <button onClick={onLogin} style={{ width:"100%", height:52, borderRadius:16,
          background:AMB, border:"none", color:"#0D1117", fontSize:16, fontWeight:700, cursor:"pointer" }}>
          Sign In
        </button>
        <p style={{ color:MUT, fontSize:13, textAlign:"center", marginTop:14 }}>
          Forgot password?{" "}<span style={{ color:AMB }}>Reset</span>
        </p>
      </div>

      {/* Face ID */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginTop:32, gap:10 }}>
        <div style={{ width:52, height:52, borderRadius:16, background:EL, border:`1px solid ${BOR}`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Shield size={24} color={AMB}/>
        </div>
        <p style={{ color:MUT, fontSize:12 }}>Sign in with Face ID</p>
      </div>

      <p style={{ color:MUT, fontSize:13, textAlign:"center", marginTop:28, marginBottom:24 }}>
        New here?{" "}<span style={{ color:AMB }}>Create account →</span>
      </p>
    </div>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
function HomeScreen({ goTo }: { goTo: (s: Screen) => void }) {
  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      <div style={{ padding:"18px 20px 0" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <p style={{ color:MUT, fontSize:13, marginBottom:3 }}>Good morning,</p>
            <p style={{ color:TXT, fontSize:24, fontWeight:800, letterSpacing:-0.5 }}>Sarah 👋</p>
          </div>
          <button style={{ width:42, height:42, borderRadius:14, background:CARD, border:`1px solid ${BOR}`,
            display:"flex", alignItems:"center", justifyContent:"center", position:"relative", cursor:"pointer" }}>
            <Bell size={20} color={TXT}/>
            <div style={{ position:"absolute", top:9, right:9, width:8, height:8, borderRadius:"50%",
              background:RED, border:`2px solid ${BG}` }}/>
          </button>
        </div>

        {/* Stat pills */}
        <div style={{ display:"flex", gap:10, marginBottom:18 }}>
          {[
            { label:"Active App",    value:"1", color:GRN },
            { label:"Pending Docs",  value:"2", color:AMB },
          ].map(s => (
            <div key={s.label} style={{ flex:1, background:CARD, borderRadius:16, padding:"14px 16px", border:`1px solid ${BOR}` }}>
              <p style={{ color:MUT, fontSize:11, marginBottom:6 }}>{s.label}</p>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:s.color }}/>
                <p style={{ color:TXT, fontSize:22, fontWeight:800 }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Apply CTA */}
        <button style={{ width:"100%", borderRadius:20, padding:20, border:"none", cursor:"pointer",
          background:`linear-gradient(135deg, ${AMB} 0%, #D97706 100%)`,
          textAlign:"left", position:"relative", overflow:"hidden", marginBottom:22 }}>
          <div style={{ position:"absolute", right:-24, top:-24, width:110, height:110,
            borderRadius:"50%", background:"rgba(13,17,23,0.08)" }}/>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:"rgba(13,17,23,0.6)", fontSize:10, fontWeight:700, textTransform:"uppercase",
                letterSpacing:0.5, marginBottom:6 }}>New Application</p>
              <p style={{ color:"#0D1117", fontSize:20, fontWeight:800, letterSpacing:-0.4, marginBottom:4 }}>
                Apply for a Visa
              </p>
              <p style={{ color:"rgba(13,17,23,0.55)", fontSize:12 }}>Get started in 5 minutes</p>
            </div>
            <div style={{ width:52, height:52, borderRadius:16, background:"rgba(13,17,23,0.15)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Plane size={26} color="#0D1117"/>
            </div>
          </div>
        </button>

        {/* Recent apps */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <p style={{ color:TXT, fontSize:15, fontWeight:700 }}>My Applications</p>
          <button onClick={() => goTo("applications")} style={{ background:"none", border:"none",
            color:AMB, fontSize:13, cursor:"pointer" }}>See all →</button>
        </div>

        {/* App card */}
        <button onClick={() => goTo("app_detail")} style={{ width:"100%", background:CARD, borderRadius:18,
          padding:16, border:`1px solid ${BOR}`, marginBottom:10, cursor:"pointer", textAlign:"left" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:EL, fontSize:20,
                display:"flex", alignItems:"center", justifyContent:"center" }}>🇩🇪</div>
              <div>
                <p style={{ color:TXT, fontSize:14, fontWeight:700, marginBottom:2 }}>Schengen Visa</p>
                <p style={{ color:MUT, fontSize:11 }}>APP-2024-0445</p>
              </div>
            </div>
            <div style={{ background:`${GRN}20`, padding:"4px 10px", borderRadius:8 }}>
              <p style={{ color:GRN, fontSize:11, fontWeight:700 }}>Active</p>
            </div>
          </div>
          <div style={{ background:EL, borderRadius:4, height:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:"65%", borderRadius:4,
              background:`linear-gradient(90deg, ${AMB}, ${GRN})` }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            <p style={{ color:MUT, fontSize:11 }}>Embassy Submission</p>
            <p style={{ color:MUT, fontSize:11 }}>65%</p>
          </div>
        </button>

        <button style={{ width:"100%", background:CARD, borderRadius:18, padding:16,
          border:`1px solid ${BOR}`, marginBottom:22, cursor:"pointer", textAlign:"left" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:EL, fontSize:20,
                display:"flex", alignItems:"center", justifyContent:"center" }}>🇬🇧</div>
              <div>
                <p style={{ color:TXT, fontSize:14, fontWeight:700, marginBottom:2 }}>UK Standard Visit</p>
                <p style={{ color:MUT, fontSize:11 }}>APP-2024-0312</p>
              </div>
            </div>
            <div style={{ background:`${AMB}20`, padding:"4px 10px", borderRadius:8 }}>
              <p style={{ color:AMB, fontSize:11, fontWeight:700 }}>Docs Pending</p>
            </div>
          </div>
        </button>

        {/* Quick Actions */}
        <p style={{ color:TXT, fontSize:15, fontWeight:700, marginBottom:14 }}>Quick Actions</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, paddingBottom:20 }}>
          {[
            { label:"Track",   color:AMB, icon:<MapPin size={20} color={AMB}/>,     action:()=>goTo("applications") },
            { label:"Docs",    color:BLU, icon:<Upload size={20} color={BLU}/>,     action:()=>goTo("documents")    },
            { label:"Pay",     color:GRN, icon:<CreditCard size={20} color={GRN}/>, action:()=>goTo("payment")      },
            { label:"Support", color:MUT, icon:<MessageSquare size={20} color={MUT}/>, action:()=>goTo("chat")      },
          ].map(q => (
            <button key={q.label} onClick={q.action} style={{ background:CARD, borderRadius:16,
              padding:"14px 6px", border:`1px solid ${BOR}`, display:"flex", flexDirection:"column",
              alignItems:"center", gap:8, cursor:"pointer" }}>
              {q.icon}
              <p style={{ color:MUT, fontSize:10.5, fontWeight:600 }}>{q.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Applications ──────────────────────────────────────────────────────────────
function ApplicationsScreen({ goTo }: { goTo: (s: Screen) => void }) {
  const [filter, setFilter] = useState<"all"|"active"|"done"|"rejected">("all");
  const apps = [
    { ref:"APP-2024-0445", type:"Schengen Visa",    flag:"🇩🇪", dest:"Germany",        st:"active",   lbl:"Active",      color:GRN, pct:65 },
    { ref:"APP-2024-0312", type:"UK Standard Visit", flag:"🇬🇧", dest:"United Kingdom", st:"pending",  lbl:"Docs Pending", color:AMB, pct:35 },
    { ref:"APP-2023-1188", type:"UAE Entry Permit",  flag:"🇦🇪", dest:"UAE",             st:"done",     lbl:"Approved",    color:GRN, pct:100 },
    { ref:"APP-2023-0902", type:"USA B1/B2 Visa",    flag:"🇺🇸", dest:"United States",  st:"rejected", lbl:"Refused",     color:RED, pct:100 },
  ];
  const shown = filter==="all" ? apps
    : filter==="active" ? apps.filter(a=>a.st==="active"||a.st==="pending")
    : apps.filter(a=>a.st===filter);

  return (
    <div style={{ flex:1, overflowY:"auto", background:BG, padding:"18px 20px 0" }}>
      <p style={{ color:TXT, fontSize:22, fontWeight:800, letterSpacing:-0.5, marginBottom:16 }}>My Applications</p>
      <div style={{ display:"flex", gap:8, marginBottom:18, overflowX:"auto", paddingBottom:4 }}>
        {(["all","active","done","rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:"7px 16px", borderRadius:20,
            border:"none", cursor:"pointer", whiteSpace:"nowrap", fontSize:13,
            background: filter===f ? AMB : EL,
            color:      filter===f ? "#0D1117" : MUT,
            fontWeight: filter===f ? 700 : 400 }}>
            {{all:"All",active:"In Progress",done:"Approved",rejected:"Refused"}[f]}
          </button>
        ))}
      </div>
      {shown.map(a => (
        <button key={a.ref} onClick={() => goTo("app_detail")} style={{ width:"100%", background:CARD,
          borderRadius:18, padding:16, border:`1px solid ${BOR}`, marginBottom:12, cursor:"pointer", textAlign:"left" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: a.pct<100 ? 14 : 0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:EL, fontSize:20,
                display:"flex", alignItems:"center", justifyContent:"center" }}>{a.flag}</div>
              <div>
                <p style={{ color:MUT, fontSize:10, fontFamily:"monospace", marginBottom:4 }}>{a.ref}</p>
                <p style={{ color:TXT, fontSize:14, fontWeight:700, marginBottom:2 }}>{a.type}</p>
                <p style={{ color:MUT, fontSize:11 }}>{a.dest}</p>
              </div>
            </div>
            <div style={{ background:`${a.color}20`, padding:"4px 10px", borderRadius:8, flexShrink:0 }}>
              <p style={{ color:a.color, fontSize:11, fontWeight:700 }}>{a.lbl}</p>
            </div>
          </div>
          {a.pct < 100 && (
            <>
              <div style={{ background:EL, borderRadius:4, height:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${a.pct}%`, background:a.color, borderRadius:4 }}/>
              </div>
              <p style={{ color:MUT, fontSize:10, marginTop:6, textAlign:"right" }}>{a.pct}% complete</p>
            </>
          )}
        </button>
      ))}
      <div style={{ height:16 }}/>
    </div>
  );
}

// ── App Detail ────────────────────────────────────────────────────────────────
function AppDetailScreen({ goBack, goTo }: { goBack: () => void; goTo: (s: Screen) => void }) {
  const stages = [
    { id:"inquiry",    label:"Inquiry Received",    done:true  },
    { id:"customer",   label:"Customer Created",    done:true  },
    { id:"passport",   label:"Passport OCR",        done:true  },
    { id:"checklist",  label:"Document Checklist",  done:true  },
    { id:"upload",     label:"Documents Uploaded",  done:true  },
    { id:"ai",         label:"AI Verification",     done:true  },
    { id:"staff",      label:"Staff Review",        done:true  },
    { id:"invoice",    label:"Invoice Generated",   done:true  },
    { id:"payment",    label:"Payment Received",    done:true  },
    { id:"assign",     label:"Officer Assigned",    done:true  },
    { id:"embassy",    label:"Embassy Submission",  done:true  },
    { id:"processing", label:"Under Processing",    done:false, current:true },
    { id:"outcome",    label:"Outcome Decision",    done:false  },
    { id:"delivery",   label:"Delivery / Close",    done:false  },
  ];
  const notes: Record<number,string> = {
    0:"10 Nov · Application received", 2:"11 Nov · Passport validated",
    6:"14 Nov · Reviewed by Ahmed R.", 8:"15 Nov · AED 2,400 cleared",
    10:"16 Nov · Submitted to VFS Dubai",
  };

  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      {/* Nav header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 20px",
        borderBottom:`1px solid ${BOR}`, background:CARD }}>
        <button onClick={goBack} style={{ background:"none", border:"none", color:TXT, cursor:"pointer", display:"flex" }}>
          <ChevronLeft size={24}/>
        </button>
        <div style={{ flex:1 }}>
          <p style={{ color:TXT, fontSize:15, fontWeight:700 }}>APP-2024-0445</p>
          <p style={{ color:MUT, fontSize:11 }}>Schengen Visa · Germany</p>
        </div>
        <div style={{ background:`${GRN}20`, padding:"4px 10px", borderRadius:8 }}>
          <p style={{ color:GRN, fontSize:11, fontWeight:700 }}>Active</p>
        </div>
      </div>

      {/* Progress strip */}
      <div style={{ padding:"14px 20px", background:`${CARD}CC`, borderBottom:`1px solid ${BOR}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <p style={{ color:TXT, fontSize:13, fontWeight:600 }}>Embassy Processing</p>
          <p style={{ color:AMB, fontSize:13, fontWeight:700 }}>65%</p>
        </div>
        <div style={{ background:EL, borderRadius:6, height:6, overflow:"hidden" }}>
          <div style={{ height:"100%", width:"65%", borderRadius:6,
            background:`linear-gradient(90deg,${AMB},${GRN})` }}/>
        </div>
        <p style={{ color:MUT, fontSize:11, marginTop:8 }}>Expected decision: 25 Nov 2024</p>
      </div>

      {/* Timeline */}
      <div style={{ padding:"18px 20px" }}>
        <p style={{ color:TXT, fontSize:14, fontWeight:700, marginBottom:16 }}>Case Timeline</p>
        {stages.map((s, i) => {
          const isLast = i === stages.length - 1;
          return (
            <div key={s.id} style={{ display:"flex", gap:14 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:20, flexShrink:0 }}>
                <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0, zIndex:1,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  background: s.done ? GRN : s.current ? AMB : EL,
                  border:`2px solid ${s.done ? GRN : s.current ? AMB : BOR}` }}>
                  {s.done && <Check size={9} color="white" strokeWidth={3}/>}
                  {s.current && <div style={{ width:5, height:5, borderRadius:"50%", background:"#0D1117" }}/>}
                </div>
                {!isLast && <div style={{ width:2, flex:1, minHeight:20, marginTop:3, marginBottom:3,
                  background: s.done ? `${GRN}50` : BOR }}/>}
              </div>
              <div style={{ flex:1, paddingBottom: isLast ? 0 : 16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <p style={{ color: s.done||s.current ? TXT : MUT, fontSize:12.5,
                    fontWeight: s.done||s.current ? 600 : 400 }}>
                    {s.label}
                    {s.current && <span style={{ marginLeft:8, color:AMB, fontSize:10, fontWeight:700,
                      background:`${AMB}20`, padding:"1px 6px", borderRadius:4 }}>NOW</span>}
                  </p>
                </div>
                {notes[i] && <p style={{ color:MUT, fontSize:11, marginTop:2 }}>{notes[i]}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ padding:"0 20px 24px", display:"flex", gap:12 }}>
        <button onClick={() => goTo("documents")} style={{ flex:1, height:48, borderRadius:14,
          background:EL, border:`1px solid ${BOR}`, color:TXT, fontSize:13, fontWeight:600, cursor:"pointer" }}>
          Upload Docs
        </button>
        <button onClick={() => goTo("chat")} style={{ flex:1, height:48, borderRadius:14,
          background:AMB, border:"none", color:"#0D1117", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          Chat Support
        </button>
      </div>
    </div>
  );
}

// ── Documents ─────────────────────────────────────────────────────────────────
function DocumentsScreen() {
  const docs = [
    { name:"Passport Copy",         icon:"🛂", st:"verified" },
    { name:"Bank Statement (3 mo)", icon:"🏦", st:"uploaded" },
    { name:"Hotel Booking",         icon:"🏨", st:"pending"  },
    { name:"Flight Itinerary",      icon:"✈️",  st:"pending"  },
    { name:"Travel Insurance",      icon:"🔒", st:"rejected" },
  ];
  const cfg = { verified:{c:GRN,l:"Verified"}, uploaded:{c:BLU,l:"Uploaded"},
    pending:{c:MUT,l:"Required"}, rejected:{c:RED,l:"Rejected"} };

  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      {/* Viewfinder */}
      <div style={{ height:220, background:"#090C12", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
          justifyContent:"center", flexDirection:"column", gap:8 }}>
          <div style={{ width:270, height:160, border:`2px dashed ${AMB}80`, borderRadius:10, position:"relative" }}>
            {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map((pos,i) => (
              <div key={i} style={{ position:"absolute", width:18, height:18, ...pos,
                borderTop:pos.hasOwnProperty("top")&&pos.top===0?`3px solid ${AMB}`:"none",
                borderBottom:pos.hasOwnProperty("bottom")&&pos.bottom===0?`3px solid ${AMB}`:"none",
                borderLeft:pos.hasOwnProperty("left")&&pos.left===0?`3px solid ${AMB}`:"none",
                borderRight:pos.hasOwnProperty("right")&&pos.right===0?`3px solid ${AMB}`:"none",
              }}/>
            ))}
            <p style={{ position:"absolute", bottom:-22, left:"50%", transform:"translateX(-50%)",
              color:`${AMB}BB`, fontSize:11, whiteSpace:"nowrap" }}>Align passport within frame</p>
          </div>
        </div>
        <div style={{ position:"absolute", bottom:14, left:0, right:0,
          display:"flex", justifyContent:"center", gap:28, alignItems:"center" }}>
          <button style={{ width:42, height:42, borderRadius:13, background:"rgba(255,255,255,0.12)",
            border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <Search size={19} color="white"/>
          </button>
          <button style={{ width:64, height:64, borderRadius:"50%", background:"white",
            border:"4px solid rgba(255,255,255,0.35)", display:"flex",
            alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <Camera size={26} color="#0D1117"/>
          </button>
          <button style={{ width:42, height:42, borderRadius:13, background:"rgba(255,255,255,0.12)",
            border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <Upload size={19} color="white"/>
          </button>
        </div>
      </div>

      <div style={{ padding:"16px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <p style={{ color:TXT, fontSize:15, fontWeight:700 }}>Required Documents</p>
          <p style={{ color:MUT, fontSize:12 }}>1 of 5 verified</p>
        </div>
        {docs.map(d => {
          const c = cfg[d.st as keyof typeof cfg];
          return (
            <div key={d.name} style={{ display:"flex", alignItems:"center", gap:14, background:CARD,
              borderRadius:16, padding:"13px 16px", border:`1px solid ${BOR}`, marginBottom:10 }}>
              <span style={{ fontSize:22 }}>{d.icon}</span>
              <div style={{ flex:1 }}>
                <p style={{ color:TXT, fontSize:13, fontWeight:600, marginBottom:2 }}>{d.name}</p>
                <p style={{ color:c.c, fontSize:11, fontWeight:600 }}>{c.l}</p>
              </div>
              {(d.st==="pending"||d.st==="rejected") ? (
                <button style={{ padding:"6px 14px", borderRadius:10, background:`${AMB}20`,
                  border:"none", color:AMB, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                  Upload
                </button>
              ) : (
                <div style={{ width:28, height:28, borderRadius:"50%", background:`${c.c}20`,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Check size={13} color={c.c} strokeWidth={2.5}/>
                </div>
              )}
            </div>
          );
        })}
        <div style={{ height:16 }}/>
      </div>
    </div>
  );
}

// ── Payment ───────────────────────────────────────────────────────────────────
function PaymentScreen() {
  const history = [
    { desc:"Schengen Visa Fee (3 pax)", ref:"PAY-0445-01", amt:"AED 2,400", date:"15 Nov", paid:true  },
    { desc:"UK Visa Service Fee",        ref:"PAY-0312-01", amt:"AED 850",   date:"08 Oct", paid:true  },
    { desc:"UK Priority Processing",     ref:"PAY-0312-02", amt:"AED 350",   date:"08 Oct", paid:true  },
    { desc:"Embassy Stamping Fee",       ref:"PAY-0445-02", amt:"AED 400",   date:"—",      paid:false },
  ];
  return (
    <div style={{ flex:1, overflowY:"auto", background:BG, padding:"18px 20px 0" }}>
      <p style={{ color:TXT, fontSize:22, fontWeight:800, letterSpacing:-0.5, marginBottom:18 }}>Payments</p>

      {/* Outstanding */}
      <div style={{ borderRadius:22, padding:22, marginBottom:20,
        background:"linear-gradient(135deg,#1B180A,#271F00)", border:`1px solid ${AMB}25` }}>
        <p style={{ color:MUT, fontSize:12, marginBottom:8 }}>Outstanding Balance</p>
        <p style={{ color:AMB, fontSize:34, fontWeight:800, letterSpacing:-1, marginBottom:4 }}>AED 400</p>
        <p style={{ color:MUT, fontSize:12, marginBottom:20 }}>Embassy Stamping Fee · APP-2024-0445</p>
        <button style={{ width:"100%", height:48, borderRadius:14, background:AMB, border:"none",
          color:"#0D1117", fontSize:15, fontWeight:700, cursor:"pointer" }}>
          Pay Now
        </button>
      </div>

      <p style={{ color:TXT, fontSize:15, fontWeight:700, marginBottom:14 }}>Payment History</p>
      {history.map(p => (
        <div key={p.ref} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          background:CARD, borderRadius:16, padding:"14px 16px", border:`1px solid ${BOR}`, marginBottom:10 }}>
          <div>
            <p style={{ color:TXT, fontSize:13, fontWeight:600, marginBottom:3 }}>{p.desc}</p>
            <p style={{ color:MUT, fontSize:11 }}>{p.ref} · {p.date}</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ color: p.paid ? GRN : AMB, fontSize:14, fontWeight:700 }}>{p.amt}</p>
            <p style={{ color: p.paid ? GRN : AMB, fontSize:10, fontWeight:600 }}>{p.paid?"Paid":"Pending"}</p>
          </div>
        </div>
      ))}
      <div style={{ height:16 }}/>
    </div>
  );
}

// ── Chat ──────────────────────────────────────────────────────────────────────
function ChatScreen() {
  const msgs = [
    { me:false, text:"Hello Sarah! How can I help you today?", t:"10:22" },
    { me:true,  text:"I wanted to check on my Schengen application status.", t:"10:23" },
    { me:false, text:"APP-2024-0445 is at embassy processing stage. Expected decision by 25 Nov 2024.", t:"10:24" },
    { me:true,  text:"Do I need to upload anything else?", t:"10:25" },
    { me:false, text:"Your travel insurance is still pending. Please upload at your earliest to avoid delays.", t:"10:26" },
  ];
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:BG, minHeight:0 }}>
      {/* Chat header */}
      <div style={{ padding:"12px 20px", background:CARD, borderBottom:`1px solid ${BOR}`,
        display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:`${BLU}25`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Shield size={18} color={BLU}/>
        </div>
        <div>
          <p style={{ color:TXT, fontSize:14, fontWeight:700 }}>TravelOS Support</p>
          <p style={{ color:GRN, fontSize:11 }}>● Online · replies in ~5 min</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 20px", display:"flex",
        flexDirection:"column", gap:10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent: m.me?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"82%", padding:"10px 14px",
              borderRadius: m.me?"18px 18px 4px 18px":"18px 18px 18px 4px",
              background: m.me ? AMB : CARD,
              border: m.me ? "none" : `1px solid ${BOR}` }}>
              <p style={{ color: m.me ? "#0D1117" : TXT, fontSize:13, lineHeight:1.45 }}>{m.text}</p>
              <p style={{ color: m.me ? "rgba(13,17,23,0.5)" : MUT, fontSize:10, marginTop:4, textAlign:"right" }}>{m.t}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding:"10px 20px", background:CARD, borderTop:`1px solid ${BOR}`,
        display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
        <button style={{ width:36, height:36, borderRadius:11, background:EL, border:`1px solid ${BOR}`,
          display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <Paperclip size={17} color={MUT}/>
        </button>
        <div style={{ flex:1, background:EL, borderRadius:20, height:38, padding:"0 14px",
          display:"flex", alignItems:"center", border:`1px solid ${BOR}` }}>
          <span style={{ color:MUT, fontSize:13.5 }}>Type a message…</span>
        </div>
        <button style={{ width:36, height:36, borderRadius:11, background:AMB, border:"none",
          display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <Send size={16} color="#0D1117"/>
        </button>
      </div>
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const items = [
    { label:"Personal Information", icon:<User size={17} color={MUT}/> },
    { label:"Passport Details",     icon:<Globe size={17} color={MUT}/> },
    { label:"Notifications",        icon:<Bell size={17} color={MUT}/> },
    { label:"Privacy & Security",   icon:<Lock size={17} color={MUT}/> },
    { label:"Payment Methods",      icon:<CreditCard size={17} color={MUT}/> },
    { label:"Help & Support",       icon:<MessageSquare size={17} color={MUT}/> },
  ];
  return (
    <div style={{ flex:1, overflowY:"auto", background:BG, padding:"20px 20px 0" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:24 }}>
        <div style={{ width:80, height:80, borderRadius:"50%",
          background:`linear-gradient(135deg,${AMB},#D97706)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          marginBottom:12, boxShadow:`0 0 0 4px ${AMB}30` }}>
          <p style={{ color:"#0D1117", fontSize:30, fontWeight:800 }}>S</p>
        </div>
        <p style={{ color:TXT, fontSize:18, fontWeight:700, marginBottom:3 }}>Sarah Al-Mansoori</p>
        <p style={{ color:MUT, fontSize:13, marginBottom:10 }}>sarah@example.com</p>
        <div style={{ background:`${GRN}20`, padding:"4px 14px", borderRadius:20 }}>
          <p style={{ color:GRN, fontSize:12, fontWeight:600 }}>✓ Verified Customer</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:8, marginBottom:22 }}>
        {[{l:"Total Apps",v:"4"},{l:"Approved",v:"2"},{l:"Spent",v:"AED 8.2K"}].map(s => (
          <div key={s.l} style={{ flex:1, background:CARD, borderRadius:14, padding:"12px 8px",
            border:`1px solid ${BOR}`, textAlign:"center" }}>
            <p style={{ color:TXT, fontSize:18, fontWeight:800, marginBottom:2 }}>{s.v}</p>
            <p style={{ color:MUT, fontSize:10 }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div style={{ background:CARD, borderRadius:18, border:`1px solid ${BOR}`, overflow:"hidden", marginBottom:14 }}>
        {items.map((item, i) => (
          <div key={item.label} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
            borderBottom: i<items.length-1 ? `1px solid ${BOR}` : "none", cursor:"pointer" }}>
            <div style={{ width:34, height:34, borderRadius:10, background:EL,
              display:"flex", alignItems:"center", justifyContent:"center" }}>{item.icon}</div>
            <p style={{ flex:1, color:TXT, fontSize:13.5 }}>{item.label}</p>
            <ChevronRight size={15} color={MUT}/>
          </div>
        ))}
      </div>

      <button onClick={onLogout} style={{ width:"100%", height:46, borderRadius:14,
        background:`${RED}15`, border:`1px solid ${RED}30`,
        color:RED, fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:24 }}>
        Sign Out
      </button>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function CustomerApp() {
  const [screen, setScreen] = useState<Screen>("login");
  const [tab,    setTab]    = useState<TabKey>("home");

  const changeTab = (t: TabKey) => { setTab(t); setScreen(t); };
  const goTo      = (s: Screen) => setScreen(s);
  const goBack    = () => setScreen(tab);
  const showTabs  = screen !== "login";

  const renderScreen = () => {
    switch (screen) {
      case "login":        return <LoginScreen onLogin={() => { setTab("home"); setScreen("home"); }}/>;
      case "home":         return <HomeScreen goTo={goTo}/>;
      case "applications": return <ApplicationsScreen goTo={goTo}/>;
      case "app_detail":   return <AppDetailScreen goBack={goBack} goTo={goTo}/>;
      case "documents":    return <DocumentsScreen/>;
      case "payment":      return <PaymentScreen/>;
      case "chat":         return <ChatScreen/>;
      case "profile":      return <ProfileScreen onLogout={() => setScreen("login")}/>;
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
