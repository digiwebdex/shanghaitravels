import { useState } from "react";
import {
  FileText, Package, Layers, BookOpen, Copy, Check,
  Globe, Users, Shield, Building2, Briefcase, Truck,
  ChevronRight, Info, Code2, Palette, Grid2x2,
} from "lucide-react";
import type { Phase } from "../../shared/RouteStatusTag";

// ─── Screen inventory data ────────────────────────────────────────────────────

interface ScreenEntry {
  name: string; route: string; file: string; phase: Phase; notes?: string;
}
interface SectionDef {
  label: string; icon: React.ElementType; color: string; screens: ScreenEntry[];
}
type SectionKey = "public" | "portal" | "staff" | "admin" | "corporate" | "agent" | "supplier";

const SECTIONS: Record<SectionKey, SectionDef> = {
  public: {
    label: "Public Website", icon: Globe, color: "#0D9488",
    screens: [
      { name: "Home",           route: "/",              file: "src/pages/Home.tsx",             phase: "MVP" },
      { name: "About",          route: "/about",         file: "src/pages/About.tsx",            phase: "MVP" },
      { name: "Services",       route: "/services",      file: "src/pages/Services.tsx",         phase: "MVP" },
      { name: "Visa Info",      route: "/visa",          file: "src/pages/Visa.tsx",             phase: "MVP" },
      { name: "Flights",        route: "/flights",       file: "src/pages/Flights.tsx",          phase: "MVP" },
      { name: "Tours",          route: "/tours",         file: "src/pages/Tours.tsx",            phase: "MVP" },
      { name: "Tour Detail",    route: "/tours/:id",     file: "src/pages/TourDetail.tsx",       phase: "MVP" },
      { name: "Blog",           route: "/blog",          file: "src/pages/Blog.tsx",             phase: "MVP" },
      { name: "Blog Article",   route: "/blog/:slug",    file: "src/pages/BlogArticle.tsx",      phase: "MVP" },
      { name: "Inquiry",        route: "/inquiry",       file: "src/pages/Inquiry.tsx",          phase: "MVP" },
      { name: "Payment",        route: "/payment",       file: "src/pages/Payment.tsx",          phase: "MVP" },
      { name: "Contact",        route: "/contact",       file: "src/pages/Contact.tsx",          phase: "MVP" },
    ],
  },
  portal: {
    label: "Customer Portal", icon: Users, color: "#F97316",
    screens: [
      { name: "Login",           route: "/portal/login",       file: "src/portal/Login.tsx",         phase: "MVP" },
      { name: "Dashboard",       route: "/portal/dashboard",   file: "src/portal/Dashboard.tsx",     phase: "MVP" },
      { name: "Apply for Visa",  route: "/portal/apply",       file: "src/portal/Apply.tsx",         phase: "MVP" },
      { name: "My Documents",    route: "/portal/documents",   file: "src/portal/Documents.tsx",     phase: "MVP" },
      { name: "Track App",       route: "/portal/track/:id",  file: "src/portal/Track.tsx",         phase: "MVP", notes: "Uses shared CaseTimeline" },
      { name: "Make Payment",    route: "/portal/payment/:id",file: "src/portal/PortalPayment.tsx", phase: "MVP" },
      { name: "Invoice",         route: "/portal/invoice/:id",file: "src/portal/Invoice.tsx",       phase: "MVP" },
      { name: "Support",         route: "/portal/support",     file: "src/portal/Support.tsx",       phase: "Phase 2" },
    ],
  },
  staff: {
    label: "Staff Portal", icon: Shield, color: "#0EA5E9",
    screens: [
      { name: "My Dashboard",    route: "/staff",            file: "src/staff/MyDashboard.tsx",     phase: "MVP" },
      { name: "Assigned Tasks",  route: "/staff/tasks",      file: "src/staff/AssignedTasks.tsx",   phase: "MVP" },
      { name: "Applications",    route: "/staff/apps",       file: "src/staff/Applications.tsx",    phase: "MVP", notes: "Case detail + CaseTimeline" },
      { name: "Customer Search", route: "/staff/customers",  file: "src/staff/Customers.tsx",       phase: "Phase 2" },
      { name: "Calendar",        route: "/staff/calendar",   file: "src/staff/StaffCalendar.tsx",   phase: "Phase 2" },
      { name: "Internal Chat",   route: "/staff/chat",       file: "src/staff/InternalChat.tsx",    phase: "Phase 2" },
      { name: "Documents",       route: "/staff/docs",       file: "src/staff/StaffDocuments.tsx",  phase: "Phase 2" },
    ],
  },
  admin: {
    label: "Admin ERP", icon: Layers, color: "#F59E0B",
    screens: [
      { name: "Dashboard",          route: "/admin",                file: "src/admin/AdminDashboard.tsx",                           phase: "MVP" },
      { name: "CRM",                route: "/admin/crm",            file: "src/admin/crm/CRMModule.tsx",                            phase: "MVP" },
      { name: "Customers",          route: "/admin/customers",      file: "src/admin/customers/CustomerModule.tsx",                 phase: "MVP" },
      { name: "Passports",          route: "/admin/passports",      file: "src/admin/passports/PassportModule.tsx",                 phase: "MVP" },
      { name: "Visa Processing",    route: "/admin/visa",           file: "src/admin/visa/VisaModule.tsx",                          phase: "MVP" },
      { name: "Air Ticketing",      route: "/admin/ticketing",      file: "src/admin/ticketing/TicketingModule.tsx",                phase: "MVP" },
      { name: "Hotels",             route: "/admin/hotels",         file: "src/admin/hotels/HotelsModule.tsx",                      phase: "MVP" },
      { name: "Accounting",         route: "/admin/finance",        file: "src/admin/accounting/AccountingModule.tsx",              phase: "MVP" },
      { name: "Reports",            route: "/admin/reports",        file: "src/admin/reports/ReportsModule.tsx",                    phase: "MVP" },
      { name: "Settings",           route: "/admin/settings",       file: "src/admin/settings/SettingsModule.tsx",                  phase: "MVP" },
      { name: "Transport",          route: "/admin/transport",      file: "src/admin/transport/TransportModule.tsx",                phase: "Phase 2" },
      { name: "Tours",              route: "/admin/tours",          file: "src/admin/tours/ToursModule.tsx",                        phase: "Phase 2" },
      { name: "Hajj & Umrah",       route: "/admin/hajj",           file: "src/admin/hajj/HajjModule.tsx",                          phase: "Phase 2" },
      { name: "Student Consult.",   route: "/admin/student",        file: "src/admin/student/StudentModule.tsx",                    phase: "Phase 2" },
      { name: "Medical Tourism",    route: "/admin/medical",        file: "src/admin/medical/MedicalModule.tsx",                    phase: "Phase 2" },
      { name: "Immigration",        route: "/admin/immigration",    file: "src/admin/immigration/ImmigrationModule.tsx",            phase: "Phase 2" },
      { name: "Insurance",          route: "/admin/insurance",      file: "src/admin/insurance/InsuranceModule.tsx",                phase: "Phase 2" },
      { name: "Corporate Clients",  route: "/admin/corporate",      file: "src/admin/corporate-clients/CorporateClientsModule.tsx", phase: "Phase 2" },
      { name: "Suppliers",          route: "/admin/suppliers",      file: "src/admin/suppliers/SuppliersModule.tsx",                phase: "Phase 2" },
      { name: "Wallet & Commission",route: "/admin/wallet",         file: "src/admin/wallet/WalletCommissionModule.tsx",            phase: "Phase 2" },
      { name: "HR & Payroll",       route: "/admin/hr",             file: "src/admin/hr/HRModule.tsx",                              phase: "Phase 2" },
      { name: "Tasks & Workflow",   route: "/admin/tasks",          file: "src/admin/tasks/TaskWorkflowModule.tsx",                 phase: "Phase 2" },
      { name: "CMS",                route: "/admin/cms",            file: "src/admin/cms/CMSModule.tsx",                            phase: "Phase 2" },
      { name: "Notification Engine",route: "/admin/notifications",  file: "src/admin/notifications/NotificationModule.tsx",         phase: "Phase 2" },
      { name: "Download Center",    route: "/admin/downloads",      file: "src/admin/downloads/DownloadsModule.tsx",                phase: "Phase 2" },
      { name: "Case Journey Map",   route: "/admin/case-journey",   file: "src/admin/case-journey/CaseJourneyModule.tsx",           phase: "Phase 2", notes: "SVG workflow + CaseTimeline demo" },
      { name: "Tablet Layouts",     route: "/admin/tablet",         file: "src/admin/tablet-showcase/TabletShowcase.tsx",           phase: "Phase 2" },
      { name: "Project Overview",   route: "/admin/overview",       file: "src/admin/project-overview/ProjectOverview.tsx",         phase: "Phase 3" },
    ],
  },
  corporate: {
    label: "Corporate Portal", icon: Building2, color: "#0EA5E9",
    screens: [
      { name: "Dashboard",    route: "/corporate/dashboard",     file: "src/corporate/Dashboard.tsx",    phase: "Phase 2" },
      { name: "Employees",    route: "/corporate/employees",     file: "src/corporate/Employees.tsx",    phase: "Phase 2" },
      { name: "Applications", route: "/corporate/applications",  file: "src/corporate/Applications.tsx", phase: "Phase 2" },
      { name: "Approvals",    route: "/corporate/approvals",     file: "src/corporate/Approvals.tsx",    phase: "Phase 2" },
      { name: "Credit Line",  route: "/corporate/credit",        file: "src/corporate/Credit.tsx",       phase: "Phase 2" },
      { name: "Reports",      route: "/corporate/reports",       file: "src/corporate/Reports.tsx",      phase: "Phase 2" },
    ],
  },
  agent: {
    label: "Agent Portal", icon: Briefcase, color: "#8B5CF6",
    screens: [
      { name: "Dashboard",    route: "/agent/dashboard",  file: "src/agent/AgentDashboard.tsx",  phase: "Phase 2" },
      { name: "Profile",      route: "/agent/profile",    file: "src/agent/Profile.tsx",         phase: "Phase 2" },
      { name: "Wallet",       route: "/agent/wallet",     file: "src/agent/Wallet.tsx",          phase: "Phase 2" },
      { name: "Passengers",   route: "/agent/passengers", file: "src/agent/Passengers.tsx",      phase: "Phase 2" },
      { name: "New Booking",  route: "/agent/book",       file: "src/agent/Bookings.tsx",        phase: "Phase 2" },
      { name: "My Bookings",  route: "/agent/bookings",   file: "src/agent/BookingsList.tsx",    phase: "Phase 2" },
      { name: "Ledger",       route: "/agent/ledger",     file: "src/agent/AgentLedger.tsx",     phase: "Phase 2" },
      { name: "Commission",   route: "/agent/commission", file: "src/agent/Commission.tsx",      phase: "Phase 2" },
      { name: "Downloads",    route: "/agent/downloads",  file: "src/agent/Downloads.tsx",       phase: "Phase 2" },
    ],
  },
  supplier: {
    label: "Supplier Portal", icon: Truck, color: "#6B7280",
    screens: [
      { name: "Dashboard",    route: "/supplier/dashboard",    file: "src/supplier/SupplierDashboard.tsx", phase: "Phase 2" },
      { name: "Requests",     route: "/supplier/requests",     file: "src/supplier/Requests.tsx",          phase: "Phase 2" },
      { name: "My Services",  route: "/supplier/services",     file: "src/supplier/Services.tsx",          phase: "Phase 2" },
      { name: "Invoices",     route: "/supplier/invoices",     file: "src/supplier/SupplierInvoices.tsx",  phase: "Phase 2" },
      { name: "Payments",     route: "/supplier/payments",     file: "src/supplier/Payments.tsx",          phase: "Phase 2" },
      { name: "Performance",  route: "/supplier/performance",  file: "src/supplier/Performance.tsx",       phase: "Phase 2" },
      { name: "Contracts",    route: "/supplier/contracts",    file: "src/supplier/Contracts.tsx",         phase: "Phase 2" },
    ],
  },
};

