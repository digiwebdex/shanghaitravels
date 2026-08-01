import { NavLink } from "react-router";
import { useAuth } from "@/auth/AuthProvider";

const LINKS: { to: string; label: string; end?: boolean; perm?: string }[] = [
  { to: "/partners", label: "Overview", end: true, perm: "customer:read" },
  { to: "/customers", label: "Customers", perm: "customer:read" },
  { to: "/partners/agents", label: "Agents", perm: "commission:read" },
  { to: "/partners/corporate", label: "Corporate Clients", perm: "customer:read" },
  { to: "/partners/suppliers", label: "Suppliers", end: true, perm: "supplier:read" },
];

export function PartnerModuleNav() {
  const { can } = useAuth();
  return (
    <nav className="flex flex-wrap gap-1" aria-label="Business partners module">
      {LINKS.filter((l) => !l.perm || can(l.perm)).map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={!!l.end}
          className={({ isActive }) =>
            `rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
              isActive
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
