import { NavLink } from "react-router";

const LINKS = [
  { to: "/comms", label: "Timeline", end: true },
  { to: "/comms/email", label: "Email" },
  { to: "/comms/whatsapp", label: "WhatsApp" },
  { to: "/comms/sms", label: "SMS" },
  { to: "/comms/activities", label: "Activities" },
  { to: "/comms/reports", label: "Reports" },
];

export function CommsModuleNav() {
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
