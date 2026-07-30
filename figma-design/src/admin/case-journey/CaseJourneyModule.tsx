import { useState } from "react";
import { useNavigate } from "react-router";
import { GitBranch, Layers, Info, ExternalLink, RotateCcw } from "lucide-react";
import { CaseTimeline, CANONICAL_STAGES } from "../shared/CaseTimeline";

// ─────────────────────────────────────────────────────────────────────────────
// SVG Diagram — coordinate system
// Canvas: 2960 × 420
// Main flow row:  Y = 155
// Branch row:     Y = 330
// ─────────────────────────────────────────────────────────────────────────────
const CW = 2960;
const CH = 420;
const YM = 155;  // main row center-y
const YB = 330;  // branch row center-y
const RHW = 59;  // rect half-width  (node w = 118)
const RHH = 23;  // rect half-height (node h = 46)
const DHW = 48;  // decision diamond half-width
const DHH = 36;  // decision diamond half-height

// ── Node data ─────────────────────────────────────────────────────────────────
interface DNode {
  id:       string;
  cx:       number;
  cy:       number;
  type:     "terminal" | "process" | "decision" | "branch";
  lines:    string[];
  route?:   string;
  color:    string;
  step?:    number;   // numbered step badge (process/terminal only)
  optional?: boolean;
}

const NODES: DNode[] = [
  // ── main flow ──────────────────────────────────────────────────────────────
  { id:"inquiry",      cx:90,   cy:YM, type:"terminal", lines:["Inquiry","Lead"],           route:"/admin/crm",        color:"#06B6D4", step:1  },
  { id:"customer",     cx:255,  cy:YM, type:"process",  lines:["Customer","Created"],        route:"/admin/customers",  color:"#3B82F6", step:2  },
  { id:"passport",     cx:420,  cy:YM, type:"process",  lines:["Passport","OCR"],            route:"/admin/passports",  color:"#6366F1", step:3  },
  { id:"checklist",    cx:590,  cy:YM, type:"process",  lines:["Document","Checklist"],      route:"/admin/visa",       color:"#8B5CF6", step:4  },
  { id:"upload",       cx:760,  cy:YM, type:"process",  lines:["Document","Upload"],         route:"/admin/visa",       color:"#8B5CF6", step:5  },
  { id:"ai_verify",    cx:930,  cy:YM, type:"process",  lines:["AI","Verification"],         route:"/admin/visa",       color:"#A855F7", step:6  },
  { id:"d_missing",    cx:1085, cy:YM, type:"decision", lines:["Docs","OK?"],                color:"#F59E0B"                                     },
  { id:"staff_review", cx:1250, cy:YM, type:"process",  lines:["Staff","Review"],            route:"/admin/tasks",      color:"#0EA5E9", step:7  },
  { id:"invoice",      cx:1425, cy:YM, type:"process",  lines:["Invoice","Generation"],      route:"/admin/finance",    color:"#10B981", step:8  },
  { id:"payment",      cx:1600, cy:YM, type:"process",  lines:["Payment","Received"],        route:"/admin/finance",    color:"#10B981", step:9  },
  { id:"assign",       cx:1775, cy:YM, type:"process",  lines:["Assign","Officer"],          route:"/admin/tasks",      color:"#F97316", step:10 },
  { id:"embassy",      cx:1960, cy:YM, type:"process",  lines:["Embassy","Submission"],      route:"/admin/visa",       color:"#8B5CF6", step:11 },
  { id:"processing",   cx:2140, cy:YM, type:"process",  lines:["Embassy","Processing"],      route:"/admin/visa",       color:"#64748B", step:12 },
  { id:"d_outcome",    cx:2305, cy:YM, type:"decision", lines:["Outcome"],                   color:"#F59E0B"                                     },
  { id:"passport_rcv", cx:2490, cy:YM, type:"process",  lines:["Passport","Received"],       route:"/admin/passports",  color:"#6366F1", step:13 },
  { id:"delivery",     cx:2665, cy:YM, type:"process",  lines:["Delivery","Close"],          route:"/admin/visa",       color:"#22C55E", step:14 },
  { id:"archive",      cx:2840, cy:YM, type:"terminal", lines:["Archive &","Feedback"],      route:"/admin/crm",        color:"#94A3B8", step:15 },
  // ── branch nodes ──────────────────────────────────────────────────────────
  { id:"missing_doc",  cx:1085, cy:YB, type:"branch",   lines:["Missing Docs","Notify →"],  route:"/admin/customers",  color:"#EF4444"          },
  { id:"interview",    cx:2140, cy:YB, type:"branch",   lines:["Interview /","Biometric"],   route:"/admin/visa",       color:"#64748B", optional:true },
  { id:"refused",      cx:2305, cy:YB, type:"branch",   lines:["Refused /","Rejected"],      route:"/admin/visa",       color:"#EF4444"          },
];

