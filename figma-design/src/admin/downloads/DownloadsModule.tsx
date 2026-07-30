import { useState } from "react";
import {
  FileText, Building2, Layout, BookOpen, CheckSquare, Link,
  Search, Download, Upload, ExternalLink, Star, X, Filter,
} from "lucide-react";
import {
  DOCUMENTS, CATEGORY_META, FILE_TYPE_COLOR,
  DownloadDoc, DocCategory, DocFileType,
} from "./data";

const TABS: { key: DocCategory; icon: React.ElementType }[] = [
  { key:"visa_forms",    icon:FileText    },
  { key:"embassy_forms", icon:Building2   },
  { key:"templates",     icon:Layout      },
  { key:"guidelines",    icon:BookOpen    },
  { key:"checklists",    icon:CheckSquare },
  { key:"links",         icon:Link        },
];

const FILE_ICON_LABEL: Record<DocFileType, string> = {
  pdf: "PDF", docx: "DOCX", xlsx: "XLSX", jpg: "JPG", url: "LINK",
};

function Pill({ cls, label }: { cls: string; label: string }) {
  return <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function DocCard({ doc, onClick }: { doc: DownloadDoc; onClick: () => void }) {
  return (
    <div onClick={onClick}
      className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 cursor-pointer hover:border-slate-600 hover:bg-slate-800/80 transition-all group">
      <div className="flex items-start gap-3 mb-3">
        <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-bold ${FILE_TYPE_COLOR[doc.fileType]}`}>
          {FILE_ICON_LABEL[doc.fileType]}
        </div>
        {doc.featured && <Star size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />}
        {doc.country && (
          <span className="text-xs bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded ml-auto">{doc.country}</span>
        )}
      </div>
      <p className="text-sm font-medium text-slate-200 leading-snug mb-1 group-hover:text-amber-400 transition-colors">{doc.title}</p>
      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{doc.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {doc.tags.slice(0,2).map(t => (
            <span key={t} className="text-xs bg-slate-700/50 text-slate-500 px-1.5 py-0.5 rounded">#{t}</span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {doc.fileSize && <span>{doc.fileSize}</span>}
          {doc.downloads > 0 && <span className="flex items-center gap-0.5"><Download size={10} />{doc.downloads.toLocaleString()}</span>}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-700 flex gap-2">
        {doc.fileType === "url" ? (
          <a href={doc.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs">
            <ExternalLink size={11} /> Open Link
          </a>
        ) : (
          <button onClick={e => { e.stopPropagation(); }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">
            <Download size={11} /> Download
          </button>
        )}
        <button onClick={e => { e.stopPropagation(); }}
          className="py-1.5 px-2.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded text-xs">
          <Filter size={11} />
        </button>
      </div>
    </div>
  );
}

export default function DownloadsModule() {
  const [category, setCategory] = useState<DocCategory>("visa_forms");
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [selected, setSelected] = useState<DownloadDoc | null>(null);

  const catDocs = DOCUMENTS.filter(d => d.category === category);
  const countries = [...new Set(catDocs.filter(d => d.country).map(d => d.country!))];

  const filtered = catDocs.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || d.tags.some(t => t.includes(q));
    const matchLang    = langFilter    === "all" || d.language === langFilter;
    const matchCountry = countryFilter === "all" || d.country  === countryFilter;
    return matchSearch && matchLang && matchCountry;
  });

  const meta = CATEGORY_META[category];

  const totalDownloads = DOCUMENTS.reduce((s, d) => s + d.downloads, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-slate-700/60">
        <h1 className="text-lg font-bold text-slate-100">Download Centre</h1>
        <p className="text-xs text-slate-500 mt-0.5">Visa forms, embassy guides, templates, checklists and official links</p>
      </div>

      {/* stats bar */}
      <div className="flex-shrink-0 flex gap-6 px-6 py-3 border-b border-slate-700/60 bg-slate-800/30">
        {[
          { label:"Total Documents", value: DOCUMENTS.filter(d=>d.fileType!=="url").length, color:"text-slate-200" },
          { label:"Total Links",     value: DOCUMENTS.filter(d=>d.fileType==="url").length, color:"text-purple-400" },
          { label:"All-Time Downloads", value: totalDownloads.toLocaleString(),              color:"text-amber-400" },
          { label:"Featured Items",  value: DOCUMENTS.filter(d=>d.featured).length,          color:"text-yellow-400" },
        ].map(k => (
          <div key={k.label}>
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`text-base font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
        <div className="ml-auto">
          <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1.5 rounded-lg font-medium"><Upload size={12} /> Upload Document</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* category sidebar */}
        <div className="w-52 flex-shrink-0 border-r border-slate-700/60 p-4 space-y-1 overflow-y-auto">
          {TABS.map(({ key, icon: Icon }) => {
            const m = CATEGORY_META[key];
            const count = DOCUMENTS.filter(d => d.category === key).length;
            return (
              <button key={key} onClick={() => { setCategory(key); setSearch(""); setCountryFilter("all"); setSelected(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${category === key ? "bg-amber-500/15 border border-amber-500/30" : "hover:bg-slate-700/40"}`}>
                <Icon size={15} className={category === key ? "text-amber-400" : "text-slate-500"} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${category === key ? "text-amber-400" : "text-slate-300"}`}>{m.label}</p>
                </div>
                <span className={`text-xs font-mono ${category === key ? "text-amber-500" : "text-slate-600"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* main content */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* header */}
          <div>
            <h2 className={`text-base font-semibold ${meta.color}`}>{meta.label}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
          </div>

          {/* search + filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${meta.label.toLowerCase()}…`}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500" />
            </div>
            {countries.length > 0 && (
              <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none">
                <option value="all">All Countries</option>
                {countries.map(c => <option key={c}>{c}</option>)}
              </select>
            )}
            <select value={langFilter} onChange={e => setLangFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none">
              <option value="all">All Languages</option>
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
            <span className="text-xs text-slate-500 ml-auto">{filtered.length} items</span>
          </div>

          {/* featured strip */}
          {filtered.some(d => d.featured) && !search && (
            <div>
              <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1"><Star size={11} /> Featured</p>
              <div className="grid grid-cols-3 gap-3">
                {filtered.filter(d => d.featured).map(doc => (
                  <DocCard key={doc.id} doc={doc} onClick={() => setSelected(doc)} />
                ))}
              </div>
            </div>
          )}

          {/* all items */}
          {(search || !filtered.some(d => d.featured)) ? (
            <div className="grid grid-cols-3 gap-3">
              {filtered.map(doc => (
                <DocCard key={doc.id} doc={doc} onClick={() => setSelected(doc)} />
              ))}
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">All {meta.label}</p>
              <div className="grid grid-cols-3 gap-3">
                {filtered.filter(d => !d.featured).map(doc => (
                  <DocCard key={doc.id} doc={doc} onClick={() => setSelected(doc)} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-40 bg-slate-800/40 border border-slate-700 rounded-xl">
              <p className="text-slate-500 text-sm">No documents found for your search.</p>
            </div>
          )}
        </div>

        {/* detail drawer */}
        {selected && (
          <div className="w-72 flex-shrink-0 border-l border-slate-700 bg-slate-800/60 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <Pill cls={FILE_TYPE_COLOR[selected.fileType]} label={FILE_ICON_LABEL[selected.fileType]} />
              <button onClick={() => setSelected(null)}><X size={13} className="text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {selected.featured && (
                <div className="flex items-center gap-1 text-amber-400"><Star size={11} /> Featured</div>
              )}
              <p className="font-semibold text-slate-200 leading-snug">{selected.title}</p>
              <p className="text-slate-400 leading-relaxed">{selected.description}</p>
              {[
                { l:"Language",  v: selected.language.toUpperCase() },
                { l:"Country",   v: selected.country ?? "—"         },
                { l:"Service",   v: selected.service ?? "—"         },
                { l:"File Size", v: selected.fileSize ?? "—"        },
                { l:"Uploaded",  v: selected.uploadedAt             },
                { l:"Updated",   v: selected.updatedAt              },
                { l:"Downloads", v: selected.downloads.toLocaleString() },
              ].map(r => (
                <div key={r.l} className="flex justify-between">
                  <span className="text-slate-500">{r.l}</span>
                  <span className="text-slate-200">{r.v}</span>
                </div>
              ))}
              {selected.url && (
                <div className="bg-slate-700/40 rounded p-2">
                  <p className="text-slate-500 mb-0.5">URL</p>
                  <a href={selected.url} target="_blank" rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 break-all text-xs">{selected.url}</a>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {selected.tags.map(t => (
                  <span key={t} className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">#{t}</span>
                ))}
              </div>
            </div>
            <div className="p-3 border-t border-slate-700 space-y-2">
              {selected.fileType === "url" ? (
                <a href={selected.url} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">
                  <ExternalLink size={11} /> Open Official Link
                </a>
              ) : (
                <button className="w-full flex items-center justify-center gap-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">
                  <Download size={11} /> Download {FILE_ICON_LABEL[selected.fileType]}
                </button>
              )}
              <div className="flex gap-2">
                <button className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs">Edit Details</button>
                <button className="flex-1 py-1.5 bg-red-600/60 hover:bg-red-600 text-white rounded text-xs">Remove</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
