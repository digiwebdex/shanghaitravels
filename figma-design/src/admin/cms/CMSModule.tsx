import { useState } from "react";
import {
  FileText, Menu, BookOpen, Image, Layers, Bell, Box, Search as SearchIcon,
  Plus, X, ChevronRight, Eye, Edit3, Globe, ExternalLink, ToggleLeft, ToggleRight,
  Upload, GripVertical, CheckCircle2, Clock, Archive,
} from "lucide-react";
import {
  CMS_PAGES, CMS_MENUS, BLOG_POSTS, GALLERY_IMAGES, SLIDERS, POPUPS,
  CONTENT_BLOCKS, SEO_RECORDS,
  CmsPage, BlogPost, CmsMenu, MenuItem, Slider, Popup, ContentBlock, SeoRecord,
} from "./data";

type CMSTab = "pages" | "menus" | "blog" | "gallery" | "sliders" | "popups" | "blocks" | "seo";

const TABS: { key: CMSTab; label: string; icon: React.ElementType }[] = [
  { key:"pages",   label:"Pages",          icon:FileText  },
  { key:"menus",   label:"Menu Manager",   icon:Menu      },
  { key:"blog",    label:"Blog",           icon:BookOpen  },
  { key:"gallery", label:"Gallery",        icon:Image     },
  { key:"sliders", label:"Sliders",        icon:Layers    },
  { key:"popups",  label:"Popups/Banners", icon:Bell      },
  { key:"blocks",  label:"Content Blocks", icon:Box       },
  { key:"seo",     label:"SEO",            icon:Globe     },
];

const PAGE_STATUS: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-400",
  draft:     "bg-amber-500/15 text-amber-400",
  archived:  "bg-slate-500/15 text-slate-400",
};
const POST_STATUS: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-400",
  draft:     "bg-amber-500/15 text-amber-400",
  scheduled: "bg-blue-500/15 text-blue-400",
};

