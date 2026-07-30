import { useLocation } from "react-router";

export type Phase = "MVP" | "Phase 2" | "Phase 3";

export const ROUTE_PHASES: Record<string, Phase> = {
  // ── Public Website (MVP) ─────────────────────────────────────────────────
  "/":             "MVP", "/about":       "MVP", "/services":     "MVP",
  "/visa":         "MVP", "/flights":     "MVP", "/tours":        "MVP",
  "/blog":         "MVP", "/inquiry":     "MVP", "/payment":      "MVP",
  "/contact":      "MVP",

  // ── Customer Portal ───────────────────────────────────────────────────────
  "/portal/login":    "MVP", "/portal/dashboard": "MVP", "/portal/apply":    "MVP",
  "/portal/documents":"MVP", "/portal/support":   "Phase 2",

  // ── Staff Portal ──────────────────────────────────────────────────────────
  "/staff":          "MVP", "/staff/tasks": "MVP",  "/staff/apps":      "MVP",
  "/staff/customers":"Phase 2", "/staff/calendar": "Phase 2",
  "/staff/chat":     "Phase 2", "/staff/docs":     "Phase 2",

  // ── Admin ERP ─────────────────────────────────────────────────────────────
  "/admin":               "MVP",    "/admin/crm":          "MVP",
  "/admin/customers":     "MVP",    "/admin/passports":    "MVP",
  "/admin/visa":          "MVP",    "/admin/ticketing":    "MVP",
  "/admin/hotels":        "MVP",    "/admin/finance":      "MVP",
  "/admin/reports":       "MVP",    "/admin/settings":     "MVP",
  "/admin/transport":     "Phase 2","/admin/tours":        "Phase 2",
  "/admin/hajj":          "Phase 2","/admin/student":      "Phase 2",
  "/admin/medical":       "Phase 2","/admin/immigration":  "Phase 2",
  "/admin/insurance":     "Phase 2","/admin/corporate":    "Phase 2",
  "/admin/suppliers":     "Phase 2","/admin/wallet":       "Phase 2",
  "/admin/hr":            "Phase 2","/admin/tasks":        "Phase 2",
  "/admin/cms":           "Phase 2","/admin/notifications":"Phase 2",
  "/admin/downloads":     "Phase 2","/admin/case-journey": "Phase 2",
  "/admin/tablet":        "Phase 2","/admin/overview":     "Phase 3",
  "/admin/pwa":          "Phase 2",

  // ── Corporate Portal (Phase 2) ────────────────────────────────────────────
  "/corporate/dashboard": "Phase 2", "/corporate/employees":   "Phase 2",
  "/corporate/applications":"Phase 2","/corporate/approvals":  "Phase 2",
  "/corporate/credit":    "Phase 2", "/corporate/reports":     "Phase 2",

  // ── Agent Portal (Phase 2) ────────────────────────────────────────────────
  "/agent/dashboard": "Phase 2", "/agent/profile":     "Phase 2",
  "/agent/wallet":    "Phase 2", "/agent/passengers":  "Phase 2",
  "/agent/book":      "Phase 2", "/agent/bookings":    "Phase 2",
  "/agent/ledger":    "Phase 2", "/agent/commission":  "Phase 2",
  "/agent/downloads": "Phase 2",

  // ── Supplier Portal (Phase 2) ─────────────────────────────────────────────
  "/supplier/dashboard":   "Phase 2", "/supplier/requests":  "Phase 2",
  "/supplier/services":    "Phase 2", "/supplier/invoices":  "Phase 2",
  "/supplier/payments":    "Phase 2", "/supplier/performance":"Phase 2",
  "/supplier/contracts":   "Phase 2",

  // ── Showcases ─────────────────────────────────────────────────────────────
  "/mobile": "Phase 2",
};

const STYLES: Record<Phase, { pill: string; dot: string }> = {
  MVP:       { pill: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40", dot: "bg-emerald-400" },
  "Phase 2": { pill: "bg-amber-500/20 text-amber-300 border border-amber-500/40",       dot: "bg-amber-400"   },
  "Phase 3": { pill: "bg-blue-500/20 text-blue-300 border border-blue-500/40",           dot: "bg-blue-400"    },
};

export function RouteStatusTag() {
  const { pathname } = useLocation();
  const phase: Phase =
    ROUTE_PHASES[pathname] ??
    ROUTE_PHASES[pathname.replace(/\/[^/]+$/, "")] ??
    "Phase 2";
  const s = STYLES[phase];

  return (
    <div className="absolute top-3 right-3 z-50 pointer-events-none select-none">
      <div className={`flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full backdrop-blur-sm text-[9px] font-bold tracking-wide ${s.pill}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {phase}
      </div>
    </div>
  );
}