// ── Edge data ─────────────────────────────────────────────────────────────────
interface DEdge {
  id:       string;
  d:        string;
  stroke:   string;
  marker:   string;
  dashed?:  boolean;
  label?:   string;
  lx?:      number;
  ly?:      number;
}

// colour tokens for edges
const SL = "#475569"; // slate  — neutral main flow
const GR = "#10B981"; // green  — approved / yes
const RD = "#EF4444"; // red    — rejected / no / loop-back
const AM = "#F59E0B"; // amber  — decision approach
const GY = "#64748B"; // gray   — optional branch

const EDGES: DEdge[] = [
  // ── main flow left → right ─────────────────────────────────────────────────
  // inquiry(right=149) → customer(left=196)
  { id:"e01", d:"M 149,155 H 196",   stroke:SL, marker:"ar-sl" },
  // customer(right=314) → passport(left=361)
  { id:"e02", d:"M 314,155 H 361",   stroke:SL, marker:"ar-sl" },
  // passport(right=479) → checklist(left=531)
  { id:"e03", d:"M 479,155 H 531",   stroke:SL, marker:"ar-sl" },
  // checklist(right=649) → upload(left=701)
  { id:"e04", d:"M 649,155 H 701",   stroke:SL, marker:"ar-sl" },
  // upload(right=819) → ai_verify(left=871)
  { id:"e05", d:"M 819,155 H 871",   stroke:SL, marker:"ar-sl" },
  // ai_verify(right=989) → d_missing(left=1037)
  { id:"e06", d:"M 989,155 H 1037",  stroke:AM, marker:"ar-am" },

  // ── decision: docs ok? ─────────────────────────────────────────────────────
  // YES: d_missing(right=1133) → staff_review(left=1191)
  { id:"e07", d:"M 1133,155 H 1191", stroke:GR, marker:"ar-gr",
    label:"Yes ✓", lx:1159, ly:147 },
  // NO: d_missing(bottom=1085,191) → missing_doc(top=1085,307)
  { id:"e08", d:"M 1085,191 V 307",  stroke:RD, marker:"ar-rd",
    label:"No", lx:1098, ly:256 },
  // loop-back: missing_doc(left=1026,330) → upload(bottom=760,178)
  { id:"e09", d:"M 1026,330 C 870,340 760,300 760,178",
    stroke:RD, marker:"ar-rd", dashed:true,
    label:"Notify Customer · Re-upload", lx:888, ly:375 },

  // ── post-review main flow ──────────────────────────────────────────────────
  // staff_review(right=1309) → invoice(left=1366)
  { id:"e10", d:"M 1309,155 H 1366", stroke:SL, marker:"ar-sl" },
  // invoice(right=1484) → payment(left=1541)
  { id:"e11", d:"M 1484,155 H 1541", stroke:SL, marker:"ar-sl" },
  // payment(right=1659) → assign(left=1716)
  { id:"e12", d:"M 1659,155 H 1716", stroke:SL, marker:"ar-sl" },
  // assign(right=1834) → embassy(left=1901)
  { id:"e13", d:"M 1834,155 H 1901", stroke:SL, marker:"ar-sl" },
  // embassy(right=2019) → processing(left=2081)
  { id:"e14", d:"M 2019,155 H 2081", stroke:SL, marker:"ar-sl" },
  // processing(right=2199) → d_outcome(left=2257) [main / bypass interview]
  { id:"e15", d:"M 2199,155 H 2257", stroke:SL, marker:"ar-sl" },

  // ── optional interview branch ──────────────────────────────────────────────
  // processing(bottom=2140,178) → interview(top=2140,307)
  { id:"e16", d:"M 2140,178 V 307",  stroke:GY, marker:"ar-gy", dashed:true },
  // interview(right=2199,330) → d_outcome(bottom=2305,191)
  { id:"e17", d:"M 2199,330 Q 2305,330 2305,191",
    stroke:GY, marker:"ar-gy", dashed:true },

  // ── decision: outcome ──────────────────────────────────────────────────────
  // APPROVED: d_outcome(right=2353) → passport_rcv(left=2431)
  { id:"e18", d:"M 2353,155 H 2431", stroke:GR, marker:"ar-gr",
    label:"Approved ✓", lx:2388, ly:147 },
  // REFUSED: d_outcome(bottom=2305,191) → refused(top=2305,307)
  { id:"e19", d:"M 2305,191 V 307",  stroke:RD, marker:"ar-rd",
    label:"Refused", lx:2320, ly:256 },

  // ── approved continuation ──────────────────────────────────────────────────
  // passport_rcv(right=2549) → delivery(left=2606)
  { id:"e20", d:"M 2549,155 H 2606", stroke:GR, marker:"ar-gr" },
  // delivery(right=2724) → archive(left=2781)
  { id:"e21", d:"M 2724,155 H 2781", stroke:GR, marker:"ar-gr" },
];

