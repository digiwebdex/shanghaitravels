import { NavLink } from "react-router";

const LINKS = [
  { to: "/analytics", label: "Executive", end: true },
  { to: "/analytics/customers", label: "Customers" },
  { to: "/analytics/sales", label: "Sales" },
  { to: "/analytics/comms", label: "Comms" },
  { to: "/analytics/finance", label: "Finance" },
  { to: "/analytics/reports", label: "Reports" },
];

export function AnalyticsModuleNav() {
  return (
    <nav className="flex flex-wrap gap-1.5">
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            `px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border ${
              isActive
                ? "bg-amber-50 border-amber-300 text-amber-900"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
