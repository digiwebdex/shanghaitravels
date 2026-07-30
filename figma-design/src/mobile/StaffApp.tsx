import { useState } from "react";
import {
  ClipboardList, FileText, Zap, MessageSquare, User,
  ChevronLeft, ChevronRight, AlertTriangle, Clock,
  Plus, Search, Check, X, Send, Upload, Users,
  Shield, Eye, EyeOff, UserCheck, FileCheck,
  AlertCircle, CheckCircle2,
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
const SKY  = "#0EA5E9";

type TabKey = "tasks" | "cases" | "actions" | "chat" | "profile";
type Screen = TabKey | "login" | "case_detail";

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
            <div style={{ width:"60%", height:"100%", background:TXT, borderRadius:1 }}/>
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
  { key:"tasks",   icon:(p)=><ClipboardList {...p}/>, label:"Tasks"   },
  { key:"cases",   icon:(p)=><FileText {...p}/>,      label:"Cases"   },
  { key:"actions", icon:(p)=><Zap {...p}/>,           label:"Actions" },
  { key:"chat",    icon:(p)=><MessageSquare {...p}/>,  label:"Chat"    },
  { key:"profile", icon:(p)=><User {...p}/>,           label:"Profile" },
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
              color: on ? SKY : MUT }}>
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
        <div style={{ width:72, height:72, borderRadius:22, background:"#0A1826",
          border:`2px solid ${SKY}40`, display:"flex", alignItems:"center",
          justifyContent:"center", marginBottom:16 }}>
          <Shield size={30} color={SKY}/>
        </div>
        <p style={{ color:TXT, fontSize:26, fontWeight:800, letterSpacing:-0.5, marginBottom:4 }}>TravelOS</p>
        <p style={{ color:MUT, fontSize:13 }}>Staff Portal</p>
      </div>

      <div style={{ background:CARD, borderRadius:24, padding:24, border:`1px solid ${BOR}` }}>
        <p style={{ color:TXT, fontSize:20, fontWeight:700, marginBottom:4 }}>Staff Login</p>
        <p style={{ color:MUT, fontSize:13, marginBottom:24 }}>Access your assigned cases &amp; tasks</p>

        <p style={{ color:MUT, fontSize:11, fontWeight:600, textTransform:"uppercase",
          letterSpacing:0.5, marginBottom:8 }}>Staff ID</p>
        <div style={{ background:EL, borderRadius:14, padding:"13px 16px",
          border:`1px solid ${BOR}`, marginBottom:14 }}>
          <span style={{ color:TXT, fontSize:15 }}>ahmed.rahman@travelosco.ae</span>
        </div>

        <p style={{ color:MUT, fontSize:11, fontWeight:600, textTransform:"uppercase",
          letterSpacing:0.5, marginBottom:8 }}>Password</p>
        <div style={{ background:EL, borderRadius:14, padding:"13px 16px", border:`1px solid ${BOR}`,
          display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <span style={{ color:TXT, fontSize:15 }}>{show?"staff2024!":"••••••••••"}</span>
          <button onClick={()=>setShow(!show)} style={{ background:"none", border:"none",
            color:MUT, cursor:"pointer", display:"flex" }}>
            {show?<EyeOff size={18}/>:<Eye size={18}/>}
          </button>
        </div>

        <button onClick={onLogin} style={{ width:"100%", height:52, borderRadius:16,
          background:SKY, border:"none", color:"white", fontSize:16, fontWeight:700, cursor:"pointer" }}>
          Sign In
        </button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginTop:32, gap:10 }}>
        <div style={{ width:52, height:52, borderRadius:16, background:EL, border:`1px solid ${BOR}`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Shield size={24} color={SKY}/>
        </div>
        <p style={{ color:MUT, fontSize:12 }}>Sign in with Face ID</p>
      </div>
      <div style={{ height:24 }}/>
    </div>
  );
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
function TasksScreen({ goTo }: { goTo: (s: Screen) => void }) {
  const tasks = [
    { ref:"APP-7705", pax:"Mohammed Al-Ali",   dest:"🇩🇪 Germany",   type:"Schengen",  sla:"OVERDUE 6h",   slaColor:RED, priority:"urgent", action:"Embassy Submission" },
    { ref:"APP-7701", pax:"Priya Sharma",      dest:"🇬🇧 UK",        type:"Standard",  sla:"Due in 2h",    slaColor:AMB, priority:"high",   action:"Staff Review"        },
    { ref:"APP-7698", pax:"Chen Wei",          dest:"🇸🇬 Singapore", type:"Tourist",   sla:"Due in 5h",    slaColor:AMB, priority:"high",   action:"Document Check"      },
    { ref:"APP-7692", pax:"Fatima Al-Rashidi", dest:"🇫🇷 France",    type:"Schengen",  sla:"Due tomorrow", slaColor:GRN, priority:"medium", action:"AI Verification"     },
    { ref:"APP-7688", pax:"John Smith",        dest:"🇺🇸 USA",       type:"B1/B2",     sla:"Due in 2 days",slaColor:GRN, priority:"low",    action:"Passport OCR"        },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      <div style={{ padding:"18px 20px 0" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <p style={{ color:MUT, fontSize:13 }}>Ahmed Rahman · Visa Officer</p>
            <p style={{ color:TXT, fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>My Tasks</p>
          </div>
          <div style={{ background:`${RED}20`, padding:"6px 12px", borderRadius:12,
            border:`1px solid ${RED}30`, display:"flex", alignItems:"center", gap:6 }}>
            <AlertTriangle size={14} color={RED}/>
            <p style={{ color:RED, fontSize:12, fontWeight:700 }}>2 Overdue</p>
          </div>
        </div>

        {/* SLA summary */}
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {[
            { l:"Overdue", v:"2", c:RED  },
            { l:"Due Soon", v:"2", c:AMB  },
            { l:"On Track", v:"8", c:GRN  },
          ].map(s => (
            <div key={s.l} style={{ flex:1, background:CARD, borderRadius:14, padding:"11px 10px",
              border:`1px solid ${s.c}25`, textAlign:"center" }}>
              <p style={{ color:s.c, fontSize:20, fontWeight:800, marginBottom:2 }}>{s.v}</p>
              <p style={{ color:MUT, fontSize:9.5 }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* Task cards */}
        {tasks.map(t => (
          <button key={t.ref} onClick={() => goTo("case_detail")} style={{ width:"100%", background:CARD,
            borderRadius:18, padding:16, border:`1px solid ${t.slaColor}25`,
            marginBottom:12, cursor:"pointer", textAlign:"left" }}>
            {/* Top row */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <p style={{ color:MUT, fontSize:10, fontFamily:"monospace", marginBottom:4 }}>{t.ref}</p>
                <p style={{ color:TXT, fontSize:14, fontWeight:700, marginBottom:1 }}>{t.pax}</p>
                <p style={{ color:MUT, fontSize:11 }}>{t.dest} · {t.type}</p>
              </div>
              <div style={{ background:`${t.slaColor}20`, padding:"4px 10px", borderRadius:8,
                border:`1px solid ${t.slaColor}30`, display:"flex", alignItems:"center", gap:5 }}>
                <Clock size={11} color={t.slaColor}/>
                <p style={{ color:t.slaColor, fontSize:11, fontWeight:700 }}>{t.sla}</p>
              </div>
            </div>
            {/* Action label + quick buttons */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
              background:EL, borderRadius:12, padding:"9px 14px" }}>
              <p style={{ color:SKY, fontSize:12, fontWeight:600 }}>→ {t.action}</p>
              <div style={{ display:"flex", gap:8 }}>
                <button style={{ padding:"5px 12px", borderRadius:8, background:`${GRN}20`,
                  border:"none", color:GRN, fontSize:12, fontWeight:700, cursor:"pointer" }}
                  onClick={e => e.stopPropagation()}>Done</button>
                <button style={{ padding:"5px 12px", borderRadius:8, background:`${SKY}15`,
                  border:"none", color:SKY, fontSize:12, fontWeight:700, cursor:"pointer" }}
                  onClick={e => e.stopPropagation()}>Open</button>
              </div>
            </div>
          </button>
        ))}
        <div style={{ height:16 }}/>
      </div>
    </div>
  );
}

// ── Case Detail ───────────────────────────────────────────────────────────────
function CaseDetailScreen({ goBack }: { goBack: () => void }) {
  const stages = [
    { label:"Inquiry Received",   done:true,  note:"10 Nov · Via web form" },
    { label:"Customer Created",   done:true,  note:"10 Nov · Profile activated" },
    { label:"Passport OCR",       done:true,  note:"11 Nov · Validated OK" },
    { label:"Document Checklist", done:true,  note:"11 Nov · 5 docs required" },
    { label:"Documents Uploaded", done:true,  note:"12 Nov · 3 of 5 received" },
    { label:"AI Verification",    done:true,  note:"13 Nov · Auto-pass 4/5" },
    { label:"Staff Review",       done:true,  note:"14 Nov · Reviewed by you" },
    { label:"Invoice Generated",  done:true,  note:"14 Nov · AED 2,400" },
    { label:"Payment Received",   done:true,  note:"15 Nov · Cleared" },
    { label:"Officer Assigned",   done:true,  note:"15 Nov · Ahmed R." },
    { label:"Embassy Submission", done:false, current:true },
    { label:"Processing",         done:false },
    { label:"Outcome",            done:false },
    { label:"Delivery",           done:false },
  ];
  const docs = [
    { name:"Passport",         st:"verified"  },
    { name:"Bank Statement",   st:"verified"  },
    { name:"Hotel Booking",    st:"pending"   },
    { name:"Flight Itinerary", st:"pending"   },
    { name:"Travel Insurance", st:"rejected"  },
  ];
  const stCfg = { verified:{c:GRN,l:"Verified"}, pending:{c:AMB,l:"Pending"}, rejected:{c:RED,l:"Rejected"} };

  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 20px",
        background:CARD, borderBottom:`1px solid ${BOR}` }}>
        <button onClick={goBack} style={{ background:"none", border:"none",
          color:TXT, cursor:"pointer", display:"flex" }}>
          <ChevronLeft size={24}/>
        </button>
        <div style={{ flex:1 }}>
          <p style={{ color:TXT, fontSize:15, fontWeight:700 }}>APP-7705</p>
          <p style={{ color:MUT, fontSize:11 }}>Mohammed Al-Ali · Schengen</p>
        </div>
        <div style={{ background:`${RED}20`, padding:"4px 10px", borderRadius:8 }}>
          <p style={{ color:RED, fontSize:11, fontWeight:700 }}>SLA BREACH</p>
        </div>
      </div>

      {/* Applicant info strip */}
      <div style={{ padding:"14px 20px", background:`${CARD}CC`, borderBottom:`1px solid ${BOR}`,
        display:"flex", gap:16 }}>
        {[
          { l:"Passport",   v:"A12345678" },
          { l:"Nationality",v:"UAE"       },
          { l:"Travel",     v:"15 Jan 25" },
        ].map(f => (
          <div key={f.l} style={{ flex:1 }}>
            <p style={{ color:MUT, fontSize:9, textTransform:"uppercase", marginBottom:3 }}>{f.l}</p>
            <p style={{ color:TXT, fontSize:12, fontWeight:600 }}>{f.v}</p>
          </div>
        ))}
      </div>

      <div style={{ padding:"18px 20px" }}>
        {/* Compact timeline */}
        <p style={{ color:TXT, fontSize:14, fontWeight:700, marginBottom:14 }}>Workflow Timeline</p>
        {stages.map((s, i) => {
          const isLast = i === stages.length - 1;
          return (
            <div key={i} style={{ display:"flex", gap:12 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:18, flexShrink:0 }}>
                <div style={{ width:18, height:18, borderRadius:"50%", flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  background: s.done ? GRN : s.current ? SKY : EL,
                  border:`2px solid ${s.done ? GRN : s.current ? SKY : BOR}` }}>
                  {s.done && <Check size={9} color="white" strokeWidth={3}/>}
                  {s.current && <div style={{ width:5, height:5, borderRadius:"50%", background:"white" }}/>}
                </div>
                {!isLast && <div style={{ width:2, flex:1, minHeight:16, margin:"2px 0",
                  background: s.done ? `${GRN}40` : BOR }}/>}
              </div>
              <div style={{ flex:1, paddingBottom: isLast ? 0 : s.note ? 14 : 10 }}>
                <p style={{ color: s.done||s.current ? TXT : MUT, fontSize:12.5,
                  fontWeight: s.current ? 700 : s.done ? 500 : 400 }}>
                  {s.label}
                  {s.current && <span style={{ marginLeft:8, color:SKY, fontSize:10,
                    background:`${SKY}20`, padding:"1px 6px", borderRadius:4, fontWeight:700 }}>NOW</span>}
                </p>
                {s.note && <p style={{ color:MUT, fontSize:10.5, marginTop:2 }}>{s.note}</p>}
              </div>
            </div>
          );
        })}

        {/* Documents */}
        <p style={{ color:TXT, fontSize:14, fontWeight:700, marginBottom:14, marginTop:20 }}>Documents</p>
        {docs.map(d => {
          const cfg = stCfg[d.st as keyof typeof stCfg];
          return (
            <div key={d.name} style={{ display:"flex", alignItems:"center", gap:12, background:CARD,
              borderRadius:14, padding:"11px 14px", border:`1px solid ${BOR}`, marginBottom:8 }}>
              <FileCheck size={17} color={cfg.c}/>
              <p style={{ flex:1, color:TXT, fontSize:13 }}>{d.name}</p>
              <div style={{ background:`${cfg.c}20`, padding:"3px 8px", borderRadius:6 }}>
                <p style={{ color:cfg.c, fontSize:10, fontWeight:700 }}>{cfg.l}</p>
              </div>
            </div>
          );
        })}

        {/* Actions */}
        <div style={{ display:"flex", gap:10, marginTop:18, marginBottom:24 }}>
          <button style={{ flex:1, height:46, borderRadius:14, background:`${GRN}20`,
            border:`1px solid ${GRN}30`, color:GRN, fontSize:13, fontWeight:700, cursor:"pointer" }}>
            ✓ Approve
          </button>
          <button style={{ flex:1, height:46, borderRadius:14, background:`${RED}15`,
            border:`1px solid ${RED}25`, color:RED, fontSize:13, fontWeight:700, cursor:"pointer" }}>
            ✗ Reject
          </button>
          <button style={{ flex:1, height:46, borderRadius:14, background:`${SKY}15`,
            border:`1px solid ${SKY}25`, color:SKY, fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
function QuickActionsScreen() {
  const actions = [
    { label:"Approve Application",    icon:<CheckCircle2 size={28} color={GRN}/>,  bg:`${GRN}15`,   border:`${GRN}25`  },
    { label:"Assign to Officer",      icon:<UserCheck size={28} color={SKY}/>,    bg:`${SKY}15`,   border:`${SKY}25`  },
    { label:"Request Documents",      icon:<Upload size={28} color={AMB}/>,       bg:`${AMB}15`,   border:`${AMB}25`  },
    { label:"Add Internal Note",      icon:<FileText size={28} color={MUT}/>,     bg:`${MUT}15`,   border:`${MUT}25`  },
    { label:"Escalate to Manager",    icon:<AlertCircle size={28} color={RED}/>,  bg:`${RED}12`,   border:`${RED}22`  },
    { label:"Mark SLA Acknowledged",  icon:<Clock size={28} color="#A855F7"/>,   bg:"#A855F715",  border:"#A855F725" },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", background:BG }}>
      <div style={{ padding:"18px 20px 0" }}>
        <p style={{ color:TXT, fontSize:22, fontWeight:800, letterSpacing:-0.5, marginBottom:6 }}>Quick Actions</p>
        <p style={{ color:MUT, fontSize:13, marginBottom:22 }}>One-tap actions for any case</p>

        {/* Recent case context */}
        <div style={{ background:CARD, borderRadius:16, padding:"14px 16px",
          border:`1px solid ${SKY}25`, marginBottom:22 }}>
          <p style={{ color:MUT, fontSize:11, marginBottom:6 }}>Acting on last viewed case</p>
          <p style={{ color:TXT, fontSize:14, fontWeight:700 }}>APP-7705 · Mohammed Al-Ali</p>
          <p style={{ color:SKY, fontSize:12 }}>Schengen Visa · Embassy Submission</p>
        </div>

        {/* Action grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:24 }}>
          {actions.map(a => (
            <button key={a.label} style={{ background:CARD, borderRadius:18, padding:"20px 16px",
              border:`1px solid ${a.border}`, cursor:"pointer", textAlign:"center",
              display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
              <div style={{ width:56, height:56, borderRadius:18, background:a.bg,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {a.icon}
              </div>
              <p style={{ color:TXT, fontSize:12.5, fontWeight:600, lineHeight:1.35 }}>{a.label}</p>
            </button>
          ))}
        </div>

        {/* Search a case */}
        <div style={{ background:CARD, borderRadius:16, padding:"0 16px", border:`1px solid ${BOR}`,
          display:"flex", alignItems:"center", gap:10, marginBottom:24, height:48 }}>
          <Search size={17} color={MUT}/>
          <span style={{ color:MUT, fontSize:14 }}>Search case by ref or name…</span>
        </div>
      </div>
    </div>
  );
}

// ── Chat ──────────────────────────────────────────────────────────────────────
function ChatScreen() {
  const threads = [
    { name:"Manager — Ali Hassan",  last:"Please escalate APP-7705 ASAP", t:"2m ago", unread:3, online:true  },
    { name:"Finance — Hana M.",     last:"Invoice PAY-0445 confirmed",     t:"18m ago",unread:0, online:true  },
    { name:"#visa-team",            last:"Anyone handle Singapore tourist?",t:"1h ago", unread:5, online:false },
    { name:"IT Support",            last:"Passport OCR module updated",     t:"3h ago", unread:0, online:false },
    { name:"HR — Zeina K.",         last:"Leave approved for 23-25 Jan",    t:"Yesterday",unread:0,online:false },
  ];
  const msgs = [
    { me:false, name:"Ali Hassan", text:"Ahmed, please escalate APP-7705. SLA is already breached.", t:"9:38" },
    { me:true,  name:"Me",        text:"On it now. Will submit to embassy within 30 min.", t:"9:39"          },
    { me:false, name:"Ali Hassan", text:"Also cc the applicant with the delay notification.", t:"9:40"       },
    { me:true,  name:"Me",        text:"Done — notification sent to Mohammed Al-Ali.", t:"9:41"              },
  ];
  const [view, setView] = useState<"list"|"thread">("list");

  if (view === "list") {
    return (
      <div style={{ flex:1, overflowY:"auto", background:BG }}>
        <div style={{ padding:"18px 20px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <p style={{ color:TXT, fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>Team Chat</p>
            <button style={{ width:38, height:38, borderRadius:12, background:SKY, border:"none",
              display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <Plus size={20} color="white"/>
            </button>
          </div>
          <div style={{ background:CARD, borderRadius:16, padding:"0 16px", border:`1px solid ${BOR}`,
            display:"flex", alignItems:"center", gap:10, marginBottom:18, height:44 }}>
            <Search size={17} color={MUT}/>
            <span style={{ color:MUT, fontSize:14 }}>Search conversations…</span>
          </div>
          {threads.map((t, i) => (
            <button key={i} onClick={() => setView("thread")} style={{ width:"100%", display:"flex",
              alignItems:"center", gap:14, padding:"14px 0",
              borderBottom: i<threads.length-1 ? `1px solid ${BOR}` : "none",
              background:"none", border:"none", borderBottom:`1px solid ${BOR}`,
              cursor:"pointer" }}>
              <div style={{ position:"relative", flexShrink:0 }}>
                <div style={{ width:44, height:44, borderRadius:"50%",
                  background:`linear-gradient(135deg,${SKY}40,#3B82F630)`,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <p style={{ color:TXT, fontSize:16, fontWeight:700 }}>{t.name[0]}</p>
                </div>
                {t.online && <div style={{ position:"absolute", bottom:1, right:1, width:10, height:10,
                  borderRadius:"50%", background:GRN, border:`2px solid ${BG}` }}/>}
              </div>
              <div style={{ flex:1, textAlign:"left", minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                  <p style={{ color:TXT, fontSize:13.5, fontWeight:t.unread>0?700:500 }}>{t.name}</p>
                  <p style={{ color:MUT, fontSize:10 }}>{t.t}</p>
                </div>
                <p style={{ color:MUT, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {t.last}
                </p>
              </div>
              {t.unread > 0 && (
                <div style={{ width:20, height:20, borderRadius:"50%", background:SKY,
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <p style={{ color:"white", fontSize:11, fontWeight:700 }}>{t.unread}</p>
                </div>
              )}
            </button>
          ))}
          <div style={{ height:16 }}/>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:BG, minHeight:0 }}>
      <div style={{ padding:"12px 20px", background:CARD, borderBottom:`1px solid ${BOR}`,
        display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <button onClick={() => setView("list")} style={{ background:"none", border:"none",
          color:TXT, cursor:"pointer", display:"flex" }}>
          <ChevronLeft size={24}/>
        </button>
        <div style={{ width:36, height:36, borderRadius:"50%", background:`${SKY}25`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <p style={{ color:TXT, fontSize:13, fontWeight:700 }}>A</p>
        </div>
        <div>
          <p style={{ color:TXT, fontSize:14, fontWeight:700 }}>Manager — Ali Hassan</p>
          <p style={{ color:GRN, fontSize:11 }}>● Online</p>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"14px 20px", display:"flex",
        flexDirection:"column", gap:10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent:m.me?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"82%", padding:"10px 14px",
              borderRadius: m.me?"18px 18px 4px 18px":"18px 18px 18px 4px",
              background: m.me ? SKY : CARD,
              border: m.me ? "none" : `1px solid ${BOR}` }}>
              <p style={{ color: m.me ? "white" : TXT, fontSize:13, lineHeight:1.45 }}>{m.text}</p>
              <p style={{ color: m.me ? "rgba(255,255,255,0.55)" : MUT, fontSize:10, marginTop:4, textAlign:"right" }}>{m.t}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:"10px 20px", background:CARD, borderTop:`1px solid ${BOR}`,
        display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
        <div style={{ flex:1, background:EL, borderRadius:20, height:38, padding:"0 14px",
          display:"flex", alignItems:"center", border:`1px solid ${BOR}` }}>
          <span style={{ color:MUT, fontSize:13.5 }}>Type a message…</span>
        </div>
        <button style={{ width:36, height:36, borderRadius:11, background:SKY, border:"none",
          display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <Send size={16} color="white"/>
        </button>
      </div>
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div style={{ flex:1, overflowY:"auto", background:BG, padding:"20px 20px 0" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:24 }}>
        <div style={{ width:80, height:80, borderRadius:"50%",
          background:`linear-gradient(135deg,${SKY},#3B82F6)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          marginBottom:12, boxShadow:`0 0 0 4px ${SKY}30` }}>
          <p style={{ color:"white", fontSize:30, fontWeight:800 }}>A</p>
        </div>
        <p style={{ color:TXT, fontSize:18, fontWeight:700, marginBottom:3 }}>Ahmed Rahman</p>
        <p style={{ color:MUT, fontSize:13, marginBottom:8 }}>Visa Officer</p>
        <div style={{ background:`${SKY}20`, padding:"4px 14px", borderRadius:20 }}>
          <p style={{ color:SKY, fontSize:12, fontWeight:600 }}>Dubai HQ · Level 2</p>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:22 }}>
        {[{l:"Cases Today",v:"12"},{l:"Completed",v:"8"},{l:"SLA Rate",v:"94%"}].map(s => (
          <div key={s.l} style={{ flex:1, background:CARD, borderRadius:14, padding:"12px 8px",
            border:`1px solid ${BOR}`, textAlign:"center" }}>
            <p style={{ color:TXT, fontSize:18, fontWeight:800, marginBottom:2 }}>{s.v}</p>
            <p style={{ color:MUT, fontSize:9.5 }}>{s.l}</p>
          </div>
        ))}
      </div>

      {[["Notification Preferences",""],["Shift Schedule",""],["My Performance",""],["Help & FAQs",""]].map(([l], i, arr) => (
        <div key={l} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
          background:CARD,
          borderRadius: i===0?"14px 14px 0 0" : i===arr.length-1?"0 0 14px 14px":"0",
          borderBottom: i<arr.length-1?`1px solid ${BOR}`:"none",
          border:`1px solid ${BOR}`,
          marginTop: i===0 ? 0 : -1, cursor:"pointer" }}>
          <p style={{ flex:1, color:TXT, fontSize:13.5 }}>{l}</p>
          <ChevronRight size={15} color={MUT}/>
        </div>
      ))}

      <button onClick={onLogout} style={{ width:"100%", height:46, borderRadius:14,
        background:`${RED}15`, border:`1px solid ${RED}25`,
        color:RED, fontSize:14, fontWeight:700, cursor:"pointer", marginTop:14, marginBottom:24 }}>
        Sign Out
      </button>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function StaffApp() {
  const [screen, setScreen] = useState<Screen>("login");
  const [tab,    setTab]    = useState<TabKey>("tasks");

  const changeTab = (t: TabKey) => { setTab(t); setScreen(t); };
  const goTo      = (s: Screen) => setScreen(s);
  const goBack    = () => setScreen(tab);
  const showTabs  = screen !== "login";

  const renderScreen = () => {
    switch (screen) {
      case "login":       return <LoginScreen onLogin={() => { setTab("tasks"); setScreen("tasks"); }}/>;
      case "tasks":       return <TasksScreen goTo={goTo}/>;
      case "case_detail": return <CaseDetailScreen goBack={goBack}/>;
      case "cases":       return <TasksScreen goTo={goTo}/>;
      case "actions":     return <QuickActionsScreen/>;
      case "chat":        return <ChatScreen/>;
      case "profile":     return <ProfileScreen onLogout={() => setScreen("login")}/>;
      default:            return null;
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