// ── Marker colours paired with IDs ───────────────────────────────────────────
const MARKERS = [
  { id:"ar-sl", fill:SL },
  { id:"ar-gr", fill:GR },
  { id:"ar-rd", fill:RD },
  { id:"ar-am", fill:AM },
  { id:"ar-gy", fill:GY },
];

// ── SVG node renderer ─────────────────────────────────────────────────────────
function SvgNode({ n, onClick }: { n: DNode; onClick?: () => void }) {
  const { cx, cy, type, lines, color, step, optional } = n;
  const clickable = !!n.route;

  // shared text renderer
  const Label = ({ yBase }: { yBase: number }) => (
    <text textAnchor="middle" fontSize="10.5" fontWeight="600"
      fill="#E2E8F0" fontFamily="'Plus Jakarta Sans',system-ui,sans-serif"
      style={{ pointerEvents:"none" }}>
      {lines.map((l, i) => (
        <tspan key={i} x={cx} y={lines.length === 2 ? yBase - 5 + i * 13 : yBase + 4}>{l}</tspan>
      ))}
    </text>
  );

  if (type === "decision") {
    const pts = `${cx},${cy - DHH} ${cx + DHW},${cy} ${cx},${cy + DHH} ${cx - DHW},${cy}`;
    return (
      <g>
        <polygon points={pts} fill={`${color}20`} stroke={color} strokeWidth={1.5} />
        <text textAnchor="middle" fontSize="10" fontWeight="700"
          fill={color} fontFamily="'Plus Jakarta Sans',system-ui,sans-serif"
          style={{ pointerEvents:"none" }}>
          {lines.map((l, i) => (
            <tspan key={i} x={cx} y={lines.length === 2 ? cy - 4 + i * 12 : cy + 4}>{l}</tspan>
          ))}
        </text>
      </g>
    );
  }

  const rx = type === "terminal" ? 23 : 6;
  const isInteractive = clickable;

  return (
    <g onClick={isInteractive ? onClick : undefined}
      style={{ cursor: isInteractive ? "pointer" : "default" }}>
      {/* shadow/glow rect */}
      {isInteractive && (
        <rect x={cx - RHW - 2} y={cy - RHH - 2} width={(RHW + 2) * 2} height={(RHH + 2) * 2}
          rx={rx + 2} fill={color} opacity={0.06} />
      )}
      {/* main box */}
      <rect x={cx - RHW} y={cy - RHH} width={RHW * 2} height={RHH * 2} rx={rx}
        fill={`${color}${type === "branch" ? "18" : "1A"}`}
        stroke={color} strokeWidth={type === "branch" ? 1 : 1.5}
        strokeDasharray={optional ? "5,3" : undefined}
        opacity={optional ? 0.7 : 1} />
      {/* optional label */}
      {optional && (
        <text x={cx} y={cy - RHH - 5} textAnchor="middle" fontSize="8"
          fill={color} fontStyle="italic"
          fontFamily="'Plus Jakarta Sans',system-ui,sans-serif"
          style={{ pointerEvents:"none" }}>if required</text>
      )}
      {/* step badge */}
      {step != null && (
        <>
          <circle cx={cx - RHW + 11} cy={cy - RHH + 11} r={9} fill={color} opacity={0.9} />
          <text x={cx - RHW + 11} y={cy - RHH + 11} textAnchor="middle"
            dominantBaseline="central" fontSize="8" fontWeight="800" fill="#0D1117"
            fontFamily="'Plus Jakarta Sans',system-ui,sans-serif"
            style={{ pointerEvents:"none" }}>
            {step}
          </text>
        </>
      )}
      {/* node label */}
      <Label yBase={cy} />
      {/* navigate hint arrow */}
      {isInteractive && (
        <text x={cx + RHW - 8} y={cy + RHH - 6} textAnchor="middle"
          fontSize="9" fill={color} opacity={0.45}
          fontFamily="system-ui,sans-serif"
          style={{ pointerEvents:"none" }}>↗</text>
      )}
    </g>
  );
}

