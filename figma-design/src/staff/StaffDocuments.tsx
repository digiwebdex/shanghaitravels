import { useState } from "react";
import { Download, Upload, Search, CheckCircle2, Clock, XCircle } from "lucide-react";
import { STAFF_DOCS, DocCategory, DOC_CAT } from "./data";

const CAT_TABS: { key: DocCategory | "all"; label: string }[] = [
  { key: "all",      label: "All"         },
  { key: "passport", label: "Passports"   },
  { key: "visa_form",label: "Visa Forms"  },
  { key: "financial",label: "Financial"   },
  { key: "other",    label: "Other"       },
];

const STATUS_CFG = {
  verified: { label: "Verified", icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  pending:  { label: "Pending",  icon: Clock,        color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  rejected: { label: "Rejected", icon: XCircle,      color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"     },
};

const th = "px-4 py-2 text-left text-[9.5px] font-bold text-slate-400 uppercase tracking-wide";

export default function StaffDocuments() {
  const [cat, setCat]   = useState<DocCategory | "all">("all");
  const [search, setSearch] = useState("");

  const rows = STAFF_DOCS
    .filter(d => cat === "all" || d.category === cat)
    .filter(d =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.appRef || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.applicant || "").toLowerCase().includes(search.toLowerCase())
    );

  const pendingCount = STAFF_DOCS.filter(d => d.status === "pending").length;

  return (
    <div className="p-5 space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-[18px] font-bold">Documents</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {STAFF_DOCS.length} files · {pendingCount} awaiting review
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="Search documents…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-52 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 bg-white"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 text-white text-[10.5px] font-bold hover:bg-sky-600 transition-colors">
            <Upload size={11} /> Upload
          </button>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <Clock size={13} className="text-amber-600 flex-shrink-0" />
          <p className="text-[11.5px] font-semibold text-amber-700">
            {pendingCount} document{pendingCount > 1 ? "s" : ""} awaiting verification
          </p>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-1.5">
        {CAT_TABS.map(t => {
          const count = t.key === "all" ? STAFF_DOCS.length : STAFF_DOCS.filter(d => d.category === t.key).length;
          const active = cat === t.key;
          return (
            <button key={t.key} onClick={() => setCat(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-semibold transition-all
                ${active ? "bg-[#1A2332] text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              {t.label}
              <span className={`text-[8.5px] font-bold px-1 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Document Name","Category","Case Ref","Applicant","Uploaded By","Date","Size","Status",""].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(doc => {
                const st = STATUS_CFG[doc.status];
                const StIcon = st.icon;
                return (
                  <tr key={doc.id} className={`hover:bg-slate-50 transition-colors ${doc.status === "pending" ? "bg-amber-50/20" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="text-[11.5px] font-semibold text-slate-800">{doc.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {DOC_CAT[doc.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {doc.appRef
                        ? <span className="font-mono text-[10px] font-bold text-sky-600">{doc.appRef}</span>
                        : <span className="text-slate-300 text-[10px]">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-600">{doc.applicant || "—"}</td>
                    <td className="px-4 py-3 text-[10.5px] text-slate-500">{doc.uploadedBy}</td>
                    <td className="px-4 py-3 text-[10.5px] text-slate-500 whitespace-nowrap">{doc.uploadedAt}</td>
                    <td className="px-4 py-3 text-[10px] font-mono text-slate-400">{doc.size}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded border ${st.bg} ${st.color} ${st.border}`}>
                        <StIcon size={9} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors">
                          <Download size={10} /> DL
                        </button>
                        {doc.status === "pending" && (
                          <button className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 transition-colors">
                            Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[11px] text-slate-400">
                    No documents found
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
