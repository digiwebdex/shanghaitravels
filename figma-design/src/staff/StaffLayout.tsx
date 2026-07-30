import { useState } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router";
import {
  LayoutDashboard, ClipboardList, FolderOpen, Users, Calendar,
  MessageSquare, FileStack, Bell, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle2, Clock, ExternalLink,
} from "lucide-react";
import { ME, TASKS } from "./data";

const NAV = [
  { to: "/staff",          label: "My Dashboard",   icon: LayoutDashboard, end: true  },
  { to: "/staff/tasks",    label: "Assigned Tasks",  icon: ClipboardList,   end: false },
  { to: "/staff/apps",     label: "Applications",    icon: FolderOpen,      end: false },
  { to: "/staff/customers",label: "Customers",       icon: Users,           end: false },
  { to: "/staff/calendar", label: "Calendar",        icon: Calendar,        end: false },
  { to: "/staff/chat",     label: "Internal Chat",   icon: MessageSquare,   end: false },
  { to: "/staff/docs",     label: "Documents",       icon: FileStack,       end: false },
];

export default function StaffLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const crumb = NAV.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to));

  const overdueCount  = TASKS.filter(t => !t.done && t.slaStatus === "overdue").length;
  const dueSoonCount  = TASKS.filter(t => !t.done && t.slaStatus === "due_soon").length;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F0F2F5" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-200 relative"
        style={{ background: "#1A2332", width: collapsed ? 44 : 200 }}
      >
        {/* Brand */}
        <div className={`flex items-center gap-2.5 border-b border-white/6 ${collapsed ? "px-2 py-3 justify-center" : "px-3.5 py-3"}`}>
          <div className="size-6 rounded-md flex items-center justify-center flex-shrink-0"
               style={{ background: "linear-gradient(135deg,#0EA5E9,#0284C7)" }}>
            <span className="text-white text-[9px] font-black">ST</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-[10px] font-bold leading-none">Staff Portal</p>
              <p className="text-white/30 text-[8.5px] mt-0.5">Shanghai Travels</p>
            </div>
          )}
        </div>

        {/* Me card */}
        {!collapsed && (
          <div className="mx-2.5 mt-2.5 rounded-lg p-2.5 border border-white/6" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-sky-500/30 text-sky-300 text-[9px] font-black flex items-center justify-center flex-shrink-0">
                {ME.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-white/80 text-[10px] font-semibold truncate">{ME.name}</p>
                <p className="text-white/30 text-[8.5px] truncate">{ME.role}</p>
              </div>
            </div>
            {/* SLA summary */}
            <div className="flex gap-1.5 mt-2">
              {overdueCount > 0 && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[8.5px] font-bold">
                  <AlertTriangle size={7} /> {overdueCount} OVR
                </span>
              )}
              {dueSoonCount > 0 && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[8.5px] font-bold">
                  <Clock size={7} /> {dueSoonCount} DUE
                </span>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto py-2 space-y-0.5 ${collapsed ? "px-1.5" : "px-2"}`}>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `relative flex items-center gap-2 rounded-md text-[10.5px] font-semibold transition-all
                ${collapsed ? "justify-center px-0 py-2" : "px-2 py-1.5"}
                ${isActive
                  ? "bg-sky-500/15 text-sky-300"
                  : "text-white/40 hover:bg-white/5 hover:text-white/65"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !collapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3.5 rounded-full bg-sky-400" />
                  )}
                  <item.icon size={12} className="flex-shrink-0" />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-20 z-10 size-6 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-700 shadow-sm flex items-center justify-center transition-colors"
        >
          {collapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
        </button>

        {/* Footer */}
        {!collapsed && (
          <div className="px-3 pb-3 pt-2 border-t border-white/6">
            <p className="text-white/20 text-[8.5px] font-mono">v2.4.1 · staff</p>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] text-slate-400 font-medium truncate">
              Staff Portal
              {crumb && (
                <> <span className="mx-1.5 text-slate-300">/</span>
                <span className="text-slate-600 font-semibold">{crumb.label}</span></>
              )}
            </p>
          </div>

          {/* Global SLA alerts in topbar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {overdueCount > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-[10.5px] font-bold">
                <AlertTriangle size={10} />
                {overdueCount} Overdue
              </div>
            )}
            {dueSoonCount > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10.5px] font-bold">
                <Clock size={10} />
                {dueSoonCount} Due Soon
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
              {ME.name.split(" ")[0]}
            </span>
            <button className="relative p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors">
              <Bell size={13} />
              {(overdueCount + dueSoonCount) > 0 && (
                <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-red-500" />
              )}
            </button>
            <Link to="/" className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-[10px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
              <ExternalLink size={9} /> Site
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
