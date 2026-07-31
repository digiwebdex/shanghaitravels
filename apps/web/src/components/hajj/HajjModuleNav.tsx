import { NavLink } from "react-router";

const LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: "/hajj", label: "Bookings", end: true },
  { to: "/hajj/packages", label: "Packages" },
  { to: "/hajj/pilgrims", label: "Pilgrims" },
  { to: "/hajj/groups", label: "Groups" },
  { to: "/hajj/reports", label: "Reports" },
];

export function HajjModuleNav() {
  return (
    <nav className="flex flex-wrap gap-1 mb-4" aria-label="Hajj and Umrah module">
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