// ── Diagram panel ─────────────────────────────────────────────────────────────
function DiagramPanel() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);

  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));

  return (
    <div className="space-y-4">
      {/* legend */}
      <div className="flex items-center gap-5 flex-wrap text-xs text-slate-500">
        {[
          { sample:<div className="w-6 h-3.5 rounded border-2 border-[#06B6D4] bg-[#06B6D4]/10"/>, label:"Clickable stage — opens module" },
          { sample:<div className="w-4 h-4 rotate-45 border-2 border-amber-500 bg-amber-500/10"/>,  label:"Decision / branch point"        },
          { sample:<div className="w-5 h-0 border-t-2 border-red-500 border-dashed"/>,              label:"Error / loop-back path"         },
          { sample:<div className="w-5 h-0 border-t-2 border-emerald-500"/>,                         label:"Approved / happy path"          },
          { sample:<div className="w-6 h-3.5 rounded border border-dashed border-slate-600 bg-slate-800/40"/>, label:"Optional stage" },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="flex-shrink-0 flex items-center justify-center w-6">{l.sample}</div>
            <span>{l.label}</span>
          </div>
        ))}
      </div>

      {/* scrollable canvas */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-[#0D1117]"
        style={{ scrollbarWidth:"thin", scrollbarColor:"#334155 #0D1117" }}>
        <div style={{ width: CW, height: CH, position:"relative", flexShrink: 0 }}>
          <svg width={CW} height={CH}
            style={{ position:"absolute", top:0, left:0, display:"block" }}>
            <defs>
              {MARKERS.map(m => (
                <marker key={m.id} id={m.id}
                  markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill={m.fill} opacity="0.85" />
                </marker>
              ))}
            </defs>

            {/* row divider */}
            <line x1={0} y1={240} x2={CW} y2={240}
              stroke="#1E293B" strokeWidth={1} />

            {/* row labels */}
            <text x={12} y={YM + 55} fontSize="8.5" fill="#1E293B" letterSpacing="1"
              fontFamily="'Plus Jakarta Sans',system-ui,sans-serif">MAIN FLOW</text>
            <text x={12} y={YB + 55} fontSize="8.5" fill="#1E293B" letterSpacing="1"
              fontFamily="'Plus Jakarta Sans',system-ui,sans-serif">BRANCHES</text>

            {/* edges */}
            {EDGES.map(e => (
              <g key={e.id}>
                <path d={e.d} stroke={e.stroke} strokeWidth={1.6} fill="none"
                  markerEnd={`url(#${e.marker})`}
                  strokeDasharray={e.dashed ? "5,4" : undefined}
                  opacity={e.dashed ? 0.5 : 0.7} />
                {e.label && (
                  <text x={e.lx} y={e.ly} textAnchor="middle"
                    fontSize="9" fontWeight="600" fill={e.stroke}
                    fontFamily="'Plus Jakarta Sans',system-ui,sans-serif">{e.label}</text>
                )}
              </g>
            ))}

            {/* nodes */}
            {NODES.map(n => (
              <SvgNode key={n.id} n={n}
                onClick={n.route ? () => navigate(n.route!) : undefined} />
            ))}
          </svg>
        </div>
      </div>

      {/* quick-link grid to all connected modules */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Connected modules — click to navigate directly</p>
        <div className="grid grid-cols-5 gap-2">
          {[
            { label:"CRM / Leads",          route:"/admin/crm",           color:"#06B6D4", desc:"Inquiry & Archive"     },
            { label:"Customer Management",   route:"/admin/customers",     color:"#3B82F6", desc:"Profile creation"      },
            { label:"Passport Module",       route:"/admin/passports",     color:"#6366F1", desc:"OCR & delivery"        },
            { label:"Visa Management",       route:"/admin/visa",          color:"#8B5CF6", desc:"Checklist → Embassy"   },
            { label:"Tasks & Workflow",      route:"/admin/tasks",         color:"#0EA5E9", desc:"Review & assignment"   },
            { label:"Accounting & Finance",  route:"/admin/finance",       color:"#10B981", desc:"Invoice & payment"     },
            { label:"Notification Engine",   route:"/admin/notifications", color:"#06B6D4", desc:"Alerts & reminders"    },
            { label:"HR & Payroll",          route:"/admin/hr",            color:"#3B82F6", desc:"Staff management"      },
            { label:"Reports & BI",          route:"/admin/reports",       color:"#8B5CF6", desc:"Analytics"             },
            { label:"Settings",              route:"/admin/settings",      color:"#6B7280", desc:"Configuration"         },
          ].map(m => (
            <button key={m.route} onClick={() => navigate(m.route)}
              className="flex items-start gap-2 p-2.5 bg-slate-800/60 border border-slate-700 hover:border-slate-500 rounded-xl text-left transition-colors group">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{background:m.color}} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200 group-hover:text-amber-400 truncate transition-colors">{m.label}</p>
                <p className="text-[10px] text-slate-500 truncate">{m.desc}</p>
              </div>
              <ExternalLink size={10} className="text-slate-600 group-hover:text-amber-400 flex-shrink-0 mt-0.5 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Timeline component demo panel ─────────────────────────────────────────────
function TimelinePanel() {
  const [stage, setStage]     = useState(6);
  const [outcome, setOutcome] = useState<"approved" | "refused" | undefined>(undefined);

  const demoEntries = [
    { stageIndex:0, date:"10 Jan 25", note:"Lead submitted via website" },
    { stageIndex:1, date:"10 Jan 25", note:"Customer profile created" },
    { stageIndex:2, date:"11 Jan 25", note:"Passport scanned & extracted" },
    { stageIndex:3, date:"11 Jan 25", note:"Schengen checklist generated" },
    { stageIndex:4, date:"12 Jan 25", note:"6 / 8 documents uploaded" },
    { stageIndex:5, date:"12 Jan 25", note:"AI check — 1 flag raised", actor:"System" },
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
        <Info size={13} className="mt-0.5 flex-shrink-0" />
        <span>
          <code className="bg-amber-500/20 px-1 rounded">CaseTimeline</code> is a single shared component.
          It renders identically in Admin ERP (dark), Staff Portal (staff) and Customer Portal (portal) via a <code className="bg-amber-500/20 px-1 rounded">variant</code> prop.
          The inline timeline rendering has been removed from both portal files and replaced with this component.
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* controls */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-300 mb-2">Stage selector</p>
            <p className="text-xs text-slate-500 mb-2">
              Stage <span className="text-amber-400 font-mono">{stage}</span> — {CANONICAL_STAGES[stage]?.label}
            </p>
            <input type="range" min={0} max={CANONICAL_STAGES.length - 1} value={stage}
              onChange={e => setStage(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300 mb-2">Outcome</p>
            {([undefined, "approved", "refused"] as const).map(o => (
              <button key={String(o)} onClick={() => setOutcome(o)}
                className={`w-full mb-1.5 text-left px-2.5 py-1.5 rounded text-xs border transition-colors ${
                  outcome === o
                    ? "border-amber-500 bg-amber-500/15 text-amber-400"
                    : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                }`}>
                {o === undefined ? "In Progress" : o === "approved" ? "Approved ✓" : "Refused ✗"}
              </button>
            ))}
          </div>
          <button onClick={() => { setStage(0); setOutcome(undefined); }}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors">
            <RotateCcw size={10} /> Reset
          </button>
          <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
            <p className="text-slate-400 font-semibold">Used in:</p>
            {[
              { label:"Customer Portal → /portal/track/:id",        file:"src/portal/Track.tsx",       variant:"portal" },
              { label:"Staff Portal → Case detail panel",           file:"src/staff/Applications.tsx", variant:"staff"  },
              { label:"Admin → /admin/case-journey (this page)",    file:"(above diagram)",            variant:"dark"   },
            ].map(u => (
              <div key={u.file}>
                <p className="text-slate-300">{u.label}</p>
                <p className="font-mono text-[10px] text-slate-600">{u.file} · <span className="text-amber-600">variant="{u.variant}"</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* dark variant */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-400 mb-0.5">Admin ERP</p>
          <p className="text-[10px] font-mono text-slate-600 mb-4">variant="dark"</p>
          <CaseTimeline stages={CANONICAL_STAGES} currentStage={stage}
            entries={demoEntries} outcome={outcome} variant="dark" compact />
        </div>

        {/* staff variant */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-sky-700 mb-0.5">Staff Portal</p>
          <p className="text-[10px] font-mono text-slate-400 mb-4">variant="staff"</p>
          <CaseTimeline stages={CANONICAL_STAGES} currentStage={stage}
            entries={demoEntries} outcome={outcome} variant="staff" compact />
        </div>

        {/* portal variant */}
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs font-semibold text-primary mb-0.5">Customer Portal</p>
          <p className="text-[10px] font-mono text-muted-foreground mb-4">variant="portal"</p>
          <CaseTimeline stages={CANONICAL_STAGES} currentStage={stage}
            entries={demoEntries} outcome={outcome} variant="portal" compact />
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
type JTab = "diagram" | "timeline";

export default function CaseJourneyModule() {
  const [tab, setTab] = useState<JTab>("diagram");

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-slate-700/60">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <GitBranch size={17} className="text-amber-400" />
              Case Journey Map
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              18-stage end-to-end case flow · click any node to open that module ·
              shared CaseTimeline component across all portals
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs border border-slate-700 bg-slate-800/60 rounded-lg px-3 py-2 text-slate-400">
            <Layers size={11} className="text-amber-400" />
            {NODES.filter(n => n.route).length} linked modules
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="flex-shrink-0 flex gap-0.5 px-6 pt-3 border-b border-slate-700/60">
        {[
          { key:"diagram"  as JTab, label:"Workflow Diagram"        },
          { key:"timeline" as JTab, label:"Case Timeline Component" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 rounded-t transition-colors ${
              tab === t.key
                ? "text-amber-400 border-amber-400"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}>{t.label}</button>
        ))}
      </div>

      {/* content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === "diagram"  && <DiagramPanel />}
        {tab === "timeline" && <TimelinePanel />}
      </div>
    </div>
  );
}
