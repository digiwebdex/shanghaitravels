/**
 * CaseTimeline — single shared implementation used in:
 *   - Admin ERP    /admin/case-journey   variant="dark"
 *   - Staff Portal /staff/apps           variant="staff"
 *   - Cust. Portal /portal/track         variant="portal"
 *
 * Any update here propagates to all three surfaces.
 */
import { CheckCircle2, Circle, XCircle, Loader2 } from "lucide-react";

// ── Canonical 16-stage case journey definition ────────────────────────────────
export interface CaseStageConfig {
  id: string;
  label: string;
  sublabel?: string;
}

export const CANONICAL_STAGES: CaseStageConfig[] = [
  { id: "inquiry",      label: "Inquiry / Lead",        sublabel: "CRM"                },
  { id: "customer",     label: "Customer Created",       sublabel: "Customer Profile"   },
  { id: "passport_ocr", label: "Passport OCR",           sublabel: "Document Scan"      },
  { id: "checklist",    label: "Document Checklist",     sublabel: "Requirements"       },
  { id: "upload",       label: "Document Upload",        sublabel: "File Collection"    },
  { id: "ai_verify",    label: "AI Verification",        sublabel: "Auto-Validation"    },
  { id: "staff_review", label: "Staff Review",           sublabel: "Manual Check"       },
  { id: "invoice",      label: "Invoice Generation",     sublabel: "Finance"            },
  { id: "payment",      label: "Payment Received",       sublabel: "Finance"            },
  { id: "assign",       label: "Assign Officer",         sublabel: "Task Management"    },
  { id: "embassy",      label: "Embassy Submission",     sublabel: "Visa Processing"    },
  { id: "processing",   label: "Embassy Processing",     sublabel: "Decision Pending"   },
  { id: "interview",    label: "Interview / Biometric",  sublabel: "If Required"        },
  { id: "outcome",      label: "Outcome Decision",       sublabel: "Approved / Refused" },
  { id: "delivery",     label: "Delivery / Close",       sublabel: "Case Closure"       },
  { id: "archive",      label: "Feedback & Archive",     sublabel: "Case Complete"      },
];

// ── Props ─────────────────────────────────────────────────────────────────────
export interface CaseTimelineEntry {
  stageIndex: number;
  date?:      string;
  note?:      string;
  actor?:     string;
}

export interface CaseTimelineProps {
  /** Stage definitions — defaults to CANONICAL_STAGES */
  stages?:       CaseStageConfig[];
  /** 0-based index of the current active stage */
  currentStage:  number;
  /** Per-stage completion entries */
  entries?:      CaseTimelineEntry[];
  /** Final outcome if case is decided */
  outcome?:      "approved" | "refused";
  /**
   * "dark"   — Admin ERP dark palette (amber active)
   * "staff"  — Staff Portal explicit light palette (sky active)
   * "portal" — Customer Portal CSS-variable palette (primary active)
   */
  variant?:      "dark" | "staff" | "portal";
  compact?:      boolean;
  showSublabel?: boolean;
  onStageClick?: (index: number) => void;
}

type StageState = "completed" | "current" | "pending" | "failed";

// ── Token maps per variant ────────────────────────────────────────────────────
const TOKENS = {
  dark: {
    nodeCompleted: "bg-emerald-500 border-emerald-500 text-white",
    nodeCurrent:   "bg-amber-500 border-amber-500 text-slate-900 ring-2 ring-amber-400/30",
    nodeFailed:    "bg-red-500 border-red-500 text-white",
    nodePending:   "bg-slate-800 border-slate-600 text-slate-500",
    lineCompleted: "bg-emerald-500/25",
    lineCurrent:   "bg-amber-500/20",
    linePending:   "bg-slate-700",
    labelCompleted:"text-slate-300",
    labelCurrent:  "text-amber-400 font-semibold",
    labelFailed:   "text-red-400",
    labelPending:  "text-slate-600",
    hlBox:         "bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5 -ml-1",
    metaText:      "text-slate-600",
    noteText:      "text-slate-500",
    inProgress:    "text-amber-500/70",
  },
  staff: {
    nodeCompleted: "bg-emerald-500 border-emerald-500 text-white",
    nodeCurrent:   "bg-sky-500 border-sky-500 text-white ring-4 ring-sky-200",
    nodeFailed:    "bg-red-500 border-red-500 text-white",
    nodePending:   "bg-white border-slate-200 text-slate-300",
    lineCompleted: "bg-emerald-300",
    lineCurrent:   "bg-sky-200",
    linePending:   "bg-slate-100",
    labelCompleted:"text-slate-700 font-medium",
    labelCurrent:  "text-sky-700 font-bold",
    labelFailed:   "text-red-600 font-medium",
    labelPending:  "text-slate-400",
    hlBox:         "bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1.5 -ml-1",
    metaText:      "text-slate-400",
    noteText:      "text-slate-500 italic",
    inProgress:    "text-sky-500/80",
  },
  portal: {
    nodeCompleted: "bg-green-500 border-green-500 text-white",
    nodeCurrent:   "bg-primary border-primary text-white",
    nodeFailed:    "bg-red-500 border-red-500 text-white",
    nodePending:   "bg-card border-border text-muted-foreground/40",
    lineCompleted: "bg-green-300",
    lineCurrent:   "bg-primary/20",
    linePending:   "bg-border",
    labelCompleted:"text-foreground font-medium",
    labelCurrent:  "text-primary font-bold",
    labelFailed:   "text-red-600",
    labelPending:  "text-muted-foreground/50",
    hlBox:         "bg-primary/5 border border-primary/20 rounded-lg px-2.5 py-1.5 -ml-1",
    metaText:      "text-muted-foreground",
    noteText:      "text-muted-foreground",
    inProgress:    "text-primary/70",
  },
} as const;

