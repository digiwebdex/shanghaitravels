import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, Link } from "react-router";
import {
  Command, ChevronLeft, ChevronRight, Search, Bell, Plus, ChevronDown,
  LogOut, User, Building, AlertTriangle, CheckCircle2, DollarSign, Zap,
  LayoutDashboard, Settings, FilePlus, UserPlus, CalendarDays, FileText,
  Users2, UserCog, BarChart2, Package, Briefcase, Shield, Globe, Activity,
  GraduationCap, Moon, Map, Truck, Building2, Plane, FileCheck, BookOpen,
  Wallet, ClipboardList, Download, GitBranch, Tablet, BookMarked, Smartphone,
  type LucideIcon,
} from "lucide-react";
import {
  SERVICE_MODULES, OPS_MODULES, BRANCHES, NOTIFICATIONS,
  type AdminModule, type Branch,
} from "./data";
import { RouteStatusTag } from "../shared/RouteStatusTag";

// ── Module → Icon ─────────────────────────────────────────────────────────────
const MODULE_ICONS: Record<string, LucideIcon> = {
  crm: Users2, customers: User, passports: BookOpen, visa: FileCheck,
  ticketing: Plane, hotels: Building2, transport: Truck, tours: Map,
  hajj: Moon, student: GraduationCap, medical: Activity, immigration: Globe,
  insurance: Shield, corporate: Briefcase, suppliers: Package,
  finance: DollarSign, wallet: Wallet, hr: UserCog, tasks: ClipboardList, reports: BarChart2,
  cms: FileText, notifications: Bell, downloads: Download, settings: Settings,
  "case-journey": GitBranch, "tablet-showcase": Tablet, "project-overview": BookMarked,
  pwa: Smartphone,
};

const NOTIF_ICON: Record<string, LucideIcon>  = {
  breach: AlertTriangle, approval: CheckCircle2, payment: DollarSign, system: Zap, alert: AlertTriangle,
};
const NOTIF_COLOR: Record<string, string> = {
  breach: "text-red-500", approval: "text-emerald-500", payment: "text-amber-500",
  system: "text-blue-500", alert: "text-orange-500",
};

