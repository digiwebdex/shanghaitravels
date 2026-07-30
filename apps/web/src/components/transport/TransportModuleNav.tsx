import { NavLink } from "react-router";

const LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: "/transport", label: "Bookings", end: true },
  { to: "/transport/vehicles", label: "Vehicles" },
  { to: "/transport/routes", label: "Routes" },
  { to: "/transport/suppliers", label: "Suppliers" },
  { to: "/transport/reports", label: "Reports" },
];

export function TransportModuleNav() {
  return (
    <nav className="flex flex-wrap gap-1 mb-4" aria-label="Transport module">
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={!!l.end}
          className={({ isActive }) =>
            `px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold border transition-colors ${
              isActive
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
