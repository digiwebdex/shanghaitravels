import { NavLink } from "react-router";

const LINKS = [
  { to: "/cms", label: "Pages", end: true },
  { to: "/cms/hero-services", label: "Hero Services" },
  { to: "/cms/menus", label: "Menus" },
  { to: "/cms/media", label: "Media" },
  { to: "/cms/banners", label: "Banners" },
  { to: "/cms/content", label: "Content" },
  { to: "/cms/travel", label: "Travel" },
  { to: "/cms/forms", label: "Forms" },
  { to: "/cms/seo", label: "SEO" },
  { to: "/cms/reports", label: "Reports" },
];

export function CmsModuleNav() {
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