const QUICK_ACTIONS: { label: string; icon: LucideIcon; cls: string }[] = [
  { label: "New Application",  icon: FilePlus,     cls: "text-violet-600 bg-violet-50 hover:bg-violet-100"  },
  { label: "Add Customer",     icon: UserPlus,     cls: "text-blue-600 bg-blue-50 hover:bg-blue-100"        },
  { label: "Schedule",         icon: CalendarDays, cls: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"},
  { label: "Create Invoice",   icon: FileText,     cls: "text-amber-600 bg-amber-50 hover:bg-amber-100"     },
  { label: "Add Agent",        icon: Users2,       cls: "text-cyan-600 bg-cyan-50 hover:bg-cyan-100"        },
  { label: "Run Report",       icon: BarChart2,    cls: "text-pink-600 bg-pink-50 hover:bg-pink-100"        },
];

// ── Sidebar item ──────────────────────────────────────────────────────────────
function SidebarItem({ mod, collapsed }: { mod: AdminModule; collapsed: boolean }) {
  const Icon: LucideIcon = MODULE_ICONS[mod.id] ?? Settings;
  return (
    <NavLink
      to={mod.route}
      title={collapsed ? mod.label : undefined}
      className={({ isActive }) =>
        `relative flex items-center gap-1.5 rounded-md transition-all duration-100
        ${collapsed ? "justify-center p-2" : "px-2 py-[5px]"}
        ${isActive
          ? "bg-amber-500/10 text-amber-300"
          : "text-white/40 hover:bg-white/[0.06] hover:text-white/65"}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-amber-400" />
          )}
          {!collapsed && (
            <span className="size-[5px] rounded-full flex-shrink-0 ml-1" style={{ backgroundColor: isActive ? "#F59E0B" : mod.color }} />
          )}
          <Icon size={11} className={`flex-shrink-0 ${isActive ? "text-amber-400" : ""}`} />
          {!collapsed && (
            <span className="text-[10px] font-semibold leading-none flex-1 truncate">{mod.label}</span>
          )}
          {collapsed && isActive && (
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-l-full bg-amber-400" />
          )}
        </>
      )}
    </NavLink>
  );
}

type PanelKey = "branch" | "notifs" | "quick" | "profile" | null;

// ── Layout ────────────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const [collapsed, setCollapsed]   = useState(() => typeof window !== "undefined" && window.innerWidth < 1024);
  const [branch, setBranch]         = useState<Branch>(BRANCHES[0]);
  const [openPanel, setOpenPanel]   = useState<PanelKey>(null);

  const refs = {
    branch:  useRef<HTMLDivElement>(null),
    notifs:  useRef<HTMLDivElement>(null),
    quick:   useRef<HTMLDivElement>(null),
    profile: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (!openPanel) return;
    const activeRef = refs[openPanel as keyof typeof refs];
    const handler = (e: MouseEvent) => {
      if (activeRef.current && !activeRef.current.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [openPanel]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth < 1024) setCollapsed(true); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggle = (panel: PanelKey) => setOpenPanel(p => p === panel ? null : panel);
  const unread = NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0F2F5" }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col flex-shrink-0 transition-[width] duration-200 relative z-20"
        style={{ background: "#0D1117", width: collapsed ? 44 : 220 }}
      >
        {/* Brand */}
        <div className={`flex items-center gap-2.5 border-b border-white/[0.06] flex-shrink-0 ${collapsed ? "px-2 py-3 justify-center" : "px-3.5 py-3"}`}>
          <div className="size-[26px] rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
            <Command size={13} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-[10px] font-black tracking-[0.08em] leading-none">ADMIN ERP</p>
              <p className="text-white/25 text-[8px] mt-0.5 leading-none">Shanghai Travels</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto py-2 scrollbar-hide ${collapsed ? "px-1" : "px-2"}`}>
          {/* Dashboard */}
          <NavLink to="/admin" end title={collapsed ? "Dashboard" : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-1.5 rounded-md transition-all mb-1
              ${collapsed ? "justify-center p-2" : "px-2 py-[6px]"}
              ${isActive ? "bg-amber-500/10 text-amber-300" : "text-white/40 hover:bg-white/[0.06] hover:text-white/65"}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-amber-400" />}
                <LayoutDashboard size={11} className={`flex-shrink-0 ${isActive ? "text-amber-400" : ""}`} />
                {!collapsed && <span className="text-[10px] font-bold leading-none">Dashboard</span>}
              </>
            )}
          </NavLink>

          <div className={`border-t border-white/[0.05] mb-2 ${collapsed ? "" : "mx-1"}`} />

          {/* Services */}
          {!collapsed && <p className="text-[7.5px] font-black text-white/20 uppercase tracking-[0.16em] px-2 pb-1.5">Services</p>}
          <div className="space-y-[1px]">
            {SERVICE_MODULES.map(m => <SidebarItem key={m.id} mod={m} collapsed={collapsed} />)}
          </div>

          <div className={`border-t border-white/[0.05] my-2 ${collapsed ? "" : "mx-1"}`} />

          {/* Operations */}
          {!collapsed && <p className="text-[7.5px] font-black text-white/20 uppercase tracking-[0.16em] px-2 pb-1.5">Operations</p>}
          <div className="space-y-[1px]">
            {OPS_MODULES.map(m => <SidebarItem key={m.id} mod={m} collapsed={collapsed} />)}
          </div>
        </nav>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-[62px] z-30 size-6 rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 shadow-md flex items-center justify-center transition-colors">
          {collapsed ? <ChevronRight size={9} /> : <ChevronLeft size={9} />}
        </button>

        {!collapsed && (
          <div className="px-3 py-2 border-t border-white/[0.06] flex-shrink-0">
            <p className="text-[7.5px] font-mono text-white/15">v3.1.0 · admin · DXB</p>
          </div>
        )}
      </aside>

      {/* ── Main column ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center gap-3 px-4 bg-white border-b border-slate-200 flex-shrink-0" style={{ height: 52 }}>
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 max-w-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:border-slate-300 transition-colors cursor-text">
            <Search size={12} className="text-slate-400 flex-shrink-0" />
            <span className="text-[10.5px] text-slate-400 flex-1 select-none">Search applications, customers, modules…</span>
            <kbd className="text-[8px] font-mono bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded border border-slate-300 select-none">⌘K</kbd>
          </div>

          <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">

            {/* Branch */}
            <div className="relative" ref={refs.branch}>
              <button onClick={() => toggle("branch")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10.5px] font-semibold transition-all
                  ${openPanel === "branch" ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                <Building size={11} className="text-slate-400" />
                {branch.name}
                <ChevronDown size={9} className={`text-slate-400 transition-transform ${openPanel === "branch" ? "rotate-180" : ""}`} />
              </button>
              {openPanel === "branch" && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1">
                  {BRANCHES.map(b => (
                    <button key={b.id} onClick={() => { setBranch(b); setOpenPanel(null); }}
                      className={`w-full text-left px-3 py-2 text-[10.5px] font-semibold flex items-center justify-between transition-colors
                        ${b.id === branch.id ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:bg-slate-50"}`}>
                      {b.name}
                      <span className="text-[8.5px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{b.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-slate-200" />

            {/* Notifications */}
            <div className="relative" ref={refs.notifs}>
              <button onClick={() => toggle("notifs")}
                className={`relative p-2 rounded-lg transition-colors ${openPanel === "notifs" ? "bg-slate-100" : "hover:bg-slate-100"}`}>
                <Bell size={15} className="text-slate-500" />
                {unread > 0 && (
                  <span className="absolute top-[3px] right-[3px] min-w-[14px] h-3.5 rounded-full bg-red-500 text-white text-[7.5px] font-bold flex items-center justify-center px-0.5">
                    {unread}
                  </span>
                )}
              </button>
              {openPanel === "notifs" && (
                <div className="absolute right-0 top-full mt-1.5 w-[340px] bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="text-[12.5px] font-bold text-slate-800">Notifications</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">{unread} new</span>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                    {NOTIFICATIONS.map(n => {
                      const NIcon = NOTIF_ICON[n.type] ?? Zap;
                      return (
                        <div key={n.id} className={`flex items-start gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors ${!n.read ? "" : "opacity-60"}`}>
                          <NIcon size={11} className={`mt-0.5 flex-shrink-0 ${NOTIF_COLOR[n.type]}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10.5px] text-slate-700 leading-snug">{n.text}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {n.ref && <span className="text-[9px] font-mono font-bold text-amber-600">{n.ref}</span>}
                              <span className="text-[9px] text-slate-400">{n.at}</span>
                            </div>
                          </div>
                          {!n.read && <span className="size-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-4 py-2.5 border-t border-slate-100">
                    <button className="text-[10.5px] font-semibold text-amber-600 hover:underline">View all notifications</button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Create */}
            <div className="relative" ref={refs.quick}>
              <button onClick={() => toggle("quick")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                <Plus size={12} /> Create
                <ChevronDown size={9} className={`transition-transform ${openPanel === "quick" ? "rotate-180" : ""}`} />
              </button>
              {openPanel === "quick" && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1">
                  {QUICK_ACTIONS.map(qa => (
                    <button key={qa.label} onClick={() => setOpenPanel(null)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors ${qa.cls}`}>
                      <qa.icon size={12} className="flex-shrink-0" />
                      <span className="text-[11px] font-semibold">{qa.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={refs.profile}>
              <button onClick={() => toggle("profile")}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${openPanel === "profile" ? "bg-slate-100" : "hover:bg-slate-100"}`}>
                <div className="size-7 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                     style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>MA</div>
                <div className="text-left hidden xl:block">
                  <p className="text-[10.5px] font-bold text-slate-800 leading-none">Mohammed Al-Farsi</p>
                  <p className="text-[8.5px] text-slate-400 mt-0.5">Super Admin</p>
                </div>
                <ChevronDown size={9} className={`text-slate-400 transition-transform ${openPanel === "profile" ? "rotate-180" : ""}`} />
              </button>
              {openPanel === "profile" && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-slate-100">
                    <p className="text-[12px] font-bold text-slate-800">Mohammed Al-Farsi</p>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">m.alfarsi@shanghai-travels.com</p>
                    <span className="inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Super Admin</span>
                  </div>
                  <div className="py-1">
                    {([{ icon: User, label: "My Profile" }, { icon: Settings, label: "Preferences" }] as { icon: LucideIcon; label: string }[]).map(item => (
                      <button key={item.label} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-slate-600 hover:bg-slate-50 transition-colors">
                        <item.icon size={12} className="text-slate-400" /> {item.label}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <Link to="/" className="flex items-center gap-2.5 px-3 py-2 text-[11px] text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut size={12} /> Sign out
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative">
          <RouteStatusTag />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