function Pill({ cls, label }: { cls: string; label: string }) {
  return <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

// ── Pages Tab ─────────────────────────────────────────────────────────────────
function PagesTab() {
  const [selected, setSelected] = useState<CmsPage | null>(null);
  const [editContent, setEditContent] = useState(false);

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input placeholder="Search pages…" className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500" />
          </div>
          <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-2 rounded-lg font-medium">
            <Plus size={13} /> New Page
          </button>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {["Title","Slug","Template","Status","Views","Last Updated"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">{h}</th>
                ))}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {CMS_PAGES.map(page => (
                <tr key={page.id} onClick={() => { setSelected(page); setEditContent(false); }}
                  className={`border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30 ${selected?.id === page.id ? "bg-slate-700/40" : ""}`}>
                  <td className="px-4 py-3 text-xs font-medium text-slate-200">{page.title}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-400">{page.slug}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{page.template}</td>
                  <td className="px-4 py-3"><Pill cls={PAGE_STATUS[page.status]} label={page.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-300">{page.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{page.updatedAt}</td>
                  <td className="px-4 py-3"><ChevronRight size={13} className="text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-80 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-200">{selected.title}</span>
            <button onClick={() => setSelected(null)}><X size={13} className="text-slate-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            <div className="flex gap-2">
              <Pill cls={PAGE_STATUS[selected.status]} label={selected.status} />
              <span className="text-slate-500 font-mono">{selected.slug}</span>
            </div>
            {[
              { l:"Template",  v: selected.template },
              { l:"Author",    v: selected.author    },
              { l:"Updated",   v: selected.updatedAt },
              { l:"Views",     v: selected.views.toLocaleString() },
            ].map(r => (
              <div key={r.l} className="flex justify-between">
                <span className="text-slate-500">{r.l}</span>
                <span className="text-slate-200">{r.v}</span>
              </div>
            ))}
            {selected.metaTitle && (
              <div className="bg-slate-700/30 rounded p-2">
                <p className="text-slate-500 mb-0.5">Meta Title</p>
                <p className="text-slate-300 leading-snug">{selected.metaTitle}</p>
              </div>
            )}
            {selected.metaDescription && (
              <div className="bg-slate-700/30 rounded p-2">
                <p className="text-slate-500 mb-0.5">Meta Description</p>
                <p className="text-slate-400 leading-snug">{selected.metaDescription}</p>
              </div>
            )}
            <div className="bg-slate-700/30 rounded p-2">
              <p className="text-slate-500 mb-1">Content Preview</p>
              <div className="text-slate-400 text-xs" dangerouslySetInnerHTML={{ __html: selected.content }} />
            </div>
          </div>
          <div className="p-3 border-t border-slate-700 flex gap-2">
            <button onClick={() => setEditContent(true)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium"><Edit3 size={11} /> Edit</button>
            <button className="flex items-center gap-1 py-1.5 px-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs"><Eye size={11} /> Preview</button>
            <button className="flex items-center gap-1 py-1.5 px-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs"><ExternalLink size={11} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Menu Manager Tab ──────────────────────────────────────────────────────────
function MenusTab() {
  const [selectedMenu, setSelectedMenu] = useState<CmsMenu>(CMS_MENUS[0]);
  const [items, setItems] = useState<MenuItem[]>(CMS_MENUS[0].items);

  const selectMenu = (m: CmsMenu) => { setSelectedMenu(m); setItems(m.items); };
  const removeItem = (id: string) => setItems(ii => ii.filter(i => i.id !== id));

  const topLevel = items.filter(i => !i.parentId);
  const children = (parentId: string) => items.filter(i => i.parentId === parentId);

  return (
    <div className="flex gap-4 h-full">
      {/* menu list */}
      <div className="w-48 flex-shrink-0 space-y-2">
        <p className="text-xs font-semibold text-slate-400 px-1 mb-2">Menus</p>
        {CMS_MENUS.map(m => (
          <button key={m.id} onClick={() => selectMenu(m)}
            className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedMenu.id === m.id ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-800/60 hover:border-slate-600"}`}>
            <p className="text-xs font-medium text-slate-200">{m.name}</p>
            <p className="text-xs text-slate-500 capitalize">{m.location} · {m.itemCount} items</p>
          </button>
        ))}
        <button className="w-full flex items-center justify-center gap-1 p-2.5 border border-dashed border-slate-600 rounded-xl text-xs text-slate-500 hover:border-amber-500/50">
          <Plus size={12} /> New Menu
        </button>
      </div>

      {/* tree editor */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">{selectedMenu.name} <span className="text-xs text-slate-500 font-normal capitalize">— {selectedMenu.location}</span></p>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1.5 rounded"><Plus size={11} /> Add Item</button>
            <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-2.5 py-1.5 rounded font-medium">Save Menu</button>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2">
          {topLevel.map(item => (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center gap-2 p-2.5 bg-slate-700/40 rounded-lg group">
                <GripVertical size={13} className="text-slate-600 cursor-grab" />
                <span className="flex-1 text-sm font-medium text-slate-200">{item.label}</span>
                <span className="text-xs font-mono text-slate-500">{item.url}</span>
                <span className="text-xs text-slate-600">{item.target}</span>
                <button className="opacity-0 group-hover:opacity-100 text-xs text-amber-400">Edit</button>
                <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100"><X size={12} className="text-red-400" /></button>
              </div>
              {/* children */}
              {children(item.id).map(child => (
                <div key={child.id} className="ml-6 flex items-center gap-2 p-2.5 bg-slate-700/20 rounded-lg group border-l-2 border-slate-600">
                  <GripVertical size={13} className="text-slate-600 cursor-grab" />
                  <span className="flex-1 text-xs text-slate-300">{child.label}</span>
                  <span className="text-xs font-mono text-slate-500">{child.url}</span>
                  <button className="opacity-0 group-hover:opacity-100 text-xs text-amber-400">Edit</button>
                  <button onClick={() => removeItem(child.id)} className="opacity-0 group-hover:opacity-100"><X size={12} className="text-red-400" /></button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Blog Tab ──────────────────────────────────────────────────────────────────
function BlogTab() {
  const [selected, setSelected] = useState<BlogPost | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState("");

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input placeholder="Search posts…" className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500" />
          </div>
          <select className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none">
            <option>All Categories</option>
            {[...new Set(BLOG_POSTS.map(b => b.category))].map(c => <option key={c}>{c}</option>)}
          </select>
          <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-2 rounded-lg font-medium">
            <Plus size={13} /> New Post
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Published", value: BLOG_POSTS.filter(b=>b.status==="published").length, color:"text-emerald-400" },
            { label:"Draft",     value: BLOG_POSTS.filter(b=>b.status==="draft").length,     color:"text-amber-400"  },
            { label:"Scheduled", value: BLOG_POSTS.filter(b=>b.status==="scheduled").length, color:"text-blue-400"   },
          ].map(k => (
            <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {BLOG_POSTS.map(post => (
            <div key={post.id} onClick={() => { setSelected(post); setContent(post.content); setEditMode(false); }}
              className={`bg-slate-800/60 border rounded-xl p-4 cursor-pointer hover:border-slate-600 transition-colors ${selected?.id === post.id ? "border-amber-500/50" : "border-slate-700"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Pill cls={POST_STATUS[post.status]} label={post.status} />
                    <span className="text-xs text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">{post.category}</span>
                  </div>
                  <p className="font-medium text-slate-200 text-sm leading-snug">{post.title}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{post.excerpt}</p>
                </div>
                <div className="text-right text-xs flex-shrink-0">
                  <p className="text-slate-500">{post.publishedAt ?? post.scheduledAt ?? post.updatedAt}</p>
                  {post.views > 0 && <p className="text-slate-400">{post.views.toLocaleString()} views</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <span>By {post.author}</span>
                {post.tags.map(t => <span key={t} className="bg-slate-700/50 px-1.5 rounded">#{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="w-80 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <div className="flex gap-2">
              <button onClick={() => setEditMode(false)} className={`text-xs px-2 py-1 rounded ${!editMode ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:text-slate-200"}`}>Details</button>
              <button onClick={() => setEditMode(true)}  className={`text-xs px-2 py-1 rounded ${editMode ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:text-slate-200"}`}>Editor</button>
            </div>
            <button onClick={() => setSelected(null)}><X size={13} className="text-slate-400" /></button>
          </div>
          {editMode ? (
            <div className="flex-1 flex flex-col p-3">
              <p className="text-xs text-slate-400 mb-2">HTML Content Editor</p>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={14}
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs font-mono text-slate-300 resize-none focus:outline-none focus:border-amber-500" />
              <button className="mt-2 w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">Save Post</button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <p className="font-medium text-slate-200 leading-snug">{selected.title}</p>
              <Pill cls={POST_STATUS[selected.status]} label={selected.status} />
              {[
                { l:"Category",  v: selected.category },
                { l:"Author",    v: selected.author   },
                { l:"Published", v: selected.publishedAt ?? selected.scheduledAt ?? "Not published" },
                { l:"Views",     v: selected.views.toLocaleString() },
              ].map(r => (
                <div key={r.l} className="flex justify-between">
                  <span className="text-slate-500">{r.l}</span>
                  <span className="text-slate-200">{r.v}</span>
                </div>
              ))}
              <div className="bg-slate-700/30 rounded p-2">
                <p className="text-slate-400 leading-relaxed">{selected.excerpt}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Gallery Tab ───────────────────────────────────────────────────────────────
function GalleryTab() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-64">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
          <input placeholder="Search images…" className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500" />
        </div>
        <select className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none">
          <option>All Categories</option>
          {[...new Set(GALLERY_IMAGES.map(g => g.category))].map(c => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-2 rounded-lg font-medium cursor-pointer ml-auto">
          <Upload size={13} /> Upload Images
          <input type="file" className="hidden" multiple accept="image/*" />
        </label>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {GALLERY_IMAGES.map(img => (
          <div key={img.id} onClick={() => setSelected(img.id === selected ? null : img.id)}
            className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${selected === img.id ? "border-amber-500" : "border-slate-700 hover:border-slate-600"}`}>
            <img src={img.url} alt={img.alt} className="w-full aspect-video object-cover" />
            <div className="p-2 bg-slate-800/90">
              <p className="text-xs font-medium text-slate-200 truncate">{img.filename}</p>
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-xs text-slate-500">{img.size}</span>
                <span className="text-xs text-slate-500 bg-slate-700/60 px-1.5 rounded">{img.category}</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">Used in: {img.usedIn.join(", ")}</p>
            </div>
            {selected === img.id && (
              <div className="absolute top-2 right-2 bg-amber-500 rounded-full p-0.5">
                <CheckCircle2 size={12} className="text-slate-900" />
              </div>
            )}
          </div>
        ))}
        {/* Upload placeholder */}
        <label className="border-2 border-dashed border-slate-600 rounded-xl aspect-video flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-500/50 transition-colors">
          <Upload size={24} className="text-slate-600" />
          <span className="text-xs text-slate-500">Drop to upload</span>
          <input type="file" className="hidden" multiple accept="image/*" />
        </label>
      </div>
    </div>
  );
}

// ── Sliders Tab ───────────────────────────────────────────────────────────────
function SlidersTab() {
  const [sel, setSel] = useState<Slider>(SLIDERS[0]);

  return (
    <div className="flex gap-4">
      <div className="w-52 flex-shrink-0 space-y-2">
        <p className="text-xs font-semibold text-slate-400 px-1 mb-2">Sliders</p>
        {SLIDERS.map(s => (
          <button key={s.id} onClick={() => setSel(s)}
            className={`w-full text-left p-3 rounded-xl border transition-colors ${sel.id === s.id ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-800/60 hover:border-slate-600"}`}>
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-slate-200 flex-1">{s.name}</p>
              {s.active ? <CheckCircle2 size={11} className="text-emerald-400" /> : <Clock size={11} className="text-slate-600" />}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{s.location} · {s.slideCount} slides</p>
          </button>
        ))}
        <button className="w-full flex items-center justify-center gap-1 p-2.5 border border-dashed border-slate-600 rounded-xl text-xs text-slate-500 hover:border-amber-500/50">
          <Plus size={12} /> New Slider
        </button>
      </div>

      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-200">{sel.name}</p>
            <p className="text-xs text-slate-500">{sel.location} · Autoplay: {sel.autoplay ? `${sel.interval/1000}s` : "Off"}</p>
          </div>
          <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1.5 rounded font-medium"><Plus size={11} /> Add Slide</button>
        </div>

        <div className="space-y-3">
          {sel.slides.map((slide, i) => (
            <div key={slide.id} className={`bg-slate-800/60 border rounded-xl overflow-hidden ${slide.active ? "border-slate-700" : "border-slate-700/40 opacity-60"}`}>
              <div className="flex gap-4 p-4">
                <img src={slide.imageUrl} alt={slide.title} className="w-40 h-24 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500 font-medium">Slide {slide.order}</span>
                    {slide.active
                      ? <Pill cls="bg-emerald-500/15 text-emerald-400" label="Active" />
                      : <Pill cls="bg-slate-500/15 text-slate-400" label="Inactive" />}
                  </div>
                  <p className="font-semibold text-slate-200">{slide.title}</p>
                  {slide.subtitle && <p className="text-xs text-slate-400 mt-0.5">{slide.subtitle}</p>}
                  {slide.ctaText && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{slide.ctaText}</span>
                      <span className="text-xs font-mono text-slate-500">{slide.ctaUrl}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 bg-slate-700/40 rounded">Edit</button>
                  <button className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-700/40 rounded">{slide.active ? "Disable" : "Enable"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Popups / Banners Tab ──────────────────────────────────────────────────────
function PopupsTab() {
  const [selected, setSelected] = useState<Popup | null>(null);
  const TYPE_LABEL: Record<string, string> = { modal:"Modal", banner_top:"Top Banner", banner_bottom:"Bottom Banner", slide_in:"Slide-In" };

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-3">
        <div className="flex justify-end">
          <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1.5 rounded font-medium"><Plus size={12} /> New Popup</button>
        </div>
        <div className="space-y-3">
          {POPUPS.map(popup => (
            <div key={popup.id} onClick={() => setSelected(popup)}
              className={`bg-slate-800/60 border rounded-xl p-4 cursor-pointer hover:border-slate-600 transition-colors ${selected?.id === popup.id ? "border-amber-500/50" : "border-slate-700"}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-slate-200 text-sm">{popup.name}</p>
                    <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{TYPE_LABEL[popup.type]}</span>
                    {popup.active
                      ? <Pill cls="bg-emerald-500/15 text-emerald-400" label="Active" />
                      : <Pill cls="bg-slate-500/15 text-slate-400" label="Inactive" />}
                  </div>
                  <p className="text-xs text-slate-400">{popup.content.slice(0, 80)}…</p>
                </div>
                <div className="text-right text-xs flex-shrink-0 space-y-1">
                  <p className="text-slate-400">{popup.impressions.toLocaleString()} impressions</p>
                  <p className="text-slate-400">{popup.clicks.toLocaleString()} clicks</p>
                  {popup.impressions > 0 && (
                    <p className="text-amber-400">{((popup.clicks/popup.impressions)*100).toFixed(1)}% CTR</p>
                  )}
                </div>
              </div>
              {(popup.startDate || popup.endDate) && (
                <p className="text-xs text-slate-500 mt-2">{popup.startDate} – {popup.endDate}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="w-72 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-200">{selected.name}</span>
            <button onClick={() => setSelected(null)}><X size={13} className="text-slate-400" /></button>
          </div>
          <div className="p-4 flex-1 space-y-3 text-xs">
            <div className="flex gap-2">
              <Pill cls={selected.active ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"} label={selected.active ? "Active" : "Inactive"} />
              <span className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-xs">{TYPE_LABEL[selected.type]}</span>
            </div>
            <div className="bg-slate-700/30 rounded p-2">
              <p className="font-semibold text-slate-200 mb-0.5">{selected.title}</p>
              <p className="text-slate-400">{selected.content}</p>
              {selected.ctaText && <p className="text-amber-400 mt-1">{selected.ctaText} → {selected.ctaUrl}</p>}
            </div>
            {[
              { l:"Trigger Delay", v: `${selected.triggerDelay}s` },
              { l:"Show On",       v: selected.showOnPages.join(", ") },
              { l:"Start Date",    v: selected.startDate ?? "—" },
              { l:"End Date",      v: selected.endDate ?? "—" },
              { l:"Impressions",   v: selected.impressions.toLocaleString() },
              { l:"Clicks",        v: selected.clicks.toLocaleString() },
            ].map(r => (
              <div key={r.l} className="flex justify-between">
                <span className="text-slate-500">{r.l}</span>
                <span className="text-slate-200">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-700 flex gap-2">
            <button className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">Edit</button>
            <button className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs">{selected.active ? "Disable" : "Enable"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Content Blocks Tab ────────────────────────────────────────────────────────
function BlocksTab() {
  const [selected, setSelected] = useState<ContentBlock | null>(null);
  const [editBody, setEditBody] = useState("");
  const ZONE_COLOR: Record<string, string> = {
    header:"bg-blue-500/15 text-blue-400", footer:"bg-slate-500/15 text-slate-300",
    home:"bg-amber-500/15 text-amber-400", about:"bg-green-500/15 text-green-400",
    sidebar:"bg-purple-500/15 text-purple-400", checkout:"bg-rose-500/15 text-rose-400",
  };

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-3">
        <div className="flex justify-end">
          <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1.5 rounded font-medium"><Plus size={12} /> New Block</button>
        </div>
        <div className="space-y-2">
          {CONTENT_BLOCKS.map(block => (
            <div key={block.id} onClick={() => { setSelected(block); setEditBody(block.content); }}
              className={`bg-slate-800/60 border rounded-xl p-4 cursor-pointer hover:border-slate-600 transition-colors ${selected?.id === block.id ? "border-amber-500/50" : "border-slate-700"}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-slate-200 text-sm">{block.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${ZONE_COLOR[block.zone]}`}>{block.zone}</span>
                    {block.active ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Clock size={12} className="text-slate-600" />}
                  </div>
                  <p className="text-xs text-slate-400">{block.description}</p>
                  <code className="text-xs text-slate-500 mt-1 block truncate">{block.content.slice(0, 80)}…</code>
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0">{block.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="w-80 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-200">{selected.name}</span>
            <button onClick={() => setSelected(null)}><X size={13} className="text-slate-400" /></button>
          </div>
          <div className="p-4 flex-1 flex flex-col space-y-3 text-xs">
            <p className="text-xs text-slate-400">HTML Content</p>
            <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={12}
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs font-mono text-slate-300 resize-none focus:outline-none focus:border-amber-500" />
            <div className="bg-slate-700/30 rounded p-2">
              <p className="text-slate-500 mb-1">Preview</p>
              <div className="text-slate-400" dangerouslySetInnerHTML={{ __html: editBody }} />
            </div>
          </div>
          <div className="p-3 border-t border-slate-700 flex gap-2">
            <button className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">Save Block</button>
            <button className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs">{selected.active ? "Deactivate" : "Activate"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SEO Tab ───────────────────────────────────────────────────────────────────
function SEOTab() {
  const [selected, setSelected] = useState<SeoRecord | null>(null);

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-3">
        <p className="text-xs text-slate-400">Click a page to edit its SEO metadata, Open Graph settings, and sitemap configuration.</p>
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/60">
                {["Page","Slug","Meta Title","No-Index","Sitemap Priority"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-medium">{h}</th>
                ))}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {SEO_RECORDS.map(rec => (
                <tr key={rec.id} onClick={() => setSelected(rec)}
                  className={`border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30 ${selected?.id === rec.id ? "bg-slate-700/40" : ""}`}>
                  <td className="px-4 py-3 font-medium text-slate-200">{rec.pageTitle}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{rec.slug}</td>
                  <td className="px-4 py-3 text-slate-300 max-w-48 truncate">{rec.metaTitle}</td>
                  <td className="px-4 py-3 text-center">{rec.noIndex ? <span className="text-amber-400">Yes</span> : <span className="text-slate-600">No</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-bold ${rec.sitemapPriority === "1.0" ? "text-emerald-400" : rec.sitemapPriority === "0.1" ? "text-slate-600" : "text-slate-300"}`}>{rec.sitemapPriority}</span>
                  </td>
                  <td className="px-4 py-3"><ChevronRight size={12} className="text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-80 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-200">SEO — {selected.pageTitle}</span>
            <button onClick={() => setSelected(null)}><X size={13} className="text-slate-400" /></button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
            {[
              { l:"Meta Title",       v: selected.metaTitle,       field:"metaTitle"       },
              { l:"Meta Description", v: selected.metaDescription, field:"metaDesc"        },
              { l:"OG Title",         v: selected.ogTitle,         field:"ogTitle"         },
              { l:"OG Description",   v: selected.ogDescription,   field:"ogDesc"          },
              { l:"Canonical URL",    v: selected.canonical ?? "",  field:"canonical"       },
            ].map(f => (
              <div key={f.l}>
                <p className="text-slate-500 mb-1">{f.l}</p>
                <textarea defaultValue={f.v} rows={f.l.includes("Description") ? 3 : 2}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-slate-200 text-xs resize-none focus:outline-none focus:border-amber-500" />
                {f.l.includes("Meta Title") && (
                  <p className={`text-xs mt-0.5 ${f.v.length > 60 ? "text-red-400" : "text-slate-500"}`}>{f.v.length}/60</p>
                )}
                {f.l.includes("Meta Description") && (
                  <p className={`text-xs mt-0.5 ${f.v.length > 160 ? "text-red-400" : "text-slate-500"}`}>{f.v.length}/160</p>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">No-Index</span>
              <button className="flex items-center gap-1 text-xs">
                {selected.noIndex ? <ToggleRight size={20} className="text-amber-400" /> : <ToggleLeft size={20} className="text-slate-600" />}
                <span className={selected.noIndex ? "text-amber-400" : "text-slate-500"}>{selected.noIndex ? "Yes" : "No"}</span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Sitemap Priority</span>
              <select defaultValue={selected.sitemapPriority} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none">
                {["0.1","0.5","0.8","1.0"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="p-3 border-t border-slate-700">
            <button className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">Save SEO Settings</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CMSModule() {
  const [tab, setTab] = useState<CMSTab>("pages");

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-slate-700/60">
        <h1 className="text-lg font-bold text-slate-100">CMS &amp; Website Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage pages, menus, blog, media, and SEO settings</p>
      </div>
      <div className="flex-shrink-0 flex gap-0.5 px-6 pt-3 border-b border-slate-700/60 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors rounded-t border-b-2 ${tab === t.key ? "text-amber-400 border-amber-400" : "text-slate-400 border-transparent hover:text-slate-200"}`}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-6">
        {tab === "pages"   && <PagesTab />}
        {tab === "menus"   && <MenusTab />}
        {tab === "blog"    && <BlogTab />}
        {tab === "gallery" && <GalleryTab />}
        {tab === "sliders" && <SlidersTab />}
        {tab === "popups"  && <PopupsTab />}
        {tab === "blocks"  && <BlocksTab />}
        {tab === "seo"     && <SEOTab />}
      </div>
    </div>
  );
}
