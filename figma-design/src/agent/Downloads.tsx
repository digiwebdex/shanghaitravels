import { useState } from "react";
import { Download, FileText, BarChart2, Shield, CheckSquare, Archive, Search, X, Check } from "lucide-react";

type Category = "invoices" | "reports" | "documents" | "confirmations";

interface DownloadItem {
  id: string;
  name: string;
  category: Category;
  date: string;
  size: string;
  type: string;
}

const ITEMS: DownloadItem[] = [
  { id: "d1",  name: "Invoice INV-2025-001",          category: "invoices",       date: "01 Jan 2025", size: "184 KB", type: "PDF"  },
  { id: "d2",  name: "Invoice INV-2024-012",          category: "invoices",       date: "01 Dec 2024", size: "201 KB", type: "PDF"  },
  { id: "d3",  name: "Invoice INV-2024-011",          category: "invoices",       date: "01 Nov 2024", size: "197 KB", type: "PDF"  },
  { id: "d4",  name: "Invoice INV-2024-010",          category: "invoices",       date: "01 Oct 2024", size: "162 KB", type: "PDF"  },
  { id: "d5",  name: "Invoice INV-2024-009",          category: "invoices",       date: "01 Sep 2024", size: "218 KB", type: "PDF"  },
  { id: "d6",  name: "Commission Report — Jan 2025",  category: "reports",        date: "09 Jan 2025", size: "342 KB", type: "PDF"  },
  { id: "d7",  name: "Booking Summary — Q4 2024",     category: "reports",        date: "01 Jan 2025", size: "1.2 MB", type: "XLSX" },
  { id: "d8",  name: "Passenger Manifest — Dec 2024", category: "reports",        date: "31 Dec 2024", size: "88 KB",  type: "CSV"  },
  { id: "d9",  name: "Annual Revenue Report 2024",    category: "reports",        date: "01 Jan 2025", size: "2.1 MB", type: "PDF"  },
  { id: "d10", name: "Trade License — DED-987654",    category: "documents",      date: "15 Jun 2023", size: "512 KB", type: "PDF"  },
  { id: "d11", name: "IATA Certificate",              category: "documents",      date: "30 Nov 2023", size: "398 KB", type: "PDF"  },
  { id: "d12", name: "VAT Registration Certificate", category: "documents",      date: "10 Jan 2023", size: "224 KB", type: "PDF"  },
  { id: "d13", name: "Visa Confirmation — AGT-38801", category: "confirmations",  date: "07 Jan 2025", size: "145 KB", type: "PDF"  },
  { id: "d14", name: "Ticket Etickets — AGT-38802",   category: "confirmations",  date: "02 Jan 2025", size: "289 KB", type: "PDF"  },
  { id: "d15", name: "Hotel Voucher — AGT-38803",     category: "confirmations",  date: "28 Dec 2024", size: "178 KB", type: "PDF"  },
  { id: "d16", name: "Catering Confirmation — AGT-38806", category: "confirmations", date: "05 Jan 2025", size: "112 KB", type: "PDF" },
];

const TEMPLATES = [
  { label: "Monthly Commission Summary",  desc: "Breakdown of earnings by service type and booking" },
  { label: "Passenger Manifest",          desc: "All passengers booked in the selected date range" },
  { label: "Booking Status Report",       desc: "Status overview with amounts and commission" },
  { label: "Outstanding Invoices",        desc: "Unpaid and overdue invoice summary" },
];

const CAT_CFG: Record<Category | "all", { label: string; icon: any }> = {
  all:           { label: "All Files",      icon: Archive       },
  invoices:      { label: "Invoices",       icon: FileText      },
  reports:       { label: "Reports",        icon: BarChart2     },
  documents:     { label: "Documents",      icon: Shield        },
  confirmations: { label: "Confirmations",  icon: CheckSquare   },
};

const TYPE_COLOR: Record<string, string> = {
  PDF:  "bg-red-50 text-red-600",
  XLSX: "bg-green-50 text-green-700",
  CSV:  "bg-blue-50 text-blue-700",
};

