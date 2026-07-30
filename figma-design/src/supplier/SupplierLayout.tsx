import { Outlet, NavLink, Link, useLocation } from "react-router";
import {
  LayoutDashboard, Inbox, Settings, FileText,
  CreditCard, BarChart2, ScrollText, Bell, ExternalLink, Star,
} from "lucide-react";
import { SUPPLIER } from "./data";

const NAV = [
  { to: "/supplier",            label: "Dashboard",       icon: LayoutDashboard, end: true  },
  { to: "/supplier/requests",   label: "Booking Requests",icon: Inbox,           end: false, badge: 3 },
  { to: "/supplier/services",   label: "Manage Services", icon: Settings,        end: false },
  { to: "/supplier/invoices",   label: "Invoices",        icon: FileText,        end: false },
  { to: "/supplier/payments",   label: "Payments",        icon: CreditCard,      end: false },
  { to: "/supplier/performance",label: "Performance",     icon: BarChart2,       end: false },
  { to: "/supplier/contracts",  label: "Contracts",       icon: ScrollText,      end: false },
];

export default function SupplierLayout() {
  const location = useLocation();
  const crumb = NAV.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F7F8FA" }}>
      {/* Sidebar */}
      <aside className="flex flex-col w-56 flex-shrink-0" style={{ background: "#18181B" }}>
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/6">
          <div className="size-7 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)" }}>
            <span className="text-white text-[10px] font-black">ST</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-[11px] font-bold leading-none truncate">Shanghai Travels</p>
            <p className="text-white/30 text-[9px] leading-none mt-0.5">Supplier Portal</p>
          </div>
        </div>

        {/* Supplier identity */}
        <div className="mx-3 mt-3 rounded-xl p-3 border border-white/6" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-amber-400 text-[10px] font-bold">{SUPPLIER.rating}</span>
            <span className="text-white/25 text-[9px]">({SUPPLIER.totalReviews} reviews)</span>
          </div>
          <p className="text-white/70 text-[10px] font-semibold leading-tight truncate">{SUPPLIER.name}</p>
          <p className="text-white/30 text-[9px] mt-0.5">{SUPPLIER.supplierId}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-all
                ${isActive
                  ? "bg-violet-500/15 text-violet-300"
                  : "text-white/40 hover:bg-white/5 hover:text-white/70"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-violet-400" />}
                  <item.icon size={13} className="flex-shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="size-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-3 border-t border-white/6 pt-3">
          <p className="text-white/25 text-[9px] font-mono">{SUPPLIER.supplierId}</p>
          <p className="text-white/35 text-[9px] mt-0.5">{SUPPLIER.category}</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-5 py-3 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-slate-400 font-medium truncate">
              Supplier Portal
              {crumb && <> <span className="mx-1.5 text-slate-300">/</span> <span className="text-slate-600">{crumb.label}</span></>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-500">{SUPPLIER.supplierId}</span>
            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              <Bell size={14} />
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-violet-500" />
            </button>
            <Link to="/" className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
              <ExternalLink size={10} /> Main Site
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
