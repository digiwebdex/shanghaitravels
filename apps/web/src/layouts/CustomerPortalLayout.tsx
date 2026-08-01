import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Landmark,
  MessageSquare,
  User,
  BarChart2,
  LogOut,
  Package,
  Heart,
  Briefcase,
  History,
} from "lucide-react";
import { customerPortalApi } from "@/lib/portalApi";

const NAV = [
  { to: "/portal/customer", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/portal/customer/packages", label: "Browse Packages", icon: Package },
  { to: "/portal/customer/packages/wishlist", label: "Wishlist", icon: Heart },
  { to: "/portal/customer/packages/my", label: "My Packages", icon: Briefcase },
  { to: "/portal/customer/packages/history", label: "Package History", icon: History },
  { to: "/portal/customer/applications", label: "Applications", icon: FileText },
  { to: "/portal/customer/documents", label: "Documents", icon: Upload },
  { to: "/portal/customer/finance", label: "Finance", icon: Landmark },
  { to: "/portal/customer/communications", label: "Communications", icon: MessageSquare },
  { to: "/portal/customer/profile", label: "Profile", icon: User },
  { to: "/portal/customer/reports", label: "Reports", icon: BarChart2 },
];

export default function CustomerPortalLayout() {
  const nav = useNavigate();
  const [name, setName] = useState("Customer");
  const [email, setEmail] = useState("");
  const [mustChange, setMustChange] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void customerPortalApi
      .me()
      .then((m) => {
        setName(String(m.customer?.fullName || "Customer"));
        setEmail(String(m.user?.email || m.customer?.email || ""));
        setMustChange(!!m.user?.mustChangePassword);
      })
      .catch(() => nav("/portal/customer/login"));
  }, [nav]);

  async function logout() {
    await customerPortalApi.logout().catch(() => null);
    nav("/portal/customer/login");
  }

  async function changePw() {
    try {
      await customerPortalApi.changePassword(current, next);
      setMustChange(false);
      setCurrent("");
      setNext("");
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Password change failed");
    }
  }

  if (mustChange) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-sm bg-white border rounded-xl p-5 space-y-3">
          <h1 className="text-[16px] font-bold">Change temporary password</h1>
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 text-[12px]"
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 text-[12px]"
            placeholder="New password (min 8)"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          {error && <p className="text-red-600 text-[11px]">{error}</p>}
          <button
            type="button"
            onClick={() => void changePw()}
            className="w-full py-2 rounded-lg bg-amber-600 text-white text-[12px] font-bold"
          >
            Save password
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-56 bg-slate-950 text-white flex flex-col">
        <div className="px-4 py-5 border-b border-white/10">
          <div className="font-bold text-[14px]">Shanghai Travels</div>
          <div className="text-[10px] text-white/50">Customer Portal</div>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] ${
                  isActive ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10"
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
          <div className="text-white/40 truncate mb-2">{email}</div>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2 text-white/60 hover:text-red-300"
          >
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