export default function Downloads() {
  const [cat,    setCat]    = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [sel,    setSel]    = useState<string[]>([]);
  const [done,   setDone]   = useState(false);

  const rows = ITEMS.filter(i =>
    (cat === "all" || i.category === cat) &&
    i.name.toLowerCase().includes(search.toLowerCase())
  );
  const toggle = (id: string) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSel(sel.length === rows.length ? [] : rows.map(i => i.id));

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-[20px] font-bold">Download Center</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">{ITEMS.length} files available</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#14213D] text-white text-[12px] font-bold hover:bg-[#1a2d54] transition-colors">
          <Download size={13} /> Download All
        </button>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-5 gap-3">
        {(Object.entries(CAT_CFG) as [Category | "all", typeof CAT_CFG["all"]][]).map(([k, cfg]) => {
          const count = k === "all" ? ITEMS.length : ITEMS.filter(i => i.category === k).length;
          return (
            <button key={k} onClick={() => setCat(k)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${cat === k ? "border-[#14213D] bg-[#14213D] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
              <cfg.icon size={18} className={cat === k ? "text-white" : "text-slate-400"} />
              <p className="text-[11px] font-bold">{cfg.label}</p>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cat === k ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Bulk action */}
      {sel.length > 0 && (
        <div className="flex items-center gap-5 px-4 py-3 bg-[#14213D] rounded-xl">
          <span className="text-white text-[12px] font-semibold">{sel.length} file{sel.length > 1 ? "s" : ""} selected</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setDone(true)} className="flex items-center gap-1.5 text-[11px] font-semibold px-4 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
              <Archive size={12} /> Download as ZIP
            </button>
            <button onClick={() => setSel([])} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/50"><X size={12} /></button>
          </div>
        </div>
      )}

      {done && (
        <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="size-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"><Check size={13} className="text-emerald-600" /></div>
          <p className="text-[12px] font-semibold text-emerald-700">Your download is ready. {sel.length} file{sel.length > 1 ? "s" : ""} packaged as ZIP.</p>
          <button onClick={() => setDone(false)} className="ml-auto text-[11px] font-bold text-emerald-600 hover:underline">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* File list */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…" className="w-full pl-8 pr-3 py-2 text-[12px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[#14213D] placeholder:text-slate-400" />
            </div>
            <span className="text-[11px] text-slate-400">{rows.length} file{rows.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" className="accent-[#F97316]" checked={sel.length === rows.length && rows.length > 0} onChange={toggleAll} />
                  </th>
                  {["File Name","Type","Date","Size",""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map(item => (
                  <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${sel.includes(item.id) ? "bg-blue-50/30" : ""}`}>
                    <td className="px-4 py-3.5"><input type="checkbox" className="accent-[#F97316]" checked={sel.includes(item.id)} onChange={() => toggle(item.id)} /></td>
                    <td className="px-4 py-3.5">
                      <p className="text-[12px] font-semibold text-slate-800">{item.name}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_COLOR[item.type] ?? "bg-slate-100 text-slate-600"}`}>{item.type}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-400 whitespace-nowrap">{item.date}</td>
                    <td className="px-4 py-3.5 text-[11px] font-mono text-slate-400">{item.size}</td>
                    <td className="px-3 py-3.5">
                      <button className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors">
                        <Download size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate reports panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-[13px] font-bold text-slate-800 mb-4">Generate Report</p>
            <div className="space-y-3">
              {TEMPLATES.map(t => (
                <div key={t.label} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer group">
                  <BarChart2 size={14} className="text-slate-400 group-hover:text-[#14213D] mt-0.5 flex-shrink-0 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800">{t.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                  </div>
                  <Download size={12} className="text-slate-300 group-hover:text-[#F97316] flex-shrink-0 transition-colors mt-0.5" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-[13px] font-bold text-slate-800 mb-4">Custom Date Range</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1.5">From</label>
                <input type="date" className="w-full px-3 py-2.5 text-[12px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[#14213D]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1.5">To</label>
                <input type="date" className="w-full px-3 py-2.5 text-[12px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[#14213D]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1.5">Report Type</label>
                <select className="w-full px-3 py-2.5 text-[12px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none appearance-none text-slate-600">
                  <option>All Transactions</option>
                  <option>Commission Summary</option>
                  <option>Booking Report</option>
                  <option>Passenger Manifest</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1.5">Format</label>
                <div className="flex gap-2">
                  {["PDF","XLSX","CSV"].map(f => (
                    <button key={f} className="flex-1 py-2 rounded-lg text-[11px] font-semibold border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">{f}</button>
                  ))}
                </div>
              </div>
              <button className="w-full py-2.5 rounded-xl bg-[#14213D] text-white text-[12px] font-bold hover:bg-[#1a2d54] transition-colors flex items-center justify-center gap-2">
                <Download size={13} /> Generate & Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
