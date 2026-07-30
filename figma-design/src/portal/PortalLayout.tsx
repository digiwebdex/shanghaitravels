import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard, FilePlus, FileText, Upload, CreditCard,
  MessageSquare, Settings, LogOut, Bell, ChevronRight, Menu, X, User
} from "lucide-react";

const NAV = [
  { to: "/portal/dashboard",  label: "Dashboard",         icon: LayoutDashboard },
  { to: "/portal/apply",      label: "New Application",   icon: FilePlus },
  { to: "/portal/documents",  label: "Documents",         icon: Upload },
  { to: "/portal/payment/app-001", label: "Payments",    icon: CreditCard },
  { to: "/portal/support",    label: "Support",           icon: MessageSquare },
];

export default function PortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (to: string) => location.pathname === to || (to !== "/portal/dashboard" && location.pathname.startsWith(to.split("/").slice(0, 3).join("/")));

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-primary transition-all duration-200 flex-shrink-0 ${collapsed ? "w-16" : "w-60"}`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? "justify-center" : ""}`}>
          <div className="size-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">T</span>
          </div>
          {!collapsed && (
            <div>
              <p className="text-white font-bold text-sm leading-none">TravelOS</p>
              <p className="text-white/40 text-[10px] mt-0.5">Customer Portal</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = isActive(item.to);
            return (
              <Link key={item.to} to={item.to} className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all group ${active ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/80"}`}>
                <item.icon size={17} className={`flex-shrink-0 ${active ? "text-accent" : ""}`} />
                {!collapsed && <span className="text-[13px] font-medium">{item.label}</span>}
                {!collapsed && active && <ChevronRight size={12} className="ml-auto text-white/30" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className={`border-t border-white/10 py-4 space-y-0.5 ${collapsed ? "px-2" : "px-2"}`}>
          <Link to="/portal/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/8 hover:text-white/80 transition-all">
            <Settings size={16} />
            {!collapsed && <span className="text-[13px]">Settings</span>}
          </Link>
          <button onClick={() => navigate("/portal/login")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/8 hover:text-red-400 transition-all">
            <LogOut size={16} />
            {!collapsed && <span className="text-[13px]">Sign Out</span>}
          </button>
          {!collapsed && (
            <div className="mt-3 mx-1 p-3 bg-white/8 rounded-xl flex items-center gap-2.5">
              <div className="size-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <User size={13} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-[12px] font-semibold truncate">Ahmad Al-Rashidi</p>
                <p className="text-white/40 text-[10px] truncate">ahmad@example.com</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-14 px-6 bg-card border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setCollapsed(c => !c)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
              {collapsed ? <Menu size={16} /> : <X size={16} />}
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link to="/portal/dashboard" className="hover:text-foreground transition-colors">Portal</Link>
              <ChevronRight size={11} />
              <span className="text-foreground font-medium capitalize">
                {location.pathname.replace("/portal/", "").split("/")[0] || "Dashboard"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-accent" />
            </button>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted">
              ← Main Site
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
