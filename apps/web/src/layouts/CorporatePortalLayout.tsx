import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  LayoutDashboard, Building2, Users, FileText, CheckSquare, Briefcase, Landmark, MessageSquare, BarChart2, LogOut,
} from "lucide-react";
import { corporatePortalApi } from "@/lib/corporatePortalApi";

const NAV = [
  { to: "/portal/corporate", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/portal/corporate/company", label: "Company", icon: Building2 },
  { to: "/portal/corporate/employees", label: "Employees", icon: Users },
  { to: "/portal/corporate/requests", label: "Requests", icon: FileText },
  { to: "/portal/corporate/approvals", label: "Approvals", icon: CheckSquare },
  { to: "/portal/corporate/bookings", label: "Bookings", icon: Briefcase },
  { to: "/portal/corporate/finance", label: "Finance", icon: Landmark },
  { to: "/portal/corporate/communications", label: "Communications", icon: MessageSquare },
  { to: "/portal/corporate/reports", label: "Reports", icon: BarChart2 },
];

export default function CorporatePortalLayout() {
  const nav = useNavigate();
  const [name, setName] = useState("Corporate user");
  const [companyName, setCompanyName] = useState("");
  const [mustChange, setMustChange] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void corporatePortalApi
      .me()
      .then((m) => {
        setName(String(m.user?.name || m.user?.email || "Corporate user"));
        setCompanyName(String(m.company?.companyName || ""));
        setMustChange(!!m.user?.mustChangePassword);
      })
      .catch(() => nav("/portal/corporate/login"));
  }, [nav]);

  async function logout() {
    await corporatePortalApi.logout().catch(() => null);
    nav("/portal/corporate/login");
  }

  async function changePw() {
    try {
      await corporatePortalApi.changePassword(current, next);
      setMustChange(false);
      setCurrent("");
      setNext("");
    } catch (e: any) {
      setError(e?.message || "Password change failed");
    }
  }

  if (mustChange) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-sm bg-white border rounded-xl p-5 space-y-3">
          <h1 className="text-[16px] font-bold">Change temporary password</h1>
          <input type="password" className="w-full border rounded-lg px-3 py-2 text-[12px]" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <input type="password" className="w-full border rounded-lg px-3 py-2 text-[12px]" placeholder="New password (min 8)" value={next} onChange={(e) => setNext(e.target.value)} />
          {error && <p className="text-red-600 text-[11px]">{error}</p>}
          <button type="button" onClick={() => void changePw()} className="w-full py-2 rounded-lg bg-teal-600 text-white text-[12px] font-bold">
            Save password
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-56 bg-slate-800 text-white flex flex-col">
        <div className="px-4 py-5 border-b border-white/10">
          <div className="font-bold text-[14px]">Shanghai Travels</div>
          <div className="text-[10px] text-teal-300/80">Corporate Portal</div>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] ${
                  isActive ? "bg-teal-600/30 text-teal-100" : "text-white/60 hover:bg-white/10"
                }`
              }
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 text-[11px]">
          <div className="font-semibold truncate">{name}</div>
          <div className="text-teal-300/60 truncate mb-2">{companyName}</div>
          <button type="button" onClick={() => void logout()} className="flex items-center gap-2 text-white/60 hover:text-red-300">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
