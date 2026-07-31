import { NavLink } from "react-router";

const LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: "/products/packages", label: "Packages", end: true },
  { to: "/products/categories", label: "Categories" },
  { to: "/products/packages/pricing", label: "Pricing" },
  { to: "/products/gallery", label: "Gallery" },
  { to: "/products/availability", label: "Availability" },
  { to: "/products/reports", label: "Reports" },
];

export function PackageModuleNav() {
  return (
    <nav className="flex flex-wrap gap-1 mb-4" aria-label="Products and packages module">
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
