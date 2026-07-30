import { useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { CUSTOMERS } from "./data";
import { Link } from "react-router";

const th = "px-4 py-2 text-left text-[9.5px] font-bold text-slate-400 uppercase tracking-wide";

export default function Customers() {
  const [search, setSearch] = useState("");

  const rows = CUSTOMERS.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.passportNo.toLowerCase().includes(search.toLowerCase()) ||
    c.nationality.toLowerCase().includes(search.toLowerCase())
  );

  const TAG_COLOR: Record<string, string> = {
    VIP:       "bg-amber-100 text-amber-700 border-amber-200",
    Corporate: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <div className="p-5 space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-[18px] font-bold">Customers</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">{CUSTOMERS.length} registered applicants</p>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" placeholder="Search name, email, passport…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 w-60 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Name","Nationality","Passport No","Contact","Total Apps","Active Case","Last Contact","Tags",""].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-full bg-sky-100 text-sky-700 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                        {c.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                      </div>
                      <p className="text-[12px] font-semibold text-slate-800">{c.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-600">{c.nationality}</td>
                  <td className="px-4 py-3 font-mono text-[10.5px] font-bold text-slate-700">{c.passportNo}</td>
                  <td className="px-4 py-3">
                    <p className="text-[11px] text-slate-700">{c.email}</p>
                    <p className="text-[9.5px] text-slate-400">{c.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[13px] font-bold text-slate-800">{c.totalApps}</span>
                  </td>
                  <td className="px-4 py-3">
                    {c.activeApp ? (
                      <Link to="/staff/apps" className="flex items-center gap-1 text-[10px] font-mono font-bold text-sky-600 hover:underline">
                        {c.activeApp} <ExternalLink size={9} />
                      </Link>
                    ) : (
                      <span className="text-[10px] text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[10.5px] text-slate-500 whitespace-nowrap">{c.lastContact}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map(tag => (
                        <span key={tag} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${TAG_COLOR[tag] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link to="/staff/apps" className="text-[10.5px] font-semibold text-sky-600 hover:underline">View</Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[11px] text-slate-400">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
