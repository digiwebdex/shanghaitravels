import { NavLink } from "react-router";

const LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: "/finance", label: "Chart of Accounts", end: true },
  { to: "/finance/groups", label: "Groups" },
  { to: "/finance/periods", label: "Periods" },
  { to: "/finance/cost-centers", label: "Cost Centers" },
  { to: "/finance/currencies", label: "Currencies" },
  { to: "/finance/journals", label: "Journals" },
  { to: "/finance/ar", label: "AR" },
  { to: "/finance/ap", label: "AP" },
  { to: "/finance/ar-ap-reports", label: "AR/AP Reports" },
  { to: "/finance/reports", label: "GL Reports" },
];

export function FinanceModuleNav() {
  return (
    <nav className="flex flex-wrap gap-1 mb-4" aria-label="Finance ERP module">
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
