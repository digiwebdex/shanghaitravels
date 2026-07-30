import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard, Users, FileText, CheckSquare,
  CreditCard, BarChart2, Settings, LogOut,
  Bell, Building2, ChevronRight, Menu, X,
} from "lucide-react";

const NAV = [
  { to: "/corporate/dashboard",    label: "Dashboard",           icon: LayoutDashboard },
  { to: "/corporate/employees",    label: "Employees",           icon: Users },
  { to: "/corporate/applications", label: "Applications",        icon: FileText },
  { to: "/corporate/approvals",    label: "Approvals & Billing", icon: CheckSquare, badge: 3 },
  { to: "/corporate/credit",       label: "Credit & Usage",      icon: CreditCard },
  { to: "/corporate/reports",      label: "Invoices & Reports",  icon: BarChart2 },
];

export default function CorporateLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <div className="flex h-screen bg-[#EEF0F4] overflow-hidden font-sans">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`flex flex-col flex-shrink-0 bg-[#0B1829] transition-all duration-200 ${
          collapsed ? "w-[58px]" : "w-[216px]"
        }`}
      >
        {/* Company identity */}
        <div
          className={`flex items-center gap-2.5 border-b border-white/8 py-4 ${
            collapsed ? "justify-center px-0" : "px-4"
          }`}
        >
          <div className="size-8 rounded-lg bg-[#F97316] flex items-center justify-center flex-shrink-0">
            <Building2 size={15} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="text-white font-bold text-[13px] truncate">ACME Corp</p>
              <p className="text-white/35 text-[9px] font-medium tracking-wide uppercase">Corporate Account</p>
            </div>
          )}
        </div>

        {/* Section label */}
        {!collapsed && (
          <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.12em] px-4 pt-5 pb-1.5">
            Travel Management
          </p>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`relative flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg transition-all group ${
                  active
                    ? "bg-white/12 text-white"
                    : "text-white/45 hover:bg-white/7 hover:text-white/80"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#F97316] rounded-r-full" />
                )}
                <item.icon
                  size={15}
                  className={`flex-shrink-0 ${active ? "text-[#F97316]" : ""}`}
                />
                {!collapsed && (
                  <>
                    <span className="text-[12.5px] font-medium flex-1 truncate">
                      {item.label}
                    </span>
                    {item.badge != null && (
                      <span className="size-4 rounded-full bg-[#F97316] flex items-center justify-center text-[9px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom utility + user */}
        <div className="border-t border-white/8 px-2 py-3 space-y-0.5">
          <button
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-white/35 hover:bg-white/7 hover:text-white/70 transition-all ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <Settings size={14} />
            {!collapsed && <span className="text-[12px]">Settings</span>}
          </button>
          <button
            onClick={() => navigate("/portal/login")}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-white/35 hover:bg-white/7 hover:text-red-400 transition-all ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={14} />
            {!collapsed && <span className="text-[12px]">Sign Out</span>}
          </button>

          {!collapsed && (
            <div className="mt-2 p-2.5 bg-white/6 rounded-xl flex items-center gap-2">
              <div className="size-6 rounded-full bg-[#F97316] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                F
              </div>
              <div className="min-w-0">
                <p className="text-white text-[11px] font-semibold truncate">Fatima Al-Hassan</p>
                <p className="text-white/30 text-[9px]">Admin · ACME Corp</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-12 px-5 bg-white border-b border-[#E2E5EA] flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="p-1.5 rounded-md hover:bg-[#EEF0F4] text-[#94A3B8] transition-colors"
            >
              {collapsed ? <Menu size={15} /> : <X size={15} />}
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
              <Link to="/corporate/dashboard" className="hover:text-[#0B1829] transition-colors">
                Corporate
              </Link>
              <ChevronRight size={10} />
              <span className="text-[#0B1829] font-semibold capitalize">
                {location.pathname.replace("/corporate/", "").split("/")[0] || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[11px] text-[#94A3B8] border border-[#E2E5EA] rounded-lg px-2.5 py-1.5">
              Jan 2025
            </div>
            <button className="relative p-1.5 rounded-md hover:bg-[#EEF0F4] text-[#94A3B8] transition-colors">
              <Bell size={15} />
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-[#F97316]" />
            </button>
            <Link
              to="/"
              className="text-[11px] text-[#94A3B8] hover:text-[#0B1829] transition-colors px-2.5 py-1.5 rounded-md hover:bg-[#EEF0F4]"
            >
              ← Main Site
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