// ── Component ─────────────────────────────────────────────────────────────────
export function CaseTimeline({
  stages        = CANONICAL_STAGES,
  currentStage,
  entries       = [],
  outcome,
  variant       = "dark",
  compact       = false,
  showSublabel  = false,
  onStageClick,
}: CaseTimelineProps) {
  const T = TOKENS[variant];

  const getState = (i: number): StageState => {
    if (outcome === "refused" && i > currentStage) return "failed";
    if (i < currentStage)  return "completed";
    if (i === currentStage) return outcome === "refused" ? "failed" : "current";
    return "pending";
  };

  const entryFor = (i: number) => entries.find(e => e.stageIndex === i);

  const nodeClass = (s: StageState) =>
    s === "completed" ? T.nodeCompleted :
    s === "current"   ? T.nodeCurrent   :
    s === "failed"    ? T.nodeFailed    : T.nodePending;

  const lineClass = (s: StageState) =>
    s === "completed" ? T.lineCompleted :
    s === "current"   ? T.lineCurrent   : T.linePending;

  const labelClass = (s: StageState) =>
    s === "completed" ? T.labelCompleted :
    s === "current"   ? T.labelCurrent   :
    s === "failed"    ? T.labelFailed    : T.labelPending;

  const sz = compact ? "size-4" : "size-5";
  const ic = compact ? 9 : 10;

  return (
    <div className="space-y-0">
      {stages.map((stage, i) => {
        const state  = getState(i);
        const entry  = entryFor(i);
        const isLast = i === stages.length - 1;

        return (
          <div key={stage.id}
            onClick={() => onStageClick?.(i)}
            className={onStageClick ? "cursor-pointer" : undefined}>
            <div className="flex gap-3">
              {/* Spine */}
              <div className="flex flex-col items-center flex-shrink-0 w-5">
                <div className={`${sz} rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 transition-all ${nodeClass(state)}`}>
                  {state === "completed" && <CheckCircle2 size={ic} strokeWidth={2.5} />}
                  {state === "current"   && <span className={compact ? "size-1.5 rounded-full bg-current" : "size-2 rounded-full bg-current"} />}
                  {state === "failed"    && <XCircle size={ic} strokeWidth={2.5} />}
                  {state === "pending"   && <Circle size={ic - 2} strokeWidth={1.5} />}
                </div>
                {!isLast && (
                  <div className={`w-px flex-1 ${compact ? "min-h-[14px] my-0.5" : "min-h-[20px] my-1"} ${lineClass(state)}`} />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 ${isLast ? "pb-0" : compact ? "pb-2.5" : "pb-3.5"}`}>
                <div className={state === "current" ? T.hlBox : "pt-0.5"}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`${compact ? "text-[10px]" : "text-xs"} leading-snug ${labelClass(state)}`}>
                        {stage.label}
                      </p>
                      {showSublabel && stage.sublabel && (
                        <p className={`text-[9px] mt-0.5 ${T.metaText}`}>{stage.sublabel}</p>
                      )}
                      {entry?.note && (
                        <p className={`text-[10px] mt-0.5 ${T.noteText}`}>{entry.note}</p>
                      )}
                      {state === "current" && !entry && (
                        <p className={`text-[10px] mt-0.5 flex items-center gap-1 ${T.inProgress}`}>
                          <Loader2 size={8} className="animate-spin" /> In progress
                        </p>
                      )}
                    </div>
                    {entry?.date && (
                      <p className={`text-[9px] flex-shrink-0 ${T.metaText}`}>{entry.date}</p>
                    )}
                  </div>
                  {entry?.actor && (
                    <p className={`text-[9px] mt-0.5 ${T.metaText}`}>by {entry.actor}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CaseTimeline;
