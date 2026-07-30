import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  Command,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Plus,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  FileCheck,
  BookOpen,
  Users,
  GitBranch,
  Plane,
  Building2,
  Car,
  Map,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { ORG_NAME } from "@/config/env";
import { LIVE_MODULES } from "@/config/env";

type NavItem = { id: string; label: string; to: string; icon: LucideIcon; perm?: string };

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", to: "/", icon: LayoutDashboard },
  { id: "customers", label: "Customer Management", to: "/customers", icon: User, perm: "customer:read" },
  { id: "visa", label: "Visa Management", to: "/visa", icon: FileCheck, perm: "application:read" },
  { id: "ticketing", label: "Air Ticketing", to: "/ticketing", icon: Plane, perm: "application:read" },
  { id: "hotels", label: "Hotels", to: "/hotels", icon: Building2, perm: "application:read" },
  { id: "transport", label: "Transport", to: "/transport", icon: Car, perm: "application:read" },
  { id: "tours", label: "Tour Packages", to: "/tours", icon: Map, perm: "application:read" },
  { id: "hajj", label: "Hajj & Umrah", to: "/hajj", icon: Moon, perm: "application:read" },
  { id: "passports", label: "Passport Management", to: "/passports", icon: BookOpen, perm: "customer:read" },
  { id: "case-journey", label: "Case Journey Map", to: "/case-journey", icon: GitBranch, perm: "application:read" },
];

function SidebarItem({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const live = LIVE_MODULES.has(item.id) || item.id === "dashboard";
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `relative flex items-center gap-1.5 rounded-md transition-all duration-100
        ${collapsed ? "justify-center p-2" : "px-2 py-[5px]"}
        ${isActive ? "bg-amber-500/10 text-amber-300" : "text-white/40 hover:bg-white/[0.06] hover:text-white/65"}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-amber-400" />
          )}
          {!collapsed && (
            <span
              className="size-[5px] rounded-full flex-shrink-0 ml-1"
              style={{ backgroundColor: isActive ? "#F59E0B" : live ? "#10B981" : "#64748B" }}
            />
          )}
          <Icon size={11} className={`flex-shrink-0 ${isActive ? "text-amber-400" : ""}`} />
          {!collapsed && (
            <span className="text-[10px] font-semibold leading-none flex-1 truncate">{item.label}</span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 1024,
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [profileOpen]);

  const initials = (user?.fullName || user?.email || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const nav = NAV.filter((n) => !n.perm || can(n.perm));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0F2F5" }}>
      <aside
        className="flex flex-col flex-shrink-0 transition-[width] duration-200 relative z-20"
        style={{ background: "#0D1117", width: collapsed ? 44 : 220 }}
      >
        <div
          className={`flex items-center gap-2.5 border-b border-white/[0.06] flex-shrink-0 ${
            collapsed ? "px-2 py-3 justify-center" : "px-3.5 py-3"
          }`}
        >
          <div
            className="size-[26px] rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
          >
            <Command size={13} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-[10px] font-black tracking-[0.08em] leading-none">ADMIN ERP</p>
              <p className="text-white/25 text-[8px] mt-0.5 leading-none">{ORG_NAME}</p>
            </div>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto py-2 scrollbar-hide ${collapsed ? "px-1" : "px-2"}`}>
          {!collapsed && (
            <p className="text-[7.5px] font-black text-white/20 uppercase tracking-[0.16em] px-2 pb-1.5">
              Phase A — Visa vertical
            </p>
          )}
          <div className="space-y-[1px]">
            {nav.map((m) => (
              <SidebarItem key={m.id} item={m} collapsed={collapsed} />
            ))}
          </div>
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-[62px] z-30 size-6 rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 shadow-md flex items-center justify-center transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={9} /> : <ChevronLeft size={9} />}
        </button>

        {!collapsed && (
          <div className="px-3 py-2 border-t border-white/[0.06] flex-shrink-0">
            <p className="text-[7.5px] font-mono text-white/15">v0.1.0 · Phase A · Dhaka</p>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="flex items-center gap-3 px-4 bg-white border-b border-slate-200 flex-shrink-0"
          style={{ height: 52 }}
        >
          <div className="flex items-center gap-2 flex-1 max-w-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
            <Search size={12} className="text-slate-400 flex-shrink-0" />
            <span className="text-[10.5px] text-slate-400 flex-1 select-none">
              Search applications, customers…
            </span>
            <Users size={11} className="text-slate-300" />
          </div>

          <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
              title="Notifications (Phase D)"
            >
              <Bell size={15} className="text-slate-500" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/visa/new")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
            >
              <Plus size={12} /> New Visa Case
            </button>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                  profileOpen ? "bg-slate-100" : "hover:bg-slate-100"
                }`}
              >
                <div
                  className="size-7 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                  style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
                >
                  {initials}
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-[10.5px] font-bold text-slate-800 leading-none">
                    {user?.fullName || user?.email}
                  </p>
                  <p className="text-[8.5px] text-slate-400 mt-0.5">{user?.role}</p>
                </div>
                <ChevronDown
                  size={9}
                  className={`text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-slate-100">
                    <p className="text-[12px] font-bold text-slate-800">{user?.fullName || "—"}</p>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">{user?.email}</p>
                    <span className="inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      {user?.role}
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/change-password");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <User size={12} className="text-slate-400" /> Change password
                    </button>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await logout();
                          navigate("/login", { replace: true });
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={12} /> Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
