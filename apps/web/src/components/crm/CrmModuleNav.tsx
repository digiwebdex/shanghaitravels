import { NavLink } from "react-router";

const LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: "/crm", label: "Leads", end: true },
  { to: "/crm/contacts", label: "Contacts" },
  { to: "/crm/organizations", label: "Organizations" },
  { to: "/crm/opportunities", label: "Opportunities" },
  { to: "/crm/activities", label: "Activities" },
  { to: "/crm/quotations", label: "Quotations" },
  { to: "/crm/reports", label: "Reports" },
  { to: "/sales", label: "Sales →" },
];

export function CrmModuleNav() {
  return (
    <nav className="flex flex-wrap gap-1 mb-4" aria-label="CRM module">
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
