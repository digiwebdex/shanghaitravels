import { useState } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router";
import {
  LayoutDashboard, Building2, Wallet, Users, Plus,
  List, FileText, TrendingUp, Download, ChevronLeft,
  ChevronRight, Bell, AlertCircle, ExternalLink,
} from "lucide-react";
import { AGENT_PROFILE, TIER_CFG, fmtAED } from "./data";

const NAV = [
  { to: "/agent",           label: "Dashboard",        icon: LayoutDashboard, end: true  },
  { to: "/agent/profile",   label: "Company Profile",  icon: Building2,       end: false },
  { to: "/agent/wallet",    label: "Wallet & Deposit", icon: Wallet,          end: false },
  { to: "/agent/passengers",label: "Passengers",       icon: Users,           end: false },
  { to: "/agent/book",      label: "New Booking",      icon: Plus,            end: false, accent: true },
  { to: "/agent/bookings",  label: "Bookings",         icon: List,            end: false },
  { to: "/agent/ledger",    label: "Invoices & Ledger",icon: FileText,        end: false },
  { to: "/agent/commission",label: "Commission",       icon: TrendingUp,      end: false },
  { to: "/agent/downloads", label: "Downloads",        icon: Download,        end: false },
];

export default function AgentLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const tier = TIER_CFG[AGENT_PROFILE.tier];
  const lowBalance = AGENT_PROFILE.walletBalance < 30000;

  const crumb = NAV.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to));

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-200"
        style={{ width: collapsed ? 56 : 224, background: "#0F172A" }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-3 py-4 border-b border-white/8 ${collapsed ? "justify-center" : ""}`}>
          <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: "linear-gradient(135deg,#14213D,#F97316)" }}>
            <span className="text-white text-[10px] font-black">ST</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-[11px] font-bold leading-none truncate">Shanghai Travels</p>
              <p className="text-white/30 text-[9px] leading-none mt-0.5">Agent Portal</p>
            </div>
          )}
        </div>

        {/* Wallet mini-card */}
        {!collapsed && (
          <div className="mx-3 mt-3 rounded-xl p-3 border border-white/8" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-white/35 text-[9px] font-bold uppercase tracking-widest">Wallet</p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>{tier.label}</span>
            </div>
            <p className={`text-[15px] font-bold font-mono leading-none ${lowBalance ? "text-red-400" : "text-emerald-400"}`}>
              {fmtAED(AGENT_PROFILE.walletBalance)}
            </p>
            {lowBalance && (
              <div className="flex items-center gap-1 mt-1.5">
                <AlertCircle size={9} className="text-amber-400" />
                <p className="text-amber-400 text-[9px] font-semibold">Low balance</p>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-1.5">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-all group
                ${isActive
                  ? item.accent
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-emerald-500/12 text-emerald-400"
                  : item.accent
                    ? "text-emerald-400/70 hover:bg-emerald-500/8 hover:text-emerald-400"
                    : "text-white/45 hover:bg-white/6 hover:text-white/80"
                } ${collapsed ? "justify-center" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-emerald-400" />
                  )}
                  <item.icon size={13} className="flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {collapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Agent ID footer */}
        {!collapsed && (
          <div className="px-3 pb-3 border-t border-white/8 pt-3">
            <p className="text-white/25 text-[9px] font-mono">{AGENT_PROFILE.agentId}</p>
            <p className="text-white/40 text-[9px] truncate mt-0.5">{AGENT_PROFILE.name}</p>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center justify-center py-3 border-t border-white/8 text-white/25 hover:text-white/60 transition-colors"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-5 py-3 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-slate-400 font-medium truncate">
              Agent Portal
              {crumb && <> <span className="mx-1.5 text-slate-300">/</span> <span className="text-slate-600">{crumb.label}</span></>}
            </p>
          </div>

          {lowBalance && (
            <Link to="/agent/wallet" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold hover:bg-amber-100 transition-colors flex-shrink-0">
              <AlertCircle size={11} />
              Low wallet balance — Top up
            </Link>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-500">{AGENT_PROFILE.agentId}</span>
            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <Bell size={14} />
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-[#F97316]" />
            </button>
            <Link to="/" className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
              <ExternalLink size={10} /> Main Site
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