const SECTION_KEYS = Object.keys(SECTIONS) as SectionKey[];
const ALL_SCREENS = SECTION_KEYS.flatMap(k => SECTIONS[k].screens.map(s => ({ ...s, section: k })));
const MVP_COUNT     = ALL_SCREENS.filter(s => s.phase === "MVP").length;
const PHASE2_COUNT  = ALL_SCREENS.filter(s => s.phase === "Phase 2").length;
const PHASE3_COUNT  = ALL_SCREENS.filter(s => s.phase === "Phase 3").length;

// ─── Sub-components ───────────────────────────────────────────────────────────

const PHASE_STYLES: Record<Phase, string> = {
  MVP:       "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  "Phase 2": "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  "Phase 3": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
};

function PhaseBadge({ phase }: { phase: Phase }) {
  return (
    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${PHASE_STYLES[phase]}`}>
      {phase}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors">
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800/50">
        <span className="text-xs font-mono text-slate-400">{label}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

function Swatch({ name, hex, dark = false }: { name: string; hex: string; dark?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-10 rounded-xl border border-white/10 shadow-sm" style={{ background: hex }} />
      <div className="text-center">
        <p className="text-[9px] font-semibold text-slate-300 leading-none">{name}</p>
        <p className="text-[8px] font-mono text-slate-600 mt-0.5">{hex}</p>
      </div>
    </div>
  );
}

// ─── Tab: Screens ─────────────────────────────────────────────────────────────

function ScreensTab() {
  const [filter, setFilter] = useState<"all" | SectionKey>("all");
  const [phaseFilter, setPhaseFilter] = useState<"all" | Phase>("all");

  const visible = ALL_SCREENS.filter(s =>
    (filter === "all" || s.section === filter) &&
    (phaseFilter === "all" || s.phase === phaseFilter)
  );

  return (
    <div className="space-y-4">
      {/* Section filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === "all" ? "bg-slate-600 text-slate-100" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
          All Sections
        </button>
        {SECTION_KEYS.map(k => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === k ? "bg-slate-600 text-slate-100" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
            {SECTIONS[k].label}
          </button>
        ))}
      </div>

      {/* Phase filter */}
      <div className="flex gap-2">
        {(["all", "MVP", "Phase 2", "Phase 3"] as const).map(p => (
          <button key={p} onClick={() => setPhaseFilter(p)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${phaseFilter === p ? "bg-slate-600 text-slate-100" : "bg-slate-800/60 text-slate-500 hover:bg-slate-700"}`}>
            {p === "all" ? `All (${ALL_SCREENS.length})` :
             p === "MVP" ? `MVP (${MVP_COUNT})` :
             p === "Phase 2" ? `Phase 2 (${PHASE2_COUNT})` :
             `Phase 3 (${PHASE3_COUNT})`}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-600 self-center">{visible.length} screens</span>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden">
        <div className="grid text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-2.5 border-b border-slate-800"
          style={{ gridTemplateColumns: "1fr 1.5fr 2fr 80px 90px" }}>
          <span>Screen Name</span><span>Route</span><span>Component File</span><span>Section</span><span>Phase</span>
        </div>
        <div className="divide-y divide-slate-800/60">
          {visible.map((s, i) => (
            <div key={i}
              className="grid items-center px-4 py-2.5 hover:bg-slate-800/30 transition-colors"
              style={{ gridTemplateColumns: "1fr 1.5fr 2fr 80px 90px" }}>
              <div>
                <p className="text-xs font-semibold text-slate-200">{s.name}</p>
                {s.notes && <p className="text-[9px] text-slate-600 mt-0.5">{s.notes}</p>}
              </div>
              <p className="text-[10px] font-mono text-slate-400">{s.route}</p>
              <p className="text-[10px] font-mono text-slate-500 truncate">{s.file}</p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: SECTIONS[s.section as SectionKey].color }} />
                <span className="text-[9px] text-slate-500">{SECTIONS[s.section as SectionKey].label.split(" ")[0]}</span>
              </div>
              <PhaseBadge phase={s.phase} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Tokens ──────────────────────────────────────────────────────────────

const CSS_VARIABLES = `/* ============================================================
   TravelOS ERP — Design Tokens (src/styles/theme.css)
   Generated: July 2025
   ============================================================ */

:root {
  /* === Typography === */
  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-size: 14px;

  /* === Brand Palette === */
  --navy-700: #14213D;   /* Primary brand color          */
  --navy-800: #0D1629;   /* Deep bg                      */
  --navy-900: #070C15;   /* Darkest surface               */
  --orange-500: #F97316; /* Primary action / accent       */
  --orange-600: #EA580C; /* Hover state                   */
  --amber-500: #F59E0B;  /* Admin active / gold highlight */

  /* === Core UI Tokens === */
  --background:        #F4F6FA;
  --foreground:        #0F1629;
  --card:              #FFFFFF;
  --card-foreground:   #0F1629;
  --primary:           #14213D;
  --primary-foreground:#FFFFFF;
  --secondary:         #EEF1F7;
  --muted:             #EEF1F7;
  --muted-foreground:  #6B7694;
  --accent:            #F97316;   /* Orange CTA */
  --accent-foreground: #FFFFFF;
  --destructive:       #DC2626;
  --border:            rgba(20,33,61,0.10);
  --ring:              rgba(20,33,61,0.30);
  --radius:            0.5rem;

  /* === Semantic Tokens === */
  --success:           #16A34A;   --success-bg: #DCFCE7;
  --warning:           #D97706;   --warning-bg: #FEF3C7;
  --error:             #DC2626;   --error-bg:   #FEE2E2;
  --info:              #0891B2;   --info-bg:    #CFFAFE;

  /* === Admin Dark Theme (hardcoded, not via CSS vars) === */
  /* --admin-bg:     #0D1117  ← slate-950 equivalent     */
  /* --admin-card:   #1E293B  ← slate-800 cards           */
  /* --admin-border: #334155  ← slate-700 borders         */
  /* --admin-active: #F59E0B  ← amber-500 active state    */
}`;

const TAILWIND_CONFIG = `// tailwind.config.ts  (Tailwind v4 — tokens via CSS vars)
// All tokens exposed via @theme inline in theme.css.
// Tailwind classes auto-generated:
//   bg-background, text-foreground, border-border
//   bg-card, bg-primary, bg-accent, bg-muted
//   text-muted-foreground, ring-ring
//   bg-success, bg-warning, bg-error, bg-info
//
// Admin-specific hardcoded values (used inline or with []):
//   bg-[#0D1117]   — admin sidebar/page bg
//   bg-[#F59E0B]   — amber-500 active state
//   text-amber-400 — active nav text
//   border-slate-700 — admin card border
//
// Radius scale:
//   rounded-sm  (calc(0.5rem - 2px) = 6px)
//   rounded-md  (0.5rem = 8px)
//   rounded-lg  (calc(0.5rem + 2px) = 10px)
//   rounded-xl  (calc(0.5rem + 6px) = 14px)`;

const NEXT_CONFIG = `// next.config.ts  — for NestJS + Next.js handoff
// Environment variables that should match design tokens:
//
// NEXT_PUBLIC_BRAND_PRIMARY    = "#14213D"
// NEXT_PUBLIC_BRAND_ACCENT     = "#F97316"
// NEXT_PUBLIC_BRAND_GOLD       = "#F59E0B"
// NEXT_PUBLIC_ADMIN_BG         = "#0D1117"
//
// Fonts (self-hosted via next/font or Google CDN):
//   Plus Jakarta Sans  — weights: 400, 500, 600, 700, 800
//   JetBrains Mono     — weights: 400, 500 (monospace/code)`;

function TokensTab() {
  const [subtab, setSubtab] = useState<"colors" | "type" | "css" | "tailwind">("colors");

  const SWATCHES_BRAND = [
    { name: "Navy 900",   hex: "#070C15" }, { name: "Navy 800", hex: "#0D1629" },
    { name: "Navy 700",   hex: "#14213D" }, { name: "Navy 600", hex: "#1E3570" },
    { name: "Navy 500",   hex: "#2D4E8A" }, { name: "Navy 400", hex: "#4F6CA5" },
    { name: "Navy 300",   hex: "#7A91BC" }, { name: "Navy 200", hex: "#AAB7D3" },
    { name: "Navy 100",   hex: "#D5DCE9" }, { name: "Navy 50",  hex: "#EEF1F7" },
  ];
  const SWATCHES_ORANGE = [
    { name: "Orange 700", hex: "#C2410C" }, { name: "Orange 600", hex: "#EA580C" },
    { name: "Orange 500", hex: "#F97316" }, { name: "Orange 400", hex: "#FB923C" },
    { name: "Orange 300", hex: "#FDBA74" }, { name: "Orange 200", hex: "#FED7AA" },
    { name: "Orange 100", hex: "#FFEDD5" },
  ];
  const SWATCHES_SEMANTIC = [
    { name: "Amber 500",   hex: "#F59E0B" }, { name: "Amber 400", hex: "#FBBF24" },
    { name: "Emerald 500", hex: "#10B981" }, { name: "Emerald 400", hex: "#34D399" },
    { name: "Red 500",     hex: "#EF4444" }, { name: "Red 400",   hex: "#F87171" },
    { name: "Sky 500",     hex: "#0EA5E9" }, { name: "Violet 500",hex: "#8B5CF6" },
    { name: "Cyan 500",    hex: "#06B6D4" }, { name: "Slate 500", hex: "#64748B" },
  ];
  const SWATCHES_ADMIN = [
    { name: "Admin BG",    hex: "#0D1117" }, { name: "Admin Card",  hex: "#1E293B" },
    { name: "Admin Card2", hex: "#0F172A" }, { name: "Admin Border",hex: "#334155" },
    { name: "Admin Muted", hex: "#475569" }, { name: "Active Gold", hex: "#F59E0B" },
    { name: "Active Text", hex: "#FCD34D" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["colors", "type", "css", "tailwind"] as const).map(t => (
          <button key={t} onClick={() => setSubtab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${subtab === t ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
            {t === "css" ? "CSS Variables" : t === "tailwind" ? "Tailwind Config" : t === "type" ? "Typography" : "Color Palette"}
          </button>
        ))}
      </div>

      {subtab === "colors" && (
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Navy — Primary Brand</p>
            <div className="flex flex-wrap gap-4">{SWATCHES_BRAND.map(s => <Swatch key={s.name} {...s} />)}</div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Orange — Customer Portal / CTA</p>
            <div className="flex flex-wrap gap-4">{SWATCHES_ORANGE.map(s => <Swatch key={s.name} {...s} />)}</div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Accent / Semantic Palette</p>
            <div className="flex flex-wrap gap-4">{SWATCHES_SEMANTIC.map(s => <Swatch key={s.name} {...s} />)}</div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Admin ERP Dark Theme</p>
            <div className="flex flex-wrap gap-4">{SWATCHES_ADMIN.map(s => <Swatch key={s.name} {...s} />)}</div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 text-xs text-slate-400 space-y-1.5">
            <p className="font-bold text-slate-300 flex items-center gap-1.5"><Info size={12} /> Portal Color Contexts</p>
            <p>• <strong className="text-slate-200">Public Website</strong>: Navy primary (#14213D) + Orange CTA (#F97316)</p>
            <p>• <strong className="text-slate-200">Customer Portal</strong>: Orange primary (#F97316), white background</p>
            <p>• <strong className="text-slate-200">Staff Portal</strong>: Sky blue (#0EA5E9) active states, white background</p>
            <p>• <strong className="text-slate-200">Admin ERP</strong>: #0D1117 bg, Amber (#F59E0B) active/highlight state</p>
            <p>• <strong className="text-slate-200">Corporate Portal</strong>: Sky-500 primary, dark navy sidebar (#0F1C2E)</p>
            <p>• <strong className="text-slate-200">Agent Portal</strong>: Violet (#8B5CF6) accent, dark backgrounds</p>
            <p>• <strong className="text-slate-200">Supplier Portal</strong>: Slate grays, neutral theme</p>
          </div>
        </div>
      )}

      {subtab === "type" && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
            <div className="border-b border-slate-800 pb-4">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-2 font-mono">--font-sans: Plus Jakarta Sans</p>
              <div className="space-y-2">
                <p style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#E2E8F0" }}>Display Heading / 32px Bold</p>
                <p style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.015em", color: "#CBD5E1" }}>H2 Section Title / 24px Bold</p>
                <p style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.4, letterSpacing: "-0.01em", color: "#94A3B8" }}>H3 Module Title / 20px Semibold</p>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#94A3B8" }}>Body text — 14px Regular. Used for descriptions, table cells, and form labels. Line height 1.6 for readability.</p>
                <p style={{ fontSize: 12, color: "#64748B" }}>Caption / Label — 12px. Used for metadata, timestamps, secondary info, table headers.</p>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#475569" }}>Micro / Eyebrow — 10px Bold All-Caps</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-2 font-mono">--font-mono: JetBrains Mono</p>
              <p className="font-mono text-sm text-slate-300">APP-7708 · AED 12,500.00 · 2025-03-15 · #STATUS_BADGE</p>
              <p className="font-mono text-xs text-slate-500 mt-1">Used for: app refs, amounts, dates, code, IDs, route labels</p>
            </div>
          </div>
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 text-xs text-slate-400 space-y-1">
            <p className="font-bold text-slate-300 mb-2">Type Scale (rem, base 14px)</p>
            {[
              ["h1 Display", "32px / 2rem", "700", "-0.02em"],
              ["h2 Section", "24px / 1.5rem", "700", "-0.015em"],
              ["h3 Module",  "20px / 1.25rem","600", "-0.01em"],
              ["h4 Card",    "14px / 1rem",   "600", "0"],
              ["Body",       "14px / 1rem",   "400", "0"],
              ["Caption",    "12px / 0.857rem","400", "0"],
              ["Micro",      "10px / 0.714rem","700", "+0.05em"],
            ].map(([n, s, w, ls]) => (
              <div key={n} className="flex gap-3 font-mono">
                <span className="w-20 text-slate-300">{n}</span>
                <span className="w-28">{s}</span>
                <span className="w-12">w{w}</span>
                <span>{ls}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {subtab === "css" && (
        <div className="space-y-4">
          <CodeBlock code={CSS_VARIABLES} label="src/styles/theme.css  (complete token reference)" />
          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 text-xs text-slate-400">
            <p className="font-bold text-slate-300 mb-2 flex items-center gap-1.5"><Info size={12} /> Usage in Next.js</p>
            <p>Copy this block into <code className="font-mono bg-slate-700 px-1 rounded">globals.css</code>. Token names are identical — no renaming needed. The <code className="font-mono bg-slate-700 px-1 rounded">@theme inline</code> block maps CSS variables to Tailwind utilities for v4 compatibility.</p>
          </div>
        </div>
      )}

      {subtab === "tailwind" && (
        <div className="space-y-4">
          <CodeBlock code={TAILWIND_CONFIG} label="Tailwind v4 token usage guide" />
          <CodeBlock code={NEXT_CONFIG} label="next.config.ts  — environment variables" />
        </div>
      )}
    </div>
  );
}

// ─── Tab: Components ──────────────────────────────────────────────────────────

const COMPONENTS: { category: string; color: string; items: { name: string; file: string; desc: string }[] }[] = [
  {
    category: "Layouts", color: "#F59E0B",
    items: [
      { name: "AdminLayout",      file: "src/admin/AdminLayout.tsx",             desc: "Collapsible sidebar (220/44px) + topbar + Outlet. Auto-collapses < 1024px." },
      { name: "PortalLayout",     file: "src/portal/PortalLayout.tsx",           desc: "Customer portal shell. Orange brand, bottom nav on mobile." },
      { name: "StaffLayout",      file: "src/staff/StaffLayout.tsx",             desc: "Staff portal shell. Sky-blue active states, white background." },
      { name: "CorporateLayout",  file: "src/corporate/CorporateLayout.tsx",     desc: "Corporate portal. Dark navy sidebar, sky-500 accents." },
      { name: "AgentLayout",      file: "src/agent/AgentLayout.tsx",             desc: "Agent portal. Violet accent, dark sidebar with commission indicator." },
      { name: "SupplierLayout",   file: "src/supplier/SupplierLayout.tsx",       desc: "Supplier portal. Neutral slate theme." },
      { name: "Layout",           file: "src/components/Layout.tsx",             desc: "Public website layout. Navy topbar, footer." },
    ],
  },
  {
    category: "Shared Components", color: "#10B981",
    items: [
      { name: "CaseTimeline",     file: "src/admin/shared/CaseTimeline.tsx",    desc: "16-stage visa workflow timeline. 3 variants: dark (admin), staff (sky), portal (CSS vars). Accepts compact, showSublabel, onStageClick." },
      { name: "RouteStatusTag",   file: "src/shared/RouteStatusTag.tsx",        desc: "MVP/Phase 2/Phase 3 pill badge. Reads current route via useLocation. Overlay in AdminLayout." },
    ],
  },
  {
    category: "Admin ERP Modules", color: "#F59E0B",
    items: [
      { name: "AdminDashboard",       file: "src/admin/AdminDashboard.tsx",                      desc: "KPI cards, revenue chart, funnel, activity feed. 4-col grid desktop / 2-col tablet." },
      { name: "CRMModule",            file: "src/admin/crm/CRMModule.tsx",                        desc: "Pipeline kanban + lead list + deal detail. Tabs: pipeline|leads|deals|contacts|activities." },
      { name: "VisaModule",           file: "src/admin/visa/VisaModule.tsx",                      desc: "Case list with SLA + stage progress. Tabs per visa status." },
      { name: "CMSModule",            file: "src/admin/cms/CMSModule.tsx",                        desc: "8 tabs: pages|menus|blog|gallery|sliders|popups|blocks|seo." },
      { name: "NotificationModule",   file: "src/admin/notifications/NotificationModule.tsx",     desc: "7 tabs: email|sms|whatsapp|reminders|alerts|schedule|logs. Generic TemplateEditor." },
      { name: "DownloadsModule",      file: "src/admin/downloads/DownloadsModule.tsx",            desc: "Document library: 6 categories, search/filter, detail drawer." },
      { name: "SettingsModule",       file: "src/admin/settings/SettingsModule.tsx",             desc: "8 tabs incl. RBAC matrix (roles×permissions), SMTP, backup, branches." },
      { name: "CaseJourneyModule",    file: "src/admin/case-journey/CaseJourneyModule.tsx",       desc: "SVG workflow diagram (18 nodes, 21 edges) + CaseTimeline interactive demo." },
      { name: "TabletShowcase",       file: "src/admin/tablet-showcase/TabletShowcase.tsx",       desc: "834px iPad-frame showcase of 6 responsive screens." },
    ],
  },
  {
    category: "Recurring UI Patterns", color: "#06B6D4",
    items: [
      { name: "List + Detail Panel",  file: "(pattern used in CRM, Visa, Passport, etc.)",       desc: "Left fixed-width list pane + right detail/form panel. Standard ERP screen pattern." },
      { name: "Module Tabs",          file: "(AdminPlaceholder template)",                       desc: "Horizontal tab bar at top of module. State-managed with useState<TabType>." },
      { name: "SearchBar + Filters",  file: "(inline in each module)",                           desc: "Input with Search icon + select dropdowns for status/category filters." },
      { name: "KPI Card",             file: "(inline in dashboards)",                            desc: "Value + label + delta % + colored accent bar. Used in all dashboard views." },
      { name: "SLA Badge",            file: "src/staff/Applications.tsx (SLABadge)",             desc: "ok / due_soon / overdue variants. Amber/red with clock icon." },
      { name: "Status Badge",         file: "(inline across modules)",                           desc: "Pill span with color-coded variant classes. Pattern: bg-*/15 text-* border border-*." },
      { name: "Avatar Initials",      file: "(inline in Users, Staff, CRM)",                    desc: "Gradient circle with first/last name initials. CSS gradient per user ID hash." },
    ],
  },
];

function ComponentsTab() {
  return (
    <div className="space-y-5">
      {COMPONENTS.map(cat => (
        <div key={cat.category} className="bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
            <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
            <p className="text-xs font-bold text-slate-300">{cat.category}</p>
            <span className="text-xs text-slate-600 ml-auto">{cat.items.length} components</span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {cat.items.map(c => (
              <div key={c.name} className="px-4 py-3 grid gap-1" style={{ gridTemplateColumns: "160px 1fr" }}>
                <div>
                  <p className="text-xs font-bold text-slate-200">{c.name}</p>
                  <p className="text-[9px] font-mono text-slate-600 mt-0.5 leading-relaxed">{c.file}</p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed self-center">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Convention ─────────────────────────────────────────────────────────

const CONVENTION_CODE = `// ── Naming Convention ─────────────────────────────────────────────────────────
//
// Route path       →  Folder               →  Component file
// ─────────────────────────────────────────────────────────────────────────────
// /admin/crm       →  src/admin/crm/       →  CRMModule.tsx
// /admin/visa      →  src/admin/visa/      →  VisaModule.tsx
// /admin/settings  →  src/admin/settings/  →  SettingsModule.tsx
// /portal/apply    →  src/portal/          →  Apply.tsx
// /staff/apps      →  src/staff/           →  Applications.tsx
// /corporate/...   →  src/corporate/       →  [Name].tsx
//
// ── Pattern rules ─────────────────────────────────────────────────────────────
//
// Admin ERP modules:    PascalCase + "Module" suffix
//   /admin/{feature}  → src/admin/{feature}/{FeatureOrAcronym}Module.tsx
//   Exception: AdminDashboard.tsx (no "Module", index screen)
//
// Portal screens:       PascalCase, no suffix
//   /portal/{screen}  → src/portal/{ScreenName}.tsx
//   /staff/{screen}   → src/staff/{ScreenName}.tsx
//   /corporate/...    → src/corporate/{ScreenName}.tsx
//
// Public pages:         PascalCase, no suffix
//   /{page}           → src/pages/{PageName}.tsx
//
// Shared components:    PascalCase, descriptive name
//   → src/admin/shared/{ComponentName}.tsx   (admin-adjacent shared)
//   → src/shared/{ComponentName}.tsx         (cross-portal shared)
//
// ── Module sub-files ──────────────────────────────────────────────────────────
//
// src/admin/{feature}/
//   ├── {Feature}Module.tsx   ← main entry, registered in routes.ts
//   └── data.ts               ← mock data, types, constants
//
// ── NestJS backend mapping ────────────────────────────────────────────────────
//
// Frontend route     →  NestJS controller/module
// /admin/crm         →  apps/api/src/crm/crm.module.ts
// /admin/visa        →  apps/api/src/visa/visa.module.ts
// /admin/finance     →  apps/api/src/accounting/accounting.module.ts
// /portal/apply      →  apps/api/src/applications/applications.module.ts
// /portal/track/:id  →  apps/api/src/applications/applications.controller.ts
// /staff/apps        →  apps/api/src/applications/applications.controller.ts
// /admin/settings    →  apps/api/src/settings/settings.module.ts
// /admin/hr          →  apps/api/src/hr/hr.module.ts
//
// ── Next.js App Router equivalent ────────────────────────────────────────────
//
// Current (react-router v7)   →  Next.js App Router
// src/app/routes.ts           →  app/ directory structure
// /admin/crm                  →  app/admin/crm/page.tsx
// /portal/apply               →  app/portal/apply/page.tsx
// AdminLayout.tsx             →  app/admin/layout.tsx
// PortalLayout.tsx            →  app/portal/layout.tsx
`;

const ROUTE_TABLE = [
  { route: "/",               nextjs: "app/(public)/page.tsx",                  controller: "—",                               method: "Static" },
  { route: "/portal/apply",   nextjs: "app/portal/apply/page.tsx",              controller: "ApplicationsController.create()", method: "POST /api/applications" },
  { route: "/portal/track/:id",nextjs:"app/portal/track/[id]/page.tsx",         controller: "ApplicationsController.findOne()",method: "GET /api/applications/:id" },
  { route: "/admin/crm",      nextjs: "app/admin/crm/page.tsx",                 controller: "CrmController",                   method: "GET /api/crm/leads" },
  { route: "/admin/visa",     nextjs: "app/admin/visa/page.tsx",                controller: "VisaController",                  method: "GET /api/visa/applications" },
  { route: "/admin/finance",  nextjs: "app/admin/finance/page.tsx",             controller: "AccountingController",            method: "GET /api/accounting/invoices" },
  { route: "/admin/settings", nextjs: "app/admin/settings/page.tsx",            controller: "SettingsController",              method: "GET /api/settings" },
  { route: "/staff/apps",     nextjs: "app/staff/apps/page.tsx",               controller: "StaffController",                 method: "GET /api/staff/applications" },
];

function ConventionTab() {
  return (
    <div className="space-y-5">
      <CodeBlock code={CONVENTION_CODE} label="naming-convention.md — Route → Folder → Component mapping" />

      <div className="bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <p className="text-xs font-bold text-slate-300">Route → Next.js → NestJS mapping (sample rows)</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Development team can use frame names directly as folder names</p>
        </div>
        <div className="text-[9px] font-mono">
          <div className="grid px-4 py-2 bg-slate-800/40 font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800"
            style={{ gridTemplateColumns: "1.2fr 1.5fr 1.5fr 0.8fr" }}>
            <span>Figma Frame / Route</span><span>Next.js App Router</span><span>NestJS Controller</span><span>HTTP Method</span>
          </div>
          {ROUTE_TABLE.map(r => (
            <div key={r.route} className="grid px-4 py-2 border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
              style={{ gridTemplateColumns: "1.2fr 1.5fr 1.5fr 0.8fr" }}>
              <span className="text-amber-400">{r.route}</span>
              <span className="text-slate-400">{r.nextjs}</span>
              <span className="text-sky-400">{r.controller}</span>
              <span className="text-slate-600">{r.method}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/40 border border-amber-500/20 rounded-xl p-4 space-y-2 text-xs">
        <p className="font-bold text-amber-400 flex items-center gap-1.5"><Info size={12} /> Developer Handoff Notes</p>
        <ul className="space-y-1.5 text-slate-400">
          <li className="flex gap-2"><ChevronRight size={11} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Every frame name in this design maps 1:1 to the route segment name. Use the <strong className="text-slate-300">route column</strong> as the source of truth for folder/file naming.</span></li>
          <li className="flex gap-2"><ChevronRight size={11} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Admin modules follow the <strong className="text-slate-300">{`{Feature}Module.tsx`}</strong> pattern. Portal screens are bare PascalCase. No renaming needed going from design to code.</span></li>
          <li className="flex gap-2"><ChevronRight size={11} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>All mock data in <strong className="text-slate-300">src/admin/{"{feature}"}/data.ts</strong> files. Replace with real API calls in the same module file — import paths stay the same.</span></li>
          <li className="flex gap-2"><ChevronRight size={11} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>React Router v7 (Data mode) with <code className="font-mono bg-slate-700 px-1 rounded">createBrowserRouter</code> + <code className="font-mono bg-slate-700 px-1 rounded">RouterProvider</code>. Layout nesting via <code className="font-mono bg-slate-700 px-1 rounded">{`<Outlet />`}</code>.</span></li>
          <li className="flex gap-2"><ChevronRight size={11} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>CSS design tokens in <strong className="text-slate-300">src/styles/theme.css</strong> with <code className="font-mono bg-slate-700 px-1 rounded">@theme inline</code>. Copy to <code className="font-mono bg-slate-700 px-1 rounded">globals.css</code> for Next.js. No token renaming needed.</span></li>
          <li className="flex gap-2"><ChevronRight size={11} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Authentication guard: wrap portal/staff/admin/corporate/agent/supplier <strong className="text-slate-300">layout components</strong> with auth middleware. The layout component is the gate.</span></li>
        </ul>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

type TabKey = "screens" | "tokens" | "components" | "convention";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "screens",    label: "Screen Inventory", icon: Grid2x2  },
  { key: "tokens",     label: "Design Tokens",    icon: Palette  },
  { key: "components", label: "Components",       icon: Package  },
  { key: "convention", label: "Dev Convention",   icon: Code2    },
];

export default function ProjectOverview() {
  const [tab, setTab] = useState<TabKey>("screens");

  return (
    <div className="flex flex-col h-full overflow-auto bg-[#080B11]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-slate-800 bg-gradient-to-r from-[#0D1117] to-[#080B11] px-8 pt-7 pb-6">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-amber-400" />
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.12em]">Design Handoff Document</span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">TravelOS ERP</h1>
            <p className="text-sm text-slate-400 mt-1">Shanghai Travels · Full-stack travel management platform · July 2025</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-[9px] text-slate-600 uppercase tracking-wider">Stack</p>
            <p className="text-xs text-slate-400 mt-1 font-mono">React 18 + TypeScript</p>
            <p className="text-xs text-slate-500 font-mono">React Router v7 Data Mode</p>
            <p className="text-xs text-slate-500 font-mono">Tailwind CSS v4 + Recharts</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Screens",  value: ALL_SCREENS.length.toString(), sub: "across 7 portals",          color: "#64748B" },
            { label: "MVP",            value: MVP_COUNT.toString(),           sub: "must ship first",            color: "#10B981" },
            { label: "Phase 2",        value: PHASE2_COUNT.toString(),        sub: "post-launch priorities",    color: "#F59E0B" },
            { label: "Phase 3",        value: PHASE3_COUNT.toString(),        sub: "stretch / admin tooling",   color: "#3B82F6" },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/50 border border-slate-700/60 rounded-xl px-4 py-3.5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-3xl font-black mt-1 leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-slate-600 mt-1.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Phase overview ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-4 px-8 py-5 border-b border-slate-800/60 bg-[#0A0D14]">
        {[
          {
            phase: "MVP" as Phase,
            color: "#10B981", border: "border-emerald-500/25",
            desc: "Must ship before public launch.",
            items: ["Public website (12 screens)", "Customer Portal core flow (7 screens)", "Staff Portal: dashboard, tasks, case detail", "Admin ERP: CRM, Customers, Passports, Visa, Ticketing, Hotels", "Admin: Accounting, Reports, Settings"],
          },
          {
            phase: "Phase 2" as Phase,
            color: "#F59E0B", border: "border-amber-500/25",
            desc: "Post-launch expansion within 3 months.",
            items: ["Corporate, Agent, Supplier portals", "Admin: Hajj, Student, Medical, Immigration, Insurance", "Admin: HR, Wallet, Tasks, CMS, Notifications", "Staff: customers, calendar, chat, documents", "Mobile responsive showcase"],
          },
          {
            phase: "Phase 3" as Phase,
            color: "#3B82F6", border: "border-blue-500/25",
            desc: "Admin tooling and design system.",
            items: ["Project Overview (this page)", "Full BI / advanced reports", "AI-assisted automation screens", "White-label theme configurator"],
          },
        ].map(p => (
          <div key={p.phase} className={`bg-slate-900/60 border ${p.border} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
              <p className="text-sm font-bold" style={{ color: p.color }}>{p.phase}</p>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">{p.desc}</p>
            <ul className="space-y-1.5">
              {p.items.map(item => (
                <li key={item} className="flex items-start gap-2 text-[10px] text-slate-500">
                  <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: p.color }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Tab navigation ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-1 px-8 pt-4 pb-0 border-b border-slate-800">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? "text-amber-400 border-amber-400"
                : "text-slate-500 border-transparent hover:text-slate-300"
            }`}>
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {tab === "screens"    && <ScreensTab />}
        {tab === "tokens"     && <TokensTab />}
        {tab === "components" && <ComponentsTab />}
        {tab === "convention" && <ConventionTab />}
      </div>
    </div>
  );
}
